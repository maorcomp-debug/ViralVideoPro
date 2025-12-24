# שיפורי רישום ובחירת מסלולים

## סיכום השינויים

### ✅ הושלם:
1. **Migration להוספת phone ו-selected_tracks** - `003_add_phone_and_tracks.sql`
2. **Helper functions לבדיקת ייחודיות** - `checkEmailExists`, `checkPhoneExists`
3. **עדכון AuthModal** - הוספת שדה טלפון ובדיקת ייחודיות

### 🔄 בתהליך:
4. **TrackSelectionModal** - מודאל לבחירת מסלול לאחר רישום

### ⏳ נותר לעשות:
5. **הגבלות לפי חבילה ב-UI** - דהוי/לא פעיל
6. **הגבלות מומחים** - 3 מומחים לחינם, 8 ליוצרים

---

## פרטי היישום

### 1. Phone Field ברישום ✅
- שדה טלפון חובה ברישום
- אימות פורמט ישראלי (10 ספרות)
- בדיקת ייחודיות לפני רישום
- שמירה ב-user metadata

### 2. Track Selection Modal 🔄
**לאחר רישום מוצלח:**
- אם למשתמש אין `selected_primary_track` → הצג TrackSelectionModal
- מודאל מציג 4 תחומים:
  - שחקנים ואודישנים (actors)
  - זמרים ומוזיקאים (musicians)
  - יוצרי תוכן וכוכבי רשת (creators)
  - משפיענים ומותגים (influencers)
- משתמש חינם בוחר **תחום אחד** בלבד
- שמירה ב-`profiles.selected_primary_track`
- `selected_tracks` נשאר ריק למשתמש חינם

### 3. הגבלות לפי חבילה ⏳

#### חינם (free):
- **תחומים:** תחום אחד בלבד (selected_primary_track)
- **מומחים:** 3 מומחים מובילים בלבד
- **תכונות לא פעילות:**
  - ❌ שמירת היסטוריה
  - ❌ מעקב שיפור
  - ❌ העלאת וידאו משופר
  - ❌ ייצוא PDF
  - ❌ מעבר ל-8 מומחים
- **UI:** כל התכונות האלה יהיו דהויות עם הודעת "זמין בחבילת [יוצרים/יוצרים באקסטרים/מאמנים]"

#### יוצרים (creator):
- **תחומים:** 2 תחומים (selected_tracks array)
- **מומחים:** 8 מומחים
- **תכונות פעילות:**
  - ✅ שמירת היסטוריה
  - ✅ מעקב שיפור
  - ✅ העלאת וידאו משופר
  - ✅ ייצוא PDF
- **תכונות לא פעילות:**
  - ❌ פאנל ניהול מתאמנים
  - ❌ השוואת ניתוחים
  - ❌ ניתוח מתקדם

#### יוצרים באקסטרים (pro):
- **תחומים:** כל התחומים זמינים
- **מומחים:** 8 מומחים
- **תכונות פעילות:** כל התכונות **חוץ מפאנל ניהול מתאמנים**
- **תכונות לא פעילות:**
  - ❌ פאנל ניהול מתאמנים (coach dashboard)

#### מאמנים (coach):
- **תחומים:** כל התחומים (כולל coach)
- **מומחים:** 8 מומחים
- **תכונות פעילות:** כל התכונות כולל פאנל ניהול מתאמנים

### 4. UI/UX - דהוי תכונות ⏳

**עקרון:**
- תכונות לא רלוונטיות יהיו **דהויות** (opacity: 0.5)
- עם tooltip/hover message: "תכונה זו זמינה בחבילת [חבילה]"
- כפתורים לא פעילים (`disabled={true}`)
- ניתן לדפדף ולראות, אבל לא להשתמש

**דוגמאות:**
- כפתור "שמור ניתוח" - דהוי אם אין `saveHistory`
- כפתור "ייצוא PDF" - דהוי אם אין `pdfExport`
- כפתור "העלה טייק משופר" - דהוי אם אין `improvementTracking`
- טרקים שלא נבחרו - דהויים עם הודעת "זמין בחבילת יוצרים"
- מעבר ל-8 מומחים - דהוי אם אין `customExperts`

### 5. הגבלות מומחים ⏳

#### חינם:
- רק 3 מומחים מובילים בתחום שנבחר
- `selectedExperts.length` מקסימום = 3
- המעבר ל-8 מומחים לא פעיל

#### יוצרים ומעלה:
- 8 מומחים מלאים
- המעבר ל-8 מומחים פעיל

---

## קבצים שצריך לעדכן

1. ✅ `supabase/migrations/003_add_phone_and_tracks.sql` - DONE
2. ✅ `src/lib/supabase-helpers.ts` - DONE (added checkEmailExists, checkPhoneExists)
3. ✅ `src/components/modals/AuthModal.tsx` - DONE (added phone field)
4. ⏳ `src/components/modals/TrackSelectionModal.tsx` - TODO
5. ⏳ `index.tsx` - TODO (show TrackSelectionModal, implement restrictions)
6. ⏳ `src/constants/index.ts` - TODO (update SUBSCRIPTION_PLANS if needed)

---

## שלבים לביצוע

1. ✅ יצירת migration
2. ✅ הוספת helper functions
3. ✅ עדכון AuthModal
4. 🔄 יצירת TrackSelectionModal
5. ⏳ עדכון index.tsx להצגת TrackSelectionModal לאחר רישום
6. ⏳ הטמעת הגבלות ב-UI
7. ⏳ הטמעת הגבלות מומחים

