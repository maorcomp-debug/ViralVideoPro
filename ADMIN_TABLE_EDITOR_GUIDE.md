# מדריך עריכת פרופילים ב-Table Editor

## עריכת פרופילים כמנהל ב-Supabase Table Editor

כמנהל (admin), תוכל לערוך את כל הפרופילים ב-Table Editor של Supabase, כולל:

### שדות שניתן לערוך (עם רשימות נפתחות):

השדות הבאים מציגים **רשימות נפתחות (dropdowns)** בעת עריכה:

- **subscription_tier** - דרגת החבילה:
  - `free` - ניסיון (חינם)
  - `creator` - יוצרים
  - `pro` - יוצרים באקסטרים
  - `coach` - מאמנים, סוכנויות ובתי ספר למשחק

- **subscription_period** - תקופת החיוב:
  - `monthly` - חודשי
  - `yearly` - שנתי
  - `NULL` - ניתן להשאיר ריק לחבילת חינם

- **subscription_status** - סטטוס המנוי:
  - `active` - פעיל
  - `inactive` - לא פעיל
  - `cancelled` - בוטל
  - `NULL` - ניתן להשאיר ריק

- **role** - תפקיד המשתמש:
  - `user` - משתמש
  - `admin` - מנהל

### שדות נוספים שניתן לערוך:
- **full_name** - שם מלא של המשתמש (שדה טקסט רגיל)
- **subscription_start_date** - תאריך התחלת המנוי (תאריך/שעה)
- **subscription_end_date** - תאריך סיום המנוי (תאריך/שעה)
- **email** - כתובת אימייל

### איך לערוך:

1. היכנס ל-Supabase Dashboard: https://app.supabase.com
2. בחר את הפרויקט שלך
3. לך ל-**Table Editor** > **profiles**
4. מצא את המשתמש שברצונך לערוך
5. לחץ על השורה לעריכה (או לחץ על התא הספציפי)
6. עדכן את השדות הרצויים:
   - **subscription_tier**: לחץ על השדה ותופיע רשימה נפתחת עם כל החבילות - בחר את הרצויה
   - **subscription_period**: לחץ על השדה ותופיע רשימה נפתחת - בחר `monthly` או `yearly`, או השאר ריק (NULL) לחבילת חינם
   - **subscription_status**: לחץ על השדה ותופיע רשימה נפתחת - בחר את הסטטוס הרצוי, או השאר ריק
   - **role**: לחץ על השדה ותופיע רשימה נפתחת - בחר `user` או `admin`
7. לחץ על **Save changes** (או **Esc** לביטול)

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

