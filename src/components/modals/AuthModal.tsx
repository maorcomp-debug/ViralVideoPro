import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { supabase } from '../../lib/supabase';
import { fadeIn } from '../../styles/globalStyles';
import { validateCoupon, redeemCoupon, updateCurrentUserProfile } from '../../lib/supabase-helpers';
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
  text-align: center;
  text-align-last: center;
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
    text-align: center;
    font-weight: 600;
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

export type AuthModalMode = 'initial' | 'upgrade';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
  /** הרשמה ראשונית (אימייל+סיסמה+תחום בלבד) או טופס שדרוג (שם+טלפון+חבילה+תחום ליוצרים) */
  mode?: AuthModalMode;
  /** בעת שדרוג – חבילה שנבחרה (creator, pro, coach, coach-pro); משמש גם מ־?redeem= */
  initialPackageForUpgrade?: string | null;
  /** משתמש מחובר – נדרש במצב שדרוג לעדכון פרופיל */
  currentUser?: { id: string; email?: string } | null;
  /** כשנפתח מהקישור "מימוש ההטבה" במייל – מציג הרשמה עם שדה קופון מופעל וממולא */
  initialRedeemCode?: string | null;
  /** @deprecated use initialPackageForUpgrade for upgrade; still used for redeem package from URL */
  initialPackage?: string | null;
  /** לאחר שליחת טופס שדרוג – לפתוח תשלום וכו' */
  onUpgradeComplete?: (tier: SubscriptionTier) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  mode: modeProp,
  initialPackageForUpgrade,
  currentUser,
  initialRedeemCode,
  initialPackage,
  onUpgradeComplete,
}) => {
  const { t, i18n } = useTranslation();
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
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('creator');
  const [selectedTrack, setSelectedTrack] = useState<TrackId | ''>('');

  const mode: AuthModalMode = modeProp ?? 'initial';
  const isUpgradeMode = mode === 'upgrade';

  const isTestAccount = email.trim().toLowerCase() === TEST_ACCOUNT_EMAIL.toLowerCase();
  const tierRequiresTrack = (tier: SubscriptionTier) => tier === 'free' || tier === 'creator';

  // When opened in upgrade mode: pre-select package and ensure only upgrade form shows (no registration fields)
  React.useEffect(() => {
    if (!isOpen) return;
    if (isUpgradeMode) {
      setIsSignUp(false); // prevent registration block from showing
      if (initialPackageForUpgrade && ['creator', 'pro', 'coach', 'coach-pro'].includes(initialPackageForUpgrade)) {
        setSelectedTier(initialPackageForUpgrade as SubscriptionTier);
      }
    }
  }, [isOpen, isUpgradeMode, initialPackageForUpgrade]);

  // When opened from "Redeem Offer" link (?redeem=CODE), switch to registration with coupon field on and pre-filled
  React.useEffect(() => {
    if (!isOpen || isUpgradeMode) return;
    if (initialRedeemCode?.trim()) {
      const code = initialRedeemCode.trim().toUpperCase();
      setIsSignUp(true);
      setShowCouponField(true);
      setCouponCode(code);
      setCouponValid(null);
      validateCoupon(code).then((validation) => setCouponValid(validation)).catch(() => setCouponValid({ valid: false, error: t('authErrors.couponValidationError') }));
    }
    const pkg = initialPackageForUpgrade ?? initialPackage;
    if (pkg && ['creator', 'pro', 'coach', 'coach-pro'].includes(pkg)) {
      setSelectedTier(pkg as SubscriptionTier);
    }
  }, [isOpen, isUpgradeMode, initialRedeemCode, initialPackage, initialPackageForUpgrade]);

  // When coupon is validated and has trial_tier, pre-select that package if still on free (e.g. link had no package=)
  React.useEffect(() => {
    if (!isOpen || !isSignUp) return;
    if (couponValid?.valid && couponValid.coupon?.trial_tier && selectedTier === 'free') {
      const tier = couponValid.coupon.trial_tier;
      if (['creator', 'pro', 'coach'].includes(tier)) {
        setSelectedTier(tier as SubscriptionTier);
      }
    }
  }, [isOpen, isSignUp, couponValid?.valid, couponValid?.coupon?.trial_tier, selectedTier]);

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
      setCouponValid({ valid: false, error: t('authErrors.couponValidationError') });
    } finally {
      setCouponValidating(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError(t('authErrors.enterEmail'));
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
        throw new Error(t('authErrors.resetSendError'));
      }

      setPasswordResetSent(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || t('authErrors.genericError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      if (isUpgradeMode) {
        const trimmedFullName = fullName.trim();
        const nameWords = trimmedFullName.split(/\s+/).filter(word => word.length > 0);
        if (!trimmedFullName || trimmedFullName.length < 3) {
          setError(t('authErrors.fullNameRequired'));
          setLoading(false);
          return;
        }
        if (nameWords.length < 2) {
          setError(t('authErrors.fullNameBothRequired'));
          setLoading(false);
          return;
        }
        const cleanPhone = phone.trim().replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length < 9) {
          setError(t('authErrors.phoneInvalid'));
          setLoading(false);
          return;
        }
        // בשדרוג ליוצרים – התחום כבר נבחר בחינם; תחום נוסף ייבחר בהגדרות
        if (!currentUser?.id) {
          setError(t('authErrors.loginRequired'));
          setLoading(false);
          return;
        }
        // RULE: Do NOT update subscription_tier or subscription_status here – only after successful payment (callback).
        // Update only name and phone for the payment step; the package stays free until payment is confirmed.
        const upgradeTimeoutMs = 15000;
        try {
          await Promise.race([
            updateCurrentUserProfile(
              {
                full_name: trimmedFullName,
                phone: cleanPhone,
                // Do not set subscription_tier / subscription_status – only callback after payment may upgrade.
              },
              currentUser.id
            ),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('UPGRADE_TIMEOUT')), upgradeTimeoutMs)
            ),
          ]);
        } catch (err: any) {
          if (err?.message === 'UPGRADE_TIMEOUT') {
            setError(t('authErrors.upgradeTimeout'));
          } else {
            setError(err?.message || t('authErrors.genericError'));
          }
          setLoading(false);
          return;
        }
        onUpgradeComplete?.(selectedTier);
        onAuthSuccess();
        onClose();
        setLoading(false);
        return;
      }

      if (isSignUp) {
          if (mode === 'initial') {
            if (!selectedTrack) {
              setError(t('authErrors.selectTrackRequired'));
              setLoading(false);
              return;
            }
          } else {
            const trimmedFullName = fullName.trim();
            const nameWords = trimmedFullName.split(/\s+/).filter(word => word.length > 0);
            if (!trimmedFullName || trimmedFullName.length < 3) {
              setError(t('authErrors.fullNameRequired'));
              setLoading(false);
              return;
            }
            if (nameWords.length < 2) {
              setError(t('authErrors.fullNameBothRequired'));
              setLoading(false);
              return;
            }
            const cleanPhone = phone.trim().replace(/\D/g, '');
            if (!cleanPhone || cleanPhone.length < 9) {
              setError(t('authErrors.phoneInvalid'));
              setLoading(false);
              return;
            }
            if (tierRequiresTrack(selectedTier) && !selectedTrack) {
              setError(t('authErrors.selectTrackRequired'));
              setLoading(false);
              return;
            }
          }

        // Removed emailExists/phoneExists checks - Supabase handles duplicate validation automatically
        // This speeds up registration significantly

        const currentLang = (i18n.language || i18n.resolvedLanguage || 'en').split('-')[0] as 'en' | 'he';
        const preferredLang = currentLang === 'he' ? 'he' : 'en';
        const baseRedirect = window.location.origin;
        const redirectUrl = preferredLang === 'en' ? `${baseRedirect}?lang=en` : baseRedirect;
        const effectiveTier = mode === 'initial' ? 'free' : selectedTier;
        const effectiveTrack = selectedTrack || undefined;
        const cleanPhoneForSignUp = mode === 'initial' ? '' : phone.trim().replace(/\D/g, '');
        let displayName = mode === 'initial' ? (email.trim() || 'משתמש') : fullName.trim();
        if (isTestAccount) displayName = `חבילת ${SUBSCRIPTION_PLANS[testPackageTier].name}`;

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: displayName,
              phone: cleanPhoneForSignUp,
              test_package_tier: isTestAccount ? testPackageTier : undefined,
              signup_tier: effectiveTier,
              signup_primary_track: effectiveTrack,
              preferred_language: preferredLang,
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
              setError(t('authErrors.userExists'));
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
              errorMessage = t('authErrors.userAlreadyRegistered');
            } else if (signUpError.message.includes('Invalid API key') || 
                       signUpError.message.includes('JWT') ||
                       signUpError.message.includes('api')) {
              errorMessage = t('authErrors.invalidApiKey');
            } else {
              errorMessage = t('authErrors.authError401');
            }
          } else if (signUpError.message.includes('Invalid API key') || signUpError.message.includes('JWT')) {
            errorMessage = t('authErrors.invalidApiKey');
          } else if (signUpError.message.includes('User already registered') || 
                     signUpError.message.includes('already exists')) {
            errorMessage = t('authErrors.userAlreadyRegistered');
          } else if (signUpError.message.includes('Password') || signUpError.message.includes('password')) {
            errorMessage = t('authErrors.weakPassword');
          } else if (signUpError.message.includes('email') || signUpError.message.includes('Email')) {
            errorMessage = t('authErrors.invalidEmail');
          } else if (signUpError.message.includes('rate limit') || signUpError.message.includes('too many')) {
            errorMessage = t('authErrors.rateLimit');
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

          // מקור יחיד למייל אימות: Supabase. הפעלה/כיבוי אימות מייל רק ב-Dashboard (Authentication → Providers → Email).
          const session = data.session;
          const needsEmailConfirmation = !session && !data.user.email_confirmed_at;
          if (needsEmailConfirmation) {
            setLoading(false);
            alert(t('authErrors.signupSuccess'));
            onClose();
            return;
          }

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
            // Give trigger 50ms to create profile with metadata (reduced for faster registration)
            // DO NOT remove this delay - it's needed for trigger to complete
            await new Promise(resolve => setTimeout(resolve, 50));
            console.log('✅ Profile created by trigger with metadata:', {
              tier: effectiveTier,
              track: effectiveTrack,
            });
          }

          // כאן יש session (כי אם היה דורש אימות מייל – כבר יצאנו למעלה)
          let finalSession = data.session;
          if (!finalSession && data.user?.email_confirmed_at) {
            try {
              const { data: signInData } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
              });
              if (signInData?.session) finalSession = signInData.session;
            } catch (_) {}
          }
          
          // Complete registration immediately - don't wait for background tasks
          if (finalSession) {
            console.log('✅ Registration completed. User logged in with selected package:', effectiveTier);
            onAuthSuccess();
            onClose();
            setLoading(false);
          }

          // Handle test accounts and coupons in background (non-blocking)
          if (data.user.id) {
            // Test account update - background
            if (isTestAccount) {
              supabase
                .from('profiles')
                .update({ subscription_tier: testPackageTier })
                .eq('user_id', data.user.id)
                .then(({ error }) => {
                  if (error) {
                    console.error('Error updating test account subscription tier:', error);
                  } else {
                    console.log(`✅ Test account subscription tier set to: ${testPackageTier}`);
                  }
                })
                .catch((err) => console.error('Error updating test account profile:', err));
            }

            // Apply coupon in background - don't block registration
            if (couponCode.trim() && couponValid?.valid) {
              redeemCoupon(couponCode.trim(), data.user.id)
                .then(() => console.log('✅ Coupon redeemed successfully'))
                .catch((couponError: any) => {
                  console.error('Error redeeming coupon:', couponError);
                  // Show notification but don't block - user is already registered
                  setTimeout(() => {
                    alert(t('authErrors.couponError', { error: couponError.message }));
                  }, 1000);
                });
            }
          }
        } else {
          console.error('❌ User creation failed - no user data returned');
          throw new Error(t('authErrors.createUserFailed'));
        }
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          let errorMessage: string;
          const isInvalidCredentials =
            signInError.status === 400 ||
            signInError.status === 401 ||
            (signInError.message && (
              signInError.message.includes('Invalid login credentials') ||
              signInError.message.toLowerCase().includes('invalid')
            ));

          if (isInvalidCredentials) {
            errorMessage = t('authErrors.signInRequired');
          } else if (signInError.message?.includes('Email not confirmed')) {
            errorMessage = t('authErrors.emailNotConfirmed');
          } else if (signInError.message?.includes('email')) {
            errorMessage = t('authErrors.invalidEmail');
          } else {
            errorMessage = t('authErrors.genericError');
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
      const msg = err?.message || t('authErrors.genericError');
      if (msg !== t('authErrors.signInRequired')) {
        console.error('Auth error:', err);
      }
      setError(msg);
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
          <h2>
            {showPasswordReset ? t('auth.passwordReset') : isUpgradeMode ? t('auth.upgrade') : (isSignUp ? t('auth.signup') : t('auth.login'))}
          </h2>
          <p>
            {showPasswordReset 
              ? t('auth.passwordResetTitle')
              : isUpgradeMode 
                ? t('auth.upgradeTitle')
                : (isSignUp ? t('auth.signupTitle') : t('auth.loginTitle'))
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
                  {t('auth.resetEmailSent')} <strong>{email}</strong>
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc' }}>
                  {t('auth.checkInbox')}
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t('auth.emailPlaceholder')}
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
                  {loading ? t('auth.sending') : t('auth.sendResetLink')}
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
              {t('auth.backToLogin')}
            </button>
          </form>
        ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isUpgradeMode && (
            <>
              <div>
                <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>
                  {t('auth.fullName')}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder={t('auth.fullNamePlaceholder')}
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
              <div>
                <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>
                  {t('auth.phone')}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('auth.phonePlaceholder')}
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
                  {t('auth.phoneHint')}
                </div>
              </div>
              <div>
                <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>
                  {t('auth.selectPackage')}
                </label>
                <PackageSelect
                  value={selectedTier}
                  onChange={(e) => {
                    const tier = e.target.value as SubscriptionTier;
                    setSelectedTier(tier);
                    if (tier !== 'creator') setSelectedTrack('');
                  }}
                >
                  <option value="creator">{t('plan.creator')}</option>
                  <option value="pro">{t('plan.pro')}</option>
                  <option value="coach">{t('plan.coach')}</option>
                  <option value="coach-pro">{t('plan.coachPro')}</option>
                </PackageSelect>
              </div>
              {/* בשדרוג לחבילת יוצרים לא מציגים בחירת תחום – התחום כבר נבחר בחינם; תחום נוסף ייבחר בהגדרות */}
            </>
          )}

          {isSignUp && !isUpgradeMode && (
            <>
              {mode === 'initial' ? (
                <>
                  <div>
                    <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>{t('auth.email')} *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                  </div>
                  <div>
                    <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>{t('auth.password')} *</label>
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
                  <div>
                    <label
                      style={{
                        color: '#D4A043',
                        fontSize: '0.95rem',
                        textAlign: 'right',
                        display: 'block',
                        marginBottom: '5px',
                        fontWeight: 700,
                        letterSpacing: '0.03em',
                        textShadow: '0 0 10px rgba(212, 160, 67, 0.6)',
                      }}
                    >
                      {t('auth.selectTrack')}
                    </label>
                    <PackageSelect
                      value={selectedTrack || ''}
                      onChange={(e) => setSelectedTrack(e.target.value as TrackId)}
                      style={{ color: '#D4A043', fontWeight: 600, textAlign: 'center' }}
                    >
                      <option value="">{t('auth.selectTrackPlaceholder')}</option>
                      <option value="actors">{t('track.actors')}</option>
                      <option value="musicians">{t('track.musicians')}</option>
                      <option value="creators">{t('track.creators')}</option>
                      <option value="influencers">{t('track.influencers')}</option>
                    </PackageSelect>
                  </div>
                  {initialRedeemCode?.trim() && (
                    <div style={{ background: 'rgba(212, 160, 67, 0.05)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(212, 160, 67, 0.2)' }}>
                      <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>{t('auth.couponCode')}</label>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase().trim()); if (e.target.value.trim().length >= 3) handleCouponValidation(e.target.value.trim()); }}
                        placeholder={t('auth.couponPlaceholder')}
                        style={{
                          width: '100%',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(212, 160, 67, 0.3)',
                          borderRadius: '8px',
                          padding: '12px',
                          color: '#fff',
                          fontSize: '1rem',
                          direction: 'ltr',
                          textAlign: 'center',
                        }}
                      />
                      {couponValid?.valid && <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#4CAF50' }}>{t('auth.couponValid')}</div>}
                    </div>
                  )}
                </>
              ) : isTestAccount ? (
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
              {/* טלפון ובחירת חבילה רק בהרשמה מלאה (לא במצב initial) */}
              {mode !== 'initial' && (
                <div>
                  <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>
                    {t('auth.phone')} <span style={{ color: '#ff6b6b' }}>*</span>
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
              )}
            </>
          )}

          {!isUpgradeMode && (!isSignUp || mode !== 'initial') && (
            <>
              <div>
                <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>{t('auth.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (e.target.value.trim().toLowerCase() !== TEST_ACCOUNT_EMAIL.toLowerCase()) setTestPackageTier('free');
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
                  <div style={{ marginTop: '5px', fontSize: '0.85rem', color: '#D4A043', textAlign: 'right', fontStyle: 'italic' }}>
                    📧 מייל בדיקות - ניתן לרישום מרובה עם חבילות שונות
                  </div>
                )}
              </div>
              <div>
                <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>{t('auth.password')}</label>
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
            </>
          )}

          {/* Package selection for new users (legacy / redeem only) – never in upgrade mode */}
          {isSignUp && !isTestAccount && mode !== 'initial' && !isUpgradeMode && (
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
                  {t('auth.selectPackageUpgrade')}
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
                  <option value="free">{t('plan.free')} ({t('plan.badgeFree')})</option>
                  <option value="creator">{t('plan.creator')}</option>
                  <option value="pro">{t('plan.pro')}</option>
                  <option value="coach">{t('plan.coach')}</option>
                  <option value="coach-pro">{t('plan.coachPro')}</option>
                </PackageSelect>
                <div style={{ fontSize: '0.75rem', color: '#888', textAlign: 'right', marginTop: '5px' }}>
                  {t('auth.upgradeAfterSignup', { defaultValue: 'שדרוג לחבילות בתשלום יתבצע לאחר ההרשמה בעזרת תשלום מאובטח.' })}
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
                    {t('auth.selectTrackInitial')}
                  </label>
                  <PackageSelect
                    value={selectedTrack || ''}
                    onChange={(e) => setSelectedTrack(e.target.value as TrackId)}
                  >
                    <option value="">-- {t('auth.selectTrackPlaceholder')} --</option>
                    <option value="actors">{t('track.actors')}</option>
                    <option value="musicians">{t('track.musicians')}</option>
                    <option value="creators">{t('track.creators')}</option>
                    <option value="influencers">{t('track.influencers')}</option>
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
                  <span>🎫 {t('auth.couponCode')}</span>
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
                        placeholder={t('auth.couponPlaceholder')}
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
                          padding: '12px',
                          background: 'rgba(76, 175, 80, 0.25)',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          color: '#4CAF50',
                          textAlign: 'right',
                          border: '1px solid rgba(76, 175, 80, 0.4)',
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                          ✓ קוד קופון תקין ותקף לחודש הראשון של ההרשמה
                        </div>
                        {couponValid.coupon?.description && (
                          <div style={{ fontSize: '0.85rem', opacity: 0.95 }}>
                            {couponValid.coupon.description}
                          </div>
                        )}
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
              if (loading) { e.preventDefault(); return; }
            }}
          >
            {loading
              ? t('auth.processing')
              : (isUpgradeMode ? t('auth.upgrade') : (isSignUp ? t('auth.signup') : t('auth.login')))}
          </AuthButton>

          {!isUpgradeMode && (
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
              {isSignUp ? t('auth.haveAccount') : t('auth.noAccount')}
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
                {t('auth.forgotPassword')}
              </button>
            )}
          </div>
          )}
        </form>
        )}
      </AuthModalContent>
    </AuthModalOverlay>
  );
};

