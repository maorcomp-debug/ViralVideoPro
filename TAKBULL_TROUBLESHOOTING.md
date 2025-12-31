# פתרון בעיות - Takbull Payment Gateway

## שגיאה: "Server configuration error" (500)

### סימפטומים:
```
POST https://viraly.co.il/api/takbull/init-order 500 (Internal Server Error)
{"ok":false,"error":"Server configuration error"}
```

### סיבות אפשריות:

#### 1. משתני סביבה חסרים ב-Vercel ⚠️ **הכי נפוץ!**

**פתרון:**
1. לך ל-Vercel Dashboard > הפרויקט > Settings > Environment Variables
2. וודא שיש את כל המשתנים הבאים:

   ```
   ✅ SUPABASE_URL = https://poejxozjnwrsakrhiyny.supabase.co
   ✅ SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
   ✅ TAKBULL_API_KEY = a69f75da-d145-43f5-ae42-88c8fe0b18c6
   ✅ TAKBULL_API_SECRET = 4f4ad4bb-613e-4c05-81d5-876f83e68dc1
   ✅ TAKBULL_REDIRECT_URL = https://viraly.co.il/order-received
   ```

3. **חשוב:** וודא שבחרת **Production**, **Preview**, ו-**Development** לכל משתנה
4. **Redeploy:** אחרי הוספת/עדכון משתנים, לך ל-Deployments > לחץ "..." > "Redeploy"

#### 2. Service Role Key שגוי

**איך לבדוק:**
1. לך ל-Supabase Dashboard > Settings > API
2. העתק את ה-"service_role" key (לא ה-"anon" key!)
3. וודא שהוא מוגדר ב-Vercel כ-`SUPABASE_SERVICE_ROLE_KEY`

#### 3. Supabase URL שגוי

**איך לבדוק:**
1. לך ל-Supabase Dashboard > Settings > API
2. העתק את ה-"Project URL"
3. וודא שהוא מוגדר ב-Vercel כ-`SUPABASE_URL` או `VITE_SUPABASE_URL`

---

## שגיאה: "Payment gateway not configured"

### סימפטומים:
```
{"ok":false,"error":"Payment gateway not configured: Takbull API credentials missing..."}
```

### פתרון:

1. **וודא שה-`TAKBULL_API_KEY` מוגדר:**
   - Value: `a69f75da-d145-43f5-ae42-88c8fe0b18c6`
   - Environments: Production, Preview, Development

2. **וודא שה-`TAKBULL_API_SECRET` מוגדר:**
   - Value: `4f4ad4bb-613e-4c05-81d5-876f83e68dc1`
   - Environments: Production, Preview, Development

3. **Redeploy את האפליקציה** אחרי הוספת המשתנים

---

## איך לבדוק את ה-Logs ב-Vercel

1. לך ל-Vercel Dashboard > הפרויקט
2. לך ל-Functions > `api/takbull/init-order`
3. לחץ על ה-deployment האחרון
4. בדוק את ה-Logs - תראה הודעות כמו:
   - `🔍 Environment check: {...}`
   - `❌ Supabase credentials not configured`
   - `❌ Takbull API credentials not configured`

---

## בדיקה מהירה

### 1. בדוק שה-API endpoint נגיש:
```bash
curl https://viraly.co.il/api/takbull/init-order
```
אמור להחזיר שגיאה (זה תקין - זה POST endpoint)

### 2. בדוק את ה-Logs ב-Vercel:
- לך ל-Vercel Dashboard > Functions > Logs
- חפש הודעות שגיאה או warnings

### 3. בדוק את משתני הסביבה:
- Vercel Dashboard > Settings > Environment Variables
- וודא שכל המשתנים מוגדרים
- וודא שבחרת את כל ה-Environments (Production, Preview, Development)

---

## צעדים לפתרון מהיר:

1. ✅ **וודא שכל המשתנים מוגדרים ב-Vercel**
2. ✅ **Redeploy את האפליקציה**
3. ✅ **בדוק את ה-Logs ב-Vercel Functions**
4. ✅ **נסה שוב לשדרג חבילה**

---

## אם עדיין לא עובד:

1. **בדוק את ה-Logs ב-Vercel** - תראה בדיוק איזה משתנה חסר
2. **וודא שה-Redeploy בוצע** - משתנים חדשים לא נטענים ב-deployment קיים
3. **נסה test request:**
   ```bash
   curl -X POST https://viraly.co.il/api/takbull/init-order \
     -H "Content-Type: application/json" \
     -d '{"userId":"test","subscriptionTier":"creator","billingPeriod":"monthly"}'
   ```
4. **פנה לתמיכה** עם ה-Logs מ-Vercel

---

## משתני סביבה נדרשים - סיכום:

| משתנה | ערך | איפה למצוא |
|--------|-----|------------|
| `SUPABASE_URL` | `https://poejxozjnwrsakrhiyny.supabase.co` | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (מפתח ארוך) | Supabase Dashboard > Settings > API > service_role |
| `TAKBULL_API_KEY` | `a69f75da-d145-43f5-ae42-88c8fe0b18c6` | מהמשתמש |
| `TAKBULL_API_SECRET` | `4f4ad4bb-613e-4c05-81d5-876f83e68dc1` | מהמשתמש |
| `TAKBULL_REDIRECT_URL` | `https://viraly.co.il/order-received` | כתובת האתר שלך |

---

## ✅ Checklist לפני בדיקה:

- [ ] כל המשתנים מוגדרים ב-Vercel
- [ ] כל המשתנים מוגדרים ל-Production, Preview, Development
- [ ] Redeploy בוצע אחרי הוספת המשתנים
- [ ] בדקתי את ה-Logs ב-Vercel Functions
- [ ] הטבלה `takbull_orders` קיימת ב-Supabase
- [ ] URLs מוגדרים ב-Takbull Dashboard

