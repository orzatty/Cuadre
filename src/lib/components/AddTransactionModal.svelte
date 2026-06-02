<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import CategoryPicker from './CategoryPicker.svelte';
  import CurrencySelector from './CurrencySelector.svelte';
  import { addTransaction } from '$lib/stores/transactions';
  import type { CurrencyCode } from '$lib/utils/currency';
  import type { CategoryType } from '$lib/utils/categories';

  export let show = false;

  const dispatch = createEventDispatcher<{ close: void }>();

  let amount = '';
  let description = '';
  let selectedCategory = '';
  let selectedCurrency: CurrencyCode = 'USD';
  let transactionType: CategoryType = 'expense';
  let dateValue = new Date().toISOString().split('T')[0];

  function close() {
    show = false;
    dispatch('close');
  }

  function handleSave() {
    const numAmount = parseFloat(amount);
    if (!numAmount || !selectedCategory || !description.trim()) return;

    addTransaction({
      type: transactionType,
      categoryId: selectedCategory,
      description: description.trim(),
      amount: numAmount,
      currency: selectedCurrency,
      date: new Date(dateValue).toISOString(),
    });

    // Reset form
    amount = '';
    description = '';
    selectedCategory = '';
    dateValue = new Date().toISOString().split('T')[0];
    close();
  }

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) close();
  }

  $: isValid = parseFloat(amount) > 0 && selectedCategory && description.trim();
</script>

{#if show}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modal-overlay" on:click={handleOverlayClick}>
    <div class="modal-sheet">
      <!-- Handle -->
      <div class="sheet-handle-wrapper">
        <div class="sheet-handle"></div>
      </div>

      <!-- Header -->
      <div class="sheet-header">
        <button class="close-btn" on:click={close}>✕</button>
        <h2 class="sheet-title">Nuevo movimiento</h2>
        <div style="width: 32px"></div>
      </div>

      <!-- Type Toggle -->
      <div class="type-toggle">
        <button
          class="toggle-btn"
          class:active={transactionType === 'expense'}
          class:expense-active={transactionType === 'expense'}
          on:click={() => { transactionType = 'expense'; selectedCategory = ''; }}
        >
          Gasto
        </button>
        <button
          class="toggle-btn"
          class:active={transactionType === 'income'}
          class:income-active={transactionType === 'income'}
          on:click={() => { transactionType = 'income'; selectedCategory = ''; }}
        >
          Ingreso
        </button>
      </div>

      <!-- Amount Input -->
      <div class="amount-section">
        <span class="amount-currency">{selectedCurrency === 'VES' ? 'Bs.' : selectedCurrency === 'USDT' ? '₮' : '$'}</span>
        <input
          class="amount-input"
          type="number"
          inputmode="decimal"
          placeholder="0.00"
          bind:value={amount}
          step="0.01"
        />
      </div>

      <!-- Currency Selector -->
      <div class="field-section">
        <CurrencySelector bind:selected={selectedCurrency} />
      </div>

      <!-- Description -->
      <div class="field-section">
        <input
          class="input"
          type="text"
          placeholder="Descripción del movimiento"
          bind:value={description}
        />
      </div>

      <!-- Date -->
      <div class="field-section">
        <input
          class="input"
          type="date"
          bind:value={dateValue}
        />
      </div>

      <!-- Category Picker -->
      <div class="field-section">
        <p class="field-label">Categoría</p>
        <CategoryPicker bind:selected={selectedCategory} type={transactionType} />
      </div>

      <!-- Save Button -->
      <div class="save-section">
        <button
          class="save-btn"
          class:disabled={!isValid}
          on:click={handleSave}
          disabled={!isValid}
        >
          Guardar movimiento
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: var(--bg-modal-overlay);
    z-index: var(--z-modal-overlay);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    animation: fadeIn 200ms ease-out;
  }

  .modal-sheet {
    width: 100%;
    max-width: var(--max-width);
    max-height: 92vh;
    background: var(--bg-primary);
    border-radius: var(--radius-3xl) var(--radius-3xl) 0 0;
    padding: 0 var(--space-5) var(--space-8);
    overflow-y: auto;
    animation: slideUp 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .sheet-handle-wrapper {
    display: flex;
    justify-content: center;
    padding: var(--space-3) 0;
  }

  .sheet-handle {
    width: 36px;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--bg-hover);
  }

  .sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-5);
  }

  .sheet-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--bg-elevated);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .close-btn:active {
    background: var(--bg-hover);
  }

  .type-toggle {
    display: flex;
    gap: var(--space-2);
    padding: var(--space-1);
    background: var(--bg-secondary);
    border-radius: var(--radius-full);
    margin-bottom: var(--space-5);
  }

  .toggle-btn {
    flex: 1;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-full);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--text-tertiary);
    background: transparent;
    transition: all var(--transition-fast);
    cursor: pointer;
  }

  .toggle-btn.expense-active {
    background: var(--color-red-muted);
    color: var(--color-red);
  }

  .toggle-btn.income-active {
    background: var(--color-green-muted);
    color: var(--color-green);
  }

  .amount-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    margin-bottom: var(--space-5);
    padding: var(--space-4) 0;
  }

  .amount-currency {
    font-size: var(--font-size-2xl);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
  }

  .amount-input {
    font-size: var(--font-size-5xl);
    font-weight: var(--font-weight-bold);
    text-align: center;
    max-width: 200px;
    background: transparent;
    letter-spacing: var(--letter-spacing-tight);
    color: var(--text-primary);
  }

  .amount-input::placeholder {
    color: var(--text-disabled);
  }

  /* Remove number input arrows */
  .amount-input::-webkit-inner-spin-button,
  .amount-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .amount-input[type='number'] {
    -moz-appearance: textfield;
  }

  .field-section {
    margin-bottom: var(--space-4);
  }

  .field-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
    margin-bottom: var(--space-3);
  }

  .save-section {
    padding-top: var(--space-4);
    padding-bottom: var(--safe-area-bottom);
  }

  .save-btn {
    width: 100%;
    padding: var(--space-4);
    border-radius: var(--radius-xl);
    background: var(--gradient-green);
    color: var(--text-inverse);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    transition: all var(--transition-base);
    box-shadow: var(--shadow-green-glow);
  }

  .save-btn:active {
    transform: scale(0.98);
  }

  .save-btn.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
  }
</style>
