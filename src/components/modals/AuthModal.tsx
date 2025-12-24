import React, { useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabase';
import { fadeIn } from '../../styles/globalStyles';
import { checkEmailExists, checkPhoneExists } from '../../lib/supabase-helpers';
import { TEST_ACCOUNT_EMAIL, SUBSCRIPTION_PLANS } from '../../constants';
import type { SubscriptionTier } from '../../types';

// --- Auth Modal Styled Components ---
const AuthModalOverlay = styled.div<{ $isOpen: boolean }>`
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  z-index: 10000;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
`;

const AuthModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  border: 2px solid #D4A043;
  border-radius: 20px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(212, 160, 67, 0.3);
  animation: ${fadeIn} 0.3s ease;
  position: relative;

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 15px;
  }
`;

const AuthModalHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
  
  h2 {
    color: #D4A043;
    font-size: 2rem;
    margin: 0 0 10px 0;
    font-family: 'Frank Ruhl Libre', serif;
  }
  
  p {
    color: #ccc;
    font-size: 1rem;
    margin: 0;
  }
`;

const AuthButton = styled.button`
  width: 100%;
  background: #D4A043;
  color: #000;
  border: none;
  padding: 15px 25px;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 1px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(212, 160, 67, 0.4);
    background: #F5C842;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AuthCloseButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #444;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 10;

  &:hover {
    background: rgba(212, 160, 67, 0.2);
    border-color: #D4A043;
  }
`;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testPackageTier, setTestPackageTier] = useState<SubscriptionTier>('free');
  
  // Check if current email is test account
  const isTestAccount = email.trim().toLowerCase() === TEST_ACCOUNT_EMAIL.toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate phone format (basic validation - Israeli phone number)
        const phoneRegex = /^0[2-9]\d{7,8}$/;
        const cleanPhone = phone.trim().replace(/\D/g, ''); // Remove non-digits
        
        if (!cleanPhone || cleanPhone.length < 9) {
          setError('מספר טלפון לא תקין. נא להזין מספר טלפון ישראלי (10 ספרות)');
          setLoading(false);
          return;
        }

        // For test account email, skip uniqueness checks (allow multiple registrations)
        if (!isTestAccount) {
          // Check if email already exists
          const emailExists = await checkEmailExists(email.trim());
          if (emailExists) {
            setError('כתובת האימייל כבר רשומה במערכת. נסה להתחבר במקום או השתמש באימייל אחר.');
            setLoading(false);
            return;
          }

          // Check if phone already exists
          const phoneExists = await checkPhoneExists(cleanPhone);
          if (phoneExists) {
            setError('מספר הטלפון כבר רשום במערכת. נסה להתחבר במקום או השתמש במספר טלפון אחר.');
            setLoading(false);
            return;
          }
        }

        const redirectUrl = window.location.origin;
        console.log('🔐 Attempting sign up...');
        console.log('Email:', email.trim());
        console.log('Phone:', cleanPhone);
        console.log('Is test account:', isTestAccount);
        console.log('Test package tier:', isTestAccount ? testPackageTier : 'N/A');
        console.log('Redirect URL:', redirectUrl);
        console.log('Current location:', window.location.href);
        
        // For test accounts, set full_name to package name
        let displayName = fullName.trim();
        if (isTestAccount) {
          displayName = `חבילת ${SUBSCRIPTION_PLANS[testPackageTier].name}`;
        }
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: displayName,
              phone: cleanPhone,
              test_package_tier: isTestAccount ? testPackageTier : undefined, // Store package tier for test accounts
            },
            emailRedirectTo: redirectUrl,
          },
        });
        
        console.log('Sign up response:', { data, error: signUpError });

        if (signUpError) {
          console.error('Sign up error:', signUpError);
          console.error('Error code:', signUpError.status);
          console.error('Error details:', JSON.stringify(signUpError, null, 2));
          
          // For test accounts, allow duplicate email errors to pass (Supabase might still create the user)
          if (isTestAccount && signUpError.message?.includes('already registered')) {
            console.log('Test account registration - duplicate email allowed, checking if user was created anyway');
            // Don't throw error - continue to check if user was created
          } else {
            // Translate common error messages to Hebrew
            let errorMessage = signUpError.message;
            
            // Handle 401 Unauthorized - could be user already exists or API key issue
            if (signUpError.status === 401) {
              console.error('401 Error - Possible causes:');
              console.error('1. User already exists');
              console.error('2. Invalid API key');
              console.error('3. Email confirmation required');
              
              // Check if it's because user already exists
              if (signUpError.message.includes('already registered') || 
                  signUpError.message.includes('already exists') ||
                  signUpError.message.includes('User already registered') ||
                  signUpError.message.toLowerCase().includes('user')) {
                errorMessage = 'משתמש זה כבר רשום במערכת. נסה להתחבר במקום.';
              } else if (signUpError.message.includes('Invalid API key') || 
                         signUpError.message.includes('JWT') ||
                         signUpError.message.includes('api')) {
                errorMessage = 'מפתח API לא תקין. אנא בדוק את ההגדרות ב-.env.local והפעל מחדש את השרת.';
              } else {
                errorMessage = 'שגיאת הרשאה (401). המשתמש כבר קיים או שיש בעיה בהגדרות. נסה להתחבר במקום.';
              }
            } else if (signUpError.message.includes('Invalid API key') || signUpError.message.includes('JWT')) {
              errorMessage = 'מפתח API לא תקין. אנא בדוק את ההגדרות ב-.env.local';
            } else if (signUpError.message.includes('User already registered') || 
                       signUpError.message.includes('already exists')) {
              errorMessage = 'משתמש זה כבר רשום במערכת. נסה להתחבר במקום.';
            } else if (signUpError.message.includes('Password') || signUpError.message.includes('password')) {
              errorMessage = 'הסיסמה חלשה מדי. נסה סיסמה חזקה יותר (לפחות 6 תווים).';
            } else if (signUpError.message.includes('email') || signUpError.message.includes('Email')) {
              errorMessage = 'כתובת האימייל לא תקינה או כבר קיימת במערכת.';
            } else if (signUpError.message.includes('rate limit') || signUpError.message.includes('too many')) {
              errorMessage = 'יותר מדי ניסיונות. נסה שוב בעוד כמה דקות.';
            }
            
            throw new Error(errorMessage);
          }
        }
        
        if (data.user) {
          // For test accounts, update subscription_tier immediately
          if (isTestAccount && data.user.id) {
            try {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ subscription_tier: testPackageTier })
                .eq('user_id', data.user.id);
              
              if (updateError) {
                console.error('Error updating test account subscription tier:', updateError);
                // Continue anyway - user can update manually
              } else {
                console.log(`Test account subscription tier set to: ${testPackageTier}`);
              }
            } catch (err) {
              console.error('Error updating test account profile:', err);
              // Continue anyway
            }
          }
          
          // Check if email confirmation is required
          if (data.user.email_confirmed_at) {
            // User is already confirmed, log them in
            alert('נרשמת בהצלחה!');
            onAuthSuccess();
            onClose();
          } else {
            // Email confirmation required
            alert('נרשמת בהצלחה! אנא בדוק את תיבת הדואר שלך כדי לאשר את האימייל.');
            onAuthSuccess();
            onClose();
          }
        } else {
          throw new Error('לא ניתן ליצור משתמש. נסה שוב.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          console.error('Sign in error:', signInError);
          console.error('Error code:', signInError.status);
          
          let errorMessage = signInError.message;
          
          if (signInError.status === 401) {
            if (signInError.message.includes('Invalid login credentials') || 
                signInError.message.includes('invalid')) {
              errorMessage = 'אימייל או סיסמה שגויים. נסה שוב.';
            } else {
              errorMessage = 'שגיאת הרשאה. בדוק את האימייל והסיסמה.';
            }
          } else if (signInError.message.includes('Email not confirmed')) {
            errorMessage = 'נא לאשר את האימייל שלך לפני הכניסה. בדוק את תיבת הדואר.';
          } else if (signInError.message.includes('email')) {
            errorMessage = 'כתובת האימייל לא תקינה.';
          }
          
          throw new Error(errorMessage);
        }
        
        onAuthSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'אירעה שגיאה. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AuthModalOverlay $isOpen={isOpen} onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <AuthModalContent>
        <AuthCloseButton onClick={onClose}>×</AuthCloseButton>
        <AuthModalHeader>
          <h2>{isSignUp ? 'הרשמה' : 'כניסה'}</h2>
          <p>{isSignUp ? 'צור חשבון חדש' : 'היכנס לחשבון שלך'}</p>
        </AuthModalHeader>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isSignUp && (
            <>
              {isTestAccount ? (
                <div>
                  <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>
                    בחר חבילה לבדיקה
                  </label>
                  <select
                    value={testPackageTier}
                    onChange={(e) => setTestPackageTier(e.target.value as SubscriptionTier)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(212, 160, 67, 0.3)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#fff',
                      fontSize: '1rem',
                      direction: 'rtl',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="free">חבילת ניסיון (חינם)</option>
                    <option value="creator">חבילת יוצרים</option>
                    <option value="pro">חבילת יוצרים באקסטרים</option>
                    <option value="coach">חבילת מאמנים</option>
                  </select>
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '10px', 
                    background: 'rgba(212, 160, 67, 0.1)', 
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    color: '#D4A043',
                    textAlign: 'right'
                  }}>
                    שם הכניסה יהיה: חבילת {SUBSCRIPTION_PLANS[testPackageTier].name}
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>
                    שם מלא
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(212, 160, 67, 0.3)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#fff',
                      fontSize: '1rem',
                      direction: 'rtl',
                    }}
                  />
                </div>
              )}
              <div>
                <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>
                  מספר טלפון <span style={{ color: '#ff6b6b' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0501234567"
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(212, 160, 67, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#fff',
                    fontSize: '1rem',
                    direction: 'ltr',
                    textAlign: 'left',
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: '#888', textAlign: 'right', marginTop: '5px' }}>
                  מספר טלפון ישראלי (10 ספרות)
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>
              אימייל
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                // Reset package tier when email changes (if not test account)
                if (e.target.value.trim().toLowerCase() !== TEST_ACCOUNT_EMAIL.toLowerCase()) {
                  setTestPackageTier('free');
                }
              }}
              required
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(212, 160, 67, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                color: '#fff',
                fontSize: '1rem',
                direction: 'ltr',
                textAlign: 'left',
              }}
            />
            {isTestAccount && (
              <div style={{ 
                marginTop: '5px', 
                fontSize: '0.85rem', 
                color: '#D4A043',
                textAlign: 'right',
                fontStyle: 'italic'
              }}>
                📧 מייל בדיקות - ניתן לרישום מרובה עם חבילות שונות
              </div>
            )}
          </div>

          <div>
            <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>
              סיסמה
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(212, 160, 67, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                color: '#fff',
                fontSize: '1rem',
                direction: 'ltr',
              }}
            />
          </div>

          {error && (
            <div style={{ color: '#ff6b6b', textAlign: 'right', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <AuthButton
            type="submit"
            disabled={loading}
          >
            {loading ? 'מעבד...' : (isSignUp ? 'הרשמה' : 'כניסה')}
          </AuthButton>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#D4A043',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textDecoration: 'underline',
            }}
          >
            {isSignUp ? 'יש לך כבר חשבון? התחבר' : 'אין לך חשבון? הירשם'}
          </button>
        </form>
      </AuthModalContent>
    </AuthModalOverlay>
  );
};

