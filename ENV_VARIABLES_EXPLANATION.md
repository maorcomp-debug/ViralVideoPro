# הסבר על Environment Variables

## ההבדל בין `VITE_` ל-לא `VITE_`

### `VITE_SUPABASE_SERVICE_ROLE_KEY` (עם VITE_)
- **איפה:** Client-side (דפדפן)
- **איך:** `import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY`
- **שימוש:** `src/lib/supabase-helpers.ts` → `getAdminClient()`
- **למה:** לטעינת נתונים בפאנל האדמין (getAllUsers, getAllAnalyses, וכו')
- **חשיפה:** ⚠️ נחשף לדפדפן (כל משתנה עם `VITE_` נחשף)

### `SUPABASE_SERVICE_ROLE_KEY` (בלי VITE_)
- **איפה:** Server-side (Vercel API routes)
- **איך:** `process.env.SUPABASE_SERVICE_ROLE_KEY`
- **שימוש:** `api/admin/delete-user.ts`, `api/takbull/*.ts`
- **למה:** לפעולות רגישות כמו מחיקת משתמשים
- **חשיפה:** ✅ לא נחשף לדפדפן (רק ב-Vercel)

## למה צריך את שניהם?

1. **Client-side (`VITE_`):** 
   - פאנל האדמין צריך לטעון נתונים
   - `getAdminClient()` משתמש ב-service role key כדי לעקוף RLS
   - זה רץ בדפדפן

2. **Server-side (ללא `VITE_`):**
   - API routes כמו `delete-user.ts` צריכים service role key
   - זה רץ ב-Vercel (server), לא בדפדפן
   - יותר בטוח לפעולות רגישות

## מה להוסיף ב-Vercel?

הוסף את **שניהם** עם אותו service role key:

```
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## הערה אבטחה

⚠️ **שימוש ב-service role key ב-client-side לא מומלץ מבחינת אבטחה**, אבל זה מה שצריך לעבוד כרגע כדי שהפאנל האדמין יעבוד.

**אלטרנטיבה עתידית:** להעביר את כל הפונקציות האדמין ל-API routes (server-side) במקום client-side.
