# הגדרת תשלום דרך Takbull Payment Gateway

## סקירה

אינטגרציה מלאה עם Takbull Payment Gateway לתשלומי מנוי. המערכת כוללת:
- יצירת הזמנות ושמירה ב-DB
- פתיחת דף תשלום ב-iframe
- עיבוד callback לאחר תשלום
- IPN endpoint לאימות אסינכרוני ותשלומים חוזרים

## שלבים להגדרה

### 1. הגדרת משתני סביבה ב-Vercel

1. לך ל-Vercel Dashboard > הפרויקט שלך > Settings > Environment Variables
2. הוסף את המשתנים הבאים:

#### משתנים נדרשים:

- **`TAKBULL_API_KEY`**
  - Value: `a69f75da-d145-43f5-ae42-88c8fe0b18c6`
  - Environments: Production, Preview, Development

- **`TAKBULL_API_SECRET`**
  - Value: `4f4ad4bb-613e-4c05-81d5-876f83e68dc1`
  - Environments: Production, Preview, Development

- **`TAKBULL_REDIRECT_URL`**
  - Value: `https://viraly.co.il/order-received` (או הכתובת שלך)
  - Environments: Production, Preview, Development

- **`SUPABASE_URL`** (אם עדיין לא מוגדר)
  - Value: כתובת ה-Supabase שלך
  - Environments: Production, Preview, Development

- **`SUPABASE_SERVICE_ROLE_KEY`** (אם עדיין לא מוגדר)
  - Value: Service Role Key מ-Supabase Dashboard > Settings > API
  - Environments: Production, Preview, Development

#### דוגמה להגדרה:

```
TAKBULL_API_KEY=a69f75da-d145-43f5-ae42-88c8fe0b18c6
TAKBULL_API_SECRET=4f4ad4bb-613e-4c05-81d5-876f83e68dc1
TAKBULL_REDIRECT_URL=https://viraly.co.il/order-received
SUPABASE_URL=https://poejxozjnwrsakrhiyny.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. הרצת Migration ב-Supabase

1. לך ל-Supabase Dashboard > SQL Editor
2. העתק את כל התוכן של `supabase/migrations/008_add_takbull_orders.sql`
3. הרץ את ה-SQL
4. זה יוצר את הטבלה `takbull_orders` עם כל ה-policies

### 3. הגדרת Redirect URL ב-Takbull Dashboard

1. לך ל-Takbull Dashboard
2. הגדר את ה-Redirect URL ל: `https://viraly.co.il/api/takbull/callback`
3. הגדר את ה-IPN URL ל: `https://viraly.co.il/api/takbull/ipn`

### 4. יצירת Thank You Page

צריך ליצור דף "תודה על הרכישה" ב-`/order-received/[orderReference]`.

## מבנה ה-API Endpoints

### 1. `/api/takbull/init-order` (POST)
- **תפקיד**: יוצר הזמנה ב-DB וקורא ל-Takbull API
- **Input**: `{ userId, subscriptionTier, billingPeriod, planId? }`
- **Output**: `{ ok: true, orderId, orderReference, paymentUrl, uniqId }`
- **DealType**: 4 (Subscription)

### 2. `/api/takbull/callback` (GET)
- **תפקיד**: עיבוד תגובה לאחר תשלום (RedirectAddress)
- **Parameters**: כל הפרמטרים מ-URL query string
- **פעולות**:
  - מעדכן את ה-order ב-DB
  - אם statusCode = 0: יוצר subscription ומעדכן profile
  - מפנה לדף תודה

### 3. `/api/takbull/ipn` (POST)
- **תפקיד**: אימות אסינכרוני ותשלומים חוזרים
- **פעולות**:
  - מעדכן order status
  - מטפל בתשלומים חוזרים
  - אם תשלום נכשל: מעדכן subscription ל-inactive
  - TODO: שליחת מייל ללקוח על תשלום שנכשל

## זרימת התשלום

1. **משתמש בוחר חבילה** → `handleSelectPlan` נקרא
2. **קריאה ל-`/api/takbull/init-order`** → יוצר order ב-DB
3. **פתיחת TakbullPaymentModal** → מציג iframe עם דף התשלום
4. **משתמש משלם** → Takbull מפנה ל-`/api/takbull/callback`
5. **Callback מעדכן DB** → יוצר subscription ומעדכן profile
6. **IPN מאמת** → אימות אסינכרוני ותשלומים חוזרים

## קבצים שנוצרו/עודכנו

1. **`supabase/migrations/008_add_takbull_orders.sql`** - טבלת הזמנות
2. **`api/takbull/init-order.ts`** - יצירת הזמנה
3. **`api/takbull/callback.ts`** - עיבוד callback
4. **`api/takbull/ipn.ts`** - IPN endpoint
5. **`src/components/modals/TakbullPaymentModal.tsx`** - Modal עם iframe
6. **`index.tsx`** - עודכן `handleSelectPlan` לשימוש ב-Takbull
7. **`vercel.json`** - כבר מוגדר ל-API routes

## הערות חשובות

- **DealType = 4** - זה subscription (תשלום חוזר)
- **Recurring Payments** - המערכת תומכת בתשלומים חוזרים
- **Token Storage** - ה-token נשמר ב-DB לתשלומים חוזרים
- **Failed Payments** - אם תשלום נכשל, ה-subscription מסומן כ-inactive
- **Free Tier** - עדיין מעודכן ישירות ללא תשלום

## בדיקה

1. בחר חבילה בתשלום (לא free)
2. הטופס אמור להיפתח עם iframe של Takbull
3. השלם תשלום (או test payment)
4. בדוק שהזמנה נשמרה ב-`takbull_orders` ב-Supabase
5. בדוק שה-subscription נוצר ב-`subscriptions`
6. בדוק שה-profile עודכן

## פתרון בעיות

### אם ה-iframe לא נפתח:
- בדוק שהמשתנים `TAKBULL_API_KEY` ו-`TAKBULL_API_SECRET` מוגדרים
- בדוק את ה-logs ב-Vercel Functions

### אם ה-callback לא עובד:
- בדוק שה-Redirect URL מוגדר נכון ב-Takbull Dashboard
- בדוק את ה-logs ב-`/api/takbull/callback`

### אם ה-IPN לא עובד:
- בדוק שה-IPN URL מוגדר ב-Takbull Dashboard
- בדוק את ה-logs ב-`/api/takbull/ipn`

