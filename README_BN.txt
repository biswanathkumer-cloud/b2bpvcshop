B2B PVC PRINTING SHOP — CHECKED PACKAGE

এই প্যাকেজে:
1. Original 14 product data/images রাখা হয়েছে।
2. Customer account/login gate সরানো হয়েছে।
3. Purchase-এর আগে simple CAPTCHA আছে।
4. Checkout-এ customer name, mobile, address, PIN, transaction ID এবং payment screenshot field আছে।
5. Quantity-wise pricing editor আগের মতো রাখা হয়েছে।
6. Owner login/backend code রাখা হয়েছে।
7. Worker PBKDF2 100000 iterations করা হয়েছে।
8. Wrangler-এ keep_vars=true রাখা হয়েছে।

GitHub structure:
public/index.html
worker.js
wrangler.jsonc

Cloudflare deploy: npx wrangler deploy

নোট: WhatsApp automatic server notification এবং private payment-file storage-এর জন্য WhatsApp Business API/R2 configuration আলাদা করে করতে হবে; এই package user-এর কোনো secret/password নেয় না।
