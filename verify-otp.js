exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ok:false,error:"Method not allowed"}) };

  try {
    const { phone, otp } = JSON.parse(event.body || "{}");
    const normalized = String(phone || "").replace(/\D/g, "");
    const code = String(otp || "").trim();

    if (!/^[6-9]\d{9}$/.test(normalized) || !/^\d{4,8}$/.test(code)) {
      return { statusCode: 400, body: JSON.stringify({ok:false,error:"Invalid verification request"}) };
    }

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const service = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (!sid || !token || !service) {
      return { statusCode: 500, body: JSON.stringify({ok:false,error:"OTP service is not configured"}) };
    }

    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const body = new URLSearchParams({
      To: `+91${normalized}`,
      Code: code
    });

    const r = await fetch(
      `https://verify.twilio.com/v2/Services/${encodeURIComponent(service)}/VerificationCheck`,
      { method:"POST", headers:{
          "Authorization":`Basic ${auth}`,
          "Content-Type":"application/x-www-form-urlencoded"
        }, body }
    );
    const data = await r.json();

    if (!r.ok || data.status !== "approved") {
      return { statusCode: 401, body: JSON.stringify({ok:false,error:"Invalid or expired OTP"}) };
    }

    return {
      statusCode: 200,
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ok:true})
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ok:false,error:"OTP verification error"}) };
  }
};