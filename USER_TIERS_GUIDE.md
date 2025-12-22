# 📊 מדריך דרגות משתמשים (Subscription Tiers)

## דרגות המנוי הזמינות:

### 1. **`free`** - ניסיון
- **שם בעברית:** ניסיון
- **תיאור:** טעימה חינמית להכרת הפלטפורמה
- **מחיר חודשי:** ₪0
- **מחיר שנתי:** ₪0
- **מגבלות:**
  - מקסימום ניתוחים: 2 (בסך הכל)
  - אורך וידאו מקסימלי: 60 שניות (דקה)
  - גודל קובץ מקסימלי: 10MB
- **פיצ'רים:** ללא שמירת היסטוריה, ללא מעקב שיפור, ללא השוואה

---

### 2. **`creator`** - יוצרים
- **שם בעברית:** יוצרים
- **תיאור:** מתאים ליוצרי תוכן מתחילים
- **מחיר חודשי:** ₪49
- **מחיר שנתי:** ₪490 (חיסכון של ~2 חודשים)
- **מגבלות:**
  - מקסימום ניתוחים: 10 לחודש
  - אורך וידאו מקסימלי: 180 שניות (3 דקות)
  - גודל קובץ מקסימלי: 15MB
- **פיצ'רים:** שמירת היסטוריה, מעקב שיפור, ייצוא PDF

---

### 3. **`pro`** - יוצרים באקסטרים
- **שם בעברית:** יוצרים באקסטרים
- **תיאור:** למקצוענים שמחפשים את המקסימום
- **מחיר חודשי:** ₪99
- **מחיר שנתי:** ₪990 (חיסכון של ~2 חודשים)
- **מגבלות:**
  - מקסימום ניתוחים: 30 לחודש
  - אורך וידאו מקסימלי: 300 שניות (5 דקות)
  - גודל קובץ מקסימלי: 40MB
- **פיצ'רים:** הכל מ-creator + השוואה בין סרטונים, ניתוח מתקדם, מומחים מותאמים

---

### 4. **`coach`** - מאמנים, סוכנויות ובתי ספר למשחק
- **שם בעברית:** מאמנים, סוכנויות ובתי ספר למשחק
- **תיאור:** פלטפורמה מקצועית למאמנים וסטודיואים
- **מחיר חודשי:** ₪199
- **מחיר שנתי:** ₪1990 (חיסכון של ~2 חודשים)
- **מגבלות:**
  - מקסימום ניתוחים: **ללא הגבלה** (-1)
  - אורך וידאו מקסימלי: 300 שניות (5 דקות)
  - גודל קובץ מקסימלי: 40MB
- **פיצ'רים:** הכל מ-pro + ניהול מתאמנים, דשבורד מאמן

---

## איך להגדיר משתמש ב-Database:

### דרך SQL Editor ב-Supabase:

```sql
-- עדכון דרגת מנוי למשתמש
UPDATE profiles
SET 
  subscription_tier = 'creator',  -- או 'free', 'pro', 'coach'
  subscription_period = 'monthly', -- או 'yearly'
  subscription_status = 'active',
  subscription_start_date = NOW(),
  subscription_end_date = NOW() + INTERVAL '1 month' -- לחודשי, או '1 year' לשנתי
WHERE user_id = 'uuid-of-user-here';
```

### דוגמה: הגדרת משתמש לדרגת "יוצרים" חודשית

```sql
UPDATE profiles
SET 
  subscription_tier = 'creator',
  subscription_period = 'monthly',
  subscription_status = 'active',
  subscription_start_date = NOW(),
  subscription_end_date = NOW() + INTERVAL '1 month'
WHERE email = 'user@example.com';
```

### דוגמה: הגדרת משתמש לדרגת "מאמנים" שנתית

```sql
UPDATE profiles
SET 
  subscription_tier = 'coach',
  subscription_period = 'yearly',
  subscription_status = 'active',
  subscription_start_date = NOW(),
  subscription_end_date = NOW() + INTERVAL '1 year'
WHERE email = 'coach@example.com';
```

### דוגמה: החזרת משתמש לדרגת "ניסיון" (free)

```sql
UPDATE profiles
SET 
  subscription_tier = 'free',
  subscription_period = NULL,
  subscription_status = 'inactive',
  subscription_start_date = NULL,
  subscription_end_date = NULL
WHERE email = 'user@example.com';
```

---

## שדות בטבלת `profiles`:

| שדה | סוג | תיאור | ערכים אפשריים |
|-----|-----|-------|---------------|
| `subscription_tier` | text | דרגת המנוי | `'free'`, `'creator'`, `'pro'`, `'coach'` |
| `subscription_period` | text | תקופת החיוב | `'monthly'`, `'yearly'`, `NULL` |
| `subscription_status` | text | סטטוס המנוי | `'active'`, `'inactive'`, `'cancelled'` |
| `subscription_start_date` | timestamptz | תאריך תחילת המנוי | תאריך או `NULL` |
| `subscription_end_date` | timestamptz | תאריך סיום המנוי | תאריך או `NULL` |

---

## בדיקת דרגת משתמש:

```sql
-- בדיקת דרגת משתמש לפי אימייל
SELECT 
  email,
  subscription_tier,
  subscription_period,
  subscription_status,
  subscription_start_date,
  subscription_end_date
FROM profiles
WHERE email = 'user@example.com';
```

---

## רשימת כל המשתמשים ודרגותיהם:

```sql
SELECT 
  email,
  subscription_tier,
  subscription_period,
  subscription_status,
  CASE 
    WHEN subscription_end_date < NOW() THEN 'פג תוקף'
    WHEN subscription_end_date IS NULL THEN 'ללא מנוי'
    ELSE 'פעיל'
  END as status_description
FROM profiles
ORDER BY subscription_tier, email;
```

