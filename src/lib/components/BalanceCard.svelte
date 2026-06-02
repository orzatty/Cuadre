<script lang="ts">
  import { formatCurrency, type CurrencyCode } from '$lib/utils/currency';
  import { rates } from '$lib/stores/rates';
  import { balance, totalIncome, totalExpenses } from '$lib/stores/transactions';

  export let currency: CurrencyCode = 'USD';

  const currencies: CurrencyCode[] = ['USD', 'VES', 'USDT'];

  $: displayBalance = currency === 'VES' ? $balance * $rates.bcvUsd : $balance;
  $: displayIncome = currency === 'VES' ? $totalIncome * $rates.bcvUsd : $totalIncome;
  $: displayExpenses = currency === 'VES' ? $totalExpenses * $rates.bcvUsd : $totalExpenses;
</script>

<div class="balance-card">
  <div class="card-glow"></div>
  <div class="card-content">
    <p class="card-label">Balance total</p>
    <p class="card-amount" class:positive={$balance >= 0} class:negative={$balance < 0}>
      {formatCurrency(displayBalance, currency)}
    </p>

    <div class="card-breakdown">
      <div class="breakdown-item income">
        <span class="breakdown-arrow">↑</span>
        <div>
          <span class="breakdown-label">Ingresos</span>
          <span class="breakdown-value">{formatCurrency(displayIncome, currency)}</span>
        </div>
      </div>
      <div class="breakdown-divider"></div>
      <div class="breakdown-item expense">
        <span class="breakdown-arrow">↓</span>
        <div>
          <span class="breakdown-label">Gastos</span>
          <span class="breakdown-value">{formatCurrency(displayExpenses, currency)}</span>
        </div>
      </div>
    </div>

    <div class="currency-pills">
      {#each currencies as cur}
        {@const amt = cur === 'VES' ? $balance * $rates.bcvUsd : cur === 'USDT' ? $balance * ($rates.bcvUsd / $rates.binanceUsdt) : $balance}
        <span class="pill" class:active={currency === cur}>
          {formatCurrency(amt, cur)}
        </span>
      {/each}
    </div>
  </div>
</div>

<style>
  .balance-card {
    position: relative;
    border-radius: var(--radius-2xl);
    overflow: hidden;
    animation: scaleIn var(--transition-slow) ease-out;
  }

  .card-glow {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg,
      rgba(0, 200, 150, 0.12) 0%,
      rgba(255, 184, 0, 0.06) 50%,
      rgba(0, 200, 150, 0.08) 100%
    );
    border-radius: var(--radius-2xl);
    z-index: 0;
  }

  .balance-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: var(--radius-2xl);
    padding: 1px;
    background: var(--gradient-border-green-gold);
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    z-index: 1;
    opacity: 0.4;
  }

  .card-content {
    position: relative;
    z-index: 2;
    padding: var(--space-6);
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border-radius: var(--radius-2xl);
  }

  .card-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    margin-bottom: var(--space-2);
  }

  .card-amount {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--letter-spacing-tight);
    line-height: var(--line-height-tight);
    margin-bottom: var(--space-5);
  }

  .card-amount.positive {
    color: var(--color-green);
  }

  .card-amount.negative {
    color: var(--color-red);
  }

  .card-breakdown {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-5);
  }

  .breakdown-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
  }

  .breakdown-arrow {
    font-size: var(--font-size-lg);
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-bold);
  }

  .income .breakdown-arrow {
    background: var(--color-green-muted);
    color: var(--color-green);
  }

  .expense .breakdown-arrow {
    background: var(--color-red-muted);
    color: var(--color-red);
  }

  .breakdown-label {
    display: block;
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    font-weight: var(--font-weight-medium);
  }

  .breakdown-value {
    display: block;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
  }

  .breakdown-divider {
    width: 1px;
    height: 32px;
    background: var(--glass-border);
  }

  .currency-pills {
    display: flex;
    gap: var(--space-2);
  }

  .pill {
    flex: 1;
    text-align: center;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-lg);
    background: var(--bg-elevated);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--text-secondary);
    transition: all var(--transition-fast);
  }

  .pill.active {
    background: var(--color-green-muted);
    color: var(--color-green);
  }
</style>
