# הוראות להרצת Migration ב-Supabase

## אפשרות 1: דרך Supabase Dashboard (הכי פשוט) ⭐

1. **לך ל-Supabase Dashboard:**
   - https://app.supabase.com
   - בחר את הפרויקט שלך

2. **פתח SQL Editor:**
   - בתפריט השמאלי, לחץ על "SQL Editor"
   - לחץ על "New query"

3. **העתק את התוכן:**
   - פתח את הקובץ: `supabase/migrations/008_add_takbull_orders.sql`
   - העתק את כל התוכן (Ctrl+A, Ctrl+C)

4. **הדבק והרץ:**
   - הדבק ב-SQL Editor (Ctrl+V)
   - לחץ על "Run" או Ctrl+Enter
   - חכה לאישור שהטבלה נוצרה

5. **וודא שהטבלה נוצרה:**
   - לך ל-Table Editor
   - בדוק שיש טבלה בשם `takbull_orders`

---

## אפשרות 2: דרך Supabase CLI (אם מותקן)

אם יש לך Supabase CLI מותקן:

```bash
# התקן Supabase CLI (אם לא מותקן)
npm install -g supabase

# התחבר לפרויקט
supabase login

# קשר את הפרויקט המקומי לפרויקט ב-Supabase
supabase link --project-ref your-project-ref

# הרץ את ה-migration
supabase db push
```

---

## אפשרות 3: דרך Node.js Script (דורש Service Role Key)

אם יש לך Service Role Key, תוכל להריץ:

```bash
# הגדר משתני סביבה
export SUPABASE_URL=your-supabase-url
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# הרץ את הסקריפט
node scripts/run-takbull-migration.js
```

**איפה למצוא Service Role Key:**
1. Supabase Dashboard > Settings > API
2. תחת "Project API keys"
3. העתק את "service_role" key (⚠️ סודי!)

---

## בדיקה שהטבלה נוצרה

לאחר הרצת ה-migration, בדוק:

1. **ב-Table Editor:**
   - לך ל-Supabase Dashboard > Table Editor
   - חפש את הטבלה `takbull_orders`
   - וודא שיש לה את כל העמודות

2. **ב-SQL Editor:**
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'takbull_orders';
   ```

3. **בדיקת Policies:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'takbull_orders';
   ```

---

## פתרון בעיות

### שגיאה: "relation already exists"
- הטבלה כבר קיימת. זה בסדר - ה-migration משתמש ב-`CREATE TABLE IF NOT EXISTS`

### שגיאה: "permission denied"
- וודא שאתה משתמש ב-Service Role Key (לא Anon Key)
- או הרץ דרך Supabase Dashboard (יש לך הרשאות admin שם)

### שגיאה: "function update_updated_at_column does not exist"
- הפונקציה הזו צריכה להיות מוגדרת ב-migration קודם
- בדוק אם יש migration `001_initial_schema.sql` שיוצר את הפונקציה
- אם לא, הוסף:
  ```sql
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```

---

## ✅ אחרי שהטבלה נוצרה

1. ✅ הטבלה `takbull_orders` קיימת
2. ✅ כל ה-Policies מוגדרות
3. ✅ כל ה-Indexes נוצרו
4. ✅ Trigger ל-`updated_at` עובד

עכשיו תוכל להשתמש ב-Takbull Payment Gateway! 🎉

