/**
 * Currency formatting utilities for Venezuelan finance app.
 * Supports VES (Bolívares), USD, and USDT.
 */

export type CurrencyCode = 'VES' | 'USD' | 'USDT';

const currencyConfig: Record<CurrencyCode, { symbol: string; name: string; decimals: number; locale: string }> = {
  VES: { symbol: 'Bs.', name: 'Bolívares', decimals: 2, locale: 'es-VE' },
  USD: { symbol: '$', name: 'Dólares', decimals: 2, locale: 'en-US' },
  USDT: { symbol: '₮', name: 'Tether USDT', decimals: 2, locale: 'en-US' },
};

/**
 * Format a number as currency string.
 */
export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  const config = currencyConfig[currency];
  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';
  return `${sign}${config.symbol}${formatted}`;
}

/**
 * Format a compact currency string for large numbers (e.g., 1.2M).
 */
export function formatCurrencyCompact(amount: number, currency: CurrencyCode = 'USD'): string {
  const config = currencyConfig[currency];
  const abs = Math.abs(amount);
  let formatted: string;

  if (abs >= 1_000_000) {
    formatted = (abs / 1_000_000).toFixed(1) + 'M';
  } else if (abs >= 1_000) {
    formatted = (abs / 1_000).toFixed(1) + 'K';
  } else {
    formatted = abs.toFixed(config.decimals);
  }

  const sign = amount < 0 ? '-' : '';
  return `${sign}${config.symbol}${formatted}`;
}

/**
 * Get currency symbol.
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  return currencyConfig[currency].symbol;
}

/**
 * Get currency display name in Spanish.
 */
export function getCurrencyName(currency: CurrencyCode): string {
  return currencyConfig[currency].name;
}

/**
 * All available currencies.
 */
export const CURRENCIES: CurrencyCode[] = ['VES', 'USD', 'USDT'];
