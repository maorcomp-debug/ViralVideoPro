# 🔐 משתני סביבה נדרשים ב-Vercel למחיקת משתמשים

## הבעיה:
השגיאה "Missing Supabase credentials" מופיעה כי חסרים משתני הסביבה ב-Vercel.

## הפתרון:

### 1. לך ל-Vercel Dashboard:
- בחר את הפרויקט שלך
- לך ל-Settings → Environment Variables

### 2. הוסף/וודא שיש לך את המשתנים הבאים:

#### משתנים חובה:
```
SUPABASE_URL=https://your-project.supabase.co
```
או
```
VITE_SUPABASE_URL=https://your-project.supabase.co
```

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### משתנה אופציונלי (לבדיקת admin):
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```
או
```
SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. איך למצוא את המפתחות ב-Supabase:

1. **לך ל-Supabase Dashboard**: https://app.supabase.com
2. **בחר את הפרויקט שלך**
3. **לך ל-Settings** (בתפריט השמאלי)
4. **לחץ על API**
5. **תראה**:
   - **Project URL**: זה ה-`SUPABASE_URL` או `VITE_SUPABASE_URL`
   - **anon public key**: זה ה-`NEXT_PUBLIC_SUPABASE_ANON_KEY` או `SUPABASE_ANON_KEY`
   - **service_role key**: זה ה-`SUPABASE_SERVICE_ROLE_KEY` (⚠️ זהירות - זה מפתח רגיש!)

### 4. אחרי הוספת המשתנים:

1. **Redeploy את הפרויקט**:
   - לך ל-Deployments
   - לחץ על "..." ליד ה-deployment האחרון
   - בחר "Redeploy"

או

2. **חכה ל-deployment הבא** (אם יש auto-deploy מ-GitHub)

---

## ⚠️ חשוב:

- **`SUPABASE_SERVICE_ROLE_KEY`** הוא מפתח רגיש מאוד - אל תשתף אותו!
- **`SUPABASE_SERVICE_ROLE_KEY`** נותן גישה מלאה ל-Supabase - השתמש בו רק ב-server-side code
- ודא שהמשתנים מוגדרים ל-**Production**, **Preview**, ו-**Development** (או לפחות ל-Production)

---

## בדיקה:

1. נסה למחוק משתמש דרך פאנל הניהול
2. אם עדיין יש שגיאה, בדוק את ה-Logs ב-Vercel:
   - לך ל-Deployments → בחר deployment → Functions → `api/admin/delete-user`
   - חפש הודעות שגיאה

---

## אם עדיין יש בעיה:

1. **בדוק את ה-Logs ב-Vercel** - הם יכילו מידע מפורט על איזה משתנה חסר
2. **ודא שהמשתנים מוגדרים נכון** - העתק-הדבק את הערכים מ-Supabase
3. **Redeploy** את הפרויקט אחרי הוספת משתנים חדשים

