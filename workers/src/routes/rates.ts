// ============================================
// Exchange Rates Routes
// ============================================

import { Hono } from 'hono';
import type { Env, AuthVariables, ApiResponse, RatesResponse, ExchangeRate } from '../types';
import { authMiddleware } from '../middleware/auth';

const rates = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// ---- GET /rates ----
// Public endpoint — get latest exchange rates from KV cache
rates.get('/', async (c) => {
  try {
    // Try KV cache first
    const cached = await c.env.RATES_CACHE.get('latest_rates', 'json') as RatesResponse | null;

    if (cached) {
      return c.json<ApiResponse<RatesResponse>>({
        success: true,
        data: cached,
      });
    }

    // Fallback: get latest from DB
    const bcvUsd = await c.env.DB.prepare(
      `SELECT rate, fetched_at FROM exchange_rates 
       WHERE source = 'bcv' AND currency_from = 'USD' AND currency_to = 'VES'
       ORDER BY fetched_at DESC LIMIT 1`
    )
      .first<{ rate: number; fetched_at: string }>();

    const bcvEur = await c.env.DB.prepare(
      `SELECT rate, fetched_at FROM exchange_rates 
       WHERE source = 'bcv' AND currency_from = 'EUR' AND currency_to = 'VES'
       ORDER BY fetched_at DESC LIMIT 1`
    )
      .first<{ rate: number; fetched_at: string }>();

    const binanceUsdt = await c.env.DB.prepare(
      `SELECT rate, fetched_at FROM exchange_rates 
       WHERE source = 'binance' AND currency_from = 'USDT' AND currency_to = 'VES'
       ORDER BY fetched_at DESC LIMIT 1`
    )
      .first<{ rate: number; fetched_at: string }>();

    const latestTime = [bcvUsd?.fetched_at, bcvEur?.fetched_at, binanceUsdt?.fetched_at]
      .filter(Boolean)
      .sort()
      .reverse()[0] || null;

    const ratesData: RatesResponse = {
      bcv_usd: bcvUsd?.rate || null,
      bcv_eur: bcvEur?.rate || null,
      binance_usdt: binanceUsdt?.rate || null,
      updated_at: latestTime,
    };

    // Cache for 10 minutes
    await c.env.RATES_CACHE.put('latest_rates', JSON.stringify(ratesData), {
      expirationTtl: 600,
    });

    return c.json<ApiResponse<RatesResponse>>({
      success: true,
      data: ratesData,
    });
  } catch (error) {
    console.error('Get rates error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error al obtener las tasas' },
      500
    );
  }
});

// ---- GET /rates/history ----
// Protected endpoint — get historical rates
rates.get('/history', authMiddleware, async (c) => {
  try {
    const source = c.req.query('source') || 'bcv'; // bcv, binance
    const currencyFrom = c.req.query('currency_from') || 'USD';
    const currencyTo = c.req.query('currency_to') || 'VES';
    const days = Math.min(365, Math.max(1, parseInt(c.req.query('days') || '30')));

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const results = await c.env.DB.prepare(
      `SELECT id, source, rate, currency_from, currency_to, fetched_at
       FROM exchange_rates
       WHERE source = ? AND currency_from = ? AND currency_to = ? AND fetched_at >= ?
       ORDER BY fetched_at ASC`
    )
      .bind(source, currencyFrom, currencyTo, sinceDate.toISOString())
      .all<ExchangeRate>();

    return c.json<ApiResponse<ExchangeRate[]>>({
      success: true,
      data: results.results || [],
    });
  } catch (error) {
    console.error('Rate history error:', error);
    return c.json<ApiResponse>(
      { success: false, error: 'Error al obtener el historial de tasas' },
      500
    );
  }
});

export default rates;
