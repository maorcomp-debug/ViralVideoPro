/**
 * Auth Send Email Hook – הוראה חד-משמעית: מייל אימות נשלח רק מהאפליקציה.
 *
 * Supabase קורא ל-Hook זה בכל שליחת מייל Auth (signup, recovery וכו').
 * אנחנו מחזירים תמיד 200 בלי לשלוח – כך Supabase לא שולח מייל ולא נוצרת כפילות.
 * המקור היחיד למייל אימות הרשמה: api/send-confirmation-email (Resend).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OK = () =>
  new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }
  // תמיד 200 – לא לשלוח מייל מכאן. מייל אימות רק מ-api/send-confirmation-email.
  return OK();
});
