import React, { useState, useRef, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import styled, { createGlobalStyle, keyframes, css } from "styled-components";

// --- PROMPTS & DATA CONFIGURATION ---

const COMMON_INSTRUCTIONS_BASE = `
אתה Viraly AI - המערכת המתקדמת בעולם לניתוח ביצועים.
אתה פועל כפאנל שופטים עלית מהתעשייה הבינלאומית והמקומית הגבוהה ביותר.

**המשימה שלך:**
המשתמש העלה ביצוע (וידאו) ולעיתים קרובות גם טקסט/תסריט מקורי (PDF/תמונה).
בנוסף, המשתמש עשוי לספק הנחיות ספציפיות או שאלות למומחים.
עליך לבצע **השוואה כירורגית (ניתוח פערים)** בין מה שהיה כתוב/נדרש בקובץ המצורף לבין מה שבוצע בפועל בוידאו.
אנחנו לא מחפשים רק "משחק טוב", אלא **דיוק בביצוע ההנחיות**.
הניתוח חייב להיות מקצועי, נוקב, וללא הנחות.

**הנחיות קריטיות לניתוח:**
1. **התמונה הגדולה**: לפני שאתה צולל לפרטים, האם המבצע הבין את המשימה? האם הוא קרא את ההוראות בקובץ או התעלם מהן? בדוק קורלציה מלאה בין הכתוב למבוצע.
2. **התייחסות להערות המשתמש**: אם המשתמש הוסיף הערות או שאלות, התייחס אליהן בנפרד ובכובד ראש.
3. **עברית תקנית וטבעית**: כתוב את הניתוח בעברית עשירה ומקצועית. **הימנע לחלוטין מתעתיק מאולץ של מילים באנגלית** (למשל: אל תכתוב 'קול-באק', 'סלייט', 'שואוריל'). במקום זאת, השתמש במונחים העבריים המקובלים: 'אודישן חוזר', 'הצגה עצמית', 'תיק עבודות'. השתמש במונחים לועזיים רק אם הם "ברזל" בתעשייה הישראלית.
4. **השוואה לטקסט**: חובה לצטט מהקובץ המצורף. תכתוב: "בהוראות כתוב [ציטוט], אך בביצוע בחרת בכיוון הפוך לחלוטין".
5. **טון**: סמכותי, חד, מנטורי, ומקדם. אל תמרח את הזמן.

**המבנה הנדרש (JSON בלבד):**
החזר אובייקט JSON המכיל מפתח "verdict" (סיכום) ומפתח "experts" (מערך אובייקטים).
כל מומחה במערך "experts" יכיל:
- "title": שם המומחה (בדיוק כפי שהוגדר ברשימה למטה).
- "score": מספר 0-100.
- "analysis": טקסט הניתוח המלא (בשפה מקצועית עשירה בעברית בלבד, עם דוגמאות ספציפיות מהוידאו והשוואה לטקסט המצורף).
- "tips": רשימה של 3 צעדים פרקטיים וטכניים לשיפור מיידי בטייק הבא (מסופררים 1., 2., 3.).

**הנחיה למומחה המסכם (The Verdict):**
סיכום מנהלים בשורה תחתונה: האם הביצוע עומד בסטנדרט? האם המבצע עמד במשימה שהוגדרה לו?
`;

interface ExpertDef {
  id: string;
  name: string;
  role: string;
}

interface TrackDef {
  label: string;
  icon: React.ReactNode;
  context: string;
  uiDescription: string;
  verdictPrompt: string;
  experts: ExpertDef[];
}

// --- ICONS DEFINITIONS ---

function MasksIcon() {
  return (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGradIcon" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F5D061" />
        <stop offset="100%" stopColor="#B5831A" />
      </linearGradient>
    </defs>
    <path d="M12 24C12 15 18 10 26 10C34 10 40 15 40 24C40 36 34 42 26 42C18 42 12 36 12 24Z" stroke="url(#goldGradIcon)" strokeWidth="2.5" />
    <path d="M19 22H23" stroke="url(#goldGradIcon)" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M29 22H33" stroke="url(#goldGradIcon)" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M20 32C22 35 26 35 30 32" stroke="url(#goldGradIcon)" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M38 28C38 19 44 14 52 14C60 14 66 19 66 28C66 40 60 46 52 46C44 46 38 40 38 28Z" fill="#111" stroke="url(#goldGradIcon)" strokeWidth="2.5"/>
    <path d="M45 26H49" stroke="url(#goldGradIcon)" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M55 26H59" stroke="url(#goldGradIcon)" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M46 38C48 35 52 35 56 38" stroke="url(#goldGradIcon)" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
  );
}

function MicIcon() {
  return (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="6" width="20" height="30" rx="10" stroke="url(#goldGradIcon)" strokeWidth="2.5" />
    <path d="M28 12V24" stroke="url(#goldGradIcon)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M36 12V24" stroke="url(#goldGradIcon)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M32 6V36" stroke="url(#goldGradIcon)" strokeWidth="1" strokeDasharray="2 2"/>
    <path d="M12 26V28C12 39.0457 20.9543 48 32 48C43.0457 48 52 39.0457 52 28V26" stroke="url(#goldGradIcon)" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M32 48V58" stroke="url(#goldGradIcon)" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M20 58H44" stroke="url(#goldGradIcon)" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
  );
}

function CreatorIcon() {
  return (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="10" width="24" height="44" rx="4" stroke="url(#goldGradIcon)" strokeWidth="2.5" />
    <path d="M29 26V38L38 32L29 26Z" fill="url(#goldGradIcon)" stroke="url(#goldGradIcon)" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M52 14L54 20L60 20L55 24L57 30L52 26L47 30L49 24L44 20L50 20L52 14Z" stroke="url(#goldGradIcon)" strokeWidth="2" fill="none"/>
    <path d="M14 46L10 50" stroke="url(#goldGradIcon)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 40H6" stroke="url(#goldGradIcon)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
  );
}

function MusicIcon() {
  return (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 8V42C24 45 22 48 18 48C14 48 12 45 12 42C12 39 14 36 18 36C20 36 22 37 24 38V8Z" stroke="url(#goldGradIcon)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M48 8V42C48 45 46 48 42 48C38 48 36 45 36 42C36 39 38 36 42 36C44 36 46 37 48 38V8Z" stroke="url(#goldGradIcon)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M24 16H48" stroke="url(#goldGradIcon)" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M24 8H48" stroke="url(#goldGradIcon)" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
  );
}

const VideoCameraIcon = ({width = "60", height = "60"}: {width?: string, height?: string}) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 10L19.5528 7.72361C19.8153 7.59239 20.1265 7.61863 20.3541 7.78886C20.5818 7.95909 20.7027 8.24921 20.6659 8.53046L20.0033 15.4095C19.9665 15.7908 19.8456 16.0809 19.6179 16.2511C19.3903 16.4214 19.0791 16.4476 18.8166 16.3164L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="3" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DocIcon = () => (
   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
     <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
     <path d="M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
     <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
     <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
   </svg>
);

const RefreshIcon = ({width = "24", height = "24"}: {width?: string, height?: string}) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
    </svg>
);

const TRACKS_DATA: Record<string, TrackDef> = {
  actors: {
    label: "שחקנים ואודישנים",
    icon: <MasksIcon />,
    context: "אתה חדר האודישנים הראשי של הפקות הדרמה המובילות בישראל ובעולם. הסטנדרט הוא קולנועי וחסר פשרות.",
    uiDescription: "חדר האודישנים הראשי של הפקות הדרמה המובילות בישראל ובעולם אצלך בכיס. הסטנדרט הוא קולנועי וחסר פשרות.",
    verdictPrompt: "האם זה 'עובר מסך'? האם השחקן עמד במשימה? האם היית מזמין אותו לאודישן חוזר? התייחס לפוטנציאל הליהוקי.",
    experts: [
      { id: 'director', name: 'הבמאי', role: 'בניית הסצנה, פיצוח הרצון, חלוקה לביטים.' },
      { id: 'casting', name: 'מלהקת ראשית', role: 'טייפקאסט, אמינות, האם הוא "חי" את הדמות.' },
      { id: 'screenwriter', name: 'התסריטאי', role: 'דיוק בטקסט, הבנת הסאב-טקסט והניואנסים.' },
      { id: 'acting_coach', name: 'מאמן משחק', role: 'מתח גופני, בחירות רגשיות, זיכרון חושי.' },
      { id: 'camera', name: 'צלם ראשי', role: 'מציאת האור, קשר עין, עבודה מול עדשה.' },
      { id: 'body_lang', name: 'מומחה שפת גוף', role: 'הלימה בין גוף לטקסט, מיקרו-הבעות.' },
      { id: 'mentor', name: 'מנטור אודישנים', role: 'הצגה עצמית, כניסה ויציאה מדמות.' },
      { id: 'agent', name: 'אסטרטג קריירה', role: 'התאמה לתיק עבודות, שיווקיות, פוטנציאל ליהוק.' }
    ]
  },
  singers: {
    label: "זמרים ומוזיקאים",
    icon: <MusicIcon />,
    context: "אתה פאנל השופטים של תוכניות המוזיקה הגדולות והלייבלים המובילים.",
    uiDescription: "פאנל השופטים של תוכניות המוזיקה הגדולות והלייבלים המובילים אצלך בכיס.",
    verdictPrompt: "האם הביצוע מרגש ומקצועי? האם יש 'סטאר קוואליטי'? האם זה להיט?",
    experts: [
      { id: 'vocal_coach', name: 'מאמן ווקאלי', role: 'טכניקה, דיוק בצליל, נשימה, תמיכה.' },
      { id: 'producer', name: 'מפיק מוזיקלי', role: 'ריתמיקה, גרוב, דינמיקה, עיבוד.' },
      { id: 'judge', name: 'השופט הקשוח', role: 'ייחודיות, חותם אישי, כריזמה.' },
      { id: 'performance', name: 'מומחה פרפורמנס', role: 'הגשה, תנועה על במה, קשר עם הקהל.' },
      { id: 'soul', name: 'מומחה אינטרפרטציה', role: 'רגש, חיבור לטקסט, אמינות בהגשה.' },
      { id: 'stylist', name: 'סטיילינג ותדמית', role: 'לוק, נראות, התאמה לז\'אנר.' },
      { id: 'repertoire', name: 'מנהל רפרטואר', role: 'בחירת שיר, התאמה למנעד ולזמר.' },
      { id: 'radio', name: 'עורך רדיו', role: 'פוטנציאל רדיופוני, מסחריות.' }
    ]
  },
  creators: {
    label: "יוצרי תוכן וכוכבי רשת",
    icon: <CreatorIcon />,
    context: "אתה האלגוריתם של הרשתות החברתיות (טיקטוק/רילס/יוטיוב).",
    uiDescription: "האלגוריתם של הרשתות החברתיות (טיקטוק/רילס/יוטיוב) אצלך בכיס.",
    verdictPrompt: "האם זה ויראלי? האם זה יעצור את הגלילה?",
    experts: [
      { id: 'viral_strat', name: 'אסטרטג ויראליות', role: 'הבטחה מול ביצוע, פוטנציאל שיתוף.' },
      { id: 'hook_master', name: 'מאסטר הוקים', role: '3 שניות ראשונות, לכידת תשומת לב.' },
      { id: 'video_editor', name: 'עורך וידאו', role: 'קצב וזרימה, חיתוכים, זום, אפקטים.' },
      { id: 'algo_hacker', name: 'האקר אלגוריתם', role: 'זמן צפייה, צפייה חוזרת.' },
      { id: 'vibe', name: 'מומחה אנרגיה', role: 'וייב, אותנטיות, התאמה לטרנדים.' },
      { id: 'aesthetic', name: 'אסתטיקה', role: 'ערך הפקה, תאורה, איכות סאונד, כתוביות.' },
      { id: 'engagement', name: 'גורו מעורבות', role: 'הנעה לפעולה, עידוד תגובות.' },
      { id: 'script_web', name: 'תסריטאי רשת', role: 'פאנץ\', הידוק מסרים, סטוריטלינג קצר.' }
    ]
  },
  mentors: {
    label: "מנטורים ומרצים",
    icon: <MicIcon />,
    context: "אתה הוועדה האומנותית של כנס המרצים הגדול בעולם (סגנון הרצאות טד).",
    uiDescription: "הוועדה האומנותית של כנס המרצים הגדול בעולם (סגנון הרצאות טד) אצלך בכיס.",
    verdictPrompt: "האם המסר עבר בצורה חדה ומשכנעת? האם היית משלם כרטיס להרצאה הזו?",
    experts: [
      { id: 'rhetoric', name: 'מאמן רטוריקה', role: 'גיוון קולי, אינטונציה, שימוש בשתיקות.' },
      { id: 'content_arch', name: 'ארכיטקט תוכן', role: 'בניית הסיפור, מבנה לוגי, מסר מרכזי.' },
      { id: 'authority', name: 'מומחה סמכות', role: 'שליטה במרחב, ביטחון עצמי.' },
      { id: 'psychology', name: 'פסיכולוגיה של הקהל', role: 'חיבור לקהל, אמפתיה, החזקת קשב.' },
      { id: 'visual_branding', name: 'מיתוג ויזואלי', role: 'תדמית, לבוש, שפת גוף פתוחה.' },
      { id: 'production', name: 'ערך הפקה', role: 'סאונד ברור, תאורה מחמיאה, רקע נקי.' },
      { id: 'charisma', name: 'פקטור הכריזמה', role: 'הניצוץ הייחודי, אנרגיה מדבקת.' },
      { id: 'marketing', name: 'מומחה שיווק', role: 'הפתיח, הנעה לפעולה, רלוונטיות.' }
    ]
  }
};

type TrackType = keyof typeof TRACKS_DATA;


// --- Color Palette ---
const goldColor = "#D4A043";
const darkGold = "#B5831A";
const lightGold = "#F9E4B7"; 
const blackBg = "#000000";

// --- Animations ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const sparkleDim = keyframes`
  0% { box-shadow: 0 0 10px rgba(212, 160, 67, 0.5); filter: brightness(1); border-color: #fff; }
  50% { box-shadow: 0 0 30px rgba(212, 160, 67, 1), 0 0 50px rgba(255, 255, 255, 0.6); filter: brightness(1.2); border-color: ${lightGold}; }
  100% { box-shadow: 0 0 10px rgba(212, 160, 67, 0.5); filter: brightness(1); border-color: #fff; }
`;

// --- Styles ---

const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${blackBg};
    color: #e0e0e0;
    font-family: 'Assistant', sans-serif;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    direction: rtl;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Frank Ruhl Libre', serif;
  }

  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #0a0a0a;
  }
  ::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  /* --- ULTIMATE MOBILE PRINT FIX --- */
  @media print {
    @page {
      margin: 1cm;
      size: A4;
    }
    
    html, body {
      background-color: #ffffff !important;
      background: #ffffff !important;
      color: #000000 !important;
      height: auto !important;
      min-height: 100vh !important;
      width: 100% !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Aggressively hide the normal app container */
    .no-print {
      display: none !important;
      opacity: 0 !important;
      height: 0 !important;
      width: 0 !important;
      overflow: hidden !important;
      visibility: hidden !important;
    }

    /* Force the print container to overlay everything */
    .print-only {
      display: block !important;
      visibility: visible !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: auto !important;
      min-height: 100vh !important;
      background-color: white !important;
      z-index: 9999 !important;
      color: black !important;
    }
    
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
  }

  /* Hide print container on screen */
  @media screen {
    .print-only {
      display: none !important;
    }
  }
`;

const MainContainer = styled.main<{ $isPrintMode: boolean }>`
  width: 100%;
  min-height: 100vh;
  padding-bottom: 50px;
  background: #050505;
  color: #e0e0e0;
`;

const Section = styled.section`
  padding: 60px 20px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;

  @media (max-width: 1024px) { /* Tablet */
    padding: 40px 20px;
  }

  @media (max-width: 768px) { /* Mobile */
    padding: 30px 15px;
  }
`;

// --- Hero Section ---
const HeroSection = styled(Section)`
  text-align: center;
  padding-top: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 60vh;
  justify-content: center;

  @media (max-width: 768px) {
    min-height: auto;
    padding-top: 90px;
    padding-bottom: 40px;
  }
`;

const PlaceholderLogo = styled.div`
  width: 400px;
  height: 260px;
  border: 2px dashed rgba(212, 160, 67, 0.3);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(212, 160, 67, 0.5);
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;

  &:hover {
    border-color: rgba(212, 160, 67, 1);
    color: rgba(212, 160, 67, 1);
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 0 0 30px rgba(212, 160, 67, 0.1);
  }

  @media (max-width: 768px) {
    width: 100%;
    max-width: 300px;
    height: 200px;
    
    div:first-child {
      font-size: 50px !important;
    }
    div:last-child {
      font-size: 18px !important;
    }
  }
`;

const AppLogoImage = styled.img`
  width: auto;
  height: 400px;
  max-width: 90vw;
  object-fit: contain;
  display: block;

  @media (max-width: 768px) {
    height: auto;
    max-height: 280px;
    width: 100%;
  }
`;

const AppLogo = ({ customSrc }: { customSrc?: string | null }) => {
  if (customSrc) {
    return (
      <AppLogoImage 
        src={customSrc} 
        alt="Viraly Custom Logo"
      />
    );
  }

 return (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  }}>
    <img
      src="/logo.png"
      alt="Logo"
      style={{
        maxWidth: '200px',
        height: 'auto'
      }}
    />
  </div>
);

};

const LogoContainer = styled.div`
  margin-bottom: 40px;
  cursor: pointer;
  position: relative;
  
  &:hover::after {
    content: 'לחץ להחלפת לוגו';
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: ${goldColor};
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 0.8rem;
    white-space: nowrap;
    border: 1px solid ${goldColor};
  }

  @media (max-width: 768px) {
    margin-bottom: 5px;
    margin-top: 0;
  }
`;

const MobileLineBreak = styled.br`
    display: none;
    @media (max-width: 768px) {
        display: block;
    }
`;

const HeroDescription = styled.h2`
  margin-top: 20px;
  color: #e0e0e0;
  font-family: 'Assistant', sans-serif;
  font-weight: 300;
  font-size: 1.5rem;
  max-width: 900px;
  line-height: 1.6;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);

  strong {
    color: ${goldColor};
    font-weight: 700;
  }

  @media (max-width: 768px) {
    font-size: 1.1rem;
    padding: 0 10px;
    line-height: 1.5;
    margin-top: 5px;
  }
`;

// --- Track Selection ---
const TrackGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-top: 40px;
  width: 100%;
  
  @media (max-width: 1024px) { /* Tablet */
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) { /* Mobile */
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-top: 30px;
  }
`;

const TrackCard = styled.div<{ $selected: boolean }>`
  background: ${props => props.$selected ? 'linear-gradient(145deg, #222, #0d0d0d)' : 'rgba(20, 20, 20, 0.6)'};
  border: 1px solid ${props => props.$selected ? goldColor : '#333'};
  border-radius: 12px;
  padding: 15px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: ${props => props.$selected ? `0 0 15px rgba(212, 160, 67, 0.15)` : 'none'};

  &:hover {
    border-color: ${goldColor};
    transform: translateY(-3px);
    background: ${props => props.$selected ? 'linear-gradient(145deg, #222, #0d0d0d)' : 'rgba(30, 30, 30, 0.8)'};
  }

  svg {
    width: 35px;
    height: 35px;
    margin-bottom: 10px;
    opacity: ${props => props.$selected ? 1 : 0.8};
    transition: all 0.3s;
    filter: ${props => props.$selected ? 'drop-shadow(0 0 5px rgba(212, 160, 67, 0.5))' : 'none'};
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: ${props => props.$selected ? goldColor : '#e0e0e0'};
  }
  
  @media (max-width: 768px) {
    padding: 12px 8px;
    svg {
        width: 28px;
        height: 28px;
    }
    h3 {
        font-size: 0.9rem;
    }
  }
`;

// --- Panel Selection UI ---

const PanelContainer = styled.div`
  margin-top: 30px;
  padding: 20px;
  background: rgba(20,20,20,0.5);
  border: 1px solid #333;
  border-radius: 16px;
  animation: ${fadeIn} 0.4s ease-out;

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;

  h3 {
    margin: 0;
    color: ${lightGold};
    font-size: 1.2rem;
  }
`;

const PanelControls = styled.div`
  display: flex;
  gap: 8px;
  
  button {
    background: rgba(212, 160, 67, 0.1);
    border: 1px solid ${goldColor};
    color: ${goldColor};
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.9rem;
    cursor: pointer;
    font-family: 'Assistant', sans-serif;
    font-weight: 600;
    transition: all 0.2s;
    
    &:hover {
        background: ${goldColor};
        color: black;
    }
  }
`;

const ExpertsSelectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 15px;

  @media (max-width: 768px) {
    /* Allow cards to be smaller on mobile to fit 2 in a row if screen permits, or stacked */
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
`;

const ExpertCheckbox = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: flex-start;
  padding: 15px;
  background: ${props => props.$isActive ? 'rgba(212, 160, 67, 0.08)' : 'rgba(255,255,255,0.02)'};
  border: 1px solid ${props => props.$isActive ? goldColor : 'rgba(255,255,255,0.1)'};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 100%;
  
  &:hover {
    background: rgba(212, 160, 67, 0.04);
    border-color: ${goldColor};
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const CheckboxInput = styled.div<{ $checked: boolean }>`
    width: 18px;
    height: 18px;
    border: 1px solid ${props => props.$checked ? goldColor : '#666'};
    background: ${props => props.$checked ? goldColor : 'transparent'};
    border-radius: 50%; /* Rounded for list style */
    margin-left: 12px;
    margin-top: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    &:after {
        content: '✓';
        color: black;
        font-weight: bold;
        font-size: 12px;
        display: ${props => props.$checked ? 'block' : 'none'};
    }
`;

// --- Upload Section ---
const VideoUploadArea = styled.div<{ $isDragging: boolean }>`
  margin-top: 40px;
  border: 2px dashed ${props => props.$isDragging ? goldColor : '#444'};
  background: ${props => props.$isDragging ? 'rgba(212, 160, 67, 0.05)' : 'rgba(15, 15, 15, 0.6)'};
  border-radius: 20px;
  padding: 40px;
  min-height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &:hover {
    border-color: ${goldColor};
    background: rgba(25, 25, 25, 0.8);
  }

  svg {
    width: 60px;
    height: 60px;
    margin-bottom: 20px;
    color: ${props => props.$isDragging ? goldColor : '#666'};
    transition: color 0.3s;
  }
  
  &:hover svg {
    color: ${goldColor};
  }

  @media (max-width: 768px) {
    padding: 20px;
    min-height: 200px;
    margin-top: 30px;

    svg {
        width: 45px;
        height: 45px;
        margin-bottom: 15px;
    }
  }
`;

const ScriptUploadButton = styled.div`
  margin-top: 20px;
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid #444;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  cursor: pointer;
  transition: all 0.3s;
  color: #ccc;
  width: 100%;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;

  &:hover {
    border-color: ${goldColor};
    background: rgba(212, 160, 67, 0.1);
    color: ${goldColor};
  }
  
  svg {
    width: 24px;
    height: 24px;
    color: ${goldColor};
  }

  @media (max-width: 768px) {
    padding: 15px;
    span {
        font-size: 1rem;
    }
  }
`;

const FileInput = styled.input`
  display: none;
`;

const InstructionsInput = styled.textarea`
  width: 100%;
  background: rgba(10, 10, 10, 0.8);
  border: 1px solid #444;
  border-radius: 12px;
  padding: 15px;
  color: #e0e0e0;
  font-family: 'Assistant', sans-serif;
  font-size: 1rem;
  margin-top: 30px;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: ${goldColor};
  }
  
  &::placeholder {
    color: #666;
  }
`;

const ActionBigButton = styled.button`
  margin-top: 20px;
  background: linear-gradient(135deg, #F5D061 0%, #FFFFFF 50%, #F5D061 100%);
  background-size: 200% auto;
  color: #000;
  border: 3px solid #fff;
  padding: 15px 50px;
  font-size: 2rem;
  font-weight: 900;
  border-radius: 100px;
  cursor: pointer;
  animation: ${sparkleDim} 2.5s infinite ease-in-out;
  transition: all 0.3s;
  font-family: 'Frank Ruhl Libre', serif;
  text-shadow: 0 0 2px rgba(255,255,255,0.5);
  letter-spacing: 2px;
  
  &:hover {
    background-position: right center;
    transform: scale(1.05);
    box-shadow: 0 0 60px rgba(245, 208, 97, 0.8), 0 0 30px rgba(255, 255, 255, 0.8);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    animation: none;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    padding: 12px 30px;
    font-size: 1.6rem;
    width: 100%;
    max-width: 300px;
  }
`;

const InfoBadge = styled.div`
  margin-top: 15px;
  background: rgba(255, 255, 255, 0.03); /* Transparent */
  color: #ccc; /* Subtle text color */
  border: 1px solid rgba(255, 255, 255, 0.15); /* Subtle border */
  padding: 8px 20px;
  font-size: 1rem;
  font-weight: 400; /* Lighter font weight */
  border-radius: 4px;
  font-family: 'Assistant', sans-serif;
  opacity: 1;
  pointer-events: none;
  user-select: none;
  display: inline-block;
  letter-spacing: 0.5px;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 60px;
  margin-bottom: 40px;
  flex-wrap: wrap;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 15px;
    margin-top: 40px;
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'outline' }>`
  flex: 1;
  min-width: 200px;
  max-width: 350px;
  background: ${props => 
    props.$variant === 'primary' ? `linear-gradient(90deg, ${darkGold}, ${goldColor})` :
    props.$variant === 'secondary' ? '#333' : 
    'transparent'};
  
  border: ${props => props.$variant === 'outline' ? `2px solid ${goldColor}` : 'none'};
  color: ${props => props.$variant === 'outline' ? goldColor : props.$variant === 'primary' ? '#000' : '#fff'};
  padding: 15px 30px;
  font-size: 1.1rem;
  font-weight: 700;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Assistant', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    background: ${props => props.$variant === 'outline' ? 'rgba(212, 160, 67, 0.1)' : undefined};
  }

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    min-width: unset;
  }
`;

// --- Results Section ---
const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 30px;
  margin-top: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr; /* Single column for results cards on mobile */
    gap: 20px;
  }
`;

const ExpertCard = styled.div`
  background: #111;
  border: 1px solid #333;
  border-top: 4px solid ${goldColor};
  border-radius: 12px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s, box-shadow 0.3s;
  animation: ${fadeIn} 0.6s ease-out forwards;
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.7);
    border-color: ${lightGold};
  }

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const ExpertHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #222;
  padding-bottom: 15px;
`;

const ExpertTitle = styled.h3`
  margin: 0;
  color: ${goldColor};
  font-size: 1.3rem;
  font-family: 'Frank Ruhl Libre', serif;
`;

const ScoreBadge = styled.div<{ $score: number }>`
  font-weight: 800;
  font-size: 1.4rem;
  color: ${props => props.$score >= 85 ? '#4caf50' : props.$score >= 70 ? '#ffb300' : '#f44336'};
  text-shadow: 0 0 10px rgba(0,0,0,0.5);
`;

const ExpertAnalysis = styled.p`
  font-size: 1.15rem;
  line-height: 1.7;
  color: #ddd;
  margin-bottom: 25px;
  flex-grow: 1;
`;

const TipsBox = styled.div`
  background: rgba(212, 160, 67, 0.05);
  padding: 20px;
  border-radius: 8px;
  border-right: 3px solid ${goldColor};
  
  h5 {
    margin: 0 0 12px 0;
    color: ${lightGold};
    font-size: 1.25rem;
  }
  
  ul {
    margin: 0;
    padding-right: 20px;
    font-size: 1.1rem;
    color: #ccc;
  }
  
  li {
    margin-bottom: 8px;
  }
`;

const VerdictSection = styled.div`
  background: linear-gradient(135deg, rgba(212, 160, 67, 0.15) 0%, transparent 100%);
  border: 1px solid ${goldColor};
  padding: 40px;
  border-radius: 16px;
  margin-bottom: 50px;
  animation: ${fadeIn} 0.5s ease-out;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);

  @media (max-width: 768px) {
    padding: 25px;
  }
`;

const VerdictTitle = styled.h2`
  color: ${lightGold};
  margin-top: 0;
  font-size: 2rem;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
`;

const LoadingOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.95);
    z-index: 2000;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: ${goldColor};
    backdrop-filter: blur(5px);
    padding: 20px;
    text-align: center;

    h2 {
        margin-top: 30px;
        font-weight: 300;
        letter-spacing: 2px;
        animation: ${shimmer} 2s infinite linear; 
        background: linear-gradient(to right, #B5831A 20%, #F9E4B7 50%, #B5831A 80%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 1.5rem;
    }
`;

const Spinner = styled.div`
    width: 70px;
    height: 70px;
    border: 4px solid rgba(212, 160, 67, 0.2);
    border-radius: 50%;
    border-top-color: ${goldColor};
    animation: spin 1s ease-in-out infinite;
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;

// --- INFO MODAL COMPONENTS ---

const InfoButton = styled.button`
  background: transparent;
  color: ${goldColor};
  border: 1px solid ${goldColor};
  padding: 10px 24px;
  font-size: 1rem;
  border-radius: 30px;
  cursor: pointer;
  margin-bottom: 30px;
  font-family: 'Assistant', sans-serif;
  transition: all 0.3s;
  display: block;
  margin-left: auto;
  margin-right: auto;

  &:hover {
    background: rgba(212, 160, 67, 0.1);
    box-shadow: 0 0 15px rgba(212, 160, 67, 0.3);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  z-index: 3000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  background: #111;
  border: 1px solid ${goldColor};
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 16px;
  padding: 40px;
  position: relative;
  box-shadow: 0 0 50px rgba(0,0,0,0.8);
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${goldColor};
    border-radius: 3px;
  }

  @media (max-width: 768px) {
    padding: 25px;
    max-height: 95vh;
  }
`;

const CloseModalButton = styled.button`
  position: absolute;
  top: 15px;
  left: 15px;
  background: transparent;
  border: none;
  color: #666;
  font-size: 24px;
  cursor: pointer;
  &:hover { color: #fff; }
`;

const ModalTabs = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 30px;
  border-bottom: 1px solid #333;
  padding-bottom: 0;
  overflow-x: auto;
`;

const ModalTab = styled.button<{ $active: boolean }>`
  background: transparent;
  border: none;
  border-bottom: 3px solid ${props => props.$active ? goldColor : 'transparent'};
  color: ${props => props.$active ? goldColor : '#888'};
  padding: 10px 20px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
  font-family: 'Assistant', sans-serif;
  transition: all 0.3s;
  
  &:hover {
    color: ${lightGold};
  }
`;

const ModalTabContent = styled.div`
  margin-top: 25px;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalExpertItem = styled.div`
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #222;
  
  &:last-child {
    border-bottom: none;
  }
  
  strong {
    color: ${lightGold};
    display: block;
    margin-bottom: 4px;
    font-size: 1.1rem;
  }
  span {
    color: #ccc;
    font-size: 0.95rem;
  }
`;

// --- PRINT SPECIFIC COMPONENTS (Designed for A4, Premium Luxury) ---

const PrintPage = styled.div`
  width: 100%;
  max-width: 210mm;
  margin: 0 auto;
  background: white;
  color: #111;
  font-family: 'Assistant', sans-serif;
  direction: rtl;
  padding: 40px;
  box-sizing: border-box;
  
  h1, h2, h3, h4, h5, p, span, li, ul {
      color: #111 !important;
      text-shadow: none !important;
  }

  @media print {
      padding: 0;
      max-width: none;
      margin: 0;
  }
`;

const PrintHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 2px solid ${goldColor};
`;

const PrintLogo = styled.img`
  height: 80px;
  width: auto;
  object-fit: contain;
`;

const PrintFallbackLogo = styled.div`
  color: #000;
  font-weight: 900;
  font-size: 32px;
  border: 3px solid ${goldColor};
  padding: 10px 15px;
  font-family: 'Frank Ruhl Libre', serif;
  letter-spacing: 2px;
`;

const PrintTitle = styled.div`
  text-align: right;
  h1 { 
    margin: 0; 
    font-size: 32px; 
    color: #000; 
    font-weight: 900; 
    font-family: 'Frank Ruhl Libre', serif;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  p { 
    margin: 5px 0 0 0; 
    color: #555; 
    font-size: 14px; 
    font-weight: 600;
  }
`;

const PrintVerdictBox = styled.div`
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-top: 4px solid ${goldColor};
  border-bottom: 4px solid ${goldColor};
  padding: 30px;
  margin-bottom: 50px;
  page-break-inside: avoid;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  
  h2 {
      color: ${darkGold} !important;
      margin: 0 0 15px 0;
      font-size: 22px;
      font-weight: 900;
      font-family: 'Frank Ruhl Libre', serif;
      letter-spacing: 1.5px;
  }
  p {
      font-size: 16px;
      line-height: 1.8;
      margin: 0;
      color: #333;
      font-weight: 500;
  }
`;

const PrintSectionTitle = styled.h2`
    font-size: 24px;
    color: #000;
    border-bottom: 2px solid #eee;
    padding-bottom: 10px;
    margin-top: 40px;
    margin-bottom: 30px;
    font-family: 'Frank Ruhl Libre', serif;
    font-weight: 800;
`;

const PrintExpertsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  
  @media print {
      display: grid;
      grid-template-columns: 1fr 1fr;
  }
`;

const PrintExpertCard = styled.div`
  border: 1px solid #eee;
  background-color: white;
  padding: 25px;
  margin-bottom: 0; /* Handled by grid gap */
  page-break-inside: avoid;
  break-inside: avoid;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
`;

const PrintExpertHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid ${goldColor};
    padding-bottom: 12px;
    margin-bottom: 15px;
`;

const PrintExpertName = styled.h3`
    margin: 0;
    font-size: 18px;
    font-weight: 800;
    color: #000 !important;
    font-family: 'Frank Ruhl Libre', serif;
`;

const PrintScore = styled.div`
    font-weight: 900;
    font-size: 20px;
    color: ${darkGold};
`;

const PrintAnalysis = styled.p`
    font-size: 14px;
    line-height: 1.6;
    color: #444;
    margin-bottom: 20px;
    text-align: justify;
`;

const PrintTips = styled.div`
    background: #fafafa;
    border-right: 3px solid ${goldColor};
    padding: 15px;
    
    h5 {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #000 !important;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    ul {
        margin: 0;
        padding-right: 20px;
    }
    li {
        font-size: 13px;
        margin-bottom: 6px;
        color: #555;
        line-height: 1.4;
    }
`;

const PrintFooter = styled.div`
  margin-top: 50px;
  text-align: center;
  border-top: 1px solid #eee;
  padding-top: 20px;
  color: #999;
  font-size: 12px;
  font-family: 'Frank Ruhl Libre', serif;
`;

// --- Helpers ---
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                },
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// --- Components Breakdown ---

const PrintLayout = ({ data, customLogo }: { data: any, customLogo: string | null }) => {
    return (
        <PrintPage>
             <PrintHeader>
                {customLogo ? (
                    <PrintLogo src={customLogo} alt="Logo" />
                ) : (
                    <PrintFallbackLogo>VIRALY PRO</PrintFallbackLogo>
                )}
                <PrintTitle>
                    <h1>דוח ניתוח ביצועים</h1>
                    <p>{new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </PrintTitle>
            </PrintHeader>

             {data.verdict && (
                <PrintVerdictBox>
                    <h2>✨ השורה התחתונה ✨</h2>
                    <p>
                        {typeof data.verdict === 'string' ? data.verdict : JSON.stringify(data.verdict)}
                    </p>
                </PrintVerdictBox>
            )}

            <PrintSectionTitle>דוח פאנל המומחים</PrintSectionTitle>
            
            <PrintExpertsGrid>
                {data.experts?.map((expert: any, index: number) => (
                    <PrintExpertCard key={index}>
                        <PrintExpertHeader>
                            <PrintExpertName>{expert.title}</PrintExpertName>
                            <PrintScore>{expert.score}/100</PrintScore>
                        </PrintExpertHeader>
                        
                        <PrintAnalysis>
                            {expert.analysis}
                        </PrintAnalysis>
                        
                        {expert.tips && (
                            <PrintTips>
                                <h5>צעדים לשיפור:</h5>
                                <ul>
                                    {Array.isArray(expert.tips) 
                                        ? expert.tips.map((tip: string, i: number) => <li key={i}>{tip}</li>)
                                        : <li>{expert.tips}</li>
                                    }
                                </ul>
                            </PrintTips>
                        )}
                    </PrintExpertCard>
                ))}
            </PrintExpertsGrid>

            <PrintFooter>
                Viraly AI - Video Director Pro • Generated Report
            </PrintFooter>
        </PrintPage>
    );
};

// --- Main Component ---

const App = () => {
  // Initialize with 'actors' track and its first 3 experts
  const initialTrack = 'actors';
  const initialExperts = TRACKS_DATA[initialTrack].experts.slice(0, 3).map(e => e.id);

  const [selectedTrack, setSelectedTrack] = useState<TrackType | null>(initialTrack);
  const [selectedExpertIds, setSelectedExpertIds] = useState<string[]>(initialExperts);
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [userInstructions, setUserInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  
  // Info Modal State
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoTab, setInfoTab] = useState<TrackType>('actors');
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const scriptInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);

  // Use memo to prevent flickering of video preview
  const videoPreviewUrl = useMemo(() => {
    if (videoFile) {
        return URL.createObjectURL(videoFile);
    }
    return null;
  }, [videoFile]);

  // Gemini Setup
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  useEffect(() => {
    // Set document title permanently for good PDF name
    document.title = "viraly-video-director-pro";
  }, []);

  const handleTrackSelect = (trackKey: TrackType) => {
    setSelectedTrack(trackKey);
    // Default to first 3 experts of the new track
    const defaultExperts = TRACKS_DATA[trackKey].experts.slice(0, 3).map(e => e.id);
    setSelectedExpertIds(defaultExperts);
  };

  const toggleExpert = (expertId: string) => {
    if (selectedExpertIds.includes(expertId)) {
        if (selectedExpertIds.length > 1) {
            setSelectedExpertIds(prev => prev.filter(id => id !== expertId));
        }
    } else {
        setSelectedExpertIds(prev => [...prev, expertId]);
    }
  };

  const selectTopExperts = (count: number) => {
      if (!selectedTrack) return;
      const topExperts = TRACKS_DATA[selectedTrack].experts.slice(0, count).map(e => e.id);
      setSelectedExpertIds(topExperts);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleScriptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScriptFile(e.target.files[0]);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomLogo(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleDropVideo = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
      } else {
          alert('אנא גרור קובץ וידאו לכאן');
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedTrack || !videoFile || selectedExpertIds.length === 0) return;

    setLoading(true);
    setResult(null);

    try {
        const filesToUpload = [videoFile, scriptFile].filter((f): f is File => f !== null);
        const parts = await Promise.all(filesToUpload.map(fileToGenerativePart));
        const trackData = TRACKS_DATA[selectedTrack];
        
        const activeExperts = trackData.experts.filter(e => selectedExpertIds.includes(e.id));
        const expertsListText = activeExperts.map(e => `- **${e.name}**: ${e.role}`).join('\n');

        const dynamicPrompt = `
${COMMON_INSTRUCTIONS_BASE}

**הערות/הנחיות מהמשתמש:**
${userInstructions || "אין הערות מיוחדות."}

**הקשר (Context) למסלול הנבחר:**
${trackData.context}

**הנחיה למומחה המסכם (The Verdict):**
${trackData.verdictPrompt}

**חברי פאנל המומחים שנבחרו לניתוח זה (עליך לגלם כל אחד מהם בנפרד):**
${expertsListText}

החזר JSON תקין בלבד עם המבנה שהוגדר למעלה. במערך "experts" החזר אך ורק את המומחים ברשימה זו.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    ...parts,
                    { text: dynamicPrompt }
                ]
            },
            config: {
                responseMimeType: "application/json"
            }
        });

        const jsonText = response.text;
        if (jsonText) {
            const cleanText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(cleanText);
            setResult(parsedData);
        }
    } catch (error) {
        console.error("Error generating analysis:", error);
        alert("שגיאה בניתוח הנתונים. אנא נסה שנית.");
    } finally {
        setLoading(false);
    }
  };

  const handleImprovedTake = () => {
    setResult(null);
    setVideoFile(null);
    setTimeout(() => {
        document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleNewTake = () => {
    setResult(null);
    setVideoFile(null);
    setScriptFile(null);
    setUserInstructions("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <GlobalStyle />
      
      {/* --- SCREEN CONTENT (Hidden during print) --- */}
      <div className="no-print">
          <MainContainer $isPrintMode={false}>
            
            <HeroSection id="hero-section">
              <input 
                type="file" 
                ref={logoInputRef} 
                style={{ display: 'none' }} 
                accept="image/*" 
                onChange={handleLogoUpload} 
              />
              <LogoContainer onClick={() => logoInputRef.current?.click()} title="לחץ להחלפת לוגו">
                <AppLogo customSrc={customLogo} />
              </LogoContainer>
              <HeroDescription>
                הפוך את הוידאו שלך לבלתי נשכח עם <MobileLineBreak /><strong>בימאי ה-AI המתקדם בעולם.</strong><br />
                המערכת מנתחת כל ניואנס בביצוע, משווה לתסריט המקורי ומעניקה משוב כירורגי מפאנל מומחים בהתאמה אישית – למשחק, שירה, הרצאות ויצירת תוכן.<br />
                קבלו ציון מקצועי, הערות מדויקות וטיפים מעשיים לשיפור מיידי שיקפיצו אתכם לרמה הבאה.
              </HeroDescription>
            </HeroSection>

            <Section id="track-section">
                <InfoButton onClick={() => setShowInfoModal(true)}>
                    ✨ יכולות האפליקציה של סוכן העל
                </InfoButton>

                <h2 style={{ textAlign: 'center', color: goldColor }}>מה מקבל כל תחום?</h2>
                <p style={{ textAlign: 'center', color: '#999', marginTop: '-15px' }}>לחץ על כל תחום כדי לגלות אילו מומחים ינתחו את הביצוע שלך</p>
                <TrackGrid>
                    {(Object.keys(TRACKS_DATA) as TrackType[]).map((key) => {
                        const track = TRACKS_DATA[key];
                        return (
                            <TrackCard 
                                key={key} 
                                $selected={selectedTrack === key}
                                onClick={() => handleTrackSelect(key)}
                            >
                                {track.icon}
                                <h3>{track.label}</h3>
                            </TrackCard>
                        );
                    })}
                </TrackGrid>
            </Section>
            
            {selectedTrack && (
                <Section id="panel-config-section" style={{ paddingBottom: 0, paddingTop: '10px' }}>
                    <PanelContainer>
                        <PanelHeader>
                            <h3>הנבחרת שלך ב{TRACKS_DATA[selectedTrack].label}: אלו המומחים ומה הם בודקים</h3>
                            <PanelControls>
                                <button onClick={() => selectTopExperts(3)}>3 המובילים</button>
                                <button onClick={() => selectTopExperts(8)}>כל המומחים</button>
                            </PanelControls>
                        </PanelHeader>
                        
                        <ExpertsSelectionGrid>
                            {TRACKS_DATA[selectedTrack].experts.map((exp) => {
                                const isChecked = selectedExpertIds.includes(exp.id);
                                return (
                                    <ExpertCheckbox 
                                        key={exp.id} 
                                        $isActive={isChecked}
                                        onClick={() => toggleExpert(exp.id)}
                                    >
                                        <CheckboxInput $checked={isChecked} />
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: isChecked ? goldColor : '#eee', marginBottom: '6px' }}>{exp.name}</div>
                                            <div style={{ fontSize: '0.9rem', color: '#bbb', lineHeight: '1.4' }}>{exp.role}</div>
                                        </div>
                                    </ExpertCheckbox>
                                );
                            })}
                        </ExpertsSelectionGrid>
                    </PanelContainer>
                </Section>
            )}

            <Section id="upload-section">
                <VideoUploadArea 
                    $isDragging={isDragging}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDropVideo}
                    onClick={() => videoInputRef.current?.click()}
                >
                    {videoFile && videoPreviewUrl ? (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <video
                                src={videoPreviewUrl}
                                controls
                                playsInline
                                preload="metadata"
                                style={{ 
                                    width: '100%', 
                                    maxHeight: '220px', 
                                    borderRadius: '12px', 
                                    border: `1px solid ${goldColor}`,
                                    background: '#000',
                                    objectFit: 'contain'
                                }}
                            />
                            <p style={{ marginTop: '15px', color: goldColor, fontSize: '0.9rem', marginBottom: 0 }}>
                                {videoFile.name} • לחץ להחלפה
                            </p>
                        </div>
                    ) : (
                        <>
                            <div style={{ color: goldColor, marginBottom: '20px' }}>
                                <VideoCameraIcon />
                            </div>
                            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.5rem', color: '#fff' }}>
                                העלה סרטון
                            </h3>
                            <p style={{ color: '#888', margin: 0 }}>
                                גרור או לחץ להעלאת וידאו
                            </p>
                        </>
                    )}
                    <FileInput 
                        type="file" 
                        accept="video/*" 
                        ref={videoInputRef}
                        onChange={handleVideoSelect}
                    />
                </VideoUploadArea>

                <ScriptUploadButton onClick={() => scriptInputRef.current?.click()}>
                    <DocIcon />
                    <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                        {scriptFile ? scriptFile.name : "הוסף קובץ תסריט או PDF (לניתוח אודישן והנחיות)"}
                    </span>
                    <FileInput 
                        type="file" 
                        accept=".pdf,text/*,image/*" 
                        ref={scriptInputRef}
                        onChange={handleScriptSelect}
                    />
                </ScriptUploadButton>
                
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <InstructionsInput 
                        placeholder="הוסף הנחיות, שאלות או תיאור למומחים (לדיוק מקסימלי)..."
                        value={userInstructions}
                        onChange={(e) => setUserInstructions(e.target.value)}
                    />
                </div>

                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <InfoBadge>
                        {loading ? "..." : `נתח פירוט מלא (${selectedExpertIds.length} מומחים)`}
                    </InfoBadge>

                    <ActionBigButton 
                        disabled={!selectedTrack || !videoFile || loading || selectedExpertIds.length === 0}
                        onClick={handleAnalyze}
                    >
                         {loading ? "מעבד..." : "אקשן !"}
                    </ActionBigButton>
                </div>
            </Section>

            {loading && (
                <LoadingOverlay>
                    <Spinner />
                    <h2>המומחים צופים בביצוע שלך...</h2>
                </LoadingOverlay>
            )}

            {result && (
                <Section id="results-section">
                    
                    {result.verdict && (
                        <VerdictSection className="verdict-box">
                            <VerdictTitle>✨ השורה התחתונה ✨</VerdictTitle>
                            <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: '#eee' }}>
                                {typeof result.verdict === 'string' ? result.verdict : JSON.stringify(result.verdict)}
                            </p>
                        </VerdictSection>
                    )}

                    <h2 style={{ color: goldColor, borderBottom: `1px solid ${goldColor}`, paddingBottom: '15px', marginTop: '50px' }}>
                        דוח פאנל המומחים
                    </h2>
                    
                    <ResultsGrid>
                        {result.experts?.map((expert: any, index: number) => (
                            <ExpertCard key={index} className="expert-card">
                                <ExpertHeader>
                                    <ExpertTitle>{expert.title}</ExpertTitle>
                                    <ScoreBadge $score={expert.score}>{expert.score}/100</ScoreBadge>
                                </ExpertHeader>
                                <ExpertAnalysis>
                                    {expert.analysis}
                                </ExpertAnalysis>
                                {expert.tips && (
                                    <TipsBox>
                                        <h5>צעדים לשיפור:</h5>
                                        <ul>
                                            {Array.isArray(expert.tips) 
                                                ? expert.tips.map((tip: string, i: number) => <li key={i}>{tip}</li>)
                                                : <li>{expert.tips}</li>
                                            }
                                        </ul>
                                    </TipsBox>
                                )}
                            </ExpertCard>
                        ))}
                    </ResultsGrid>

                    <ActionButtonsContainer className="action-buttons-container">
                        <ActionButton 
                            $variant="primary" 
                            onClick={handleImprovedTake}
                            style={{ padding: '10px 25px', fontSize: '1rem', minWidth: '180px', maxWidth: '250px' }}
                        >
                            <VideoCameraIcon width="30" height="30" /> 
                            <span style={{ marginLeft: '10px' }}>טייק משופר</span>
                        </ActionButton>
                        <ActionButton 
                            $variant="outline" 
                            onClick={handleNewTake}
                            style={{ padding: '10px 25px', fontSize: '1rem', minWidth: '180px', maxWidth: '250px' }}
                        >
                            <RefreshIcon width="24" height="24" />
                            <span style={{ marginLeft: '10px' }}>טייק חדש</span>
                        </ActionButton>
                    </ActionButtonsContainer>

                </Section>
            )}
          </MainContainer>
      </div>

      {/* --- INFO MODAL (Displayed on top of everything when active) --- */}
      {showInfoModal && (
        <ModalOverlay onClick={() => setShowInfoModal(false)}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <CloseModalButton onClick={() => setShowInfoModal(false)}>✕</CloseModalButton>
                <h2 style={{ color: goldColor, marginTop: 0, textAlign: 'center' }}>יכולות האפליקציה של סוכן העל</h2>
                <p style={{ textAlign: 'center', fontSize: '1.1rem', lineHeight: '1.6', color: '#ddd' }}>
                    פשוט וקל<br/>
                    מעלים סרטון, מצרפים קובץ הנחיות או תסריט (לדיוק מקסימלי),<br/>
                    כותבים הנחיה, הוראות או שאלות למומחים (אופציונלי) ולוחצים על אקשן !
                </p>

                <ModalTabs>
                    {(Object.keys(TRACKS_DATA) as TrackType[]).map(key => (
                        <ModalTab 
                            key={key} 
                            $active={infoTab === key} 
                            onClick={() => setInfoTab(key)}
                        >
                            {TRACKS_DATA[key].label}
                        </ModalTab>
                    ))}
                </ModalTabs>

                <ModalTabContent>
                    <div style={{ marginBottom: '15px', fontStyle: 'italic', color: '#888', fontSize: '1.1rem' }}>
                        {TRACKS_DATA[infoTab].uiDescription}
                    </div>
                    {TRACKS_DATA[infoTab].experts.map(expert => (
                        <ModalExpertItem key={expert.id}>
                            <strong>{expert.name}</strong>
                            <span>{expert.role}</span>
                        </ModalExpertItem>
                    ))}
                </ModalTabContent>
            </ModalContent>
        </ModalOverlay>
      )}

      {/* --- PARALLEL PRINT CONTENT (Always in DOM, visible ONLY on print) --- */}
      {result && (
          <div className="print-only">
              <PrintLayout data={result} customLogo={customLogo} />
          </div>
      )}
    </>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
