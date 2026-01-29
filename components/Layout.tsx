import React, { useState, useEffect } from 'react';
import { Home, BarChart2, Settings, Menu, X, Book, Wallet } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const lightLogo = "https://raw.githubusercontent.com/frlking2007-afk/Rasmlar/refs/heads/main/1769675701416.jpg";
  const darkLogo = "https://raw.githubusercontent.com/frlking2007-afk/Rasmlar/refs/heads/main/1769675605866.jpg";
  
  const [logoSrc, setLogoSrc] = useState(lightLogo);

  useEffect(() => {
    const updateLogo = () => {
      const theme = localStorage.getItem('theme') || 'light';
      if (theme === 'dark' || theme === 'hacker') {
        setLogoSrc(darkLogo);
      } else {
        setLogoSrc(lightLogo);
      }
    };

    updateLogo();
    window.addEventListener('theme-changed', updateLogo);
    return () => window.removeEventListener('theme-changed', updateLogo);
  }, []);

  const menuItems = [
    { id: 'xpro', label: 'XPro', icon: Home },
    { id: 'xisobotlar', label: 'Hisobotlar', icon: BarChart2 },
    { id: 'notebook', label: 'Daftar', icon: Book },
    { id: 'sozlama', label: 'Sozlamalar', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 hacker:bg-black transition-colors duration-300">
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 text-slate-600 dark:text-slate-400 hacker:text-[#0f0] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 hacker:bg-black border-r border-slate-200 dark:border-slate-800 hacker:border-[#0f0] transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            {!imgError ? (
              <img 
                src={logoSrc}
                alt="XPro Logo" 
                className="w-10 h-10 rounded-xl object-cover shadow-sm border border-slate-100 dark:border-slate-800"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-10 h-10 bg-indigo-600 hacker:bg-[#0f0] rounded-xl flex items-center justify-center text-white hacker:text-black">
                <Wallet size={24} />
              </div>
            )}
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white hacker:text-[#0f0] hacker:font-mono uppercase">Xpro</h1>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${activeTab === item.id 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hacker:bg-[#002200] hacker:text-[#0f0] hacker:border hacker:border-[#0f0]' 
                    : 'text-slate-500 dark:text-slate-400 hacker:text-[#0f0]/60 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white'}
                `}
              >
                <item.icon size={20} />
                <span className="hacker:font-mono">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 hacker:bg-black border-b border-slate-200 dark:border-slate-800 hacker:border-[#0f0] flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 hacker:text-[#0f0] capitalize hacker:font-mono">
            {activeTab === 'xpro' ? 'Dashboard' : activeTab === 'sozlama' ? 'Sozlamalar' : activeTab === 'notebook' ? 'Daftar' : activeTab}
          </h2>
          <div className="flex items-center gap-4">
            {/* Header info could go here */}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;