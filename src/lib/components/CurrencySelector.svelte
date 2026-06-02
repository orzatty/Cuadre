<script lang="ts">
  import { CURRENCIES, getCurrencySymbol, getCurrencyName, type CurrencyCode } from '$lib/utils/currency';

  export let selected: CurrencyCode = 'USD';

  function select(cur: CurrencyCode) {
    selected = cur;
  }
</script>

<div class="currency-selector">
  {#each CURRENCIES as cur (cur)}
    <button
      class="currency-pill"
      class:active={selected === cur}
      on:click={() => select(cur)}
    >
      <span class="pill-symbol">{getCurrencySymbol(cur)}</span>
      <span class="pill-label">{cur}</span>
    </button>
  {/each}
</div>

<style>
  .currency-selector {
    display: flex;
    gap: var(--space-2);
    padding: var(--space-1);
    background: var(--bg-secondary);
    border-radius: var(--radius-full);
    border: 1px solid var(--glass-border);
  }

  .currency-pill {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-tertiary);
    background: transparent;
    transition: all var(--transition-fast);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .currency-pill:active {
    transform: scale(0.95);
  }

  .currency-pill.active {
    background: var(--color-green-muted);
    color: var(--color-green);
    box-shadow: 0 0 8px rgba(0, 200, 150, 0.15);
  }

  .pill-symbol {
    font-weight: var(--font-weight-bold);
  }
</style>
