// ============================================
// Category Routes — CRUD
// ============================================

import { Hono } from 'hono';
import type { Env, AuthVariables, ApiResponse, CreateCategoryRequest, UpdateCategoryRequest, Category } from '../types';
import { authMiddleware } from '../middleware/auth';

const categories = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// Apply auth to all routes
categories.use('*', authMiddleware);

// ---- GET /categories ----
// Returns default categories + user's custom categories
categories.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const type = c.req.query('type'); // Optional filter: 'income' or 'expense'

    let query = `
      SELECT id, user_id, name, icon, color, is_default, type, created_at
      FROM categories
      WHERE (user_id IS NULL OR user_id = ?)
    `;
    const params: unknown[] = [userId];

    if (type && ['income', 'expense'].includes(type)) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY is_default DESC, name ASC';

    const results = await c.env.DB.prepare(query).bind(...params).all<Category>();

    return c.json<ApiResponse<Category[]>>({
      success: true,
      data: results.results || [],
    });
  } catch (error) {
    console.error('List categories error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error al listar categorías' },
      500
    );
  }
});

// ---- POST /categories ----
categories.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json<CreateCategoryRequest>();

    // Validate
    if (!body.name || body.name.trim().length < 1) {
      return c.json<ApiResponse>(
        { success: false, error: 'El nombre de la categoría es requerido' },
        400
      );
    }

    if (!body.type || !['income', 'expense'].includes(body.type)) {
      return c.json<ApiResponse>(
        { success: false, error: 'El tipo debe ser "income" o "expense"' },
        400
      );
    }

    // Check for duplicate names for this user
    const existing = await c.env.DB.prepare(
      `SELECT id FROM categories WHERE (user_id IS NULL OR user_id = ?) AND name = ? AND type = ?`
    )
      .bind(userId, body.name.trim(), body.type)
      .first();

    if (existing) {
      return c.json<ApiResponse>(
        { success: false, error: 'Ya existe una categoría con ese nombre' },
        409
      );
    }

    const id = crypto.randomUUID().replace(/-/g, '');

    await c.env.DB.prepare(
      `INSERT INTO categories (id, user_id, name, icon, color, is_default, type, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, datetime('now'))`
    )
      .bind(
        id,
        userId,
        body.name.trim(),
        body.icon || '📦',
        body.color || '#6B7280',
        body.type
      )
      .run();

    const created = await c.env.DB.prepare(
      'SELECT * FROM categories WHERE id = ?'
    )
      .bind(id)
      .first<Category>();

    return c.json<ApiResponse<Category>>(
      {
        success: true,
        data: created!,
        message: 'Categoría creada ✅',
      },
      201
    );
  } catch (error) {
    console.error('Create category error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error al crear la categoría' },
      500
    );
  }
});

// ---- PUT /categories/:id ----
categories.put('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const categoryId = c.req.param('id');
    const body = await c.req.json<UpdateCategoryRequest>();

    // Check ownership and that it's not a default category
    const existing = await c.env.DB.prepare(
      'SELECT id, is_default FROM categories WHERE id = ? AND user_id = ?'
    )
      .bind(categoryId, userId)
      .first<{ id: string; is_default: number }>();

    if (!existing) {
      return c.json<ApiResponse>(
        { success: false, error: 'Categoría no encontrada o no tienes permiso para editarla' },
        404
      );
    }

    if (existing.is_default === 1) {
      return c.json<ApiResponse>(
        { success: false, error: 'No puedes editar categorías predeterminadas' },
        403
      );
    }

    // Build update
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (body.name !== undefined) {
      if (body.name.trim().length < 1) {
        return c.json<ApiResponse>(
          { success: false, error: 'El nombre no puede estar vacío' },
          400
        );
      }
      setClauses.push('name = ?');
      values.push(body.name.trim());
    }

    if (body.icon !== undefined) {
      setClauses.push('icon = ?');
      values.push(body.icon);
    }

    if (body.color !== undefined) {
      setClauses.push('color = ?');
      values.push(body.color);
    }

    if (setClauses.length === 0) {
      return c.json<ApiResponse>(
        { success: false, error: 'No hay campos para actualizar' },
        400
      );
    }

    values.push(categoryId, userId);

    await c.env.DB.prepare(
      `UPDATE categories SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`
    )
      .bind(...values)
      .run();

    const updated = await c.env.DB.prepare(
      'SELECT * FROM categories WHERE id = ?'
    )
      .bind(categoryId)
      .first<Category>();

    return c.json<ApiResponse<Category>>({
      success: true,
      data: updated!,
      message: 'Categoría actualizada ✅',
    });
  } catch (error) {
    console.error('Update category error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error al actualizar la categoría' },
      500
    );
  }
});

// ---- DELETE /categories/:id ----
categories.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const categoryId = c.req.param('id');

    // Check ownership and default status
    const existing = await c.env.DB.prepare(
      'SELECT id, is_default FROM categories WHERE id = ? AND user_id = ?'
    )
      .bind(categoryId, userId)
      .first<{ id: string; is_default: number }>();

    if (!existing) {
      return c.json<ApiResponse>(
        { success: false, error: 'Categoría no encontrada' },
        404
      );
    }

    if (existing.is_default === 1) {
      return c.json<ApiResponse>(
        { success: false, error: 'No puedes eliminar categorías predeterminadas' },
        403
      );
    }

    // Set transactions with this category to null
    await c.env.DB.prepare(
      `UPDATE transactions SET category_id = NULL, updated_at = datetime('now') 
       WHERE category_id = ? AND user_id = ?`
    )
      .bind(categoryId, userId)
      .run();

    // Delete category
    await c.env.DB.prepare(
      'DELETE FROM categories WHERE id = ? AND user_id = ?'
    )
      .bind(categoryId, userId)
      .run();

    return c.json<ApiResponse>({
      success: true,
      message: 'Categoría eliminada 🗑️',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error al eliminar la categoría' },
      500
    );
  }
});

export default categories;
