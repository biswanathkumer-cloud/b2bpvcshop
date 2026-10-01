const encoder = new TextEncoder();
const SESSION_DAYS = 30;
const ADMIN_SESSION_SECONDS = 43200;
const LOGIN_LIMIT = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_USERNAME = 'owner';
const PBKDF2_ITERATIONS = 60000;
const loginAttempts = new Map();

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, address TEXT DEFAULT '', pin TEXT DEFAULT '', created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, token_hash TEXT NOT NULL UNIQUE, user_id INTEGER NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES customers(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS carts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, product_id TEXT NOT NULL, quantity INTEGER NOT NULL, updated_at TEXT NOT NULL, UNIQUE(user_id, product_id), FOREIGN KEY(user_id) REFERENCES customers(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, order_no TEXT NOT NULL UNIQUE, customer_id INTEGER NOT NULL, items_json TEXT NOT NULL, subtotal REAL NOT NULL, delivery REAL NOT NULL, total REAL NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER NOT NULL, type TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS admin_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, token_hash TEXT NOT NULL UNIQUE, admin_id INTEGER NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE CASCADE)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash)`
];

async function ensureSchema(env) {
  if (!env.DB) throw new Error('D1 binding DB is missing.');
  const marker = await env.DB.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='customers'`).first();
  if (marker) return;
  await env.DB.batch(SCHEMA.map(sql => env.DB.prepare(sql)));
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
  });
}

function b64(buf) {
  let s = '';
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s);
}
function unb64(s) {
  const bin = atob(s);
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
}
function randomToken() {
  const a = new Uint8Array(32);
  crypto.getRandomValues(a);
  return b64(a).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
}
async function sha256(s) { return crypto.subtle.digest('SHA-256', encoder.encode(s)); }
async function passwordHash(password, saltB64) {
  const salt = saltB64 ? unb64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2', salt, iterations:PBKDF2_ITERATIONS, hash:'SHA-256'}, key, 256);
  return {salt:b64(salt), hash:b64(bits)};
}
async function verifyPassword(password, salt, expected) {
  if (!salt || !expected) return false;
  const x = await passwordHash(password, salt);
  return x.hash === expected;
}
function validPassword(p) { return typeof p === 'string' && p.length >= 8 && p.length <= 128; }
function now() { return new Date().toISOString(); }
async function body(req) { try { return await req.json(); } catch { return {}; } }
function cleanPhone(v) { return String(v || '').replace(/\D/g,'').slice(-10); }
function cookie(name, value, maxAge) { return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`; }
function clearCookie(name) { return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`; }
function getCookie(req, name) {
  const c = req.headers.get('Cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&') + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}
function rateLimited(req) {
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
  const t = Date.now();
  const a = (loginAttempts.get(ip) || []).filter(x => t - x < LOGIN_WINDOW_MS);
  if (a.length >= LOGIN_LIMIT) { loginAttempts.set(ip, a); return true; }
  a.push(t); loginAttempts.set(ip, a); return false;
}
function publicUser(u) {
  return u ? {id:u.id,name:u.name,phone:u.phone,address:u.address||'',pin:u.pin||'',createdAt:u.created_at} : null;
}

async function userFromSession(req, env) {
  const token = getCookie(req, 'pvc_session');
  if (!token) return null;
  const hash = b64(await sha256(token));
  return await env.DB.prepare(`SELECT u.id,u.name,u.phone,u.address,u.pin,u.created_at FROM sessions s JOIN customers u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).bind(hash, now()).first();
}
async function requireUser(req, env) {
  const u = await userFromSession(req, env);
  if (!u) throw new Error('UNAUTHORIZED');
  return u;
}

async function ensureAdmin(env) {
  let row = await env.DB.prepare('SELECT * FROM admins WHERE username=?').bind(ADMIN_USERNAME).first();
  const initial = env.ADMIN_INITIAL_PASSWORD;
  if (!row) {
    if (!validPassword(initial)) throw new Error('ADMIN_INITIAL_PASSWORD secret is not configured or is too short.');
    const ph = await passwordHash(initial);
    const r = await env.DB.prepare(`INSERT INTO admins(username,password_hash,password_salt,created_at,updated_at) VALUES(?,?,?,?,?)`).bind(ADMIN_USERNAME,ph.hash,ph.salt,now(),now()).run();
    row = {id:r.meta.last_row_id, username:ADMIN_USERNAME, password_hash:ph.hash, password_salt:ph.salt};
  }
  return row;
}
async function adminFromSession(req, env) {
  const token = getCookie(req, 'admin_session');
  if (!token) return null;
  const hash = b64(await sha256(token));
  return await env.DB.prepare(`SELECT a.* FROM admins a JOIN admin_sessions s ON s.admin_id=a.id WHERE s.token_hash=? AND s.expires_at>?`).bind(hash,now()).first();
}
async function requireAdmin(req, env) {
  const a = await adminFromSession(req, env);
  if (!a) throw new Error('UNAUTHORIZED');
  return a;
}

async function api(req, env) {
  const {pathname:path} = new URL(req.url);

  if (req.method === 'GET' && path === '/api/health') {
    return json({ok:true, db:!!env.DB, assets:!!env.ASSETS, time:now()});
  }

  if (req.method === 'POST' && path === '/api/auth/register') {
    if (rateLimited(req)) return json({error:'Too many attempts. Please try again later.'},429);
    const b=await body(req), name=String(b.name||'').trim(), phone=cleanPhone(b.phone), password=String(b.password||'');
    if(name.length<2 || phone.length!==10 || !validPassword(password)) return json({error:'Name, valid 10-digit mobile and password (8-128 characters) are required.'},400);
    if(await env.DB.prepare('SELECT id FROM customers WHERE phone=?').bind(phone).first()) return json({error:'Account already exists. Please login.'},409);
    const ph=await passwordHash(password);
    const r=await env.DB.prepare(`INSERT INTO customers(name,phone,password_hash,password_salt,address,pin,created_at) VALUES(?,?,?,?,?,?,?)`).bind(name,phone,ph.hash,ph.salt,String(b.address||'').trim().slice(0,500),String(b.pin||'').replace(/\D/g,'').slice(0,6),now()).run();
    const id=r.meta.last_row_id, token=randomToken(), exp=new Date(Date.now()+SESSION_DAYS*86400000).toISOString();
    await env.DB.prepare(`INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)`).bind(b64(await sha256(token)),id,exp,now()).run();
    const u=await env.DB.prepare('SELECT id,name,phone,address,pin,created_at FROM customers WHERE id=?').bind(id).first();
    return json({user:publicUser(u)},200,{'Set-Cookie':cookie('pvc_session',token,SESSION_DAYS*86400)});
  }

  if (req.method === 'POST' && path === '/api/auth/login') {
    if (rateLimited(req)) return json({error:'Too many login attempts. Please try again later.'},429);
    const b=await body(req), phone=cleanPhone(b.phone), password=String(b.password||'');
    if(phone.length!==10 || !password) return json({error:'Invalid login details.'},401);
    const u=await env.DB.prepare('SELECT * FROM customers WHERE phone=?').bind(phone).first();
    if(!u || !(await verifyPassword(password,u.password_salt,u.password_hash))) return json({error:'Invalid mobile number or password.'},401);
    const token=randomToken(), exp=new Date(Date.now()+SESSION_DAYS*86400000).toISOString();
    await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').bind(b64(await sha256(token)),u.id,exp,now()).run();
    return json({user:publicUser(u)},200,{'Set-Cookie':cookie('pvc_session',token,SESSION_DAYS*86400)});
  }

  if (req.method === 'POST' && path === '/api/auth/logout') {
    const token=getCookie(req,'pvc_session');
    if(token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(b64(await sha256(token))).run();
    return json({ok:true},200,{'Set-Cookie':clearCookie('pvc_session')});
  }
  if (req.method === 'GET' && path === '/api/auth/me') return json({user:publicUser(await userFromSession(req,env))});

  if (req.method === 'POST' && path === '/api/admin/login') {
    if (rateLimited(req)) return json({error:'Too many login attempts. Please try again later.'},429);
    const b=await body(req), username=String(b.username||'').trim(), password=String(b.password||'');
    if(username!==ADMIN_USERNAME || !validPassword(password)) return json({error:'Invalid username or password.'},401);
    const row=await ensureAdmin(env);
    if(!(await verifyPassword(password,row.password_salt,row.password_hash))) return json({error:'Invalid username or password.'},401);
    const token=randomToken(), exp=new Date(Date.now()+ADMIN_SESSION_SECONDS*1000).toISOString();
    await env.DB.prepare('DELETE FROM admin_sessions WHERE expires_at<=?').bind(now()).run();
    await env.DB.prepare('INSERT INTO admin_sessions(admin_id,token_hash,expires_at,created_at) VALUES(?,?,?,?)').bind(row.id,b64(await sha256(token)),exp,now()).run();
    return json({ok:true,admin:{username:row.username}},200,{'Set-Cookie':cookie('admin_session',token,ADMIN_SESSION_SECONDS)});
  }
  if (req.method === 'POST' && path === '/api/admin/logout') {
    const token=getCookie(req,'admin_session');
    if(token) await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(b64(await sha256(token))).run();
    return json({ok:true},200,{'Set-Cookie':clearCookie('admin_session')});
  }
  if (req.method === 'GET' && path === '/api/admin/me') {
    const a=await adminFromSession(req,env);
    return a ? json({admin:{id:a.id,username:a.username}}) : json({admin:null},401);
  }
  if (req.method === 'PUT' && path === '/api/admin/password') {
    try {
      const a=await requireAdmin(req,env), b=await body(req), current=String(b.currentPassword||''), next=String(b.newPassword||'');
      if(!validPassword(next)) return json({error:'New password must be 8-128 characters.'},400);
      if(!(await verifyPassword(current,a.password_salt,a.password_hash))) return json({error:'Current password is incorrect.'},400);
      const ph=await passwordHash(next);
      await env.DB.prepare('UPDATE admins SET password_hash=?,password_salt=?,updated_at=? WHERE id=?').bind(ph.hash,ph.salt,now(),a.id).run();
      await env.DB.prepare('DELETE FROM admin_sessions WHERE admin_id=?').bind(a.id).run();
      return json({ok:true},200,{'Set-Cookie':clearCookie('admin_session')});
    } catch(e) { return json({error:e.message==='UNAUTHORIZED'?'Please login as owner.':'Unable to change password.'},401); }
  }

  if ((req.method==='PUT'||req.method==='PATCH') && path==='/api/account/profile') {
    try { const u=await requireUser(req,env), b=await body(req), name=String(b.name??u.name).trim(), address=String(b.address??u.address??'').trim().slice(0,500), pin=String(b.pin??u.pin??'').replace(/\D/g,'').slice(0,6); if(name.length<2)return json({error:'Name is required.'},400); await env.DB.prepare('UPDATE customers SET name=?,address=?,pin=? WHERE id=?').bind(name,address,pin,u.id).run(); const n=await env.DB.prepare('SELECT id,name,phone,address,pin,created_at FROM customers WHERE id=?').bind(u.id).first(); return json({user:publicUser(n)}); } catch(e){ return json({error:e.message==='UNAUTHORIZED'?'Please login.':'Unable to update profile.'},e.message==='UNAUTHORIZED'?401:500); }
  }
  if (req.method==='PUT' && path==='/api/account/password') {
    try { const u=await requireUser(req,env), b=await body(req), old=String(b.currentPassword||''), next=String(b.newPassword||''), row=await env.DB.prepare('SELECT * FROM customers WHERE id=?').bind(u.id).first(); if(!row || !(await verifyPassword(old,row.password_salt,row.password_hash)))return json({error:'Current password is incorrect.'},400); if(!validPassword(next))return json({error:'New password must be 8-128 characters.'},400); const ph=await passwordHash(next); await env.DB.prepare('UPDATE customers SET password_hash=?,password_salt=? WHERE id=?').bind(ph.hash,ph.salt,u.id).run(); return json({ok:true}); } catch(e){return json({error:e.message==='UNAUTHORIZED'?'Please login.':'Unable to change password.'},e.message==='UNAUTHORIZED'?401:500);}
  }

  if (path==='/api/cart' && req.method==='GET') { try{const u=await requireUser(req,env),r=await env.DB.prepare('SELECT product_id,quantity FROM carts WHERE user_id=? ORDER BY updated_at DESC').bind(u.id).all();return json({items:r.results||[]});}catch(e){return json({error:e.message==='UNAUTHORIZED'?'Please login.':'Unable to load cart.'},e.message==='UNAUTHORIZED'?401:500);} }
  if (path==='/api/cart' && req.method==='PUT') { try{const u=await requireUser(req,env),b=await body(req),items=Array.isArray(b.items)?b.items:[];await env.DB.prepare('DELETE FROM carts WHERE user_id=?').bind(u.id).run();for(const x of items){const pid=String(x.product_id??x.id??'').slice(0,120),qty=Math.max(1,Math.min(999,Number(x.quantity??x.qty)||1));if(pid)await env.DB.prepare('INSERT INTO carts(user_id,product_id,quantity,updated_at) VALUES(?,?,?,?)').bind(u.id,pid,qty,now()).run();}return json({ok:true});}catch(e){return json({error:e.message==='UNAUTHORIZED'?'Please login.':'Unable to save cart.'},e.message==='UNAUTHORIZED'?401:500);} }

  if (path==='/api/orders' && req.method==='GET') { try{const u=await requireUser(req,env),r=await env.DB.prepare('SELECT * FROM orders WHERE customer_id=? ORDER BY created_at DESC LIMIT 100').bind(u.id).all();return json({orders:r.results||[]});}catch(e){return json({error:e.message==='UNAUTHORIZED'?'Please login.':'Unable to load orders.'},e.message==='UNAUTHORIZED'?401:500);} }
  if (path==='/api/orders' && req.method==='POST') { try{const u=await requireUser(req,env),b=await body(req),items=Array.isArray(b.items)?b.items:[];if(!items.length)return json({error:'Cart is empty.'},400);let orderNo='WB-PVC-'+Date.now().toString().slice(-8)+'-'+Math.floor(Math.random()*100);await env.DB.prepare('INSERT INTO orders(order_no,customer_id,items_json,subtotal,delivery,total,status,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(orderNo,u.id,JSON.stringify(items).slice(0,200000),Number(b.subtotal)||0,Number(b.delivery)||0,Number(b.total)||0,'Order Received',now()).run();await env.DB.prepare('DELETE FROM carts WHERE user_id=?').bind(u.id).run();return json({orderNo});}catch(e){return json({error:e.message==='UNAUTHORIZED'?'Please login.':'Could not create order.'},e.message==='UNAUTHORIZED'?401:500);} }
  if (path==='/api/feedback' && req.method==='POST') { try{const u=await requireUser(req,env),b=await body(req),message=String(b.message||'').trim().slice(0,2000);if(!message)return json({error:'Message is required.'},400);await env.DB.prepare('INSERT INTO feedback(customer_id,type,message,created_at) VALUES(?,?,?,?)').bind(u.id,String(b.type||'feedback').slice(0,30),message,now()).run();return json({ok:true});}catch(e){return json({error:e.message==='UNAUTHORIZED'?'Please login.':'Unable to send message.'},e.message==='UNAUTHORIZED'?401:500);} }

  return null;
}

export default {
  async fetch(req, env) {
    try {
      if (new URL(req.url).pathname.startsWith('/api/')) {
        await ensureSchema(env);
        const result=await api(req,env);
        return result || json({error:'Not found'},404);
      }
      if (!env.ASSETS || typeof env.ASSETS.fetch !== 'function') return new Response('Website assets are not configured.',{status:500,headers:{'content-type':'text/plain;charset=utf-8'}});
      return env.ASSETS.fetch(req);
    } catch (e) {
      console.error('REQUEST_ERROR',e);
      return json({error:'Server error. Please try again.'},500);
    }
  }
};
