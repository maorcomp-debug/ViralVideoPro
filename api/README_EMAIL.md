# שליחת מייל (Resend) – משתני סביבה

כדי ששליחת מייל תעבוד (טופס צור קשר **ו** שליחת הטבות למייל), צריך להגדיר ב-**Vercel** (או בסביבה שבה רצים ה-API) את המשתנים הבאים.

## משתנים נדרשים

| משתנה | תיאור |
|--------|--------|
| `RESEND_API_KEY` | מפתח API מ-Resend (Dashboard → API Keys). |
| `CONTACT_FROM_EMAIL` או `FROM_EMAIL` | כתובת המייל **ממנה** נשלחים המיילים (חייבת להיות דומיין מאומת ב-Resend). |

## איפה להגדיר

1. **Vercel:**  
   Project → **Settings** → **Environment Variables**  
   להוסיף `RESEND_API_KEY` ו־`CONTACT_FROM_EMAIL` (או `FROM_EMAIL`) עם הערכים המתאימים.

2. **פיתוח מקומי:**  
   בקובץ `.env.local` (או `.env`) ברמת הפרויקט:
   ```
   RESEND_API_KEY=re_xxxxx
   CONTACT_FROM_EMAIL=onboarding@resend.dev
   ```
   (להחליף בכתובת מהדומיין שלך ב-Resend.)

## שימוש

- **טופס צור קשר** (`/api/contact`) – משתמש ב־`RESEND_API_KEY` ו־`CONTACT_FROM_EMAIL`.
- **שליחת הטבה למייל** (`/api/send-benefit-email`) – משתמש באותם משתנים; אם חסר אחד מהם, השליחה דולגת (לא נשלח מייל) בלי להפיל את האפליקציה.

אם כבר הגדרת Resend לטופס צור קשר – **אין צורך בהגדרה נוספת**; שליחת ההטבות למייל תשתמש באותם משתנים.
