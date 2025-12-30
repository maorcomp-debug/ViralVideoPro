# 🔑 איך למצוא את ה-Secret Key ב-Supabase (ממשק חדש)

## 📍 איפה למצוא:

1. **לך ל-Supabase Dashboard:**
   - https://app.supabase.com
   - בחר את הפרויקט שלך

2. **בתפריט השמאלי:**
   - לחץ על "Project Settings" (או "Settings")
   - לחץ על "API Keys"

3. **תראה 2 טאבים:**
   - **"Publishable and secret API keys"** (הממשק החדש) ← זה מה שאתה רואה
   - **"Legacy anon, service_role API keys"** (הממשק הישן)

---

## 🔍 אופציה 1: Secret Key חדש (מומלץ)

1. **תחת הטאב "Publishable and secret API keys":**
   - גלול למטה לסקשן **"Secret keys"**
   - תראה טבלה עם "NAME" ו-"API KEY"

2. **מצא את השורה עם NAME: "default":**
   - ה-API KEY יהיה מוסתר: `sb_secret_MLDso••••••••••••`

3. **לחשוף את המפתח:**
   - לחץ על אייקון העין (👁️) ליד ה-API KEY
   - או לחץ על אייקון העתקה (📋) כדי להעתיק ישירות

4. **המפתח יתחיל ב-`sb_secret_`**
   - זה המפתח החדש של Supabase
   - העתק אותו

5. **הדבק ב-Vercel:**
   - Vercel Dashboard > Settings > Environment Variables
   - מצא או צור `SUPABASE_SERVICE_ROLE_KEY`
   - הדבק את המפתח

---

## 🔍 אופציה 2: Legacy service_role (אם יש)

1. **לחץ על הטאב "Legacy anon, service_role API keys"**

2. **תחת "Project API keys":**
   - מצא את **"service_role"** (לא "anon public"!)
   - לחץ על "Reveal" ליד service_role

3. **המפתח יתחיל ב-`eyJ...`**
   - זה המפתח הישן של Supabase
   - העתק אותו

4. **הדבק ב-Vercel:**
   - Vercel Dashboard > Settings > Environment Variables
   - מצא או צור `SUPABASE_SERVICE_ROLE_KEY`
   - הדבק את המפתח

---

## ✅ איזה מפתח להשתמש?

- **אם יש לך Secret Key חדש (`sb_secret_...`):** השתמש בו ← **מומלץ!**
- **אם יש לך רק Legacy service_role (`eyJ...`):** השתמש בו ← גם עובד
- **אם יש לך שניהם:** השתמש ב-Secret Key החדש

---

## ⚠️ חשוב:

- **אל תשתף את המפתח!** - זה מפתח סודי עם הרשאות מלאות
- **המפתח צריך להיות ב-Vercel** כ-`SUPABASE_SERVICE_ROLE_KEY`
- **אחרי הוספת המפתח, צריך לעשות Redeploy** ב-Vercel

---

## 🔍 איך לבדוק שהמפתח נכון:

1. **וודא שהוא מוגדר ב-Vercel:**
   - Vercel Dashboard > Settings > Environment Variables
   - חפש `SUPABASE_SERVICE_ROLE_KEY`
   - וודא שהערך תואם למה שראית ב-Supabase

2. **Redeploy:**
   - Vercel Dashboard > Deployments
   - לחץ על "..." > "Redeploy"

3. **נסה שוב לשדרג חבילה:**
   - אם זה עובד → המפתח נכון! ✅
   - אם עדיין יש שגיאה → בדוק את ה-Logs ב-Vercel

---

## 📸 איפה זה בממשק:

```
Supabase Dashboard
├── Project Settings (בתפריט השמאלי)
    └── API Keys
        ├── Tab: "Publishable and secret API keys" ← הממשק החדש
        │   ├── Publishable key
        │   └── Secret keys ← כאן!
        │       └── default → sb_secret_... (לחץ על 👁️)
        │
        └── Tab: "Legacy anon, service_role API keys" ← הממשק הישן
            └── Project API keys
                └── service_role → eyJ... (לחץ על Reveal)
```

---

## 🎯 סיכום:

1. **לך ל-Supabase Dashboard > Project Settings > API Keys**
2. **תחת "Secret keys" → מצא "default"**
3. **לחץ על 👁️ לחשוף את המפתח**
4. **העתק את המפתח (`sb_secret_...`)**
5. **הדבק ב-Vercel כ-`SUPABASE_SERVICE_ROLE_KEY`**
6. **Redeploy ב-Vercel**

**זה הכל! 🎉**

