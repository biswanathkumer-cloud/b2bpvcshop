-- B2B PVC PRINTING SHOP - D1 schema
CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, address TEXT DEFAULT '', pin TEXT DEFAULT '', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, token_hash TEXT NOT NULL UNIQUE, user_id INTEGER NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES customers(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS carts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, product_id TEXT NOT NULL, quantity INTEGER NOT NULL, updated_at TEXT NOT NULL, UNIQUE(user_id,product_id), FOREIGN KEY(user_id) REFERENCES customers(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, order_no TEXT NOT NULL UNIQUE, customer_id INTEGER NOT NULL, items_json TEXT NOT NULL, subtotal REAL NOT NULL, delivery REAL NOT NULL, total REAL NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER NOT NULL, type TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, token_hash TEXT NOT NULL UNIQUE, admin_id INTEGER NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS guest_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  pin TEXT NOT NULL,
  items_json TEXT NOT NULL,
  subtotal REAL NOT NULL,
  delivery REAL NOT NULL,
  total REAL NOT NULL,
  payment_txn TEXT DEFAULT '',
  payment_screenshot TEXT DEFAULT '',
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS site_config (
  id INTEGER PRIMARY KEY CHECK(id=1),
  config_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_guest_orders_created ON guest_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_guest_orders_phone ON guest_orders(phone);
