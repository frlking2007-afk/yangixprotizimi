
import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Database, Edit3, Save, X, LogOut } from 'lucide-react';
import { getCurrentUser, updateUsername, logout } from '../services/auth';

const Settings: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const u = await getCurrentUser();
      setUser(u);
      setNewName(u?.user_metadata?.full_name || 'Admin Foydalanuvchi');
    };
    fetchUser();
  }, []);

  const handleUpdateName = async () => {
    try {
      await updateUsername(newName);
      setIsEditing(false);
      // Refresh user info
      const u = await getCurrentUser();
      setUser(u);
    } catch (err) {
      alert("Xatolik yuz berdi");
    }
  };

  const sections = [
    { 
      title: 'Bildirishnomalar', 
      icon: Bell, 
      items: ['Telegram xabarlari', 'Elektron pochta', 'Kunlik hisobot'] 
    },
    { 
      title: 'Xavfsizlik', 
      icon: Shield, 
      items: ['Ikki bosqichli autentifikatsiya', 'Kirishlar tarixi', 'Xavfsizlik kaliti'] 
    },
    { 
      title: 'Ma\'lumotlar bazasi', 
      icon: Database, 
      items: ['Supabase ulanishi', 'Zaxira nusxasi (Backup)', 'Eksport (Excel/PDF)'] 
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Header */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 relative shrink-0">
          <User size={48} />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          {isEditing ? (
            <div className="flex flex-col md:flex-row items-center gap-3">
              <input 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xl"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={handleUpdateName} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100"><Save size={20} /></button>
                <button onClick={() => setIsEditing(false)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100"><X size={20} /></button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-4">
              <h2 className="text-3xl font-black text-slate-800">{user?.user_metadata?.full_name || 'Admin Foydalanuvchi'}</h2>
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                title="Nomni o'zgartirish"
              >
                <Edit3 size={18} />
              </button>
            </div>
          )}
          <p className="text-slate-400 mt-1 font-medium">{user?.email}</p>
          <div className="flex justify-center md:justify-start gap-2 mt-4">
            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-wider">Premium</span>
            <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-black">ID: 88219</span>
          </div>
        </div>

        <button 
          onClick={() => logout().then(() => window.location.reload())}
          className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all flex items-center gap-2 border border-red-100"
        >
          <LogOut size={18} />
          Chiqish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-[2rem] p-7 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <section.icon size={20} />
              </div>
              <h3 className="font-bold text-slate-800">{section.title}</h3>
            </div>
            <ul className="space-y-1.5">
              {section.items.map((item, i) => (
                <li key={i}>
                  <button className="w-full text-left px-4 py-3 text-sm text-slate-500 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-all flex items-center justify-between group">
                    {item}
                    <span className="text-slate-200 group-hover:text-indigo-300 transition-colors">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
