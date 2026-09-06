import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper for Nigerian phone normalization
function normalizeNigerianPhone(phone: string): { valid: boolean; normalized: string; formatted: string; error?: string } {
  if (!phone) return { valid: false, normalized: "", formatted: "", error: "Phone number is required" };
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  
  let digits = cleaned;
  if (cleaned.startsWith("+234")) {
    digits = "234" + cleaned.slice(4);
  } else if (cleaned.startsWith("234")) {
    digits = cleaned;
  } else if (cleaned.startsWith("0")) {
    digits = "234" + cleaned.slice(1);
  } else if (cleaned.length === 10) {
    digits = "234" + cleaned;
  }

  // A standard Nigerian number has 234 followed by 10 digits (e.g., 234 803 123 4567 = 13 digits)
  if (!/^234[789][01]\d{8}$/.test(digits) && !/^234\d{10}$/.test(digits)) {
    return {
      valid: false,
      normalized: digits,
      formatted: phone,
      error: "Invalid Nigerian phone number format. Expected format: 080XXXXXXXX or +23480XXXXXXXX"
    };
  }

  const localPart = digits.slice(3);
  const formatted = `+234 ${localPart.slice(0, 3)} ${localPart.slice(3, 6)} ${localPart.slice(6)}`;

  return {
    valid: true,
    normalized: digits, // e.g. 2348012345678 for Termii API
    formatted
  };
}

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "SchoolSafe Nigeria",
    timezone: "Africa/Lagos",
    serverTime: new Date().toISOString()
  });
});

// 2. Server configuration status (without leaking secrets)
app.get("/api/config/status", (req, res) => {
  res.json({
    hasTermiiKey: !!process.env.TERMII_API_KEY,
    hasTermiiSenderId: !!process.env.TERMII_SENDER_ID,
    termiiSenderId: process.env.TERMII_SENDER_ID || null,
    hasResendKey: !!process.env.RESEND_API_KEY,
    hasEmailFrom: !!process.env.EMAIL_FROM,
    emailFrom: process.env.EMAIL_FROM || "notifications@example.com (placeholder)",
    hasSupabaseSecret: !!process.env.SUPABASE_SECRET_KEY,
    isDevelopment: process.env.NODE_ENV !== "production"
  });
});

// 3. Termii SMS Endpoint
app.post("/api/notifications/sms", async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({
      success: false,
      error: "Recipient phone number ('to') and 'message' are required."
    });
  }

  const phoneCheck = normalizeNigerianPhone(to);
  if (!phoneCheck.valid) {
    return res.status(400).json({
      success: false,
      error: phoneCheck.error,
      recipient: to
    });
  }

  const termiiApiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID || "SchoolSafe";

  // If Termii credentials are not present, simulate gracefully
  if (!termiiApiKey) {
    const simId = `sim_termii_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[Termii SMS Simulation] To: ${phoneCheck.normalized} (${phoneCheck.formatted}) | Message: "${message}"`);
    return res.json({
      success: true,
      status: "Sent",
      provider: "Termii (Simulated)",
      messageId: simId,
      recipient: phoneCheck.formatted,
      normalizedPhone: phoneCheck.normalized,
      note: "Live Termii credentials not configured in environment. Notification logged and recorded as simulated successfully."
    });
  }

  try {
    const termiiUrl = "https://api.ng.termii.com/api/sms/send";
    const payload = {
      to: phoneCheck.normalized,
      from: senderId,
      sms: message,
      type: "plain",
      channel: "generic",
      api_key: termiiApiKey
    };

    const response = await fetch(termiiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || (data && data.code && data.code !== "ok" && data.message !== "Successfully Sent")) {
      return res.status(502).json({
        success: false,
        status: "Failed",
        provider: "Termii",
        error: data.message || `Termii API error: ${response.statusText}`,
        details: data
      });
    }

    return res.json({
      success: true,
      status: "Sent",
      provider: "Termii",
      messageId: data.message_id || `termii_${Date.now()}`,
      recipient: phoneCheck.formatted
    });
  } catch (err: any) {
    console.error("Termii send error:", err);
    return res.status(500).json({
      success: false,
      status: "Failed",
      provider: "Termii",
      error: err?.message || "Failed to communicate with Termii API"
    });
  }
});

// 4. Resend Email Endpoint
app.post("/api/notifications/email", async (req, res) => {
  const { to, subject, html, text } = req.body;

  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({
      success: false,
      error: "Recipient ('to'), 'subject', and email content ('html' or 'text') are required."
    });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || "SchoolSafe Nigeria <notifications@example.com>";

  // If Resend key is not configured, simulate gracefully
  if (!resendApiKey) {
    const simId = `sim_resend_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[Resend Email Simulation] To: ${to} | Subject: "${subject}" | From: ${emailFrom}`);
    return res.json({
      success: true,
      status: "Sent",
      provider: "Resend (Simulated)",
      messageId: simId,
      recipient: to,
      note: "Live Resend API key not configured in environment. Email logged and recorded as simulated successfully."
    });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: emailFrom,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || `<p>${text}</p>`,
        text: text || undefined
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        status: "Failed",
        provider: "Resend",
        error: data.message || `Resend API error: ${response.statusText}`,
        details: data
      });
    }

    return res.json({
      success: true,
      status: "Sent",
      provider: "Resend",
      messageId: data.id || `resend_${Date.now()}`,
      recipient: to
    });
  } catch (err: any) {
    console.error("Resend send error:", err);
    return res.status(500).json({
      success: false,
      status: "Failed",
      provider: "Resend",
      error: err?.message || "Failed to communicate with Resend API"
    });
  }
});

// 5. Unified Dispatcher for Attendance / Pickup Events
app.post("/api/notifications/dispatch", async (req, res) => {
  const { eventType, student, school, time, date, parents, pickupPerson } = req.body;

  if (!eventType || !student || !parents || !Array.isArray(parents)) {
    return res.status(400).json({
      success: false,
      error: "Invalid dispatch request. Required: eventType ('arrival'|'pickup'), student object, and parents array."
    });
  }

  const schoolName = school?.name || "SchoolSafe Nigeria";
  const results: any[] = [];

  for (const parent of parents) {
    const pref = parent.notification_preference || "email_and_sms";
    const studentName = student.full_name;
    const className = `${student.class_name}${student.stream_name ? ` – ${student.stream_name}` : ""}`;

    // SMS Message text
    let smsText = "";
    if (eventType === "arrival") {
      smsText = `SchoolSafe: Your child ${studentName} has arrived at school at ${time}. (${schoolName})`;
    } else {
      smsText = `SchoolSafe: ${studentName} has been picked up by ${pickupPerson?.full_name || "authorized person"} at ${time}. (${schoolName})`;
    }

    // Email content
    const emailSubject = eventType === "arrival" 
      ? `SchoolSafe Alert: ${studentName} has arrived at ${schoolName}`
      : `SchoolSafe Alert: ${studentName} has been picked up from ${schoolName}`;

    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #065f46; margin: 0 0 6px 0; font-size: 22px;">${schoolName}</h2>
          <span style="display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px;">
            ${eventType === "arrival" ? "STUDENT ARRIVAL NOTIFICATION" : "STUDENT PICKUP NOTIFICATION"}
          </span>
        </div>
        
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">Dear <strong>${parent.full_name || "Parent/Guardian"}</strong>,</p>
        
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          ${eventType === "arrival" 
            ? `This is to notify you that your child, <strong>${studentName}</strong>, arrived safely at school today.`
            : `This is to notify you that your child, <strong>${studentName}</strong>, was safely picked up from school.`}
        </p>

        <div style="background-color: #f8fafc; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 140px;">Student Name:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${studentName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Class & Stream:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 500;">${className}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Date:</td>
              <td style="padding: 6px 0; color: #0f172a;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Time:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600; color: #047857;">${time} (WAT)</td>
            </tr>
            ${eventType === "pickup" ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Picked Up By:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${pickupPerson?.full_name || "Authorized Guardian"} (${pickupPerson?.relationship || "Authorized Person"})</td>
            </tr>
            ` : ""}
          </table>
        </div>

        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          This automated security notification was sent via <strong>SchoolSafe Nigeria</strong>. If you did not authorize this action, please contact the school immediately.
        </p>
      </div>
    `;

    // 1. Send SMS if preference matches
    if (pref === "sms_only" || pref === "email_and_sms") {
      if (parent.phone) {
        const phoneCheck = normalizeNigerianPhone(parent.phone);
        const termiiApiKey = process.env.TERMII_API_KEY;
        if (!termiiApiKey) {
          results.push({
            parent_id: parent.id,
            parent_name: parent.full_name,
            channel: "sms",
            recipient: phoneCheck.formatted || parent.phone,
            status: phoneCheck.valid ? "Sent" : "Failed",
            provider: "Termii (Simulated)",
            message_id: `sim_sms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            error: phoneCheck.valid ? null : phoneCheck.error,
            sent_at: new Date().toISOString()
          });
        } else if (phoneCheck.valid) {
          try {
            const tResp = await fetch("https://api.ng.termii.com/api/sms/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: phoneCheck.normalized,
                from: process.env.TERMII_SENDER_ID || "SchoolSafe",
                sms: smsText,
                type: "plain",
                channel: "generic",
                api_key: termiiApiKey
              })
            });
            const tData = await tResp.json().catch(() => ({}));
            results.push({
              parent_id: parent.id,
              parent_name: parent.full_name,
              channel: "sms",
              recipient: phoneCheck.formatted,
              status: tResp.ok ? "Sent" : "Failed",
              provider: "Termii",
              message_id: tData.message_id || `termii_${Date.now()}`,
              error: tResp.ok ? null : (tData.message || "Failed to send SMS"),
              sent_at: new Date().toISOString()
            });
          } catch (e: any) {
            results.push({
              parent_id: parent.id,
              parent_name: parent.full_name,
              channel: "sms",
              recipient: phoneCheck.formatted,
              status: "Failed",
              provider: "Termii",
              error: e.message,
              sent_at: new Date().toISOString()
            });
          }
        } else {
          results.push({
            parent_id: parent.id,
            parent_name: parent.full_name,
            channel: "sms",
            recipient: parent.phone,
            status: "Failed",
            provider: "Termii",
            error: phoneCheck.error,
            sent_at: new Date().toISOString()
          });
        }
      }
    }

    // 2. Send Email if preference matches
    if (pref === "email_only" || pref === "email_and_sms") {
      if (parent.email) {
        const resendApiKey = process.env.RESEND_API_KEY;
        const emailFrom = process.env.EMAIL_FROM || "SchoolSafe Nigeria <notifications@example.com>";
        if (!resendApiKey) {
          results.push({
            parent_id: parent.id,
            parent_name: parent.full_name,
            channel: "email",
            recipient: parent.email,
            status: "Sent",
            provider: "Resend (Simulated)",
            message_id: `sim_email_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            error: null,
            sent_at: new Date().toISOString()
          });
        } else {
          try {
            const eResp = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${resendApiKey}`
              },
              body: JSON.stringify({
                from: emailFrom,
                to: [parent.email],
                subject: emailSubject,
                html: emailHtml,
                text: smsText
              })
            });
            const eData = await eResp.json().catch(() => ({}));
            results.push({
              parent_id: parent.id,
              parent_name: parent.full_name,
              channel: "email",
              recipient: parent.email,
              status: eResp.ok ? "Sent" : "Failed",
              provider: "Resend",
              message_id: eData.id || `resend_${Date.now()}`,
              error: eResp.ok ? null : (eData.message || "Failed to send email"),
              sent_at: new Date().toISOString()
            });
          } catch (e: any) {
            results.push({
              parent_id: parent.id,
              parent_name: parent.full_name,
              channel: "email",
              recipient: parent.email,
              status: "Failed",
              provider: "Resend",
              error: e.message,
              sent_at: new Date().toISOString()
            });
          }
        }
      }
    }
  }

  // Never block attendance or pickup transactions if sending fails
  return res.json({
    success: true,
    dispatchedCount: results.length,
    results
  });
});

async function startServer() {
  // Vite middleware in dev; static file serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SchoolSafe Nigeria server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
