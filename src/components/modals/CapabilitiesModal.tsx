import React from 'react';
import { TRACK_DESCRIPTIONS } from '../../constants';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalSubtitle,
  ModalCloseBtn,
  ModalTabs,
  ModalTab,
  TrackDescriptionText,
  ModalBody,
  ModalRow,
  ModalRole,
  ModalDesc,
} from '../../styles/modal';

// --- CapabilitiesModal Component ---
interface CapabilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (t: string) => void;
}

export const CapabilitiesModal: React.FC<CapabilitiesModalProps> = ({ 
  isOpen, 
  onClose, 
  activeTab, 
  setActiveTab 
}) => {
  if (!isOpen) return null;

  const content: Record<string, { role: string; desc: string }[]> = {
    actors: [
      { role: 'הבמאי', desc: 'בניית הסצנה, פיצוח הרצון, חלוקה לביטים.' },
      { role: 'מלהקת ראשית', desc: 'טייפקאסט, אמינות, האם הוא "חי" את הדמות.' },
      { role: 'התסריטאי', desc: 'דיוק בטקסט, הבנת הסאב-טקסט והניואנסים.' },
      { role: 'מאמן משחק', desc: 'מתח גופני, בחירות רגשיות, זיכרון חושי.' },
      { role: 'צלם ראשי', desc: 'מציאת האור, קשר עין, עבודה מול עדשה.' },
      { role: 'מומחה שפת גוף', desc: 'הלימה בין גוף לטקסט, מיקרו-הבעות.' },
      { role: 'מנטור אודישנים', desc: 'הצגה עצמית, כניסה ויציאה מדמות.' },
      { role: 'אסטרטג קריירה', desc: 'התאמה לתיק עבודות, פוטנציאל ליהוק.' },
    ],
    musicians: [
       { role: 'מאמן ווקאלי', desc: 'טכניקה, דיוק בצליל, נשימה, תמיכה.' },
       { role: 'מפיק מוזיקלי', desc: 'ריתמיקה, גרוב, דינמיקה, עיבוד.' },
       { role: 'השופט הקשוח', desc: 'ייחודיות, חותם אישי, כריזמה.' },
       { role: 'מומחה פרפורמנס', desc: 'הגשה, תנועה על במה, קשר עם הקהל.' },
       { role: 'מומחה אינטרפרטציה', desc: 'רגש, חיבור לטקסט, אמינות בהגשה.' },
       { role: 'סטיילינג ותדמית', desc: 'לוק, נראות, התאמה לז\'אנר.' },
       { role: 'מנהל רפרטואר', desc: 'בחירת שיר, התאמה למנעד ולזמר.' },
       { role: 'עורך רדיו', desc: 'פוטנציאל רדיופוני, מסחריות.' },
    ],
    creators: [
       { role: 'אסטרטג ויראליות', desc: 'הבטחה מול ביצוע, פוטנציאל שיתוף.' },
       { role: 'מאסטר הוקים', desc: '3 שניות ראשונות, לכידת תשומת לב.' },
       { role: 'עורך וידאו', desc: 'קצב וזרימה, חיתוכים, זום, אפקטים.' },
       { role: 'האקר אלגוריתם', desc: 'זמן צפייה, צפייה חוזרת.' },
       { role: 'מומחה אנרגיה', desc: 'וייב, אותנטיות, התאמה לטרנדים.' },
       { role: 'עורך הפקה', desc: 'ערך הפקה, תאורה, איכות סאונד, כתוביות.' },
       { role: 'גורו מעורבות', desc: 'הנעה לפעולה, עידוד תגובות.' },
       { role: 'תסריטאי רשת', desc: 'פאנץ\', הידוק מסרים, סטוריטלינג קצר.' },
    ],
    coach: [
       { role: 'ניהול מתאמנים מקצועי', desc: 'מערכת ניהול מתאמנים מלאה - הוספה, עריכה, מחיקה, וניהול מידע אישי (שם, אימייל, טלפון, הערות).' },
       { role: 'שמירת ניתוחים ומעקב', desc: 'שמירת כל הניתוחים עם שיוך למתאמן, מעקב התקדמות לאורך זמן, וצפייה בכל הניתוחים השמורים.' },
       { role: 'השוואת ניתוחים מתקדמת', desc: 'השוואה בין ניתוחים שונים של מתאמנים או ניתוחים לאורך זמן - עד 4 ניתוחים במקביל עם טבלת השוואה מפורטת.' },
       { role: 'הפקת דוחות PDF מקצועיים', desc: 'יצירת דוחות PDF מקצועיים ומפורטים לכל מתאמן - כולל כל הניתוחים, מגמות, סטטיסטיקות, והתפתחות לאורך זמן.' },
       { role: 'בחירת תחום אימון גמישה', desc: 'בחירה בין 4 תחומי אימון: שחקנים, מוזיקאים, יוצרי תוכן, ומשפיענים - כל תחום עם מומחים ייעודיים.' },
       { role: 'ניתוח מעמיק ומקצועי', desc: 'בחירה בין ניתוח רגיל לניתוח מעמיק - ניתוח מקצועי עם timecodes, מיקרו-ניתוח, השוואה לסטנדרטים מקצועיים, והמלצות מפורטות.' },
       { role: 'בחירת מומחים מותאמת', desc: 'בחירה חופשית של המומחים הרצויים לכל תחום - 3 מומחים ראשונים כברירת מחדל, אפשרות לעבור בין "3 המובילים" ל"כל המומחים".' },
       { role: 'שמירה מקומית מתקדמת', desc: 'כל הנתונים נשמרים מקומית בדפדפן - מתאמנים, ניתוחים, והשוואות נשארים בין הרצות.' },
       { role: 'מעקב התקדמות ויזואלי', desc: 'צפייה בהתפתחות המתאמן לאורך זמן - מגמות, שיפורים, נקודות חוזק וחולשה, והמלצות מקצועיות.' },
       { role: 'ממשק פרימיום מתקדם', desc: 'עיצוב פרימיום ייחודי, ניהול אינטואיטיבי, וכלים מקצועיים למאמנים וסוכנויות.' },
    ],
    influencers: [
       { role: 'מאסטר רטוריקה', desc: 'דיקציה, שטף דיבור, שכנוע והעברת מסר.' },
       { role: 'בונה סמכות', desc: 'מיצוב כמומחה, אמינות מקצועית וביטחון.' },
       { role: 'סטוריטלר עסקי', desc: 'העברת מסר מורכב בפשטות ורגש.' },
       { role: 'מומחה שפת גוף', desc: 'פתיחות, ביטחון עצמי, תנועות ידיים.' },
       { role: 'מנהל מותג אישי', desc: 'בידול, ערכים, שפה ויזואלית אחידה.' },
       { role: 'כריזמה בימתית', desc: 'נוכחות, החזקת קהל, אנרגיה גבוהה.' },
       { role: 'קופירייטר שיווקי', desc: 'דיוק המסר, הנעה לפעולה אפקטיבית.' },
       { role: 'אסטרטג תוכן', desc: 'ערך לקהל, בניית אמון לאורך זמן.' },
    ]
  };

  const regularTabs = [
    { id: 'actors', label: 'שחקנים ואודישנים' },
    { id: 'musicians', label: 'זמרים ומוזיקאים' },
    { id: 'creators', label: 'יוצרי תוכן וכוכבי רשת' },
    { id: 'influencers', label: 'משפיענים ומותגים' },
  ];
  
  const premiumTab = { id: 'coach', label: 'מסלול פרימיום סטודיו ומאמנים' };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalCloseBtn onClick={onClose}>✕</ModalCloseBtn>
        <ModalHeader>
          <ModalTitle>יכולות האפליקציה של סוכן העל</ModalTitle>
          <ModalSubtitle>
            פשוט וקל<br/>
            מעלים סרטון, מצרפים קובץ הנחיות או תסריט (לדיוק מקסימלי),
            כותבים הנחיה, הוראות או שאלות למומחים (אופציונלי) ולוחצים על אקשן !
          </ModalSubtitle>
        </ModalHeader>
        
        <ModalTabs>
          {regularTabs.map(tab => (
            <ModalTab 
              key={tab.id} 
              $active={activeTab === tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                // Smooth scroll to top of content when switching tabs
                const modalBody = document.querySelector('[data-modal-body]');
                if (modalBody) {
                  modalBody.scrollTop = 0;
                }
              }}
            >
              {tab.label}
            </ModalTab>
          ))}
        </ModalTabs>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginTop: '15px',
          marginBottom: '15px'
        }}>
          <ModalTab 
            $active={activeTab === premiumTab.id}
            onClick={() => {
              setActiveTab(premiumTab.id);
              const modalBody = document.querySelector('[data-modal-body]');
              if (modalBody) {
                modalBody.scrollTop = 0;
              }
            }}
            style={{
              maxWidth: '400px',
              width: '100%'
            }}
          >
            {premiumTab.label}
          </ModalTab>
        </div>

        <TrackDescriptionText>
           {TRACK_DESCRIPTIONS[activeTab]}
        </TrackDescriptionText>
        
        <ModalBody data-modal-body>
          {content[activeTab]?.map((item, idx) => (
             <ModalRow key={idx}>
               <ModalRole>{item.role}</ModalRole>
               <ModalDesc>{item.desc}</ModalDesc>
             </ModalRow>
          )) || <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>תוכן בבנייה...</div>}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

