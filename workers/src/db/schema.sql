-- ============================================
-- Cuadre - Venezuelan Personal Finance App
-- D1 (SQLite) Database Schema
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  salt TEXT,
  google_id TEXT UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  preferred_currency TEXT DEFAULT 'VES' CHECK (preferred_currency IN ('VES', 'USD', 'USDT', 'EUR')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  color TEXT NOT NULL DEFAULT '#6B7280',
  is_default INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount REAL NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'VES' CHECK (currency IN ('VES', 'USD', 'USDT', 'EUR')),
  category_id TEXT,
  description TEXT,
  date TEXT NOT NULL DEFAULT (date('now')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'voice', 'ocr', 'notification', 'sylor')),
  reference TEXT,
  notes TEXT,
  synced INTEGER NOT NULL DEFAULT 1,
  deleted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_updated ON transactions(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted ON transactions(user_id, deleted);

-- Exchange rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  source TEXT NOT NULL CHECK (source IN ('bcv', 'binance', 'manual')),
  rate REAL NOT NULL,
  currency_from TEXT NOT NULL,
  currency_to TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rates_source ON exchange_rates(source, currency_from, currency_to);
CREATE INDEX IF NOT EXISTS idx_rates_fetched ON exchange_rates(fetched_at);

-- Sylor chat messages table
CREATE TABLE IF NOT EXISTS sylor_messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sylor_user ON sylor_messages(user_id, created_at);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  category_id TEXT,
  amount_limit REAL NOT NULL CHECK (amount_limit > 0),
  currency TEXT NOT NULL DEFAULT 'VES' CHECK (currency IN ('VES', 'USD', 'USDT', 'EUR')),
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('weekly', 'biweekly', 'monthly', 'yearly')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);

-- ============================================
-- Default Categories (shared across all users)
-- ============================================

-- Expense categories
INSERT OR IGNORE INTO categories (id, user_id, name, icon, color, is_default, type) VALUES
  ('cat-food',       NULL, 'Comida',         '🍔', '#EF4444', 1, 'expense'),
  ('cat-transport',  NULL, 'Transporte',     '🚗', '#F59E0B', 1, 'expense'),
  ('cat-home',       NULL, 'Hogar',          '🏠', '#3B82F6', 1, 'expense'),
  ('cat-health',     NULL, 'Salud',          '💊', '#10B981', 1, 'expense'),
  ('cat-education',  NULL, 'Educación',      '📚', '#8B5CF6', 1, 'expense'),
  ('cat-entertain',  NULL, 'Entretenimiento','🎮', '#EC4899', 1, 'expense'),
  ('cat-clothing',   NULL, 'Ropa',           '👕', '#F97316', 1, 'expense'),
  ('cat-services',   NULL, 'Servicios',      '💡', '#06B6D4', 1, 'expense'),
  ('cat-groceries',  NULL, 'Supermercado',   '🛒', '#84CC16', 1, 'expense'),
  ('cat-pets',       NULL, 'Mascotas',       '🐾', '#A855F7', 1, 'expense'),
  ('cat-personal',   NULL, 'Cuidado Personal','💅', '#FB7185', 1, 'expense'),
  ('cat-tech',       NULL, 'Tecnología',     '💻', '#6366F1', 1, 'expense'),
  ('cat-gifts',      NULL, 'Regalos',        '🎁', '#F43F5E', 1, 'expense'),
  ('cat-other-exp',  NULL, 'Otros Gastos',   '📦', '#6B7280', 1, 'expense');

-- Income categories
INSERT OR IGNORE INTO categories (id, user_id, name, icon, color, is_default, type) VALUES
  ('cat-salary',     NULL, 'Salario',        '💰', '#22C55E', 1, 'income'),
  ('cat-freelance',  NULL, 'Freelance',      '💼', '#14B8A6', 1, 'income'),
  ('cat-investment', NULL, 'Inversiones',    '📈', '#0EA5E9', 1, 'income'),
  ('cat-rental',     NULL, 'Alquiler',       '🏘️', '#A855F7', 1, 'income'),
  ('cat-remittance', NULL, 'Remesas',        '🌎', '#F59E0B', 1, 'income'),
  ('cat-bonus',      NULL, 'Bonos',          '🎉', '#EF4444', 1, 'income'),
  ('cat-other-inc',  NULL, 'Otros Ingresos', '✨', '#6B7280', 1, 'income');
