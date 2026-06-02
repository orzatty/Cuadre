// ============================================
// Transaction Routes — CRUD + Summary
// ============================================

import { Hono } from 'hono';
import type {
  Env,
  AuthVariables,
  ApiResponse,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  Transaction,
  PaginatedResponse,
  TransactionSummary,
  CategorySummary,
} from '../types';
import { authMiddleware } from '../middleware/auth';

const transactions = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// Apply auth to all routes
transactions.use('*', authMiddleware);

// ---- GET /transactions ----
transactions.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const page = Math.max(1, parseInt(c.req.query('page') || '1'));
    const perPage = Math.min(100, Math.max(1, parseInt(c.req.query('per_page') || '20')));
    const offset = (page - 1) * perPage;

    // Filter params
    const type = c.req.query('type'); // income, expense, transfer
    const currency = c.req.query('currency');
    const categoryId = c.req.query('category_id');
    const dateFrom = c.req.query('date_from');
    const dateTo = c.req.query('date_to');
    const search = c.req.query('search');

    // Build query
    let whereClause = 'WHERE t.user_id = ? AND t.deleted = 0';
    const params: unknown[] = [userId];

    if (type && ['income', 'expense', 'transfer'].includes(type)) {
      whereClause += ' AND t.type = ?';
      params.push(type);
    }

    if (currency && ['VES', 'USD', 'USDT', 'EUR'].includes(currency)) {
      whereClause += ' AND t.currency = ?';
      params.push(currency);
    }

    if (categoryId) {
      whereClause += ' AND t.category_id = ?';
      params.push(categoryId);
    }

    if (dateFrom) {
      whereClause += ' AND t.date >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND t.date <= ?';
      params.push(dateTo);
    }

    if (search) {
      whereClause += ' AND (t.description LIKE ? OR t.notes LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // Get total count
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM transactions t ${whereClause}`
    )
      .bind(...params)
      .first<{ total: number }>();

    const total = countResult?.total || 0;

    // Get paginated results
    const queryParams = [...params, perPage, offset];
    const results = await c.env.DB.prepare(
      `SELECT 
         t.id, t.type, t.amount, t.currency, t.category_id, 
         t.description, t.date, t.source, t.reference, t.notes,
         t.created_at, t.updated_at,
         c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       ${whereClause}
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...queryParams)
      .all();

    return c.json<ApiResponse<PaginatedResponse<Record<string, unknown>>>>({
      success: true,
      data: {
        items: results.results || [],
        total,
        page,
        per_page: perPage,
        has_more: offset + perPage < total,
      },
    });
  } catch (error) {
    console.error('List transactions error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error al listar transacciones' },
      500
    );
  }
});

// ---- POST /transactions ----
transactions.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json<CreateTransactionRequest>();

    // Validate
    if (!body.type || !['income', 'expense', 'transfer'].includes(body.type)) {
      return c.json<ApiResponse>(
        { success: false, error: 'Tipo de transacción inválido' },
        400
      );
    }

    if (!body.amount || body.amount <= 0) {
      return c.json<ApiResponse>(
        { success: false, error: 'El monto debe ser mayor a 0' },
        400
      );
    }

    if (body.currency && !['VES', 'USD', 'USDT', 'EUR'].includes(body.currency)) {
      return c.json<ApiResponse>(
        { success: false, error: 'Moneda inválida' },
        400
      );
    }

    const id = crypto.randomUUID().replace(/-/g, '');
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      `INSERT INTO transactions (id, user_id, type, amount, currency, category_id, description, date, source, reference, notes, synced, deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`
    )
      .bind(
        id,
        userId,
        body.type,
        body.amount,
        body.currency || 'VES',
        body.category_id || null,
        body.description || null,
        body.date || new Date().toISOString().split('T')[0],
        body.source || 'manual',
        body.reference || null,
        body.notes || null,
        now,
        now
      )
      .run();

    // Fetch the created transaction with category info
    const created = await c.env.DB.prepare(
      `SELECT 
         t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`
    )
      .bind(id)
      .first();

    return c.json<ApiResponse>(
      {
        success: true,
        data: created,
        message: 'Transacción registrada ✅',
      },
      201
    );
  } catch (error) {
    console.error('Create transaction error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error al crear la transacción' },
      500
    );
  }
});

// ---- PUT /transactions/:id ----
transactions.put('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const transactionId = c.req.param('id');
    const body = await c.req.json<UpdateTransactionRequest>();

    // Verify ownership
    const existing = await c.env.DB.prepare(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ? AND deleted = 0'
    )
      .bind(transactionId, userId)
      .first();

    if (!existing) {
      return c.json<ApiResponse>(
        { success: false, error: 'Transacción no encontrada' },
        404
      );
    }

    // Build dynamic update
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (body.type !== undefined) {
      if (!['income', 'expense', 'transfer'].includes(body.type)) {
        return c.json<ApiResponse>(
          { success: false, error: 'Tipo de transacción inválido' },
          400
        );
      }
      setClauses.push('type = ?');
      values.push(body.type);
    }

    if (body.amount !== undefined) {
      if (body.amount <= 0) {
        return c.json<ApiResponse>(
          { success: false, error: 'El monto debe ser mayor a 0' },
          400
        );
      }
      setClauses.push('amount = ?');
      values.push(body.amount);
    }

    if (body.currency !== undefined) {
      if (!['VES', 'USD', 'USDT', 'EUR'].includes(body.currency)) {
        return c.json<ApiResponse>(
          { success: false, error: 'Moneda inválida' },
          400
        );
      }
      setClauses.push('currency = ?');
      values.push(body.currency);
    }

    if (body.category_id !== undefined) {
      setClauses.push('category_id = ?');
      values.push(body.category_id);
    }

    if (body.description !== undefined) {
      setClauses.push('description = ?');
      values.push(body.description);
    }

    if (body.date !== undefined) {
      setClauses.push('date = ?');
      values.push(body.date);
    }

    if (body.source !== undefined) {
      setClauses.push('source = ?');
      values.push(body.source);
    }

    if (body.reference !== undefined) {
      setClauses.push('reference = ?');
      values.push(body.reference);
    }

    if (body.notes !== undefined) {
      setClauses.push('notes = ?');
      values.push(body.notes);
    }

    if (setClauses.length === 0) {
      return c.json<ApiResponse>(
        { success: false, error: 'No hay campos para actualizar' },
        400
      );
    }

    setClauses.push(`updated_at = datetime('now')`);
    values.push(transactionId, userId);

    await c.env.DB.prepare(
      `UPDATE transactions SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`
    )
      .bind(...values)
      .run();

    // Fetch updated
    const updated = await c.env.DB.prepare(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`
    )
      .bind(transactionId)
      .first();

    return c.json<ApiResponse>({
      success: true,
      data: updated,
      message: 'Transacción actualizada ✅',
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error al actualizar la transacción' },
      500
    );
  }
});

// ---- DELETE /transactions/:id ----
transactions.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const transactionId = c.req.param('id');

    // Soft delete
    const result = await c.env.DB.prepare(
      `UPDATE transactions SET deleted = 1, updated_at = datetime('now') 
       WHERE id = ? AND user_id = ? AND deleted = 0`
    )
      .bind(transactionId, userId)
      .run();

    if (!result.meta.changes || result.meta.changes === 0) {
      return c.json<ApiResponse>(
        { success: false, error: 'Transacción no encontrada' },
        404
      );
    }

    return c.json<ApiResponse>({
      success: true,
      message: 'Transacción eliminada 🗑️',
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error al eliminar la transacción' },
      500
    );
  }
});

// ---- GET /transactions/summary ----
transactions.get('/summary', async (c) => {
  try {
    const userId = c.get('userId');
    const currency = c.req.query('currency') || 'VES';
    const period = c.req.query('period') || 'month'; // month, week, year, custom

    // Calculate date range
    const now = new Date();
    let dateFrom: string;

    switch (period) {
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFrom = weekAgo.toISOString().split('T')[0];
        break;
      }
      case 'year': {
        dateFrom = `${now.getFullYear()}-01-01`;
        break;
      }
      case 'custom': {
        dateFrom = c.req.query('date_from') || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      }
      case 'month':
      default: {
        dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      }
    }

    const dateTo = c.req.query('date_to') || now.toISOString().split('T')[0];

    // Get income total
    const incomeResult = await c.env.DB.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM transactions 
       WHERE user_id = ? AND type = 'income' AND deleted = 0 AND currency = ? AND date >= ? AND date <= ?`
    )
      .bind(userId, currency, dateFrom, dateTo)
      .first<{ total: number }>();

    // Get expense total
    const expenseResult = await c.env.DB.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM transactions 
       WHERE user_id = ? AND type = 'expense' AND deleted = 0 AND currency = ? AND date >= ? AND date <= ?`
    )
      .bind(userId, currency, dateFrom, dateTo)
      .first<{ total: number }>();

    // Get breakdown by category
    const categoryBreakdown = await c.env.DB.prepare(
      `SELECT 
         t.category_id,
         c.name as category_name,
         c.icon as category_icon,
         c.color as category_color,
         SUM(t.amount) as total,
         COUNT(*) as count
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.type = 'expense' AND t.deleted = 0 AND t.currency = ? AND t.date >= ? AND t.date <= ?
       GROUP BY t.category_id
       ORDER BY total DESC`
    )
      .bind(userId, currency, dateFrom, dateTo)
      .all();

    const totalIncome = incomeResult?.total || 0;
    const totalExpenses = expenseResult?.total || 0;

    const summary: TransactionSummary = {
      total_income: Math.round(totalIncome * 100) / 100,
      total_expenses: Math.round(totalExpenses * 100) / 100,
      net: Math.round((totalIncome - totalExpenses) * 100) / 100,
      currency: currency as any,
      by_category: (categoryBreakdown.results || []).map((row: Record<string, unknown>) => ({
        category_id: String(row.category_id || ''),
        category_name: String(row.category_name || 'Sin categoría'),
        category_icon: String(row.category_icon || '📦'),
        category_color: String(row.category_color || '#6B7280'),
        total: Math.round((Number(row.total) || 0) * 100) / 100,
        count: Number(row.count) || 0,
      })),
    };

    return c.json<ApiResponse<TransactionSummary>>({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Summary error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error al obtener el resumen' },
      500
    );
  }
});

export default transactions;
