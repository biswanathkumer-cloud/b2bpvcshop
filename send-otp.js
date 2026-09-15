exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ok:false,error:"Method not allowed"}) };

  try {
    const { phone } = JSON.parse(event.body || "{}");
    const normalized = String(phone || "").replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(normalized)) {
      return { statusCode: 400, body: JSON.stringify({ok:false,error:"Invalid mobile number"}) };
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
      Channel: "sms"
    });

    const r = await fetch(
      `https://verify.twilio.com/v2/Services/${encodeURIComponent(service)}/Verifications`,
      { method:"POST", headers:{
          "Authorization":`Basic ${auth}`,
          "Content-Type":"application/x-www-form-urlencoded"
        }, body }
    );
    const data = await r.json();

    if (!r.ok) {
      return { statusCode: 502, body: JSON.stringify({ok:false,error:data.message || "OTP could not be sent"}) };
    }

    return {
      statusCode: 200,
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ok:true, sessionId:"twilio"})
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ok:false,error:"OTP service error"}) };
  }
};