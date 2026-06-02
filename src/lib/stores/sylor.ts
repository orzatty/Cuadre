/**
 * Sylor AI assistant store — chat messages and typing state.
 */
import { writable, derived } from 'svelte/store';

export interface SylorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO string
}

// ── Mock Responses ──
const SYLOR_RESPONSES: string[] = [
  '¡Hola! 👋 Soy Sylor, tu asistente financiero. Este mes llevas un buen ritmo de ahorro. Has gastado menos en comida comparado con el mes pasado. ¡Sigue así! 💪',
  'Según tus movimientos, tu categoría con mayor gasto este mes es **Mercado** con $45.00. Te recomiendo establecer un presupuesto si aún no lo has hecho. 📊',
  'Tu balance actual es positivo ✅. Has recibido $800.00 en ingresos y gastado $89.99 este mes. Eso te deja un margen de ahorro del 88.8%.',
  '¡Claro! He registrado tu gasto. Recuerda que puedes preguntarme cualquier cosa sobre tus finanzas. Estoy aquí para ayudarte. 💚',
  'La tasa BCV del dólar hoy está en Bs. 92.35 📈, con una variación de +0.45 respecto a ayer. El USDT en Binance está a Bs. 91.80.',
  'Tu presupuesto de **Comida** lleva un 6.9% de uso. Vas muy bien para el mes. Te quedan $74.50 disponibles en esa categoría. 🍔',
];

// ── Welcome Message ──
const WELCOME_MESSAGE: SylorMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Hola! ✨ Soy **Sylor**, tu asistente financiero personal. Puedo ayudarte a revisar tus gastos, registrar movimientos, consultar tasas de cambio y mucho más. ¿En qué te puedo ayudar hoy?',
  timestamp: new Date().toISOString(),
};

// ── State ──
export const messages = writable<SylorMessage[]>([WELCOME_MESSAGE]);
export const isTyping = writable(false);

// ── Derived ──
export const messageCount = derived(messages, ($msgs) => $msgs.length);

// ── Actions ──

let nextMsgId = 1;

/**
 * Send a user message and get a mock Sylor response.
 */
export async function sendMessage(content: string): Promise<void> {
  // Add user message
  const userMsg: SylorMessage = {
    id: `user-${nextMsgId++}`,
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
  };
  messages.update((prev) => [...prev, userMsg]);

  // Simulate Sylor thinking
  isTyping.set(true);
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1500));
  isTyping.set(false);

  // Pick a mock response
  const responseText = SYLOR_RESPONSES[Math.floor(Math.random() * SYLOR_RESPONSES.length)];
  const botMsg: SylorMessage = {
    id: `sylor-${nextMsgId++}`,
    role: 'assistant',
    content: responseText,
    timestamp: new Date().toISOString(),
  };
  messages.update((prev) => [...prev, botMsg]);
}

/**
 * Clear all chat messages (reset to welcome).
 */
export function clearChat(): void {
  messages.set([{
    ...WELCOME_MESSAGE,
    timestamp: new Date().toISOString(),
  }]);
}
