// ============================================
// Sync Routes — Offline-first Synchronization
// ============================================

import { Hono } from 'hono';
import type { Env, AuthVariables, ApiResponse, SyncRequest, SyncResponse } from '../types';
import { authMiddleware } from '../middleware/auth';
import { handleSync } from '../services/sync-engine';

const sync = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// Apply auth
sync.use('*', authMiddleware);

// ---- POST /sync ----
sync.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json<SyncRequest>();

    // Validate sync request
    if (!Array.isArray(body.changes)) {
      return c.json<ApiResponse>(
        { success: false, error: 'Formato de sincronización inválido: "changes" debe ser un array' },
        400
      );
    }

    // Limit changes per request to prevent abuse
    if (body.changes.length > 500) {
      return c.json<ApiResponse>(
        { success: false, error: 'Demasiados cambios en una sola solicitud (máximo 500)' },
        400
      );
    }

    // Validate each change
    for (const change of body.changes) {
      if (!change.table || !['transactions', 'categories'].includes(change.table)) {
        return c.json<ApiResponse>(
          { success: false, error: `Tabla inválida: ${change.table}` },
          400
        );
      }

      if (!change.action || !['create', 'update', 'delete'].includes(change.action)) {
        return c.json<ApiResponse>(
          { success: false, error: `Acción inválida: ${change.action}` },
          400
        );
      }

      if (!change.id) {
        return c.json<ApiResponse>(
          { success: false, error: 'Cada cambio debe tener un ID' },
          400
        );
      }

      if (!change.updated_at) {
        return c.json<ApiResponse>(
          { success: false, error: 'Cada cambio debe tener un timestamp (updated_at)' },
          400
        );
      }
    }

    // Process sync
    const result = await handleSync(c.env.DB, userId, body);

    return c.json<ApiResponse<SyncResponse>>({
      success: true,
      data: result,
      message: result.conflicts.length > 0
        ? `Sincronización completada con ${result.conflicts.length} conflicto(s) resuelto(s)`
        : 'Sincronización completada ✅',
    });
  } catch (error) {
    console.error('Sync error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error durante la sincronización' },
      500
    );
  }
});

export default sync;
