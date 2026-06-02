<script lang="ts">
  import BalanceCard from '$lib/components/BalanceCard.svelte';
  import RateCard from '$lib/components/RateCard.svelte';
  import TransactionCard from '$lib/components/TransactionCard.svelte';
  import AddTransactionModal from '$lib/components/AddTransactionModal.svelte';
  import { user, isAuthenticated } from '$lib/stores/auth';
  import { sortedTransactions } from '$lib/stores/transactions';
  import { rates, rateChanges, lastUpdated } from '$lib/stores/rates';
  import { getGreeting } from '$lib/utils/date';
  import { formatTime } from '$lib/utils/date';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let showAddModal = false;

  $: greeting = getGreeting();
  $: recentTransactions = $sortedTransactions.slice(0, 5);
  $: userName = $user?.name ?? 'Usuario';

  onMount(() => {
    if (!$isAuthenticated) {
      goto('/auth/login');
    }
  });
</script>

{#if $isAuthenticated}
  <div class="page">
    <!-- Greeting -->
    <div class="page-header">
      <p class="greeting-text">{greeting}, 👋</p>
      <h1 class="greeting-name">{userName}</h1>
    </div>

    <!-- Balance -->
    <div class="section">
      <BalanceCard currency="USD" />
    </div>

    <!-- Exchange Rates -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">📈 Tasas de cambio</h2>
        <span class="section-link">{formatTime($lastUpdated)}</span>
      </div>
      <div class="rates-grid">
        <RateCard label="BCV USD" rate={$rates.bcvUsd} change={$rateChanges.bcvUsd} symbol="Bs." />
        <RateCard label="BCV EUR" rate={$rates.bcvEur} change={$rateChanges.bcvEur} symbol="Bs." />
        <RateCard label="Binance USDT" rate={$rates.binanceUsdt} change={$rateChanges.binanceUsdt} symbol="Bs." />
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Últimos movimientos</h2>
        <a href="/transactions" class="section-link">Ver todos →</a>
      </div>
      <div class="transactions-list">
        {#each recentTransactions as txn, i (txn.id)}
          <TransactionCard transaction={txn} index={i} />
        {/each}
        {#if recentTransactions.length === 0}
          <div class="empty-state">
            <span class="empty-state-emoji">📝</span>
            <p class="empty-state-title">Sin movimientos</p>
            <p class="empty-state-text">Agrega tu primer movimiento tocando el botón +</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- FAB -->
    <button class="fab" on:click={() => showAddModal = true}>+</button>

    <!-- Add Transaction Modal -->
    <AddTransactionModal bind:show={showAddModal} />
  </div>
{/if}

<style>
  .greeting-text {
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
  }

  .greeting-name {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--letter-spacing-tight);
    margin-top: var(--space-1);
  }

  .rates-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-3);
  }

  .transactions-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  @media (max-width: 400px) {
    .rates-grid {
      grid-template-columns: 1fr;
      gap: var(--space-2);
    }
  }
</style>
