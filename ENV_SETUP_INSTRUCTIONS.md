# 🔐 איך ליצור את קובץ .env.local

## הבעיה:
השגיאה "Invalid API key" מופיעה כי חסרים משתני הסביבה של Supabase.

## הפתרון:

1. **צור קובץ חדש** בשם `.env.local` (בשורש הפרויקט)

2. **העתק את התבנית הזו** והדבק בקובץ:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-key-here
```

3. **מלא את הערכים**:
   - `VITE_SUPABASE_URL`: לך ל-Supabase Dashboard > Settings > API > Project URL
   - `VITE_SUPABASE_ANON_KEY`: לך ל-Supabase Dashboard > Settings > API > anon public key
   - `VITE_GEMINI_API_KEY`: המפתח שלך מ-Google Gemini

4. **שמור את הקובץ**

5. **הפעל מחדש את השרת**:
   ```bash
   # עצור את השרת (Ctrl+C)
   npm start
   ```

---

## איך למצוא את המפתחות ב-Supabase:

1. **היכנס ל-Supabase Dashboard**: https://app.supabase.com
2. **בחר את הפרויקט שלך**
3. **לך ל-Settings** (בתפריט השמאלי)
4. **לחץ על API**
5. **תראה**:
   - **Project URL**: זה ה-`VITE_SUPABASE_URL`
   - **anon public key**: זה ה-`VITE_SUPABASE_ANON_KEY` (מפתח ארוך שמתחיל ב-`eyJ...`)

---

## דוגמה לקובץ .env.local:

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMzQ1Njc4OSwiZXhwIjoxOTM5MDMyNzg5fQ.abcdefghijklmnopqrstuvwxyz1234567890
VITE_GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

---

## ⚠️ חשוב:

- **אל תעלה את `.env.local` ל-GitHub!** - הוא כבר ב-.gitignore
- **אל תשתף את המפתחות** - הם סודיים!
- **אחרי עדכון הקובץ, הפעל מחדש את השרת**

---

## אחרי יצירת הקובץ:

1. צור את `.env.local` עם המפתחות
2. שמור את הקובץ
3. עצור את השרת (אם רץ)
4. הרץ `npm start` שוב
5. נסה להירשם שוב - השגיאה אמורה להיעלם


