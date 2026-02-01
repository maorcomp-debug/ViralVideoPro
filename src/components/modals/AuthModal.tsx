import React, { useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabase';
import { fadeIn } from '../../styles/globalStyles';
import { checkEmailExists, checkPhoneExists, validateCoupon, redeemCoupon, updateCurrentUserProfile } from '../../lib/supabase-helpers';
import { TEST_ACCOUNT_EMAIL, SUBSCRIPTION_PLANS } from '../../constants';
import type { SubscriptionTier, TrackId } from '../../types';

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
  max-height: 90vh;
  overflow-y: auto;
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

const PackageSelect = styled.select`
  width: 100%;
  background: rgba(30, 30, 30, 0.95) !important;
  border: 1px solid rgba(212, 160, 67, 0.3);
  border-radius: 8px;
  padding: 12px;
  color: #fff;
  font-size: 1rem;
  direction: rtl;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23D4A043' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: left 12px center;
  padding-left: 40px;
  transition: all 0.3s;

  &:hover {
    border-color: rgba(212, 160, 67, 0.5);
    background-color: rgba(40, 40, 40, 0.95) !important;
  }

  &:focus {
    outline: none;
    border-color: #D4A043;
    box-shadow: 0 0 0 2px rgba(212, 160, 67, 0.2);
  }

  option {
    background: rgba(30, 30, 30, 0.95);
    color: #fff;
    padding: 10px;
    direction: rtl;
  }

  option:hover {
    background: rgba(212, 160, 67, 0.2);
  }

  option:checked {
    background: rgba(212, 160, 67, 0.3);
  }
`;

const TRACK_OPTIONS: { id: TrackId; label: string }[] = [
  { id: 'actors', label: 'שחקנים ואודישנים' },
  { id: 'musicians', label: 'זמרים ומוזיקאים' },
  { id: 'creators', label: 'יוצרי תוכן וכוכבי רשת' },
  { id: 'influencers', label: 'משפיענים ומותגים' },
];

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
  /** כשנפתח מהקישור "מימוש ההטבה" במייל – מציג הרשמה עם שדה קופון מופעל וממולא */
  initialRedeemCode?: string | null;
  /** חבילה מיועדת להטבה (creator, pro, coach, coach-pro) – נבחרת מראש */
  initialPackage?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialRedeemCode,
  initialPackage,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [showCouponField, setShowCouponField] = useState(false);
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponValid, setCouponValid] = useState<{ valid: boolean; coupon?: any; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testPackageTier, setTestPackageTier] = useState<SubscriptionTier>('free');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('free');
  const [selectedTrack, setSelectedTrack] = useState<TrackId | ''>('');
  
  // Check if current email is test account
  const isTestAccount = email.trim().toLowerCase() === TEST_ACCOUNT_EMAIL.toLowerCase();

  const tierRequiresTrack = (tier: SubscriptionTier) => tier === 'free' || tier === 'creator';

  // When opened from "Redeem Offer" link (?redeem=CODE), switch to registration with coupon field on and pre-filled
  React.useEffect(() => {
    if (!isOpen) return;
    if (initialRedeemCode?.trim()) {
      const code = initialRedeemCode.trim().toUpperCase();
      setIsSignUp(true);
      setShowCouponField(true);
      setCouponCode(code);
      setCouponValid(null);
      validateCoupon(code).then((validation) => setCouponValid(validation)).catch(() => setCouponValid({ valid: false, error: 'שגיאה בבדיקת קוד הקופון' }));
    }
    if (initialPackage && ['creator', 'pro', 'coach', 'coach-pro'].includes(initialPackage)) {
      setSelectedTier(initialPackage as SubscriptionTier);
    }
  }, [isOpen, initialRedeemCode, initialPackage]);

  // Validate coupon code
  const handleCouponValidation = async (code: string) => {
    if (!code.trim()) {
      setCouponValid(null);
      return;
    }

    setCouponValidating(true);
    try {
      const validation = await validateCoupon(code.trim());
      setCouponValid(validation);
    } catch (error) {
      setCouponValid({ valid: false, error: 'שגיאה בבדיקת קוד הקופון' });
    } finally {
      setCouponValidating(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('אנא הזן את כתובת האימייל שלך');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        console.error('Password reset error:', resetError);
        throw new Error('שגיאה בשליחת אימייל איפוס סיסמה. נסה שוב מאוחר יותר.');
      }

      setPasswordResetSent(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'אירעה שגיאה. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (loading) {
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
          // Validate full name (must contain first name and last name - at least 2 words)
          const trimmedFullName = fullName.trim();
          const nameWords = trimmedFullName.split(/\s+/).filter(word => word.length > 0);
          
          if (!trimmedFullName || trimmedFullName.length < 3) {
            setError('אנא הזן שם מלא (שם פרטי ומשפחה)');
            setLoading(false);
            return;
          }
          
          if (nameWords.length < 2) {
            setError('אנא הזן שם מלא הכולל שם פרטי ושם משפחה');
            setLoading(false);
            return;
          }

          // Validate phone format (basic validation - Israeli phone number)
          const phoneRegex = /^0[2-9]\d{7,8}$/;
          const cleanPhone = phone.trim().replace(/\D/g, ''); // Remove non-digits
          
          if (!cleanPhone || cleanPhone.length < 9) {
            setError('מספר טלפון לא תקין. נא להזין מספר טלפון ישראלי (10 ספרות)');
            setLoading(false);
            return;
          }

          // Require track selection עבור ניסיון / יוצרים
          if (tierRequiresTrack(selectedTier) && !selectedTrack) {
            setError('נא לבחור תחום ניתוח התחלתי');
            setLoading(false);
            return;
          }

        // For test account email, skip uniqueness checks (allow multiple registrations)
        if (!isTestAccount) {
          // Check uniqueness in parallel for better performance
          const [emailExists, phoneExists] = await Promise.all([
            checkEmailExists(email.trim()),
            checkPhoneExists(cleanPhone)
          ]);
          
          if (emailExists) {
            setError('כתובת האימייל כבר רשומה במערכת. נסה להתחבר במקום או השתמש באימייל אחר.');
            setLoading(false);
            return;
          }

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
              signup_tier: selectedTier,
              signup_primary_track: selectedTrack || undefined,
            },
            emailRedirectTo: redirectUrl,
          },
        });
        
        console.log('Sign up response:', { data, error: signUpError });

        if (signUpError) {
          console.error('Sign up error:', signUpError);
          console.error('Error code:', signUpError.status);
          console.error('Error details:', JSON.stringify(signUpError, null, 2));
          
          // For test accounts, handle duplicate email gracefully
          // Supabase may allow multiple users with same email if configured, or may return error
          // We'll allow the error for test accounts and let Supabase handle it
          if (isTestAccount) {
            console.log('Test account registration - duplicate email may occur, Supabase will handle it');
            // For test accounts, we don't throw on "already registered" - let Supabase handle duplicates
            if (signUpError.message?.includes('already registered') || 
                signUpError.message?.includes('already exists') ||
                signUpError.message?.includes('User already registered')) {
              // This is expected for test accounts - allow multiple registrations with different passwords
              console.log('Test account: Multiple registrations with same email allowed (different passwords per package)');
              // Don't throw - check if user was created anyway or show message
              setError('המשתמש כבר קיים עם סיסמה אחרת. נסה סיסמה שונה או התחבר עם הסיסמה הקיימת.');
              setLoading(false);
              return;
            }
          }
          
          // Translate common error messages to Hebrew (for non-test accounts or other errors)
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
        
        if (data.user) {
          console.log('✅ User created successfully:', {
            id: data.user.id,
            email: data.user.email,
            email_confirmed_at: data.user.email_confirmed_at,
            created_at: data.user.created_at
          });

          // ⚠️⚠️⚠️ CRITICAL - DO NOT MODIFY THIS SECTION ⚠️⚠️⚠️
          // 
          // This section was FIXED after many efforts to solve signup race condition.
          // The database trigger (handle_new_user) creates profile with metadata automatically.
          // DO NOT add profile updates here - the trigger handles everything!
          //
          // PROBLEM SOLVED: Race condition where loadUserData ran before profile update.
          // SOLUTION: Database trigger reads signup metadata and creates profile correctly from start.
          //
          // ⚠️ DO NOT MODIFY - Profile is created by trigger with metadata (signup_tier, signup_primary_track) ⚠️
          // Date fixed: 2026-01-16
          // Status: WORKING - DO NOT TOUCH
          if (data.user.id) {
            // Give trigger 200ms to create profile with metadata
            // DO NOT change this delay - it's needed for trigger to complete
            await new Promise(resolve => setTimeout(resolve, 200));
            console.log('✅ Profile created by trigger with metadata:', {
              tier: selectedTier,
              track: selectedTrack,
            });
          }

          // Handle test accounts and coupons AFTER profile update
          if (isTestAccount && data.user.id) {
            try {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ subscription_tier: testPackageTier })
                .eq('user_id', data.user.id);
              
              if (updateError) {
                console.error('Error updating test account subscription tier:', updateError);
              } else {
                console.log(`✅ Test account subscription tier set to: ${testPackageTier}`);
              }
            } catch (err) {
              console.error('Error updating test account profile:', err);
            }
          }

          // Apply coupon if provided
          if (couponCode.trim() && couponValid?.valid && data.user.id) {
            try {
              await redeemCoupon(couponCode.trim(), data.user.id);
              console.log('✅ Coupon redeemed successfully');
            } catch (couponError: any) {
              console.error('Error redeeming coupon:', couponError);
              alert(`נרשמת בהצלחה, אך היה בעיה בשימוש בקוד הקופון: ${couponError.message}. אנא פנה לתמיכה.`);
            }
          }

          // Email confirmation is DISABLED in this environment - login user immediately after signup
          // If signUp didn't create a session (common when email confirmation is disabled), sign in immediately
          let session = data.session;
          if (!session && data.user) {
            console.log('🔄 No session after signup, signing in automatically...');
            try {
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
              });
              
              if (signInError) {
                console.error('Error signing in after signup:', signInError);
                // Continue anyway - user might still be logged in
              } else if (signInData.session) {
                session = signInData.session;
                console.log('✅ Successfully signed in after signup');
              }
            } catch (signInErr) {
              console.error('Exception during auto sign-in after signup:', signInErr);
              // Continue anyway
            }
          }
          
          // Profile update complete - call onAuthSuccess immediately (like login)
          console.log('✅ Registration completed. User logged in with selected package:', selectedTier);
          
          alert('נרשמת בהצלחה!');
          
          // Call onAuthSuccess to reload user data with updated profile
          onAuthSuccess();
          
          onClose();
        } else {
          console.error('❌ User creation failed - no user data returned');
          throw new Error('לא ניתן ליצור משתמש. נסה שוב.');
        }
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
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

        // Email confirmation is disabled - no extra blocking checks here
        console.log('✅ User logged in successfully (email confirmation disabled):', {
          email: signInData?.user?.email
        });
        
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
    <AuthModalOverlay 
      $isOpen={isOpen} 
      onMouseDown={(e) => {
        // Only close if clicking directly on the overlay, not on child elements
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <AuthModalContent
        onMouseDown={(e) => {
          // Prevent clicks inside modal from closing it
          e.stopPropagation();
        }}
      >
        <AuthCloseButton onClick={onClose}>×</AuthCloseButton>
        <AuthModalHeader>
          <h2>{showPasswordReset ? 'איפוס סיסמה' : (isSignUp ? 'הרשמה' : 'כניסה')}</h2>
          <p>
            {showPasswordReset 
              ? 'נשלח לך אימייל עם קישור לאיפוס הסיסמה' 
              : (isSignUp ? 'צור חשבון חדש' : 'היכנס לחשבון שלך')
            }
          </p>
        </AuthModalHeader>

        {showPasswordReset ? (
          <form onSubmit={handlePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {passwordResetSent ? (
              <div style={{ 
                padding: '20px', 
                background: 'rgba(76, 175, 80, 0.2)', 
                borderRadius: '10px',
                border: '1px solid rgba(76, 175, 80, 0.5)',
                textAlign: 'right',
                color: '#4CAF50'
              }}>
                <p style={{ margin: 0, fontSize: '1rem', marginBottom: '10px' }}>
                  ✓ אימייל איפוס סיסמה נשלח לכתובת: <strong>{email}</strong>
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc' }}>
                  אנא בדוק את תיבת הדואר שלך ולחץ על הקישור לאיפוס הסיסמה.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>
                    אימייל
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="הכנס את כתובת האימייל שלך"
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
                </div>

                {error && (
                  <div style={{ color: '#ff6b6b', textAlign: 'right', fontSize: '0.9rem' }}>
                    {error}
                  </div>
                )}

                <AuthButton
                  type="submit"
                  disabled={loading || !email.trim()}
                >
                  {loading ? 'שולח...' : 'שלח קישור איפוס סיסמה'}
                </AuthButton>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setShowPasswordReset(false);
                setPasswordResetSent(false);
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
              ← חזרה לכניסה
            </button>
          </form>
        ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isSignUp && (
            <>
              {isTestAccount ? (
                <div>
                  <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>
                    בחר חבילה לבדיקה
                  </label>
                  <PackageSelect
                    value={testPackageTier}
                    onChange={(e) => setTestPackageTier(e.target.value as SubscriptionTier)}
                  >
                    <option value="free">חבילת ניסיון (חינם)</option>
                    <option value="creator">חבילת יוצרים</option>
                    <option value="pro">חבילת יוצרים באקסטרים</option>
                    <option value="coach">חבילת מאמנים, סוכנויות ובתי ספר למשחק</option>
                  </PackageSelect>
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
                    שם מלא (פרטי ומשפחה) *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="לדוגמה: יוסי כהן"
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

          {/* Package selection for new users */}
          {isSignUp && !isTestAccount && (
            <>
              <div>
                <label
                  style={{
                    color: '#D4A043',
                    fontSize: '0.9rem',
                    textAlign: 'right',
                    display: 'block',
                    marginBottom: '5px',
                  }}
                >
                  בחירת חבילה התחלתית *
                </label>
                <PackageSelect
                  value={selectedTier}
                  onChange={(e) => {
                    const tier = e.target.value as SubscriptionTier;
                    setSelectedTier(tier);
                    // Reset track if switching to tier שלא דורש בחירת תחום
                    if (tier !== 'free' && tier !== 'creator') {
                      setSelectedTrack('');
                    }
                  }}
                >
                  <option value="free">ניסיון (חינם)</option>
                  <option value="creator">יוצרים</option>
                  <option value="pro">יוצרים באקסטרים</option>
                  <option value="coach">מאמנים, סוכנויות ובתי ספר למשחק</option>
                  <option value="coach-pro">מאמנים פרו</option>
                </PackageSelect>
                <div style={{ fontSize: '0.75rem', color: '#888', textAlign: 'right', marginTop: '5px' }}>
                  שדרוג לחבילות בתשלום יתבצע לאחר ההרשמה בעזרת תשלום מאובטח.
                </div>
              </div>

              {(selectedTier === 'free' || selectedTier === 'creator') && (
                <div>
                  <label
                    style={{
                      color: '#D4A043',
                      fontSize: '0.9rem',
                      textAlign: 'right',
                      display: 'block',
                      marginBottom: '5px',
                    }}
                  >
                    בחר תחום ניתוח התחלתי *
                  </label>
                  <PackageSelect
                    value={selectedTrack || ''}
                    onChange={(e) => setSelectedTrack(e.target.value as TrackId)}
                  >
                    <option value="">-- בחר תחום ניתוח --</option>
                    <option value="actors">שחקנים ואודישנים</option>
                    <option value="musicians">זמרים ומוזיקאים</option>
                    <option value="creators">יוצרי תוכן וכוכבי רשת</option>
                    <option value="influencers">משפיענים ומותגים</option>
                  </PackageSelect>
                </div>
              )}

              <div
                style={{
                  background: 'rgba(212, 160, 67, 0.05)',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid rgba(212, 160, 67, 0.2)',
                  marginTop: '10px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#D4A043',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    marginBottom: '8px',
                  }}
                >
                  <span>🎫 קוד קופון (אופציונלי)</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#ccc' }}>
                    <input
                      type="checkbox"
                      checked={showCouponField}
                      onChange={(e) => {
                        setShowCouponField(e.target.checked);
                        if (!e.target.checked) {
                          setCouponCode('');
                          setCouponValid(null);
                        }
                      }}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    הפעל שדה קופון
                  </span>
                </label>

                {showCouponField && (
                  <>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          const code = e.target.value.toUpperCase().trim();
                          setCouponCode(code);
                          if (code.length >= 3) {
                            handleCouponValidation(code);
                          } else {
                            setCouponValid(null);
                          }
                        }}
                        placeholder="הכנס קוד קופון"
                        style={{
                          flex: 1,
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: `2px solid ${
                            couponValid?.valid
                              ? 'rgba(76, 175, 80, 0.6)'
                              : couponValid?.valid === false
                              ? 'rgba(244, 67, 54, 0.6)'
                              : 'rgba(212, 160, 67, 0.4)'
                          }`,
                          borderRadius: '8px',
                          padding: '12px',
                          color: '#fff',
                          fontSize: '1rem',
                          direction: 'ltr',
                          textAlign: 'center',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                        }}
                      />
                      {couponValidating && (
                        <span style={{ color: '#D4A043', fontSize: '0.9rem', lineHeight: '44px', fontWeight: 600 }}>
                          בודק...
                        </span>
                      )}
                    </div>
                    {couponValid?.valid && (
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '10px',
                          background: 'rgba(76, 175, 80, 0.2)',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          color: '#4CAF50',
                          textAlign: 'right',
                          border: '1px solid rgba(76, 175, 80, 0.3)',
                        }}
                      >
                        ✓ קוד קופון תקין{couponValid.coupon?.description ? `: ${couponValid.coupon.description}` : ''}
                        {(couponValid.coupon?.discount_type === 'percentage' || couponValid.coupon?.discount_type === 'fixed_amount') && (
                          <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'rgba(76, 175, 80, 0.95)' }}>
                            ההנחה תחול על התשלום הראשון בחבילה.
                          </div>
                        )}
                      </div>
                    )}
                    {couponValid?.valid === false && (
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '10px',
                          background: 'rgba(244, 67, 54, 0.2)',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          color: '#F44336',
                          textAlign: 'right',
                          border: '1px solid rgba(244, 67, 54, 0.3)',
                        }}
                      >
                        ✗ {couponValid.error || 'קוד קופון לא תקין'}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {error && (
            <div style={{ color: '#ff6b6b', textAlign: 'right', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <AuthButton
            type="submit"
            disabled={loading}
            onClick={(e) => {
              // Prevent double submission if form is already submitting
              if (loading) {
                e.preventDefault();
                return;
              }
            }}
          >
            {loading ? (isSignUp ? 'נרשם...' : 'מתחבר...') : (isSignUp ? 'הרשמה' : 'כניסה')}
          </AuthButton>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
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
            {!isSignUp && (
              <button
                type="button"
                onClick={() => {
                  setShowPasswordReset(true);
                  setError(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  textDecoration: 'underline',
                }}
              >
                שכחתי את הסיסמה
              </button>
            )}
          </div>
        </form>
        )}
      </AuthModalContent>
    </AuthModalOverlay>
  );
};

