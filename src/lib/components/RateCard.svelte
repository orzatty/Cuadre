<script lang="ts">
  export let label: string;
  export let rate: number;
  export let change: number;
  export let symbol: string = 'Bs.';
</script>

<div class="rate-card glass-card">
  <div class="rate-header">
    <span class="rate-label">{label}</span>
    <span class="rate-change" class:positive={change >= 0} class:negative={change < 0}>
      {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}
    </span>
  </div>
  <p class="rate-value">{symbol}{rate.toFixed(2)}</p>
</div>

<style>
  .rate-card {
    padding: var(--space-4);
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    transition: all var(--transition-fast);
    animation: slideUp var(--transition-base) ease-out both;
  }

  .rate-card:active {
    transform: scale(0.98);
  }

  .rate-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-2);
  }

  .rate-label {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
  }

  .rate-change {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    padding: 2px var(--space-2);
    border-radius: var(--radius-full);
  }

  .rate-change.positive {
    color: var(--color-green);
    background: var(--color-green-muted);
  }

  .rate-change.negative {
    color: var(--color-red);
    background: var(--color-red-muted);
  }

  .rate-value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--letter-spacing-tight);
  }
</style>
