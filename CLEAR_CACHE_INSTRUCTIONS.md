# הוראות לניקוי Cache ולפתרון בעיית 404

## הבעיה
כשלוחצים על כפתור "מנהל" במחשב, מקבלים 404 על `/admin`.

## פתרונות מהירים:

### 1. נקה Cache בדפדפן (מומלץ ביותר!)

**ב-Chrome/Edge:**
- לחץ `Ctrl + Shift + Delete`
- בחר "Cached images and files"
- בחר "All time"
- לחץ "Clear data"
- רענן את הדף (`F5`)

**או:**
- לחץ `Ctrl + F5` (hard refresh)
- או `Ctrl + Shift + R`

**או דרך DevTools:**
- פתח DevTools (`F12`)
- לחץ ימני על כפתור הרענון
- בחר "Empty Cache and Hard Reload"

### 2. נסה במצב Incognito/Private

- פתח חלון גלישה בסתר (`Ctrl + Shift + N`)
- התחבר לאתר
- נסה לגשת ל-`/admin`

### 3. וודא שה-vercel.json מוחל ב-Vercel

1. לך ל-Vercel Dashboard: https://vercel.com
2. בחר את הפרויקט
3. לך ל-Settings → **Redirects / Rewrites**
4. ודא שיש rewrite rule:
   - **Source**: `/(.*)`
   - **Destination**: `/index.html`
   - **Status Code**: לא מסומן (או 200)

אם אין, הוסף אותו.

### 4. בדוק שה-Deployment הצליח

1. לך ל-Vercel Dashboard → Deployments
2. ודא שה-deployment האחרון הצליח (ירוק)
3. אם יש שגיאה, בדוק את הלוגים

### 5. נסה גישה ישירה

לאחר ניקוי cache, נסה לגשת ישירות ל:
`https://viraly.co.il/admin`

אם זה עובד אחרי ניקוי cache, זה אומר שה-vercel.json עובד והבעיה הייתה cache.

## למה זה קורה?

1. **Cache בדפדפן** - הדפדפן שמר גרסה ישנה של האתר
2. **Service Worker** - אם יש service worker, הוא יכול לשמור cache
3. **CDN Cache** - Vercel משתמש ב-CDN שיכול לשמור cache

## אם כל זה לא עובד:

אפשר לנסות:
1. מחק את כל ה-cookies לאתר
2. נסה בדפדפן אחר
3. בדוק את הקונסול (`F12`) לשגיאות נוספות

