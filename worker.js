const encoder=new TextEncoder();
const ADMIN_USERNAME='owner';
const LOGIN_LIMIT=8; const loginAttempts=new Map();
const now=()=>new Date().toISOString();
function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}})}
function b64(buf){let s='';for(const b of new Uint8Array(buf))s+=String.fromCharCode(b);return btoa(s)}
function unb64(s){const x=atob(s),a=new Uint8Array(x.length);for(let i=0;i<x.length;i++)a[i]=x.charCodeAt(i);return a}
function randomToken(){const a=new Uint8Array(32);crypto.getRandomValues(a);return b64(a).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}
async function sha256(s){return crypto.subtle.digest('SHA-256',encoder.encode(s))}
async function passwordHash(password,saltB64){const salt=saltB64?unb64(saltB64):crypto.getRandomValues(new Uint8Array(16));const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},key,256);return{salt:b64(salt),hash:b64(bits)}}
async function verifyPassword(password,salt,expected){try{const x=await passwordHash(password,salt);return x.hash===expected}catch{return false}}
function cookie(name,value,maxAge){return `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`}
function clearCookie(name){return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`}
function adminCookie(token){return `admin_session=${token}; Path=/; Max-Age=43200; HttpOnly; Secure; SameSite=Strict`}
function clearAdminCookie(){return `admin_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`}
function getCookie(req,name){const c=req.headers.get('Cookie')||'';const m=c.match(new RegExp('(?:^|; )'+name.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'=([^;]+)'));return m?decodeURIComponent(m[1]):null}
function validPassword(p){return typeof p==='string'&&p.length>=8&&p.length<=128}
function cleanPhone(v){return String(v||'').replace(/\D/g,'').slice(-10)}
function rateLimit(req){const ip=req.headers.get('CF-Connecting-IP')||'unknown',t=Date.now();let a=loginAttempts.get(ip)||[];a=a.filter(x=>t-x<15*60*1000);if(a.length>=LOGIN_LIMIT)return true;a.push(t);loginAttempts.set(ip,a);return false}
async function body(req){try{return await req.json()}catch{return {}}}
async function columnExists(env,table,column){
 const r=await env.DB.prepare(`PRAGMA table_info(${table})`).all();
 return (r.results||[]).some(x=>x.name===column);
}
async function ensureTables(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS guest_receipts(token TEXT PRIMARY KEY,order_no TEXT NOT NULL,receipt_json TEXT NOT NULL,created_at TEXT NOT NULL)`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS site_config(id INTEGER PRIMARY KEY CHECK(id=1),config_json TEXT NOT NULL,updated_at TEXT NOT NULL)`).run();
 // Older D1 schemas may not have updated_at. Add it only when missing.
 if(await columnExists(env,'admins','updated_at')){} else { try{await env.DB.prepare(`ALTER TABLE admins ADD COLUMN updated_at TEXT`).run()}catch{} }
 if(await columnExists(env,'site_config','updated_at')){} else { try{await env.DB.prepare(`ALTER TABLE site_config ADD COLUMN updated_at TEXT`).run()}catch{} }
}
async function requireAdmin(req,env){const token=getCookie(req,'admin_session');if(!token)throw new Error('UNAUTHORIZED');const th=b64(await sha256(token));const row=await env.DB.prepare('SELECT a.* FROM admins a JOIN admin_sessions s ON s.admin_id=a.id WHERE s.token_hash=? AND s.expires_at>?').bind(th,now()).first();if(!row)throw new Error('UNAUTHORIZED');return row}
async function ensureAdmin(env,password){let row=await env.DB.prepare('SELECT * FROM admins WHERE username=?').bind(ADMIN_USERNAME).first();const initial=env.ADMIN_INITIAL_PASSWORD;if(!row){if(!initial||!validPassword(initial))throw new Error('ADMIN_INITIAL_PASSWORD secret is not configured.');const ph=await passwordHash(initial);await env.DB.prepare('INSERT INTO admins(username,password_hash,password_salt,created_at) VALUES(?,?,?,?)').bind(ADMIN_USERNAME,ph.hash,ph.salt,now()).run();row=await env.DB.prepare('SELECT * FROM admins WHERE username=?').bind(ADMIN_USERNAME).first();}
 if(!(await verifyPassword(password,row.password_salt,row.password_hash))){
   if(initial&&password===initial){const ph=await passwordHash(initial);await env.DB.prepare('UPDATE admins SET password_hash=?,password_salt=? WHERE id=?').bind(ph.hash,ph.salt,row.id).run();row=await env.DB.prepare('SELECT * FROM admins WHERE id=?').bind(row.id).first();}
 }
 return row;
}
function safeJson(s){try{return JSON.parse(s||'{}')}catch{return {}}}
async function sendWhatsApp(env,msg){
 const token=env.WHATSAPP_ACCESS_TOKEN,phoneId=env.WHATSAPP_PHONE_NUMBER_ID,to=env.WHATSAPP_OWNER_NUMBER;
 if(!token||!phoneId||!to)return false;
 try{const r=await fetch(`https://graph.facebook.com/v23.0/${phoneId}/messages`,{method:'POST',headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to,type:'text',text:{body:msg}})});return r.ok}catch{return false}
}
async function api(req,env){const path=new URL(req.url).pathname;
 if(path.startsWith('/api/'))await ensureTables(env);
 if(req.method==='POST'&&path==='/api/admin/login'){
  if(rateLimit(req))return json({error:'Too many attempts. Please try again later.'},429);
  const b=await body(req),password=String(b.password||'');if(String(b.username||'')!==ADMIN_USERNAME||!validPassword(password))return json({error:'Invalid owner credentials.'},401);
  try{const row=await ensureAdmin(env,password);if(!row||!(await verifyPassword(password,row.password_salt,row.password_hash)))return json({error:'Invalid owner credentials.'},401);const token=randomToken(),th=b64(await sha256(token));await env.DB.prepare('INSERT INTO admin_sessions(token_hash,admin_id,expires_at,created_at) VALUES(?,?,?,?)').bind(th,row.id,new Date(Date.now()+12*60*60*1000).toISOString(),now()).run();return json({ok:true,username:row.username},200,{'Set-Cookie':adminCookie(token)})}catch(e){return json({error:e.message||'Owner login failed.'},500)}
 }
 if(req.method==='GET'&&path==='/api/admin/me'){try{const a=await requireAdmin(req,env);return json({ok:true,username:a.username})}catch{return json({error:'Not logged in.'},401)}}
 if(req.method==='POST'&&path==='/api/admin/logout'){const t=getCookie(req,'admin_session');if(t)await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(b64(await sha256(t))).run();return json({ok:true},200,{'Set-Cookie':clearAdminCookie()})}
 if(req.method==='PUT'&&path==='/api/admin/password'){try{const a=await requireAdmin(req,env),b=await body(req),cur=String(b.currentPassword||''),next=String(b.newPassword||'');if(!validPassword(next))return json({error:'New password must be at least 8 characters.'},400);if(!(await verifyPassword(cur,a.password_salt,a.password_hash)))return json({error:'Current password is incorrect.'},400);const ph=await passwordHash(next);await env.DB.prepare('UPDATE admins SET password_hash=?,password_salt=? WHERE id=?').bind(ph.hash,ph.salt,a.id).run();return json({ok:true})}catch{return json({error:'Please login.'},401)}}
 if(req.method==='GET'&&path==='/api/admin/orders'){try{await requireAdmin(req,env);const rows=await env.DB.prepare(`SELECT o.order_no,o.items_json,o.subtotal,o.delivery,o.total,o.status,o.created_at,c.name,c.phone,c.address,c.pin FROM orders o LEFT JOIN customers c ON c.id=o.customer_id ORDER BY o.created_at DESC LIMIT 200`).all();return json({orders:rows.results||[]})}catch{return json({error:'Please login.'},401)}}
 if(req.method==='PUT'&&path.startsWith('/api/admin/orders/')){try{await requireAdmin(req,env);const orderNo=decodeURIComponent(path.split('/').pop()),b=await body(req);await env.DB.prepare('UPDATE orders SET status=? WHERE order_no=?').bind(String(b.status||'Order Received'),orderNo).run();return json({ok:true})}catch{return json({error:'Please login.'},401)}}
 if(req.method==='GET'&&path==='/api/admin/site-config'){try{await requireAdmin(req,env);const r=await env.DB.prepare('SELECT config_json FROM site_config WHERE id=1').first();return json({config:r?safeJson(r.config_json):null})}catch{return json({error:'Please login.'},401)}}
 if(req.method==='PUT'&&path==='/api/admin/site-config'){try{await requireAdmin(req,env);const b=await body(req),cfg=b.config||{};await env.DB.prepare('INSERT INTO site_config(id,config_json,updated_at) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET config_json=excluded.config_json,updated_at=excluded.updated_at').bind(JSON.stringify(cfg),now()).run();return json({ok:true})}catch(e){return json({error:e.message||'Could not save settings.'},500)}}
 if(req.method==='GET'&&path==='/api/site-config'){const r=await env.DB.prepare('SELECT config_json FROM site_config WHERE id=1').first();return json({config:r?safeJson(r.config_json):null})}
 if(req.method==='POST'&&path==='/api/guest-order'){
  const b=await body(req),name=String(b.name||'').trim(),phone=cleanPhone(b.phone),address=String(b.address||'').trim(),pin=String(b.pin||'').trim(),items=Array.isArray(b.items)?b.items:[];
  if(name.length<2||phone.length!==10||address.length<5||pin.length<4||!items.length)return json({error:'Name, mobile, full address, PIN and cart are required.'},400);
  if(String(b.captchaAnswer||'')!==String(b.captchaExpected||''))return json({error:'CAPTCHA verification failed.'},400);
  const screenshot=String(b.paymentScreenshot||'');if(screenshot&&screenshot.length>900000)return json({error:'Payment screenshot is too large. Please upload a smaller image.'},400);
  try{
   let c=await env.DB.prepare('SELECT id FROM customers WHERE phone=?').bind(phone).first();
   if(!c){const random=crypto.randomUUID();const ph=await passwordHash(random);const r=await env.DB.prepare('INSERT INTO customers(name,phone,password_hash,password_salt,address,pin,created_at) VALUES(?,?,?,?,?,?,?)').bind(name,phone,ph.hash,ph.salt,address,pin,now()).run();c={id:r.meta.last_row_id}}else await env.DB.prepare('UPDATE customers SET name=?,address=?,pin=? WHERE id=?').bind(name,address,pin,c.id).run();
   const orderNo='WB-PVC-'+Date.now().toString(36).toUpperCase();const total=Number(b.total)||0,subtotal=Number(b.subtotal)||0,delivery=Number(b.delivery)||0;
   const orderData={customerName:name,phone,address,pin,items,subtotal,delivery,total,transactionId:String(b.transactionId||''),paymentScreenshot:screenshot,status:'Payment Submitted'};
   await env.DB.prepare('INSERT INTO orders(order_no,customer_id,items_json,subtotal,delivery,total,status,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(orderNo,c.id,JSON.stringify(orderData),subtotal,delivery,total,'Payment Submitted',now()).run();
   const receiptToken=randomToken();const receipt={orderNo,customerName:name,phone,address,pin,items,subtotal,delivery,total,transactionId:String(b.transactionId||''),status:'Payment Submitted',createdAt:now()};await env.DB.prepare('INSERT INTO guest_receipts(token,order_no,receipt_json,created_at) VALUES(?,?,?,?)').bind(receiptToken,orderNo,JSON.stringify(receipt),now()).run();
   const wa=`New PVC Order ${orderNo}\nCustomer: ${name}\nMobile: ${phone}\nTotal: ₹${total}\nPayment UTR: ${String(b.transactionId||'Not provided')}\nStatus: Payment Submitted`;
   const whatsappSent=await sendWhatsApp(env,wa);
   return json({ok:true,orderNo,receiptToken,whatsappSent,status:'Payment Submitted'});
  }catch(e){return json({error:e.message||'Could not create order.'},500)}
 }
 if(req.method==='GET'&&path==='/api/receipt'){const token=new URL(req.url).searchParams.get('token')||'';if(!token)return json({error:'Missing receipt token.'},400);const r=await env.DB.prepare('SELECT receipt_json FROM guest_receipts WHERE token=?').bind(token).first();if(!r)return json({error:'Receipt not found.'},404);return json({receipt:safeJson(r.receipt_json)})}
 return null;
}
export default{async fetch(req,env){try{const p=new URL(req.url).pathname;if(p.startsWith('/api/')){const r=await api(req,env);if(r)return r;return json({error:'Not found'},404)}return env.ASSETS.fetch(req)}catch(e){console.error(e);return json({error:'Server error'},500)}}};
