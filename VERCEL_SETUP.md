# הגדרת Vercel ל-React Router

## בעיית 404 על Routes

אם אתה מקבל שגיאת 404 על routes כמו `/admin`, `/settings`, וכו', זה אומר ש-Vercel לא יודע לטפל ב-React Router.

## פתרון 1: שימוש ב-vercel.json (מומלץ)

הקובץ `vercel.json` כבר קיים בפרויקט. הוא מכיל את ההגדרה הבאה:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**וודא שהקובץ הזה נשלח ל-GitHub/Vercel.**

## פתרון 2: הגדרה ישירה ב-Vercel Dashboard

אם הקובץ לא עובד, אתה יכול להוסיף את ההגדרה ישירות ב-Vercel:

1. לך ל-Vercel Dashboard: https://vercel.com
2. בחר את הפרויקט שלך
3. לך ל-Settings → **Redirects / Rewrites**
4. לחץ על **Add** תחת Rewrites
5. הוסף את הדברים הבאים:
   - **Source**: `/(.*)`
   - **Destination**: `/index.html`
   - **Permanent**: לא מסומן
6. לחץ על **Save**

## אימות

לאחר העדכון, בדוק:
1. האם ה-deployment הצליח
2. נסה לגשת ל-`/admin` - צריך לעבוד ללא 404
3. נסה routes אחרים כמו `/settings`

## הערות

- ההגדרה הזו מפנה את כל ה-routes ל-`index.html`, מה שמאפשר ל-React Router לטפל בהם בצד הלקוח
- זה נקרא "History API Fallback" או "Client-side Routing"

