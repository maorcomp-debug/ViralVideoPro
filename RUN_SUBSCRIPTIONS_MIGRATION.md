# 🔧 הרצת Migration לתיקון subscriptions table

## הבעיה:

```
Error creating subscription: {
  code: '42P10',
  message: 'there is no unique or exclusion constraint matching the ON CONFLICT specification'
}
```

**זה אומר:** אין unique constraint על `(user_id, plan_id)` ב-subscriptions table, אז ה-upsert לא עובד.

---

## ✅ פתרון:

### 1. הרץ את ה-Migration ב-Supabase:

1. **לך ל-Supabase Dashboard:**
   - https://app.supabase.com
   - בחר את הפרויקט שלך

2. **לך ל-SQL Editor:**
   - לחץ על "SQL Editor" בתפריט השמאלי

3. **העתק והדבק את התוכן של:**
   - `supabase/migrations/009_add_subscriptions_unique_constraint.sql`

4. **הרץ את ה-SQL:**
   - לחץ על "Run" (או F5)

5. **וודא שההרצה הצליחה:**
   - אמור להופיע: "Success. No rows returned"

---

## 📋 מה ה-Migration עושה:

1. **מוחק duplicate subscriptions** - אם יש כמה subscriptions עם אותו `(user_id, plan_id)`, שומר רק את האחרון
2. **מוסיף unique constraint** - `UNIQUE (user_id, plan_id)` - זה מאפשר ל-upsert לעבוד
3. **מוסיף index** - לשיפור ביצועים

---

## ✅ אחרי ההרצה:

1. **נסה שוב לשדרג חבילה**
2. **המנוי אמור להתעדכן נכון**
3. **ה-UpgradeBenefitsModal אמור להיפתח**

---

## 🔍 אם יש שגיאות:

אם יש שגיאה ב-migration (למשל duplicate subscriptions), תוכל לראות אילו subscriptions יש בעיה:

```sql
-- בדוק אם יש duplicates
SELECT user_id, plan_id, COUNT(*) as count
FROM public.subscriptions
GROUP BY user_id, plan_id
HAVING COUNT(*) > 1;
```

אם יש duplicates, תוכל למחוק אותם ידנית לפני הרצת ה-migration.

---

**אחרי שתהריץ את ה-migration, נסה שוב לשדרג חבילה! 🎉**

