# הגדרת טופס יצירת קשר עם Resend ב-Vercel

## סקירה

טופס יצירת קשר חדש ששולח מיילים דרך Resend API מצד השרת (Vercel Serverless Function), במקום פתיחת Outlook/mailto.

## שלבים להגדרה

### 1. הגדרת משתני סביבה ב-Vercel

1. לך ל-Vercel Dashboard > הפרויקט שלך > Settings > Environment Variables
2. הוסף את המשתנים הבאים:

#### משתנים נדרשים:

- **`RESEND_API_KEY`**
  - Value: ה-API Key שלך מ-Resend
  - איך לקבל: Resend Dashboard > API Keys > Create API Key
  - Environments: Production, Preview, Development (כולם)

- **`CONTACT_FROM_EMAIL`**
  - Value: כתובת האימייל שמוגדרת ב-Resend (חייבת להיות verified domain)
  - דוגמה: `noreply@viraly.co.il` או `contact@viraly.co.il`
  - Environments: Production, Preview, Development

- **`CONTACT_TO_EMAIL`**
  - Value: כתובת האימייל אליה יישלחו ההודעות
  - דוגמה: `viralypro@gmail.com`
  - Environments: Production, Preview, Development

#### דוגמה להגדרה:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
CONTACT_FROM_EMAIL=noreply@viraly.co.il
CONTACT_TO_EMAIL=viralypro@gmail.com
```

### 2. וידוא שהדומיין מאומת ב-Resend

1. לך ל-Resend Dashboard > Domains
2. ודא ש-`viraly.co.il` מאומת (Verified)
3. אם לא, הוסף את ה-DNS records כמו שעשית קודם

### 3. בדיקה

#### בדיקה מקומית (אם יש Vercel CLI):

```bash
# התקן Vercel CLI אם עדיין לא
npm i -g vercel

# הרץ את הפרויקט עם משתני סביבה
vercel dev
```

#### בדיקה בייצור:

1. Deploy את הפרויקט ל-Vercel
2. פתח את האתר
3. לך לטופס יצירת קשר (בתחתית ה-FAQ ב-SubscriptionModal)
4. מלא את הטופס ושלח
5. בדוק שהמייל הגיע ל-`CONTACT_TO_EMAIL`

### 4. בדיקת ה-API ישירות

אפשר לבדוק את ה-API ישירות עם curl:

```bash
curl -X POST https://viraly.co.il/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "בדיקה",
    "email": "test@example.com",
    "subject": "בדיקה",
    "message": "זוהי הודעה לבדיקה של הטופס"
  }'
```

תשובה תקינה:
```json
{"ok": true}
```

## מבנה המייל

המייל שנשלח כולל:
- **From**: "Viraly - Video Director Pro" <CONTACT_FROM_EMAIL>
- **To**: CONTACT_TO_EMAIL
- **Reply-To**: האימייל שהמשתמש הזין
- **Subject**: "[Viraly Contact] {נושא שהמשתמש הזין}"
- **Body**: HTML עם כל הפרטים + תאריך + דף מקור

## אבטחה

הטופס כולל:
1. **Honeypot field** - שדה נסתר שאם מלא, זה spam
2. **Rate limiting** - 5 בקשות ב-10 דקות לפי IP
3. **Validation** - בדיקת אימייל תקין, הודעה מינימום 20 תווים
4. **Server-side only** - המפתח לא נשלח מה-frontend

## פתרון בעיות

### שגיאה: "שירות המייל לא מוגדר"
- ודא שהוספת את כל המשתנים ב-Vercel
- ודא שהמשתנים מוגדרים ב-Environment הנכון (Production/Preview/Development)
- Deploy מחדש אחרי הוספת משתנים

### שגיאה: "יותר מדי בקשות"
- זה rate limiting - נסה שוב בעוד כמה דקות
- אם זה קורה לך בבדיקה, אפשר להסיר את ה-rate limiting זמנית

### המייל לא מגיע
- בדוק ב-Resend Dashboard > Emails אם המייל נשלח
- בדוק את ה-logs ב-Vercel Functions
- ודא ש-`CONTACT_FROM_EMAIL` הוא domain מאומת ב-Resend
- ודא ש-`CONTACT_TO_EMAIL` תקין

### שגיאת CORS
- ה-API route כבר מוגדר עם CORS headers
- אם עדיין יש בעיה, בדוק את ה-vercel.json

## קבצים שנוצרו/עודכנו

1. **`api/contact.ts`** - Vercel Serverless Function לשליחת מיילים
2. **`src/components/modals/ContactForm.tsx`** - Component חדש לטופס יצירת קשר
3. **`src/components/modals/SubscriptionModal.tsx`** - עודכן להשתמש ב-ContactForm
4. **`vercel.json`** - עודכן להכיר ב-API routes
5. **`package.json`** - נוסף `@vercel/node` dependency

## הערות חשובות

- המפתח `RESEND_API_KEY` לא נשלח מה-frontend - רק מה-server
- Rate limiting הוא in-memory (לא מתאים ל-scale גדול - אפשר לשדרג ל-Redis)
- Honeypot field נסתר מה-UI אבל קיים ב-DOM
- כל ההודעות נשלחות עם Reply-To של המשתמש, כך שניתן להגיב ישירות

