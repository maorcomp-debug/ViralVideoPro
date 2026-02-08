/**
 * Auth Send Email Hook – מבטל שליחת מייל אימות מהמערכת של Supabase.
 * מייל אימות ההרשמה נשלח רק מהאפליקציה (api/send-confirmation-email דרך Resend).
 * מחזיר 200 בלי לשלוח כדי שלא יישלחו שני מיילים.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const body = await req.json() as {
      user?: { email?: string };
      email_data?: { email_action_type?: string };
    };
    const actionType = body?.email_data?.email_action_type ?? "";

    // signup / confirmation – האפליקציה שולחת מייל אחד בלבד; לא לשלוח מכאן.
    if (actionType === "signup" || actionType === "confirmation") {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // סוגי מייל אחרים (recovery, magic_link וכו') – כרגע גם לא שולחים (למניעת כפילויות).
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
