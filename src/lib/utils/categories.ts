/**
 * Category definitions for transactions.
 * Each category has an emoji icon, a color, and a Spanish name.
 */

export type CategoryType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: CategoryType;
}

export const DEFAULT_CATEGORIES: Category[] = [
  // ── Expenses ──
  { id: 'comida', name: 'Comida', emoji: '🍔', color: '#FF6B6B', type: 'expense' },
  { id: 'transporte', name: 'Transporte', emoji: '🚗', color: '#4ECDC4', type: 'expense' },
  { id: 'salud', name: 'Salud', emoji: '💊', color: '#45B7D1', type: 'expense' },
  { id: 'hogar', name: 'Hogar', emoji: '🏠', color: '#96CEB4', type: 'expense' },
  { id: 'entretenimiento', name: 'Entretenimiento', emoji: '🎮', color: '#FFEAA7', type: 'expense' },
  { id: 'educacion', name: 'Educación', emoji: '📚', color: '#DDA0DD', type: 'expense' },
  { id: 'ropa', name: 'Ropa', emoji: '👕', color: '#FF85A2', type: 'expense' },
  { id: 'servicios', name: 'Servicios', emoji: '📱', color: '#778BEB', type: 'expense' },
  { id: 'mercado', name: 'Mercado', emoji: '🛒', color: '#F8B500', type: 'expense' },
  { id: 'mascotas', name: 'Mascotas', emoji: '🐾', color: '#C4A35A', type: 'expense' },
  { id: 'cafe', name: 'Café', emoji: '☕', color: '#A0522D', type: 'expense' },
  { id: 'gym', name: 'Gimnasio', emoji: '💪', color: '#2ECC71', type: 'expense' },
  { id: 'suscripciones', name: 'Suscripciones', emoji: '📺', color: '#E74C3C', type: 'expense' },
  { id: 'otros_gastos', name: 'Otros', emoji: '📦', color: '#95A5A6', type: 'expense' },

  // ── Income ──
  { id: 'sueldo', name: 'Sueldo', emoji: '💼', color: '#00C896', type: 'income' },
  { id: 'freelance', name: 'Freelance', emoji: '💻', color: '#00E6AC', type: 'income' },
  { id: 'negocio', name: 'Negocio', emoji: '🏪', color: '#FFB800', type: 'income' },
  { id: 'inversiones', name: 'Inversiones', emoji: '📈', color: '#2ECC71', type: 'income' },
  { id: 'transferencia', name: 'Transferencia', emoji: '🔄', color: '#3498DB', type: 'income' },
  { id: 'remesas', name: 'Remesas', emoji: '🌎', color: '#9B59B6', type: 'income' },
  { id: 'ventas', name: 'Ventas', emoji: '🏷️', color: '#E67E22', type: 'income' },
  { id: 'otros_ingresos', name: 'Otros', emoji: '✨', color: '#1ABC9C', type: 'income' },
];

/**
 * Get categories filtered by type.
 */
export function getCategoriesByType(type: CategoryType): Category[] {
  return DEFAULT_CATEGORIES.filter((c) => c.type === type);
}

/**
 * Find a category by its ID.
 */
export function getCategoryById(id: string): Category | undefined {
  return DEFAULT_CATEGORIES.find((c) => c.id === id);
}

/**
 * Get the emoji for a category ID.
 */
export function getCategoryEmoji(id: string): string {
  return getCategoryById(id)?.emoji ?? '📦';
}

/**
 * Get the display name for a category ID.
 */
export function getCategoryName(id: string): string {
  return getCategoryById(id)?.name ?? 'Otro';
}
