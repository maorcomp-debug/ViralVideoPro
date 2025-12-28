import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAIL = 'viralypro@gmail.com';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try using Resend if available (recommended)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (resendApiKey) {
      // Use Resend for email sending
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Viraly Contact Form <noreply@viraly.co.il>',
          to: [ADMIN_EMAIL],
          subject: `הודעה חדשה מטופס יצירת קשר: ${name}`,
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
              <div style="background-color: white; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333; border-bottom: 2px solid #D4A043; padding-bottom: 10px;">
                  הודעה חדשה מטופס יצירת קשר
                </h2>
                <div style="margin-top: 20px;">
                  <p><strong>שם:</strong> ${name}</p>
                  <p><strong>אימייל:</strong> <a href="mailto:${email}">${email}</a></p>
                  <p><strong>תאריך:</strong> ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}</p>
                </div>
                <div style="margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
                  <h3 style="color: #333; margin-top: 0;">תוכן ההודעה:</h3>
                  <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
                </div>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                  <p style="color: #666; font-size: 12px;">
                    ניתן להגיב ישירות למייל זה או לגשת לממשק הניהול לצפייה בכל ההודעות.
                  </p>
                </div>
              </div>
            </div>
          `,
          text: `
הודעה חדשה מטופס יצירת קשר

שם: ${name}
אימייל: ${email}
תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}

תוכן ההודעה:
${message}
          `.trim(),
        }),
      });

      if (!resendResponse.ok) {
        const errorData = await resendResponse.text();
        console.error('Resend API error:', errorData);
        throw new Error(`Failed to send email via Resend: ${resendResponse.status}`);
      }

      const resendData = await resendResponse.json();
      return new Response(
        JSON.stringify({ success: true, messageId: resendData.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: Use Supabase Auth email service (if configured)
    // Note: This requires SMTP to be configured in Supabase Dashboard
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Email service not configured. Please set RESEND_API_KEY or configure SMTP in Supabase.');
    }

    // If no email service is configured, just log the message
    // In production, you should configure Resend or SMTP
    console.log('Contact form message received (email service not configured):', {
      name,
      email,
      message,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message logged (email service not configured. Please configure RESEND_API_KEY for email sending)' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-contact-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

