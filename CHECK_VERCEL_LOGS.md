# 🔍 איך לבדוק את ה-Logs ב-Vercel

## למה זה חשוב:
השגיאה "Failed to initialize payment" יכולה לבוא מכמה מקומות. ה-Logs ב-Vercel יראו לך בדיוק מה השגיאה.

---

## 📋 שלב 1: לך ל-Vercel Dashboard

1. **לך ל:** https://vercel.com/dashboard
2. **בחר את הפרויקט שלך**

---

## 📋 שלב 2: פתח את ה-Logs

### אופציה 1: דרך Deployments (הכי פשוט) ⭐

1. **בתפריט העליון:**
   - לחץ על "Deployments"

2. **מצא את ה-Deployment האחרון:**
   - תראה רשימת deployments
   - לחץ על ה-deployment האחרון (הכי למעלה, עם ה-commit האחרון)

3. **בדף ה-Deployment:**
   - גלול למטה
   - תראה סקשן "Functions" או "Serverless Functions"
   - לחץ על `api/takbull/init-order`

### אופציה 2: דרך Logs

1. **בתפריט העליון:**
   - לחץ על "Logs"

2. **בדף Logs:**
   - תראה רשימת logs
   - חפש logs מ-`api/takbull/init-order`
   - או סנן לפי function name

### אופציה 3: דרך Observability

1. **בתפריט העליון:**
   - לחץ על "Observability"

2. **בדף Observability:**
   - לחץ על "Functions" או "Serverless Functions"
   - חפש `api/takbull/init-order`

---

## 📋 שלב 3: בדוק את ה-Logs

1. **תראה רשימת Invocations:**
   - כל קריאה ל-API יוצרת invocation
   - לחץ על ה-invocation האחרון (הכי למעלה)

2. **תראה את ה-Logs:**
   - תראה הודעות כמו:
     - `🔍 Environment check: {...}`
     - `💰 Plan details: {...}`
     - `📤 Calling Takbull API with payload: {...}`
     - `📥 Takbull API response status: ...`
     - `❌ Error: ...` (אם יש שגיאה)

---

## 🔍 מה לחפש ב-Logs:

### 1. Environment check
```
🔍 Environment check: {
  hasSupabaseUrl: true/false,
  hasSupabaseServiceKey: true/false,
  hasTakbullApiKey: true/false,
  hasTakbullApiSecret: true/false,
  redirectUrl: "..."
}
```
**אם יש `false`** → המשתנה הזה חסר ב-Vercel!

### 2. Plan details
```
💰 Plan details: {
  planId: "...",
  billingPeriod: "monthly",
  monthlyPrice: 49,
  yearlyPrice: 490,
  amount: 49
}
```
**אם יש שגיאה כאן** → הבעיה ב-Supabase (הטבלה `plans` או ה-plan_id)

### 3. Takbull API call
```
📤 Calling Takbull API with payload: {
  API_Key: "a69f75da...",
  API_Secret: "***",
  DealType: 4,
  OrderReference: "VRL-...",
  Amount: 49,
  ...
}
```
**אם יש `MISSING`** → המשתנה חסר ב-Vercel!

### 4. Takbull API response
```
📥 Takbull API response status: 200 OK
```
**אם זה לא 200** → הבעיה ב-Takbull API עצמו!

```
📥 Takbull API parsed response: {
  responseCode: 0,
  hasUrl: true,
  message: "...",
  fullResponse: {...}
}
```
**אם `responseCode !== 0`** → Takbull החזיר שגיאה (בדוק את `message`)

---

## 🐛 שגיאות נפוצות:

### שגיאה: "Supabase credentials missing"
**פתרון:**
- בדוק שה-`SUPABASE_URL` ו-`SUPABASE_SERVICE_ROLE_KEY` מוגדרים ב-Vercel
- Redeploy

### שגיאה: "Takbull API credentials missing"
**פתרון:**
- בדוק שה-`TAKBULL_API_KEY` ו-`TAKBULL_API_SECRET` מוגדרים ב-Vercel
- Redeploy

### שגיאה: "Plan not found"
**פתרון:**
- בדוק שהטבלה `plans` קיימת ב-Supabase
- בדוק שיש plan עם `tier = 'creator'` (או החבילה שביקשת)

### שגיאה: "Takbull API error: 400/401/403"
**פתרון:**
- בדוק שה-API keys נכונים
- בדוק את ה-payload שנשלח (ב-Logs)
- פנה לתמיכה של Takbull

### שגיאה: "Network error"
**פתרון:**
- בדוק שה-URL של Takbull נכון: `https://api.takbull.co.il/api/ExtranalAPI/GetTakbullPaymentPageRedirectUrl`
- בדוק את החיבור לאינטרנט

---

## 📸 איפה זה ב-Vercel:

```
Vercel Dashboard
├── הפרויקט שלך
    │
    ├── Deployments (בתפריט העליון) ← הכי פשוט!
    │   └── [deployment אחרון] ← לחץ כאן
    │       └── גלול למטה
    │           └── Functions / Serverless Functions
    │               └── api/takbull/init-order ← לחץ כאן
    │                   └── Logs ← כאן תראה את כל ההודעות
    │
    ├── Logs (בתפריט העליון) ← אופציה 2
    │   └── חפש logs מ-api/takbull/init-order
    │
    └── Observability (בתפריט העליון) ← אופציה 3
        └── Functions
            └── api/takbull/init-order
```

---

## ✅ אחרי שתבדוק את ה-Logs:

1. **תראה בדיוק מה השגיאה**
2. **תוכל לתקן את הבעיה** לפי ההוראות למעלה
3. **נסה שוב לשדרג חבילה**

---

## 📞 אם עדיין לא ברור:

1. **העתק את כל ה-Logs** מה-Vercel
2. **שלח לי** - אני אעזור לזהות את הבעיה

---

## 🎯 סיכום - דרך מהירה:

1. **Vercel Dashboard > Deployments**
2. **לחץ על ה-Deployment האחרון** (הכי למעלה ברשימה)
3. **גלול למטה** → חפש "Functions" או "Serverless Functions"
4. **לחץ על `api/takbull/init-order`**
5. **קרא את ה-Logs** - תראה בדיוק מה השגיאה
6. **תקן לפי ההוראות למעלה**

**זה הכל! 🎉**

---

## 💡 אם אתה לא רואה Functions:

- נסה דרך **"Logs"** בתפריט העליון
- סנן לפי **"Function"** ו-`api/takbull/init-order`
- בחר זמן: **"Today"** או **"Last hour"**

