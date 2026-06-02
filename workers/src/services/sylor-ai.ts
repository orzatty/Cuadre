// ============================================
// Sylor S1 — AI Financial Assistant Service
// ============================================

import type { Env, ParsedTransaction, SylorChatResponse, TransactionSummary, RatesResponse } from '../types';

const SYLOR_SYSTEM_PROMPT = `Eres Sylor S1, el asistente financiero inteligente de Cuadre. Hablas en español venezolano, amigable pero profesional.

Tus capacidades:
- Registrar gastos e ingresos cuando el usuario te lo diga
- Dar resúmenes financieros y análisis de gastos
- Informar las tasas actuales del BCV (dólar/euro) y Binance (USDT)
- Ayudar con presupuestos y metas de ahorro
- Dar consejos financieros adaptados a la realidad venezolana

Cuando detectes que el usuario quiere registrar un gasto o ingreso, extrae la información y responde con un JSON al final de tu mensaje en este formato exacto:
\`\`\`json
{"action":"create_transaction","amount":NUMERO,"currency":"VES|USD|USDT|EUR","category":"CATEGORIA","description":"DESCRIPCION","type":"expense|income"}
\`\`\`

Categorías disponibles: Comida, Transporte, Hogar, Salud, Educación, Entretenimiento, Ropa, Servicios, Supermercado, Mascotas, Cuidado Personal, Tecnología, Regalos, Otros Gastos, Salario, Freelance, Inversiones, Alquiler, Remesas, Bonos, Otros Ingresos.

Si el usuario no especifica moneda, asume VES (bolívares).
Si el usuario dice "dólares" o "$", usa USD.
Si el usuario dice "USDT" o "cripto", usa USDT.

Responde de forma concisa y útil. Usa emojis moderadamente. No repitas información innecesaria.
Si no estás seguro del monto o la categoría, pregunta antes de sugerir el registro.`;

/**
 * Chat with Sylor S1 using Workers AI.
 */
export async function chat(
  ai: Ai,
  db: D1Database,
  userId: string,
  userMessage: string,
  context?: {
    rates?: RatesResponse | null;
    summary?: TransactionSummary | null;
  }
): Promise<SylorChatResponse> {
  // Build context information
  let contextInfo = '';

  if (context?.rates) {
    const r = context.rates;
    contextInfo += `\n\nTasas actuales:`;
    if (r.bcv_usd) contextInfo += `\n- BCV Dólar: ${r.bcv_usd} Bs`;
    if (r.bcv_eur) contextInfo += `\n- BCV Euro: ${r.bcv_eur} Bs`;
    if (r.binance_usdt) contextInfo += `\n- Binance USDT: ${r.binance_usdt} Bs`;
    if (r.updated_at) contextInfo += `\n- Actualizado: ${r.updated_at}`;
  }

  if (context?.summary) {
    const s = context.summary;
    contextInfo += `\n\nResumen del mes del usuario:`;
    contextInfo += `\n- Ingresos totales: ${s.total_income} ${s.currency}`;
    contextInfo += `\n- Gastos totales: ${s.total_expenses} ${s.currency}`;
    contextInfo += `\n- Balance neto: ${s.net} ${s.currency}`;
    if (s.by_category.length > 0) {
      contextInfo += `\n- Top gastos por categoría:`;
      s.by_category.slice(0, 5).forEach((cat) => {
        contextInfo += `\n  ${cat.category_icon} ${cat.category_name}: ${cat.total} (${cat.count} transacciones)`;
      });
    }
  }

  // Load recent chat history (last 10 messages)
  const recentMessages = await db
    .prepare(
      `SELECT role, content FROM sylor_messages 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`
    )
    .bind(userId)
    .all<{ role: string; content: string }>();

  // Build messages array for AI
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: SYLOR_SYSTEM_PROMPT + contextInfo,
    },
  ];

  // Add recent history (reversed to chronological order)
  if (recentMessages.results) {
    const history = [...recentMessages.results].reverse();
    for (const msg of history) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: userMessage,
  });

  // Call Workers AI
  const aiResponse = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
    messages,
    max_tokens: 1024,
    temperature: 0.7,
    top_p: 0.9,
  }) as { response?: string };

  const reply = aiResponse.response || 'Lo siento, no pude procesar tu mensaje. ¿Podrías intentar de nuevo?';

  // Save both messages to DB
  const batch = [
    db.prepare(
      `INSERT INTO sylor_messages (id, user_id, role, content, metadata) 
       VALUES (lower(hex(randomblob(16))), ?, 'user', ?, '{}')`
    ).bind(userId, userMessage),
    db.prepare(
      `INSERT INTO sylor_messages (id, user_id, role, content, metadata)
       VALUES (lower(hex(randomblob(16))), ?, 'assistant', ?, '{}')`
    ).bind(userId, reply),
  ];

  await db.batch(batch);

  // Try to parse a transaction from the AI response
  const parsed = parseTransactionFromReply(reply);

  return {
    reply: cleanReplyForUser(reply),
    parsed_transaction: parsed || undefined,
    action_suggested: parsed !== null,
  };
}

/**
 * Parse a transaction JSON block from Sylor's reply.
 */
function parseTransactionFromReply(reply: string): ParsedTransaction | null {
  try {
    // Look for JSON block in the reply
    const jsonMatch = reply.match(/```json\s*\n?([\s\S]*?)\n?\s*```/);

    if (!jsonMatch || !jsonMatch[1]) {
      // Try inline JSON pattern
      const inlineMatch = reply.match(
        /\{"action"\s*:\s*"create_transaction"[\s\S]*?\}/
      );
      if (!inlineMatch) return null;
      
      const data = JSON.parse(inlineMatch[0]);
      return validateParsedTransaction(data);
    }

    const data = JSON.parse(jsonMatch[1]);
    return validateParsedTransaction(data);
  } catch {
    return null;
  }
}

/**
 * Validate and normalize a parsed transaction object.
 */
function validateParsedTransaction(data: Record<string, unknown>): ParsedTransaction | null {
  if (data.action !== 'create_transaction') return null;

  const amount = Number(data.amount);
  if (isNaN(amount) || amount <= 0) return null;

  const validCurrencies = ['VES', 'USD', 'USDT', 'EUR'];
  const currency = String(data.currency || 'VES').toUpperCase();
  if (!validCurrencies.includes(currency)) return null;

  const validTypes = ['income', 'expense'];
  const type = String(data.type || 'expense').toLowerCase();
  if (!validTypes.includes(type)) return null;

  return {
    amount,
    currency: currency as ParsedTransaction['currency'],
    category: String(data.category || 'Otros Gastos'),
    description: String(data.description || ''),
    type: type as ParsedTransaction['type'],
  };
}

/**
 * Remove the JSON block from the reply before sending to user,
 * so they see clean text.
 */
function cleanReplyForUser(reply: string): string {
  return reply
    .replace(/```json\s*\n?[\s\S]*?\n?\s*```/g, '')
    .replace(/\{"action"\s*:\s*"create_transaction"[\s\S]*?\}/g, '')
    .trim();
}

/**
 * Get current rates from KV cache for Sylor context.
 */
export async function getRatesForContext(
  kvCache: KVNamespace
): Promise<RatesResponse | null> {
  try {
    const cached = await kvCache.get('latest_rates', 'json');
    return cached as RatesResponse | null;
  } catch {
    return null;
  }
}

/**
 * Get monthly summary for Sylor context.
 */
export async function getSummaryForContext(
  db: D1Database,
  userId: string
): Promise<TransactionSummary | null> {
  try {
    const now = new Date();
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const incomeResult = await db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
         WHERE user_id = ? AND type = 'income' AND deleted = 0 AND date >= ?`
      )
      .bind(userId, firstOfMonth)
      .first<{ total: number }>();

    const expenseResult = await db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
         WHERE user_id = ? AND type = 'expense' AND deleted = 0 AND date >= ?`
      )
      .bind(userId, firstOfMonth)
      .first<{ total: number }>();

    const categoryResults = await db
      .prepare(
        `SELECT 
           t.category_id,
           c.name as category_name,
           c.icon as category_icon,
           c.color as category_color,
           SUM(t.amount) as total,
           COUNT(*) as count
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = ? AND t.type = 'expense' AND t.deleted = 0 AND t.date >= ?
         GROUP BY t.category_id
         ORDER BY total DESC`
      )
      .bind(userId, firstOfMonth)
      .all();

    const totalIncome = incomeResult?.total || 0;
    const totalExpenses = expenseResult?.total || 0;

    return {
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net: totalIncome - totalExpenses,
      currency: 'VES',
      by_category: (categoryResults.results || []).map((row: Record<string, unknown>) => ({
        category_id: String(row.category_id || ''),
        category_name: String(row.category_name || 'Sin categoría'),
        category_icon: String(row.category_icon || '📦'),
        category_color: String(row.category_color || '#6B7280'),
        total: Number(row.total) || 0,
        count: Number(row.count) || 0,
      })),
    };
  } catch (error) {
    console.error('Error getting summary for Sylor:', error);
    return null;
  }
}
