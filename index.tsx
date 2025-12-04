import React, { useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import styled, { createGlobalStyle, keyframes } from "styled-components";

// --- System Prompt ---
const SYSTEM_PROMPT = `
אתה צוות הפקה הוליוודי שלם המנתח את הסרטון/תמונה/טקסט של המשתמש.
עליך לספק את התשובה בפורמט JSON בלבד, כאשר כל מפתח מייצג איש מקצוע אחר בצוות.
התוכן של כל איש מקצוע צריך להיות בעברית, עשיר, מקצועי, ומעוצב (ניתן להשתמש ב-Markdown עבור רשימות והדגשות).

המטרה: להפוך את המשתמש לכוכב.

המבנה הנדרש (JSON):
{
  "director": "ניתוח הבמאי: נוכחות, שפת גוף, כריזמה, קצב הסרטון, והמסר הכללי. מה עבד ומה לא.",
  "casting": "ניתוח המלהק: אמינות המשחק, התאמה לדמות (טייפקאסט), סוג הז'אנר (דרמה/קומדיה/וכו'), והאם היית עובר אודישן.",
  "scriptwriter": "התסריטאי: 3 גרסאות משופרות לטקסט (רגשית, אנרגטית, אותנטית) כולל הוקים חזקים לפתיחה וקריאה לפעולה בסוף.",
  "acting_coach": "מאמן הביצוע: דגשים על אינטונציה, הבעות פנים, עמידה מול מצלמה, ושימוש בידיים.",
  "cinematographer": "צלם ותאורן: הערות על התאורה, זווית הצילום, הרקע (Setting), והקומפוזיציה.",
  "sound_editor": "איש הסאונד והעריכה: הערות על איכות השמע, קצב הדיבור, המלצות למוזיקת רקע או אפקטים, וחיתוכים.",
  "stylist": "הסטייליסטית: הערות על הלבוש, השיער, וההופעה החיצונית ביחס למסר או לדמות.",
  "producer": "המפיק הראשי: סיכום כללי, הערכת סיכויי הצלחה/קבלה באחוזים, ו-3 משימות פרקטיות לפעם הבאה."
}

הטון: יוקרתי, מקצועי, חד, ללא חנופה, בעיניים של תעשיית הקולנוע והתוכן הגבוהה.
`;

// --- Styles ---

const GlobalStyle = createGlobalStyle`
  body {
    background-color: #050505;
    color: #e0e0e0;
    font-family: 'Assistant', sans-serif;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }
  
  /* Scrollbar styling */
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
`;

const goldColor = "#D4AF37"; // Luxury Gold
const goldGradient = "linear-gradient(135deg, #FDC830 0%, #F37335 100%)";
const darkBg = "#0a0a0a";
const cardBg = "#111111";

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  gap: 50px;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 20px;
  position: relative;
`;

const LogoWrapper = styled.div`
  margin-bottom: 25px;
  filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.3));
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.02);
  }
`;

const Title = styled.h1`
  font-family: 'Frank Ruhl Libre', serif;
  font-size: 4rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: linear-gradient(to right, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
  text-shadow: 0 0 20px rgba(191, 149, 63, 0.3);
  
  @media (max-width: 600px) {
    font-size: 2.8rem;
  }
`;

const Subtitle = styled.div`
  font-family: 'Frank Ruhl Libre', serif;
  color: #aaa;
  font-size: 1.3rem;
  letter-spacing: 4px;
  margin-top: 15px;
  text-transform: uppercase;
  border-top: 1px solid #333;
  display: inline-block;
  padding-top: 15px;
  font-weight: 300;
`;

const IntroText = styled.p`
  font-size: 1.3rem;
  color: ${goldColor};
  max-width: 800px;
  margin: 30px auto 0 auto;
  line-height: 1.7;
  font-weight: 400;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  font-family: 'Assistant', sans-serif;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const FeatureCard = styled.div`
  background: linear-gradient(145deg, #121212, #0a0a0a);
  border: 1px solid #222;
  padding: 30px 25px;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  transition: all 0.4s ease;
  text-align: center;
  
  &:hover {
    border-color: ${goldColor};
    transform: translateY(-5px);
    box-shadow: 0 10px 40px rgba(0,0,0,0.7);
    
    h3 {
      color: ${goldColor};
      letter-spacing: 1px;
    }
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    background: ${goldColor};
    transition: width 0.4s ease;
  }

  &:hover::after {
    width: 60%;
  }
`;

const FeatureTitle = styled.h3`
  font-family: 'Frank Ruhl Libre', serif;
  color: #eee;
  font-size: 1.6rem;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 15px;
  transition: all 0.3s;
`;

const FeatureText = styled.p`
  color: #888;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
  font-family: 'Assistant', sans-serif;
`;

const CapabilitiesButton = styled.button`
  background: transparent;
  color: ${goldColor};
  border: 1px solid ${goldColor};
  padding: 12px 30px;
  font-size: 1.1rem;
  font-family: 'Frank Ruhl Libre', serif;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 auto;
  display: block;
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;

  &:hover {
    background: rgba(212, 175, 55, 0.1);
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.2);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: #0f0f0f;
  border: 1px solid ${goldColor};
  padding: 40px;
  max-width: 800px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 0 80px rgba(212, 175, 55, 0.1);
  border-radius: 4px;
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${goldColor};
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  color: #666;
  font-size: 2rem;
  cursor: pointer;
  transition: color 0.3s;
  line-height: 1;

  &:hover {
    color: ${goldColor};
  }
`;

const ModalTitle = styled.h2`
  font-family: 'Frank Ruhl Libre', serif;
  color: ${goldColor};
  text-align: center;
  font-size: 2.2rem;
  margin-top: 0;
  margin-bottom: 30px;
  border-bottom: 1px solid #333;
  padding-bottom: 20px;
`;

const ModalList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  color: #ccc;
  font-family: 'Assistant', sans-serif;
`;

const ModalListItem = styled.li`
  margin-bottom: 25px;
  
  strong {
    display: block;
    color: #eee;
    font-size: 1.2rem;
    font-family: 'Frank Ruhl Libre', serif;
    margin-bottom: 8px;
    border-right: 3px solid ${goldColor};
    padding-right: 10px;
  }
  
  ul {
    list-style: disc;
    padding-right: 30px;
    margin-top: 5px;
    color: #999;
  }
  
  li {
    margin-bottom: 4px;
  }
`;

const UploadSection = styled.div`
  margin-top: 40px;
  background: ${cardBg};
  border-radius: 4px;
  padding: 2px;
  background-image: linear-gradient(135deg, #444 0%, #111 100%);
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
`;

const UploadInner = styled.div`
  background: #080808;
  border-radius: 2px;
  padding: 50px;
  text-align: center;
`;

const HiddenInput = styled.input`
  display: none;
`;

const UploadButtonArea = styled.div`
  border: 1px solid #333;
  padding: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255,255,255,0.01);
  margin-bottom: 30px;
  
  &:hover {
    background: rgba(255,255,255,0.03);
    border-color: ${goldColor};
  }
`;

const IconWrapper = styled.div`
  font-size: 3.5rem;
  margin-bottom: 20px;
  background: linear-gradient(to bottom, #bf953f, #b38728);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const ContextInput = styled.textarea`
  width: 100%;
  background: #111;
  border: 1px solid #333;
  color: #d0d0d0;
  padding: 25px;
  border-radius: 2px;
  font-family: 'Assistant', sans-serif;
  font-size: 1.15rem;
  min-height: 140px;
  margin-top: 10px;
  resize: vertical;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: ${goldColor};
    box-shadow: 0 0 15px rgba(212, 175, 55, 0.05);
  }

  &::placeholder {
    color: #444;
  }
`;

const ActionButton = styled.button`
  background: linear-gradient(to right, #bf953f, #aa771c, #bf953f);
  background-size: 200% auto;
  color: #000;
  border: none;
  padding: 20px 50px;
  font-size: 1.4rem;
  font-weight: 700;
  border-radius: 2px;
  cursor: pointer;
  width: 100%;
  margin-top: 40px;
  font-family: 'Frank Ruhl Libre', serif;
  text-transform: uppercase;
  letter-spacing: 2px;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(170, 119, 28, 0.3);

  &:hover {
    background-position: right center;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(170, 119, 28, 0.5);
  }

  &:disabled {
    opacity: 0.6;
    cursor: wait;
    transform: none;
  }
`;

const ResultsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-top: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProCard = styled.div`
  background: #101010;
  border: 1px solid #333;
  padding: 30px;
  border-radius: 8px;
  position: relative;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  
  &:hover {
    border-color: ${goldColor};
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(212, 175, 55, 0.1);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${goldGradient};
    border-radius: 8px 8px 0 0;
  }
`;

const Stars = styled.div`
  color: ${goldColor};
  font-size: 1.2rem;
  margin-bottom: 10px;
  letter-spacing: 5px;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
`;

const ProTitle = styled.h3`
  font-family: 'Frank Ruhl Libre', serif;
  color: #fff;
  font-size: 1.8rem;
  margin: 0 0 20px 0;
  border-bottom: 1px solid #333;
  padding-bottom: 15px;
  
  span {
    color: ${goldColor};
    font-size: 0.8em;
    display: block;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 5px;
    font-family: 'Assistant', sans-serif;
    font-weight: 400;
  }
`;

const ProContent = styled.div`
  color: #ccc;
  font-family: 'Assistant', sans-serif;
  line-height: 1.8;
  white-space: pre-wrap;
  font-size: 1.05rem;
  
  strong {
    color: #fff;
    font-weight: 700;
  }
  
  ul {
    padding-right: 20px;
  }
  
  li {
    margin-bottom: 8px;
  }
`;

const ErrorBanner = styled.div`
  background: rgba(100, 20, 20, 0.3);
  border: 1px solid rgba(255, 50, 50, 0.3);
  color: #ffaaaa;
  padding: 15px;
  border-radius: 4px;
  margin-top: 20px;
  text-align: center;
  font-family: 'Assistant', sans-serif;
`;

const Loader = styled.div`
  width: 100%;
  text-align: center;
  margin: 30px 0;
  
  div {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin: 0 6px;
    background: ${goldColor};
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
  }
  
  div:nth-child(1) { animation-delay: -0.32s; }
  div:nth-child(2) { animation-delay: -0.16s; }
  
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
`;

// --- Types ---
interface AnalysisResult {
  director?: string;
  casting?: string;
  scriptwriter?: string;
  acting_coach?: string;
  cinematographer?: string;
  sound_editor?: string;
  stylist?: string;
  producer?: string;
}

// --- Components ---

const ViralyLogo = () => (
  <svg width="100" height="100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDC830" />
        <stop offset="0.5" stopColor="#F37335" />
        <stop offset="1" stopColor="#FDC830" />
      </linearGradient>
    </defs>
    
    <rect x="20" y="40" width="160" height="110" rx="15" stroke="url(#goldGrad)" strokeWidth="6" fill="rgba(20,20,20,0.8)" />
    <path d="M70 40 L50 10" stroke="url(#goldGrad)" strokeWidth="4" strokeLinecap="round" />
    <path d="M130 40 L150 10" stroke="url(#goldGrad)" strokeWidth="4" strokeLinecap="round" />
    <path d="M60 95 L90 125 L140 75" stroke="url(#goldGrad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 60 H-10" stroke="url(#goldGrad)" strokeWidth="4" strokeLinecap="round" opacity="0.6"/>
    <path d="M15 75 H-5" stroke="url(#goldGrad)" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
    <path d="M10 90 H-15" stroke="url(#goldGrad)" strokeWidth="4" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

const App = () => {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const fileToGenerativePart = async (file: File) => {
    return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        const base64Content = base64Data.split(",")[1];
        resolve({
          inlineData: {
            data: base64Content,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalysis = async () => {
 setError(null);
  setLoading(true);
  setResult(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

if (!apiKey) {
  setError("חסר מפתח API. ודא ש-VITE_GEMINI_API_KEY מוגדר בקובץ .env.local");
  return;
}


    if (!file && !prompt) {
      setError("אנא העלה וידאו/תמונה או כתוב טקסט כדי להתחיל.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const ai = new GoogleGenAI({ apiKey });

      
      const parts: any[] = [];
      
      if (file) {
        if (file.size > 20 * 1024 * 1024) {
           throw new Error("קובץ גדול מדי (מקסימום 20MB לגרסת הדמו).");
        }
        const filePart = await fileToGenerativePart(file);
        parts.push(filePart);
      }

      const userPrompt = prompt || "אנא נתח את הקובץ לפי הפורמט המלא שלך.";
      parts.push({ text: userPrompt });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: parts },
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 } 
        }
      });
      
      const text = response.text;
      if (text) {
        try {
          const json = JSON.parse(text);
          setResult(json);
        } catch (e) {
          console.error("Failed to parse JSON", e);
          setError("התשובה שהתקבלה אינה בפורמט התקין. נסה שנית.");
        }
      } else {
        setError("לא התקבלה תשובה. נסה שנית.");
      }

    } catch (err: any) {
      console.error(err);
      setError("שגיאה בעיבוד הבקשה. נסה שנית.\n" + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const renderProCard = (title: string, subtitle: string, content: string | undefined) => {
    if (!content) return null;
    return (
      <ProCard>
        <Stars>★★★★★</Stars>
        <ProTitle>
          <span>{subtitle}</span>
          {title}
        </ProTitle>
        <ProContent dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
      </ProCard>
    );
  };

  return (
    <>
      <GlobalStyle />
      <Container>
        <Header>
          <LogoWrapper>
            <ViralyLogo />
          </LogoWrapper>
          <Title>Viral Video Director Pro</Title>
          <Subtitle>Creator Elite Pro</Subtitle>
          <IntroText>
            סוכן־על המשלב במאי ויראליות, מלהק קולנוע, תסריטאי מומחה ועוד...<br/>
            קבל ניתוח וידאו מלא, הנחיות משחק, הגדרת ז'אנר ותסריטים משופרים.
          </IntroText>
        </Header>
        
        <CapabilitiesButton onClick={() => setShowModal(true)}>
          יכולות האפליקציה של סוכן העל
        </CapabilitiesButton>

        <FeaturesGrid>
          <FeatureCard>
            <FeatureTitle>במאי ויראליות</FeatureTitle>
            <FeatureText>ניתוח נוכחות, שפת גוף, וקצב. שיפור החיבור לצופה והכוח הרגשי של הסרטון.</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureTitle>מלהק מקצועי</FeatureTitle>
            <FeatureText>ניתוח אודישנים מקצועי: האם המשחק אמין? האם הוא מתאים לדמות?</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureTitle>תסריטאי AI</FeatureTitle>
            <FeatureText>שכתוב הטקסט ל-3 גרסאות: רגשית, אנרגטית ואותנטית, כולל הוקים חזקים.</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureTitle>יועץ הפקה</FeatureTitle>
            <FeatureText>הנחיות מדויקות לתאורה, זווית צילום, ורקעים שיחמיאו לשחקן.</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureTitle>מאמן ביצוע</FeatureTitle>
            <FeatureText>שיפור האינטונציה, הבעות הפנים והגשת הטקסט (Delivery).</FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureTitle>מאמן צמיחה</FeatureTitle>
            <FeatureText>משימות להמשך, הערכת סיכויי קבלה ושיפור של 30% בכל טייק.</FeatureText>
          </FeatureCard>
        </FeaturesGrid>

        <UploadSection>
          <UploadInner>
            <UploadButtonArea onClick={() => fileInputRef.current?.click()}>
              <HiddenInput
                type="file"
                accept="video/*,image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <IconWrapper>📹</IconWrapper>
              <h3 style={{color: '#fff', marginTop: 0, fontFamily: 'Frank Ruhl Libre', fontWeight: 700}}>
                {file ? `קובץ נבחר: ${file.name}` : "העלה סרטון אודישן / וידאו לניתוח"}
              </h3>
              <p style={{ color: "#777", fontFamily: 'Assistant' }}>תומך בוידאו (עד 60 שניות) או תמונות מסט צילום</p>
            </UploadButtonArea>

            <ContextInput
              placeholder="הוסף הערות לבמאי: 'זהו אודישן לדמות של נבל בסרט מתח...', 'סרטון טיקטוק למכירת קורס...'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <ActionButton onClick={handleAnalysis} disabled={loading}>
              {loading ? "🎬 הצוות צופה בסרטון..." : "ACTION! קבל ניתוח מקצועי"}
            </ActionButton>

            {loading && (
              <Loader>
                <div></div><div></div><div></div>
              </Loader>
            )}

            {error && <ErrorBanner>{error}</ErrorBanner>}
          </UploadInner>
        </UploadSection>

        {result && (
          <ResultsContainer>
             {renderProCard("הבמאי", "Viral Director", result.director)}
             {renderProCard("המלהק", "Casting Director", result.casting)}
             {renderProCard("התסריטאי", "Scriptwriter AI", result.scriptwriter)}
             {renderProCard("מאמן הביצוע", "Acting Coach", result.acting_coach)}
             {renderProCard("צלם ותאורן", "Cinematographer", result.cinematographer)}
             {renderProCard("סאונד ועריכה", "Sound & Edit", result.sound_editor)}
             {renderProCard("סטייליסטית", "Stylist", result.stylist)}
             {renderProCard("מפיק ראשי", "Executive Producer", result.producer)}
          </ResultsContainer>
        )}
        
        {result && (
            <div style={{marginTop: '60px', textAlign: 'center', opacity: 0.6}}>
               <span style={{fontFamily: 'Frank Ruhl Libre', fontSize: '1.4rem', color: goldColor, letterSpacing: '2px'}}>VIRALY DIRECTOR PRO</span>
            </div>
        )}
      </Container>

      {/* Modal */}
      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <CloseButton onClick={() => setShowModal(false)}>&times;</CloseButton>
            <ModalTitle>יכולות האפליקציה של סוכן העל</ModalTitle>
            <ModalList>
              <ModalListItem>
                <strong>1. ניתוח סרטון מלא (Creator Boost)</strong>
                <ul>
                  <li>נוכחות, גוף, קול, מסר, רגש.</li>
                </ul>
              </ModalListItem>
              <ModalListItem>
                <strong>2. מלהק מקצועי</strong>
                <ul>
                  <li>קביעת סוג הסצנה: קומית, דרמטית, רומנטית, מרגשת.</li>
                  <li>הסבר איך לצלם אותה נכון.</li>
                  <li>כיוון משחק: עמידה, מבט, טון, קצב.</li>
                  <li>טיפים ברמת שחקן מקצועי.</li>
                </ul>
              </ModalListItem>
              <ModalListItem>
                <strong>3. מאמן משחק</strong>
                <ul>
                  <li>הנחיות הבעה.</li>
                  <li>תנועות ידיים נכונות.</li>
                  <li>משחק מול מצלמה.</li>
                  <li>איך להגיש טקסט.</li>
                </ul>
              </ModalListItem>
              <ModalListItem>
                <strong>4. ניתוח אודישן</strong>
                <ul>
                  <li>האם המשחק אמיתי?</li>
                  <li>האם זה מתאים לדמות?</li>
                  <li>מה לשפר כדי לקבל את התפקיד?</li>
                </ul>
              </ModalListItem>
              <ModalListItem>
                <strong>5. תסריטאי</strong>
                <ul>
                  <li>יצירת 3 גרסאות של טקסט משופר.</li>
                  <li>פתיחה חזקה.</li>
                  <li>סיום מרגש/משכנע.</li>
                </ul>
              </ModalListItem>
              <ModalListItem>
                <strong>6. יועץ הפקה</strong>
                <ul>
                  <li>תאורה לצילום אודישן.</li>
                  <li>זוויות צילום מומלצות.</li>
                  <li>רקעים שמחמיאים לשחקן.</li>
                </ul>
              </ModalListItem>
            </ModalList>
            
            <div style={{marginTop: '30px', borderTop: '1px solid #333', paddingTop: '20px', fontFamily: 'Assistant'}}>
              <h3 style={{color: goldColor, fontFamily: 'Frank Ruhl Libre', margin: '0 0 10px 0'}}>פורמט התשובה:</h3>
              <p style={{margin: '0 0 10px 0', color: '#888'}}>ניתוח וידאו • ניתוח משחק • הגדרת ז'אנר • הוראות צילום • תסריט חדש • טיפים לתפקיד • הערכת סיכויים • משימות להמשך</p>
              
              <h3 style={{color: goldColor, fontFamily: 'Frank Ruhl Libre', margin: '20px 0 10px 0'}}>הטון שלנו:</h3>
              <p style={{margin: 0, color: '#888'}}>מקצועי • חד • בעיניים של במאי אמיתי</p>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);