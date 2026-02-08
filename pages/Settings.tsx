
import React, { useState, useEffect } from 'react';
import { 
  User, Edit3, Save, X, LogOut, Sun, Moon, Terminal, Palette, Lock, ShieldCheck, RefreshCcw
} from 'lucide-react';
import { getCurrentUser, updateUsername, logout } from '../services/auth';
import { setDeletionPassword } from '../services/supabase';

const Settings: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'light');

  // Password setting state
  const [passForm, setPassForm] = useState({ current: '', confirm: '' });
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passForm.current || passForm.current !== passForm.confirm) {
      alert("Parollar mos kelmadi!");
      return;
    }
    
    setIsUpdatingPass(true);
    try {
      await setDeletionPassword(passForm.current);
      setPassForm({ current: '', confirm: '' });
      alert("Operatsiyalarni o'chirish paroli yangilandi!");
    } catch (err: any) {
      alert("Xato: " + err.message);
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const themes = [
    { id: 'light', name: 'Oq', icon: Sun, color: 'bg-white', textColor: 'text-slate-900' },
    { id: 'dark', name: 'Qora', icon: Moon, color: 'bg-zinc-900', textColor: 'text-white' },
    { id: 'hacker', name: 'Hacker', icon: Terminal, color: 'bg-black', textColor: 'text-[#0f0]' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Profile Header */}
      <div className="bg-white dark:bg-zinc-800 hacker:bg-black hacker:border hacker:border-[#0f0] rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-zinc-700 shadow-sm flex flex-col md:flex-row items-center gap-6 md:gap-8">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-slate-100 dark:bg-zinc-700 hacker:bg-[#001100] hacker:border hacker:border-[#0f0] flex items-center justify-center text-slate-900 dark:text-white hacker:text-[#0f0] relative shrink-0">
          <User size={40} />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-zinc-800 hacker:border-black rounded-full"></div>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          {isEditing ? (
            <div className="flex flex-col md:flex-row items-center gap-3">
              <input 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-zinc-900 hacker:bg-black hacker:border hacker:border-[#0f0] border border-slate-100 dark:border-zinc-700 rounded-xl outline-none font-bold text-xl dark:text-white"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={handleUpdateName} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100"><Save size={20} /></button>
                <button onClick={() => setIsEditing(false)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100"><X size={20} /></button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-4">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white hacker:text-[#0f0] hacker:font-mono">{user?.user_metadata?.full_name || 'Admin Foydalanuvchi'}</h2>
              <button onClick={() => setIsEditing(true)} className="p-2.5 bg-slate-50 dark:bg-zinc-700 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl border border-transparent hover:border-slate-100"><Edit3 size={18} /></button>
            </div>
          )}
          <p className="text-slate-400 hacker:text-[#0f0]/60 mt-1 font-medium hacker:font-mono">{user?.email}</p>
        </div>

        <button 
          onClick={() => logout().then(() => window.location.reload())}
          className="px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-100 transition-all flex items-center gap-2 border border-red-100 hacker:border-[#f00]"
        >
          <LogOut size={18} /> Chiqish
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Password Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-800 dark:text-white hacker:text-[#0f0] flex items-center gap-2">
            <Lock size={20} className="text-slate-900 dark:text-white hacker:text-[#0f0]" /> Operatsiyalarni o'chirish paroli
          </h3>
          <div className="bg-white dark:bg-zinc-800 hacker:bg-black hacker:border hacker:border-[#0f0] rounded-[2rem] p-6 border border-slate-100 dark:border-zinc-700 shadow-sm">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Yangi parol</label>
                <input 
                  type="password"
                  placeholder="Parolni kiriting"
                  value={passForm.current}
                  onChange={(e) => setPassForm({...passForm, current: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-900 hacker:bg-black hacker:border hacker:border-[#0f0] border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none font-medium text-sm dark:text-white hacker:text-[#0f0]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Parolni tasdiqlash</label>
                <input 
                  type="password"
                  placeholder="Parolni qayta kiriting"
                  value={passForm.confirm}
                  onChange={(e) => setPassForm({...passForm, confirm: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-900 hacker:bg-black hacker:border hacker:border-[#0f0] border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none font-medium text-sm dark:text-white hacker:text-[#0f0]"
                />
              </div>
              <button 
                type="submit"
                disabled={isUpdatingPass}
                className="w-full py-3.5 bg-slate-900 dark:bg-white hacker:bg-[#0f0] text-white dark:text-black hacker:text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-slate-100 transition-all shadow-lg shadow-slate-200 dark:shadow-none"
              >
                {isUpdatingPass ? <RefreshCcw className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                Saqlash
              </button>
            </form>
          </div>
        </div>

        {/* Themes */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-800 dark:text-white hacker:text-[#0f0] flex items-center gap-2">
            <Palette size={20} className="text-slate-900 dark:text-white hacker:text-[#0f0]" /> Mavzular (Theme)
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => changeTheme(t.id)}
                className={`
                  p-4 rounded-2xl border transition-all flex items-center justify-between
                  ${currentTheme === t.id ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-zinc-800' : 'border-slate-100 dark:border-zinc-800 hover:border-slate-300'}
                  ${t.color}
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${currentTheme === t.id ? 'bg-slate-900 dark:bg-white text-white dark:text-black' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}>
                    <t.icon size={20} />
                  </div>
                  <span className={`font-black ${t.textColor} hacker:font-mono`}>{t.name}</span>
                </div>
                {currentTheme === t.id && <div className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white animate-pulse"></div>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
