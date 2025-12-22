# 🔧 פתרון בעיית הרשמה בדפדפן - 401 Unauthorized

## הבעיה:
ההרשמה נכשלת עם שגיאת 401 רק כשמנסים להירשם מהדפדפן, אבל עובדת בדרכים אחרות.

## ✅ פתרון:

### 1. **בדוק את ה-Site URL ב-Supabase:**

1. לך ל-Supabase Dashboard: https://app.supabase.com
2. בחר את הפרויקט שלך
3. לך ל-**Authentication** > **URL Configuration**
4. ודא ש-**Site URL** מוגדר ל:
   ```
   http://localhost:3000
   ```

### 2. **הוסף Redirect URLs:**

תחת **Redirect URLs**, הוסף את כל ה-URLs הבאים (לחץ על "Add URL" לכל אחד):
- `http://localhost:3000`
- `http://localhost:3000/**`
- `http://localhost:3000/#**`
- `http://localhost:3000/auth/callback`

### 3. **בדוק את Email Auth Settings:**

1. לך ל-**Authentication** > **Settings**
2. תחת **Email Auth**:
   - ✅ ודא ש-**Enable email signups** מופעל
   - ✅ ודא ש-**Enable email confirmations** מופעל (או כבה לפיתוח)
   - ✅ ודא ש-**Secure email change** מופעל

### 4. **בדוק את ה-CORS Settings:**

1. לך ל-**Settings** > **API**
2. תחת **CORS**, ודא שה-URL שלך מורשה

### 5. **נקה את ה-Cache של הדפדפן:**

1. לחץ על **Ctrl + Shift + Delete**
2. בחר "Cached images and files"
3. לחץ על "Clear data"
4. רענן את הדף (Ctrl + F5)

### 6. **נסה בדפדפן אחר או מצב Incognito:**

- פתח את האתר ב-Chrome Incognito (Ctrl + Shift + N)
- או נסה ב-Firefox/Edge
- זה יבטל בעיות של cache או cookies

### 7. **בדוק את הקונסול:**

1. פתח את הקונסול (F12 > Console)
2. נסה להירשם
3. בדוק אם יש שגיאות CORS או network errors
4. בדוק את ה-Network tab (F12 > Network) וראה מה קורה לבקשה ל-`/auth/v1/signup`

### 8. **בדוק את ה-API Key:**

1. לך ל-**Settings** > **API**
2. ודא שאתה משתמש ב-**anon public key** (לא service_role key!)
3. העתק את המפתח והשווה אותו ל-`.env.local`

---

## 🔍 Debug Steps:

אחרי שעשית את כל השלבים לעיל:

1. **פתח את הקונסול** (F12 > Console)
2. **נסה להירשם**
3. **בדוק את הלוגים:**
   - אמור לראות: `🔐 Attempting sign up...`
   - אמור לראות: `Email: ...`
   - אמור לראות: `Redirect URL: http://localhost:3000`
   - אמור לראות: `Sign up response: ...`

4. **אם יש שגיאה:**
   - העתק את כל הלוגים
   - בדוק את ה-Network tab (F12 > Network)
   - חפש את הבקשה ל-`/auth/v1/signup`
   - בדוק את ה-Response של הבקשה

---

## 💡 טיפים נוספים:

### אם עדיין לא עובד:

1. **כבה Email Confirmation זמנית** (רק לפיתוח):
   - Authentication > Settings > Email Auth
   - כבה את "Enable email confirmations"
   - נסה להירשם שוב

2. **בדוק אם יש RLS Policies:**
   - Table Editor > profiles > Policies
   - ודא שיש policy שמאפשרת INSERT:
   ```sql
   CREATE POLICY "Users can insert their own profile"
   ON profiles FOR INSERT
   WITH CHECK (auth.uid() = user_id);
   ```

3. **בדוק את ה-trigger:**
   - SQL Editor
   - הרץ: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
   - ודא שה-trigger קיים

---

## 📝 מה עוד לבדוק:

- ודא שה-`.env.local` נמצא בשורש הפרויקט (ליד `package.json`)
- ודא שהשרת הופעל מחדש אחרי עדכון `.env.local`
- ודא שאין שגיאות TypeScript/JavaScript בקונסול

