<script lang="ts">
  import { user, logout } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  let notificationsEnabled = true;
  let dailyReminder = false;

  function handleLogout() {
    logout();
    goto('/auth/login');
  }

  $: initials = $user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U';
</script>

<div class="page">
  <div class="page-header">
    <h1 class="page-title">Ajustes</h1>
  </div>

  <!-- Profile Section -->
  <div class="profile-card glass-card">
    <div class="avatar-circle">
      <span class="avatar-initials">{initials}</span>
    </div>
    <div class="profile-info">
      <p class="profile-name">{$user?.name ?? 'Usuario'}</p>
      <p class="profile-email">{$user?.email ?? 'usuario@email.com'}</p>
    </div>
    <button class="edit-btn">✏️</button>
  </div>

  <!-- General -->
  <div class="settings-group">
    <p class="group-label">General</p>
    <div class="settings-card">
      <div class="setting-item">
        <div class="setting-left">
          <span class="setting-emoji">💱</span>
          <div>
            <p class="setting-name">Moneda principal</p>
            <p class="setting-value">USD — Dólares</p>
          </div>
        </div>
        <span class="setting-arrow">›</span>
      </div>
      <div class="divider"></div>
      <div class="setting-item">
        <div class="setting-left">
          <span class="setting-emoji">🌐</span>
          <div>
            <p class="setting-name">Idioma</p>
            <p class="setting-value">Español</p>
          </div>
        </div>
        <span class="setting-arrow">›</span>
      </div>
    </div>
  </div>

  <!-- Data -->
  <div class="settings-group">
    <p class="group-label">Datos</p>
    <div class="settings-card">
      <div class="setting-item">
        <div class="setting-left">
          <span class="setting-emoji">📤</span>
          <div>
            <p class="setting-name">Exportar datos</p>
            <p class="setting-value">CSV, JSON</p>
          </div>
        </div>
        <span class="setting-arrow">›</span>
      </div>
      <div class="divider"></div>
      <div class="setting-item">
        <div class="setting-left">
          <span class="setting-emoji">📥</span>
          <div>
            <p class="setting-name">Importar datos</p>
            <p class="setting-value">Desde archivo</p>
          </div>
        </div>
        <span class="setting-arrow">›</span>
      </div>
    </div>
  </div>

  <!-- Notifications -->
  <div class="settings-group">
    <p class="group-label">Notificaciones</p>
    <div class="settings-card">
      <div class="setting-item">
        <div class="setting-left">
          <span class="setting-emoji">🔔</span>
          <p class="setting-name">Notificaciones</p>
        </div>
        <button
          class="toggle"
          class:active={notificationsEnabled}
          on:click={() => notificationsEnabled = !notificationsEnabled}
        ></button>
      </div>
      <div class="divider"></div>
      <div class="setting-item">
        <div class="setting-left">
          <span class="setting-emoji">⏰</span>
          <p class="setting-name">Recordatorio diario</p>
        </div>
        <button
          class="toggle"
          class:active={dailyReminder}
          on:click={() => dailyReminder = !dailyReminder}
        ></button>
      </div>
    </div>
  </div>

  <!-- About -->
  <div class="settings-group">
    <p class="group-label">Sobre</p>
    <div class="settings-card">
      <div class="setting-item">
        <div class="setting-left">
          <span class="setting-emoji">📱</span>
          <div>
            <p class="setting-name">Versión</p>
            <p class="setting-value">0.1.0 (Beta)</p>
          </div>
        </div>
      </div>
      <div class="divider"></div>
      <div class="setting-item">
        <div class="setting-left">
          <span class="setting-emoji">📄</span>
          <p class="setting-name">Términos de uso</p>
        </div>
        <span class="setting-arrow">›</span>
      </div>
      <div class="divider"></div>
      <div class="setting-item">
        <div class="setting-left">
          <span class="setting-emoji">🔒</span>
          <p class="setting-name">Política de privacidad</p>
        </div>
        <span class="setting-arrow">›</span>
      </div>
    </div>
  </div>

  <!-- Logout -->
  <button class="logout-btn" on:click={handleLogout}>
    Cerrar sesión
  </button>

  <p class="footer-text">Hecho con 💚 en Venezuela</p>
</div>

<style>
  .profile-card {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
  }

  .avatar-circle {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--gradient-green);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .avatar-initials {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-inverse);
  }

  .profile-info {
    flex: 1;
    min-width: 0;
  }

  .profile-name {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
  }

  .profile-email {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .edit-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--bg-elevated);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: var(--font-size-base);
  }

  .settings-group {
    margin-bottom: var(--space-5);
  }

  .group-label {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    margin-bottom: var(--space-3);
    padding-left: var(--space-1);
  }

  .settings-card {
    background: var(--bg-secondary);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    overflow: hidden;
  }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .setting-item:active {
    background: var(--bg-hover);
  }

  .setting-left {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex: 1;
    min-width: 0;
  }

  .setting-emoji {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .setting-name {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
  }

  .setting-value {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    margin-top: 2px;
  }

  .setting-arrow {
    font-size: var(--font-size-xl);
    color: var(--text-tertiary);
    flex-shrink: 0;
  }

  .logout-btn {
    width: 100%;
    padding: var(--space-4);
    border-radius: var(--radius-xl);
    background: var(--color-red-muted);
    color: var(--color-red);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition: all var(--transition-fast);
    margin-top: var(--space-2);
    margin-bottom: var(--space-6);
  }

  .logout-btn:active {
    transform: scale(0.98);
    background: rgba(255, 71, 87, 0.2);
  }

  .footer-text {
    text-align: center;
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
    padding-bottom: var(--space-4);
  }
</style>
