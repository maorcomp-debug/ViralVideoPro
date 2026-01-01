import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  getAllUsers, 
  updateUserProfile, 
  deleteUser, 
  isAdmin,
  getAllAnalyses,
  getAllVideos,
  getUserAnalyses,
  getUserVideos,
  getUserUsageStats,
  getAdminStats,
  createAnnouncement,
  getAllAnnouncements,
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponRedemptions,
  grantTrialToUsers,
  getAllTrials,
} from '../../lib/supabase-helpers';
import { supabase } from '../../lib/supabase';
import type { SubscriptionTier } from '../../types';
import { SUBSCRIPTION_PLANS } from '../../constants';
import { AppContainer, Header } from '../../styles/components';
import { fadeIn } from '../../styles/globalStyles';

// Styled Components
const AdminContainer = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: 40px 20px;
  color: #fff;
  animation: ${fadeIn} 0.5s ease-out;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 2px solid rgba(212, 160, 67, 0.3);
  flex-wrap: wrap;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? 'rgba(212, 160, 67, 0.2)' : 'transparent'};
  border: none;
  border-bottom: ${props => props.$active ? '3px solid #D4A043' : '3px solid transparent'};
  color: ${props => props.$active ? '#D4A043' : '#999'};
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: ${props => props.$active ? 700 : 400};
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    color: #D4A043;
    background: rgba(212, 160, 67, 0.1);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const StatCard = styled.div<{ $highlight?: boolean }>`
  background: ${props => props.$highlight 
    ? 'linear-gradient(135deg, rgba(212, 160, 67, 0.2), rgba(212, 160, 67, 0.1))' 
    : 'rgba(212, 160, 67, 0.1)'};
  border: 1px solid ${props => props.$highlight ? '#D4A043' : 'rgba(212, 160, 67, 0.3)'};
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(212, 160, 67, 0.2);
  }
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #D4A043;
  margin-bottom: 8px;
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 0.95rem;
  color: #ccc;
  margin-bottom: 4px;
`;

const StatSubLabel = styled.div`
  font-size: 0.8rem;
  color: #888;
`;

const SearchAndFilters = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
  align-items: center;
  background: rgba(26, 26, 26, 0.6);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(212, 160, 67, 0.2);
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 250px;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 12px 16px;
  color: #fff;
  font-size: 0.95rem;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #D4A043;
  }

  &::placeholder {
    color: #666;
  }
`;

const FilterSelect = styled.select`
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 12px 16px;
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
  transition: border-color 0.3s;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #D4A043;
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' | 'success' | 'secondary' }>`
  background: ${props => {
    if (props.$variant === 'danger') return '#F44336';
    if (props.$variant === 'success') return '#4CAF50';
    if (props.$variant === 'secondary') return 'transparent';
    return '#D4A043';
  }};
  border: ${props => props.$variant === 'secondary' ? '1px solid #666' : 'none'};
  color: ${props => props.$variant === 'primary' ? '#000' : '#fff'};
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const UsersTable = styled.div`
  background: rgba(10, 10, 10, 0.8);
  border: 1px solid rgba(212, 160, 67, 0.3);
  border-radius: 12px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1.2fr 1fr 1.2fr 1.2fr 1.5fr;
  gap: 15px;
  padding: 16px 20px;
  background: rgba(212, 160, 67, 0.1);
  border-bottom: 2px solid #D4A043;
  font-weight: 700;
  color: #D4A043;
  font-size: 0.95rem;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const UserRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1.2fr 1fr 1.2fr 1.2fr 1.5fr;
  gap: 15px;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  align-items: center;
  transition: background 0.2s;

  &:hover {
    background: rgba(212, 160, 67, 0.05);
  }

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 12px;
    border-bottom: 2px solid rgba(212, 160, 67, 0.2);
    padding: 20px;
    margin-bottom: 15px;
    border-radius: 8px;
    background: rgba(26, 26, 26, 0.6);
  }
`;

const UserField = styled.div`
  color: #e0e0e0;
  font-size: 0.95rem;
  word-break: break-word;

  @media (max-width: 1024px) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    &::before {
      content: attr(data-label);
      font-weight: 700;
      color: #D4A043;
      margin-left: 15px;
    }

    &:last-child {
      border-bottom: none;
    }
  }
`;

const UserInput = styled.input`
  width: 100%;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 8px 12px;
  color: #fff;
  font-size: 0.9rem;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #D4A043;
  }
`;

const UserSelect = styled.select`
  width: 100%;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 8px 12px;
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #D4A043;
  }
`;

const Badge = styled.span<{ $tier?: string; $role?: string }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => {
    if (props.$role === 'admin') return 'rgba(244, 67, 54, 0.2)';
    if (props.$tier === 'coach-pro') return 'rgba(212, 160, 67, 0.3)';
    if (props.$tier === 'coach') return 'rgba(212, 160, 67, 0.2)';
    if (props.$tier === 'pro') return 'rgba(255, 193, 7, 0.2)';
    if (props.$tier === 'creator') return 'rgba(156, 39, 176, 0.2)';
    return 'rgba(128, 128, 128, 0.2)';
  }};
  color: ${props => {
    if (props.$role === 'admin') return '#F44336';
    if (props.$tier === 'coach-pro') return '#F5C842';
    if (props.$tier === 'coach') return '#D4A043';
    if (props.$tier === 'pro') return '#FFC107';
    if (props.$tier === 'creator') return '#9C27B0';
    return '#888';
  }};
  border: 1px solid ${props => {
    if (props.$role === 'admin') return '#F44336';
    if (props.$tier === 'coach-pro') return '#F5C842';
    if (props.$tier === 'coach') return '#D4A043';
    if (props.$tier === 'pro') return '#FFC107';
    if (props.$tier === 'creator') return '#9C27B0';
    return '#888';
  }};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;

  @media (max-width: 1024px) {
    justify-content: flex-start;
    margin-top: 10px;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'success' | 'danger' | 'secondary' | 'info' }>`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;

  background: ${props => {
    if (props.$variant === 'success') return '#4CAF50';
    if (props.$variant === 'danger') return '#F44336';
    if (props.$variant === 'secondary') return '#666';
    if (props.$variant === 'info') return '#2196F3';
    return '#D4A043';
  }};
  color: ${props => props.$variant === 'primary' ? '#000' : '#fff'};

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Message = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  padding: 16px 20px;
  margin-bottom: 25px;
  border-radius: 8px;
  background: ${props => {
    if (props.$type === 'success') return 'rgba(76, 175, 80, 0.2)';
    if (props.$type === 'error') return 'rgba(244, 67, 54, 0.2)';
    return 'rgba(33, 150, 243, 0.2)';
  }};
  border: 1px solid ${props => {
    if (props.$type === 'success') return '#4CAF50';
    if (props.$type === 'error') return '#F44336';
    return '#2196F3';
  }};
  color: ${props => {
    if (props.$type === 'success') return '#4CAF50';
    if (props.$type === 'error') return '#F44336';
    return '#2196F3';
  }};
  font-weight: 600;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #888;
  font-size: 1.1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #888;
  font-size: 1.1rem;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 25px;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const UserDetailsModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
`;

const UserDetailsContent = styled.div`
  background: #0a0a0a;
  border: 2px solid #D4A043;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 30px;
`;

const UserDetailsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(212, 160, 67, 0.3);
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #999;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #D4A043;
  }
`;

const DetailsSection = styled.div`
  margin-bottom: 25px;
`;

const SectionTitle = styled.h3`
  color: #D4A043;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
`;

const DetailItem = styled.div`
  background: rgba(26, 26, 26, 0.6);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(212, 160, 67, 0.2);
`;

const DetailLabel = styled.div`
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 5px;
`;

const DetailValue = styled.div`
  font-size: 1rem;
  color: #fff;
  font-weight: 600;
`;

type TabType = 'overview' | 'users' | 'analyses' | 'videos' | 'announcements';
type AnnouncementSubTabType = 'send' | 'coupons' | 'trials' | 'history';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ 
    full_name?: string; 
    email?: string; 
    subscription_tier?: string; 
    role?: string;
    subscription_period?: string;
    subscription_status?: string;
  }>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    target_all: true,
    target_tier: [] as string[],
    include_benefit: false,
    benefit_type: 'coupon' as 'coupon' | 'trial',
    selected_coupon_id: null as string | null,
    trial_tier: 'creator' as 'creator' | 'pro' | 'coach' | 'coach-pro' | null,
    trial_duration_days: 7,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [announcementSubTab, setAnnouncementSubTab] = useState<AnnouncementSubTabType>('send');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);
  const [couponRedemptions, setCouponRedemptions] = useState<any[]>([]);
  const [editingCoupon, setEditingCoupon] = useState<string | null>(null);
  const [viewingRedemptions, setViewingRedemptions] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discount_type: 'trial_subscription' as 'percentage' | 'fixed_amount' | 'free_analyses' | 'trial_subscription',
    discount_value: null as number | null,
    free_analyses_count: null as number | null,
    trial_tier: 'creator' as 'creator' | 'pro' | 'coach' | 'coach-pro' | null,
    trial_duration_days: 7,
    max_uses: null as number | null,
    valid_from: '',
    valid_until: null as string | null,
  });
  const [trialForm, setTrialForm] = useState({
    tier: 'creator' as 'creator' | 'pro' | 'coach' | 'coach-pro',
    duration_days: 7,
    target_type: 'selected' as 'selected' | 'tier' | 'all',
    target_tier: 'free' as string,
    selected_user_ids: [] as string[],
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isUserAdmin && activeTab === 'overview') {
      loadStats();
    }
    if (isUserAdmin && activeTab === 'users') {
      loadUsers();
    }
    if (isUserAdmin && activeTab === 'analyses') {
      loadAnalyses();
    }
    if (isUserAdmin && activeTab === 'videos') {
      loadVideos();
    }
    if (isUserAdmin && activeTab === 'announcements') {
      loadAnnouncements();
      loadCoupons();
      loadTrials();
    }
  }, [isUserAdmin, activeTab]);

  const checkAdminStatus = async () => {
    setCheckingAdmin(true);
    try {
      const adminStatus = await isAdmin();
      setIsUserAdmin(adminStatus);
      if (adminStatus) {
        await loadStats();
        await loadUsers();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsUserAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const loadStats = async () => {
    try {
      const adminStats = await getAdminStats();
      setStats(adminStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers || []);
      if (!allUsers || allUsers.length === 0) {
        setMessage({ type: 'info', text: 'לא נמצאו משתמשים במערכת' });
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
      setMessage({ type: 'error', text: `שגיאה בטעינת המשתמשים: ${error.message || 'שגיאה לא ידועה'}` });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      const allAnalyses = await getAllAnalyses();
      setAnalyses(allAnalyses || []);
    } catch (error: any) {
      console.error('Error loading analyses:', error);
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async () => {
    setLoading(true);
    try {
      const allVideos = await getAllVideos();
      setVideos(allVideos || []);
    } catch (error: any) {
      console.error('Error loading videos:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (user: any) => {
    setLoadingUserDetails(true);
    setSelectedUser(user);
    try {
      const [userAnalyses, userVideos, usageStats] = await Promise.all([
        getUserAnalyses(user.user_id),
        getUserVideos(user.user_id),
        getUserUsageStats(user.user_id),
      ]);
      setUserDetails({
        ...user,
        analyses: userAnalyses,
        videos: userVideos,
        usage: usageStats,
      });
    } catch (error: any) {
      console.error('Error loading user details:', error);
      setMessage({ type: 'error', text: 'שגיאה בטעינת פרטי המשתמש' });
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user.user_id);
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || '',
      subscription_tier: user.subscription_tier || 'free',
      role: user.role || 'user',
      subscription_period: user.subscription_period || 'monthly',
      subscription_status: user.subscription_status || 'active',
    });
  };

  const handleSaveEdit = async (userId: string) => {
    try {
      await updateUserProfile(userId, editForm);
      setMessage({ type: 'success', text: 'המשתמש עודכן בהצלחה' });
      setEditingUser(null);
      await loadUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error updating user:', error);
      setMessage({ type: 'error', text: error.message || 'שגיאה בעדכון המשתמש' });
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המשתמש ${email}? פעולה זו לא ניתנת לביטול.`)) {
      return;
    }

    try {
      await deleteUser(userId);
      setMessage({ type: 'success', text: 'המשתמש נמחק בהצלחה' });
      await loadUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setMessage({ type: 'error', text: error.message || 'שגיאה במחיקת המשתמש' });
    }
  };

  const getTierDisplayName = (tier: string) => {
    if (tier === 'coach-pro') {
      return 'מאמנים, סוכנויות ובתי ספר למשחק גרסת פרו';
    }
    return SUBSCRIPTION_PLANS[tier as SubscriptionTier]?.name || tier;
  };

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await getAllAnnouncements();
      setAnnouncements(data);
    } catch (error: any) {
      console.error('Error loading announcements:', error);
      setMessage({ type: 'error', text: 'שגיאה בטעינת העדכונים' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      setMessage({ type: 'error', text: 'נא למלא את כל השדות' });
      return;
    }

    if (announcementForm.include_benefit) {
      if (announcementForm.benefit_type === 'coupon' && !announcementForm.selected_coupon_id) {
        setMessage({ type: 'error', text: 'נא לבחור קוד קופון' });
        return;
      }
      if (announcementForm.benefit_type === 'trial' && (!announcementForm.trial_tier || !announcementForm.trial_duration_days)) {
        setMessage({ type: 'error', text: 'נא למלא את כל פרטי ההתנסות' });
        return;
      }
    }

    setLoading(true);
    try {
      // First create the announcement
      const result = await createAnnouncement({
        title: announcementForm.title.trim(),
        message: announcementForm.message.trim(),
        target_all: announcementForm.target_all,
        target_tier: announcementForm.target_all ? undefined : announcementForm.target_tier,
      });

      // If benefit is included, apply it to target users
      if (announcementForm.include_benefit) {
        // Get target user IDs
        let targetUserIds: string[] = [];
        if (announcementForm.target_all) {
          targetUserIds = users.map(u => u.user_id);
        } else if (announcementForm.target_tier.length > 0) {
          targetUserIds = users
            .filter(u => announcementForm.target_tier.includes(u.subscription_tier))
            .map(u => u.user_id);
        }

        if (targetUserIds.length > 0) {
          if (announcementForm.benefit_type === 'trial') {
            // Grant trial to users
            await grantTrialToUsers(
              targetUserIds, 
              announcementForm.trial_tier || 'creator', 
              announcementForm.trial_duration_days
            );
          } else if (announcementForm.benefit_type === 'coupon' && announcementForm.selected_coupon_id) {
            // Note: Coupon codes should be used individually by users during registration
            // We can't automatically apply them, but we could add a note in the message
            // For now, we'll just create a reference in the announcement (if needed in future)
            console.log('Coupon attached to announcement:', announcementForm.selected_coupon_id);
          }
        }
      }

      setMessage({ type: 'success', text: `העדכון נשלח בהצלחה ל-${(result as any).sentCount || 0} משתמשים${announcementForm.include_benefit ? ' (עם הטבה)' : ''}` });
      setAnnouncementForm({
        title: '',
        message: '',
        target_all: true,
        target_tier: [],
        include_benefit: false,
        benefit_type: 'coupon',
        selected_coupon_id: null,
        trial_tier: 'creator',
        trial_duration_days: 7,
      });
      await loadAnnouncements();
      await loadTrials();
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error('Error sending announcement:', error);
      setMessage({ type: 'error', text: error.message || 'שגיאה בשליחת העדכון' });
    } finally {
      setLoading(false);
    }
  };

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await getAllCoupons();
      setCoupons(data);
    } catch (error: any) {
      console.error('Error loading coupons:', error);
      setMessage({ type: 'error', text: 'שגיאה בטעינת הקופונים' });
    } finally {
      setLoading(false);
    }
  };

  const loadCouponRedemptions = async (couponId?: string) => {
    try {
      const data = await getCouponRedemptions(couponId);
      setCouponRedemptions(data);
    } catch (error: any) {
      console.error('Error loading coupon redemptions:', error);
      setMessage({ type: 'error', text: 'שגיאה בטעינת שימושי הקופונים' });
    }
  };

  const handleEditCoupon = (coupon: any) => {
    setEditingCoupon(coupon.id);
    setCouponForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      free_analyses_count: coupon.discount_type === 'free_analyses' ? coupon.discount_value : null,
      trial_tier: coupon.trial_tier || 'creator',
      trial_duration_days: coupon.trial_duration_days || 7,
      max_uses: coupon.max_uses,
      valid_from: coupon.valid_from ? new Date(coupon.valid_from).toISOString().split('T')[0] : '',
      valid_until: coupon.valid_until ? new Date(coupon.valid_until).toISOString().split('T')[0] : null,
    });
  };

  const handleUpdateCoupon = async (couponId: string) => {
    if (!couponForm.code.trim()) {
      setMessage({ type: 'error', text: 'נא להזין קוד קופון' });
      return;
    }

    setLoading(true);
    try {
      await updateCoupon(couponId, {
        code: couponForm.code.trim(),
        description: couponForm.description || undefined,
        discount_type: couponForm.discount_type,
        discount_value: couponForm.discount_value || undefined,
        free_analyses_count: couponForm.free_analyses_count || undefined,
        trial_tier: couponForm.trial_tier || undefined,
        trial_duration_days: couponForm.trial_duration_days || undefined,
        max_uses: couponForm.max_uses || undefined,
        valid_from: couponForm.valid_from ? new Date(couponForm.valid_from).toISOString() : undefined,
        valid_until: couponForm.valid_until ? new Date(couponForm.valid_until).toISOString() : undefined,
      });
      setMessage({ type: 'success', text: 'קוד קופון עודכן בהצלחה' });
      setEditingCoupon(null);
      setCouponForm({
        code: '',
        description: '',
        discount_type: 'trial_subscription',
        discount_value: null,
        free_analyses_count: null,
        trial_tier: 'creator',
        trial_duration_days: 7,
        max_uses: null,
        valid_from: '',
        valid_until: null,
      });
      await loadCoupons();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error updating coupon:', error);
      setMessage({ type: 'error', text: error.message || 'שגיאה בעדכון קוד הקופון' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string, code: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את קוד הקופון ${code}? פעולה זו לא ניתנת לביטול.`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteCoupon(couponId);
      setMessage({ type: 'success', text: 'קוד קופון נמחק בהצלחה' });
      await loadCoupons();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      setMessage({ type: 'error', text: error.message || 'שגיאה במחיקת קוד הקופון' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCouponStatus = async (couponId: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      await toggleCouponStatus(couponId, !currentStatus);
      setMessage({ type: 'success', text: `קוד קופון ${!currentStatus ? 'הופעל' : 'הושבת'} בהצלחה` });
      await loadCoupons();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error toggling coupon status:', error);
      setMessage({ type: 'error', text: error.message || 'שגיאה בשינוי סטטוס קוד הקופון' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewRedemptions = async (couponId: string) => {
    setViewingRedemptions(couponId);
    await loadCouponRedemptions(couponId);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      setMessage({ type: 'error', text: 'נא להזין קוד קופון' });
      return;
    }

    setLoading(true);
    try {
      await createCoupon({
        code: couponForm.code.trim(),
        discount_type: couponForm.discount_type,
        discount_value: couponForm.discount_value || undefined,
        free_analyses_count: couponForm.free_analyses_count || undefined,
        trial_tier: couponForm.trial_tier || undefined,
        trial_duration_days: couponForm.trial_duration_days || undefined,
        max_uses: couponForm.max_uses || undefined,
        valid_from: couponForm.valid_from ? new Date(couponForm.valid_from).toISOString() : undefined,
        valid_until: couponForm.valid_until ? new Date(couponForm.valid_until).toISOString() : undefined,
      });
      setMessage({ type: 'success', text: 'קוד קופון נוצר בהצלחה' });
      setCouponForm({
        code: '',
        description: '',
        discount_type: 'trial_subscription',
        discount_value: null,
        free_analyses_count: null,
        trial_tier: 'creator',
        trial_duration_days: 7,
        max_uses: null,
        valid_from: '',
        valid_until: null,
      });
      await loadCoupons();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      setMessage({ type: 'error', text: error.message || 'שגיאה ביצירת קוד הקופון' });
    } finally {
      setLoading(false);
    }
  };

  const loadTrials = async () => {
    setLoading(true);
    try {
      const data = await getAllTrials();
      setTrials(data);
    } catch (error: any) {
      console.error('Error loading trials:', error);
      setMessage({ type: 'error', text: 'שגיאה בטעינת ההתנסויות' });
    } finally {
      setLoading(false);
    }
  };

  const handleGrantTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let targetUserIds: string[] = [];
    
    if (trialForm.target_type === 'selected') {
      if (trialForm.selected_user_ids.length === 0) {
        setMessage({ type: 'error', text: 'נא לבחור משתמשים' });
        return;
      }
      targetUserIds = trialForm.selected_user_ids;
    } else if (trialForm.target_type === 'tier') {
      const tierUsers = users.filter(u => u.subscription_tier === trialForm.target_tier).map(u => u.user_id);
      if (tierUsers.length === 0) {
        setMessage({ type: 'error', text: 'לא נמצאו משתמשים בדרגה זו' });
        return;
      }
      targetUserIds = tierUsers;
    } else {
      // All users
      targetUserIds = users.map(u => u.user_id);
      if (targetUserIds.length === 0) {
        setMessage({ type: 'error', text: 'לא נמצאו משתמשים' });
        return;
      }
    }

    setLoading(true);
    try {
      const result = await grantTrialToUsers(targetUserIds, trialForm.tier, trialForm.duration_days);
      setMessage({ type: 'success', text: `התנסות ניתנה ל-${result.granted} משתמשים בהצלחה` });
      setTrialForm({
        tier: 'creator',
        duration_days: 7,
        target_type: 'selected',
        selected_user_ids: [],
        target_tier: 'free',
      });
      await loadTrials();
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error('Error granting trial:', error);
      setMessage({ type: 'error', text: error.message || 'שגיאה במתן התנסות' });
    } finally {
      setLoading(false);
    }
  };

    // Filter users based on search and filters
    const filteredUsersList = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTier = filterTier === 'all' || user.subscription_tier === filterTier;
    const matchesRole = filterRole === 'all' || user.role === filterRole;

    return matchesSearch && matchesTier && matchesRole;
  });

  if (checkingAdmin) {
    return (
      <AppContainer style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column' }}>
        <LoadingSpinner>בודק הרשאות...</LoadingSpinner>
      </AppContainer>
    );
  }

  if (!isUserAdmin) {
    return (
      <AppContainer style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column' }}>
        <h1 style={{ color: '#F44336', marginBottom: '20px' }}>גישה נדחתה</h1>
        <p style={{ color: '#ccc', marginBottom: '30px' }}>אין לך הרשאות מנהל כדי לגשת לדף זה.</p>
        <ActionButton onClick={() => navigate('/')}>חזרה לדף הבית</ActionButton>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '20px' }}>
          <ActionButton $variant="secondary" onClick={() => navigate('/')}>
            ← חזרה
          </ActionButton>
          <h1 style={{ color: '#D4A043', margin: 0, fontSize: '2rem' }}>🛠️ פאנל ניהול מתקדם</h1>
          <div style={{ width: '100px' }}></div>
        </div>
      </Header>

      <AdminContainer>
        {message && (
          <Message $type={message.type}>{message.text}</Message>
        )}

        <TabsContainer>
          <Tab $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            📊 סקירה כללית
          </Tab>
          <Tab $active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
            👥 משתמשים ({users.length})
          </Tab>
          <Tab $active={activeTab === 'analyses'} onClick={() => setActiveTab('analyses')}>
            📝 ניתוחים ({analyses.length})
          </Tab>
          <Tab $active={activeTab === 'videos'} onClick={() => setActiveTab('videos')}>
            🎥 וידאו ({videos.length})
          </Tab>
          <Tab $active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')}>
            📢 התראות והטבות
          </Tab>
        </TabsContainer>

        {activeTab === 'overview' && stats && (
          <>
            <StatsGrid>
              <StatCard $highlight>
                <StatValue>{stats.totalUsers}</StatValue>
                <StatLabel>סה"כ משתמשים</StatLabel>
                <StatSubLabel>{stats.recentUsers} נרשמו ב-30 יום האחרונים</StatSubLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.totalAnalyses}</StatValue>
                <StatLabel>סה"כ ניתוחים</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.totalVideos}</StatValue>
                <StatLabel>סה"כ וידאו</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.roleDistribution.admin || 0}</StatValue>
                <StatLabel>מנהלים</StatLabel>
              </StatCard>
            </StatsGrid>

            <DetailsSection>
              <SectionTitle>פילוח לפי דרגות מנוי</SectionTitle>
              <DetailsGrid>
                {Object.entries(stats.tierDistribution).map(([tier, count]: [string, any]) => (
                  <DetailItem key={tier}>
                    <DetailLabel>{getTierDisplayName(tier)}</DetailLabel>
                    <DetailValue>{count} משתמשים</DetailValue>
                  </DetailItem>
                ))}
              </DetailsGrid>
            </DetailsSection>
          </>
        )}

        {activeTab === 'users' && (
          <>
            <SearchAndFilters>
              <SearchInput
                type="text"
                placeholder="חפש לפי אימייל או שם..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FilterSelect value={filterTier} onChange={(e) => setFilterTier(e.target.value)}>
                <option value="all">כל הדרגות</option>
                <option value="free">ניסיון</option>
                <option value="creator">יוצרים</option>
                <option value="pro">יוצרים באקסטרים</option>
                <option value="coach">מאמנים, סוכנויות ובתי ספר למשחק</option>
                <option value="coach-pro">מאמנים, סוכנויות ובתי ספר למשחק גרסת פרו</option>
              </FilterSelect>
              <FilterSelect value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="all">כל התפקידים</option>
                <option value="user">משתמש רגיל</option>
                <option value="admin">מנהל</option>
              </FilterSelect>
              <ActionButton onClick={() => loadUsers()}>🔄 רענן</ActionButton>
            </SearchAndFilters>

            <HeaderActions>
              <h3 style={{ color: '#D4A043', margin: 0 }}>
                משתמשים ({filteredUsersList.length})
              </h3>
            </HeaderActions>

            {loading ? (
              <LoadingSpinner>טוען משתמשים...</LoadingSpinner>
            ) : filteredUsersList.length === 0 ? (
              <EmptyState>
                {users.length === 0 
                  ? 'לא נמצאו משתמשים במערכת' 
                  : 'לא נמצאו משתמשים התואמים לחיפוש שלך'}
              </EmptyState>
            ) : (
              <UsersTable>
                <TableHeader>
                  <div>אימייל</div>
                  <div>שם מלא</div>
                  <div>דרגה</div>
                  <div>תפקיד</div>
                  <div>תחומי ניתוח</div>
                  <div>סטטוס מנוי</div>
                  <div>תאריך רישום</div>
                  <div>פעולות</div>
                </TableHeader>
                {filteredUsersList.map((user) => (
                  <UserRow key={user.user_id}>
                    <UserField data-label="אימייל:">
                      {editingUser === user.user_id ? (
                        <UserInput
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      ) : (
                        user.email
                      )}
                    </UserField>
                    <UserField data-label="שם מלא:">
                      {editingUser === user.user_id ? (
                        <UserInput
                          type="text"
                          value={editForm.full_name || ''}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        />
                      ) : (
                        user.full_name || '-'
                      )}
                    </UserField>
                    <UserField data-label="דרגה:">
                      {editingUser === user.user_id ? (
                        <UserSelect
                          value={editForm.subscription_tier || 'free'}
                          onChange={(e) => setEditForm({ ...editForm, subscription_tier: e.target.value })}
                        >
                          <option value="free">ניסיון</option>
                          <option value="creator">יוצרים</option>
                          <option value="pro">יוצרים באקסטרים</option>
                          <option value="coach">מאמנים, סוכנויות ובתי ספר למשחק</option>
                          <option value="coach-pro">מאמנים, סוכנויות ובתי ספר למשחק גרסת פרו</option>
                        </UserSelect>
                      ) : (
                        <Badge $tier={user.subscription_tier}>
                          {getTierDisplayName(user.subscription_tier)}
                        </Badge>
                      )}
                    </UserField>
                    <UserField data-label="תפקיד:">
                      {editingUser === user.user_id ? (
                        <UserSelect
                          value={editForm.role || 'user'}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        >
                          <option value="user">משתמש רגיל</option>
                          <option value="admin">מנהל</option>
                        </UserSelect>
                      ) : (
                        <Badge $role={user.role}>
                          {user.role === 'admin' ? 'מנהל' : 'משתמש רגיל'}
                        </Badge>
                      )}
                    </UserField>
                    <UserField data-label="תחומי ניתוח:">
                      {(() => {
                        const tracks = user.selected_tracks && user.selected_tracks.length > 0
                          ? user.selected_tracks
                          : user.selected_primary_track
                          ? [user.selected_primary_track]
                          : [];
                        
                        const trackLabels: { [key: string]: string } = {
                          'actors': 'שחקנים',
                          'musicians': 'זמרים',
                          'creators': 'יוצרי תוכן',
                          'influencers': 'משפיענים',
                          'coach': 'מאמנים'
                        };
                        
                        if (tracks.length === 0) {
                          return <span style={{ color: '#888' }}>-</span>;
                        }
                        
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {tracks.map((track: string, idx: number) => (
                              <Badge key={idx} $tier="creator" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                {trackLabels[track] || track}
                              </Badge>
                            ))}
                          </div>
                        );
                      })()}
                    </UserField>
                    <UserField data-label="סטטוס מנוי:">
                      {editingUser === user.user_id ? (
                        <>
                          <UserSelect
                            value={editForm.subscription_status || 'active'}
                            onChange={(e) => setEditForm({ ...editForm, subscription_status: e.target.value })}
                            style={{ marginBottom: '8px' }}
                          >
                            <option value="active">פעיל</option>
                            <option value="inactive">לא פעיל</option>
                            <option value="cancelled">מבוטל</option>
                          </UserSelect>
                          <UserSelect
                            value={editForm.subscription_period || 'monthly'}
                            onChange={(e) => setEditForm({ ...editForm, subscription_period: e.target.value })}
                          >
                            <option value="monthly">חודשי</option>
                            <option value="yearly">שנתי</option>
                          </UserSelect>
                        </>
                      ) : (
                        <Badge $tier={user.subscription_status === 'active' ? 'pro' : undefined}>
                          {user.subscription_status || 'active'}
                        </Badge>
                      )}
                    </UserField>
                    <UserField data-label="תאריך רישום:">
                      {new Date(user.created_at).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </UserField>
                    <UserField data-label="פעולות:">
                      <ActionButtons>
                        {editingUser === user.user_id ? (
                          <>
                            <Button $variant="success" onClick={() => handleSaveEdit(user.user_id)}>
                              ✓ שמור
                            </Button>
                            <Button $variant="secondary" onClick={handleCancelEdit}>
                              ✕ ביטול
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button $variant="info" onClick={() => loadUserDetails(user)}>
                              👁️ פרטים
                            </Button>
                            <Button $variant="primary" onClick={() => handleEdit(user)}>
                              ✏️ ערוך
                            </Button>
                            <Button $variant="danger" onClick={() => handleDelete(user.user_id, user.email)}>
                              🗑️ מחק
                            </Button>
                          </>
                        )}
                      </ActionButtons>
                    </UserField>
                  </UserRow>
                ))}
              </UsersTable>
            )}
          </>
        )}

        {activeTab === 'analyses' && (
          <div>
            <HeaderActions>
              <h3 style={{ color: '#D4A043', margin: 0 }}>
                ניתוחים ({analyses.length})
              </h3>
              <ActionButton onClick={() => loadAnalyses()}>🔄 רענן</ActionButton>
            </HeaderActions>
            {loading ? (
              <LoadingSpinner>טוען ניתוחים...</LoadingSpinner>
            ) : analyses.length === 0 ? (
              <EmptyState>לא נמצאו ניתוחים</EmptyState>
            ) : (
              <UsersTable>
                <TableHeader>
                  <div>משתמש</div>
                  <div>טרק</div>
                  <div>ציון ממוצע</div>
                  <div>תאריך</div>
                </TableHeader>
                {analyses.map((analysis: any) => (
                  <UserRow key={analysis.id}>
                    <UserField data-label="משתמש:">{analysis.user_id}</UserField>
                    <UserField data-label="טרק:">{analysis.track}</UserField>
                    <UserField data-label="ציון:">{analysis.average_score || '-'}</UserField>
                    <UserField data-label="תאריך:">
                      {new Date(analysis.created_at).toLocaleDateString('he-IL')}
                    </UserField>
                  </UserRow>
                ))}
              </UsersTable>
            )}
          </div>
        )}

        {activeTab === 'videos' && (
          <div>
            <HeaderActions>
              <h3 style={{ color: '#D4A043', margin: 0 }}>
                וידאו ({videos.length})
              </h3>
              <ActionButton onClick={() => loadVideos()}>🔄 רענן</ActionButton>
            </HeaderActions>
            {loading ? (
              <LoadingSpinner>טוען וידאו...</LoadingSpinner>
            ) : videos.length === 0 ? (
              <EmptyState>לא נמצאו וידאו</EmptyState>
            ) : (
              <UsersTable>
                <TableHeader>
                  <div>שם קובץ</div>
                  <div>גודל</div>
                  <div>משך</div>
                  <div>תאריך</div>
                </TableHeader>
                {videos.map((video: any) => (
                  <UserRow key={video.id}>
                    <UserField data-label="שם:">{video.file_name}</UserField>
                    <UserField data-label="גודל:">
                      {video.file_size ? `${(video.file_size / 1024 / 1024).toFixed(2)} MB` : '-'}
                    </UserField>
                    <UserField data-label="משך:">
                      {video.duration_seconds ? `${video.duration_seconds} שניות` : '-'}
                    </UserField>
                    <UserField data-label="תאריך:">
                      {new Date(video.created_at).toLocaleDateString('he-IL')}
                    </UserField>
                  </UserRow>
                ))}
              </UsersTable>
            )}
          </div>
        )}

        {activeTab === 'announcements' && (
          <div>
            <HeaderActions>
              <h3 style={{ color: '#D4A043', margin: 0 }}>התראות והטבות</h3>
              <ActionButton onClick={() => {
                loadAnnouncements();
                loadCoupons();
                loadTrials();
              }}>🔄 רענן הכל</ActionButton>
            </HeaderActions>

            {/* Sub-tabs for announcements section */}
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              marginBottom: '25px',
              borderBottom: '2px solid rgba(212, 160, 67, 0.2)',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setAnnouncementSubTab('send')}
                style={{
                  background: announcementSubTab === 'send' ? 'rgba(212, 160, 67, 0.2)' : 'transparent',
                  border: 'none',
                  borderBottom: announcementSubTab === 'send' ? '2px solid #D4A043' : '2px solid transparent',
                  color: announcementSubTab === 'send' ? '#D4A043' : '#999',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: announcementSubTab === 'send' ? 700 : 400,
                  transition: 'all 0.3s',
                }}
              >
                📢 שליחת עדכון
              </button>
              <button
                onClick={() => setAnnouncementSubTab('coupons')}
                style={{
                  background: announcementSubTab === 'coupons' ? 'rgba(212, 160, 67, 0.2)' : 'transparent',
                  border: 'none',
                  borderBottom: announcementSubTab === 'coupons' ? '2px solid #D4A043' : '2px solid transparent',
                  color: announcementSubTab === 'coupons' ? '#D4A043' : '#999',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: announcementSubTab === 'coupons' ? 700 : 400,
                  transition: 'all 0.3s',
                }}
              >
                🎫 ניהול קופונים
              </button>
              <button
                onClick={() => setAnnouncementSubTab('trials')}
                style={{
                  background: announcementSubTab === 'trials' ? 'rgba(212, 160, 67, 0.2)' : 'transparent',
                  border: 'none',
                  borderBottom: announcementSubTab === 'trials' ? '2px solid #D4A043' : '2px solid transparent',
                  color: announcementSubTab === 'trials' ? '#D4A043' : '#999',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: announcementSubTab === 'trials' ? 700 : 400,
                  transition: 'all 0.3s',
                }}
              >
                ⭐ ניהול התנסויות
              </button>
              <button
                onClick={() => setAnnouncementSubTab('history')}
                style={{
                  background: announcementSubTab === 'history' ? 'rgba(212, 160, 67, 0.2)' : 'transparent',
                  border: 'none',
                  borderBottom: announcementSubTab === 'history' ? '2px solid #D4A043' : '2px solid transparent',
                  color: announcementSubTab === 'history' ? '#D4A043' : '#999',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: announcementSubTab === 'history' ? 700 : 400,
                  transition: 'all 0.3s',
                }}
              >
                📜 היסטוריה
              </button>
            </div>

            {/* Send Announcement Tab */}
            {announcementSubTab === 'send' && (
              <form onSubmit={handleSendAnnouncement} style={{ marginBottom: '30px' }}>
              <div style={{
                background: 'rgba(26, 26, 26, 0.6)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(212, 160, 67, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}>
                <div>
                  <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                    כותרת העדכון *
                  </label>
                  <UserInput
                    type="text"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    placeholder="לדוגמה: עדכון חדש באפליקציה!"
                    required
                    style={{ direction: 'rtl' }}
                  />
                </div>

                <div>
                  <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                    תוכן העדכון *
                  </label>
                  <textarea
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                    placeholder="הזן את תוכן העדכון..."
                    required
                    rows={6}
                    style={{
                      width: '100%',
                      background: '#1a1a1a',
                      border: '1px solid #444',
                      borderRadius: '6px',
                      padding: '12px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      direction: 'rtl',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                    קהל יעד
                  </label>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={announcementForm.target_all}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, target_all: e.target.checked, target_tier: [] })}
                      />
                      <span>לכל המשתמשים</span>
                    </label>
                    {!announcementForm.target_all && (
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {(['free', 'creator', 'pro', 'coach'] as const).map((tier) => (
                          <label key={tier} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={announcementForm.target_tier.includes(tier)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAnnouncementForm({
                                    ...announcementForm,
                                    target_tier: [...announcementForm.target_tier, tier],
                                  });
                                } else {
                                  setAnnouncementForm({
                                    ...announcementForm,
                                    target_tier: announcementForm.target_tier.filter(t => t !== tier),
                                  });
                                }
                              }}
                            />
                            <span>{getTierDisplayName(tier)}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                    הטבה מצורפת (אופציונלי)
                  </label>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={announcementForm.include_benefit}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, include_benefit: e.target.checked })}
                      />
                      <span>צרף הטבה לעדכון</span>
                    </label>
                  </div>

                  {announcementForm.include_benefit && (
                    <>
                      <UserSelect
                        value={announcementForm.benefit_type}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, benefit_type: e.target.value as 'coupon' | 'trial', selected_coupon_id: null })}
                        style={{ direction: 'rtl', marginBottom: '15px' }}
                      >
                        <option value="coupon">קוד קופון קיים</option>
                        <option value="trial">התנסות זמנית</option>
                      </UserSelect>

                      {announcementForm.benefit_type === 'coupon' && (
                        <UserSelect
                          value={announcementForm.selected_coupon_id || ''}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, selected_coupon_id: e.target.value || null })}
                          style={{ direction: 'rtl', marginBottom: '10px' }}
                        >
                          <option value="">בחר קופון</option>
                          {coupons.filter((c: any) => c.is_active).map((coupon: any) => (
                            <option key={coupon.id} value={coupon.id}>
                              {coupon.code} - {coupon.discount_type === 'trial_subscription' ? `התנסות ${getTierDisplayName(coupon.trial_tier)}` :
                               coupon.discount_type === 'percentage' ? `הנחה ${coupon.discount_value}%` :
                               coupon.discount_type === 'fixed_amount' ? `הנחה ${coupon.discount_value}₪` :
                               `${coupon.discount_value || 0} ניתוחים חינם`}
                            </option>
                          ))}
                        </UserSelect>
                      )}

                      {announcementForm.benefit_type === 'trial' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                          <div>
                            <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                              חבילת התנסות *
                            </label>
                            <UserSelect
                              value={announcementForm.trial_tier || 'creator'}
                              onChange={(e) => setAnnouncementForm({ ...announcementForm, trial_tier: e.target.value as any })}
                              style={{ direction: 'rtl' }}
                            >
                              <option value="creator">יוצרים</option>
                              <option value="pro">יוצרים באקסטרים</option>
                              <option value="coach">מאמנים, סוכנויות ובתי ספר למשחק</option>
                              <option value="coach-pro">מאמנים, סוכנויות ובתי ספר למשחק גרסת פרו</option>
                            </UserSelect>
                          </div>
                          <div>
                            <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                              משך התנסות (ימים) *
                            </label>
                            <UserInput
                              type="number"
                              value={announcementForm.trial_duration_days}
                              onChange={(e) => setAnnouncementForm({ ...announcementForm, trial_duration_days: parseInt(e.target.value) || 7 })}
                              min="1"
                              required
                              style={{ direction: 'rtl' }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <ActionButton
                  type="submit"
                  disabled={loading || !announcementForm.title.trim() || !announcementForm.message.trim()}
                  $variant="primary"
                  style={{ alignSelf: 'flex-start' }}
                >
                  {loading ? 'שולח...' : '📢 שלח עדכון'}
                </ActionButton>
              </div>
            </form>
            )}

            {/* Coupons Management Tab */}
            {announcementSubTab === 'coupons' && (
              <>
                <form onSubmit={handleCreateCoupon} style={{ marginBottom: '30px' }}>
                  <div style={{
                    background: 'rgba(26, 26, 26, 0.6)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid rgba(212, 160, 67, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                  }}>
                    <h4 style={{ color: '#D4A043', margin: '0 0 10px 0', textAlign: 'right' }}>צור קוד קופון חדש</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div>
                        <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                          קוד קופון *
                        </label>
                        <UserInput
                          type="text"
                          value={couponForm.code}
                          onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase().trim() })}
                          placeholder="SUMMER2024"
                          required
                          style={{ direction: 'ltr', textAlign: 'center', textTransform: 'uppercase' }}
                        />
                      </div>
                      <div>
                        <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                          תיאור (אופציונלי)
                        </label>
                        <UserInput
                          type="text"
                          value={couponForm.description}
                          onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                          placeholder="קופון קיץ 2024"
                          style={{ direction: 'rtl' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                        סוג ההטבה *
                      </label>
                      <UserSelect
                        value={couponForm.discount_type}
                        onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value as any })}
                        style={{ direction: 'rtl' }}
                      >
                        <option value="trial_subscription">התנסות זמנית בחבילה</option>
                        <option value="percentage">הנחה באחוזים (%)</option>
                        <option value="fixed_amount">הנחה בסכום קבוע (₪)</option>
                        <option value="free_analyses">ניתוחים חינם</option>
                      </UserSelect>
                    </div>

                    {couponForm.discount_type === 'trial_subscription' && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                          <div>
                            <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                              חבילת התנסות *
                            </label>
                            <UserSelect
                              value={couponForm.trial_tier || 'creator'}
                              onChange={(e) => setCouponForm({ ...couponForm, trial_tier: e.target.value as any })}
                              style={{ direction: 'rtl' }}
                            >
                              <option value="creator">יוצרים</option>
                              <option value="pro">יוצרים באקסטרים</option>
                              <option value="coach">מאמנים, סוכנויות ובתי ספר למשחק</option>
                              <option value="coach-pro">מאמנים, סוכנויות ובתי ספר למשחק גרסת פרו</option>
                            </UserSelect>
                          </div>
                          <div>
                            <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                              משך התנסות (ימים) *
                            </label>
                            <UserInput
                              type="number"
                              value={couponForm.trial_duration_days}
                              onChange={(e) => setCouponForm({ ...couponForm, trial_duration_days: parseInt(e.target.value) || 7 })}
                              min="1"
                              required
                              style={{ direction: 'rtl' }}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {couponForm.discount_type === 'percentage' && (
                      <div>
                        <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                          אחוז הנחה * (0-100)
                        </label>
                        <UserInput
                          type="number"
                          value={couponForm.discount_value || ''}
                          onChange={(e) => setCouponForm({ ...couponForm, discount_value: parseFloat(e.target.value) || null })}
                          min="0"
                          max={100}
                          required
                          style={{ direction: 'rtl' }}
                        />
                      </div>
                    )}

                    {couponForm.discount_type === 'fixed_amount' && (
                      <div>
                        <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                          סכום הנחה * (₪)
                        </label>
                        <UserInput
                          type="number"
                          value={couponForm.discount_value || ''}
                          onChange={(e) => setCouponForm({ ...couponForm, discount_value: parseFloat(e.target.value) || null })}
                          min="0"
                          required
                          style={{ direction: 'rtl' }}
                        />
                      </div>
                    )}

                    {couponForm.discount_type === 'free_analyses' && (
                      <div>
                        <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                          מספר ניתוחים חינם *
                        </label>
                        <UserInput
                          type="number"
                          value={couponForm.free_analyses_count || ''}
                          onChange={(e) => setCouponForm({ ...couponForm, free_analyses_count: parseInt(e.target.value) || null })}
                          min="1"
                          required
                          style={{ direction: 'rtl' }}
                        />
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                      <div>
                        <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                          מקסימום שימושים (ריק = ללא הגבלה)
                        </label>
                        <UserInput
                          type="number"
                          value={couponForm.max_uses || ''}
                          onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                          min="1"
                          style={{ direction: 'rtl' }}
                        />
                      </div>
                      <div>
                        <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                          תאריך תחילה
                        </label>
                        <UserInput
                          type="date"
                          value={couponForm.valid_from}
                          onChange={(e) => setCouponForm({ ...couponForm, valid_from: e.target.value })}
                          style={{ direction: 'rtl' }}
                        />
                      </div>
                      <div>
                        <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                          תאריך סיום (ריק = ללא הגבלה)
                        </label>
                        <UserInput
                          type="date"
                          value={couponForm.valid_until || ''}
                          onChange={(e) => setCouponForm({ ...couponForm, valid_until: e.target.value || null })}
                          style={{ direction: 'rtl' }}
                        />
                      </div>
                    </div>

                    <ActionButton
                      type="submit"
                      disabled={loading || !couponForm.code.trim()}
                      $variant="primary"
                      style={{ alignSelf: 'flex-start' }}
                    >
                      {loading ? 'יוצר...' : '🎫 צור קוד קופון'}
                    </ActionButton>
                  </div>
                </form>

                <div>
                  <h3 style={{ color: '#D4A043', margin: '0 0 20px 0', textAlign: 'right' }}>קופונים קיימים</h3>
                  {loading ? (
                    <LoadingSpinner>טוען קופונים...</LoadingSpinner>
                  ) : coupons.length === 0 ? (
                    <EmptyState>אין קופונים</EmptyState>
                  ) : (
                    <UsersTable>
                      <TableHeader style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr 2fr' }}>
                        <div>קוד</div>
                        <div>סוג הטבה</div>
                        <div>ערך</div>
                        <div>שימושים</div>
                        <div>תוקף</div>
                        <div>סטטוס</div>
                        <div>פעולות</div>
                      </TableHeader>
                      {coupons.map((coupon: any) => (
                        <UserRow key={coupon.id} style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr 2fr' }}>
                          {editingCoupon === coupon.id ? (
                            <>
                              <UserField data-label="קוד:" colSpan={7}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', background: 'rgba(26, 26, 26, 0.6)', borderRadius: '8px' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                      <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                                        קוד קופון *
                                      </label>
                                      <UserInput
                                        type="text"
                                        value={couponForm.code}
                                        onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase().trim() })}
                                        style={{ direction: 'ltr', textAlign: 'center', textTransform: 'uppercase' }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                                        תיאור
                                      </label>
                                      <UserInput
                                        type="text"
                                        value={couponForm.description}
                                        onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                                        style={{ direction: 'rtl' }}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                                      סוג ההטבה *
                                    </label>
                                    <UserSelect
                                      value={couponForm.discount_type}
                                      onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value as any })}
                                      style={{ direction: 'rtl' }}
                                    >
                                      <option value="trial_subscription">התנסות זמנית בחבילה</option>
                                      <option value="percentage">הנחה באחוזים (%)</option>
                                      <option value="fixed_amount">הנחה בסכום קבוע (₪)</option>
                                      <option value="free_analyses">ניתוחים חינם</option>
                                    </UserSelect>
                                  </div>
                                  {couponForm.discount_type === 'trial_subscription' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                      <div>
                                        <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                                          חבילת התנסות *
                                        </label>
                                        <UserSelect
                                          value={couponForm.trial_tier || 'creator'}
                                          onChange={(e) => setCouponForm({ ...couponForm, trial_tier: e.target.value as any })}
                                          style={{ direction: 'rtl' }}
                                        >
                                          <option value="creator">יוצרים</option>
                                          <option value="pro">יוצרים באקסטרים</option>
                                          <option value="coach">מאמנים, סוכנויות ובתי ספר למשחק</option>
                                          <option value="coach-pro">מאמנים, סוכנויות ובתי ספר למשחק גרסת פרו</option>
                                        </UserSelect>
                                      </div>
                                      <div>
                                        <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                                          משך התנסות (ימים) *
                                        </label>
                                        <UserInput
                                          type="number"
                                          value={couponForm.trial_duration_days}
                                          onChange={(e) => setCouponForm({ ...couponForm, trial_duration_days: parseInt(e.target.value) || 7 })}
                                          min="1"
                                          style={{ direction: 'rtl' }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                  {couponForm.discount_type === 'percentage' && (
                                    <div>
                                      <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                                        אחוז הנחה * (0-100)
                                      </label>
                                      <UserInput
                                        type="number"
                                        value={couponForm.discount_value || ''}
                                        onChange={(e) => setCouponForm({ ...couponForm, discount_value: parseFloat(e.target.value) || null })}
                                        min="0"
                                        max={100}
                                        style={{ direction: 'rtl' }}
                                      />
                                    </div>
                                  )}
                                  {couponForm.discount_type === 'fixed_amount' && (
                                    <div>
                                      <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                                        סכום הנחה * (₪)
                                      </label>
                                      <UserInput
                                        type="number"
                                        value={couponForm.discount_value || ''}
                                        onChange={(e) => setCouponForm({ ...couponForm, discount_value: parseFloat(e.target.value) || null })}
                                        min="0"
                                        style={{ direction: 'rtl' }}
                                      />
                                    </div>
                                  )}
                                  {couponForm.discount_type === 'free_analyses' && (
                                    <div>
                                      <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                                        מספר ניתוחים חינם *
                                      </label>
                                      <UserInput
                                        type="number"
                                        value={couponForm.free_analyses_count || ''}
                                        onChange={(e) => setCouponForm({ ...couponForm, free_analyses_count: parseInt(e.target.value) || null })}
                                        min="1"
                                        style={{ direction: 'rtl' }}
                                      />
                                    </div>
                                  )}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                    <div>
                                      <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                                        מקסימום שימושים
                                      </label>
                                      <UserInput
                                        type="number"
                                        value={couponForm.max_uses || ''}
                                        onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                                        min="1"
                                        style={{ direction: 'rtl' }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                                        תאריך תחילה
                                      </label>
                                      <UserInput
                                        type="date"
                                        value={couponForm.valid_from}
                                        onChange={(e) => setCouponForm({ ...couponForm, valid_from: e.target.value })}
                                        style={{ direction: 'rtl' }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                                        תאריך סיום
                                      </label>
                                      <UserInput
                                        type="date"
                                        value={couponForm.valid_until || ''}
                                        onChange={(e) => setCouponForm({ ...couponForm, valid_until: e.target.value || null })}
                                        style={{ direction: 'rtl' }}
                                      />
                                    </div>
                                  </div>
                                  <ActionButtons>
                                    <Button $variant="success" onClick={() => handleUpdateCoupon(coupon.id)} disabled={loading}>
                                      ✓ שמור
                                    </Button>
                                    <Button $variant="secondary" onClick={() => { setEditingCoupon(null); setCouponForm({ code: '', description: '', discount_type: 'trial_subscription', discount_value: null, free_analyses_count: null, trial_tier: 'creator', trial_duration_days: 7, max_uses: null, valid_from: '', valid_until: null }); }}>
                                      ✕ ביטול
                                    </Button>
                                  </ActionButtons>
                                </div>
                              </UserField>
                            </>
                          ) : (
                            <>
                              <UserField data-label="קוד:" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{coupon.code}</UserField>
                              <UserField data-label="סוג:">
                                {coupon.discount_type === 'trial_subscription' ? `התנסות ${getTierDisplayName(coupon.trial_tier)}` :
                                 coupon.discount_type === 'percentage' ? `הנחה ${coupon.discount_value}%` :
                                 coupon.discount_type === 'fixed_amount' ? `הנחה ${coupon.discount_value}₪` :
                                 `${coupon.discount_value || 0} ניתוחים חינם`}
                              </UserField>
                              <UserField data-label="ערך:">
                                {coupon.discount_type === 'trial_subscription' 
                                  ? `${coupon.trial_duration_days} ימים`
                                  : coupon.discount_type === 'free_analyses'
                                  ? `${coupon.discount_value || 0} ניתוחים`
                                  : coupon.discount_value}
                              </UserField>
                              <UserField data-label="שימושים:">
                                {coupon.used_count || 0} / {coupon.max_uses || '∞'}
                              </UserField>
                              <UserField data-label="תוקף:">
                                {coupon.valid_until 
                                  ? new Date(coupon.valid_until).toLocaleDateString('he-IL')
                                  : 'ללא הגבלה'}
                              </UserField>
                              <UserField data-label="סטטוס:">
                                <Badge $tier={coupon.is_active ? 'pro' : 'free'}>
                                  {coupon.is_active ? 'פעיל' : 'לא פעיל'}
                                </Badge>
                              </UserField>
                              <UserField data-label="פעולות:">
                                <ActionButtons>
                                  <Button $variant="info" onClick={() => handleViewRedemptions(coupon.id)}>
                                    👁️ שימושים
                                  </Button>
                                  <Button $variant="primary" onClick={() => handleEditCoupon(coupon)}>
                                    ✏️ ערוך
                                  </Button>
                                  <Button $variant={coupon.is_active ? 'secondary' : 'success'} onClick={() => handleToggleCouponStatus(coupon.id, coupon.is_active)}>
                                    {coupon.is_active ? '⏸️ השבת' : '▶️ הפעל'}
                                  </Button>
                                  <Button $variant="danger" onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}>
                                    🗑️ מחק
                                  </Button>
                                </ActionButtons>
                              </UserField>
                            </>
                          )}
                        </UserRow>
                      ))}
                    </UsersTable>
                  )}
                </div>

                {/* Coupon Redemptions Modal */}
                {viewingRedemptions && (
                  <UserDetailsModal onClick={() => { setViewingRedemptions(null); setCouponRedemptions([]); }}>
                    <UserDetailsContent onClick={(e) => e.stopPropagation()}>
                      <UserDetailsHeader>
                        <h2 style={{ color: '#D4A043', margin: 0 }}>שימושי קוד קופון</h2>
                        <CloseButton onClick={() => { setViewingRedemptions(null); setCouponRedemptions([]); }}>×</CloseButton>
                      </UserDetailsHeader>
                      
                      {loading ? (
                        <LoadingSpinner>טוען שימושים...</LoadingSpinner>
                      ) : couponRedemptions.length === 0 ? (
                        <EmptyState>אין שימושים בקוד קופון זה</EmptyState>
                      ) : (
                        <UsersTable>
                          <TableHeader style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr' }}>
                            <div>משתמש</div>
                            <div>סוג הטבה</div>
                            <div>ערך</div>
                            <div>תאריך שימוש</div>
                            <div>פרטים נוספים</div>
                          </TableHeader>
                          {couponRedemptions.map((redemption: any) => (
                            <UserRow key={redemption.id} style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr' }}>
                              <UserField data-label="משתמש:">
                                {redemption.profiles?.full_name || redemption.profiles?.email || redemption.user_id}
                              </UserField>
                              <UserField data-label="סוג:">
                                {redemption.applied_discount_type === 'trial_subscription' 
                                  ? `התנסות ${getTierDisplayName(redemption.trial_tier)}`
                                  : redemption.applied_discount_type === 'percentage'
                                  ? `הנחה ${redemption.discount_applied}%`
                                  : redemption.applied_discount_type === 'fixed_amount'
                                  ? `הנחה ${redemption.discount_applied}₪`
                                  : `${redemption.discount_applied || 0} ניתוחים חינם`}
                              </UserField>
                              <UserField data-label="ערך:">
                                {redemption.applied_discount_type === 'trial_subscription' && redemption.trial_end_date
                                  ? `${Math.ceil((new Date(redemption.trial_end_date).getTime() - new Date(redemption.trial_start_date).getTime()) / (1000 * 60 * 60 * 24))} ימים`
                                  : redemption.discount_applied}
                              </UserField>
                              <UserField data-label="תאריך:">
                                {new Date(redemption.applied_at).toLocaleDateString('he-IL', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </UserField>
                              <UserField data-label="פרטים:">
                                {redemption.trial_start_date && redemption.trial_end_date ? (
                                  <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                    {new Date(redemption.trial_start_date).toLocaleDateString('he-IL')} - {new Date(redemption.trial_end_date).toLocaleDateString('he-IL')}
                                  </div>
                                ) : '-'}
                              </UserField>
                            </UserRow>
                          ))}
                        </UsersTable>
                      )}
                    </UserDetailsContent>
                  </UserDetailsModal>
                )}
              </>
            )}

            {/* Trials Management Tab */}
            {announcementSubTab === 'trials' && (
              <>
                <form onSubmit={handleGrantTrial} style={{ marginBottom: '30px' }}>
                  <div style={{
                    background: 'rgba(26, 26, 26, 0.6)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid rgba(212, 160, 67, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                  }}>
                    <h4 style={{ color: '#D4A043', margin: '0 0 10px 0', textAlign: 'right' }}>מתן התנסות זמנית</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div>
                        <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                          חבילת התנסות *
                        </label>
                        <UserSelect
                          value={trialForm.tier}
                          onChange={(e) => setTrialForm({ ...trialForm, tier: e.target.value as any })}
                          style={{ direction: 'rtl' }}
                        >
                          <option value="creator">יוצרים</option>
                          <option value="pro">יוצרים באקסטרים</option>
                          <option value="coach">מאמנים, סוכנויות ובתי ספר למשחק</option>
                          <option value="coach-pro">מאמנים, סוכנויות ובתי ספר למשחק גרסת פרו</option>
                        </UserSelect>
                      </div>
                      <div>
                        <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                          משך התנסות (ימים) *
                        </label>
                        <UserInput
                          type="number"
                          value={trialForm.duration_days}
                          onChange={(e) => setTrialForm({ ...trialForm, duration_days: parseInt(e.target.value) || 7 })}
                          min="1"
                          required
                          style={{ direction: 'rtl' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ color: '#D4A043', fontSize: '0.9rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>
                        קהל יעד *
                      </label>
                      <UserSelect
                        value={trialForm.target_type}
                        onChange={(e) => setTrialForm({ ...trialForm, target_type: e.target.value as any, selected_user_ids: [] })}
                        style={{ direction: 'rtl', marginBottom: '10px' }}
                      >
                        <option value="selected">משתמשים נבחרים</option>
                        <option value="tier">כל משתמשי חבילה מסוימת</option>
                        <option value="all">כל המשתמשים</option>
                      </UserSelect>
                      
                      {trialForm.target_type === 'tier' && (
                        <UserSelect
                          value={trialForm.target_tier}
                          onChange={(e) => setTrialForm({ ...trialForm, target_tier: e.target.value })}
                          style={{ direction: 'rtl' }}
                        >
                          <option value="free">חבילת ניסיון</option>
                          <option value="creator">יוצרים</option>
                          <option value="pro">יוצרים באקסטרים</option>
                          <option value="coach">מאמנים, סוכנויות ובתי ספר למשחק</option>
                          <option value="coach-pro">מאמנים, סוכנויות ובתי ספר למשחק גרסת פרו</option>
                        </UserSelect>
                      )}

                      {trialForm.target_type === 'selected' && (
                        <div style={{
                          maxHeight: '200px',
                          overflowY: 'auto',
                          border: '1px solid rgba(212, 160, 67, 0.3)',
                          borderRadius: '8px',
                          padding: '10px',
                          background: 'rgba(0, 0, 0, 0.3)',
                        }}>
                          {filteredUsersList.map((user: any) => (
                            <label key={user.user_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', cursor: 'pointer', color: '#ccc' }}>
                              <input
                                type="checkbox"
                                checked={trialForm.selected_user_ids.includes(user.user_id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTrialForm({ ...trialForm, selected_user_ids: [...trialForm.selected_user_ids, user.user_id] });
                                  } else {
                                    setTrialForm({ ...trialForm, selected_user_ids: trialForm.selected_user_ids.filter(id => id !== user.user_id) });
                                  }
                                }}
                              />
                              <span>{user.full_name || user.email} ({getTierDisplayName(user.subscription_tier)})</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <ActionButton
                      type="submit"
                      disabled={loading}
                      $variant="primary"
                      style={{ alignSelf: 'flex-start' }}
                    >
                      {loading ? 'מעניק...' : '⭐ הענק התנסות'}
                    </ActionButton>
                  </div>
                </form>

                <div>
                  <h3 style={{ color: '#D4A043', margin: '0 0 20px 0', textAlign: 'right' }}>התנסויות קיימות</h3>
                  {loading ? (
                    <LoadingSpinner>טוען התנסויות...</LoadingSpinner>
                  ) : trials.length === 0 ? (
                    <EmptyState>אין התנסויות</EmptyState>
                  ) : (
                    <UsersTable>
                      <TableHeader>
                        <div>משתמש</div>
                        <div>חבילה</div>
                        <div>תאריך התחלה</div>
                        <div>תאריך סיום</div>
                        <div>סטטוס</div>
                      </TableHeader>
                      {trials.map((trial: any) => {
                        const trialUser = users.find((u: any) => u.user_id === trial.user_id);
                        return (
                          <UserRow key={trial.id}>
                            <UserField data-label="משתמש:">{trialUser?.full_name || trialUser?.email || trial.user_id}</UserField>
                            <UserField data-label="חבילה:">{getTierDisplayName(trial.tier)}</UserField>
                            <UserField data-label="התחלה:">{new Date(trial.start_date).toLocaleDateString('he-IL')}</UserField>
                            <UserField data-label="סיום:">{new Date(trial.end_date).toLocaleDateString('he-IL')}</UserField>
                            <UserField data-label="סטטוס:">
                              <Badge $tier={trial.is_active && new Date(trial.end_date) > new Date() ? 'pro' : 'free'}>
                                {trial.is_active && new Date(trial.end_date) > new Date() ? 'פעיל' : 'פג תוקף'}
                              </Badge>
                            </UserField>
                          </UserRow>
                        );
                      })}
                    </UsersTable>
                  )}
                </div>
              </>
            )}

            {/* History Tab */}
            {announcementSubTab === 'history' && (
              <div>
                <h3 style={{ color: '#D4A043', margin: '0 0 20px 0', textAlign: 'right' }}>עדכונים שנשלחו</h3>
                {loading ? (
                  <LoadingSpinner>טוען עדכונים...</LoadingSpinner>
                ) : announcements.length === 0 ? (
                  <EmptyState>אין עדכונים שנשלחו</EmptyState>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {announcements.map((ann: any) => (
                      <div
                        key={ann.id}
                        style={{
                          background: 'rgba(26, 26, 26, 0.6)',
                          padding: '20px',
                          borderRadius: '12px',
                          border: '1px solid rgba(212, 160, 67, 0.2)',
                          textAlign: 'right',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <h4 style={{ color: '#D4A043', margin: 0, fontSize: '1.1rem' }}>{ann.title}</h4>
                          <div style={{ fontSize: '0.85rem', color: '#888' }}>
                            {new Date(ann.created_at).toLocaleDateString('he-IL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        <p style={{ color: '#ccc', margin: '10px 0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{ann.message}</p>
                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '10px' }}>
                          {ann.target_all ? 'נשלח לכל המשתמשים' : `נשלח ל-${ann.target_tier?.map((t: string) => getTierDisplayName(t)).join(', ') || 'כל המשתמשים'}`}
                          {ann.sent_at && ` • נשלח ב-${new Date(ann.sent_at).toLocaleDateString('he-IL')}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {selectedUser && userDetails && (
          <UserDetailsModal onClick={() => { setSelectedUser(null); setUserDetails(null); }}>
            <UserDetailsContent onClick={(e) => e.stopPropagation()}>
              <UserDetailsHeader>
                <h2 style={{ color: '#D4A043', margin: 0 }}>פרטי משתמש</h2>
                <CloseButton onClick={() => { setSelectedUser(null); setUserDetails(null); }}>×</CloseButton>
              </UserDetailsHeader>
              
              <DetailsSection>
                <SectionTitle>מידע בסיסי</SectionTitle>
                <DetailsGrid>
                  <DetailItem>
                    <DetailLabel>אימייל</DetailLabel>
                    <DetailValue>{userDetails.email}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>שם מלא</DetailLabel>
                    <DetailValue>{userDetails.full_name || '-'}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>דרגת מנוי</DetailLabel>
                    <DetailValue>{getTierDisplayName(userDetails.subscription_tier)}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>תפקיד</DetailLabel>
                    <DetailValue>{userDetails.role === 'admin' ? 'מנהל' : 'משתמש רגיל'}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>תאריך רישום</DetailLabel>
                    <DetailValue>{new Date(userDetails.created_at).toLocaleDateString('he-IL')}</DetailValue>
                  </DetailItem>
                </DetailsGrid>
              </DetailsSection>

              <DetailsSection>
                <SectionTitle>סטטיסטיקות שימוש</SectionTitle>
                <DetailsGrid>
                  <DetailItem>
                    <DetailLabel>סה"כ ניתוחים</DetailLabel>
                    <DetailValue>{userDetails.usage?.totalAnalyses || 0}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>סה"כ וידאו</DetailLabel>
                    <DetailValue>{userDetails.usage?.totalVideos || 0}</DetailValue>
                  </DetailItem>
                </DetailsGrid>
              </DetailsSection>

              {userDetails.analyses && userDetails.analyses.length > 0 && (
                <DetailsSection>
                  <SectionTitle>ניתוחים אחרונים ({userDetails.analyses.length})</SectionTitle>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {userDetails.analyses.slice(0, 10).map((analysis: any) => (
                      <DetailItem key={analysis.id} style={{ marginBottom: '10px' }}>
                        <DetailLabel>{analysis.track} - {new Date(analysis.created_at).toLocaleDateString('he-IL')}</DetailLabel>
                        <DetailValue>ציון ממוצע: {analysis.average_score || '-'}</DetailValue>
                      </DetailItem>
                    ))}
                  </div>
                </DetailsSection>
              )}
            </UserDetailsContent>
          </UserDetailsModal>
        )}
      </AdminContainer>
    </AppContainer>
  );
};
