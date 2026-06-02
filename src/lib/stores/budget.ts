/**
 * Budget store — budget tracking by category with progress.
 */
import { writable, derived } from 'svelte/store';
import { transactions } from './transactions';

export interface Budget {
  id: string;
  categoryId: string;
  limit: number;
  currency: 'VES' | 'USD' | 'USDT';
  month: number; // 0-indexed
  year: number;
}

// ── Mock Data ──
const now = new Date();
const MOCK_BUDGETS: Budget[] = [
  { id: '1', categoryId: 'comida', limit: 80, currency: 'USD', month: now.getMonth(), year: now.getFullYear() },
  { id: '2', categoryId: 'transporte', limit: 40, currency: 'USD', month: now.getMonth(), year: now.getFullYear() },
  { id: '3', categoryId: 'entretenimiento', limit: 30, currency: 'USD', month: now.getMonth(), year: now.getFullYear() },
  { id: '4', categoryId: 'servicios', limit: 50, currency: 'USD', month: now.getMonth(), year: now.getFullYear() },
  { id: '5', categoryId: 'mercado', limit: 120, currency: 'USD', month: now.getMonth(), year: now.getFullYear() },
  { id: '6', categoryId: 'salud', limit: 25, currency: 'USD', month: now.getMonth(), year: now.getFullYear() },
];

// ── State ──
export const budgets = writable<Budget[]>(MOCK_BUDGETS);
export const selectedBudgetMonth = writable<number>(now.getMonth());
export const selectedBudgetYear = writable<number>(now.getFullYear());

// ── Derived ──

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
}

/** All budget progress for the selected month. */
export const budgetProgress = derived(
  [budgets, transactions, selectedBudgetMonth, selectedBudgetYear],
  ([$budgets, $txns, $month, $year]) => {
    return $budgets
      .filter((b) => b.month === $month && b.year === $year)
      .map((budget): BudgetProgress => {
        const spent = $txns
          .filter(
            (t) =>
              t.type === 'expense' &&
              t.categoryId === budget.categoryId &&
              new Date(t.date).getMonth() === $month &&
              new Date(t.date).getFullYear() === $year
          )
          .reduce((sum, t) => sum + t.amount, 0);

        const remaining = Math.max(0, budget.limit - spent);
        const percentage = budget.limit > 0 ? Math.min(100, (spent / budget.limit) * 100) : 0;

        return { budget, spent, remaining, percentage };
      });
  }
);

/** Total budget limit for the selected month. */
export const totalBudgetLimit = derived(budgetProgress, ($bp) =>
  $bp.reduce((sum, b) => sum + b.budget.limit, 0)
);

/** Total spent across all budgets for the selected month. */
export const totalBudgetSpent = derived(budgetProgress, ($bp) =>
  $bp.reduce((sum, b) => sum + b.spent, 0)
);

// ── Actions ──

let nextBudgetId = MOCK_BUDGETS.length + 1;

export function addBudget(budget: Omit<Budget, 'id'>): void {
  budgets.update((prev) => [
    ...prev,
    { ...budget, id: String(nextBudgetId++) },
  ]);
}

export function removeBudget(id: string): void {
  budgets.update((prev) => prev.filter((b) => b.id !== id));
}

export function updateBudgetLimit(id: string, newLimit: number): void {
  budgets.update((prev) =>
    prev.map((b) => (b.id === id ? { ...b, limit: newLimit } : b))
  );
}
