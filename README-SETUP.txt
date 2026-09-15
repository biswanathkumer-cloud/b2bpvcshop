B2B PVC SHOP - SECURE LOGIN SETUP

This bundle keeps the product cards, images, MRP and rates unchanged.

1) Deploy this folder to Netlify.
2) In Netlify -> Site configuration -> Environment variables, add:
   OWNER_PASSWORD = your private owner password
   OWNER_TOKEN_SECRET = a long random secret string

3) For real SMS OTP using Twilio Verify, add:
   TWILIO_ACCOUNT_SID = your Twilio Account SID
   TWILIO_AUTH_TOKEN = your Twilio Auth Token
   TWILIO_VERIFY_SERVICE_SID = your Twilio Verify Service SID

4) The public HTML no longer contains the owner password or a simulated OTP.
   Customers only see an OTP input; the OTP is sent by the server through Twilio.

IMPORTANT:
- A static HTML file alone cannot securely send real SMS OTP or securely hide an owner password.
- Do not put Twilio credentials or OWNER_PASSWORD inside index.html.
