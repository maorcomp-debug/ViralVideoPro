# הגדרת שליחת מייל עבור טופס יצירת קשר

## סקירה

נוצר Edge Function חדש `send-contact-email` ששולח מייל לאדמין כאשר מישהו שולח הודעה דרך טופס יצירת הקשר.

## שלבים להגדרה

### 1. הגדרת Edge Function ב-Supabase

#### א. העלה את ה-Function

1. לך ל-Supabase Dashboard > Edge Functions
2. לחץ על "Create a new function"
3. תן שם: `send-contact-email`
4. העתק את התוכן מ-`supabase/functions/send-contact-email/index.ts`
5. לחץ על "Deploy"

#### ב. הגדר משתני סביבה (Environment Variables)

לך ל-Supabase Dashboard > Project Settings > Edge Functions > Secrets

**אפשרות 1: שימוש ב-Resend (מומלץ)**

1. צור חשבון חינמי ב-Resend: https://resend.com
2. קבל את ה-API Key מ-Resend Dashboard
3. הוסף secret ב-Supabase:
   - Key: `RESEND_API_KEY`
   - Value: ה-API Key שלך מ-Resend

**אפשרות 2: שימוש ב-SMTP (אלטרנטיבה)**

אם יש לך שרת SMTP, תוכל להגדיר אותו דרך Supabase Dashboard > Project Settings > Auth > SMTP Settings

### 2. בדיקה

לאחר ההגדרה:

1. שלח הודעה דרך טופס יצירת הקשר באתר
2. בדוק שהמייל הגיע ל-`viralypro@gmail.com`
3. בדוק שההודעה נשמרה ב-database בטבלה `contact_messages`

## מבנה המייל

המייל כולל:
- כותרת: "הודעה חדשה מטופס יצירת קשר: [שם השולח]"
- שם השולח
- כתובת אימייל (קליקביל)
- תאריך ושעה
- תוכן ההודעה

## הערות

- אם `RESEND_API_KEY` לא מוגדר, הפונקציה תחזיר שגיאה אבל ההודעה עדיין תישמר ב-database
- המייל נשלח ל-`viralypro@gmail.com` (מוגדר בקוד)
- אפשר לשנות את כתובת המייל ב-`supabase/functions/send-contact-email/index.ts`

