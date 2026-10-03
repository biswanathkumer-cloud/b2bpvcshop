B2B PVC PRINTING SHOP - FINAL V17

V17 fixes the D1 startup/login issue and improves speed.

IMPORTANT FIX:
- D1 schema initialization now runs before every API route is used, but is cached per Worker isolate.
- Product migrations create missing columns BEFORE the active index.
- Existing databases missing `active` are migrated safely.
- Original 14 products are seeded/repaired automatically.
- All 14 product images are included under public/product-images/.
- Owner login no longer waits for the Orders API; the Owner dashboard opens immediately.
- Owner sections load only when opened.
- Branding, Payment, Offer and Quantity saves are separate D1 operations.
- Customer delivery tracking remains available.
- Lightweight colourful theme added for faster rendering.

Cloudflare:
- Set ADMIN_INITIAL_PASSWORD yourself as a Worker secret.
- Deploy with: npx wrangler deploy
- D1 binding: DB
- Assets binding: ASSETS

Do not share passwords or secrets in chat.
