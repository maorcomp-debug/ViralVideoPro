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
  getUserUsageStats,
  getUsageForCurrentPeriod,
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
// ADMIN DATA CACHE HELPERS
// ============================================

const ADMIN_CACHE_KEY = 'viralypro_admin_cache';
const CACHE_DURATION = 0; // DISABLED: No cache - always fetch fresh data directly from Supabase

interface AdminCache {
  stats: any;
  users: any[];
  analyses: any[];
  videos: any[];
  announcements: any[];
  coupons: any[];
  trials: any[];
  timestamp: number;
}

const saveAdminCache = (data: Partial<AdminCache>) => {
  try {
    const existing = loadAdminCache();
    const updated = {
      ...existing,
      ...data,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(updated));
  } catch (error) {
    // Silently fail - cache is not critical
  }
};

const loadAdminCache = (): Partial<AdminCache> | null => {
  try {
    const cached = sessionStorage.getItem(ADMIN_CACHE_KEY);
    if (!cached) return null;

    const data = JSON.parse(cached) as AdminCache;
    const age = Date.now() - data.timestamp;

    if (age > CACHE_DURATION) {
      sessionStorage.removeItem(ADMIN_CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    // Silently fail - cache is not critical
    return null;
  }
};

const clearAdminCache = () => {
  try {
    sessionStorage.removeItem(ADMIN_CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear admin cache:', error);
  }
};

// ============================================
// STYLED COMPONENTS
// ============================================

const AdminContainer = styled.div`
  min-height: 100vh;
  background: #000;
  color: #fff;
  padding: 20px;
  animation: ${fadeIn} 0.3s ease;

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #D4A043;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
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

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const MainNav = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid #D4A043;
  margin-bottom: 20px;
  padding-bottom: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 768px) {
    flex-wrap: nowrap;
    scrollbar-width: thin;
    scrollbar-color: #D4A043 transparent;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #D4A043;
      border-radius: 2px;
    }
  }
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
  white-space: nowrap;
  flex-shrink: 0;

  &:first-child {
    border-left: none;
  }

  &:hover {
    background: ${props => props.$active ? '#D4A043' : 'rgba(212, 160, 67, 0.2)'};
  }

  @media (max-width: 768px) {
    padding: 10px 15px;
    font-size: 0.85rem;
  }
`;

const SubNav = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid #D4A043;
  margin-bottom: 20px;
  padding-bottom: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 768px) {
    flex-wrap: nowrap;
    scrollbar-width: thin;
    scrollbar-color: #D4A043 transparent;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #D4A043;
      border-radius: 2px;
    }
  }
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
  white-space: nowrap;
  flex-shrink: 0;

  &:first-child {
    border-left: none;
  }

  &:hover {
    background: ${props => props.$active ? '#D4A043' : 'rgba(212, 160, 67, 0.2)'};
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 0.8rem;
  }
`;

const ContentArea = styled.div`
  background: rgba(30, 30, 30, 0.8);
  border-radius: 8px;
  padding: 30px;
  min-height: 400px;
  overflow-x: auto;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }
`;

const StatCard = styled.div`
  background: transparent;
  border: 1px solid #D4A043;
  border-radius: 8px;
  padding: 24px;
  text-align: center;

  @media (max-width: 768px) {
    padding: 12px 8px;
  }
`;

const StatValue = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: #D4A043;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    font-size: 1.8rem;
    margin-bottom: 5px;
  }
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: #ccc;
  margin-bottom: 5px;

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
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

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
`;

const SectionTitle = styled.h2`
  color: #D4A043;
  font-size: 1.5rem;
  margin: 0;
  font-family: 'Frank Ruhl Libre', serif;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
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

  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 0.8rem;
    width: 100%;
    justify-content: center;
  }

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

  @media (max-width: 768px) {
    font-size: 0.85rem;
    padding: 8px 12px;
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

  @media (max-width: 768px) {
    font-size: 0.85rem;
    padding: 8px 12px;
    min-width: 120px;
  }

  &:focus {
    outline: none;
    border-color: #F5C842;
  }

  option {
    background: #1a1a1a;
    color: #fff;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-top: 20px;

  @media (max-width: 768px) {
    margin: 20px -16px 0 -16px;
    padding: 0 16px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;

  @media (max-width: 768px) {
    min-width: 100%;
    font-size: 0.7rem;
    table-layout: fixed;
  }
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

  @media (max-width: 768px) {
    padding: 6px 4px;
    font-size: 0.65rem;
    word-wrap: break-word;
    max-width: none;
  }
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

  @media (max-width: 768px) {
    padding: 6px 4px;
    font-size: 0.65rem;
    word-wrap: break-word;
    overflow: hidden;
    text-overflow: ellipsis;
  }
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

  @media (max-width: 768px) {
    font-size: 0.6rem;
    padding: 3px 5px;
    margin-left: 2px;
    border-radius: 4px;
    white-space: nowrap;
  }

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

  @media (max-width: 768px) {
    padding: 10px 12px;
    font-size: 0.85rem;
    max-width: 100%;
  }

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

  @media (max-width: 768px) {
    padding: 10px 12px;
    font-size: 0.85rem;
    max-width: 100%;
    min-height: 100px;
  }

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

  @media (max-width: 768px) {
    padding: 10px 12px;
    font-size: 0.85rem;
    max-width: 100%;
  }

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

  @media (max-width: 768px) {
    width: 100%;
    padding: 10px 20px;
    font-size: 0.9rem;
  }

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

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: ${fadeIn} 0.2s ease;
`;

const ModalContent = styled.div`
  background: #1a1a1a;
  border: 2px solid #D4A043;
  border-radius: 12px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: ${fadeIn} 0.3s ease;
`;

const ModalTitle = styled.h2`
  color: #D4A043;
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  text-align: center;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  background: rgba(212, 160, 67, 0.2);
  border: 1px solid #D4A043;
  color: #D4A043;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s;

  &:hover {
    background: rgba(212, 160, 67, 0.3);
  }
`;

const ConfirmButton = styled.button`
  background: #D4A043;
  border: none;
  color: #000;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 700;
  transition: all 0.3s;

  &:hover {
    background: #F5C842;
  }
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
  const [userUsageMap, setUserUsageMap] = useState<Record<string, { analysesUsed: number; maxAnalyses: number }>>({});
  
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
    // שדות נוספים לשליטה בסוגי ההטבות
    percent: '', // עבור % הנחה
    analysesCount: '', // עבור "ניתוחים מתנה"
    registrationType: 'percentage' as 'percentage' | 'fixed_amount' | 'free_analyses',
    registrationValue: '', // ערך ההנחה (אחוז או סכום)
    registrationAnalysesCount: '', // מספר ניתוחים במתנה בהרשמה
  });

  // Loading state
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Package selection modal state
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionTier | ''>('');

  const loadData = async (forceRefresh = false) => {
    // Allow force refresh even if already loading
    if (isLoadingData && !forceRefresh) {
      return;
    }
    
    // CACHE DISABLED: Always fetch fresh data directly from Supabase for instant updates
    // No cache loading - go straight to database
    
    setIsLoadingData(true);
    
    try {
      // Always clear cache to ensure fresh data
      clearAdminCache();
      
      // Load data directly from Supabase - no cache, always fresh
      // CRITICAL: Skip admin checks - we're already in AdminPage, so user is admin
      // This dramatically speeds up loading by skipping isAdmin() checks and session timeouts
      if (activeTab === 'overview') {
        const statsData = await getAdminStats(true); // skipAdminCheck = true
        setStats(statsData);
      } else if (activeTab === 'users') {
        const usersData = await getAllUsers(true); // skipAdminCheck = true
        if (usersData) {
          setUsers(usersData);
        }
        
        // Load usage stats for all users in background (non-blocking)
        // IMPORTANT: Count analyses only from subscription_start_date (not from month start)
        // This ensures analyses from previous package don't count towards new package
        if (usersData && usersData.length > 0) {
          // Start usage calculation in background
          (async () => {
            try {
              // Get all analyses (will filter by subscription_start_date per user)
              const allAnalysesData = await getAllAnalyses(true); // skipAdminCheck = true
              
              // Build usage map - count analyses only from subscription_start_date for each user
              const usageMap: Record<string, { analysesUsed: number; maxAnalyses: number }> = {};
              usersData.forEach((user: any) => {
                const plan = SUBSCRIPTION_PLANS[user.subscription_tier as SubscriptionTier];
                const maxAnalyses = plan?.limits.maxAnalysesPerPeriod || 0;
                
                // Count analyses from subscription_start_date (or month start if no start date)
                const periodStart = user.subscription_start_date 
                  ? new Date(user.subscription_start_date)
                  : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                
                const periodEnd = user.subscription_end_date
                  ? new Date(user.subscription_end_date)
                  : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
                
                // Count only analyses within the subscription period
                const userAnalyses = allAnalysesData.filter((a: any) => {
                  if (a.user_id !== user.user_id) return false;
                  const createdAt = new Date(a.created_at);
                  return createdAt >= periodStart && createdAt <= periodEnd;
                });
                
                usageMap[user.user_id] = {
                  analysesUsed: userAnalyses.length,
                  maxAnalyses: maxAnalyses === -1 ? -1 : maxAnalyses
                };
              });
              
              setUserUsageMap(usageMap);
            } catch (error) {
              // Don't block UI if usage stats fail
            }
          })();
        }
      } else if (activeTab === 'analyses') {
        const analysesData = await getAllAnalyses(true); // skipAdminCheck = true
        setAnalyses(analysesData || []);
      } else if (activeTab === 'video') {
        const videosData = await getAllVideos(true); // skipAdminCheck = true
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
      
      // CRITICAL: Load ALL other data in background (non-blocking) to update tab counts
      // This ensures tab counts are updated without blocking the current tab
      // Skip admin checks for speed - we're already in AdminPage
      Promise.all([
        getAdminStats(true).then(data => { if (activeTab !== 'overview') setStats(data); }).catch(() => {}),
        getAllUsers(true).then(data => { if (data && activeTab !== 'users') setUsers(data); }).catch(() => {}),
        getAllAnalyses(true).then(data => { if (activeTab !== 'analyses') setAnalyses(data || []); }).catch(() => {}),
        getAllVideos(true).then(data => { if (activeTab !== 'video') setVideos(data || []); }).catch(() => {}),
        getAllAnnouncements().then(data => { if (activeSubTab !== 'send-update') setAnnouncements(data || []); }).catch(() => {}),
        getAllCoupons().then(data => { if (activeSubTab !== 'coupons') setCoupons(data || []); }).catch(() => {}),
        getAllTrials().then(data => { if (activeSubTab !== 'trials') setTrials(data || []); }).catch(() => {})
      ]).catch(() => {
        // Ignore errors in background loading - main tab data already loaded
      });
      
    } catch (error: any) {
      console.error('❌ Error loading admin data:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      // Don't show alert - it's annoying. Just log the error.
      // The empty tables will show the user that data didn't load.
    } finally {
      setIsLoadingData(false);
    }
  };

  // Load fresh data on mount
  useEffect(() => {
    loadData(true);
  }, []);

  // Load fresh data whenever tab changes
  useEffect(() => {
    // Force refresh when tab changes
    loadData(true);
  }, [activeTab, activeSubTab]);
  
  // Listen for ALL events that should trigger refresh
  useEffect(() => {
    const handleDataChange = (e: StorageEvent | Event) => {
      const eventType = (e as CustomEvent).type || (e as StorageEvent).key;
      
      // Refresh data for any relevant event
      if (eventType === 'analysis_saved' || 
          eventType === 'usage_updated' ||
          eventType === 'admin_data_refresh' ||
          (e as StorageEvent).key === 'analysis_saved') {
        // Clear cache and refresh immediately - no delays needed
        clearAdminCache();
        loadData(true); // Force refresh immediately
      }
    };
    
    // Listen to multiple event types
    window.addEventListener('storage', handleDataChange);
    window.addEventListener('analysis_saved', handleDataChange);
    window.addEventListener('usage_updated', handleDataChange);
    window.addEventListener('admin_data_refresh', handleDataChange);
    
    // Polling disabled - updates happen immediately via events
    // No need for polling when cache is disabled and events trigger immediate refreshes
    
    return () => {
      window.removeEventListener('storage', handleDataChange);
      window.removeEventListener('analysis_saved', handleDataChange);
      window.removeEventListener('usage_updated', handleDataChange);
      window.removeEventListener('admin_data_refresh', handleDataChange);
      // No pollInterval to clear - polling is disabled
    };
  }, [activeTab]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המשתמש?')) return;

    try {
      // Delete user directly using admin client (skipAdminCheck = true for speed)
      await deleteUser(userId, true);
      // Clear cache and reload immediately - no delays
      clearAdminCache();
      await loadData(true); // Force refresh to get fresh data
      alert('המשתמש נמחק בהצלחה');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('שגיאה במחיקת המשתמש: ' + (error.message || 'Unknown error'));
      // Reload data even on error to ensure UI is in sync
      clearAdminCache();
      loadData(true).catch(() => {});
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
      // Update local state IMMEDIATELY for instant feedback (optimistic update)
      const updatedUsers = users.map(user => 
        user.user_id === userId 
          ? { ...user, subscription_tier: newTier, subscription_status: 'active' }
          : user
      );
      setUsers(updatedUsers);
      
      // Cache disabled - no need to update cache
      
      // Close modal immediately
      setShowPackageModal(false);
      setSelectedUserId(null);
      setSelectedPackage('');
      
      // Update database and then refresh
      try {
        await updateUserProfile(userId, { subscription_tier: newTier, subscription_status: 'active' });
        
        // After successful DB update, refresh data to ensure consistency
        const freshUsersData = await getAllUsers();
        if (freshUsersData) {
          setUsers(freshUsersData);
          // Cache disabled - no need to update cache
          
          // Recalculate usage stats with new package data
          // IMPORTANT: Count analyses only from subscription_start_date (not from month start)
          // This ensures analyses from previous package don't count towards new package
          if (freshUsersData.length > 0) {
            // Get all analyses (will filter by subscription_start_date per user)
            const allAnalysesData = await getAllAnalyses();
            
            // Build usage map with updated package data
            // Count analyses only from subscription_start_date for each user
            const usageMap: Record<string, { analysesUsed: number; maxAnalyses: number }> = {};
            freshUsersData.forEach((user: any) => {
              const plan = SUBSCRIPTION_PLANS[user.subscription_tier as SubscriptionTier];
              const maxAnalyses = plan?.limits.maxAnalysesPerPeriod || 0;
              
              // Count analyses from subscription_start_date (or month start if no start date)
              const periodStart = user.subscription_start_date 
                ? new Date(user.subscription_start_date)
                : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
              
              const periodEnd = user.subscription_end_date
                ? new Date(user.subscription_end_date)
                : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
              
              // Count only analyses within the subscription period
              const userAnalyses = allAnalysesData.filter((a: any) => {
                if (a.user_id !== user.user_id) return false;
                const createdAt = new Date(a.created_at);
                return createdAt >= periodStart && createdAt <= periodEnd;
              });
              
              usageMap[user.user_id] = {
                analysesUsed: userAnalyses.length,
                maxAnalyses: maxAnalyses === -1 ? -1 : maxAnalyses
              };
            });
            
            setUserUsageMap(usageMap);
          }
        }
        
        alert('החבילה עודכנה בהצלחה\n\nעם השדרוג – נפתחת לך מכסה חדשה בהתאם לחבילה');
      } catch (dbError: any) {
        // If DB update fails, revert optimistic update
        loadData(true).catch(() => {});
        alert('שגיאה בעדכון החבילה: ' + (dbError.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error updating package:', error);
      // Revert on error
      loadData(true).catch(() => {});
      alert('שגיאה בעדכון החבילה: ' + (error.message || 'Unknown error'));
    }
  };
  
  const openPackageModal = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    setSelectedUserId(userId);
    setSelectedPackage((user?.subscription_tier as SubscriptionTier) || '');
    setShowPackageModal(true);
  };
  
  const handleConfirmPackage = () => {
    if (selectedUserId && selectedPackage && ['free', 'creator', 'pro', 'coach', 'coach-pro'].includes(selectedPackage)) {
      handleEditPackage(selectedUserId, selectedPackage);
    }
  };
  
  // Check if package selection has changed from original
  const getOriginalPackage = () => {
    if (!selectedUserId) return '';
    const user = users.find(u => u.user_id === selectedUserId);
    return (user?.subscription_tier as SubscriptionTier) || '';
  };
  
  const hasPackageChanged = selectedPackage && selectedPackage !== getOriginalPackage();

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
      // Map benefit type to discount_type + ערכים מספריים
      let discountType: 'percentage' | 'fixed_amount' | 'free_analyses' | 'trial_subscription' = 'trial_subscription';
      let discountValue: number | undefined;
      let freeAnalysesCount: number | undefined;

      if (couponForm.benefitType === 'discount_percent') {
        discountType = 'percentage';
        discountValue = couponForm.percent ? parseInt(couponForm.percent, 10) : 10;
      } else if (couponForm.benefitType === 'gift_analyses') {
        discountType = 'free_analyses';
        freeAnalysesCount = couponForm.analysesCount ? parseInt(couponForm.analysesCount, 10) : 1;
      } else if (couponForm.benefitType === 'registration_discount') {
        discountType = couponForm.registrationType;
        if (couponForm.registrationType === 'percentage' || couponForm.registrationType === 'fixed_amount') {
          discountValue = couponForm.registrationValue ? parseFloat(couponForm.registrationValue) : undefined;
        }
        if (couponForm.registrationType === 'free_analyses') {
          freeAnalysesCount = couponForm.registrationAnalysesCount
            ? parseInt(couponForm.registrationAnalysesCount, 10)
            : 1;
        }
      } else {
        discountType = 'trial_subscription';
      }
      
      // Generate code from title
      const code = couponForm.title
        .replace(/[^א-תa-zA-Z0-9]/g, '')
        .substring(0, 10)
        .toUpperCase() || 'COUPON' + Date.now().toString().slice(-6);

      await createCoupon({
        code,
        description: couponForm.description || couponForm.title,
        discount_type: discountType,
        discount_value: discountValue,
        free_analyses_count: freeAnalysesCount,
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
        percent: '',
        analysesCount: '',
        registrationType: 'percentage',
        registrationValue: '',
        registrationAnalysesCount: '',
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
              <RefreshButton onClick={() => loadData(true)}>
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
            <TableWrapper>
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
                  {filteredUsers.map((user) => {
                    const plan = SUBSCRIPTION_PLANS[user.subscription_tier as SubscriptionTier];
                    const maxAnalyses = plan?.limits.maxAnalysesPerPeriod || 0;
                    const usage = userUsageMap[user.user_id] || { analysesUsed: 0, maxAnalyses: 0 };
                    const isOverLimit = maxAnalyses !== -1 && usage.analysesUsed >= usage.maxAnalyses;
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role || 'user'}</TableCell>
                        <TableCell>
                          {SUBSCRIPTION_PLANS[user.subscription_tier]?.name || user.subscription_tier}
                          {maxAnalyses !== -1 && (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: isOverLimit ? '#F44336' : '#999', 
                              display: 'block', 
                              marginTop: '4px',
                              fontWeight: isOverLimit ? 700 : 400
                            }}>
                              ({usage.analysesUsed}/{usage.maxAnalyses} ניתוחים בחודש)
                              {isOverLimit && ' ⚠️ הגבלה הגיעה'}
                            </span>
                          )}
                          {/* Removed upgrade message from admin panel - not needed here */}
                        </TableCell>
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
                          <ActionButton $variant="primary" onClick={() => openPackageModal(user.user_id)}>
                            ערוך חבילה
                          </ActionButton>
                        </ActionsCell>
                      </TableRow>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrapper>
          </>
        )}

        {activeTab === 'analyses' && (
          <>
            <SectionHeader>
              <SectionTitle>ניתוחים ({analyses.length})</SectionTitle>
              <RefreshButton onClick={() => loadData(true)}>
                🔄 רענן
              </RefreshButton>
            </SectionHeader>
            <TableWrapper>
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
            </TableWrapper>
          </>
        )}

        {activeTab === 'video' && (
          <>
            <SectionHeader>
              <SectionTitle>וידאו ({videos.length})</SectionTitle>
              <RefreshButton onClick={() => loadData(true)}>
                🔄 רענן
              </RefreshButton>
            </SectionHeader>
            <TableWrapper>
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
            </TableWrapper>
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

      {/* שדות דינמיים בהתאם לסוג ההטבה */}
      {couponForm.benefitType === 'discount_percent' && (
        <FormGroup>
          <FormLabel>אחוז הנחה (%)</FormLabel>
          <FormInput
            type="number"
            min="1"
            max="100"
            placeholder="לדוגמה: 20"
            value={couponForm.percent}
            onChange={(e) => setCouponForm({ ...couponForm, percent: e.target.value })}
          />
        </FormGroup>
      )}

      {couponForm.benefitType === 'gift_analyses' && (
        <FormGroup>
          <FormLabel>מספר ניתוחים במתנה</FormLabel>
          <FormInput
            type="number"
            min="1"
            placeholder="לדוגמה: 3"
            value={couponForm.analysesCount}
            onChange={(e) => setCouponForm({ ...couponForm, analysesCount: e.target.value })}
          />
        </FormGroup>
      )}

      {couponForm.benefitType === 'registration_discount' && (
        <>
          <FormGroup>
            <FormLabel>סוג ההנחה להרשמה</FormLabel>
            <FormSelect
              value={couponForm.registrationType}
              onChange={(e) => setCouponForm({ 
                ...couponForm, 
                registrationType: e.target.value as 'percentage' | 'fixed_amount' | 'free_analyses',
                registrationValue: '',
                registrationAnalysesCount: '',
              })}
            >
              <option value="percentage">אחוז הנחה</option>
              <option value="fixed_amount">סכום הנחה</option>
              <option value="free_analyses">ניתוחים מתנה</option>
            </FormSelect>
          </FormGroup>

          {couponForm.registrationType === 'percentage' && (
            <FormGroup>
              <FormLabel>אחוז הנחה להרשמה (%)</FormLabel>
              <FormInput
                type="number"
                min="1"
                max="100"
                placeholder="לדוגמה: 15"
                value={couponForm.registrationValue}
                onChange={(e) => setCouponForm({ ...couponForm, registrationValue: e.target.value })}
              />
            </FormGroup>
          )}

          {couponForm.registrationType === 'fixed_amount' && (
            <FormGroup>
              <FormLabel>סכום הנחה להרשמה (₪)</FormLabel>
              <FormInput
                type="number"
                min="1"
                placeholder="לדוגמה: 30"
                value={couponForm.registrationValue}
                onChange={(e) => setCouponForm({ ...couponForm, registrationValue: e.target.value })}
              />
            </FormGroup>
          )}

          {couponForm.registrationType === 'free_analyses' && (
            <FormGroup>
              <FormLabel>מספר ניתוחים במתנה בהרשמה</FormLabel>
              <FormInput
                type="number"
                min="1"
                placeholder="לדוגמה: 2"
                value={couponForm.registrationAnalysesCount}
                onChange={(e) => setCouponForm({ ...couponForm, registrationAnalysesCount: e.target.value })}
              />
            </FormGroup>
          )}
        </>
      )}
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
      
      {/* Package Selection Modal */}
      {showPackageModal && selectedUserId && (
        <ModalOverlay onClick={() => {
          setShowPackageModal(false);
          setSelectedUserId(null);
        }}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>בחר חבילה חדשה</ModalTitle>
            <FormGroup>
              <FormLabel>חבילה</FormLabel>
              <FormSelect
                id="package-select"
                value={selectedPackage}
                onChange={(e) => {
                  setSelectedPackage(e.target.value as SubscriptionTier);
                }}
                autoFocus
              >
                <option value="">-- בחר חבילה --</option>
                <option value="free">נסיון</option>
                <option value="creator">יוצרים</option>
                <option value="pro">יוצרים באקסטרים</option>
                <option value="coach">מאמנים, סוכנויות ובתי ספר למשחק</option>
                <option value="coach-pro">מאמנים, סוכנויות ובתי ספר למשחק גרסת פרו</option>
              </FormSelect>
            </FormGroup>
            <ModalButtons>
              <CancelButton onClick={() => {
                setShowPackageModal(false);
                setSelectedUserId(null);
                setSelectedPackage('');
              }}>
                ביטול
              </CancelButton>
              <ConfirmButton 
                onClick={handleConfirmPackage}
                disabled={!selectedPackage || !hasPackageChanged || !['free', 'creator', 'pro', 'coach', 'coach-pro'].includes(selectedPackage)}
              >
                אישור
              </ConfirmButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
      </AdminContainer>
  );
};
