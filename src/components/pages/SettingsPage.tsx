import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { updateCurrentUserProfile, getUserAnnouncements, markAnnouncementAsRead, redeemCoupon } from '../../lib/supabase-helpers';
import { TrackSelectionModal } from '../modals/TrackSelectionModal';
import type { User } from '@supabase/supabase-js';
import type { UserSubscription, SubscriptionTier, TrackId } from '../../types';
import { SUBSCRIPTION_PLANS } from '../../constants';
import { AppContainer, Header } from '../../styles/components';

interface SettingsPageProps {
  user: User | null;
  profile: any;
  subscription: UserSubscription | null;
  usage: { analysesUsed: number; minutesUsed: number; periodStart: Date; periodEnd: Date } | null;
  onProfileUpdate: () => void;
  onOpenSubscriptionModal: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  profile,
  subscription,
  usage,
  onProfileUpdate,
  onOpenSubscriptionModal
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Load active tab from sessionStorage to preserve it after refresh
  const getInitialTab = (): 'profile' | 'password' | 'subscription' | 'updates' => {
    if (typeof window !== 'undefined') {
      const savedTab = sessionStorage.getItem('settings_active_tab');
      if (savedTab && ['profile', 'password', 'subscription', 'updates'].includes(savedTab)) {
        return savedTab as 'profile' | 'password' | 'subscription' | 'updates';
      }
    }
    return 'profile';
  };
  
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'subscription' | 'updates'>(getInitialTab());
  
  // Save active tab to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('settings_active_tab', activeTab);
    }
  }, [activeTab]);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [receiveUpdates, setReceiveUpdates] = useState(profile?.receive_updates ?? true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [redeemingCode, setRedeemingCode] = useState<string | null>(null);
  const [showTrackSelectionModal, setShowTrackSelectionModal] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile?.full_name || '',
      });
      setReceiveUpdates(profile?.receive_updates ?? true);
    }
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'updates' && user) {
      loadAnnouncements();
    } else {
      // Reset announcements when leaving the tab
      setAnnouncements([]);
    }
  }, [activeTab, user]);
  
  // Load receive_updates from profile when it changes
  useEffect(() => {
    if (profile) {
      setReceiveUpdates(profile.receive_updates ?? true);
    }
  }, [profile?.receive_updates]);
  
  // Load usage when switching to subscription tab or when tab is already subscription
  // Also load on mount if already on subscription tab (after refresh)
  // REMOVED: This was causing duplicate updates - usage_updated event already handles this
  // useEffect(() => {
  //   if (activeTab === 'subscription' && user) {
  //     const timer = setTimeout(() => {
  //       onProfileUpdate();
  //     }, 100);
  //     return () => clearTimeout(timer);
  //   }
  // }, [activeTab, user, onProfileUpdate]);

  // Listen for analysis saved events to refresh usage
  useEffect(() => {
    const handleUsageUpdated = async () => {
      // Listen for direct usage update events - this is the primary way to update
      // Shorter delay since usage is already updated in parent component
      if (user) {
        await new Promise(resolve => setTimeout(resolve, 300));
        onProfileUpdate();
      }
    };
    
    // Listen to both storage events (cross-tab) and custom events (same-tab)
    // Use only usage_updated event to avoid duplicate updates
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === 'analysis_saved' || e.key === 'usage_updated') {
        handleUsageUpdated();
      }
    });
    window.addEventListener('analysis_saved', handleUsageUpdated);
    window.addEventListener('usage_updated', handleUsageUpdated);
    return () => {
      window.removeEventListener('storage', handleUsageUpdated as any);
      window.removeEventListener('analysis_saved', handleUsageUpdated);
      window.removeEventListener('usage_updated', handleUsageUpdated);
    };
  }, [onProfileUpdate, user]);

  const loadAnnouncements = async () => {
    if (!user) {
      setAnnouncements([]);
      return;
    }
    
    try {
      const userAnnouncements = await getUserAnnouncements();
      
      // Only show announcements that were actually sent (have sent_at date)
      // Also filter out any null/undefined announcements
      const sentAnnouncements = (userAnnouncements || []).filter((item: any) => {
        if (!item || !item.announcement) return false;
        const ann = item.announcement;
        return ann.sent_at !== null && ann.sent_at !== undefined;
      });
      
      setAnnouncements(sentAnnouncements);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setAnnouncements([]);
    }
  };

  const handleToggleUpdates = async () => {
    if (loading) return; // Prevent double-click
    
    const newValue = !receiveUpdates;
    setReceiveUpdates(newValue);
    setLoading(true);
    try {
      await updateCurrentUserProfile({ receive_updates: newValue });
      setMessage({ type: 'success', text: newValue ? 'תקבל עדכונים בהצלחה' : 'בוטלה קבלת עדכונים' });
      onProfileUpdate();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setReceiveUpdates(!newValue); // Revert on error
      setMessage({ type: 'error', text: error.message || 'שגיאה בעדכון ההגדרות' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (announcementId: string) => {
    try {
      await markAnnouncementAsRead(announcementId);
      loadAnnouncements();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  /** Extract coupon code from benefit announcement message (קוד הטבה לשימוש: XXX) */
  const getCouponCodeFromMessage = (message: string | null): string | null => {
    if (!message) return null;
    const prefix = 'קוד הטבה לשימוש:';
    const i = message.indexOf(prefix);
    if (i === -1) return null;
    const rest = message.slice(i + prefix.length).split('\n')[0].trim();
    return rest || null;
  };

  const handleRedeemBenefit = async (item: any) => {
    const ann = item?.announcement;
    const code = getCouponCodeFromMessage(ann?.message);
    if (!code || !user?.id) {
      setMessage({ type: 'error', text: 'לא נמצא קוד הטבה בהודעה' });
      return;
    }
    if (redeemingCode) return;
    setRedeemingCode(code);
    setMessage(null);
    try {
      await redeemCoupon(code, user.id);
      setMessage({ type: 'success', text: 'ההטבה מומשה בהצלחה' });
      if (ann?.id) await markAnnouncementAsRead(ann.id);
      loadAnnouncements();
      onProfileUpdate();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'לא ניתן לממש את ההטבה' });
    } finally {
      setRedeemingCode(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await updateCurrentUserProfile({
        full_name: formData.full_name.trim(),
      });
      setMessage({ type: 'success', text: 'הפרופיל עודכן בהצלחה' });
      onProfileUpdate();
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'שגיאה בעדכון הפרופיל' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'הסיסמאות אינן תואמות' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'הסיסמה חייבת להכיל לפחות 6 תווים' });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'הסיסמה עודכנה בהצלחה' });
      setPasswordData({
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error updating password:', error);
      setMessage({ type: 'error', text: error.message || 'שגיאה בעדכון הסיסמה' });
    } finally {
      setLoading(false);
    }
  };

  const getTierDisplayName = (tier: string) => {
    if (tier === 'coach-pro') {
      return 'מאמנים, סוכנויות ובתי ספר למשחק גרסת פרו';
    }
    return SUBSCRIPTION_PLANS[tier as SubscriptionTier]?.name || tier;
  };

  const getMaxAnalyses = () => {
    const tier = subscription?.tier || profile?.subscription_tier || 'free';
    return SUBSCRIPTION_PLANS[tier as SubscriptionTier]?.limits.maxAnalysesPerPeriod || 1; // FREE tier = 1 analysis only
  };

  if (!user) {
    return (
      <AppContainer style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column' }}>
        <h1 style={{ color: '#D4A043' }}>הגדרות</h1>
        <p style={{ color: '#ccc' }}>אנא התחבר כדי לגשת להגדרות החשבון שלך.</p>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'rgba(212, 160, 67, 0.2)',
            border: '1px solid #D4A043',
            color: '#D4A043',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginTop: '20px'
          }}
        >
          חזרה לדף הבית
        </button>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '20px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(212, 160, 67, 0.2)',
              border: '1px solid #D4A043',
              color: '#D4A043',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            ← חזרה
          </button>
          <h1 style={{ color: '#D4A043', margin: 0, fontSize: '2rem' }}>⚙️ הגדרות</h1>
          <div style={{ width: '100px' }}></div>
        </div>
      </Header>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', color: '#fff' }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              background: activeTab === 'profile' ? 'rgba(212, 160, 67, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '2px solid #D4A043' : '2px solid transparent',
              color: activeTab === 'profile' ? '#D4A043' : '#ccc',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'profile' ? 700 : 400,
              transition: 'all 0.3s',
            }}
          >
            פרטים אישיים
          </button>
          <button
            onClick={() => setActiveTab('password')}
            style={{
              background: activeTab === 'password' ? 'rgba(212, 160, 67, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'password' ? '2px solid #D4A043' : '2px solid transparent',
              color: activeTab === 'password' ? '#D4A043' : '#ccc',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'password' ? 700 : 400,
              transition: 'all 0.3s',
            }}
          >
            שינוי סיסמה
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            style={{
              background: activeTab === 'subscription' ? 'rgba(212, 160, 67, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'subscription' ? '2px solid #D4A043' : '2px solid transparent',
              color: activeTab === 'subscription' ? '#D4A043' : '#ccc',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'subscription' ? 700 : 400,
              transition: 'all 0.3s',
            }}
          >
            מנוי
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            style={{
              background: activeTab === 'updates' ? 'rgba(212, 160, 67, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'updates' ? '2px solid #D4A043' : '2px solid transparent',
              color: activeTab === 'updates' ? '#D4A043' : '#ccc',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'updates' ? 700 : 400,
              transition: 'all 0.3s',
            }}
          >
            עדכונים
          </button>
        </div>

        {message && (
          <div style={{
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '8px',
            background: message.type === 'success' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
            border: `1px solid ${message.type === 'success' ? '#4CAF50' : '#F44336'}`,
            color: message.type === 'success' ? '#4CAF50' : '#F44336',
          }}>
            {message.text}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>
                אימייל
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#888',
                  fontSize: '1rem',
                  cursor: 'not-allowed',
                }}
              />
            </div>
            <div>
              <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>
                שם מלא
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="הכנס שם מלא"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? 'rgba(212, 160, 67, 0.5)' : 'linear-gradient(135deg, #D4A043 0%, #F5C842 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {loading ? 'שומר...' : 'שמור שינויים'}
            </button>
          </form>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>
                סיסמה חדשה
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="הכנס סיסמה חדשה"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                }}
              />
            </div>
            <div>
              <label style={{ color: '#D4A043', fontSize: '0.9rem', textAlign: 'right', display: 'block', marginBottom: '5px' }}>
                אשר סיסמה חדשה
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="אשר סיסמה חדשה"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? 'rgba(212, 160, 67, 0.5)' : 'linear-gradient(135deg, #D4A043 0%, #F5C842 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {loading ? 'מעדכן...' : 'עדכן סיסמה'}
            </button>
          </form>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div>
            <div style={{
              padding: '20px',
              background: 'rgba(212, 160, 67, 0.1)',
              border: '1px solid #D4A043',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'right',
            }}>
              <h3 style={{ color: '#D4A043', margin: '0 0 10px 0' }}>סטטוס מנוי נוכחי</h3>
              <div style={{ margin: '5px 0', color: '#ccc', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <p style={{ margin: 0 }}>
                  **חבילה:** {subscription ? getTierDisplayName(subscription.tier) : getTierDisplayName(profile?.subscription_tier || 'free')}
                </p>
                {/* Important message removed - auto logout already handles profile refresh */}
              </div>
              <p style={{ margin: '5px 0', color: '#ccc' }}>
                **סטטוס:** {subscription?.isActive ? 'פעיל' : 'לא פעיל'}
              </p>
              {subscription?.tier !== 'free' && (
                <>
                  <p style={{ margin: '5px 0', color: '#ccc' }}>
                    **תקופת חיוב:** {subscription?.billingPeriod === 'monthly' ? 'חודשי' : 'שנתי'}
                  </p>
                  <p style={{ margin: '5px 0', color: '#ccc' }}>
                    **תאריך סיום:** {subscription?.endDate ? (subscription.endDate instanceof Date ? subscription.endDate.toLocaleDateString('he-IL') : new Date(subscription.endDate).toLocaleDateString('he-IL')) : 'לא ידוע'}
                  </p>
                </>
              )}
              {usage && (() => {
                // If subscription is not loaded yet, show usage without limits
                if (!subscription) {
                  return (
                    <p style={{ margin: '5px 0', color: '#ccc' }}>
                      **ניתוחים שבוצעו החודש:** {usage.analysesUsed}
                    </p>
                  );
                }
                
                const plan = SUBSCRIPTION_PLANS[subscription.tier];
                const maxAnalyses = plan?.limits.maxAnalysesPerPeriod || 0;
                const maxMinutes = plan?.limits.maxVideoMinutesPerPeriod || 0;
                const isCoachTier = subscription.tier === 'coach' || subscription.tier === 'coach-pro';
                
                return (
                  <>
                    {!isCoachTier && maxAnalyses !== -1 && (
                      <p style={{ margin: '5px 0', color: '#ccc' }}>
                        **ניתוחים שבוצעו החודש:** {usage.analysesUsed} מתוך {maxAnalyses}
                      </p>
                    )}
                    {maxMinutes !== -1 && maxMinutes > 0 && (
                      <p style={{ margin: '5px 0', color: '#ccc' }}>
                        **דקות ניתוח שבוצעו החודש:** {usage.minutesUsed || 0} מתוך {maxMinutes}
                      </p>
                    )}
                    {isCoachTier && maxMinutes !== -1 && (
                      <p style={{ margin: '5px 0', color: '#ccc', fontSize: '0.9rem' }}>
                        *כמות ניתוחים: ללא הגבלה (מוגבל בדקות בלבד)
                      </p>
                    )}
                    {profile?.subscription_start_date && new Date(profile.subscription_start_date) > new Date(new Date().getFullYear(), new Date().getMonth(), 1) && (
                      <p style={{ 
                        margin: '10px 0 5px 0', 
                        color: '#D4A043', 
                        fontSize: '0.9rem',
                        fontStyle: 'italic',
                        padding: '8px 12px',
                        background: 'rgba(212, 160, 67, 0.1)',
                        border: '1px solid rgba(212, 160, 67, 0.3)',
                        borderRadius: '6px'
                      }}>
                        ✨ עם השדרוג – נפתחת לך מכסה חדשה בהתאם לחבילה
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
            <button
              onClick={() => {
                navigate('/');
                setTimeout(() => {
                  onOpenSubscriptionModal();
                }, 100);
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #D4A043 0%, #F5C842 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ניהול מנוי / שדרוג
            </button>
          </div>
        )}

        {/* Updates Tab */}
        {activeTab === 'updates' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Show option to add additional track if user has creator tier and only one track */}
            {subscription?.tier === 'creator' && (
              (() => {
                const existing = (profile?.selected_tracks && profile.selected_tracks.length > 0)
                  ? profile.selected_tracks
                  : (profile?.selected_primary_track ? [profile.selected_primary_track] : []);
                return existing.length === 1;
              })()
            ) && (
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(212, 160, 67, 0.2), rgba(212, 160, 67, 0.1))',
                border: '2px solid #D4A043',
                borderRadius: '12px',
                textAlign: 'right',
              }}>
                <h3 style={{ color: '#D4A043', margin: '0 0 10px 0', fontSize: '1.3rem' }}>🎯 בחירת תחום ניתוח נוסף</h3>
                <p style={{ color: '#ccc', margin: '0 0 15px 0', lineHeight: '1.6' }}>
                  כחלק מחבילת יוצרים, תוכל לבחור תחום ניתוח נוסף. זה יאפשר לך לקבל ניתוחים מותאמים גם לתחום השני.
                </p>
                <button
                  onClick={() => setShowTrackSelectionModal(true)}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #D4A043 0%, #F5C842 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 5px 20px rgba(212, 160, 67, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  בחר תחום ניתוח נוסף
                </button>
              </div>
            )}

            <div style={{
              padding: '20px',
              background: 'rgba(212, 160, 67, 0.1)',
              border: '1px solid #D4A043',
              borderRadius: '8px',
              textAlign: 'right',
            }}>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0' }}>הגדרות עדכונים</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#ccc' }}>קבלת עדכונים על חידושים, הטבות ועדכונים באפליקציה</span>
                <button
                  onClick={handleToggleUpdates}
                  disabled={loading}
                  style={{
                    background: receiveUpdates ? '#4CAF50' : '#666',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 20px',
                    color: '#fff',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.3s',
                  }}
                >
                  {receiveUpdates ? 'פעיל' : 'לא פעיל'}
                </button>
              </div>
            </div>

            <div>
              <h3 style={{ color: '#D4A043', margin: '0 0 15px 0', textAlign: 'right' }}>עדכונים שנשלחו</h3>
              {announcements.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  color: '#888',
                }}>
                  אין עדכונים להצגה
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {announcements.map((item: any) => {
                    const ann = item.announcement;
                    const isRead = item.read_at !== null;
                    if (!ann) return null;
                    return (
                      <div
                        key={item.id}
                        onClick={() => !isRead && handleMarkAsRead(ann.id)}
                        style={{
                          padding: '20px',
                          background: isRead ? 'rgba(255, 255, 255, 0.05)' : 'rgba(212, 160, 67, 0.1)',
                          border: `1px solid ${isRead ? 'rgba(255, 255, 255, 0.1)' : '#D4A043'}`,
                          borderRadius: '8px',
                          cursor: !isRead ? 'pointer' : 'default',
                          textAlign: 'right',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <h4 style={{ color: '#D4A043', margin: 0, fontSize: '1.1rem' }}>{ann.title}</h4>
                          {!isRead && (
                            <span style={{
                              background: '#F44336',
                              color: '#fff',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}>
                              חדש
                            </span>
                          )}
                        </div>
                        <p style={{ color: '#ccc', margin: '10px 0', lineHeight: '1.6' }}>{ann.message}</p>
                        {getCouponCodeFromMessage(ann.message) && (
                          <div style={{ marginTop: '12px' }}>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleRedeemBenefit(item); }}
                              disabled={!!redeemingCode}
                              style={{
                                background: '#D4A043',
                                color: '#000',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                cursor: redeemingCode ? 'not-allowed' : 'pointer',
                                fontSize: '0.95rem',
                              }}
                            >
                              {redeemingCode === getCouponCodeFromMessage(ann.message) ? 'מממש...' : 'מימוש הטבה'}
                            </button>
                          </div>
                        )}
                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '10px' }}>
                          {new Date(ann.created_at).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <TrackSelectionModal
        isOpen={showTrackSelectionModal}
        onClose={() => setShowTrackSelectionModal(false)}
        subscriptionTier={subscription?.tier || profile?.subscription_tier || 'creator'}
        existingTracks={(profile?.selected_tracks && profile.selected_tracks.length > 0)
          ? profile.selected_tracks
          : (profile?.selected_primary_track ? [profile.selected_primary_track] : [])
        }
        mode="add"
        onSelect={async (trackIds) => {
          setShowTrackSelectionModal(false);
          setMessage({ type: 'success', text: 'תחום הניתוח נוסף בהצלחה!' });
          setTimeout(() => setMessage(null), 3000);
          Promise.resolve()
            .then(() => updateCurrentUserProfile({ selected_tracks: trackIds }))
            .then(() => onProfileUpdate())
            .catch((error: any) => {
              console.error('Error adding track:', error);
              setMessage({ type: 'error', text: error.message || 'שגיאה בהוספת התחום. נסה שוב.' });
            });
        }}
      />
    </AppContainer>
  );
};

