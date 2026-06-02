<script lang="ts">
  import SylorChat from '$lib/components/SylorChat.svelte';
  import { messages, isTyping, sendMessage } from '$lib/stores/sylor';
  import { tick, afterUpdate } from 'svelte';

  let inputValue = '';
  let messagesContainer: HTMLDivElement;

  const quickActions = [
    '¿Cómo voy este mes?',
    'Registrar gasto',
    'Ver tasas',
    'Resumen semanal',
  ];

  async function handleSend() {
    const text = inputValue.trim();
    if (!text) return;
    inputValue = '';
    await sendMessage(text);
  }

  function handleQuickAction(action: string) {
    inputValue = action;
    handleSend();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  afterUpdate(() => {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
</script>

<div class="sylor-page">
  <!-- Header -->
  <div class="sylor-header">
    <div class="header-left">
      <div class="sylor-avatar">
        <span>✨</span>
        <span class="online-dot"></span>
      </div>
      <div>
        <h1 class="header-title">Sylor S1</h1>
        <p class="header-status">
          {#if $isTyping}
            Escribiendo...
          {:else}
            En línea
          {/if}
        </p>
      </div>
    </div>
  </div>

  <!-- Messages -->
  <div class="messages-container" bind:this={messagesContainer}>
    {#each $messages as msg, i (msg.id)}
      <SylorChat message={msg} isLast={i === $messages.length - 1} />
    {/each}

    <!-- Typing Indicator -->
    {#if $isTyping}
      <div class="typing-indicator">
        <div class="typing-avatar">✨</div>
        <div class="typing-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Quick Actions -->
  {#if $messages.length <= 1}
    <div class="quick-actions">
      {#each quickActions as action}
        <button class="quick-chip" on:click={() => handleQuickAction(action)}>
          {action}
        </button>
      {/each}
    </div>
  {/if}

  <!-- Input -->
  <div class="input-area">
    <div class="input-wrapper">
      <input
        type="text"
        class="chat-input"
        placeholder="Escribe un mensaje..."
        bind:value={inputValue}
        on:keydown={handleKeydown}
        disabled={$isTyping}
      />
      <button
        class="send-btn"
        class:active={inputValue.trim().length > 0}
        on:click={handleSend}
        disabled={!inputValue.trim() || $isTyping}
      >
        ↑
      </button>
    </div>
  </div>
</div>

<style>
  .sylor-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
    max-width: var(--max-width);
    margin: 0 auto;
  }

  /* Header */
  .sylor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-4);
    border-bottom: 1px solid var(--glass-border);
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .sylor-avatar {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--gradient-green);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    box-shadow: var(--shadow-green-glow);
  }

  .online-dot {
    position: absolute;
    bottom: 1px;
    right: 1px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-green);
    border: 2px solid var(--bg-primary);
  }

  .header-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
  }

  .header-status {
    font-size: var(--font-size-xs);
    color: var(--color-green);
    font-weight: var(--font-weight-medium);
  }

  /* Messages */
  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
  }

  /* Typing Indicator */
  .typing-indicator {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-2);
    animation: fadeIn 200ms ease-out;
  }

  .typing-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-green-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
  }

  .typing-dots {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: var(--space-3) var(--space-4);
    background: rgba(0, 200, 150, 0.08);
    border: 1px solid rgba(0, 200, 150, 0.15);
    border-radius: var(--radius-xl);
    border-bottom-left-radius: var(--radius-sm);
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--color-green);
    animation: dotPulse 1.4s ease-in-out infinite;
  }

  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  /* Quick Actions */
  .quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    padding: 0 var(--space-4) var(--space-3);
    flex-shrink: 0;
  }

  .quick-chip {
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-full);
    background: var(--color-green-muted);
    color: var(--color-green);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border: 1px solid rgba(0, 200, 150, 0.2);
    cursor: pointer;
    transition: all var(--transition-fast);
    -webkit-tap-highlight-color: transparent;
  }

  .quick-chip:active {
    transform: scale(0.95);
    background: rgba(0, 200, 150, 0.25);
  }

  /* Input Area */
  .input-area {
    padding: var(--space-3) var(--space-4);
    padding-bottom: calc(var(--nav-height) + var(--space-3) + var(--safe-area-bottom));
    border-top: 1px solid var(--glass-border);
    background: var(--bg-primary);
    flex-shrink: 0;
  }

  .input-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
    background: var(--bg-secondary);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-full);
  }

  .chat-input {
    flex: 1;
    background: transparent;
    font-size: var(--font-size-base);
    color: var(--text-primary);
    padding: var(--space-1) 0;
  }

  .chat-input::placeholder {
    color: var(--text-tertiary);
  }

  .chat-input:disabled {
    opacity: 0.5;
  }

  .send-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--bg-elevated);
    color: var(--text-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }

  .send-btn.active {
    background: var(--gradient-green);
    color: var(--text-inverse);
    box-shadow: var(--shadow-green-glow);
  }

  .send-btn:active {
    transform: scale(0.9);
  }

  .send-btn:disabled {
    cursor: not-allowed;
  }
</style>
