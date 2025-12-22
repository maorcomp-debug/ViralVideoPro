# 📋 רשימת קבצים להעלאה ל-GitHub

## ✅ קבצים שצריכים להיות ב-GitHub (חובה):

### 📁 קבצי קוד האפליקציה:
- ✅ `index.tsx` - הקוד הראשי של האפליקציה
- ✅ `index.html` - קובץ HTML הראשי
- ✅ `index.css` - עיצוב בסיסי
- ✅ `package.json` - תלויות הפרויקט
- ✅ `package-lock.json` - נעילת גרסאות
- ✅ `vite.config.ts` - הגדרות Vite
- ✅ `tsconfig.json` - הגדרות TypeScript
- ✅ `metadata.json` - מטא-דאטה

### 📁 תיקיית src/:
- ✅ `src/lib/supabase.ts` - אתחול Supabase client
- ✅ `src/lib/supabase-helpers.ts` - פונקציות עזר ל-Supabase

### 📁 תיקיית public/:
- ✅ `public/Logo.png` - הלוגו
- ✅ `public/index.css` - קבצי CSS נוספים (אם יש)

### 📁 תיקיית supabase/ (חשוב מאוד!):
- ✅ `supabase/migrations/001_initial_schema.sql` - מבנה המסד נתונים
- ✅ `supabase/storage_policies.sql` - Storage buckets ו-policies
- ✅ `supabase/webhooks/payments.sql` - Webhook functions
- ✅ `supabase/functions/payment-webhook/index.ts` - Edge Function לתשלומים

### 📁 קבצי הגדרה:
- ✅ `.gitignore` - קבצים להתעלם
- ✅ `README.md` - תיעוד בסיסי

---

## ❌ קבצים שלא צריך להעלות (כבר ב-.gitignore):

- ❌ `.env.local` - משתני סביבה (מכילים מפתחות סודיים!)
- ❌ `node_modules/` - תלויות (מורידים עם `npm install`)
- ❌ `dist/` - קבצים מוכנים לפרודקשן
- ❌ `.cursor/` - קבצי IDE
- ❌ `.git/` - Git repository (נוצר אוטומטית)

---

## 🔐 משתני סביבה (.env.local):

**לא להעלות!** אבל צריך ליצור `.env.example`:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-key
```

---

## ✅ סיכום - מה צריך להעלות:

```
✅ index.tsx
✅ index.html
✅ index.css
✅ package.json
✅ package-lock.json
✅ vite.config.ts
✅ tsconfig.json
✅ metadata.json
✅ src/lib/supabase.ts
✅ src/lib/supabase-helpers.ts
✅ public/Logo.png
✅ public/index.css (אם קיים)
✅ supabase/migrations/001_initial_schema.sql
✅ supabase/storage_policies.sql
✅ supabase/webhooks/payments.sql
✅ supabase/functions/payment-webhook/index.ts
✅ .gitignore
✅ README.md
```

---

## 🚀 אחרי העלאה ל-GitHub:

### למפתחים חדשים שיורידו את הפרויקט:

1. **Clone את הפרויקט:**
   ```bash
   git clone <repository-url>
   cd viral-video-director-pro
   ```

2. **התקן תלויות:**
   ```bash
   npm install
   ```

3. **צור קובץ `.env.local`:**
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_GEMINI_API_KEY=your-gemini-key
   ```

4. **הרץ את ה-migrations ב-Supabase:**
   - לך ל-Supabase Dashboard > SQL Editor
   - הרץ את `supabase/migrations/001_initial_schema.sql`
   - הרץ את `supabase/storage_policies.sql`
   - הרץ את `supabase/webhooks/payments.sql`

5. **הרץ את האפליקציה:**
   ```bash
   npm start
   ```

---

## ⚠️ חשוב:

- **אל תעלה `.env.local`** - הוא מכיל מפתחות סודיים!
- **ודא ש-`.gitignore` מעודכן** - הוא כבר כולל `.env.local`
- **העלה את כל קבצי ה-SQL** - הם חשובים להגדרת המסד נתונים
- **העלה את Edge Functions** - הם חלק מהמערכת

---

## 📝 הערות:

- כל קבצי ה-Supabase (migrations, storage, webhooks) **חייבים** להיות ב-GitHub
- הם מאפשרים לשחזר את המבנה המלא של המסד נתונים
- Edge Functions גם צריכים להיות - הם חלק מהקוד

