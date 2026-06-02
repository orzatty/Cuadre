// ============================================
// Sylor S1 Routes — AI Chat & Actions
// ============================================

import { Hono } from 'hono';
import type {
  Env,
  AuthVariables,
  ApiResponse,
  SylorChatRequest,
  SylorChatResponse,
  SylorActionRequest,
  SylorMessage,
  CreateTransactionRequest,
  PaginatedResponse,
} from '../types';
import { authMiddleware } from '../middleware/auth';
import { chat, getRatesForContext, getSummaryForContext } from '../services/sylor-ai';

const sylor = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// Apply auth to all routes
sylor.use('*', authMiddleware);

// ---- POST /sylor/chat ----
sylor.post('/chat', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json<SylorChatRequest>();

    if (!body.message || body.message.trim().length === 0) {
      return c.json<ApiResponse>(
        { success: false, error: 'El mensaje no puede estar vacío' },
        400
      );
    }

    if (body.message.length > 2000) {
      return c.json<ApiResponse>(
        { success: false, error: 'El mensaje es demasiado largo (máximo 2000 caracteres)' },
        400
      );
    }

    // Build context
    const context: {
      rates?: Awaited<ReturnType<typeof getRatesForContext>>;
      summary?: Awaited<ReturnType<typeof getSummaryForContext>>;
    } = {};

    // Include rates if requested or by default
    if (body.context?.include_rates !== false) {
      context.rates = await getRatesForContext(c.env.RATES_CACHE);
    }

    // Include summary if requested
    if (body.context?.include_summary) {
      context.summary = await getSummaryForContext(c.env.DB, userId);
    }

    // Chat with Sylor
    const response = await chat(
      c.env.AI,
      c.env.DB,
      userId,
      body.message.trim(),
      context
    );

    return c.json<ApiResponse<SylorChatResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Sylor chat error:', error);
    return c.json<ApiResponse>(
      {
        success: false,
        error: 'Error al procesar tu mensaje. Intenta de nuevo.',
      },
      500
    );
  }
});

// ---- GET /sylor/history ----
sylor.get('/history', async (c) => {
  try {
    const userId = c.get('userId');
    const page = Math.max(1, parseInt(c.req.query('page') || '1'));
    const perPage = Math.min(50, Math.max(1, parseInt(c.req.query('per_page') || '20')));
    const offset = (page - 1) * perPage;

    // Get total count
    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM sylor_messages WHERE user_id = ?`
    )
      .bind(userId)
      .first<{ total: number }>();

    const total = countResult?.total || 0;

    // Get messages
    const results = await c.env.DB.prepare(
      `SELECT id, role, content, metadata, created_at
       FROM sylor_messages
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(userId, perPage, offset)
      .all<SylorMessage>();

    // Reverse so oldest is first (for chat display)
    const messages = (results.results || []).reverse();

    return c.json<ApiResponse<PaginatedResponse<SylorMessage>>>({
      success: true,
      data: {
        items: messages,
        total,
        page,
        per_page: perPage,
        has_more: offset + perPage < total,
      },
    });
  } catch (error) {
    console.error('Sylor history error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error al obtener el historial' },
      500
    );
  }
});

// ---- POST /sylor/action ----
// Execute an action that Sylor suggested (e.g., create a transaction)
sylor.post('/action', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json<SylorActionRequest>();

    if (body.action === 'create_transaction') {
      const txData = body.data;

      // Validate transaction data
      if (!txData.type || !['income', 'expense'].includes(txData.type)) {
        return c.json<ApiResponse>(
          { success: false, error: 'Tipo de transacción inválido' },
          400
        );
      }

      if (!txData.amount || txData.amount <= 0) {
        return c.json<ApiResponse>(
          { success: false, error: 'El monto debe ser mayor a 0' },
          400
        );
      }

      // Resolve category by name if provided as string
      let categoryId = txData.category_id || null;

      if (!categoryId && txData.description) {
        // Try to find a matching category by name
        const category = await c.env.DB.prepare(
          `SELECT id FROM categories 
           WHERE (user_id IS NULL OR user_id = ?) AND name LIKE ?
           LIMIT 1`
        )
          .bind(userId, `%${txData.description}%`)
          .first<{ id: string }>();

        if (category) {
          categoryId = category.id;
        }
      }

      const id = crypto.randomUUID().replace(/-/g, '');
      const now = new Date().toISOString();

      await c.env.DB.prepare(
        `INSERT INTO transactions (id, user_id, type, amount, currency, category_id, description, date, source, synced, deleted, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sylor', 1, 0, ?, ?)`
      )
        .bind(
          id,
          userId,
          txData.type,
          txData.amount,
          txData.currency || 'VES',
          categoryId,
          txData.description || null,
          txData.date || new Date().toISOString().split('T')[0],
          now,
          now
        )
        .run();

      // Fetch created transaction with category
      const created = await c.env.DB.prepare(
        `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.id = ?`
      )
        .bind(id)
        .first();

      // Save a system message noting the action
      await c.env.DB.prepare(
        `INSERT INTO sylor_messages (id, user_id, role, content, metadata, created_at)
         VALUES (lower(hex(randomblob(16))), ?, 'system', ?, ?, datetime('now'))`
      )
        .bind(
          userId,
          `Transacción registrada: ${txData.type} de ${txData.amount} ${txData.currency || 'VES'}`,
          JSON.stringify({ transaction_id: id })
        )
        .run();

      return c.json<ApiResponse>(
        {
          success: true,
          data: created,
          message: '¡Transacción registrada por Sylor! ✅',
        },
        201
      );
    }

    return c.json<ApiResponse>(
      { success: false, error: 'Acción no reconocida' },
      400
    );
  } catch (error) {
    console.error('Sylor action error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error al ejecutar la acción' },
      500
    );
  }
});

export default sylor;
