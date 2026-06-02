<script lang="ts">
  import { register, authError, isLoading, isAuthenticated } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let name = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let errorMsg = '';

  onMount(() => {
    isAuthenticated.subscribe(($auth) => {
      if ($auth) {
        goto('/');
      }
    })();
  });

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      errorMsg = 'Por favor completa todos los campos.';
      return;
    }

    if (password !== confirmPassword) {
      errorMsg = 'Las contraseñas no coinciden.';
      return;
    }

    errorMsg = '';

    const success = await register(name.trim(), email.trim(), password.trim());
    if (success) {
      goto('/');
    } else {
      errorMsg = $authError || 'Error al crear la cuenta. Intenta de nuevo.';
    }
  }
</script>

<div class="auth-page">
  <div class="auth-card glass-card">
    <div class="brand-header">
      <h1 class="brand-logo">Cuadre</h1>
      <p class="brand-tagline">Comienza a organizar tus finanzas hoy.</p>
    </div>

    <form class="auth-form" on:submit|preventDefault={handleRegister}>
      {#if errorMsg}
        <div class="error-banner">
          <span>⚠️</span> {errorMsg}
        </div>
      {/if}

      <div class="input-group">
        <label for="name" class="input-label">Nombre completo</label>
        <div class="input-wrapper">
          <span class="input-icon">👤</span>
          <input
            id="name"
            class="auth-input"
            type="text"
            placeholder="Juan Pérez"
            bind:value={name}
            disabled={$isLoading}
            required
          />
        </div>
      </div>

      <div class="input-group">
        <label for="email" class="input-label">Correo electrónico</label>
        <div class="input-wrapper">
          <span class="input-icon">📧</span>
          <input
            id="email"
            class="auth-input"
            type="email"
            placeholder="ejemplo@correo.com"
            bind:value={email}
            disabled={$isLoading}
            required
          />
        </div>
      </div>

      <div class="input-group">
        <label for="password" class="input-label">Contraseña</label>
        <div class="input-wrapper">
          <span class="input-icon">🔒</span>
          <input
            id="password"
            class="auth-input"
            type="password"
            placeholder="••••••••"
            bind:value={password}
            disabled={$isLoading}
            required
          />
        </div>
      </div>

      <div class="input-group">
        <label for="confirm-password" class="input-label">Confirmar contraseña</label>
        <div class="input-wrapper">
          <span class="input-icon">🔒</span>
          <input
            id="confirm-password"
            class="auth-input"
            type="password"
            placeholder="••••••••"
            bind:value={confirmPassword}
            disabled={$isLoading}
            required
          />
        </div>
      </div>

      <button type="submit" class="submit-btn" disabled={$isLoading}>
        {#if $isLoading}
          <div class="spinner"></div> Cargando...
        {:else}
          Crear Cuenta
        {/if}
      </button>
    </form>

    <div class="auth-footer">
      <p class="footer-text">¿Ya tienes una cuenta?</p>
      <a href="/auth/login" class="footer-link">Iniciar sesión aquí</a>
    </div>
  </div>
</div>

<style>
  .auth-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    min-height: 100dvh;
    padding: var(--space-4);
    background-color: var(--bg-primary);
  }

  .auth-card {
    width: 100%;
    max-width: 400px;
    padding: var(--space-6) var(--space-5);
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    animation: fadeIn 350ms ease-out;
  }

  .brand-header {
    text-align: center;
  }

  .brand-logo {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-extrabold);
    background: var(--gradient-green);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: var(--space-1);
    letter-spacing: var(--letter-spacing-tight);
  }

  .brand-tagline {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--color-red-muted);
    border: 1px solid rgba(255, 71, 87, 0.3);
    border-radius: var(--radius-lg);
    color: var(--color-red-light);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    animation: pulse 2s infinite;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .input-label {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    margin-bottom: 2px;
  }

  .input-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    background: var(--bg-secondary);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: 0 var(--space-4);
    height: 44px;
    transition: border-color var(--transition-fast);
  }

  .input-wrapper:focus-within {
    border-color: var(--color-green);
  }

  .input-icon {
    font-size: var(--font-size-md);
  }

  .auth-input {
    width: 100%;
    height: 100%;
    color: var(--text-primary);
    font-size: var(--font-size-base);
  }

  .auth-input::placeholder {
    color: var(--text-tertiary);
  }

  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    height: 48px;
    background: var(--gradient-green);
    color: var(--text-inverse);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-md);
    border-radius: var(--radius-xl);
    box-shadow: 0 4px 15px rgba(0, 200, 150, 0.25);
    margin-top: var(--space-3);
    transition: all var(--transition-fast);
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 200, 150, 0.35);
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top: 3px solid var(--text-inverse);
    border-radius: 50%;
    animation: rotate 0.8s linear infinite;
  }

  .auth-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--font-size-sm);
  }

  .footer-text {
    color: var(--text-secondary);
  }

  .footer-link {
    color: var(--color-green);
    font-weight: var(--font-weight-bold);
    transition: color var(--transition-fast);
  }

  .footer-link:hover {
    color: var(--color-green-light);
  }

  @keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
