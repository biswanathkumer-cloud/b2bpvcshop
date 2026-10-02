B2B PVC PRINTING SHOP - FINAL FIXED PACKAGE

1. Customer Login / Create Account নেই.
2. Customer Name + Mobile + CAPTCHA verify করে Add to Cart করতে পারে.
3. নতুন browser session-এ customer cart fresh থাকে.
4. Checkout-এ Name, Mobile, Address, PIN, Transaction ID, Payment Screenshot নেওয়া হয়.
5. Private receipt token দিয়ে receipt পাওয়া যায়; Print / Save as PDF করা যায়.
6. Owner Login server-side secure.
7. Quantity-wise offers এবং time-based offers owner panel থেকে update করা যায়.
8. Product card-এর নিচে Bulk Offer text দেখানো হয় না.
9. Upcoming offer notification দেখা যায়.
10. Poster settings live-save করার জন্য admin site-config endpoint আছে.
11. Owner orders private server-side endpoint-এ থাকে.
12. WhatsApp automatic notification-এর জন্য Cloudflare Worker secrets লাগবে:
   WHATSAPP_ACCESS_TOKEN
   WHATSAPP_PHONE_NUMBER_ID
   WHATSAPP_OWNER_NUMBER
   এগুলো chat-এ কখনও পাঠাবেন না.

Deploy:
  npx wrangler deploy

Cloudflare Secret:
  ADMIN_INITIAL_PASSWORD (কমপক্ষে 8 character)

Note: Payment screenshot-এর জন্য ছোট image ব্যবহার করুন. Current implementation 650KB-এর মধ্যে রাখে.
