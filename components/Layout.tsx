import React, { useState, useEffect } from 'react';
import { Home, BarChart2, Settings, Book, Wallet, Search, ChevronRight, ChevronLeft } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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
    <div className="min-h-screen flex bg-slate-50 dark:bg-zinc-950 hacker:bg-black transition-all duration-300">
      
      {/* Sidebar - Always on the side, doesn't overlay */}
      <aside className={`
        relative h-screen bg-white dark:bg-zinc-900 hacker:bg-black border-r border-slate-200 dark:border-zinc-800 hacker:border-[#0f0] transition-all duration-500 ease-in-out z-40
        ${isSidebarCollapsed ? 'w-20' : 'w-72'}
      `}>
        <div className="h-full flex flex-col">
          
          {/* Sidebar Top: Toggle Button & Logo */}
          <div className="p-5 flex items-center justify-between border-b border-slate-50 dark:border-zinc-800">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                {!imgError ? (
                  <img src={logoSrc} alt="Logo" className="w-8 h-8 rounded-lg object-cover" onError={() => setImgError(true)} />
                ) : (
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><Wallet size={16} /></div>
                )}
                <span className="font-black text-lg tracking-tighter dark:text-white hacker:text-[#0f0] uppercase">Xpro</span>
              </div>
            )}
            
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`
                p-2 rounded-xl border transition-all duration-300
                ${isSidebarCollapsed ? 'mx-auto' : ''}
                bg-slate-50 dark:bg-zinc-800 border-slate-100 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-indigo-600 hover:text-white
              `}
            >
              {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-8 space-y-3">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full flex items-center transition-all duration-300 group rounded-2xl
                  ${isSidebarCollapsed ? 'justify-center p-3' : 'px-5 py-4 gap-4'}
                  ${activeTab === item.id 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 dark:bg-indigo-600 dark:shadow-none hacker:bg-[#002200] hacker:text-[#0f0]' 
                    : 'text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'}
                `}
              >
                <item.icon size={22} className={`shrink-0 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                {!isSidebarCollapsed && (
                  <span className="font-black text-sm uppercase tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-left-2">{item.label}</span>
                )}
              </button>
            ))}
          </nav>

          {/* User Profile Area (Mini/Full) */}
          <div className="p-4 mt-auto">
            <div className={`flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-800 rounded-2xl border border-slate-100 dark:border-zinc-700 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
               <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 shrink-0">
                  <span className="font-black text-sm">AD</span>
               </div>
               {!isSidebarCollapsed && (
                 <div className="overflow-hidden animate-in fade-in duration-500">
                    <p className="text-xs font-black text-slate-800 dark:text-white truncate">Admin Account</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Kassir</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 transition-all duration-500">
        {/* Modern Sticky Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 hacker:border-[#0f0] flex items-center justify-between px-6 md:px-10 shadow-sm">
          
          {/* Header Left: Empty or subtle info (since toggle moved to sidebar) */}
          <div className="w-10 hidden md:block"></div>

          {/* Header Center: Elegant Search Bar */}
          <div className="flex-1 flex justify-center max-w-2xl px-6">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Qidiruv (Ctrl + K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-slate-100 dark:bg-zinc-800/50 border-none rounded-full text-sm outline-none ring-2 ring-transparent focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-zinc-800 transition-all font-medium dark:text-white"
              />
            </div>
          </div>

          {/* Header Right: Dashboard Title */}
          <div className="min-w-[120px] text-right">
            <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-white hacker:text-[#0f0] uppercase tracking-tighter hacker:font-mono">
              {activeTab === 'xpro' ? 'Dashboard' : 
               activeTab === 'sozlama' ? 'Sozlamalar' : 
               activeTab === 'notebook' ? 'Daftar' : 
               activeTab === 'xisobotlar' ? 'Hisobotlar' : activeTab}
            </h2>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;