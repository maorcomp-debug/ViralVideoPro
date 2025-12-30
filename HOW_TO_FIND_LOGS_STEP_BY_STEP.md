# 🔍 איך למצוא את ה-Logs - שלב אחר שלב

## 📋 שלב 1: פתח את ה-Deployment האחרון

1. **ברשימת ה-Deployments שאתה רואה:**
   - לחץ על ה-Deployment הראשון (הכי למעלה) - זה ה-Deployment האחרון
   - זה אמור להיות עם "Current" או "Ready" ו-"3m ago" (או זמן אחר)

2. **לחץ על ה-Deployment ID** (למשל: `AAeuY6zh1`)

---

## 📋 שלב 2: מצא את ה-Functions

1. **בדף ה-Deployment:**
   - גלול למטה
   - תראה סקשן "Functions" או "Serverless Functions" או "Runtime Logs"

2. **תראה רשימת Functions:**
   - חפש `api/takbull/init-order`
   - לחץ עליו

---

## 📋 שלב 3: בדוק את ה-Logs

1. **תראה את ה-Logs:**
   - כל קריאה ל-API יוצרת log entry
   - חפש את ה-Log האחרון (הכי למעלה)

2. **תראה הודעות כמו:**
   ```
   🔍 Environment check: {...}
   💰 Plan details: {...}
   📤 Calling Takbull API with payload: {...}
   📥 Takbull API response status: ...
   ❌ Error: ... (אם יש שגיאה)
   ```

---

## 🔍 אם אתה לא רואה Functions:

### אופציה A: דרך Runtime Logs

1. **בדף ה-Deployment:**
   - לחץ על "Runtime Logs" (אם יש כפתור כזה)

2. **סנן לפי Function:**
   - חפש `api/takbull/init-order`
   - או סנן לפי זמן (היום)

### אופציה B: דרך Logs בתפריט העליון

1. **בתפריט העליון:**
   - לחץ על "Logs"

2. **סנן:**
   - בחר "Function" או "Serverless Function"
   - חפש `api/takbull/init-order`
   - בחר זמן: "Today" או "Last hour"

---

## 📸 איפה לחפש:

```
Vercel Dashboard
├── Deployments (בתפריט העליון)
    └── [לחץ על Deployment אחרון] ← AAeuY6zh1
        └── גלול למטה
            ├── Functions / Serverless Functions ← כאן!
            │   └── api/takbull/init-order ← לחץ כאן
            │
            └── או Runtime Logs ← אופציה חלופית
```

---

## 🎯 מה לעשות עכשיו:

1. **לחץ על ה-Deployment האחרון** (AAeuY6zh1 או הראשון ברשימה)
2. **גלול למטה** בדף ה-Deployment
3. **חפש "Functions" או "Serverless Functions"**
4. **לחץ על `api/takbull/init-order`**
5. **תראה את ה-Logs** - העתק אותם ושלח לי

---

## 💡 טיפ:

אם אתה לא רואה Functions בדף ה-Deployment:
- נסה דרך "Logs" בתפריט העליון
- סנן לפי "Function" ו-`api/takbull/init-order`
- בחר זמן: "Today"

---

## 📞 אם עדיין לא מוצא:

1. **צלם screenshot** של דף ה-Deployment
2. **או העתק את כל הטקסט** שאתה רואה
3. **שלח לי** - אני אעזור למצוא

