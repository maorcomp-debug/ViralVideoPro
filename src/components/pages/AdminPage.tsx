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
    if (props.$tier === 'coach') return 'rgba(212, 160, 67, 0.2)';
    if (props.$tier === 'pro') return 'rgba(255, 193, 7, 0.2)';
    if (props.$tier === 'creator') return 'rgba(156, 39, 176, 0.2)';
    return 'rgba(128, 128, 128, 0.2)';
  }};
  color: ${props => {
    if (props.$role === 'admin') return '#F44336';
    if (props.$tier === 'coach') return '#D4A043';
    if (props.$tier === 'pro') return '#FFC107';
    if (props.$tier === 'creator') return '#9C27B0';
    return '#888';
  }};
  border: 1px solid ${props => {
    if (props.$role === 'admin') return '#F44336';
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

type TabType = 'overview' | 'users' | 'analyses' | 'videos';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

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
    return SUBSCRIPTION_PLANS[tier as SubscriptionTier]?.name || tier;
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
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
                <option value="coach">מאמנים</option>
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
                משתמשים ({filteredUsers.length})
              </h3>
            </HeaderActions>

            {loading ? (
              <LoadingSpinner>טוען משתמשים...</LoadingSpinner>
            ) : filteredUsers.length === 0 ? (
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
                  <div>סטטוס מנוי</div>
                  <div>תאריך רישום</div>
                  <div>פעולות</div>
                </TableHeader>
                {filteredUsers.map((user) => (
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
