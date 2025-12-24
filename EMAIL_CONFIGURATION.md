# הגדרת שם הנמען במיילי אימות

## כיצד לשנות את שם הנמען מ-"Supabase" ל-"Viraly - video director pro (אימות הרשמה)"

### דרך 1: דרך Supabase Dashboard (מומלץ)

1. היכנס ל-[Supabase Dashboard](https://app.supabase.com)
2. בחר את הפרויקט שלך
3. לך ל-**Authentication** > **Settings**
4. תחת **SMTP Settings**:
   - ודא שיש לך SMTP server מוגדר (אם לא, הגדר אחד)
   - הגדר את **SMTP Sender Name** ל: `Viraly - video director pro`
   - או הגדר את **SMTP Admin Email** לפי הצורך

### דרך 2: דרך Management API

אם יש לך Access Token, אפשר להגדיר דרך API:

```bash
# קבל את ה-access token מ: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# עדכן את הגדרות SMTP
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "smtp_sender_name": "Viraly - video director pro"
  }'
```

### דרך 3: הגדרת Email Templates

1. לך ל-**Authentication** > **Email Templates**
2. ערוך את התבנית **Confirm signup**
3. בתבנית, תוכל להוסיף שם מותאם אישית

**הערה:** אם אין לך SMTP server מוגדר, Supabase ישתמש בשירות המייל המובנה שלהם, וייתכן שלא תוכל לשנות את שם הנמען. מומלץ להגדיר SMTP server מותאם אישית (כמו Resend, SendGrid, וכו').

### המלצות:

- **Resend** - שירות מומלץ לשילוח מיילים
- **SendGrid** - שירות פופולרי אחר
- **AWS SES** - אם אתה כבר משתמש ב-AWS

ראה: https://supabase.com/docs/guides/auth/auth-smtp

