B2B PVC PRINTING SHOP - FINAL CLEAN GUEST/OWNER BUILD

1. Upload the CONTENTS of this folder to GitHub repo root.
2. Keep public/index.html, worker.js and wrangler.jsonc exactly at these paths.
3. Deploy the Cloudflare Worker.
4. Customer has NO account/login. Customer verification appears only after Add to Cart or Buy Now: Name + Mobile + CAPTCHA.
5. After verification the selected action continues automatically; customer name/mobile appears at the top.
6. Owner Login is a separate button at the top-right. Owner password is never stored in HTML.
7. Worker no longer depends on D1 updated_at columns for owner login/site config.
8. Automatic WhatsApp notification requires the three WhatsApp secrets in Cloudflare.
