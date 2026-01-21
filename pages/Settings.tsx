
import React from 'react';
import { User, Bell, Shield, Database } from 'lucide-react';

const Settings: React.FC = () => {
  const sections = [
    { 
      title: 'Profil Sozlamalari', 
      icon: User, 
      items: ['Shaxsiy ma\'lumotlar', 'Parolni o\'zgartirish', 'Kompaniya profili'] 
    },
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          <User size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Foydalanuvchi</h2>
          <p className="text-slate-500 mb-3">admin@xisobot.uz</p>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">Premium</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">ID: 88219</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <section.icon size={20} />
              </div>
              <h3 className="font-bold text-slate-800">{section.title}</h3>
            </div>
            <ul className="space-y-1">
              {section.items.map((item, i) => (
                <li key={i}>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-all flex items-center justify-between group">
                    {item}
                    <span className="text-slate-300 group-hover:text-indigo-400 transition-colors">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-red-50 rounded-3xl p-6 border border-red-100 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-red-800">Hisobni o'chirish</h4>
          <p className="text-red-600 text-sm">Barcha ma'lumotlar butunlay o'chib ketadi.</p>
        </div>
        <button className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100">
          O'chirish
        </button>
      </div>
    </div>
  );
};

export default Settings;
