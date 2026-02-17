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
| VITE_GEMINI_API_KEY | ניתוח AI | Production, Preview |
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
| VITE_SUPABASE_ANON_KEY | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZWp4b3pqbndyc2FrcmhpeW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzOTA2MzcsImV4cCI6MjA4MTk2NjYzN30.UvZO82HzVBzN_bozWUnI8bRI_HGhheDdg6tVRnftXBs` |

אם ה־ANON_KEY מתחיל ב־`eyJ...` אבל ה-ref בתוך ה-JWT הוא `iwrccjxtowrywpeatoik` – זה פרויקט אחר. השתמש במפתח שמכיל `poejxozjnwrsakrhiyny`.

### בדיקה: איזה פרויקט Vercel מגיש ל־viral-video-pro.vercel.app?
אם יש לך כמה פרויקטים (למשל viral-video-pro ו־viralypro) – עדכן את ה־env vars **בפרויקט שמגיש** ל־viral-video-pro.vercel.app.

---

## Git
- **Repo:** maorcomp-debug/ViralVideoPro
- **Branch:** main

## Production (viraly.co.il)
- **Repo:** maorcomp-debug/ViralyPro
- לא לדחוף קוד גיבוי לפרודקשן – רק ViralVideoPro.
