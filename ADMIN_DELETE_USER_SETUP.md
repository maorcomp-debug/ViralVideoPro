# 🔧 הגדרת מחיקת משתמשים דרך פאנל ניהול

## מה תוקן?

כעת, כאשר מוחקים משתמש דרך פאנל הניהול, המשתמש נמחק גם מ-`auth.users` ב-Supabase, ולא רק מ-`profiles`.

## איך זה עובד?

1. **Frontend (`src/lib/supabase-helpers.ts`):**
   - הפונקציה `deleteUser()` קוראת ל-API route `/api/admin/delete-user`
   - מעבירה את ה-`userId` ואת ה-token של המנהל לאימות

2. **Backend (`api/admin/delete-user.ts`):**
   - בודק שהמשתמש המבקש הוא admin
   - משתמש ב-`SUPABASE_SERVICE_ROLE_KEY` כדי למחוק את המשתמש מ-`auth.users`
   - מוחק גם את כל הנתונים הקשורים:
     - `profiles`
     - `subscriptions`
     - `takbull_orders`
     - `analyses`
     - `videos`
     - `trainees`
     - `coupon_redemptions`
     - `user_trials`
     - `user_announcements`

## משתני סביבה נדרשים ב-Vercel:

1. `SUPABASE_URL` - כתובת ה-Supabase project
2. `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (לא Anon Key!)
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` או `SUPABASE_ANON_KEY` - Anon Key לאימות הטוקן

## איך למצוא את ה-Keys ב-Supabase:

1. לך ל-Supabase Dashboard → Project Settings → API
2. **Anon Key**: נמצא ב-"Project API keys" → "anon" `public`
3. **Service Role Key**: נמצא ב-"Project API keys" → "service_role" `secret` (⚠️ זהירות - זה מפתח רגיש!)

## בדיקה:

1. לך לפאנל הניהול
2. בחר משתמש
3. לחץ על "מחק"
4. אשר את המחיקה
5. בדוק ב-Supabase Dashboard → Authentication → Users שהמשתמש נמחק

---

**הערה:** המחיקה היא בלתי הפיכה! כל הנתונים הקשורים למשתמש יימחקו.

