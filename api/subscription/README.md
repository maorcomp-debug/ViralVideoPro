# API מנוי – השהה / ביטול / חידוש

## הרצת מיגרציה

הרץ את המיגרציה ב-Supabase (Dashboard → SQL Editor או `supabase db push`):

```
supabase/migrations/20260208120000_subscription_management_schema.sql
```

אחרי ההרצה יופיעו הטבלה `subscription_events` והעמודות החדשות בטבלת `subscriptions`.

## משתני סביבה (Vercel)

- `SUPABASE_URL` / `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY` (לאימות משתמש ב-status/pause/cancel/resume)
- אופציונלי: `TAKBULL_API_KEY`, `TAKBULL_API_SECRET` – לעצירה/חידוש חיוב מחזורי בתקבול (אם ה-API תומך)
- אופציונלי: `CRON_SECRET` או `SUBSCRIPTION_CRON_SECRET` – לאבטחת קריאה ל-downgrade-expired

## Endpoints

- **GET /api/subscription/status** – סטטוס מנוי נוכחי (דורש `Authorization: Bearer <session_access_token>`)
- **POST /api/subscription/pause** – השהיית מנוי
- **POST /api/subscription/cancel** – ביטול מנוי
- **POST /api/subscription/resume** – חידוש מנוי (ממושהה)
- **POST /api/subscription/downgrade-expired** – Cron: הורדה ל-Free (דורש CRON_SECRET)

## Cron – הורדה אוטומטית ל-Free

הפער את `POST /api/subscription/downgrade-expired` פעם ביום (או פעם בשעה), עם אבטחה:

- ב-Vercel: הוסף ב-`vercel.json` cron job שקורא ל-URL עם `Authorization: Bearer <CRON_SECRET>`.
- או שירות חיצוני (cron-job.org וכו') ש-POST ל-URL עם header או body `secret: CRON_SECRET`.

## מיילים

נכון לעכשיו הפעולות (השהה/ביטול/חידוש/הורדה ל-Free) מעדכנות רק DB. לשליחת מיילים:

- ב-`api/subscription/pause.ts`, `cancel.ts`, `resume.ts` – להוסיף קריאה ל-Resend (בדומה ל-`send-benefit-email`) עם תבנית בעברית.
- ב-`api/subscription/downgrade-expired.ts` – לשלוח מייל "המנוי הסתיים והועברת לחבילה החינמית".
