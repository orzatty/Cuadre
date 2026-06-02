/**
 * Transactions store — CRUD, filtering, computed totals.
 */
import { writable, derived } from 'svelte/store';
import type { CurrencyCode } from '$lib/utils/currency';
import type { CategoryType } from '$lib/utils/categories';

export interface Transaction {
  id: string;
  type: CategoryType;
  categoryId: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  date: string; // ISO string
  createdAt: string;
}

// ── Mock Data ──
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'expense',
    categoryId: 'comida',
    description: 'Arepas en la esquina',
    amount: 5.50,
    currency: 'USD',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'expense',
    categoryId: 'transporte',
    description: 'Gasolina',
    amount: 3.00,
    currency: 'USD',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    type: 'income',
    categoryId: 'sueldo',
    description: 'Pago quincenal',
    amount: 450.00,
    currency: 'USD',
    date: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '4',
    type: 'expense',
    categoryId: 'servicios',
    description: 'Recarga Movistar',
    amount: 10.00,
    currency: 'USD',
    date: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '5',
    type: 'expense',
    categoryId: 'mercado',
    description: 'Mercado semanal',
    amount: 45.00,
    currency: 'USD',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: '6',
    type: 'income',
    categoryId: 'freelance',
    description: 'Proyecto diseño web',
    amount: 200.00,
    currency: 'USD',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: '7',
    type: 'expense',
    categoryId: 'cafe',
    description: 'Café con leche',
    amount: 2.50,
    currency: 'USD',
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: '8',
    type: 'expense',
    categoryId: 'entretenimiento',
    description: 'Netflix',
    amount: 8.99,
    currency: 'USD',
    date: new Date(Date.now() - 4 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: '9',
    type: 'income',
    categoryId: 'remesas',
    description: 'Remesa familiar',
    amount: 150.00,
    currency: 'USD',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: '10',
    type: 'expense',
    categoryId: 'salud',
    description: 'Farmacia',
    amount: 15.00,
    currency: 'USD',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

// ── State ──
export const transactions = writable<Transaction[]>(MOCK_TRANSACTIONS);

// ── Derived ──

/** Total income this month. */
export const totalIncome = derived(transactions, ($txns) => {
  const now = new Date();
  return $txns
    .filter(
      (t) =>
        t.type === 'income' &&
        new Date(t.date).getMonth() === now.getMonth() &&
        new Date(t.date).getFullYear() === now.getFullYear()
    )
    .reduce((sum, t) => sum + t.amount, 0);
});

/** Total expenses this month. */
export const totalExpenses = derived(transactions, ($txns) => {
  const now = new Date();
  return $txns
    .filter(
      (t) =>
        t.type === 'expense' &&
        new Date(t.date).getMonth() === now.getMonth() &&
        new Date(t.date).getFullYear() === now.getFullYear()
    )
    .reduce((sum, t) => sum + t.amount, 0);
});

/** Net balance this month (income - expenses). */
export const balance = derived([totalIncome, totalExpenses], ([$income, $expenses]) => $income - $expenses);

/** Transactions sorted by date (newest first). */
export const sortedTransactions = derived(transactions, ($txns) =>
  [...$txns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
);

// ── Actions ──

let nextId = MOCK_TRANSACTIONS.length + 1;

export function addTransaction(txn: Omit<Transaction, 'id' | 'createdAt'>): void {
  const newTxn: Transaction = {
    ...txn,
    id: String(nextId++),
    createdAt: new Date().toISOString(),
  };
  transactions.update((prev) => [newTxn, ...prev]);
}

export function deleteTransaction(id: string): void {
  transactions.update((prev) => prev.filter((t) => t.id !== id));
}

export function getByCategory(categoryId: string): Transaction[] {
  let result: Transaction[] = [];
  transactions.subscribe((txns) => {
    result = txns.filter((t) => t.categoryId === categoryId);
  })();
  return result;
}
