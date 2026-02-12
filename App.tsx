
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import XPro from './pages/XPro.tsx';
import Reports from './pages/Reports.tsx';
import Settings from './pages/Settings.tsx';
import Notebook from './pages/Notebook.tsx';
import Booking from './pages/Booking.tsx';
import Login from './pages/Login.tsx';
import { supabase, getBusinessDetails } from './services/supabase.ts';

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
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
          // Biznes ma'lumotlarini yuklashni kutamiz (Auto-detect)
          await fetchUserPlan(session.user.id);
        }
      } catch (error) {
        console.error("Session init error:", error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        // Login qilinganda ham ma'lumotlarni yangilaymiz
        setLoading(true);
        await fetchUserPlan(session.user.id);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // activeTab o'zgarganda localStorage-ga saqlash
  useEffect(() => {
    localStorage.setItem('xpro_active_tab', activeTab);
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 hacker:bg-black transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-900 dark:border-white hacker:border-[#0f0] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium hacker:text-[#0f0]">Tizim yuklanmoqda...</p>
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
        // Double check protection, though layout should hide link
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
      {renderContent()}
    </Layout>
  );
};

export default App;
