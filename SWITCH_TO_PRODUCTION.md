# מעבר לגיבוי כפרודקשן – רשימת בדיקה

כשמחליפים את הדומיין viraly.co.il מהפרויקט הישן לפרויקט הגיבוי (זה):

## 1. Vercel – דומיין ופרויקט

- [ ] **הסר** את viraly.co.il מהפרויקט הישן (אם קיים)
- [ ] **הוסף** את viraly.co.il כערך Custom Domain לפרויקט הזה (ViralVideoPro)
- [ ] אם יש www: הוסף גם `www.viraly.co.il` (או הגדר redirect מ-www ל-naked)

## 2. משתני סביבה ב-Vercel (פרויקט הגיבוי)

| משתנה | ערך לפרודקשן | הערה |
|-------|---------------|------|
| `VITE_APP_URL` | `https://viraly.co.il` | **חובה** – קישורים במיילים, Auth Hook |
| שאר המשתנים | ללא שינוי | Supabase, Resend, Takbull, Gemini – אותו פרויקט |

## 3. Supabase

### URL Configuration (Authentication → URL Configuration)

- [ ] **Site URL:** `https://viraly.co.il`
- [ ] **Redirect URLs** – וודא שמופיעים:
  - `https://viraly.co.il`
  - `https://viraly.co.il/**`
  - `https://www.viraly.co.il` (אם משתמשים)
  - `https://www.viraly.co.il/**`

### Supabase Secrets (Auth Hook)

ה-Hook `auth-send-email` קורא ל-API שלך. כשהדומיין הוא viraly.co.il, ה-API נמצא שם:

```bash
npx supabase secrets set VITE_APP_URL=https://viraly.co.il
```

(אין צורך ל-redeploy את ה-Edge Function – ה-Secrets נקראים בזמן ריצה)

## 4. Takbull

- **TAKBULL_REDIRECT_URL** – **לא חובה** להגדיר. הקוד משתמש ב-`req.headers.origin` – כשהמשתמש על viraly.co.il, ה-origin יהיה נכון.
- אם בכל זאת רוצים override: `TAKBULL_REDIRECT_URL=https://viraly.co.il/order-received`

## 5. מה לא צריך לשנות

| רכיב | סיבה |
|------|------|
| **קוד** | משתמש ב-`window.location.origin` ו-`req.headers.origin` – מתעדכן אוטומטית |
| **Supabase DB** | אותו פרויקט – אין צורך בהעברת נתונים |
| **Resend** | `CONTACT_FROM_EMAIL` (למשל noreply@viraly.co.il) – הדומיין viraly.co.il כבר מאומת |
| **Takbull API** | אותם מפתחות – אין callback URL להגדיר (המשתמש מופנה ל-/order-received וה-page קורא ל-callback API) |

## 6. סדר ביצוע מומלץ

1. עדכן **Vercel** – VITE_APP_URL = `https://viraly.co.il`
2. עדכן **Supabase Secrets** – VITE_APP_URL = `https://viraly.co.il`
3. עדכן **Supabase Site URL** ל-`https://viraly.co.il`
4. **הוסף** את viraly.co.il כ-Custom Domain לפרויקט הזה ב-Vercel
5. **הסר** את viraly.co.il מהפרויקט הישן (אם רלוונטי)
6. **Redeploy** ב-Vercel (Deployments → Redeploy) כדי לוודא שכל ה-env vars נטענו

## 7. בדיקות אחרי המעבר

- [ ] הרשמה חדשה – מייל אימות מגיע, קישור מחזיר ל-viraly.co.il
- [ ] כניסה – עובדת
- [ ] תשלום – init-order → Takbull → חזרה ל-/order-received
- [ ] איפוס סיסמה – מייל עם קישור ל-viraly.co.il
- [ ] טופס יצירת קשר – מייל נשלח

## 8. Redirects (אם נדרש)

- **www → naked** או **naked → www**: ב-Vercel → Domains אפשר להגדיר redirect
- אין redirectים נוספים שצריך להגדיר בקוד
