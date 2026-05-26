-- Expense Tracker — initial schema (PostgreSQL / Supabase)

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_name_lower_idx
  ON categories (LOWER(name));

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL DEFAULT '',
  expense_type TEXT NOT NULL CHECK (expense_type IN ('shared', 'individual')),
  cost_type TEXT NOT NULL DEFAULT 'variable' CHECK (cost_type IN ('fixed', 'variable')),
  date DATE NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses (date DESC);
CREATE INDEX IF NOT EXISTS expenses_category_id_idx ON expenses (category_id);

CREATE TABLE IF NOT EXISTS monthly_budgets (
  month_key CHAR(7) PRIMARY KEY CHECK (month_key ~ '^\d{4}-\d{2}$'),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_income (
  month_key CHAR(7) PRIMARY KEY CHECK (month_key ~ '^\d{4}-\d{2}$'),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  savings_goal NUMERIC(12, 2) CHECK (savings_goal IS NULL OR savings_goal > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
