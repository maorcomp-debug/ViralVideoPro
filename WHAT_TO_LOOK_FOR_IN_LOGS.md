# 🔍 מה לחפש ב-Logs - אחרי Environment check

## ✅ מה שכבר עובד:

```
🔍 Environment check: {
  hasSupabaseUrl: true,
  hasSupabaseServiceKey: true,
  hasTakbullApiKey: true,
  hasTakbullApiSecret: true,
  redirectUrl: 'https://viraly.co.il/order-received'
}
```

**מעולה!** כל המשתנים קיימים. הבעיה היא בשלב הבא.

---

## 🔍 מה לחפש עכשיו:

### 1. Plan details (אחרי Environment check)

חפש הודעה כמו:
```
💰 Plan details: {
  planId: "...",
  billingPeriod: "monthly",
  monthlyPrice: 49,
  yearlyPrice: 490,
  amount: 49
}
```

**אם יש שגיאה כאן:**
- `❌ Error fetching plan: ...`
- `Plan not found`
- → הבעיה ב-Supabase (הטבלה `plans` או ה-plan_id)

---

### 2. Order creation (אחרי Plan details)

חפש הודעה כמו:
```
✅ Order created: {...}
```

**אם יש שגיאה כאן:**
- `❌ Error creating order: ...`
- `Failed to create order`
- → הבעיה ב-Supabase (הטבלה `takbull_orders` או RLS policies)

---

### 3. Takbull API call (אחרי Order creation)

חפש הודעות כמו:
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

**אם יש שגיאה כאן:**
- `❌ Error calling Takbull API: ...`
- `Network error: ...`
- → הבעיה בחיבור ל-Takbull API

---

### 4. Takbull API response (אחרי הקריאה)

חפש הודעות כמו:
```
📥 Takbull API response status: 200 OK
```

**אם זה לא 200:**
- `📥 Takbull API response status: 400/401/403/500`
- → הבעיה ב-Takbull API (API keys שגויים או payload לא תקין)

---

### 5. Takbull API parsed response

חפש הודעה כמו:
```
📥 Takbull API parsed response: {
  responseCode: 0,
  hasUrl: true,
  message: "...",
  fullResponse: {...}
}
```

**אם `responseCode !== 0`:**
- `responseCode: 1/2/3/...` (לא 0)
- → Takbull החזיר שגיאה (בדוק את `message`)

**אם `hasUrl: false`:**
- `No payment URL in Takbull response`
- → Takbull לא החזיר URL (בדוק את `fullResponse`)

---

## 🐛 שגיאות נפוצות ופתרונות:

### שגיאה: "Plan not found"
**פתרון:**
1. לך ל-Supabase Dashboard > Table Editor
2. בדוק שהטבלה `plans` קיימת
3. בדוק שיש plan עם `tier = 'creator'` (או החבילה שביקשת)
4. בדוק שה-`is_active = true`

### שגיאה: "Error creating order"
**פתרון:**
1. בדוק שהטבלה `takbull_orders` קיימת ב-Supabase
2. בדוק שה-RLS policies מוגדרות נכון
3. בדוק שה-Service Role Key נכון

### שגיאה: "Takbull API error: 400/401/403"
**פתרון:**
1. בדוק שה-API keys נכונים:
   - `TAKBULL_API_KEY = a69f75da-d145-43f5-ae42-88c8fe0b18c6`
   - `TAKBULL_API_SECRET = 4f4ad4bb-613e-4c05-81d5-876f83e68dc1`
2. בדוק את ה-payload שנשלח (ב-Logs)
3. פנה לתמיכה של Takbull

### שגיאה: "Network error"
**פתרון:**
1. בדוק שה-URL של Takbull נכון: `https://api.takbull.co.il/api/ExtranalAPI/GetTakbullPaymentPageRedirectUrl`
2. בדוק את החיבור לאינטרנט

---

## 📋 מה לעשות עכשיו:

1. **גלול למטה ב-Logs** - תראה את כל ההודעות
2. **חפש את ההודעות הבאות:**
   - `💰 Plan details:`
   - `📤 Calling Takbull API:`
   - `📥 Takbull API response:`
   - `❌ Error:`
3. **העתק את כל ה-Logs** (Ctrl+A, Ctrl+C)
4. **שלח לי** - אני אעזור לזהות את הבעיה המדויקת

---

## 🎯 סיכום:

- ✅ Environment check עבר
- ❓ צריך לראות את שאר ה-Logs
- 🔍 חפש שגיאות אחרי Environment check

**שלח לי את כל ה-Logs ואני אעזור לפתור! 🎉**

