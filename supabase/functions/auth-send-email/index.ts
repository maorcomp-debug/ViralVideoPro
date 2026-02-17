/**
 * Auth Send Email Hook – sends confirmation email via our Resend API.
 * Supabase calls this hook for signup, recovery, etc.
 * We call api/send-confirmation-email with the verification link and user's preferred_language.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const APP_URL = Deno.env.get("VITE_APP_URL") || "https://viral-video-pro.vercel.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL") || "";

interface HookPayload {
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
  email_data: {
    token?: string;
    token_hash?: string;
    redirect_to?: string;
    email_action_type?: string;
    site_url?: string;
  };
}

const OK = () =>
  new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const payload = (await req.json()) as HookPayload;
    const { user, email_data } = payload;
    const email = user?.email;
    const tokenHash = email_data?.token_hash;
    const redirectTo = email_data?.redirect_to || APP_URL;
    const actionType = email_data?.email_action_type || "signup";

    if (!email || !tokenHash || !SUPABASE_URL) {
      console.warn("auth-send-email: missing email, token_hash, or SUPABASE_URL");
      return OK();
    }

    const actionLink = `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/verify?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(actionType)}&redirect_to=${encodeURIComponent(redirectTo)}`;

    const preferredLang = user?.user_metadata?.preferred_language;
    const lang = preferredLang === "en" ? "en" : "he";

    const apiUrl = `${APP_URL.replace(/\/$/, "")}/api/send-confirmation-email`;
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        actionLink,
        redirectTo,
        lang,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("auth-send-email: API error", res.status, errText);
    }
  } catch (e) {
    console.error("auth-send-email error:", e);
  }

  return OK();
});
