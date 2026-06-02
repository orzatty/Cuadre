// ============================================
// Cuadre API — Shared TypeScript Types
// ============================================

// ---------- Cloudflare Bindings ----------

export interface Env {
  DB: D1Database;
  RATES_CACHE: KVNamespace;
  AI: Ai;
  STORAGE: R2Bucket;
  JWT_SECRET: string;
  ENVIRONMENT: string;
}

// ---------- Database Models ----------

export interface User {
  id: string;
  email: string;
  password_hash: string | null;
  salt: string | null;
  google_id: string | null;
  display_name: string;
  avatar_url: string | null;
  preferred_currency: Currency;
  created_at: string;
  updated_at: string;
}

export type Currency = 'VES' | 'USD' | 'USDT' | 'EUR';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionSource = 'manual' | 'voice' | 'ocr' | 'notification' | 'sylor';
export type CategoryType = 'income' | 'expense';
export type BudgetPeriod = 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type RateSource = 'bcv' | 'binance' | 'manual';
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  category_id: string | null;
  description: string | null;
  date: string;
  source: TransactionSource;
  reference: string | null;
  notes: string | null;
  synced: number;
  deleted: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  is_default: number;
  type: CategoryType;
  created_at: string;
}

export interface ExchangeRate {
  id: string;
  source: RateSource;
  rate: number;
  currency_from: string;
  currency_to: string;
  fetched_at: string;
}

export interface SylorMessage {
  id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  metadata: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount_limit: number;
  currency: Currency;
  period: BudgetPeriod;
  created_at: string;
  updated_at: string;
}

// ---------- API Request Types ----------

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateTransactionRequest {
  type: TransactionType;
  amount: number;
  currency: Currency;
  category_id?: string;
  description?: string;
  date?: string;
  source?: TransactionSource;
  reference?: string;
  notes?: string;
}

export interface UpdateTransactionRequest {
  type?: TransactionType;
  amount?: number;
  currency?: Currency;
  category_id?: string | null;
  description?: string | null;
  date?: string;
  source?: TransactionSource;
  reference?: string | null;
  notes?: string | null;
}

export interface CreateCategoryRequest {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
}

export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  color?: string;
}

export interface SylorChatRequest {
  message: string;
  context?: {
    include_rates?: boolean;
    include_summary?: boolean;
  };
}

export interface SylorActionRequest {
  action: 'create_transaction';
  data: CreateTransactionRequest;
}

export interface CreateBudgetRequest {
  category_id?: string;
  amount_limit: number;
  currency: Currency;
  period: BudgetPeriod;
}

export interface SyncRequest {
  last_sync: string | null;
  changes: SyncChange[];
}

export interface SyncChange {
  table: 'transactions' | 'categories';
  action: 'create' | 'update' | 'delete';
  id: string;
  data?: Record<string, unknown>;
  updated_at: string;
}

// ---------- API Response Types ----------

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
}

export interface UserPublic {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  preferred_currency: Currency;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface TransactionSummary {
  total_income: number;
  total_expenses: number;
  net: number;
  currency: Currency;
  by_category: CategorySummary[];
}

export interface CategorySummary {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  total: number;
  count: number;
}

export interface RatesResponse {
  bcv_usd: number | null;
  bcv_eur: number | null;
  binance_usdt: number | null;
  updated_at: string | null;
}

export interface SyncResponse {
  server_changes: SyncChange[];
  server_time: string;
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  table: string;
  id: string;
  resolution: 'server_wins' | 'client_wins';
  server_data?: Record<string, unknown>;
}

// ---------- Parsed Sylor Transaction ----------

export interface ParsedTransaction {
  amount: number;
  currency: Currency;
  category: string;
  description: string;
  type: TransactionType;
}

export interface SylorChatResponse {
  reply: string;
  parsed_transaction?: ParsedTransaction;
  action_suggested?: boolean;
}

// ---------- Hono Context Variables ----------

export type AuthVariables = {
  userId: string;
  userEmail: string;
};
