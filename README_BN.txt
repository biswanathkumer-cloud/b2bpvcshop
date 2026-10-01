B2B PVC SHOP — SYSTEM V4

IMPORTANT:
- public/index.html is the ORIGINAL website file copied byte-for-byte.
- Product names, categories/tags, descriptions, MRP, offer prices, offer badges, product images and existing quantity behavior were NOT changed.
- Do not replace public/index.html with a blank/test page.
- Deploy from the repository root with: npx wrangler deploy
- Cloudflare D1 binding: DB
- Cloudflare Assets binding: ASSETS
- Existing database ID is kept in wrangler.jsonc.

Deployment structure:
  public/index.html
  worker.js
  wrangler.jsonc
  schema.sql

The Worker initializes the required D1 tables automatically on the first /api request.
The owner password is read only from the Cloudflare secret ADMIN_INITIAL_PASSWORD.
Do not put the owner password into GitHub.
