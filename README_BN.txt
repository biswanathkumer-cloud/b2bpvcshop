# PVC Card Website — Cloudflare Worker + D1

এই package-এ secure customer/owner login সহ static website + Cloudflare Worker + D1 schema আছে।

## Important
`wrangler.jsonc`-এ `PASTE_YOUR_D1_DATABASE_ID_HERE`-এর জায়গায় আপনার Cloudflare D1 Database ID বসাতে হবে।

Cloudflare-এ D1 database তৈরি করার পর:
1. `schema.sql` production D1 database-এ একবার execute করুন।
2. Worker secret `ADMIN_INITIAL_PASSWORD` সেট করুন।
3. `npx wrangler deploy` চালান।

## Files
- `public/index.html` — website
- `worker.js` — secure API/authentication
- `schema.sql` — D1 tables
- `wrangler.jsonc` — Worker + Assets + D1 configuration
- `SETUP_SECURE_LOGIN.txt` — original setup notes

Security improvement in this deployment package:
Only `public/` is exposed as static assets, so `schema.sql`, `worker.js`, and setup files are not directly served as website files.
