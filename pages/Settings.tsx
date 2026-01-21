
import React, { useState, useEffect } from 'react';
import { User, Edit3, Save, X, LogOut, Sun, Moon, Terminal, Palette } from 'lucide-react';
import { getCurrentUser, updateUsername, logout } from '../services/auth';

const Settings: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const fetchUser = async () => {
      const u = await getCurrentUser();
      setUser(u);
      setNewName(u?.user_metadata?.full_name || 'Admin Foydalanuvchi');
    };
    fetchUser();
  }, []);

  const changeTheme = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    document.documentElement.className = theme;
    // Browser refresh required to apply some deep tailwind dynamic classes or we just use global classes
    window.dispatchEvent(new Event('theme-changed'));
  };

  const handleUpdateName = async () => {
    try {
      await updateUsername(newName);
      setIsEditing(false);
      const u = await getCurrentUser();
      setUser(u);
    } catch (err) {
      alert("Xatolik yuz berdi");
    }
  };

  const themes = [
    { 
      id: 'light', 
      name: 'Oq mavzu', 
      icon: Sun, 
      desc: 'Yorqin va toza ko\'rinish',
      color: 'bg-white',
      textColor: 'text-slate-900',
      borderColor: 'border-slate-200'
    },
    { 
      id: 'dark', 
      name: 'Qora mavzu', 
      icon: Moon, 
      desc: 'Tungi va qulay interfeys',
      color: 'bg-slate-900',
      textColor: 'text-white',
      borderColor: 'border-slate-700'
    },
    { 
      id: 'hacker', 
      name: 'Hacker', 
      icon: Terminal, 
      desc: 'Terminal va matritsa uslubi',
      color: 'bg-black',
      textColor: 'text-[#0f0]',
      borderColor: 'border-[#0f0]'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Header */}
      <div className="profile-card bg-white dark:bg-slate-800 hacker:bg-black hacker:border hacker:border-[#0f0] rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-slate-700 hacker:bg-[#001100] hacker:border hacker:border-[#0f0] flex items-center justify-center text-indigo-600 dark:text-indigo-400 hacker:text-[#0f0] relative shrink-0">
          <User size={48} />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-slate-800 hacker:border-black rounded-full"></div>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          {isEditing ? (
            <div className="flex flex-col md:flex-row items-center gap-3">
              <input 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-900 hacker:bg-black hacker:border hacker:border-[#0f0] hacker:text-[#0f0] border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xl dark:text-white"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={handleUpdateName} className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl hover:bg-green-100" title="Saqlash"><Save size={20} /></button>
                <button onClick={() => setIsEditing(false)} className="p-2 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-xl hover:bg-slate-100" title="Bekor qilish"><X size={20} /></button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-4">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white hacker:text-[#0f0] hacker:font-mono">{user?.user_metadata?.full_name || 'Admin Foydalanuvchi'}</h2>
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2.5 bg-slate-50 dark:bg-slate-700 hacker:bg-[#001100] hacker:border hacker:border-[#0f0] text-slate-400 hacker:text-[#0f0] hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                title="Nomni o'zgartirish"
              >
                <Edit3 size={18} />
              </button>
            </div>
          )}
          <p className="text-slate-400 dark:text-slate-500 hacker:text-[#0f0]/60 mt-1 font-medium hacker:font-mono">{user?.email}</p>
          <div className="flex justify-center md:justify-start gap-2 mt-4">
            <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-black uppercase tracking-wider hacker:bg-[#002200] hacker:border hacker:border-[#0f0] hacker:text-[#0f0]">Premium</span>
            <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full text-xs font-black hacker:bg-black hacker:border hacker:border-[#0f0] hacker:text-[#0f0]">ID: 88219</span>
          </div>
        </div>

        <button 
          onClick={() => logout().then(() => window.location.reload())}
          className="px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center gap-2 border border-red-100 dark:border-red-900/30 hacker:border-[#f00] hacker:text-[#f00] hacker:bg-black"
        >
          <LogOut size={18} />
          Chiqish
        </button>
      </div>

      {/* Theme Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-800 dark:text-white hacker:text-[#0f0] flex items-center gap-2">
          <Palette size={20} className="text-indigo-600 hacker:text-[#0f0]" /> 
          Mavzular (Theme)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => changeTheme(t.id)}
              className={`
                relative p-6 rounded-[2rem] border transition-all text-left overflow-hidden group
                ${currentTheme === t.id 
                  ? (t.id === 'hacker' ? 'border-[#0f0] ring-1 ring-[#0f0]' : 'border-indigo-600 ring-2 ring-indigo-100') 
                  : 'border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500'}
                ${t.color}
              `}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${currentTheme === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 hacker:bg-[#002200] hacker:border hacker:border-[#0f0] text-slate-500 dark:text-slate-400 hacker:text-[#0f0]'}`}>
                  <t.icon size={24} />
                </div>
                {currentTheme === t.id && (
                  <div className={`w-3 h-3 rounded-full animate-pulse ${t.id === 'hacker' ? 'bg-[#0f0]' : 'bg-indigo-600'}`}></div>
                )}
              </div>
              <h4 className={`font-black text-lg ${t.textColor} hacker:font-mono`}>{t.name}</h4>
              <p className={`text-xs mt-1 font-medium ${t.id === 'hacker' ? 'text-[#0f0]/70' : 'text-slate-400 dark:text-slate-500'} hacker:font-mono`}>
                {t.desc}
              </p>
              
              {/* Matrix effect for hacker theme button background */}
              {t.id === 'hacker' && (
                <div className="absolute top-0 right-0 p-2 opacity-5 hacker:font-mono text-[8px] pointer-events-none select-none">
                  01010101<br/>10101010<br/>01010101
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 hacker:bg-black hacker:border hacker:border-[#0f0] rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm text-center">
        <p className="text-slate-400 dark:text-slate-500 hacker:text-[#0f0] font-medium hacker:font-mono">Qo'shimcha sozlamalar tez orada qo'shiladi.</p>
      </div>
    </div>
  );
};

export default Settings;
