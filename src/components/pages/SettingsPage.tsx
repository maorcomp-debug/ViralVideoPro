import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { updateCurrentUserProfile } from '../../lib/supabase-helpers';
import type { User } from '@supabase/supabase-js';
import type { UserSubscription, SubscriptionTier } from '../../types';
import { SUBSCRIPTION_PLANS } from '../../constants';
import { AppContainer, Header } from '../../styles/components';

interface SettingsPageProps {
  user: User | null;
  profile: any;
  subscription: UserSubscription | null;
  usage: { analysesUsed: number; periodStart: Date; periodEnd: Date } | null;
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
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'subscription'>('profile');
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile?.full_name || '',
      });
    }
  }, [profile]);

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
    return SUBSCRIPTION_PLANS[tier as SubscriptionTier]?.name || tier;
  };

  const getMaxAnalyses = () => {
    const tier = subscription?.tier || profile?.subscription_tier || 'free';
    return SUBSCRIPTION_PLANS[tier as SubscriptionTier]?.limits.maxAnalysesPerPeriod || 2;
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
              <p style={{ margin: '5px 0', color: '#ccc' }}>
                **חבילה:** {subscription ? getTierDisplayName(subscription.tier) : getTierDisplayName(profile?.subscription_tier || 'free')}
              </p>
              <p style={{ margin: '5px 0', color: '#ccc' }}>
                **סטטוס:** {subscription?.isActive ? 'פעיל' : 'לא פעיל'}
              </p>
              {subscription?.tier !== 'free' && (
                <>
                  <p style={{ margin: '5px 0', color: '#ccc' }}>
                    **תקופת חיוב:** {subscription?.billingPeriod === 'monthly' ? 'חודשי' : 'שנתי'}
                  </p>
                  <p style={{ margin: '5px 0', color: '#ccc' }}>
                    **תאריך סיום:** {subscription?.endDate ? subscription.endDate.toLocaleDateString('he-IL') : 'לא ידוע'}
                  </p>
                </>
              )}
              {usage && (
                <p style={{ margin: '5px 0', color: '#ccc' }}>
                  **ניתוחים שבוצעו החודש:** {usage.analysesUsed} מתוך {getMaxAnalyses() === -1 ? 'ללא הגבלה' : getMaxAnalyses().toString()}
                </p>
              )}
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
      </div>
    </AppContainer>
  );
};

