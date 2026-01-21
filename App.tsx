
import React, { useState, useEffect } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react";
import Layout from './components/Layout';
import XPro from './pages/XPro';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('xpro');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
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
        <div className="w-10 h-10 border-4 border-indigo-600 hacker:border-[#0f0] border-t-transparent rounded-full animate-spin"></div>
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
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
      <SpeedInsights />
    </>
  );
};

export default App;
