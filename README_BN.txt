B2B PVC SHOP - CLEAN REBUILD

এই প্যাকেজে সম্পূর্ণ website + Worker + D1 schema আছে।
Worker প্রথম API request-এ প্রয়োজনীয় D1 tables নিজে তৈরি করতে পারে, তাই schema.sql আলাদাভাবে চালানো বাধ্যতামূলক নয়।

Cloudflare Secret:
ADMIN_INITIAL_PASSWORD = আপনার নিজের Owner password (কখনও আমাকে পাঠাবেন না)

GitHub repository-তে এই ZIP-এর সব file একই structure-এ replace করুন:
public/index.html
worker.js
wrangler.jsonc
schema.sql

তারপর GitHub commit করুন। Cloudflare Git deployment নতুন commit থেকে deploy করবে।
