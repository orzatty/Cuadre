/**
 * Date formatting utilities — all in Spanish.
 */

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const DAY_NAMES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
];

/**
 * Get month name in Spanish (0-indexed).
 */
export function getMonthName(month: number, short = false): string {
  return short ? MONTH_NAMES_SHORT[month] : MONTH_NAMES[month];
}

/**
 * Get day name in Spanish.
 */
export function getDayName(day: number): string {
  return DAY_NAMES[day];
}

/**
 * Format a date as "15 de Junio, 2026".
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate();
  const month = getMonthName(d.getMonth());
  const year = d.getFullYear();
  return `${day} de ${month}, ${year}`;
}

/**
 * Format a date as short "15 Jun".
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getDate()} ${getMonthName(d.getMonth(), true)}`;
}

/**
 * Format a relative date: "Hoy", "Ayer", or "15 Jun".
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';

  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return getDayName(d.getDay());
  }

  return formatDateShort(d);
}

/**
 * Format time as "14:30".
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Check if a date is today.
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

/**
 * Check if a date is yesterday.
 */
export function isYesterday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Check if a date is in the current month.
 */
export function isThisMonth(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

/**
 * Get "Month Year" string, e.g. "Junio 2026".
 */
export function getMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${getMonthName(d.getMonth())} ${d.getFullYear()}`;
}

/**
 * Get greeting based on time of day.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}
