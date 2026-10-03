B2B PVC PRINTING SHOP — FINAL V18

এই package-এ:
- 14টি original product এবং 14টি product image bundled আছে
- Customer verification এখন UI block করে না; verification-এর পর action সঙ্গে সঙ্গে continue করে
- Customer product quantity + / - persistent
- 5টি quantity offer slab: 1+, 5+, 10+, 25+, 50+
- Owner portal full-screen এবং section-wise loading
- Branding / Payment & Delivery / Offers / Quantity Offers আলাদা D1 save route
- Owner login lightweight core schema দিয়ে শুরু হয়; product migration/login-কে block করে না
- Product schema migration-এ active column আগে তৈরি হয়, পরে index তৈরি হয়
- Original products missing থাকলে seed হয়; original product image path static fast asset হিসেবে repair হয়
- Product images lazy-loaded এবং static public assets থেকে আসে, ফলে D1 image query কমে
- Customer Order Tracking, delivery ID, courier ও status রাখা হয়েছে
- Product Add/Edit, MRP, selling price, discount, badge, description, image ও quantity pricing রাখা হয়েছে

Cloudflare:
1. ZIP extract করুন
2. npx wrangler deploy
3. Worker secret ADMIN_INITIAL_PASSWORD নিজে সেট করুন
4. প্রথম Owner login-এর পরে Products/Settings section আলাদা আলাদা Save করুন

নোট: এই environment থেকে live Cloudflare production browser test করা সম্ভব নয়। Code/static/migration checks করা হয়েছে।
