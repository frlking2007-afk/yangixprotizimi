
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import XPro from './pages/XPro.tsx';
import Reports from './pages/Reports.tsx';
import Settings from './pages/Settings.tsx';
import Login from './pages/Login.tsx';
import { supabase } from './services/supabase.ts';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('xpro');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 hacker:bg-black transition-colors duration-300">
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

  const renderContent = () => {
    switch (activeTab) {
      case 'xpro':
        return <XPro />;
      case 'xisobotlar':
        return <Reports />;
      case 'sozlama':
        return <Settings />;
      default:
        return <XPro />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
