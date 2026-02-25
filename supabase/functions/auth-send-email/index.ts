/**
 * Auth Send Email Hook – sends signup confirmation and password reset emails via our Resend API.
 * Supabase calls this hook for signup, recovery, etc.
 * Detects language from: user_metadata.preferred_language (signup) or profiles.preferred_language (recovery).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const APP_URL = Deno.env.get("VITE_APP_URL") || Deno.env.get("APP_URL") || "https://viral-video-pro.vercel.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

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

async function getPreferredLanguageFromProfile(userId: string): Promise<"en" | "he"> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return "he";
  try {
    const url = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/profiles?user_id=eq.${userId}&select=preferred_language`;
    const res = await fetch(url, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) return "he";
    const data = await res.json();
    const lang = data?.[0]?.preferred_language;
    return lang === "en" ? "en" : "he";
  } catch {
    return "he";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const payload = (await req.json()) as HookPayload;
    const { user, email_data } = payload;
    const email = user?.email;
    const tokenHash = email_data?.token_hash;
    let redirectTo = email_data?.redirect_to || APP_URL;
    const actionType = (email_data?.email_action_type || "signup") as string;

    if (!email || !tokenHash || !SUPABASE_URL) {
      const missing = [
        !email && "email",
        !tokenHash && "token_hash",
        !SUPABASE_URL && "SUPABASE_URL",
      ].filter(Boolean);
      console.warn("auth-send-email: early return – missing:", missing.join(", "), "| payload keys:", Object.keys(payload || {}), "email_data keys:", Object.keys(email_data || {}));
      return OK();
    }

    const isRecovery = actionType === "recovery" || actionType === "reset";
    const type = isRecovery ? "recovery" : "signup";

    let lang: "en" | "he" = "he";
    if (isRecovery) {
      lang = await getPreferredLanguageFromProfile(user.id);
    } else {
      // 1) user_metadata.preferred_language (from AuthModal signUp)
      const fromMeta = user?.user_metadata?.preferred_language;
      // 2) Fallback: parse redirect_to – client sends ?lang=en or ?lang=he
      const fromRedirect = (redirectTo || "").match(/[?&]lang=([a-z]{2})/i)?.[1]?.toLowerCase();
      lang = fromMeta === "en" || fromRedirect === "en" ? "en" : "he";
    }

    // Ensure redirect includes ?lang= for correct post-verification language
    if (!redirectTo.includes("lang=")) {
      const sep = redirectTo.includes("?") ? "&" : "?";
      redirectTo = `${redirectTo}${sep}lang=${lang}`;
    }

    const actionLink = `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/verify?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(actionType)}&redirect_to=${encodeURIComponent(redirectTo)}`;

    // Always use APP_URL for API – viral-video-pro.vercel.app has send-auth-email + Resend.
    // redirectTo (from client) ensures the email link lands user on correct site (viraly.co.il or backup).
    const apiUrl = `${APP_URL.replace(/\/$/, "")}/api/send-auth-email`;
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, actionLink, redirectTo, lang, type }),
    });

    const errText = await res.text();
    if (!res.ok) {
      console.error("auth-send-email: Vercel API failed", res.status, "| body:", errText);
    } else {
      let resendId = "";
      try {
        const parsed = JSON.parse(errText);
        resendId = parsed?.resendId || parsed?.id || "";
      } catch {
        /* ignore */
      }
      console.log("auth-send-email: OK", email, lang, type, resendId ? `| resendId=${resendId}` : "");
    }
  } catch (e) {
    console.error("auth-send-email error:", e);
  }

  return OK();
});
