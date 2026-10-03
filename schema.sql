CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,password_salt TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_sessions(id INTEGER PRIMARY KEY AUTOINCREMENT,token_hash TEXT NOT NULL UNIQUE,admin_id INTEGER NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS site_config(id INTEGER PRIMARY KEY CHECK(id=1),config_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS guest_orders(id INTEGER PRIMARY KEY AUTOINCREMENT,order_no TEXT NOT NULL UNIQUE,customer_name TEXT NOT NULL,phone TEXT NOT NULL,address TEXT NOT NULL,pin TEXT NOT NULL,items_json TEXT NOT NULL,subtotal REAL NOT NULL,delivery REAL NOT NULL,total REAL NOT NULL,payment_txn TEXT DEFAULT '',payment_screenshot TEXT DEFAULT '',landmark TEXT DEFAULT '',email TEXT DEFAULT '',note TEXT DEFAULT '',status TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_guest_orders_created ON guest_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_guest_orders_phone ON guest_orders(phone);
