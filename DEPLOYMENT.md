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
אם מקבלים `AuthApiError: Invalid API key` בהרשמה:
1. **בדוק התאמה:** `VITE_SUPABASE_ANON_KEY` חייב להתאים לפרויקט של `VITE_SUPABASE_URL`.
2. **מפתח שגוי:** אם ה-URL הוא `poejxozjnwrsakrhiyny.supabase.co` – המפתח חייב להיות של אותו פרויקט (לא של פרויקט אחר).
3. **Vercel:** עדכן את `VITE_SUPABASE_ANON_KEY` ב־Settings → Environment Variables.
4. **Redeploy:** אחרי שינוי env vars – חייבים Redeploy (Vite מקפיא את הערכים בזמן build).

---

## Git
- **Repo:** maorcomp-debug/ViralVideoPro
- **Branch:** main

## Production (viraly.co.il)
- **Repo:** maorcomp-debug/ViralyPro
- לא לדחוף קוד גיבוי לפרודקשן – רק ViralVideoPro.
