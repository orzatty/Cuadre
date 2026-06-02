<script lang="ts">
  import { budgetProgress, totalBudgetLimit, totalBudgetSpent, selectedBudgetMonth, selectedBudgetYear } from '$lib/stores/budget';
  import { getCategoryById } from '$lib/utils/categories';
  import { formatCurrency } from '$lib/utils/currency';
  import { getMonthName } from '$lib/utils/date';

  $: monthLabel = `${getMonthName($selectedBudgetMonth)} ${$selectedBudgetYear}`;
  $: totalPercentage = $totalBudgetLimit > 0 ? ($totalBudgetSpent / $totalBudgetLimit) * 100 : 0;

  function prevMonth() {
    if ($selectedBudgetMonth === 0) {
      $selectedBudgetMonth = 11;
      $selectedBudgetYear -= 1;
    } else {
      $selectedBudgetMonth -= 1;
    }
  }

  function nextMonth() {
    if ($selectedBudgetMonth === 11) {
      $selectedBudgetMonth = 0;
      $selectedBudgetYear += 1;
    } else {
      $selectedBudgetMonth += 1;
    }
  }

  function getProgressColor(pct: number): string {
    if (pct < 60) return 'var(--color-green)';
    if (pct < 85) return 'var(--color-gold)';
    return 'var(--color-red)';
  }

  function getBadgeClass(pct: number): string {
    if (pct < 60) return 'badge-green';
    if (pct < 85) return 'badge-gold';
    return 'badge-red';
  }
</script>

<div class="page">
  <div class="page-header">
    <h1 class="page-title">Presupuesto</h1>
    <p class="page-subtitle">Controla tus gastos mensuales</p>
  </div>

  <!-- Month Selector -->
  <div class="month-selector">
    <button class="month-arrow" on:click={prevMonth}>‹</button>
    <span class="month-label">{monthLabel}</span>
    <button class="month-arrow" on:click={nextMonth}>›</button>
  </div>

  <!-- Total Summary -->
  <div class="summary-card glass-card">
    <div class="summary-header">
      <div>
        <p class="summary-label">Total gastado</p>
        <p class="summary-amount">{formatCurrency($totalBudgetSpent, 'USD')}</p>
      </div>
      <div class="summary-right">
        <p class="summary-limit">de {formatCurrency($totalBudgetLimit, 'USD')}</p>
        <span class="badge {getBadgeClass(totalPercentage)}">{totalPercentage.toFixed(0)}%</span>
      </div>
    </div>
    <div class="progress-bar">
      <div
        class="progress-bar-fill"
        style="width: {Math.min(100, totalPercentage)}%; background: {getProgressColor(totalPercentage)}"
      ></div>
    </div>
  </div>

  <!-- Budget Cards -->
  <div class="budget-list">
    {#each $budgetProgress as bp, i (bp.budget.id)}
      {@const cat = getCategoryById(bp.budget.categoryId)}
      <div class="budget-card" style="animation-delay: {i * 60}ms">
        <div class="budget-header">
          <div class="budget-left">
            <span class="budget-emoji">{cat?.emoji ?? '📦'}</span>
            <div>
              <p class="budget-name">{cat?.name ?? 'Otro'}</p>
              <p class="budget-detail">
                {formatCurrency(bp.spent, 'USD')} de {formatCurrency(bp.budget.limit, 'USD')}
              </p>
            </div>
          </div>
          <span class="badge {getBadgeClass(bp.percentage)}">
            {bp.percentage.toFixed(0)}%
          </span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-bar-fill"
            style="width: {Math.min(100, bp.percentage)}%; background: {getProgressColor(bp.percentage)}"
          ></div>
        </div>
        <p class="budget-remaining">
          {#if bp.remaining > 0}
            Te quedan {formatCurrency(bp.remaining, 'USD')}
          {:else}
            ⚠️ Presupuesto agotado
          {/if}
        </p>
      </div>
    {/each}
  </div>

  {#if $budgetProgress.length === 0}
    <div class="empty-state">
      <span class="empty-state-emoji">📋</span>
      <p class="empty-state-title">Sin presupuestos</p>
      <p class="empty-state-text">Crea tu primer presupuesto para controlar tus gastos</p>
    </div>
  {/if}
</div>

<style>
  .month-selector {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-6);
    margin-bottom: var(--space-6);
  }

  .month-arrow {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--bg-elevated);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-xl);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
    border: 1px solid var(--glass-border);
  }

  .month-arrow:active {
    transform: scale(0.9);
    background: var(--bg-hover);
  }

  .month-label {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    min-width: 160px;
    text-align: center;
  }

  .summary-card {
    margin-bottom: var(--space-6);
    animation: scaleIn var(--transition-base) ease-out;
  }

  .summary-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: var(--space-4);
  }

  .summary-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-bottom: var(--space-1);
  }

  .summary-amount {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
  }

  .summary-right {
    text-align: right;
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .summary-limit {
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
  }

  .budget-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .budget-card {
    background: var(--bg-secondary);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: var(--space-4);
    animation: slideUp var(--transition-base) ease-out both;
  }

  .budget-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);
  }

  .budget-left {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .budget-emoji {
    font-size: 1.5rem;
  }

  .budget-name {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
  }

  .budget-detail {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    margin-top: 2px;
  }

  .budget-remaining {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    margin-top: var(--space-2);
  }
</style>
