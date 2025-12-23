# מדריך עריכת פרופילים ב-Table Editor

## עריכת פרופילים כמנהל ב-Supabase Table Editor

כמנהל (admin), תוכל לערוך את כל הפרופילים ב-Table Editor של Supabase, כולל:

### שדות שניתן לערוך:
- **full_name** - שם מלא של המשתמש
- **subscription_tier** - דרגת החבילה (`free`, `creator`, `pro`, `coach`)
- **subscription_period** - תקופת החיוב (`monthly`, `yearly`)
- **subscription_status** - סטטוס המנוי (`active`, `inactive`, `cancelled`)
- **subscription_start_date** - תאריך התחלת המנוי
- **subscription_end_date** - תאריך סיום המנוי
- **role** - תפקיד המשתמש (`user`, `admin`)

### איך לערוך:

1. היכנס ל-Supabase Dashboard: https://app.supabase.com
2. בחר את הפרויקט שלך
3. לך ל-**Table Editor** > **profiles**
4. מצא את המשתמש שברצונך לערוך
5. לחץ על השורה לעריכה
6. עדכן את השדות הרצויים:
   - **subscription_tier**: בחר מתוך `free`, `creator`, `pro`, `coach`
   - **subscription_period**: בחר מתוך `monthly`, `yearly` או השאר `null`
   - **subscription_status**: בחר מתוך `active`, `inactive`, `cancelled` או השאר `null`
7. לחץ על **Save** או **Update**

### הערות חשובות:

- **full_name**: נשמר אוטומטית בעת הרשמה מהשדה `full_name` בטופס ההרשמה
- **subscription_tier**: ברירת מחדל היא `free` לכל משתמש חדש
- **subscription_period**: ניתן להשאיר `null` עבור חבילת חינם
- **role**: רק משתמשים עם `role='admin'` יכולים לערוך פרופילים של משתמשים אחרים

### בדיקת הרשאות:

כדי לבדוק אם אתה admin:
```sql
SELECT user_id, email, role FROM profiles WHERE user_id = auth.uid();
```

אם התוצאה מציגה `role='admin'`, יש לך הרשאות לערוך את כל הפרופילים.

---

**תאריך עדכון**: 23 בדצמבר 2025

