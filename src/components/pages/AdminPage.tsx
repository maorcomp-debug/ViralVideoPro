import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  getAllUsers, 
  updateUserProfile, 
  deleteUser, 
  getAllAnalyses,
  getAllVideos,
  getAdminStats,
  createAnnouncement,
  getAllAnnouncements,
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  grantTrialToUsers,
  getAllTrials,
} from '../../lib/supabase-helpers';
import { supabase } from '../../lib/supabase';
import type { SubscriptionTier } from '../../types';
import { SUBSCRIPTION_PLANS } from '../../constants';
import { fadeIn } from '../../styles/globalStyles';

// ============================================
// STYLED COMPONENTS
// ============================================

const AdminContainer = styled.div`
  min-height: 100vh;
  background: #000;
  color: #fff;
  padding: 20px;
  animation: ${fadeIn} 0.3s ease;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #D4A043;
`;

const BackButton = styled.button`
  background: transparent;
  border: 1px solid #fff;
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Title = styled.h1`
    color: #D4A043;
  font-size: 2rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Frank Ruhl Libre', serif;
`;

const MainNav = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid #D4A043;
  margin-bottom: 20px;
  padding-bottom: 0;
`;

const NavItem = styled.button<{ $active?: boolean }>`
  background: ${props => props.$active ? '#D4A043' : 'transparent'};
  border: none;
  color: ${props => props.$active ? '#000' : '#fff'};
  padding: 12px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  position: relative;
  border-left: ${props => props.$active ? 'none' : '1px solid #D4A043'};

  &:first-child {
    border-left: none;
  }

  &:hover {
    background: ${props => props.$active ? '#D4A043' : 'rgba(212, 160, 67, 0.2)'};
  }
`;

const SubNav = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid #D4A043;
  margin-bottom: 20px;
  padding-bottom: 0;
`;

const SubNavItem = styled.button<{ $active?: boolean }>`
  background: ${props => props.$active ? '#D4A043' : 'transparent'};
  border: none;
  color: ${props => props.$active ? '#000' : '#fff'};
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  border-left: ${props => props.$active ? 'none' : '1px solid #D4A043'};

  &:first-child {
    border-left: none;
  }

  &:hover {
    background: ${props => props.$active ? '#D4A043' : 'rgba(212, 160, 67, 0.2)'};
  }
`;

const ContentArea = styled.div`
  background: rgba(30, 30, 30, 0.8);
  border-radius: 8px;
  padding: 30px;
  min-height: 400px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: transparent;
  border: 1px solid #D4A043;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: #D4A043;
  margin-bottom: 10px;
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: #ccc;
  margin-bottom: 5px;
`;

const StatSubLabel = styled.div`
  font-size: 0.85rem;
  color: #999;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  color: #D4A043;
  font-size: 1.5rem;
  margin: 0;
  font-family: 'Frank Ruhl Libre', serif;
`;

const RefreshButton = styled.button`
  background: #D4A043;
  border: none;
  color: #000;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s;

  &:hover {
    background: #F5C842;
  }
`;

const SearchBar = styled.input`
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid #D4A043;
  border-radius: 6px;
  padding: 10px 15px;
  color: #fff;
  font-size: 0.95rem;
  width: 100%;
  max-width: 400px;
  margin-bottom: 20px;

  &::placeholder {
    color: #666;
  }

  &:focus {
    outline: none;
    border-color: #F5C842;
  }
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const FilterSelect = styled.select`
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid #D4A043;
  border-radius: 6px;
  padding: 10px 15px;
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #F5C842;
  }

  option {
    background: #1a1a1a;
    color: #fff;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
`;

const TableHeader = styled.thead`
  background: #D4A043;
  color: #000;
`;

const TableHeaderCell = styled.th`
  padding: 15px;
  text-align: right;
  font-weight: 700;
  font-size: 0.95rem;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid rgba(212, 160, 67, 0.3);

  &:hover {
    background: rgba(212, 160, 67, 0.05);
  }
`;

const TableCell = styled.td`
  padding: 15px;
  color: #ccc;
  font-size: 0.9rem;
`;

const ActionButton = styled.button<{ $variant?: 'delete' | 'primary' }>`
  background: ${props => 
    props.$variant === 'delete' ? 'transparent' : 
    props.$variant === 'primary' ? '#D4A043' : 'rgba(212, 160, 67, 0.2)'};
  border: 1px solid ${props => 
    props.$variant === 'delete' ? '#ff4444' : '#D4A043'};
  color: ${props => 
    props.$variant === 'delete' ? '#ff4444' : 
    props.$variant === 'primary' ? '#000' : '#D4A043'};
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  margin-left: 8px;
  transition: all 0.3s;

  &:hover {
    background: ${props => 
      props.$variant === 'delete' ? 'rgba(255, 68, 68, 0.2)' : 
      props.$variant === 'primary' ? '#F5C842' : 'rgba(212, 160, 67, 0.3)'};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  color: #D4A043;
  margin-bottom: 8px;
  font-size: 0.95rem;
  font-weight: 600;
`;

const FormInput = styled.input`
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid #D4A043;
  border-radius: 6px;
  padding: 12px 15px;
  color: #fff;
  font-size: 0.95rem;
  width: 100%;
  max-width: 500px;

  &::placeholder {
    color: #666;
  }

  &:focus {
    outline: none;
    border-color: #F5C842;
  }
`;

const FormTextarea = styled.textarea`
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid #D4A043;
  border-radius: 6px;
  padding: 12px 15px;
  color: #fff;
  font-size: 0.95rem;
  width: 100%;
  max-width: 500px;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;

  &::placeholder {
    color: #666;
  }

  &:focus {
    outline: none;
    border-color: #F5C842;
  }
`;

const FormSelect = styled.select`
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid #D4A043;
  border-radius: 6px;
  padding: 12px 15px;
  color: #fff;
  font-size: 0.95rem;
  width: 100%;
  max-width: 500px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #F5C842;
  }

  option {
    background: #1a1a1a;
    color: #fff;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ccc;
  font-size: 0.95rem;
  cursor: pointer;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const SubmitButton = styled.button`
  background: #D4A043;
  border: none;
  color: #000;
  padding: 12px 30px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 700;
  margin-top: 20px;
  transition: all 0.3s;

  &:hover {
    background: #F5C842;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 1.1rem;
`;

const ActionsCell = styled(TableCell)`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

// ============================================
// MAIN COMPONENT
// ============================================

type MainTab = 'overview' | 'users' | 'analyses' | 'video' | 'alerts';
type SubTab = 'send-update' | 'coupons' | 'trials' | 'history';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MainTab>('overview');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('send-update');
  
  // Data states
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Form states
  const [updateForm, setUpdateForm] = useState({
    title: '',
    content: '',
    sendToAll: true,
    attachBenefit: false,
  });
  
  const [couponForm, setCouponForm] = useState({
    benefitType: 'free_week',
    title: '',
    description: '',
    days: '',
    package: 'all',
    active: true,
  });

  useEffect(() => {
    loadData();
  }, [activeTab, activeSubTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'overview') {
        const statsData = await getAdminStats();
        setStats(statsData);
      } else if (activeTab === 'users') {
        const usersData = await getAllUsers();
        setUsers(usersData || []);
      } else if (activeTab === 'analyses') {
        const analysesData = await getAllAnalyses();
        setAnalyses(analysesData || []);
      } else if (activeTab === 'video') {
        const videosData = await getAllVideos();
        setVideos(videosData || []);
      } else if (activeTab === 'alerts') {
        if (activeSubTab === 'send-update') {
          const announcementsData = await getAllAnnouncements();
          setAnnouncements(announcementsData || []);
        } else if (activeSubTab === 'coupons') {
          const couponsData = await getAllCoupons();
          setCoupons(couponsData || []);
        } else if (activeSubTab === 'trials') {
          const trialsData = await getAllTrials();
          setTrials(trialsData || []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המשתמש?')) return;

    try {
      await deleteUser(userId);
      await loadData();
      alert('המשתמש נמחק בהצלחה');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('שגיאה במחיקת המשתמש: ' + (error.message || 'Unknown error'));
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      await updateUserProfile(userId, { role: 'admin' });
      await loadData();
      alert('המשתמש הוגדר כמנהל בהצלחה');
    } catch (error: any) {
      console.error('Error making user admin:', error);
      alert('שגיאה בהגדרת המשתמש כמנהל: ' + (error.message || 'Unknown error'));
    }
  };

  const handleEditPackage = async (userId: string, newTier: SubscriptionTier) => {
    try {
      await updateUserProfile(userId, { subscription_tier: newTier, subscription_status: 'active' });
      await loadData();
      alert('החבילה עודכנה בהצלחה');
    } catch (error: any) {
      console.error('Error updating package:', error);
      alert('שגיאה בעדכון החבילה: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSendUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAnnouncement({
        title: updateForm.title,
        message: updateForm.content,
        target_all: updateForm.sendToAll,
        target_tier: updateForm.sendToAll ? undefined : [],
      });
      alert('העדכון נשלח בהצלחה');
      setUpdateForm({ title: '', content: '', sendToAll: true, attachBenefit: false });
      await loadData();
    } catch (error: any) {
      console.error('Error sending update:', error);
      alert('שגיאה בשליחת העדכון: ' + (error.message || 'Unknown error'));
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Map benefit type to discount_type
      const discountTypeMap: Record<string, 'percentage' | 'fixed_amount' | 'free_analyses' | 'trial_subscription'> = {
        'free_week': 'trial_subscription',
        'free_month': 'trial_subscription',
        'discount_percent': 'percentage',
        'gift_analyses': 'free_analyses',
        'registration_discount': 'percentage',
      };

      const discountType = discountTypeMap[couponForm.benefitType] || 'trial_subscription';
      
      // Generate code from title
      const code = couponForm.title
        .replace(/[^א-תa-zA-Z0-9]/g, '')
        .substring(0, 10)
        .toUpperCase() || 'COUPON' + Date.now().toString().slice(-6);

      await createCoupon({
        code,
        description: couponForm.description || couponForm.title,
        discount_type: discountType,
        discount_value: discountType === 'percentage' ? 10 : undefined,
        free_analyses_count: discountType === 'free_analyses' ? (couponForm.days ? parseInt(couponForm.days) : 1) : undefined,
        trial_tier: (couponForm.package !== 'all' && ['creator', 'pro', 'coach'].includes(couponForm.package)) 
          ? couponForm.package as 'creator' | 'pro' | 'coach'
          : undefined,
        trial_duration_days: (discountType === 'trial_subscription' && couponForm.days) 
          ? parseInt(couponForm.days) 
          : (couponForm.benefitType === 'free_week' ? 7 : couponForm.benefitType === 'free_month' ? 30 : undefined),
      });
      alert('ההטבה נוצרה בהצלחה');
      setCouponForm({
        benefitType: 'free_week',
        title: '',
        description: '',
        days: '',
        package: 'all',
        active: true,
      });
      await loadData();
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      alert('שגיאה ביצירת ההטבה: ' + (error.message || 'Unknown error'));
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'all' || user.subscription_tier === tierFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesTier && matchesRole;
  });

  return (
    <AdminContainer>
      <Header>
        <BackButton onClick={() => navigate('/')}>
            ← חזרה
        </BackButton>
        <Title>
          פאנל ניהול מתקדם
          <span style={{ fontSize: '1.5rem' }}>🔧</span>
        </Title>
      </Header>

      <MainNav>
        <NavItem $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
          <span>📊</span> סקירה כללית
        </NavItem>
        <NavItem $active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
          <span>👥</span> משתמשים ({users.length})
        </NavItem>
        <NavItem $active={activeTab === 'analyses'} onClick={() => setActiveTab('analyses')}>
          <span>📄</span> ניתוחים ({analyses.length})
        </NavItem>
        <NavItem $active={activeTab === 'video'} onClick={() => setActiveTab('video')}>
          <span>🎬</span> וידאו ({videos.length})
        </NavItem>
        <NavItem $active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')}>
          <span>🔔</span> התראות והטבות
        </NavItem>
      </MainNav>

      {activeTab === 'alerts' && (
        <SubNav>
          <SubNavItem $active={activeSubTab === 'send-update'} onClick={() => setActiveSubTab('send-update')}>
            → שליחת עדכון
          </SubNavItem>
          <SubNavItem $active={activeSubTab === 'coupons'} onClick={() => setActiveSubTab('coupons')}>
            🏷️ ניהול קופונים
          </SubNavItem>
          <SubNavItem $active={activeSubTab === 'trials'} onClick={() => setActiveSubTab('trials')}>
            ⭐ ניהול התנסויות
          </SubNavItem>
          <SubNavItem $active={activeSubTab === 'history'} onClick={() => setActiveSubTab('history')}>
            📋 היסטוריה
          </SubNavItem>
        </SubNav>
      )}

      <ContentArea>
        {activeTab === 'overview' && (
          <>
            <StatsGrid>
              <StatCard>
                <StatValue>{stats?.totalVideos || 0}</StatValue>
                <StatLabel>סה"כ וידאו</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats?.totalAnalyses || 0}</StatValue>
                <StatLabel>סה"כ ניתוחים</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats?.totalUsers || 0}</StatValue>
                <StatLabel>סה"כ משתמשים</StatLabel>
                {stats?.recentUsers > 0 && (
                  <StatSubLabel>{stats.recentUsers} נרשמו ב-30 יום האחרונים</StatSubLabel>
                )}
              </StatCard>
              <StatCard>
                <StatValue>{stats?.roleDistribution?.admin || 0}</StatValue>
                <StatLabel>מנהלים</StatLabel>
              </StatCard>
            </StatsGrid>
            <div style={{ borderTop: '1px solid #D4A043', paddingTop: '20px' }}>
              <SectionTitle>פילוח לפי דרגות מנוי</SectionTitle>
              {/* Tier distribution will be added here */}
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <>
            <SectionHeader>
              <SectionTitle>משתמשים ({filteredUsers.length})</SectionTitle>
              <RefreshButton onClick={loadData}>
                🔄 רענן
              </RefreshButton>
            </SectionHeader>
            <SearchBar
                type="text"
                placeholder="חפש לפי אימייל או שם..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            <FiltersRow>
              <FilterSelect value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
                <option value="all">כל הדרגות</option>
                <option value="free">ניסיון</option>
                <option value="creator">יוצרים</option>
                <option value="pro">יוצרים באקסטרים</option>
                <option value="coach">מאמנים</option>
                <option value="coach-pro">מאמנים פרו</option>
              </FilterSelect>
              <FilterSelect value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">כל התפקידים</option>
                <option value="user">משתמש</option>
                <option value="admin">מנהל</option>
              </FilterSelect>
            </FiltersRow>
            <Table>
                <TableHeader>
                <tr>
                  <TableHeaderCell>אימייל</TableHeaderCell>
                  <TableHeaderCell>תפקיד</TableHeaderCell>
                  <TableHeaderCell>חבילה</TableHeaderCell>
                  <TableHeaderCell>תאריך הרשמה</TableHeaderCell>
                  <TableHeaderCell>פעולות</TableHeaderCell>
                </tr>
                </TableHeader>
              <tbody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role || 'user'}</TableCell>
                    <TableCell>{SUBSCRIPTION_PLANS[user.subscription_tier]?.name || user.subscription_tier}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString('he-IL')}</TableCell>
                    <ActionsCell>
                      <ActionButton $variant="delete" onClick={() => handleDeleteUser(user.user_id)}>
                        מחק
                      </ActionButton>
                      {user.role !== 'admin' && (
                        <ActionButton onClick={() => handleMakeAdmin(user.user_id)}>
                          הפוך לאדמין
                        </ActionButton>
                      )}
                      <ActionButton $variant="primary" onClick={() => {
                        const newTier = prompt('הזן חבילה חדשה (free, creator, pro, coach, coach-pro):');
                        if (newTier && ['free', 'creator', 'pro', 'coach', 'coach-pro'].includes(newTier)) {
                          handleEditPackage(user.user_id, newTier as SubscriptionTier);
                        }
                      }}>
                        ערוך חבילה
                      </ActionButton>
                    </ActionsCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </>
        )}

        {activeTab === 'analyses' && (
          <>
            <SectionHeader>
              <SectionTitle>ניתוחים ({analyses.length})</SectionTitle>
              <RefreshButton onClick={loadData}>
                🔄 רענן
              </RefreshButton>
            </SectionHeader>
            <Table>
                <TableHeader>
                <tr>
                  <TableHeaderCell>משתמש</TableHeaderCell>
                  <TableHeaderCell>טרק</TableHeaderCell>
                  <TableHeaderCell>ציון ממוצע</TableHeaderCell>
                  <TableHeaderCell>תאריך</TableHeaderCell>
                </tr>
                </TableHeader>
              <tbody>
                {analyses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>
                      אין ניתוחים להצגה
                    </TableCell>
                  </TableRow>
                ) : (
                  analyses.map((analysis) => (
                    <TableRow key={analysis.id}>
                      <TableCell>{analysis.user_id}</TableCell>
                      <TableCell>{analysis.track}</TableCell>
                      <TableCell>{analysis.average_score || '-'}</TableCell>
                      <TableCell>{new Date(analysis.created_at).toLocaleDateString('he-IL')}</TableCell>
                    </TableRow>
                  ))
                )}
              </tbody>
            </Table>
          </>
        )}

        {activeTab === 'video' && (
          <>
            <SectionHeader>
              <SectionTitle>וידאו ({videos.length})</SectionTitle>
              <RefreshButton onClick={loadData}>
                🔄 רענן
              </RefreshButton>
            </SectionHeader>
            <Table>
                <TableHeader>
                <tr>
                  <TableHeaderCell>תאריך</TableHeaderCell>
                  <TableHeaderCell>משך</TableHeaderCell>
                  <TableHeaderCell>גודל</TableHeaderCell>
                  <TableHeaderCell>שם קובץ</TableHeaderCell>
                </tr>
                </TableHeader>
              <tbody>
                {videos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>
                      אין וידאו להצגה
                    </TableCell>
                  </TableRow>
                ) : (
                  videos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell>{new Date(video.created_at).toLocaleDateString('he-IL')}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{video.file_name || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </tbody>
            </Table>
          </>
        )}

        {activeTab === 'alerts' && activeSubTab === 'send-update' && (
          <>
            <SectionTitle>שליחת עדכון</SectionTitle>
            <form onSubmit={handleSendUpdate}>
              <FormGroup>
                <FormLabel>כותרת העדכון *</FormLabel>
                <FormInput
                    type="text"
                    placeholder="לדוגמה: עדכון חדש באפליקציה!"
                  value={updateForm.title}
                  onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                    required
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>תוכן העדכון *</FormLabel>
                <FormTextarea
                    placeholder="הזן את תוכן העדכון..."
                  value={updateForm.content}
                  onChange={(e) => setUpdateForm({ ...updateForm, content: e.target.value })}
                    required
                />
              </FormGroup>
              <FormGroup>
                <CheckboxLabel>
                  <Checkbox
                        type="checkbox"
                    checked={updateForm.sendToAll}
                    onChange={(e) => setUpdateForm({ ...updateForm, sendToAll: e.target.checked })}
                  />
                  לכל המשתמשים
                </CheckboxLabel>
              </FormGroup>
              <FormGroup>
                <CheckboxLabel>
                  <Checkbox
                              type="checkbox"
                    checked={updateForm.attachBenefit}
                    onChange={(e) => setUpdateForm({ ...updateForm, attachBenefit: e.target.checked })}
                  />
                  צרף הטבה לעדכון
                </CheckboxLabel>
              </FormGroup>
              <SubmitButton type="submit">שלח</SubmitButton>
            </form>
          </>
        )}

        {activeTab === 'alerts' && activeSubTab === 'coupons' && (
          <>
            <SectionTitle>ניהול קופונים</SectionTitle>
            <form onSubmit={handleCreateCoupon}>
              <h3 style={{ color: '#D4A043', marginBottom: '20px' }}>יצירת הטבה חדשה</h3>
              <FormGroup>
                <FormLabel>סוג ההטבה *</FormLabel>
                <FormSelect
                  value={couponForm.benefitType}
                  onChange={(e) => setCouponForm({ ...couponForm, benefitType: e.target.value })}
                              required
                >
                  <option value="free_week">שבוע חינם</option>
                  <option value="free_month">חודש חינם</option>
                  <option value="discount_percent">% הנחה</option>
                  <option value="gift_analyses">ניתוחים מתנה</option>
                  <option value="registration_discount">קופון הנחה להרשמה</option>
                </FormSelect>
              </FormGroup>
              <FormGroup>
                <FormLabel>כותרת *</FormLabel>
                <FormInput
                          type="text"
                  placeholder="לדוגמה: שבוע חינם על חבילת יוצרים"
                  value={couponForm.title}
                  onChange={(e) => setCouponForm({ ...couponForm, title: e.target.value })}
                          required
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>תיאור</FormLabel>
                <FormTextarea
                  placeholder="תיאור מפורט של ההטבה..."
                          value={couponForm.description}
                          onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>מספר ימים</FormLabel>
                <FormInput
                              type="number"
                  value={couponForm.days}
                  onChange={(e) => setCouponForm({ ...couponForm, days: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>חבילה (אופציונלי)</FormLabel>
                <FormSelect
                  value={couponForm.package}
                  onChange={(e) => setCouponForm({ ...couponForm, package: e.target.value })}
                >
                  <option value="all">כל החבילות</option>
                  <option value="free">נסיון</option>
                                          <option value="creator">יוצרים</option>
                                          <option value="pro">יוצרים באקסטרים</option>
                  <option value="coach">מאמנים</option>
                  <option value="coach-pro">מאמנים פרו</option>
                </FormSelect>
              </FormGroup>
              <FormGroup>
                <CheckboxLabel>
                  <Checkbox
                                type="checkbox"
                    checked={couponForm.active}
                    onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })}
                  />
                  פעיל
                </CheckboxLabel>
              </FormGroup>
              <SubmitButton type="submit">צור הטבה</SubmitButton>
                </form>
              </>
            )}

        {activeTab === 'alerts' && activeSubTab === 'trials' && (
          <EmptyState>תת-טאב זה עדיין בפיתוח</EmptyState>
        )}

        {activeTab === 'alerts' && activeSubTab === 'history' && (
          <EmptyState>תת-טאב זה עדיין בפיתוח</EmptyState>
        )}
      </ContentArea>
      </AdminContainer>
  );
};
