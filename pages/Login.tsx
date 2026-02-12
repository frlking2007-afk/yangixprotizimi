
import React, { useState, useEffect } from 'react';
import { Lock, Mail, Loader2, AlertCircle, Wallet } from 'lucide-react';
import { login } from '../services/auth';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const lightLogo = "https://raw.githubusercontent.com/frlking2007-afk/Rasmlar/refs/heads/main/1769675701416.jpg";
  const darkLogo = "https://raw.githubusercontent.com/frlking2007-afk/Rasmlar/refs/heads/main/1769675605866.jpg";
  
  const [logoSrc, setLogoSrc] = useState(lightLogo);

  useEffect(() => {
    const updateLogo = () => {
      const theme = localStorage.getItem('theme') || 'light';
      if (theme === 'dark') {
        setLogoSrc(darkLogo);
      } else {
        setLogoSrc(lightLogo);
      }
    };
    updateLogo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
        setError("Iltimos, barcha maydonlarni to'ldiring!");
        return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError("Login yoki parol noto'g'ri!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          {!imgError ? (
            <img 
              src={logoSrc}
              alt="XPro Logo" 
              className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-xl shadow-indigo-100 object-cover border-4 border-white dark:border-zinc-800"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-xl shadow-indigo-100 bg-indigo-600 flex items-center justify-center text-white">
              <Wallet size={40} />
            </div>
          )}
          <h1 className="text-3xl font-black text-slate-800 dark:text-white">Xpro</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-2">Kassa boshqaruv tizimiga xush kelibsiz</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-zinc-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border border-red-100 dark:border-red-900/30">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email manzili</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@xisobot.uz"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all font-medium dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Parol</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all font-medium dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-3">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Tizimga kirish'}
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
