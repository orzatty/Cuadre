// ============================================
// Sync Engine — Offline-first Synchronization
// ============================================

import type { Env, SyncRequest, SyncResponse, SyncChange, SyncConflict } from '../types';

/**
 * Handle a full sync request from the client.
 *
 * Strategy: Last-Write-Wins (LWW)
 * - Compare updated_at timestamps between client and server
 * - The most recent write wins in case of conflict
 * - Returns server changes since client's last sync
 */
export async function handleSync(
  db: D1Database,
  userId: string,
  syncRequest: SyncRequest
): Promise<SyncResponse> {
  const serverTime = new Date().toISOString();
  const conflicts: SyncConflict[] = [];
  const statements: D1PreparedStatement[] = [];

  // Process each client change
  for (const change of syncRequest.changes) {
    try {
      const conflict = await processChange(db, userId, change, statements);
      if (conflict) {
        conflicts.push(conflict);
      }
    } catch (error) {
      console.error(`Sync error for ${change.table}/${change.id}:`, error);
      conflicts.push({
        table: change.table,
        id: change.id,
        resolution: 'server_wins',
      });
    }
  }

  // Execute all batched statements
  if (statements.length > 0) {
    await db.batch(statements);
  }

  // Get server changes since client's last sync
  const serverChanges = await getChangesSince(
    db,
    userId,
    syncRequest.last_sync
  );

  return {
    server_changes: serverChanges,
    server_time: serverTime,
    conflicts,
  };
}

/**
 * Process a single change from the client.
 * Returns a conflict object if there was a conflict, null otherwise.
 */
async function processChange(
  db: D1Database,
  userId: string,
  change: SyncChange,
  statements: D1PreparedStatement[]
): Promise<SyncConflict | null> {
  const { table, action, id, data, updated_at } = change;

  // Validate table name to prevent SQL injection
  if (!['transactions', 'categories'].includes(table)) {
    throw new Error(`Invalid sync table: ${table}`);
  }

  if (action === 'create') {
    return await handleCreate(db, userId, table, id, data || {}, statements);
  }

  if (action === 'update') {
    return await handleUpdate(db, userId, table, id, data || {}, updated_at, statements);
  }

  if (action === 'delete') {
    return await handleDelete(db, userId, table, id, updated_at, statements);
  }

  return null;
}

/**
 * Handle a create action. If the record already exists, treat as update.
 */
async function handleCreate(
  db: D1Database,
  userId: string,
  table: string,
  id: string,
  data: Record<string, unknown>,
  statements: D1PreparedStatement[]
): Promise<SyncConflict | null> {
  // Check if record already exists
  const existing = await db
    .prepare(`SELECT id, updated_at FROM ${table} WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .first<{ id: string; updated_at: string }>();

  if (existing) {
    // Record already exists — treat as update with LWW
    return {
      table,
      id,
      resolution: 'server_wins',
      server_data: existing as unknown as Record<string, unknown>,
    };
  }

  if (table === 'transactions') {
    statements.push(
      db
        .prepare(
          `INSERT INTO transactions (id, user_id, type, amount, currency, category_id, description, date, source, reference, notes, synced, deleted, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, datetime('now'), datetime('now'))`
        )
        .bind(
          id,
          userId,
          data.type || 'expense',
          data.amount || 0,
          data.currency || 'VES',
          (data.category_id as string) || null,
          (data.description as string) || null,
          (data.date as string) || new Date().toISOString().split('T')[0],
          data.source || 'manual',
          (data.reference as string) || null,
          (data.notes as string) || null
        )
    );
  } else if (table === 'categories') {
    statements.push(
      db
        .prepare(
          `INSERT INTO categories (id, user_id, name, icon, color, is_default, type, created_at)
           VALUES (?, ?, ?, ?, ?, 0, ?, datetime('now'))`
        )
        .bind(
          id,
          userId,
          data.name || 'Sin nombre',
          data.icon || '📦',
          data.color || '#6B7280',
          data.type || 'expense'
        )
    );
  }

  return null;
}

/**
 * Handle an update action with Last-Write-Wins conflict resolution.
 */
async function handleUpdate(
  db: D1Database,
  userId: string,
  table: string,
  id: string,
  data: Record<string, unknown>,
  clientUpdatedAt: string,
  statements: D1PreparedStatement[]
): Promise<SyncConflict | null> {
  // Get server version
  const existing = await db
    .prepare(`SELECT updated_at FROM ${table} WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .first<{ updated_at: string }>();

  if (!existing) {
    // Record doesn't exist on server — skip or create
    return null;
  }

  const serverTime = new Date(existing.updated_at).getTime();
  const clientTime = new Date(clientUpdatedAt).getTime();

  // Last-Write-Wins: client is newer
  if (clientTime >= serverTime) {
    if (table === 'transactions') {
      const setClauses: string[] = [];
      const values: unknown[] = [];

      const allowedFields = [
        'type', 'amount', 'currency', 'category_id', 'description',
        'date', 'source', 'reference', 'notes',
      ];

      for (const field of allowedFields) {
        if (field in data) {
          setClauses.push(`${field} = ?`);
          values.push(data[field]);
        }
      }

      if (setClauses.length > 0) {
        setClauses.push(`updated_at = datetime('now')`);
        setClauses.push(`synced = 1`);
        values.push(id, userId);

        statements.push(
          db
            .prepare(
              `UPDATE transactions SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`
            )
            .bind(...values)
        );
      }
    } else if (table === 'categories') {
      const setClauses: string[] = [];
      const values: unknown[] = [];

      const allowedFields = ['name', 'icon', 'color'];

      for (const field of allowedFields) {
        if (field in data) {
          setClauses.push(`${field} = ?`);
          values.push(data[field]);
        }
      }

      if (setClauses.length > 0) {
        values.push(id, userId);
        statements.push(
          db
            .prepare(
              `UPDATE categories SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`
            )
            .bind(...values)
        );
      }
    }

    return null;
  }

  // Server wins
  return {
    table,
    id,
    resolution: 'server_wins',
  };
}

/**
 * Handle a delete action (soft-delete for transactions).
 */
async function handleDelete(
  db: D1Database,
  userId: string,
  table: string,
  id: string,
  clientUpdatedAt: string,
  statements: D1PreparedStatement[]
): Promise<SyncConflict | null> {
  if (table === 'transactions') {
    // Soft delete
    statements.push(
      db
        .prepare(
          `UPDATE transactions SET deleted = 1, updated_at = datetime('now'), synced = 1 
           WHERE id = ? AND user_id = ?`
        )
        .bind(id, userId)
    );
  } else if (table === 'categories') {
    // Only allow deleting non-default categories
    statements.push(
      db
        .prepare(
          `DELETE FROM categories WHERE id = ? AND user_id = ? AND is_default = 0`
        )
        .bind(id, userId)
    );
  }

  return null;
}

/**
 * Get all changes on the server since the given timestamp.
 */
export async function getChangesSince(
  db: D1Database,
  userId: string,
  lastSync: string | null
): Promise<SyncChange[]> {
  const changes: SyncChange[] = [];
  const since = lastSync || '1970-01-01T00:00:00.000Z';

  // Get transaction changes
  const transactions = await db
    .prepare(
      `SELECT id, type, amount, currency, category_id, description, date, source, reference, notes, deleted, updated_at
       FROM transactions
       WHERE user_id = ? AND updated_at > ?
       ORDER BY updated_at ASC
       LIMIT 500`
    )
    .bind(userId, since)
    .all();

  for (const row of transactions.results || []) {
    const record = row as Record<string, unknown>;
    if (record.deleted === 1) {
      changes.push({
        table: 'transactions',
        action: 'delete',
        id: String(record.id),
        updated_at: String(record.updated_at),
      });
    } else {
      changes.push({
        table: 'transactions',
        action: lastSync ? 'update' : 'create',
        id: String(record.id),
        data: record,
        updated_at: String(record.updated_at),
      });
    }
  }

  // Get category changes (non-default user categories)
  const categories = await db
    .prepare(
      `SELECT id, name, icon, color, type, created_at
       FROM categories
       WHERE user_id = ? AND created_at > ?
       ORDER BY created_at ASC
       LIMIT 200`
    )
    .bind(userId, since)
    .all();

  for (const row of categories.results || []) {
    const record = row as Record<string, unknown>;
    changes.push({
      table: 'categories',
      action: 'create',
      id: String(record.id),
      data: record,
      updated_at: String(record.created_at),
    });
  }

  return changes;
}
