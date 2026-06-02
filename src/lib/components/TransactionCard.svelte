<script lang="ts">
  import type { Transaction } from '$lib/stores/transactions';
  import { getCategoryById } from '$lib/utils/categories';
  import { formatCurrency } from '$lib/utils/currency';
  import { formatRelativeDate, formatTime } from '$lib/utils/date';

  export let transaction: Transaction;
  export let index: number = 0;

  $: category = getCategoryById(transaction.categoryId);
  $: isIncome = transaction.type === 'income';
</script>

<div
  class="transaction-card"
  style="animation-delay: {index * 50}ms"
>
  <div class="card-left">
    <div class="category-icon" style="background: {category?.color ?? '#666'}20">
      <span>{category?.emoji ?? '📦'}</span>
    </div>
    <div class="card-info">
      <p class="card-description">{transaction.description}</p>
      <p class="card-meta">
        {category?.name ?? 'Otro'} · {formatRelativeDate(transaction.date)} · {formatTime(transaction.date)}
      </p>
    </div>
  </div>
  <div class="card-right">
    <p class="card-amount" class:income={isIncome} class:expense={!isIncome}>
      {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
    </p>
  </div>
</div>

<style>
  .transaction-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-xl);
    background: var(--bg-secondary);
    border: 1px solid var(--glass-border);
    transition: all var(--transition-fast);
    animation: slideInRight var(--transition-base) ease-out both;
    cursor: pointer;
  }

  .transaction-card:active {
    transform: scale(0.98);
    background: var(--bg-hover);
  }

  .card-left {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex: 1;
    min-width: 0;
  }

  .category-icon {
    width: 42px;
    height: 42px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .card-info {
    flex: 1;
    min-width: 0;
  }

  .card-description {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-meta {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    margin-top: 2px;
  }

  .card-right {
    flex-shrink: 0;
    margin-left: var(--space-3);
  }

  .card-amount {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    white-space: nowrap;
  }

  .card-amount.income {
    color: var(--color-green);
  }

  .card-amount.expense {
    color: var(--color-red);
  }
</style>
