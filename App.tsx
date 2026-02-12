
import React, { useState, useEffect, Suspense } from 'react';
import Layout from './components/Layout.tsx';
// Lazy load pages to reduce initial bundle size
const XPro = React.lazy(() => import('./pages/XPro.tsx'));
const Reports = React.lazy(() => import('./pages/Reports.tsx'));
const Settings = React.lazy(() => import('./pages/Settings.tsx'));
const Notebook = React.lazy(() => import('./pages/Notebook.tsx'));
const Booking = React.lazy(() => import('./pages/Booking.tsx'));
import Login from './pages/Login.tsx';
import { supabase, getBusinessDetails } from './services/supabase.ts';
import { RefreshCcw } from 'lucide-react';

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center h-[50vh] animate-in fade-in duration-300">
    <RefreshCcw className="animate-spin text-slate-400 dark:text-zinc-600 mb-4" size={32} />
    <p className="text-slate-400 font-medium text-sm">Yuklanmoqda...</p>
  </div>
);

const App: React.FC = () => {
  // Sahifani yangilaganda oxirgi tabni eslab qolish
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('xpro_active_tab') || 'xpro';
  });
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tarifPlan, setTarifPlan] = useState<string>('LITE'); // Default to LITE
  const [businessName, setBusinessName] = useState<string>('Admin'); // Default name
  
  // Search State (Global)
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  
  // State to handle opening a specific shift from Reports in XPro
  const [targetShiftId, setTargetShiftId] = useState<string | null>(null);

  const fetchUserPlan = async (userId: string) => {
    const details = await getBusinessDetails(userId);
    if (details) {
      if (details.tarif_plan) setTarifPlan(details.tarif_plan);
      if (details.name) setBusinessName(details.name);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety timeout: If loading takes more than 7 seconds, force disable loading
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Loading timed out, forcing render");
        setLoading(false);
      }
    }, 7000);

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
           setSession(session);
           if (session?.user) {
             // Biznes ma'lumotlarini yuklashni kutamiz (Auto-detect)
             await fetchUserPlan(session.user.id);
           }
        }
      } catch (error) {
        console.error("Session init error:", error);
      } finally {
        if (mounted) {
           setLoading(false);
           clearTimeout(safetyTimer);
        }
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      setSession(session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Only trigger blocking load on explicit sign in
        setLoading(true);
        await fetchUserPlan(session.user.id);
        if (mounted) setLoading(false);
      } else if (session?.user) {
        // Silent update for other events
        fetchUserPlan(session.user.id);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  // activeTab o'zgarganda localStorage-ga saqlash
  useEffect(() => {
    localStorage.setItem('xpro_active_tab', activeTab);
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium animate-pulse">Tizim yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login onLoginSuccess={() => {}} />;
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Tab o'zgarganda qidiruvni tozalash
    setGlobalSearchQuery('');
    
    // If navigating manually, clear any forced shift ID so XPro loads default
    if (tab !== 'xpro' || (activeTab !== 'xpro')) {
       setTargetShiftId(null);
    }
  };

  const handleContinueShift = (shiftId: string) => {
    setTargetShiftId(shiftId);
    setActiveTab('xpro');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'xpro':
        return <XPro forcedShiftId={targetShiftId} searchQuery={globalSearchQuery} onSearchClear={() => setGlobalSearchQuery('')} />;
      case 'xisobotlar':
        return <Reports onContinueShift={handleContinueShift} />;
      case 'bron':
        // Double check protection
        if (tarifPlan === 'LITE') return <div className="p-10 text-center text-slate-500">Ushbu funksiya sizning tarifingizda mavjud emas.</div>;
        return <Booking />;
      case 'notebook':
        return <Notebook />;
      case 'sozlama':
        return <Settings />;
      default:
        return <XPro />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={handleTabChange}
      searchQuery={globalSearchQuery}
      setSearchQuery={setGlobalSearchQuery}
      tarifPlan={tarifPlan}
      businessName={businessName}
    >
      <Suspense fallback={<PageLoader />}>
        {renderContent()}
      </Suspense>
    </Layout>
  );
};

export default App;
