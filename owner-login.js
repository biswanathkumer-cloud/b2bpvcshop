const crypto = require("crypto");

function tokenFor(payload, secret) {
  const raw = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(raw).digest("base64url");
  return `${raw}.${sig}`;
}

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ok:false,error:"Method not allowed"}) };

  try {
    const { password } = JSON.parse(event.body || "{}");
    const expected = process.env.OWNER_PASSWORD;
    const secret = process.env.OWNER_TOKEN_SECRET;

    if (!expected || !secret) {
      return { statusCode: 500, body: JSON.stringify({ok:false,error:"Owner authentication is not configured"}) };
    }

    const a = Buffer.from(String(password || ""));
    const b = Buffer.from(expected);
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!valid) return { statusCode: 401, body: JSON.stringify({ok:false,error:"Invalid owner credentials"}) };

    const payload = { role:"owner", exp: Date.now() + 8 * 60 * 60 * 1000, nonce: crypto.randomBytes(16).toString("hex") };
    return {
      statusCode: 200,
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ok:true, token:tokenFor(payload, secret)})
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ok:false,error:"Owner authentication error"}) };
  }
};