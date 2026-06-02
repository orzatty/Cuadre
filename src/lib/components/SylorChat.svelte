<script lang="ts">
  import type { SylorMessage } from '$lib/stores/sylor';
  import { formatTime } from '$lib/utils/date';

  export let message: SylorMessage;
  export let isLast: boolean = false;

  $: isUser = message.role === 'user';
</script>

<div class="chat-message" class:user={isUser} class:assistant={!isUser} class:last={isLast}>
  {#if !isUser}
    <div class="avatar">
      <span>✨</span>
    </div>
  {/if}
  <div class="bubble" class:user-bubble={isUser} class:bot-bubble={!isUser}>
    <p class="bubble-text">{@html message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
    <span class="bubble-time">{formatTime(message.timestamp)}</span>
  </div>
</div>

<style>
  .chat-message {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
    animation: slideUp 250ms ease-out both;
  }

  .chat-message.user {
    justify-content: flex-end;
  }

  .chat-message.assistant {
    justify-content: flex-start;
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-green-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    flex-shrink: 0;
    align-self: flex-end;
  }

  .bubble {
    max-width: 80%;
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-xl);
    position: relative;
  }

  .user-bubble {
    background: var(--bg-elevated);
    border: 1px solid var(--glass-border);
    border-bottom-right-radius: var(--radius-sm);
  }

  .bot-bubble {
    background: rgba(0, 200, 150, 0.08);
    border: 1px solid rgba(0, 200, 150, 0.15);
    border-bottom-left-radius: var(--radius-sm);
  }

  .bubble-text {
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
    word-wrap: break-word;
  }

  .bubble-text :global(strong) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-green);
  }

  .bubble-time {
    display: block;
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    margin-top: var(--space-1);
    text-align: right;
  }
</style>
