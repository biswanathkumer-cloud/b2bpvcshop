B2B PVC PRINTING SHOP – V14

মূল পরিবর্তন:
1) Product list এখন D1 থেকে আসে; প্রথম page load অনেক হালকা। পুরনো embedded 3MB+ product images বাদ দেওয়া হয়েছে।
2) 14টি original product automatic seed হবে যদি products table খালি থাকে।
3) Owner > Products থেকে unlimited product add/update করা যাবে।
4) Product: Name, ID, Tag, MRP, Selling Price, Discount %, Offer/Sale Badge, Description, Image, 1+/5+/10+/25+ price।
5) Owner > Settings & Branding থেকে company name, tagline, logo, background/text/button/profile colour, heading size, theme, delivery, UPI, QR, discount, offer poster/notification ইত্যাদি বদলানো যাবে।
6) QR/Poster/Logo আলাদা D1 asset table-এ রাখা হয়, তাই আগের বড় site_config row-এর জন্য D1 save error হওয়ার ঝুঁকি কমেছে।
7) Customer-এর order ID short: B2B-XXXXXX; Track Order public screen যোগ হয়েছে।
8) Existing order history, customer profile, support/complaint, receipt এবং owner purchase system রাখা হয়েছে।
9) Owner password Cloudflare secret ADMIN_INITIAL_PASSWORD দিয়ে কাজ করে; secret কাউকে দেবেন না।
10) Deploy: npx wrangler deploy
