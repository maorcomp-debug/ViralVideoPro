# 🔧 פתרון בעיות Authentication ב-Supabase

## השגיאה: 401 (Unauthorized) ב-/auth/v1/signup

### ✅ פתרונות אפשריים:

---

## 1. **בדוק את הגדרות Email Confirmation**

אם Email Confirmation מופעל, המשתמש צריך לאשר את האימייל לפני שהוא יכול להיכנס.

**איך לבדוק ולשנות:**

1. לך ל-Supabase Dashboard: https://app.supabase.com
2. בחר את הפרויקט שלך (`poejxozjnwrsakrhiyny`)
3. לך ל-**Authentication** > **Settings** (בתפריט השמאלי)
4. תחת **Email Auth**:
   - **Enable email confirmations**: אם זה מופעל, המשתמשים יצטרכו לאשר את האימייל
   - **Enable email signups**: ודא שזה מופעל ✅

**אפשרויות:**
- **אם אתה רוצה לבטל Email Confirmation** (לפיתוח):
  - כבה את "Enable email confirmations"
  - המשתמשים יוכלו להיכנס מיד אחרי ההרשמה

- **אם אתה רוצה להשאיר Email Confirmation**:
  - השאר מופעל
  - המשתמשים יצטרכו לאשר את האימייל שלהם
  - הוסף הודעה ברורה בטופס ההרשמה

---

## 2. **בדוק את RLS Policies**

ודא שיש policies על טבלת `profiles`:

1. לך ל-**Table Editor** > **profiles**
2. לחץ על **Policies** (בתפריט העליון)
3. ודא שיש policy שמאפשרת למשתמש ליצור פרופיל:

```sql
-- Policy name: "Users can insert their own profile"
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 3. **בדוק את המפתחות**

1. לך ל-**Settings** > **API**
2. ודא ש:
   - **Project URL** תואם ל-`VITE_SUPABASE_URL` ב-`.env.local`
   - **anon public key** תואם ל-`VITE_SUPABASE_ANON_KEY` ב-`.env.local`

---

## 4. **בדוק את Site URL**

1. לך ל-**Authentication** > **URL Configuration**
2. ודא ש-**Site URL** מוגדר ל: `http://localhost:3000` (או הכתובת שלך)
3. תחת **Redirect URLs**, הוסף:
   - `http://localhost:3000/**`
   - `http://localhost:3000`

---

## 5. **בדוק את הקונסול של הדפדפן**

פתח את הקונסול (F12 > Console) ובדוק:
- האם יש שגיאות נוספות?
- האם המפתחות נטענים נכון? (אמור לראות `🔍 Loading Supabase configuration...`)
- מה השגיאה המדויקת?

---

## 6. **נסה להירשם עם אימייל אחר**

אולי האימייל כבר קיים במערכת. נסה עם אימייל חדש.

---

## 7. **בדוק את ה-Trigger של profiles**

ודא שה-trigger ליצירת פרופיל עובד:

1. לך ל-**SQL Editor**
2. הרץ את השאילתה הבאה:

```sql
SELECT * FROM profiles WHERE user_id = (SELECT id FROM auth.users LIMIT 1);
```

---

## 💡 המלצה מהירה:

**לפיתוח מקומי:**
1. כבה Email Confirmation (Authentication > Settings > Email Auth > Enable email confirmations = OFF)
2. ודא ש-Site URL = `http://localhost:3000`
3. הפעל מחדש את השרת (`npm start`)

**לייצור:**
1. הפעל Email Confirmation
2. הגדר Site URL לכתובת הייצור שלך
3. הוסף Redirect URLs מתאימים

