B2B PVC PRINTING SHOP — FINAL GUEST CHECKOUT PACKAGE

এই package-এ:
1. Customer Login / Create Account নেই।
2. Purchase-এর আগে Name + Mobile + CAPTCHA verification আছে।
3. নতুন visitor-এর cart fresh/empty থাকে; পুরনো visitor-এর cart public page-এ carry হয় না।
4. অন্য customer-এর personal details বা order history public page-এ দেখানো হয় না।
5. Checkout-এ Name, Mobile, Full Address, PIN, Transaction ID এবং Payment Screenshot upload আছে।
6. Purchase receipt / bill print-save করা যায়।
7. Quantity-wise offer price এবং discount display/editor রাখা হয়েছে।
8. Delivery amount owner settings থেকে set করা যায়।
9. Guest order Worker + D1-এ private guest_orders table-এ save হয়।
10. Payment screenshot public URL হিসেবে serve করা হয় না।
11. Owner API দিয়ে guest orders protected ভাবে নেওয়া যায়।

DEPLOY:
- GitHub repo-তে public/index.html, worker.js, wrangler.jsonc রাখুন।
- Cloudflare Worker deploy করুন।

IMPORTANT:
Automatic WhatsApp API notification চালাতে WhatsApp Business Cloud API credentials Cloudflare secret/vars হিসেবে আলাদা করে configure করতে হবে। কোনো password/API secret এই file-এ রাখা হয়নি।
