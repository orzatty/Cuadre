/**
 * Auth store — user state, JWT, login/logout.
 * Uses Svelte writable stores for cross-component reactivity.
 */
import { writable, derived } from 'svelte/store';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  preferredCurrency: 'VES' | 'USD' | 'USDT';
}

// ── State ──
export const user = writable<User | null>(null);
export const token = writable<string | null>(null);
export const isLoading = writable(false);
export const authError = writable<string | null>(null);

// ── Derived ──
export const isAuthenticated = derived(user, ($user) => $user !== null);

// ── Actions ──

/**
 * Login with email and password.
 * For now, uses mock data — no real API call.
 */
export async function login(email: string, _password: string): Promise<boolean> {
  isLoading.set(true);
  authError.set(null);

  try {
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800));

    // Mock: accept any email/password
    const mockUser: User = {
      id: '1',
      name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      preferredCurrency: 'USD',
    };
    const mockToken = 'mock-jwt-token-' + Date.now();

    user.set(mockUser);
    token.set(mockToken);

    // Persist to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cuadre_user', JSON.stringify(mockUser));
      localStorage.setItem('cuadre_token', mockToken);
    }

    return true;
  } catch (e) {
    authError.set('Error al iniciar sesión. Intenta de nuevo.');
    return false;
  } finally {
    isLoading.set(false);
  }
}

/**
 * Register a new user.
 */
export async function register(name: string, email: string, _password: string): Promise<boolean> {
  isLoading.set(true);
  authError.set(null);

  try {
    await new Promise((r) => setTimeout(r, 800));

    const mockUser: User = {
      id: '1',
      name,
      email,
      preferredCurrency: 'USD',
    };
    const mockToken = 'mock-jwt-token-' + Date.now();

    user.set(mockUser);
    token.set(mockToken);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cuadre_user', JSON.stringify(mockUser));
      localStorage.setItem('cuadre_token', mockToken);
    }

    return true;
  } catch (e) {
    authError.set('Error al registrarse. Intenta de nuevo.');
    return false;
  } finally {
    isLoading.set(false);
  }
}

/**
 * Logout and clear state.
 */
export function logout(): void {
  user.set(null);
  token.set(null);

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('cuadre_user');
    localStorage.removeItem('cuadre_token');
  }
}

/**
 * Restore session from localStorage on app start.
 */
export function restoreSession(): void {
  if (typeof localStorage === 'undefined') return;

  const savedUser = localStorage.getItem('cuadre_user');
  const savedToken = localStorage.getItem('cuadre_token');

  if (savedUser && savedToken) {
    try {
      user.set(JSON.parse(savedUser));
      token.set(savedToken);
    } catch {
      // Corrupted data, clear
      localStorage.removeItem('cuadre_user');
      localStorage.removeItem('cuadre_token');
    }
  }
}
