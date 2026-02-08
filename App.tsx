
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import XPro from './pages/XPro.tsx';
import Reports from './pages/Reports.tsx';
import Settings from './pages/Settings.tsx';
import Notebook from './pages/Notebook.tsx';
import Booking from './pages/Booking.tsx';
import Login from './pages/Login.tsx';
import { supabase } from './services/supabase.ts';

const App: React.FC = () => {
  // Sahifani yangilaganda oxirgi tabni eslab qolish
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('xpro_active_tab') || 'xpro';
  });
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // State to handle opening a specific shift from Reports in XPro
  const [targetShiftId, setTargetShiftId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(err => {
      console.error("Auth session error:", err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
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
          <div className="w-10 h-10 border-4 border-indigo-600 hacker:border-[#0f0] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium hacker:text-[#0f0]">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login onLoginSuccess={() => {}} />;
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
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
        return <XPro forcedShiftId={targetShiftId} />;
      case 'xisobotlar':
        return <Reports onContinueShift={handleContinueShift} />;
      case 'bron':
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
    <Layout activeTab={activeTab} setActiveTab={handleTabChange}>
      {renderContent()}
    </Layout>
  );
};

export default App;
