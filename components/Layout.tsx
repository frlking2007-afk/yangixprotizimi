
import React, { useState, useEffect } from 'react';
import { Home, BarChart2, Settings, Book, Wallet, Search, ChevronRight, ChevronLeft, CalendarRange } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, searchQuery = '', setSearchQuery }) => {
  // Sidebar holatini eslab qolish
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('xpro_sidebar_collapsed') === 'true';
  });
  
  const [imgError, setImgError] = useState(false);
  
  const lightLogo = "https://raw.githubusercontent.com/frlking2007-afk/Rasmlar/refs/heads/main/1769675701416.jpg";
  const darkLogo = "https://raw.githubusercontent.com/frlking2007-afk/Rasmlar/refs/heads/main/1769675605866.jpg";
  
  const [logoSrc, setLogoSrc] = useState(lightLogo);

  // Sidebar holati o'zgarganda saqlash
  useEffect(() => {
    localStorage.setItem('xpro_sidebar_collapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

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
    { id: 'bron', label: 'Bron', icon: CalendarRange },
    { id: 'notebook', label: 'Daftar', icon: Book },
    { id: 'sozlama', label: 'Sozlamalar', icon: Settings },
  ];

  // Qidiruv faqat XPro sahifasida chiqishi kerak
  const showSearch = activeTab === 'xpro';

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-zinc-950 hacker:bg-black transition-all duration-300">
      
      {/* Fixed/Sticky Sidebar */}
      <aside className={`
        sticky top-0 h-screen bg-white dark:bg-zinc-900 hacker:bg-black border-r border-slate-200 dark:border-zinc-800 hacker:border-[#0f0] transition-all duration-500 ease-in-out z-40 shrink-0
        ${isSidebarCollapsed ? 'w-20' : 'w-72'}
      `}>
        <div className="h-full flex flex-col">
          
          {/* Sidebar Header with Logo and Toggle Button */}
          <div className={`p-4 flex items-center border-b border-slate-50 dark:border-zinc-800 h-20 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                {!imgError ? (
                  <img src={logoSrc} alt="Logo" className="w-10 h-10 rounded-xl object-cover" onError={() => setImgError(true)} />
                ) : (
                  <div className="w-10 h-10 bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-black rounded-xl shadow-lg"><Wallet size={20} /></div>
                )}
                <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tighter dark:text-white hacker:text-[#0f0] uppercase leading-none">Xpro</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Kassa Tizimi</span>
                </div>
              </div>
            ) : (
               <div className="flex items-center justify-center">
                 {!imgError ? (
                  <img src={logoSrc} alt="Logo" className="w-9 h-9 rounded-xl object-cover" onError={() => setImgError(true)} />
                ) : (
                  <div className="w-9 h-9 bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-black rounded-xl"><Wallet size={18} /></div>
                )}
               </div>
            )}
            
            {/* Toggle Button - Top Side */}
            {!isSidebarCollapsed && (
              <button 
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-all"
              >
                <ChevronLeft size={20} />
              </button>
            )}
          </div>

          {/* If collapsed, show open button below logo */}
          {isSidebarCollapsed && (
            <div className="flex justify-center py-4 border-b border-slate-50 dark:border-zinc-800">
               <button 
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-all"
                >
                  <ChevronRight size={20} />
                </button>
            </div>
          )}

          <nav className="flex-1 px-3 py-6 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full flex items-center transition-all duration-300 group rounded-2xl
                  ${isSidebarCollapsed ? 'justify-center p-3' : 'px-5 py-4 gap-4'}
                  ${activeTab === item.id 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 dark:bg-white dark:text-black dark:shadow-none hacker:bg-[#002200] hacker:text-[#0f0]' 
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

          <div className="p-4 border-t border-slate-50 dark:border-zinc-800 mt-auto">
            <div className={`flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-800 rounded-2xl border border-slate-100 dark:border-zinc-700 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
               <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-slate-800 dark:text-white shrink-0">
                  <span className="font-black text-sm">AD</span>
               </div>
               {!isSidebarCollapsed && (
                 <div className="overflow-hidden animate-in fade-in duration-500">
                    <p className="text-xs font-black text-slate-800 dark:text-white truncate">Admin</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Kassir</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 transition-all duration-500 overflow-x-hidden">
        <header className="sticky top-0 z-30 h-16 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 hacker:border-[#0f0] flex items-center justify-between px-6 md:px-10 shadow-sm">
          
          <div className="w-10"></div>

          <div className="flex-1 flex justify-center max-w-2xl px-6">
            {showSearch && setSearchQuery && (
              <div className="relative w-full group animate-in fade-in zoom-in-95 duration-300">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" size={18} />
                <input 
                  type="text"
                  placeholder="Qidiruv (Ctrl + K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-100 dark:bg-zinc-800/50 border-none rounded-full text-sm outline-none ring-2 ring-transparent focus:ring-slate-900/5 dark:focus:ring-white/5 focus:bg-white dark:focus:bg-zinc-800 transition-all font-medium dark:text-white"
                />
              </div>
            )}
          </div>

          <div className="min-w-[120px] text-right">
            <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-white hacker:text-[#0f0] uppercase tracking-tighter hacker:font-mono">
              {activeTab === 'xpro' ? 'Dashboard' : 
               activeTab === 'sozlama' ? 'Sozlamalar' : 
               activeTab === 'notebook' ? 'Daftar' : 
               activeTab === 'bron' ? 'Bron Tizimi' :
               activeTab === 'xisobotlar' ? 'Hisobotlar' : activeTab}
            </h2>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-10 relative">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
