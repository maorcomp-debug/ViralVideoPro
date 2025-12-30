# 🗄️ מדריך הגדרה מלא - Supabase עבור Takbull Payment

## ✅ מה צריך להיות מוגדר ב-Supabase:

### 1. הטבלה `takbull_orders` ✅
### 2. RLS Policies (Row Level Security) ✅
### 3. Indexes לביצועים ✅
### 4. הפונקציה `update_updated_at_column` ✅
### 5. Secret Key (או Legacy service_role) נכון ✅

**הערה:** Supabase עודכן לממשק חדש. אם אתה רואה "API Keys" עם "Secret keys" - זה הממשק החדש. אם אתה רואה "Project API keys" עם "service_role" - זה הממשק הישן. שני המפתחות עובדים!

---

## 📋 שלב 1: בדיקה שהטבלה קיימת

### איך לבדוק:

1. **לך ל-Supabase Dashboard:**
   - https://app.supabase.com
   - בחר את הפרויקט שלך

2. **לך ל-Table Editor:**
   - בתפריט השמאלי, לחץ על "Table Editor"
   - חפש את הטבלה `takbull_orders`

3. **אם הטבלה לא קיימת:**
   - לך לשלב 2 (הרצת Migration)

4. **אם הטבלה קיימת:**
   - בדוק שיש לה את כל העמודות:
     - `id` (UUID)
     - `user_id` (UUID)
     - `subscription_tier` (TEXT)
     - `billing_period` (TEXT)
     - `order_reference` (TEXT)
     - `order_status` (TEXT)
     - `payment_status` (TEXT)
     - וכו'...

---

## 📋 שלב 2: הרצת Migration (אם הטבלה לא קיימת)

### איך להריץ:

1. **לך ל-SQL Editor:**
   - בתפריט השמאלי, לחץ על "SQL Editor"
   - לחץ על "New query"

2. **העתק את כל התוכן:**
   - פתח את הקובץ: `supabase/migrations/008_add_takbull_orders.sql`
   - העתק את כל התוכן (Ctrl+A, Ctrl+C)

3. **הדבק ב-SQL Editor:**
   - הדבק ב-SQL Editor (Ctrl+V)

4. **הרץ:**
   - לחץ על "Run" (או Ctrl+Enter)
   - חכה לאישור שהטבלה נוצרה

5. **וודא שהטבלה נוצרה:**
   - לך ל-Table Editor
   - בדוק שיש טבלה בשם `takbull_orders`

---

## 📋 שלב 3: בדיקה שהפונקציה `update_updated_at_column` קיימת

### למה זה חשוב:
הטבלה `takbull_orders` משתמשת ב-trigger שמעדכן את `updated_at` אוטומטית. אם הפונקציה לא קיימת, ה-migration יכשל.

### איך לבדוק:

1. **לך ל-SQL Editor:**
   - Supabase Dashboard > SQL Editor > New query

2. **הרץ את השאילתה הזו:**
   ```sql
   SELECT proname 
   FROM pg_proc 
   WHERE proname = 'update_updated_at_column';
   ```

3. **אם התוצאה ריקה (הפונקציה לא קיימת):**

   **הרץ את הקוד הזה:**
   ```sql
   CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = NOW();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```

4. **וודא שהפונקציה נוצרה:**
   - הרץ שוב את השאילתה מ-שלב 2
   - אמור להחזיר שורה אחת עם `update_updated_at_column`

---

## 📋 שלב 4: בדיקת RLS Policies

### איך לבדוק:

1. **לך ל-SQL Editor:**
   - Supabase Dashboard > SQL Editor > New query

2. **הרץ את השאילתה הזו:**
   ```sql
   SELECT policyname, cmd, qual 
   FROM pg_policies 
   WHERE tablename = 'takbull_orders';
   ```

3. **אמור להיות 4 policies:**
   - `Users can view own orders` (SELECT)
   - `Users can insert own orders` (INSERT)
   - `System can update orders` (UPDATE)
   - `Admins can view all orders` (SELECT)

4. **אם חסרות policies:**

   **הרץ את הקוד הזה:**
   ```sql
   -- Enable RLS
   ALTER TABLE public.takbull_orders ENABLE ROW LEVEL SECURITY;

   -- Drop existing policies if they exist
   DROP POLICY IF EXISTS "Users can view own orders" ON public.takbull_orders;
   DROP POLICY IF EXISTS "Users can insert own orders" ON public.takbull_orders;
   DROP POLICY IF EXISTS "System can update orders" ON public.takbull_orders;
   DROP POLICY IF EXISTS "Admins can view all orders" ON public.takbull_orders;

   -- Users can view their own orders
   CREATE POLICY "Users can view own orders"
       ON public.takbull_orders FOR SELECT
       USING (auth.uid() = user_id);

   -- Users can insert their own orders
   CREATE POLICY "Users can insert own orders"
       ON public.takbull_orders FOR INSERT
       WITH CHECK (auth.uid() = user_id);

   -- System can update orders (for callbacks and IPN)
   CREATE POLICY "System can update orders"
       ON public.takbull_orders FOR UPDATE
       USING (true); -- Allow updates from server-side callbacks

   -- Admins can view all orders
   CREATE POLICY "Admins can view all orders"
       ON public.takbull_orders FOR SELECT
       USING (
           EXISTS (
               SELECT 1 FROM public.profiles
               WHERE profiles.user_id = auth.uid()
               AND profiles.role = 'admin'
           )
       );
   ```

---

## 📋 שלב 5: בדיקת Secret Key (Service Role)

### למה זה חשוב:
ה-API endpoint משתמש ב-Secret Key כדי לגשת ל-Supabase עם הרשאות מלאות (למשל, ליצור orders).

### איך לבדוק:

1. **לך ל-Supabase Dashboard:**
   - בתפריט השמאלי → לחץ על "Project Settings" (או "Settings")
   - לחץ על "API Keys" (או "API")

2. **תחת "Secret keys":**
   - תראה טבלה עם "NAME" ו-"API KEY"
   - מצא את השורה עם NAME: "default"
   - ה-API KEY יהיה מוסתר עם כוכביות: `sb_secret_MLDso••••••••••••`

3. **העתק את ה-Secret Key:**
   - לחץ על אייקון העין (👁️) ליד ה-API KEY כדי לחשוף אותו
   - או לחץ על אייקון העתקה (📋) כדי להעתיק
   - המפתח יתחיל ב-`sb_secret_` (זה המפתח החדש של Supabase)

4. **אם אתה רואה גם "Legacy anon, service_role API keys":**
   - לחץ על הטאב "Legacy anon, service_role API keys"
   - מצא את "service_role" key
   - העתק את המפתח (מתחיל ב-`eyJ...`)

5. **וודא שהוא מוגדר ב-Vercel:**
   - Vercel Dashboard > Settings > Environment Variables
   - חפש `SUPABASE_SERVICE_ROLE_KEY`
   - וודא שהערך תואם למה שראית ב-Supabase
   - **חשוב:** אם יש לך Secret Key חדש (`sb_secret_...`), השתמש בו. אם יש לך רק Legacy service_role (`eyJ...`), השתמש בו.

---

## 📋 שלב 6: בדיקה שהכל עובד

### בדיקה 1: בדוק שהטבלה נגישה

1. **לך ל-SQL Editor:**
   ```sql
   SELECT COUNT(*) FROM public.takbull_orders;
   ```
   - אמור להחזיר מספר (אפילו 0 זה בסדר)

### בדיקה 2: בדוק שאפשר ליצור order (כמו ה-API)

1. **לך ל-SQL Editor:**
   ```sql
   -- בדוק שיש user_id תקין (החלף ב-user_id שלך)
   SELECT id FROM auth.users LIMIT 1;
   ```

2. **נסה ליצור order test:**
   ```sql
   INSERT INTO public.takbull_orders (
     user_id,
     subscription_tier,
     billing_period,
     order_reference,
     order_status,
     payment_status,
     is_recurring
   ) VALUES (
     (SELECT id FROM auth.users LIMIT 1), -- החלף ב-user_id שלך
     'creator',
     'monthly',
     'TEST-' || NOW()::TEXT,
     'pending',
     'pending',
     true
   );
   ```

3. **אם זה עובד:**
   - ✅ הטבלה מוגדרת נכון!

4. **אם יש שגיאה:**
   - בדוק את ה-RLS policies (שלב 4)
   - בדוק שה-Service Role Key נכון (שלב 5)

---

## 🔍 פתרון בעיות נפוצות

### שגיאה: "relation takbull_orders does not exist"
**פתרון:** הרץ את ה-migration (שלב 2)

### שגיאה: "function update_updated_at_column does not exist"
**פתרון:** הרץ את הקוד מ-שלב 3

### שגיאה: "new row violates row-level security policy"
**פתרון:** בדוק את ה-RLS policies (שלב 4)

### שגיאה: "permission denied"
**פתרון:** 
- בדוק שה-Service Role Key נכון (שלב 5)
- וודא שהוא מוגדר ב-Vercel

### שגיאה: "column does not exist"
**פתרון:** הרץ את ה-migration מחדש (שלב 2)

---

## ✅ Checklist סופי:

- [ ] הטבלה `takbull_orders` קיימת ב-Table Editor
- [ ] הפונקציה `update_updated_at_column` קיימת
- [ ] יש 4 RLS policies על הטבלה
- [ ] Service Role Key מוגדר ב-Vercel
- [ ] אפשר ליצור order test ב-SQL Editor
- [ ] ה-migration `008_add_takbull_orders.sql` הורץ בהצלחה

---

## 📞 אם עדיין יש בעיות:

1. **בדוק את ה-Logs ב-Vercel:**
   - Vercel Dashboard > Functions > `api/takbull/init-order` > Logs
   - חפש הודעות שגיאה

2. **בדוק את ה-Logs ב-Supabase:**
   - Supabase Dashboard > Logs > Postgres Logs
   - חפש שגיאות SQL

3. **נסה ליצור order ידנית:**
   - SQL Editor > הרץ את הקוד מ-בדיקה 2
   - אם זה לא עובד, יש בעיה ב-RLS או בטבלה

---

## 🎯 אחרי שתסיים:

1. כל השלבים למעלה בוצעו
2. הטבלה קיימת ופועלת
3. Service Role Key נכון ב-Vercel
4. נסה שוב לשדרג חבילה

**אז זה אמור לעבוד! 🎉**

