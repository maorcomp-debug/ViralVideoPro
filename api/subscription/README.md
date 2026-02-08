# API מנוי – endpoint אחד

כל לוגיקת המנוי מרוכזת ב-**`api/subscription.ts`** (פונקציה אחת ב-Vercel).

## הרצת מיגרציה

הרץ את המיגרציה ב-Supabase:

`supabase/migrations/20260208120000_subscription_management_schema.sql`

## משתני סביבה (Vercel)

- `SUPABASE_URL` / `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY`
- אופציונלי: `TAKBULL_API_KEY`, `TAKBULL_API_SECRET`
- אופציונלי: `CRON_SECRET` או `SUBSCRIPTION_CRON_SECRET` – ל־downgrade-expired

## שימוש

- **GET /api/subscription** – סטטוס מנוי (דורש `Authorization: Bearer <session_access_token>`).
- **POST /api/subscription** עם body `{ "action": "pause" }` או `"cancel"` או `"resume"` – השהה/ביטול/חידוש (דורש Authorization).
- **POST /api/subscription** עם body `{ "action": "downgrade-expired" }` – Cron הורדה ל-Free (דורש CRON_SECRET ב־Authorization או ב־body/query כ־secret).

## Cron

הפעל פעם ביום (או בשעה) קריאה ל־`POST /api/subscription` עם body `{ "action": "downgrade-expired", "secret": "<CRON_SECRET>" }` או header `Authorization: Bearer <CRON_SECRET>`.

## מיילים

ניתן להוסיף שליחת מייל (Resend) בתוך `api/subscription.ts` אחרי כל פעולה (השהה/ביטול/חידוש/הורדה ל-Free).
