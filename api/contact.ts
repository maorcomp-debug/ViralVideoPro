import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface ContactRequest {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  honeypot?: string; // Hidden field for spam protection
  sourceUrl?: string; // Page URL where form was submitted
}

function getRateLimitKey(req: VercelRequest): string {
  // Use IP address for rate limiting
  const forwarded = req.headers['x-forwarded-for'];
  let ip: string;
  
  if (typeof forwarded === 'string') {
    ip = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded)) {
    ip = forwarded[0] || 'unknown';
  } else {
    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string') {
      ip = realIp;
    } else if (Array.isArray(realIp)) {
      ip = realIp[0] || 'unknown';
    } else {
      ip = req.socket.remoteAddress || 'unknown';
    }
  }
  
  return ip;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(key);

  if (!limit || now > limit.resetTime) {
    // Reset or create new limit
    rateLimitMap.set(key, { count: 1, resetTime: now + 10 * 60 * 1000 }); // 10 minutes
    return true;
  }

  if (limit.count >= 5) {
    // Rate limit exceeded
    return false;
  }

  limit.count++;
  return true;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateMessage(message: string): boolean {
  return message.trim().length >= 20;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body: ContactRequest = req.body;

    // Honeypot check - if filled, it's spam
    if (body.honeypot && body.honeypot.trim() !== '') {
      console.warn('Spam detected: honeypot field filled');
      return res.status(200).json({ ok: true }); // Silent fail for spam
    }

    // Rate limiting
    const rateLimitKey = getRateLimitKey(req);
    if (!checkRateLimit(rateLimitKey)) {
      return res.status(429).json({ 
        ok: false, 
        error: 'יותר מדי בקשות. אנא נסה שוב בעוד כמה דקות.' 
      });
    }

    // Validation
    if (!body.fullName || !body.email || !body.subject || !body.message) {
      return res.status(400).json({ 
        ok: false, 
        error: 'נא למלא את כל השדות הנדרשים' 
      });
    }

    if (!validateEmail(body.email)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'כתובת אימייל לא תקינה' 
      });
    }

    if (!validateMessage(body.message)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'ההודעה חייבת להכיל לפחות 20 תווים' 
      });
    }

    // Get environment variables
    const resendApiKey = process.env.RESEND_API_KEY;
    const contactToEmail = process.env.CONTACT_TO_EMAIL || 'viralypro@gmail.com';
    const contactFromEmail = process.env.CONTACT_FROM_EMAIL;

    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not configured');
      return res.status(500).json({ 
        ok: false, 
        error: 'שירות המייל לא מוגדר. אנא פנה למנהל המערכת.' 
      });
    }

    if (!contactFromEmail) {
      console.error('CONTACT_FROM_EMAIL is not configured');
      return res.status(500).json({ 
        ok: false, 
        error: 'שירות המייל לא מוגדר. אנא פנה למנהל המערכת.' 
      });
    }

    // Format date in Hebrew locale
    const date = new Date().toLocaleString('he-IL', {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Prepare email content
    const htmlBody = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #D4A043; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: white; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; margin-bottom: 5px; display: block; }
            .value { color: #333; padding: 8px; background-color: #f5f5f5; border-radius: 4px; }
            .message-box { padding: 15px; background-color: #f0f0f0; border-left: 4px solid #D4A043; margin-top: 10px; white-space: pre-wrap; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">הודעה חדשה מטופס יצירת קשר</h1>
            </div>
            <div class="content">
              <div class="field">
                <span class="label">שם מלא:</span>
                <div class="value">${escapeHtml(body.fullName)}</div>
              </div>
              <div class="field">
                <span class="label">אימייל:</span>
                <div class="value"><a href="mailto:${escapeHtml(body.email)}">${escapeHtml(body.email)}</a></div>
              </div>
              ${body.phone ? `
              <div class="field">
                <span class="label">טלפון:</span>
                <div class="value">${escapeHtml(body.phone)}</div>
              </div>
              ` : ''}
              <div class="field">
                <span class="label">נושא:</span>
                <div class="value">${escapeHtml(body.subject)}</div>
              </div>
              <div class="field">
                <span class="label">הודעה:</span>
                <div class="message-box">${escapeHtml(body.message)}</div>
              </div>
              ${body.sourceUrl ? `
              <div class="field">
                <span class="label">דף מקור:</span>
                <div class="value"><a href="${escapeHtml(body.sourceUrl)}">${escapeHtml(body.sourceUrl)}</a></div>
              </div>
              ` : ''}
              <div class="field">
                <span class="label">תאריך ושעה:</span>
                <div class="value">${date}</div>
              </div>
              <div class="footer">
                <p>הודעה זו נשלחה מטופס יצירת קשר באתר Viraly - Video Director Pro</p>
                <p>ניתן להגיב ישירות למייל זה - התשובה תגיע ל-${escapeHtml(body.email)}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
הודעה חדשה מטופס יצירת קשר

שם מלא: ${body.fullName}
אימייל: ${body.email}
${body.phone ? `טלפון: ${body.phone}\n` : ''}נושא: ${body.subject}

הודעה:
${body.message}

${body.sourceUrl ? `דף מקור: ${body.sourceUrl}\n` : ''}תאריך ושעה: ${date}

---
ניתן להגיב ישירות למייל זה - התשובה תגיע ל-${body.email}
    `.trim();

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Viraly - Video Director Pro <${contactFromEmail}>`,
        to: [contactToEmail],
        reply_to: body.email,
        subject: `[Viraly Contact] ${body.subject}`,
        html: htmlBody,
        text: textBody,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error('Resend API error:', resendResponse.status, errorData);
      return res.status(500).json({ 
        ok: false, 
        error: 'אירעה שגיאה בשליחת ההודעה. אנא נסה שוב מאוחר יותר.' 
      });
    }

    const resendData = await resendResponse.json();
    console.log('Email sent successfully:', resendData.id);

    return res.status(200).json({ ok: true });

  } catch (error: any) {
    console.error('Error in contact API:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'אירעה שגיאה בלתי צפויה. אנא נסה שוב מאוחר יותר.' 
    });
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

