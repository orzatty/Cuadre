/**
 * Exchange rates store — BCV and Binance rates.
 */
import { writable, derived } from 'svelte/store';

export interface ExchangeRates {
  bcvUsd: number;
  bcvEur: number;
  binanceUsdt: number;
}

export interface RateChange {
  bcvUsd: number;
  bcvEur: number;
  binanceUsdt: number;
}

// ── State ──
export const rates = writable<ExchangeRates>({
  bcvUsd: 92.35,
  bcvEur: 100.18,
  binanceUsdt: 91.80,
});

export const rateChanges = writable<RateChange>({
  bcvUsd: 0.45,
  bcvEur: -0.12,
  binanceUsdt: 0.22,
});

export const lastUpdated = writable<Date>(new Date());
export const isLoadingRates = writable(false);

// ── Derived ──
export const bcvUsd = derived(rates, ($r) => $r.bcvUsd);
export const bcvEur = derived(rates, ($r) => $r.bcvEur);
export const binanceUsdt = derived(rates, ($r) => $r.binanceUsdt);

// ── Actions ──

/**
 * Fetch latest exchange rates (mock for now).
 */
export async function fetchRates(): Promise<void> {
  isLoadingRates.set(true);

  try {
    await new Promise((r) => setTimeout(r, 600));

    // Simulated small fluctuation
    const jitter = () => (Math.random() - 0.5) * 0.6;

    rates.update(($r) => ({
      bcvUsd: Math.round(($r.bcvUsd + jitter()) * 100) / 100,
      bcvEur: Math.round(($r.bcvEur + jitter()) * 100) / 100,
      binanceUsdt: Math.round(($r.binanceUsdt + jitter()) * 100) / 100,
    }));

    rateChanges.set({
      bcvUsd: Math.round((Math.random() - 0.3) * 100) / 100,
      bcvEur: Math.round((Math.random() - 0.5) * 100) / 100,
      binanceUsdt: Math.round((Math.random() - 0.3) * 100) / 100,
    });

    lastUpdated.set(new Date());
  } finally {
    isLoadingRates.set(false);
  }
}

/**
 * Convert an amount from USD to VES using BCV rate.
 */
export function usdToVes(amount: number): number {
  let rate = 92.35;
  rates.subscribe(($r) => { rate = $r.bcvUsd; })();
  return amount * rate;
}

/**
 * Convert an amount from VES to USD using BCV rate.
 */
export function vesToUsd(amount: number): number {
  let rate = 92.35;
  rates.subscribe(($r) => { rate = $r.bcvUsd; })();
  return amount / rate;
}
