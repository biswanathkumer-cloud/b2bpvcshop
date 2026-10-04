CREATE TABLE IF NOT EXISTS guest_orders(
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
 landmark TEXT DEFAULT '',
 email TEXT DEFAULT '',
 note TEXT DEFAULT '',
 delivery_id TEXT DEFAULT '',
 delivery_partner TEXT DEFAULT '',
 status TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS site_config(id INTEGER PRIMARY KEY CHECK(id=1),config_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS payment_settings(
 id INTEGER PRIMARY KEY CHECK(id=1),
 delivery_fee REAL NOT NULL DEFAULT 0,
 upi_id TEXT NOT NULL DEFAULT '',
 qr_code_url TEXT NOT NULL DEFAULT '',
 whatsapp_number TEXT NOT NULL DEFAULT '',
 discount_enabled INTEGER NOT NULL DEFAULT 1,
 discount_percent REAL NOT NULL DEFAULT 0,
 sale_enabled INTEGER NOT NULL DEFAULT 0,
 updated_at TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS site_assets(asset_key TEXT PRIMARY KEY,asset_data TEXT NOT NULL,mime_type TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS products(
 id TEXT PRIMARY KEY,
 title TEXT NOT NULL,
 tag TEXT DEFAULT '',
 mrp REAL NOT NULL,
 price REAL NOT NULL,
 offer_badge TEXT DEFAULT '',
 discount_percent REAL NOT NULL DEFAULT 0,
 description TEXT DEFAULT '',
 image_url TEXT DEFAULT '',
 image_asset_key TEXT DEFAULT '',
 image_asset_keys TEXT DEFAULT '[]',
 quantity_offers TEXT DEFAULT '[]',
 active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,password_salt TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_sessions(id INTEGER PRIMARY KEY AUTOINCREMENT,token_hash TEXT NOT NULL UNIQUE,admin_id INTEGER NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS customer_sessions(id INTEGER PRIMARY KEY AUTOINCREMENT,token_hash TEXT NOT NULL UNIQUE,customer_name TEXT NOT NULL,phone TEXT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS support_messages(id INTEGER PRIMARY KEY AUTOINCREMENT,customer_name TEXT NOT NULL,phone TEXT NOT NULL,email TEXT DEFAULT '',type TEXT NOT NULL,subject TEXT DEFAULT '',message TEXT NOT NULL,order_no TEXT DEFAULT '',status TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_guest_orders_created ON guest_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_guest_orders_phone ON guest_orders(phone);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

CREATE TABLE IF NOT EXISTS coupons(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 code TEXT NOT NULL UNIQUE,
 discount_type TEXT NOT NULL DEFAULT 'percent',
 discount_value REAL NOT NULL DEFAULT 0,
 min_qty INTEGER NOT NULL DEFAULT 1,
 min_amount REAL NOT NULL DEFAULT 0,
 max_uses INTEGER NOT NULL DEFAULT 0,
 used_count INTEGER NOT NULL DEFAULT 0,
 active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL
);
