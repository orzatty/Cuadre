<script lang="ts">
  import TransactionCard from '$lib/components/TransactionCard.svelte';
  import CurrencySelector from '$lib/components/CurrencySelector.svelte';
  import AddTransactionModal from '$lib/components/AddTransactionModal.svelte';
  import { sortedTransactions } from '$lib/stores/transactions';
  import type { Transaction } from '$lib/stores/transactions';
  import type { CurrencyCode } from '$lib/utils/currency';
  import { formatRelativeDate } from '$lib/utils/date';

  let showAddModal = false;
  let searchQuery = '';
  let activeFilter: 'all' | 'income' | 'expense' = 'all';
  let selectedCurrency: CurrencyCode = 'USD';

  $: filtered = $sortedTransactions.filter((t) => {
    const matchesType = activeFilter === 'all' || t.type === activeFilter;
    const matchesSearch = !searchQuery || t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Group by relative date
  interface DateGroup {
    label: string;
    transactions: Transaction[];
  }

  $: grouped = (() => {
    const groups: DateGroup[] = [];
    let currentLabel = '';
    for (const t of filtered) {
      const label = formatRelativeDate(t.date);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, transactions: [] });
      }
      groups[groups.length - 1].transactions.push(t);
    }
    return groups;
  })();

  const filters = [
    { key: 'all' as const, label: 'Todos' },
    { key: 'income' as const, label: 'Ingresos' },
    { key: 'expense' as const, label: 'Gastos' },
  ];
</script>

<div class="page">
  <div class="page-header">
    <h1 class="page-title">Movimientos</h1>
    <p class="page-subtitle">Historial de ingresos y gastos</p>
  </div>

  <!-- Search -->
  <div class="search-bar">
    <span class="search-icon">🔍</span>
    <input
      class="search-input"
      type="text"
      placeholder="Buscar movimiento..."
      bind:value={searchQuery}
    />
  </div>

  <!-- Filter Chips -->
  <div class="filter-row">
    <div class="chips-row">
      {#each filters as f}
        <button
          class="chip"
          class:chip-active={activeFilter === f.key}
          on:click={() => activeFilter = f.key}
        >
          {f.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Transactions -->
  {#if grouped.length > 0}
    {#each grouped as group}
      <div class="date-group">
        <p class="date-label">{group.label}</p>
        <div class="transactions-list">
          {#each group.transactions as txn, i (txn.id)}
            <TransactionCard transaction={txn} index={i} />
          {/each}
        </div>
      </div>
    {/each}
  {:else}
    <div class="empty-state">
      <span class="empty-state-emoji">📭</span>
      <p class="empty-state-title">No hay movimientos</p>
      <p class="empty-state-text">
        {#if searchQuery}
          No se encontraron resultados para "{searchQuery}"
        {:else}
          Agrega tu primer movimiento tocando el botón +
        {/if}
      </p>
    </div>
  {/if}

  <!-- FAB -->
  <button class="fab" on:click={() => showAddModal = true}>+</button>
  <AddTransactionModal bind:show={showAddModal} />
</div>

<style>
  .search-bar {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: var(--bg-secondary);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    margin-bottom: var(--space-4);
  }

  .search-icon {
    font-size: var(--font-size-base);
    opacity: 0.5;
  }

  .search-input {
    flex: 1;
    background: transparent;
    font-size: var(--font-size-base);
    color: var(--text-primary);
  }

  .search-input::placeholder {
    color: var(--text-tertiary);
  }

  .filter-row {
    margin-bottom: var(--space-5);
  }

  .chips-row {
    display: flex;
    gap: var(--space-2);
  }

  .date-group {
    margin-bottom: var(--space-5);
  }

  .date-label {
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    margin-bottom: var(--space-3);
    padding-left: var(--space-1);
  }

  .transactions-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
</style>
