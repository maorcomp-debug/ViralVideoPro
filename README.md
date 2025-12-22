# Viraly - Video Director Pro

בינת וידאו לשחקנים, זמרים ויוצרי תוכן. סוכן על שמשלב ריאליטי, קולנוע, מוזיקה ומשפיענים.

## 🚀 התקנה מהירה

### דרישות:
- Node.js (גרסה 18+)
- חשבון Supabase
- מפתח API של Google Gemini

### שלבים:

1. **Clone את הפרויקט:**
   ```bash
   git clone <repository-url>
   cd viral-video-director-pro
   ```

2. **התקן תלויות:**
   ```bash
   npm install
   ```

3. **צור קובץ `.env.local`** (בשורש הפרויקט):
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_GEMINI_API_KEY=your-gemini-api-key
   ```

4. **הגדר את Supabase:**
   - לך ל-Supabase Dashboard > SQL Editor
   - הרץ את `supabase/migrations/001_initial_schema.sql`
   - הרץ את `supabase/storage_policies.sql`
   - הרץ את `supabase/webhooks/payments.sql`

5. **הרץ את האפליקציה:**
   ```bash
   npm start
   ```

6. **פתח בדפדפן:**
   ```
   http://localhost:3000
   ```

## 📦 חבילות מנוי

האפליקציה תומכת ב-4 חבילות:
- **ניסיון** - 2 ניתוחים, עד 60 שניות
- **יוצרים** - 10 ניתוחים/חודש, עד 3 דקות
- **יוצרים באקסטרים** - 30 ניתוחים/חודש, עד 5 דקות
- **מאמנים, סוכנויות ובתי ספר למשחק** - ניתוחים ללא הגבלה, ניהול מתאמנים

## 🛠️ טכנולוגיות

- **React** - ספריית UI
- **TypeScript** - טיפוסים סטטיים
- **Vite** - Build tool
- **Supabase** - Backend (Auth, Database, Storage)
- **Google Gemini** - ניתוח וידאו AI
- **Styled Components** - עיצוב

## 📁 מבנה הפרויקט

```
viral-video-director-pro/
├── src/
│   └── lib/
│       ├── supabase.ts          # Supabase client
│       └── supabase-helpers.ts  # Helper functions
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # Database schema
│   ├── storage_policies.sql        # Storage policies
│   ├── webhooks/
│   │   └── payments.sql            # Payment webhooks
│   └── functions/
│       └── payment-webhook/        # Edge Function
├── public/
│   └── Logo.png
├── index.tsx                       # Main app code
├── index.html
└── package.json
```

## 🔐 אבטחה

- **Row Level Security (RLS)** - כל הטבלאות מוגנות
- **Environment Variables** - מפתחות API לא נשמרים בקוד
- **Storage Policies** - קבצים מוגנים לפי משתמש

## 📝 רישיון

Private - כל הזכויות שמורות
