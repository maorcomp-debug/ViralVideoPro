# Deployment (גיבוי / ViralVideoPro)

## Vercel
https://viral-video-pro.vercel.app

## Environment Variables (Vercel)
ב־Vercel Dashboard → viral-video-pro → Settings → Environment Variables:

### חובה (אפליקציה + הרשמה)
| Name | שימוש | Environment |
|-----|-------|-------------|
| VITE_SUPABASE_URL | Supabase – חיבור לקליינט | Production, Preview |
| VITE_SUPABASE_ANON_KEY | Supabase Auth | Production, Preview |
| GEMINI_API_KEY | ניתוח AI (שרת בלבד – לא נחשף בדפדפן) | Production, Preview |
| SUPABASE_SERVICE_ROLE_KEY | API – יצירת פרופיל בהרשמה | Production, Preview |

### חובה להרשמה ועבודה מלאה
| Name | שימוש | Environment |
|-----|-------|-------------|
| RESEND_API_KEY | שליחת מיילים (אימות, יצירת קשר) | Production, Preview |
| CONTACT_FROM_EMAIL | כתובת השולח במיילים | Production, Preview |
| VITE_APP_URL | קישורים במיילים – `https://viral-video-pro.vercel.app` | Production, Preview |

### תשלומים (Takbull)
| Name | שימוש | Environment |
|-----|-------|-------------|
| TAKBULL_API_KEY | תשלומים | Production, Preview |
| TAKBULL_API_SECRET | תשלומים | Production, Preview |

### אופציונלי
| Name | שימוש |
|-----|-------|
| CONTACT_TO_EMAIL | יעד טופס יצירת קשר (ברירת מחדל: viralypro@gmail.com) |
| CRON_SECRET | Cron – השהה/ביטול מנוי |

---

## Supabase – Redirect URLs (חובה להרשמה)
ב־Supabase Dashboard → Authentication → URL Configuration:

1. **Site URL:** `https://viral-video-pro.vercel.app`
2. **Redirect URLs** – הוסף:
   - `https://viral-video-pro.vercel.app/**`
   - `https://viral-video-pro.vercel.app`

בלי זה – קישור אימות המייל לא יעבוד וההרשמה תיכשל.

---

## Auth Hook – מיילים דו־לשוניים (אימות + איפוס סיסמה)
**בלי ה-Hook – המיילים תמיד בעברית** (מתבנית Supabase Dashboard).  
ה-Hook שולח מיילים דרך Resend עם תבניות EN/HE.  
**זיהוי שפה:** הרשמה – מ־user_metadata.preferred_language (שפת הממשק), איפוס סיסמה – מ־profiles.preferred_language.

**Flow באנגלית:** הרשמה מממשק אנגלית → הודעה באנגלית → מייל אימות באנגלית → לחיצה על הקישור → כניסה אוטומטית לממשק באנגלית.

1. **התחבר ל-Supabase CLI** (פעם אחת):
   ```bash
   npx supabase login
   ```

2. **Deploy את auth-send-email:**
   ```bash
   cd "גיבוי פרוייקט סופי"   # או הנתיב המלא לפרויקט
   npx supabase functions deploy auth-send-email --no-verify-jwt
   ```

3. **הגדר Secrets ב-Supabase:**
   ```bash
   npx supabase secrets set VITE_APP_URL=https://viral-video-pro.vercel.app
   npx supabase secrets set SUPABASE_URL=https://poejxozjnwrsakrhiyny.supabase.co
   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
   ```
   (ה־SERVICE_ROLE_KEY נדרש לשאיבת preferred_language מפרופיל באיפוס סיסמה)

4. **הפעל את ה-Hook ב-Dashboard:** Authentication → Hooks → Send Email Hook → בחר `auth-send-email`

5. **הרץ את המיגרציה** (preferred_language בפרופיל):
   ```bash
   npx supabase db push
   ```
   או הרץ ידנית: `supabase/migrations/20260217120000_add_preferred_language_to_handle_new_user.sql`

---

## Troubleshooting – 401 Invalid API key
אם מקבלים `AuthApiError: Invalid API key` בהרשמה – המפתח ב־Vercel לא תואם לפרויקט.

### תיקון ב־Vercel (חובה)
1. היכנס ל־**Vercel Dashboard** → הפרויקט שמגיש ל־`viral-video-pro.vercel.app`
2. **Settings** → **Environment Variables**
3. מצא `VITE_SUPABASE_ANON_KEY` – **ערוך** (או מחק ויצור מחדש)
4. העתק את המפתח מ־**Supabase Dashboard** → הפרויקט `poejxozjnwrsakrhiyny` → **Settings** → **API** → **Project API keys** → **anon public**
5. ודא ש־`VITE_SUPABASE_URL` = `https://poejxozjnwrsakrhiyny.supabase.co`
6. **חשוב:** סמן **Production** ו־**Preview** (גם שניהם)
7. **Redeploy:** Deployments → ⋮ על ה-deploy האחרון → **Redeploy** (ללא cache)

### ערכים נכונים לפרויקט poejxozjnwrsakrhiyny
| Variable | Value |
|----------|-------|
| VITE_SUPABASE_URL | `https://poejxozjnwrsakrhiyny.supabase.co` |
| VITE_SUPABASE_ANON_KEY | העתק מ־Supabase Dashboard → Settings → API → anon public (לא להעלות ל־Git) |

אם ה־ANON_KEY מתחיל ב־`eyJ...` אבל ה-ref בתוך ה-JWT הוא `iwrccjxtowrywpeatoik` – זה פרויקט אחר. השתמש במפתח שמכיל `poejxozjnwrsakrhiyny`.

### 403 / API key חסום (ניתוח AI)
- **סיבה:** המפתח נחשף (למשל בדפדפן) ו־Google חסם אותו.
- **פתרון:** הניתוח רץ כעת דרך `/api/analyze` בשרת. המפתח נשמר רק ב־`GEMINI_API_KEY` (לא `VITE_`).
- **צעדים:** 1) צור מפתח חדש ב־[Google AI Studio](https://aistudio.google.com/app/apikey). 2) הוסף ב־Vercel: `GEMINI_API_KEY` (לא VITE_). 3) מחק `VITE_GEMINI_API_KEY` אם קיים. 4) Redeploy.

### החלפת מפתחות API בצורה בטוחה (בלי לחשוף שוב)
**כלל זהב:** מפתחות API מוגדרים **רק** ב־Vercel Environment Variables (או Supabase Secrets). **אף פעם** לא בקוד, לא ב־Git, לא בקובץ .env שמתחיל ב־VITE_.

| מפתח | איפה להגדיר | איפה לא |
|------|-------------|---------|
| `GEMINI_API_KEY` | Vercel → Settings → Env Vars | לא VITE_ – לא ייחשף בדפדפן |
| `VITE_SUPABASE_ANON_KEY` | Vercel → Settings → Env Vars | anon = ציבורי, אבל צריך להתאים לפרויקט |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + Supabase Secrets | לעולם לא בקוד/דפדפן |
| `RESEND_API_KEY` | Vercel → Settings → Env Vars | לא בקוד |

**פרודקשן (viraly.co.il):** אם viraly.co.il הוא פרויקט Vercel נפרד – צריך להגדיר את אותם מפתחות **בפרויקט שמגיש ל־viraly.co.il**.

### מייל אימות/איפוס – שפה
- **מייל בעברית כשצריך אנגלית:** ה־auth-send-email hook לא פרוס. Supabase שולח מתבנית ברירת מחדל. יש לפרוס את ה-Hook (ראה למעלה).
- **זיהוי שפה:** הרשמה – משפת הממשק (preferred_language ב־metadata). איפוס סיסמה – מ־profiles.preferred_language (אם לא קיים: עברית).
- **אחרי אימות:** הקישור במייל מפנה עם ?lang= – אנגלית → lang=en, עברית → lang=he.

### בדיקה: איזה פרויקט Vercel מגיש ל־viral-video-pro.vercel.app?
אם יש לך כמה פרויקטים (למשל viral-video-pro ו־viralypro) – עדכן את ה־env vars **בפרויקט שמגיש** ל־viral-video-pro.vercel.app.

---

## Git
- **Repo:** maorcomp-debug/ViralVideoPro
- **Branch:** main

## Production (viraly.co.il)
- **Repo:** maorcomp-debug/ViralyPro
- לא לדחוף קוד גיבוי לפרודקשן – רק ViralVideoPro.
