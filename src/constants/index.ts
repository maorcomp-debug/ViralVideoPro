import type { SubscriptionTier, SubscriptionPlan, UserSubscription, TrackId } from '../types';

// Test account email - allows multiple registrations with different package names
export const TEST_ACCOUNT_EMAIL = 'maorcomp@gmail.com';
export const ADMIN_EMAIL = 'viralypro@gmail.com';

// --- Subscription Plans Configuration ---
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'ניסיון',
    description: 'טעימה חינמית להכרת הפלטפורמה',
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      maxAnalysesPerPeriod: 2, // 2 analyses per month
      maxVideoSeconds: 60, // 1 minute
      maxFileBytes: 10 * 1024 * 1024, // 10MB
      maxVideoMinutesPerPeriod: 0, // No monthly limit for free tier (only per video limit)
      features: {
        saveHistory: false,
        improvementTracking: false,
        comparison: false,
        advancedAnalysis: false,
        traineeManagement: false,
        pdfExport: false,
        coachDashboard: false,
        customExperts: false,
      },
    },
    badge: 'חינם',
  },
  creator: {
    id: 'creator',
    name: 'יוצרים',
    description: 'מתאים ליוצרי תוכן מתחילים',
    monthlyPrice: 49,
    yearlyPrice: 490, // ~2 months free
    limits: {
      maxAnalysesPerPeriod: 10,
      maxVideoSeconds: 3 * 60, // 3 minutes
      maxFileBytes: 15 * 1024 * 1024, // 15MB
      maxVideoMinutesPerPeriod: 30, // 30 minutes per month
      features: {
        saveHistory: true,
        improvementTracking: true,
        comparison: false,
        advancedAnalysis: false,
        traineeManagement: false,
        pdfExport: true,
        coachDashboard: false,
        customExperts: false,
      },
    },
    popular: true,
  },
  pro: {
    id: 'pro',
    name: 'יוצרים באקסטרים',
    description: 'למקצוענים שמחפשים את המקסימום',
    monthlyPrice: 99,
    yearlyPrice: 990, // ~2 months free
    limits: {
      maxAnalysesPerPeriod: 30,
      maxVideoSeconds: 5 * 60, // 5 minutes
      maxFileBytes: 40 * 1024 * 1024, // 40MB
      maxVideoMinutesPerPeriod: 100, // 100 minutes per month
      features: {
        saveHistory: true,
        improvementTracking: true,
        comparison: true,
        advancedAnalysis: true,
        traineeManagement: false,
        pdfExport: true,
        coachDashboard: false,
        customExperts: true,
      },
    },
  },
  coach: {
    id: 'coach',
    name: 'מאמנים, סוכנויות ובתי ספר למשחק',
    description: 'פלטפורמה מקצועית למאמנים וסטודיואים',
    monthlyPrice: 199,
    yearlyPrice: 1990, // ~2 months free
    limits: {
      maxAnalysesPerPeriod: -1, // Unlimited
      maxVideoSeconds: 5 * 60, // 5 minutes
      maxFileBytes: 40 * 1024 * 1024, // 40MB
      maxVideoMinutesPerPeriod: 200, // 200 minutes per month
      maxTrainees: 10, // Up to 10 trainees
      features: {
        saveHistory: true,
        improvementTracking: true,
        comparison: true,
        advancedAnalysis: true,
        traineeManagement: true,
        pdfExport: true,
        coachDashboard: true,
        customExperts: true,
      },
    },
  },
  'coach-pro': {
    id: 'coach-pro',
    name: 'מאמנים, סוכנויות ובתי ספר למשחק PRO',
    description: 'פלטפורמה מקצועית למאמנים וסטודיואים - גרסת PRO',
    monthlyPrice: 299,
    yearlyPrice: 2990, // ~2 months free
    limits: {
      maxAnalysesPerPeriod: -1, // Unlimited
      maxVideoSeconds: 5 * 60, // 5 minutes
      maxFileBytes: 40 * 1024 * 1024, // 40MB
      maxVideoMinutesPerPeriod: 300, // 300 minutes per month
      maxTrainees: 30, // Up to 30 trainees
      features: {
        saveHistory: true,
        improvementTracking: true,
        comparison: true,
        advancedAnalysis: true,
        traineeManagement: true,
        pdfExport: true,
        coachDashboard: true,
        customExperts: true,
      },
    },
    badge: 'PRO',
  },
};

export const TRACK_DESCRIPTIONS: Record<string, string> = {
  actors: 'חדר האודישנים הראשי של הפקות הדרמה המובילות בישראל ובעולם אצלך בכיס. הסטנדרט הוא קולנועי וחסר פשרות.',
  musicians: 'פאנל השופטים של תוכניות המוזיקה הגדולות והלייבלים המובילים אצלך בכיס.',
  creators: 'האלגוריתם של הרשתות החברתיות (טיקטוק/רילס/יוטיוב) אצלך בכיס.',
  coach: 'פלטפורמה מקצועית למאמנים וסוכנויות לניתוח עומק, מעקב התקדמות והפקת דוחות מקצועיים.',
  influencers: 'חדר האסטרטגיה של המותגים הגדולים ומשרדי הפרסום המובילים אצלך בכיס.',
};

export const EXPERTS_BY_TRACK: Record<string, { title: string; desc: string }[]> = {
  coach: [
    { title: 'מאמן נוכחות מקצועית', desc: 'נוכחות בימתית, ביטחון עצמי, החזקת קהל' },
    { title: 'מומחה דיבור והגשה', desc: 'דיקציה, שטף, אינטונציה, קצב דיבור' },
    { title: 'אנליסט מסר ותוכן', desc: 'בהירות מסר, מבנה לוגי, שכנוע' },
    { title: 'מאמן חיבור רגשי', desc: 'אותנטיות, אמפתיה, יצירת קשר עם קהל' },
    { title: 'מומחה שפת גוף מקצועית', desc: 'תנועות ידיים, יציבה, קשר עין, תנועה במרחב' },
    { title: 'אסטרטג התפתחות', desc: 'מעקב התקדמות, זיהוי נקודות חוזק וחולשה' },
    { title: 'מאמן ביצועים', desc: 'אנרגיה, דינמיקה, מעברים חלקים' },
    { title: 'יועץ מותג אישי', desc: 'עקביות, ייחודיות, מיצוב מקצועי' },
  ],
  creators: [
    { title: 'אסטרטג ויראליות', desc: 'הבטחה מול ביצוע, פוטנציאל שיתוף' },
    { title: 'מאסטר הוקים', desc: '3 שניות ראשונות, לכידת תשומת לב' },
    { title: 'עורך וידאו', desc: 'קצב וזרימה, חיתוכים, זום, אפקטים' },
    { title: 'האקר אלגוריתם', desc: 'זמן צפייה, צפייה חוזרת' },
    { title: 'מומחה אנרגיה', desc: 'וייב, אותנטיות, התאמה לטרנדים' },
    { title: 'עורך הפקה', desc: 'ערך הפקה, תאורה, איכות סאונד' },
    { title: 'גורו מעורבות', desc: 'הנעה לפעולה, עידוד תגובות' },
    { title: 'תסריטאי רשת', desc: 'פאנץ\', הידוק מסרים, סטוריטלינג' },
  ],
  influencers: [
    { title: 'מאסטר רטוריקה', desc: 'דיקציה, שטף דיבור, שכנוע' },
    { title: 'בונה סמכות', desc: 'מיצוב כמומחה, אמינות מקצועית' },
    { title: 'סטוריטלר עסקי', desc: 'העברת מסר מורכב בפשטות' },
    { title: 'מומחה שפת גוף', desc: 'פתיחות, ביטחון עצמי, תנועות' },
    { title: 'מנהל מותג אישי', desc: 'בידול, ערכים, שפה ויזואלית' },
    { title: 'כריזמה בימתית', desc: 'נוכחות, החזקת קהל, אנרגיה' },
    { title: 'קופירייטר שיווקי', desc: 'דיוק המסר, הנעה לפעולה' },
    { title: 'אסטרטג תוכן', desc: 'ערך לקהל, בניית אמון' },
  ],
  actors: [
    { title: 'הבמאי', desc: 'בניית הסצנה, פיצוח הרצון' },
    { title: 'מלהקת ראשית', desc: 'טייפקאסט, אמינות, דמות' },
    { title: 'התסריטאי', desc: 'דיוק בטקסט, סאב-טקסט' },
    { title: 'מאמן משחק', desc: 'מתח גופני, בחירות רגשיות' },
    { title: 'צלם ראשי', desc: 'מציאת האור, קשר עין, עדשה' },
    { title: 'מומחה שפת גוף', desc: 'הלימה בין גוף לטקסט' },
    { title: 'מנטור אודישנים', desc: 'הצגה עצמית, כניסה לדמות' },
    { title: 'אסטרטג קריירה', desc: 'התאמה לתיק עבודות, ליהוק' },
  ],
  musicians: [
    { title: 'מאמן ווקאלי', desc: 'טכניקה, דיוק בצליל, נשימה' },
    { title: 'מפיק מוזיקלי', desc: 'ריתמיקה, גרוב, דינמיקה, עיבוד' },
    { title: 'השופט הקשוח', desc: 'ייחודיות, חותם אישי, כריזמה' },
    { title: 'מומחה פרפורמנס', desc: 'הגשה, תנועה על במה, קהל' },
    { title: 'מומחה אינטרפרטציה', desc: 'רגש, חיבור לטקסט, אמינות' },
    { title: 'סטיילינג ותדמית', desc: 'לוק, נראות, התאמה לז\'אנר' },
    { title: 'מנהל רפרטואר', desc: 'בחירת שיר, התאמה למנעד' },
    { title: 'עורך רדיו', desc: 'פוטנציאל רדיופוני, מסחריות' },
  ],
};

// --- Helper functions for dynamic limits based on track and subscription ---
export const getMaxVideoSeconds = (track: TrackId, subscription?: UserSubscription): number => {
  if (subscription) {
    return SUBSCRIPTION_PLANS[subscription.tier].limits.maxVideoSeconds;
  }
  return track === 'coach' ? 5 * 60 : 60; // Default: 5 minutes for coach, 1 minute for others
};

export const getMaxFileBytes = (track: TrackId, subscription?: UserSubscription): number => {
  if (subscription) {
    return SUBSCRIPTION_PLANS[subscription.tier].limits.maxFileBytes;
  }
  return track === 'coach' ? 40 * 1024 * 1024 : 10 * 1024 * 1024; // Default: 40MB for coach, 10MB for others
};

export const getUploadLimitText = (track: TrackId, subscription?: UserSubscription): string => {
  if (subscription) {
    const plan = SUBSCRIPTION_PLANS[subscription.tier];
    const seconds = plan.limits.maxVideoSeconds;
    const mb = plan.limits.maxFileBytes / (1024 * 1024);
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      return `עד ${minutes} דקות או ${mb}MB`;
    }
    return `עד ${seconds} שניות או ${mb}MB`;
  }
  // Default limits (for free tier)
  if (track === 'coach') {
    return 'עד 5 דקות או 40MB';
  }
  // For free tier: 60 seconds (1 minute) or 10MB
  return 'עד דקה או 10MB';
};

