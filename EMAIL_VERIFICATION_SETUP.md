# 🔐 הגדרת אימות אימייל ב-Supabase

## הבעיה:
המשתמש יכול להירשם ולהתחבר גם בלי לאשר את האימייל שלו.

## ✅ פתרון - הפעלת Email Confirmation:

### דרך 1: דרך Supabase Dashboard (מומלץ)

1. היכנס ל-[Supabase Dashboard](https://app.supabase.com)
2. בחר את הפרויקט שלך
3. לך ל-**Authentication** > **Settings**
4. תחת **Email Auth**:
   - **Enable email signups** - ודא שזה מופעל ✅
   - **Enable email confirmations** - הפעל את זה ✅
   - **Secure email change** - מומלץ להפעיל גם את זה ✅

5. שמור את השינויים

### דרך 2: דרך Management API

```bash
# קבל את ה-access token מ: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# הפעל Email Confirmation
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_autoconfirm": false
  }'
```

## מה קורה אחרי ההפעלה:

1. **המשתמש נרשם** → Supabase שולח מייל אימות
2. **המשתמש לוחץ על הקישור במייל** → האימייל מאומת
3. **המשתמש יכול להתחבר** → רק אחרי שהאימייל מאומת

## בדיקה שההגדרה עובדת:

1. נסה להירשם עם אימייל חדש
2. בדוק את תיבת הדואר הנכנס (וגם ספאם)
3. לחץ על הקישור במייל
4. רק אז תוכל להתחבר

## הערה חשובה:

אם **לא** תפעיל Email Confirmation:
- כל אחד יכול להירשם עם כל אימייל (גם אימיילים של אחרים)
- אין הגנה מפני רישום מזויף
- לא תוכל לשלוח מיילים משמעותיים למשתמשים

## הגדרות נוספות מומלצות:

1. **SMTP Server מותאם אישית** - במקום השירות המובנה של Supabase
   - ראה: `EMAIL_CONFIGURATION.md`
   
2. **Rate Limiting** - הגבל מספר מיילי אימות לשעה
   - לך ל: **Authentication** > **Rate Limits**
   - הגדר מגבלות סבירות

3. **Email Templates** - התאם אישית את הודעות האימייל
   - לך ל: **Authentication** > **Email Templates**
   - ערוך את "Confirm signup" template

