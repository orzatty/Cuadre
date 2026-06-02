// ============================================
// Cuadre API — Main Router (Hono)
// ============================================

import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors';
import type { Env, AuthVariables, ApiResponse, RatesResponse } from './types';
import { fetchBcvRates } from './services/bcv';
import { fetchBinanceP2PRate } from './services/binance';

// Import routes
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import categoryRoutes from './routes/categories';
import ratesRoutes from './routes/rates';
import sylorRoutes from './routes/sylor';
import syncRoutes from './routes/sync';

// Create app
const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// ---- Global Middleware ----
app.use('*', corsMiddleware());

// ---- Global Error Handling ----
app.onError((err, c) => {
  console.error('Unhandled error:', err);

  const status = 'status' in err ? (err as any).status : 500;
  const message =
    c.env.ENVIRONMENT === 'development'
      ? err.message
      : 'Error interno del servidor';

  return c.json<ApiResponse>(
    {
      success: false,
      error: message,
    },
    status
  );
});

// ---- 404 Handler ----
app.notFound((c) => {
  return c.json<ApiResponse>(
    {
      success: false,
      error: `Ruta no encontrada: ${c.req.method} ${c.req.path}`,
    },
    404
  );
});

// ---- Health Check ----
app.get('/health', async (c) => {
  let dbStatus = 'unknown';

  try {
    const result = await c.env.DB.prepare('SELECT 1 as ok').first<{ ok: number }>();
    dbStatus = result?.ok === 1 ? 'connected' : 'error';
  } catch {
    dbStatus = 'error';
  }

  return c.json({
    status: 'ok',
    service: 'cuadre-api',
    version: '1.0.0',
    environment: c.env.ENVIRONMENT || 'unknown',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// ---- Mount Routes ----
app.route('/auth', authRoutes);
app.route('/transactions', transactionRoutes);
app.route('/categories', categoryRoutes);
app.route('/rates', ratesRoutes);
app.route('/sylor', sylorRoutes);
app.route('/sync', syncRoutes);

// ---- Root ----
app.get('/', (c) => {
  return c.json({
    name: 'Cuadre API',
    version: '1.0.0',
    description: 'API para la app de finanzas personales venezolana',
    docs: {
      auth: '/auth — Autenticación (registro, login, refresh)',
      transactions: '/transactions — Gestión de transacciones',
      categories: '/categories — Categorías de gastos/ingresos',
      rates: '/rates — Tasas de cambio (BCV, Binance)',
      sylor: '/sylor — Asistente financiero IA',
      sync: '/sync — Sincronización offline-first',
      health: '/health — Estado del servicio',
    },
  });
});

// ---- Scheduled Handler (Cron) ----
// Runs every 15 minutes to fetch fresh exchange rates
async function scheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
) {
  console.log('⏰ Cron triggered: fetching exchange rates...');

  try {
    // Fetch rates in parallel
    const [bcvRates, binanceRates] = await Promise.allSettled([
      fetchBcvRates(),
      fetchBinanceP2PRate(),
    ]);

    const statements: D1PreparedStatement[] = [];

    // Store BCV USD rate
    if (bcvRates.status === 'fulfilled' && bcvRates.value.usd !== null) {
      statements.push(
        env.DB.prepare(
          `INSERT INTO exchange_rates (id, source, rate, currency_from, currency_to, fetched_at)
           VALUES (lower(hex(randomblob(16))), 'bcv', ?, 'USD', 'VES', datetime('now'))`
        ).bind(bcvRates.value.usd)
      );
    }

    // Store BCV EUR rate
    if (bcvRates.status === 'fulfilled' && bcvRates.value.eur !== null) {
      statements.push(
        env.DB.prepare(
          `INSERT INTO exchange_rates (id, source, rate, currency_from, currency_to, fetched_at)
           VALUES (lower(hex(randomblob(16))), 'bcv', ?, 'EUR', 'VES', datetime('now'))`
        ).bind(bcvRates.value.eur)
      );
    }

    // Store Binance USDT rate
    if (binanceRates.status === 'fulfilled' && binanceRates.value.average !== null) {
      statements.push(
        env.DB.prepare(
          `INSERT INTO exchange_rates (id, source, rate, currency_from, currency_to, fetched_at)
           VALUES (lower(hex(randomblob(16))), 'binance', ?, 'USDT', 'VES', datetime('now'))`
        ).bind(binanceRates.value.average)
      );
    }

    // Batch insert
    if (statements.length > 0) {
      await env.DB.batch(statements);
    }

    // Update KV cache
    const ratesData: RatesResponse = {
      bcv_usd:
        bcvRates.status === 'fulfilled' ? bcvRates.value.usd : null,
      bcv_eur:
        bcvRates.status === 'fulfilled' ? bcvRates.value.eur : null,
      binance_usdt:
        binanceRates.status === 'fulfilled'
          ? binanceRates.value.average
          : null,
      updated_at: new Date().toISOString(),
    };

    await env.RATES_CACHE.put('latest_rates', JSON.stringify(ratesData), {
      expirationTtl: 1800, // 30 minutes TTL
    });

    console.log('✅ Exchange rates updated successfully');

    // Cleanup: delete rates older than 90 days
    await env.DB.prepare(
      `DELETE FROM exchange_rates WHERE fetched_at < datetime('now', '-90 days')`
    ).run();
  } catch (error) {
    console.error('❌ Cron rate fetch error:', error);
  }
}

// ---- Export ----
export default {
  fetch: app.fetch,
  scheduled,
};
