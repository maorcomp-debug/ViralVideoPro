import React from 'react';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalSubtitle,
  ModalCloseBtn,
  ModalBody,
} from '../../styles/modal';

interface CoachGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoachGuideModal: React.FC<CoachGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <ModalCloseBtn onClick={onClose}>✕</ModalCloseBtn>
        <ModalHeader>
          <ModalTitle>הסבר שימוש וניהול - מסלול פרימיום</ModalTitle>
          <ModalSubtitle>
            מדריך פשוט וברור לשימוש במסלול הפרימיום למאמנים וסוכנויות
          </ModalSubtitle>
        </ModalHeader>

        <ModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.2rem' }}>שלב 1: הוספת מתאמנים</h3>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>
                לחץ על כפתור "ניהול מתאמנים" והוסף מתאמנים חדשים. לכל מתאמן תוכל להוסיף שם, אימייל, טלפון והערות. 
                המתאמנים נשמרים אוטומטית בדפדפן שלך.
              </p>
            </div>

            <div>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.2rem' }}>שלב 2: בחירת תחום אימון</h3>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>
                בחר את תחום האימון המתאים: שחקנים, מוזיקאים, יוצרי תוכן, או משפיענים. 
                כל תחום כולל מומחים ייעודיים שיתאימו לניתוח המקצועי.
              </p>
            </div>

            <div>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.2rem' }}>שלב 3: בחירת מומחים</h3>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>
                בחר את המומחים הרצויים לניתוח. כברירת מחדל נבחרים 3 המומחים הראשונים, 
                אך תוכל לבחור מומחים ספציפיים או לעבור ל"כל המומחים" בלחיצה אחת.
              </p>
            </div>

            <div>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.2rem' }}>שלב 4: בחירת סוג ניתוח</h3>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>
                בחר בין ניתוח רגיל (ממוקד וברור) לניתוח מעמיק (מפורט עם timecodes, מיקרו-ניתוח, 
                והשוואה לסטנדרטים מקצועיים). הניתוח המעמיק מתאים למאמנים מקצועיים.
              </p>
            </div>

            <div>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.2rem' }}>שלב 5: בחירת מתאמן</h3>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>
                בחר את המתאמן מהרשימה. זה חשוב כדי לשמור את הניתוח עם שיוך למתאמן הנכון.
              </p>
            </div>

            <div>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.2rem' }}>שלב 6: העלאת וידאו וניתוח</h3>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>
                העלה את הוידאו (המגבלות משתנות לפי החבילה), הוסף הנחיות אופציונליות, ולחץ על "אקשן!" 
                כדי להתחיל את הניתוח. הניתוח יופיע תוך מספר שניות.
              </p>
            </div>

            <div>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.2rem' }}>שלב 7: שמירת הניתוח</h3>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>
                לאחר קבלת הניתוח, לחץ על "שמור ניתוח למתאמן" כדי לשמור אותו. 
                הניתוח יישמר עם שיוך למתאמן הנבחר ויהיה זמין לצפייה מאוחר יותר.
              </p>
            </div>

            <div>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', fontSize: '1.2rem' }}>שלב 8: השוואות ודוחות</h3>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>
                השתמש ב"השוואת ניתוחים" כדי להשוות בין ניתוחים שונים, 
                וב"יצא דוח PDF" במסך ניהול המתאמנים כדי ליצור דוח מקצועי עם כל הניתוחים והמגמות.
              </p>
            </div>

            <div style={{ background: 'rgba(255, 193, 7, 0.15)', padding: '20px', borderRadius: '8px', border: '2px solid rgba(255, 193, 7, 0.5)', marginTop: '10px' }}>
              <h4 style={{ color: '#FFC107', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚠️ אזהרה חשובה - שמירת נתונים
              </h4>
              <p style={{ color: '#ffeb3b', lineHeight: '1.8', margin: '0 0 10px 0', fontWeight: 600 }}>
                כל הנתונים (מתאמנים, ניתוחים, השוואות) נשמרים מקומית בדפדפן שלך בלבד.
              </p>
              <p style={{ color: '#e0e0e0', lineHeight: '1.8', margin: 0 }}>
                <strong>אם תמחק את היסטוריית הדפדפן או תנקה את הנתונים, כל המידע יימחק ולא ניתן יהיה לשחזר אותו.</strong><br/>
                מומלץ מאוד להשתמש בתכונת "ייצוא נתונים" כדי לשמור גיבוי של כל הנתונים במחשב שלך.
              </p>
            </div>

            <div style={{ background: 'rgba(212, 160, 67, 0.1)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(212, 160, 67, 0.3)', marginTop: '10px' }}>
              <h4 style={{ color: '#D4A043', margin: '0 0 10px 0' }}>טיפים חשובים:</h4>
              <ul style={{ color: '#e0e0e0', lineHeight: '1.8', paddingRight: '20px', margin: 0 }}>
                <li>השתמש ב"ייצוא נתונים" לשמירת גיבוי תקופתי של כל הנתונים</li>
                <li>ניתן לשמור מספר בלתי מוגבל של מתאמנים וניתוחים</li>
                <li>השוואות מאפשרות מעקב אחר התקדמות לאורך זמן</li>
                <li>דוחות PDF מקצועיים מוכנים להדפסה או שליחה למתאמנים</li>
              </ul>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

