<script lang="ts">
  import { page } from '$app/stores';
  import { isAuthenticated } from '$lib/stores/auth';

  const tabs = [
    { path: '/', label: 'Inicio', emoji: '🏠' },
    { path: '/transactions', label: 'Movimientos', emoji: '📊' },
    { path: '/sylor', label: 'Sylor', emoji: '✨', isSylor: true },
    { path: '/budget', label: 'Presupuesto', emoji: '💰' },
    { path: '/settings', label: 'Ajustes', emoji: '⚙️' },
  ];

  $: currentPath = $page.url.pathname;
  $: show = $isAuthenticated;

  function isActive(tabPath: string): boolean {
    if (tabPath === '/') return currentPath === '/';
    return currentPath.startsWith(tabPath);
  }
</script>

{#if show}
  <nav class="bottom-nav">
    <div class="nav-inner">
      {#each tabs as tab}
        <a
          href={tab.path}
          class="nav-tab"
          class:active={isActive(tab.path)}
          class:sylor-tab={tab.isSylor}
          data-sveltekit-preload-data
        >
          {#if tab.isSylor}
            <div class="sylor-button">
              <span class="sylor-emoji">{tab.emoji}</span>
            </div>
          {:else}
            <span class="tab-emoji">{tab.emoji}</span>
          {/if}
          <span class="tab-label" class:sylor-label={tab.isSylor}>{tab.label}</span>
        </a>
      {/each}
    </div>
  </nav>
{/if}

<style>
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: var(--z-nav);
    background: var(--glass-bg-strong);
    backdrop-filter: var(--glass-blur-strong);
    -webkit-backdrop-filter: var(--glass-blur-strong);
    border-top: 1px solid var(--glass-border);
    padding-bottom: var(--safe-area-bottom);
  }

  .nav-inner {
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    max-width: var(--max-width);
    margin: 0 auto;
    height: var(--nav-height);
    padding: 0 var(--space-2);
  }

  .nav-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    text-decoration: none;
    color: var(--text-tertiary);
    transition: color var(--transition-fast);
    position: relative;
    -webkit-tap-highlight-color: transparent;
    flex: 1;
  }

  .nav-tab.active {
    color: var(--color-green);
  }

  .tab-emoji {
    font-size: 1.35rem;
    transition: transform var(--transition-spring);
    line-height: 1;
  }

  .nav-tab.active .tab-emoji {
    transform: scale(1.15);
  }

  .tab-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    line-height: 1;
  }

  /* ── Sylor Center Button ── */
  .sylor-tab {
    position: relative;
    padding-top: 0;
  }

  .sylor-button {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--gradient-green);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    top: -12px;
    box-shadow: var(--shadow-green-glow-lg);
    transition: all var(--transition-spring);
    border: 3px solid var(--bg-primary);
  }

  .sylor-tab:active .sylor-button {
    transform: scale(0.9);
  }

  .sylor-tab.active .sylor-button {
    box-shadow:
      var(--shadow-green-glow-lg),
      0 0 50px rgba(0, 200, 150, 0.25);
  }

  .sylor-emoji {
    font-size: 1.5rem;
    line-height: 1;
  }

  .sylor-label {
    position: relative;
    top: -8px;
    color: var(--color-green) !important;
    font-weight: var(--font-weight-semibold);
  }

  /* Active indicator dot */
  .nav-tab.active::before {
    content: '';
    position: absolute;
    top: 4px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--color-green);
  }

  .sylor-tab.active::before {
    display: none;
  }
</style>
