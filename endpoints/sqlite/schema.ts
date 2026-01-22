/**
 * Database schema definitions and types
 */

export interface User {
  id: number;
  backend_user_id?: number; // Backend pos_system user ID
  email: string;
  name: string;
  password_hash: string;
  role: 'admin' | 'manager' | 'cashier' | 'developer';
  is_active: number; // SQLite boolean (0/1)
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  category: string | null;
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock_level: number;
  image_url: string | null;
  is_active: number; // SQLite boolean (0/1)
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  receipt_number: string;
  cashier_id: number;
  total_amount: number;
  tax_amount: number;
  payment_method: 'cash' | 'card' | 'mobile';
  payment_reference: string | null;
  status: 'completed' | 'voided' | 'refunded';
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

export interface TransactionItem {
  id: number;
  transaction_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface InventoryAdjustment {
  id: number;
  product_id: number;
  adjustment_type: 'add' | 'remove' | 'set';
  quantity: number;
  reason: string;
  user_id: number;
  created_at: string;
}

export interface SyncQueue {
  id: number;
  entity_type: 'transaction' | 'product' | 'user' | 'inventory';
  entity_id: number;
  operation: 'create' | 'update' | 'delete';
  payload: string; // JSON string
  retry_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string | null; // JSON string
  ip_address: string | null;
  created_at: string;
}

/**
 * SQL schema for all tables
 */
export const SQL_SCHEMA = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'cashier', 'developer')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Example table (for demo/todo features)
CREATE TABLE IF NOT EXISTS example (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  category TEXT,
  price REAL NOT NULL,
  cost REAL NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_number TEXT NOT NULL UNIQUE,
  cashier_id INTEGER NOT NULL,
  total_amount REAL NOT NULL,
  tax_amount REAL NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'card', 'mobile')),
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed', 'voided', 'refunded')),
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('pending', 'synced', 'failed')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  synced_at DATETIME,
  FOREIGN KEY (cashier_id) REFERENCES users(id)
);

-- Transaction items table
CREATE TABLE IF NOT EXISTS transaction_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Inventory adjustments table
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  adjustment_type TEXT NOT NULL CHECK(adjustment_type IN ('add', 'remove', 'set')),
  quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sync queue table
CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('transaction', 'product', 'user', 'inventory')),
  entity_id INTEGER NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'delete')),
  payload TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_example_completed ON example(completed);
CREATE INDEX IF NOT EXISTS idx_example_created_at ON example(created_at);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE INDEX IF NOT EXISTS idx_transactions_receipt_number ON transactions(receipt_number);
CREATE INDEX IF NOT EXISTS idx_transactions_cashier_id ON transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_sync_status ON transactions(sync_status);

CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON transaction_items(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product_id ON inventory_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_created_at ON inventory_adjustments(created_at);

CREATE INDEX IF NOT EXISTS idx_sync_queue_entity_type ON sync_queue(entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_queue_entity_id ON sync_queue(entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_sync_status ON sync_queue(retry_count);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Default users (password is 'password123' for all accounts)
-- Admin user
INSERT OR IGNORE INTO users (email, name, password_hash, role, is_active) VALUES 
('admin@pos.com', 'System Administrator', 'hashed_password123_demo', 'admin', 1);

-- Manager user
INSERT OR IGNORE INTO users (email, name, password_hash, role, is_active) VALUES 
('manager@pos.com', 'Store Manager', 'hashed_password123_demo', 'manager', 1);

-- Cashier user
INSERT OR IGNORE INTO users (email, name, password_hash, role, is_active) VALUES 
('cashier@pos.com', 'Store Cashier', 'hashed_password123_demo', 'cashier', 1);
`;

