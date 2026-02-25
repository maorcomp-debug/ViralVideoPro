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

1. **Site URL:** `https://viraly.co.il` (פרודקשן) או `https://viral-video-pro.vercel.app` (גיבוי)
2. **Redirect URLs** – הוסף **את שניהם** (פרודקשן + גיבוי) כדי שהמיילים יעבדו בשני האתרים:
   - `https://viraly.co.il/**`
   - `https://viraly.co.il`
   - `https://www.viraly.co.il/**`
   - `https://viral-video-pro.vercel.app/**`
   - `https://viral-video-pro.vercel.app`

בלי זה – קישור אימות המייל לא יעבוד וההרשמה תיכשל.

---

## Auth Hook – מיילים דו־לשוניים + שליחה מויראלי (לא מ-Supabase Auth)
**בלי ה-Hook –** Supabase שולח מיילים מ־`noreply@mail.app.supabase.io` (Supabase Auth), תבנית עברית בלבד.  
**עם ה-Hook –** מיילים דרך Resend מויראלי (`CONTACT_FROM_EMAIL`), עברית/אנגלית לפי שפת הממשק.

**חשוב:** אם המייל מגיע מ־"Supabase Auth" – ה-Hook לא מופעל. הפעל אותו (שלב 4 למטה).

**Flow עברית:** הרשמה בעברית → מייל אימות בעברית → קישור → כניסה ל־?lang=he.  
**Flow אנגלית:** הרשמה ב־?lang=en → מייל אימות באנגלית → קישור → כניסה ל־?lang=en.

**חובה:** `VITE_APP_URL` ב־Supabase Secrets = `https://viral-video-pro.vercel.app` (ה־API של send-auth-email נמצא שם).  
**חובה ב־Vercel:** `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` (כתובת מאומתת ב־Resend – למשל `noreply@viraly.co.il`).

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

4. **הפעל את ה-Hook ב-Dashboard:** Authentication → Hooks → Configure hook → Enable Send Email hook → בחר `auth-send-email` (HTTPS)

5. **הרץ את המיגרציה** (preferred_language בפרופיל):
   ```bash
   npx supabase db push
   ```
   או הרץ ידנית: `supabase/migrations/20260217120000_add_preferred_language_to_handle_new_user.sql`

---

## Troubleshooting

### הרשמה/כניסה לא עובדת
1. **ודא מפתחות Supabase:** `VITE_SUPABASE_URL` ו־`VITE_SUPABASE_ANON_KEY` ב־Vercel תואמים לפרויקט `poejxozjnwrsakrhiyny` (ראה "תיקון ב־Vercel" למטה).
2. **Redirect URLs:** Supabase → Authentication → URL Configuration – הוסף את כתובת האתר (viral-video-pro.vercel.app או viraly.co.il).
3. **מייל אימות:** אם לא מגיע מייל – הפעל את auth-send-email Hook (ראה "Auth Hook" למעלה) או הגדר SMTP מותאם ב־Supabase.
4. **Redeploy:** אחרי עדכון env vars – Redeploy ב־Vercel (ללא cache).

### 401 Invalid API key
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

### המייל מגיע מ־"Supabase Auth" / עברית בלבד
- **סיבה:** ה-Send Email Hook לא מופעל. Supabase שולח מתבניתו המובנית.
- **פתרון:** Supabase Dashboard → **Authentication** → **Hooks** → **Send Email** → Enable → בחר `auth-send-email` (HTTPS).
- אחרי ההפעלה: מיילים יישלחו דרך Resend מויראלי, דו־לשוני.

### 429 / "Invalid email" אחרי כמה ניסיונות הרשמה
- **סיבה:** מגבלת **שליחת מיילים** של Supabase (ברירת מחדל: 2 מיילים בשעה) – **לא** מגבלת "sign-ups and sign-ins" (30/5 דקות).
- **הבדל:** "Rate limit for sign-ups and sign-ins" = בקשות הרשמה/כניסה. **Email rate limit** = שליחת מייל אימות – מגבלה נפרדת (`rate_limit_email_sent`).
- **פתרון:** Supabase Dashboard → **Authentication** → **Rate Limits** – חפש **Email** / `rate_limit_email_sent` והעלה (למשל ל־10 או 30). דורש SMTP מותאם או Hook.

### לא מגיע מייל אימות בכלל (Hook מופעל)
- **סיבה:** ה-API `send-auth-email` נכשל (Vercel) או Resend דוחה.
- **בדיקה 1 – Supabase Logs:** Edge Functions → auth-send-email → Logs. אם רואים `API error 500` – ה-API נכשל.
- **בדיקה 2 – Vercel:** Settings → Environment Variables – חובה: `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **בדיקה 3 – Resend:** הדומיין של `CONTACT_FROM_EMAIL` חייב להיות מאומת ב־Resend. לדוגמה: `noreply@viraly.co.il` דורש אימות של `viraly.co.il`.
- **בדיקה 4 – Resend Logs:** Resend Dashboard → Logs – האם המייל נשלח או נכשל?
- **בדיקה 5 – ספאם:** בדוק תיקיית ספאם.

### מייל אימות/איפוס – שפה
- **מייל בעברית כשצריך אנגלית:** ה־auth-send-email hook לא פרוס או לא מופעל. Supabase שולח מתבנית ברירת מחדל. יש לפרוס ולהפעיל את ה-Hook (ראה למעלה).
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
