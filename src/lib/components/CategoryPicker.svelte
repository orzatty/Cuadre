<script lang="ts">
  import { DEFAULT_CATEGORIES, getCategoriesByType, type Category, type CategoryType } from '$lib/utils/categories';

  export let selected: string = '';
  export let type: CategoryType = 'expense';

  $: filteredCategories = getCategoriesByType(type);

  function select(cat: Category) {
    selected = cat.id;
  }
</script>

<div class="category-picker">
  <div class="category-grid">
    {#each filteredCategories as cat (cat.id)}
      <button
        class="category-item"
        class:active={selected === cat.id}
        on:click={() => select(cat)}
        style="--cat-color: {cat.color}"
      >
        <span class="cat-emoji">{cat.emoji}</span>
        <span class="cat-name">{cat.name}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .category-picker {
    width: 100%;
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-2);
  }

  .category-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-1);
    border-radius: var(--radius-lg);
    background: var(--bg-elevated);
    border: 2px solid transparent;
    transition: all var(--transition-fast);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .category-item:active {
    transform: scale(0.93);
  }

  .category-item.active {
    border-color: var(--color-green);
    background: var(--color-green-muted);
    box-shadow: 0 0 12px rgba(0, 200, 150, 0.2);
  }

  .cat-emoji {
    font-size: 1.5rem;
    line-height: 1;
  }

  .cat-name {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
    text-align: center;
    line-height: 1.2;
  }

  .category-item.active .cat-name {
    color: var(--color-green);
  }
</style>
