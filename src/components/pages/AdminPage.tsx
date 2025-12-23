import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { getAllUsers, updateUserProfile, deleteUser, isAdmin } from '../../lib/supabase-helpers';
import type { SubscriptionTier } from '../../types';
import { SUBSCRIPTION_PLANS } from '../../constants';
import { AppContainer, Header } from '../../styles/components';
import { fadeIn } from '../../styles/globalStyles';

// Styled Components
const AdminContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
  color: #fff;
  animation: ${fadeIn} 0.5s ease-out;
`;

const StatsCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: rgba(212, 160, 67, 0.1);
  border: 1px solid rgba(212, 160, 67, 0.3);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #D4A043;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #ccc;
`;

const SearchAndFilters = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
  align-items: center;
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

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  background: ${props => 
    props.$variant === 'danger' ? '#F44336' : 
    props.$variant === 'secondary' ? 'transparent' : 
    '#D4A043'};
  border: ${props => 
    props.$variant === 'secondary' ? '1px solid #666' : 
    'none'};
  color: ${props => 
    props.$variant === 'primary' ? '#000' : 
    props.$variant === 'secondary' ? '#ccc' : 
    '#fff'};
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
  transition: all 0.2s;

  &:hover {
    background: ${props => 
      props.$variant === 'danger' ? '#d32f2f' : 
      props.$variant === 'secondary' ? 'rgba(255, 255, 255, 0.1)' : 
      '#e6b845'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
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
  grid-template-columns: 2fr 1.5fr 1.2fr 1fr 1.2fr 1.5fr;
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
  grid-template-columns: 2fr 1.5fr 1.2fr 1fr 1.2fr 1.5fr;
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

const Button = styled.button<{ $variant?: 'primary' | 'success' | 'danger' | 'secondary' }>`
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
`;

const Message = styled.div<{ $type: 'success' | 'error' }>`
  padding: 16px 20px;
  margin-bottom: 25px;
  border-radius: 8px;
  background: ${props => props.$type === 'success' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'};
  border: 1px solid ${props => props.$type === 'success' ? '#4CAF50' : '#F44336'};
  color: ${props => props.$type === 'success' ? '#4CAF50' : '#F44336'};
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

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ full_name?: string; email?: string; subscription_tier?: string; role?: string }>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    setCheckingAdmin(true);
    try {
      const adminStatus = await isAdmin();
      setIsUserAdmin(adminStatus);
      if (adminStatus) {
        loadUsers();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsUserAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers || []);
      if (!allUsers || allUsers.length === 0) {
        setMessage({ type: 'error', text: 'לא נמצאו משתמשים במערכת' });
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
      setMessage({ type: 'error', text: `שגיאה בטעינת המשתמשים: ${error.message || 'שגיאה לא ידועה'}` });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user.user_id);
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || '',
      subscription_tier: user.subscription_tier || 'free',
      role: user.role || 'user',
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

  // Calculate stats
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    free: users.filter(u => u.subscription_tier === 'free').length,
    paid: users.filter(u => u.subscription_tier !== 'free').length,
  };

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
          <h1 style={{ color: '#D4A043', margin: 0, fontSize: '2rem' }}>🛠️ פאנל ניהול</h1>
          <div style={{ width: '100px' }}></div>
        </div>
      </Header>

      <AdminContainer>
        {message && (
          <Message $type={message.type}>{message.text}</Message>
        )}

        <StatsCards>
          <StatCard>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>סה"כ משתמשים</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.admins}</StatValue>
            <StatLabel>מנהלים</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.free}</StatValue>
            <StatLabel>משתמשים חינמיים</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.paid}</StatValue>
            <StatLabel>משתמשים בתשלום</StatLabel>
          </StatCard>
        </StatsCards>

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
                        <Button $variant="primary" onClick={() => handleEdit(user)}>
                          ערוך
                        </Button>
                        <Button $variant="danger" onClick={() => handleDelete(user.user_id, user.email)}>
                          מחק
                        </Button>
                      </>
                    )}
                  </ActionButtons>
                </UserField>
              </UserRow>
            ))}
          </UsersTable>
        )}
      </AdminContainer>
    </AppContainer>
  );
};
