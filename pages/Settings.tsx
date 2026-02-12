
import React, { useState, useEffect } from 'react';
import { 
  User, Edit3, Save, X, LogOut, Sun, Moon, Palette, Lock, ShieldCheck, RefreshCcw, Eye, EyeOff
} from 'lucide-react';
import { getCurrentUser, updateUsername, logout } from '../services/auth';
import { setDeletionPassword, getDeletionPassword, getDeletionPasswordState, setDeletionPasswordState } from '../services/supabase';

const Settings: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'light');

  // Password state
  const [savedPassword, setSavedPassword] = useState('');
  const [showSavedPassword, setShowSavedPassword] = useState(false);
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(true);
  
  // Password setting form
  const [passForm, setPassForm] = useState({ current: '', confirm: '' });
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  useEffect(() => {
    const initData = async () => {
      // Fetch user
      const u = await getCurrentUser();
      setUser(u);
      setNewName(u?.user_metadata?.full_name || 'Admin Foydalanuvchi');

      // Fetch current password and state
      const [pass, enabled] = await Promise.all([
        getDeletionPassword(),
        getDeletionPasswordState()
      ]);
      setSavedPassword(pass);
      setIsPasswordEnabled(enabled);
    };
    initData();
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
      alert("Ismni yangilashda xatolik");
    }
  };

  const handleTogglePassword = async () => {
    const newState = !isPasswordEnabled;
    setIsPasswordEnabled(newState);
    try {
      await setDeletionPasswordState(newState);
    } catch (e) {
      // Revert if error
      setIsPasswordEnabled(!newState);
      alert("Holatni o'zgartirishda xatolik");
    }
  };

  const handleUpdatePassword = async () => {
    if (!passForm.current || !passForm.confirm) {
        alert("Iltimos, parolni kiriting");
        return;
    }
    if (passForm.current !== passForm.confirm) {
        alert("Parollar mos kelmadi");
        return;
    }

    setIsUpdatingPass(true);
    try {
        await setDeletionPassword(passForm.current);
        setSavedPassword(passForm.current);
        setPassForm({ current: '', confirm: '' });
        alert("Parol muvaffaqiyatli yangilandi");
    } catch (e) {
        alert("Xatolik yuz berdi");
    } finally {
        setIsUpdatingPass(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
      
      {/* Profile Card */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-zinc-800 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-slate-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center text-slate-400 mb-6 relative group">
           <User size={40} />
           <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-zinc-900"></div>
        </div>
        
        {isEditing ? (
            <div className="flex items-center gap-2 mb-6">
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2 font-bold text-center outline-none dark:text-white"
                />
                <button onClick={handleUpdateName} className="p-2 bg-green-500 text-white rounded-xl"><Save size={18} /></button>
                <button onClick={() => setIsEditing(false)} className="p-2 bg-red-500 text-white rounded-xl"><X size={18} /></button>
            </div>
        ) : (
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2 justify-center">
                {user?.user_metadata?.full_name || 'Admin Foydalanuvchi'}
                <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors"><Edit3 size={16} /></button>
            </h2>
        )}
        
        <p className="text-slate-400 font-medium text-sm mb-8">{user?.email}</p>

        <button 
          onClick={handleLogout}
          className="px-8 py-3 bg-red-50 dark:bg-red-900/10 text-red-600 font-black rounded-2xl flex items-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all active:scale-95"
        >
          <LogOut size={18} /> Chiqish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Password Settings */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-zinc-800 h-full relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Lock size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">O'chirish paroli</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Xavfsizlik</p>
                        </div>
                    </div>
                    {/* Toggle Switch */}
                    <div 
                        onClick={handleTogglePassword}
                        className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${isPasswordEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-zinc-700'}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isPasswordEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </div>

                <div className={`transition-opacity duration-300 ${isPasswordEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    {/* READ ONLY CURRENT PASSWORD */}
                    <div className="mb-6 relative">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Amaldagi Parol</label>
                        <div className="relative">
                            <input 
                                type={showSavedPassword ? "text" : "password"} 
                                value={savedPassword} 
                                readOnly 
                                className="w-full pl-5 pr-12 py-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none font-bold text-slate-600 dark:text-slate-400"
                            />
                            <button 
                                onClick={() => setShowSavedPassword(!showSavedPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors pointer-events-auto"
                            >
                                {showSavedPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Yangi Parol</label>
                            <input 
                                type="text" 
                                placeholder="Parolni kiriting"
                                value={passForm.current}
                                onChange={e => setPassForm({...passForm, current: e.target.value})}
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none font-medium dark:text-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Tasdiqlash</label>
                            <input 
                                type="text" 
                                placeholder="Qayta kiriting"
                                value={passForm.confirm}
                                onChange={e => setPassForm({...passForm, confirm: e.target.value})}
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none font-medium dark:text-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>
                        <button 
                            onClick={handleUpdatePassword}
                            disabled={isUpdatingPass}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-slate-200 dark:shadow-none disabled:opacity-50 mt-2 pointer-events-auto"
                        >
                            {isUpdatingPass ? <RefreshCcw className="animate-spin" size={20} /> : <ShieldCheck size={20} />} Saqlash
                        </button>
                    </div>
                </div>
                
                {!isPasswordEnabled && (
                    <div className="absolute inset-0 top-20 flex items-center justify-center pointer-events-none">
                        <span className="bg-slate-100 dark:bg-zinc-800 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 uppercase">Parol o'chirilgan</span>
                    </div>
                )}
          </div>

          {/* Theme Settings */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-zinc-800 h-full">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                    <Palette size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Mavzular (Theme)</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Ko'rinish</p>
                </div>
             </div>

             <div className="space-y-3">
                <button 
                  onClick={() => changeTheme('light')}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${currentTheme === 'light' ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-zinc-800' : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                >
                   <div className="flex items-center gap-3">
                      <Sun size={20} className={currentTheme === 'light' ? 'text-slate-900 dark:text-white' : 'text-slate-400'} />
                      <span className="font-bold text-slate-700 dark:text-white">Oq</span>
                   </div>
                   {currentTheme === 'light' && <div className="w-3 h-3 rounded-full bg-slate-900 dark:bg-white"></div>}
                </button>

                <button 
                  onClick={() => changeTheme('dark')}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${currentTheme === 'dark' ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-zinc-800' : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                >
                   <div className="flex items-center gap-3">
                      <Moon size={20} className={currentTheme === 'dark' ? 'text-slate-900 dark:text-white' : 'text-slate-400'} />
                      <span className="font-bold text-slate-700 dark:text-white">Qora</span>
                   </div>
                   {currentTheme === 'dark' && <div className="w-3 h-3 rounded-full bg-slate-900 dark:bg-white"></div>}
                </button>
             </div>
          </div>
      </div>
    </div>
  );
};

export default Settings;
