B2B PVC PRINTING SHOP — CLEAN FINAL BUILD

Customer: 14 products, one cart, one-time Name/Mobile/CAPTCHA verification, address/PIN, QR/UPI payment, UTR or screenshot, permanent D1 order, product-based Order ID, instant receipt, Print/Save PDF, guest logout.

Owner: username is owner. Password is the Cloudflare Worker secret ADMIN_INITIAL_PASSWORD. Do NOT put the password in HTML/GitHub. Owner orders/settings are stored in the same D1 database.

Deploy: npx wrangler deploy
Required bindings: ASSETS + D1 DB (b2bpvcshop-db)
Required secret: ADMIN_INITIAL_PASSWORD (minimum 8 characters)

The Worker intentionally does NOT query legacy customers/orders/customer_id tables. This prevents the old `no such column: customer_id` error.
