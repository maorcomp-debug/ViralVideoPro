# ✅ רשימת בדיקה - הגדרת Takbull Payment Gateway

## ✅ מה שכבר בוצע:

- [x] **Migration ב-Supabase** - הטבלה `takbull_orders` נוצרה
- [x] **API Endpoints** - כל ה-endpoints נוצרו (`init-order`, `callback`, `ipn`)
- [x] **Frontend Components** - `TakbullPaymentModal` נוצר
- [x] **Integration** - `handleSelectPlan` עודכן לשימוש ב-Takbull

---

## 🔧 מה שצריך לעשות עכשיו:

### 1. הגדרת משתני סביבה ב-Vercel ⚠️ **חובה!**

1. **לך ל-Vercel Dashboard:**
   - https://vercel.com/dashboard
   - בחר את הפרויקט שלך

2. **לך ל-Settings > Environment Variables**

3. **הוסף את המשתנים הבאים:**

   ```
   TAKBULL_API_KEY = a69f75da-d145-43f5-ae42-88c8fe0b18c6
   TAKBULL_API_SECRET = 4f4ad4bb-613e-4c05-81d5-876f83e68dc1
   TAKBULL_REDIRECT_URL = https://viraly.co.il/order-received
   ```

   **חשוב:**
   - בחר **Production**, **Preview**, ו-**Development** לכל משתנה
   - לחץ "Save" אחרי כל משתנה

4. **וודא שיש גם:**
   ```
   SUPABASE_URL = https://poejxozjnwrsakrhiyny.supabase.co
   SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
   ```

5. **Redeploy את האפליקציה:**
   - לך ל-Deployments
   - לחץ על "..." ליד ה-deployment האחרון
   - בחר "Redeploy"
   - זה חשוב כדי שהמשתנים החדשים יטענו!

---

### 2. הגדרת URLs ב-Takbull Dashboard ⚠️ **חובה!**

1. **לך ל-Takbull Dashboard** (או פנה לתמיכה של Takbull)

2. **הגדר את ה-URLs הבאים:**

   **Redirect URL (Callback):**
   ```
   https://viraly.co.il/api/takbull/callback
   ```

   **IPN URL (Async Notification):**
   ```
   https://viraly.co.il/api/takbull/ipn
   ```

   **הערה:** אם אתה עדיין ב-development, תוכל להשתמש ב-Vercel preview URL:
   ```
   https://your-project.vercel.app/api/takbull/callback
   https://your-project.vercel.app/api/takbull/ipn
   ```

---

### 3. בדיקה שהכל עובד ✅

#### בדיקה 1: בדוק שהטבלה קיימת ב-Supabase
1. לך ל-Supabase Dashboard > Table Editor
2. חפש את הטבלה `takbull_orders`
3. וודא שיש לה את כל העמודות

#### בדיקה 2: בדוק שה-API Endpoints עובדים
1. פתח בדפדפן:
   ```
   https://viraly.co.il/api/takbull/init-order
   ```
2. אתה אמור לראות שגיאה (זה תקין - זה POST endpoint)
3. אם אתה רואה שגיאה אחרת, בדוק את ה-logs ב-Vercel

#### בדיקה 3: בדוק תשלום אמיתי
1. היכנס לאפליקציה
2. בחר חבילה בתשלום (לא free)
3. לחץ על "שדרג" או "בחר חבילה"
4. אמור להיפתח modal עם iframe של Takbull
5. השלם תשלום test (אם יש)
6. בדוק שהזמנה נשמרה ב-`takbull_orders`
7. בדוק שה-subscription נוצר

---

## 🔍 פתרון בעיות

### בעיה: "Failed to initialize payment"
**פתרון:**
- בדוק שה-`TAKBULL_API_KEY` ו-`TAKBULL_API_SECRET` מוגדרים ב-Vercel
- בדוק שה-redeploy בוצע אחרי הוספת המשתנים
- בדוק את ה-logs ב-Vercel Functions

### בעיה: ה-iframe לא נפתח
**פתרון:**
- בדוק את ה-console בדפדפן (F12)
- בדוק שה-`paymentUrl` חוזר מה-API
- בדוק שה-`TakbullPaymentModal` מופיע ב-DOM

### בעיה: Callback לא עובד
**פתרון:**
- בדוק שה-Redirect URL מוגדר נכון ב-Takbull Dashboard
- בדוק את ה-logs ב-`/api/takbull/callback` ב-Vercel
- וודא שה-URL הוא בדיוק: `https://viraly.co.il/api/takbull/callback`

### בעיה: Subscription לא נוצר אחרי תשלום
**פתרון:**
- בדוק את הטבלה `takbull_orders` - האם ה-order קיים?
- בדוק את ה-`status_code` - האם הוא 0 (success)?
- בדוק את ה-logs ב-`/api/takbull/callback`
- בדוק שה-`SUPABASE_SERVICE_ROLE_KEY` מוגדר נכון

---

## 📝 סיכום - מה נשאר:

1. ✅ **Migration ב-Supabase** - **בוצע!**
2. ⚠️ **משתני סביבה ב-Vercel** - **צריך לעשות!**
3. ⚠️ **URLs ב-Takbull Dashboard** - **צריך לעשות!**
4. ✅ **קוד האפליקציה** - **מוכן!**

---

## 🎯 אחרי שתסיים:

1. כל המשתנים מוגדרים ב-Vercel
2. כל ה-URLs מוגדרים ב-Takbull
3. Redeploy בוצע
4. תשלום test עבר בהצלחה

**אז המערכת מוכנה לשימוש! 🎉**

---

## 📞 אם יש בעיות:

1. בדוק את ה-logs ב-Vercel Functions
2. בדוק את ה-console בדפדפן (F12)
3. בדוק את הטבלה `takbull_orders` ב-Supabase
4. פנה לתמיכה של Takbull אם יש בעיות עם ה-API

