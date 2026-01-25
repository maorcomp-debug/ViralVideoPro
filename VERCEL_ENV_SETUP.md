# Vercel Environment Variables Setup

## בעיה
כשמנסים למחוק משתמש או להשתמש בפונקציות אדמין, מקבלים שגיאה:
```
Missing Supabase credentials. Please check Vercel environment variables: 
SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY
```

## פתרון

### 1. עדכן Vercel Environment Variables

1. לך ל-Vercel Dashboard: https://vercel.com/dashboard
2. בחר את הפרויקט שלך
3. לך ל-**Settings** → **Environment Variables**
4. הוסף את המשתנים הבאים:

#### למצב Production:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### למצב Preview/Development:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. איפה למצוא את הערכים?

1. **VITE_SUPABASE_URL** ו-**VITE_SUPABASE_ANON_KEY**:
   - לך ל-Supabase Dashboard → Settings → API
   - העתק את ה-URL וה-anon key

2. **SUPABASE_SERVICE_ROLE_KEY**:
   - לך ל-Supabase Dashboard → Settings → API
   - העתק את ה-**service_role** key (לא ה-anon key!)
   - ⚠️ זה key רגיש - אל תשתף אותו!

### 3. אחרי הוספת המשתנים

1. **Redeploy** את האפליקציה ב-Vercel:
   - לך ל-Deployments
   - לחץ על "..." ליד ה-deployment האחרון
   - בחר "Redeploy"

2. או פשוט **push** שינוי חדש ל-GitHub - זה יגרום ל-Vercel ל-redeploy אוטומטית

### 4. בדיקה

אחרי ה-redeploy, נסה:
- למחוק משתמש (אמור לעבוד)
- לפתוח את פאנל האדמין (אמור לטעון נתונים)

## הערות חשובות

- `.env.local` עובד רק **locally** (במחשב שלך)
- ב-**Vercel** צריך להוסיף את המשתנים ב-Environment Variables
- ה-**service_role** key מעקף את כל ה-RLS policies - שמור אותו בטוח!
