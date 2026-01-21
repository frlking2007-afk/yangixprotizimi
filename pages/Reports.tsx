
import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar, Clock, 
  ChevronRight, ArrowUpRight, ArrowDownRight, 
  FileText, CheckCircle2, XCircle, RefreshCcw,
  ArrowLeft, Wallet, CreditCard, Banknote, TrendingDown,
  PieChart, Tag, Info, Trash2
} from 'lucide-react';
import { Shift, Transaction } from '../types';
import { getAllShifts, getTransactions, deleteShift, getDeletionPassword } from '../services/supabase';

const Reports: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sData, tData] = await Promise.all([
        getAllShifts(),
        getTransactions()
      ]);
      setShifts(sData);
      setTransactions(tData);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getShiftStats = (shiftId: string) => {
    const shiftTrans = transactions.filter(t => t.shift_id === shiftId);
    const kirim = shiftTrans.filter(t => t.type === 'kirim').reduce((s, c) => s + c.amount, 0);
    const chiqim = shiftTrans.filter(t => t.type === 'chiqim').reduce((s, c) => s + c.amount, 0);
    
    // Categorized totals
    const categoryTotals = shiftTrans.reduce((acc, t) => {
      const cat = t.category;
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += t.amount;
      return acc;
    }, {} as Record<string, number>);

    return { 
      kirim, 
      chiqim, 
      balance: kirim - chiqim, 
      count: shiftTrans.length,
      transactions: shiftTrans,
      categoryTotals
    };
  };

  const handleDeleteShift = async (e: React.MouseEvent, shiftId: string) => {
    e.stopPropagation(); // Kartochka bosilishini to'xtatish
    
    const password = prompt("Smenani o'chirish uchun parolni kiriting:");
    if (password === null) return;

    try {
      const correctPassword = await getDeletionPassword();
      if (password !== correctPassword) {
        alert("Parol noto'g'ri!");
        return;
      }

      if (confirm("Haqiqatan ham ushbu smenani va unga tegishli barcha amallarni o'chirib tashlamoqchimisiz?")) {
        await deleteShift(shiftId);
        await fetchData(); // Ro'yxatni yangilash
        if (selectedShiftId === shiftId) setSelectedShiftId(null);
        alert("Smena muvaffaqiyatli o'chirildi.");
      }
    } catch (err: any) {
      alert("O'chirishda xato yuz berdi: " + err.message);
    }
  };

  const filteredShifts = shifts.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const selectedShift = shifts.find(s => s.id === selectedShiftId);
  const shiftStats = selectedShiftId ? getShiftStats(selectedShiftId) : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <RefreshCcw className="animate-spin text-indigo-600 hacker:text-[#0f0]" size={40} />
        <p className="text-slate-500 hacker:text-[#0f0] font-medium hacker:font-mono">Hisobotlar tayyorlanmoqda...</p>
      </div>
    );
  }

  // Shift Detail View
  if (selectedShift && shiftStats) {
    const isProfit = shiftStats.balance > 0;
    const isLoss = shiftStats.balance < 0;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 hacker:font-mono">
        {/* Detail Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedShiftId(null)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hacker:bg-black border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] text-slate-600 dark:text-slate-400 hacker:text-[#0f0] font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft size={18} /> Orqaga qaytish
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => handleDeleteShift(e, selectedShift.id)}
              className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition-all hacker:border hacker:border-[#f00]"
            >
              <Trash2 size={20} />
            </button>
             <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${selectedShift.status === 'active' ? 'bg-green-100 text-green-700 hacker:bg-[#002200] hacker:text-[#0f0] hacker:border hacker:border-[#0f0]' : 'bg-slate-100 text-slate-500 hacker:bg-slate-900'}`}>
               {selectedShift.status === 'active' ? 'Faol' : 'Yopilgan'}
             </span>
          </div>
        </div>

        {/* Shift Title Info */}
        <div className="bg-white dark:bg-slate-900 hacker:bg-black p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] shadow-sm">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white hacker:text-[#0f0] mb-2">{selectedShift.name}</h2>
          <div className="flex flex-wrap gap-4 text-slate-400 hacker:text-[#0f0]/60 text-sm font-medium">
            <span className="flex items-center gap-1.5"><Calendar size={16} /> Ochilgan: {new Date(selectedShift.start_date).toLocaleString('uz-UZ')}</span>
            {selectedShift.end_date && <span className="flex items-center gap-1.5"><Clock size={16} /> Yopilgan: {new Date(selectedShift.end_date).toLocaleString('uz-UZ')}</span>}
          </div>
        </div>

        {/* Big Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 hacker:bg-black p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] shadow-sm">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Jami Kirim</p>
            <div className="flex items-center justify-between">
               <h3 className="text-3xl font-black text-green-600 dark:text-green-400 hacker:text-[#0f0]">{shiftStats.kirim.toLocaleString()} <span className="text-sm font-bold">so'm</span></h3>
               <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center"><ArrowUpRight size={20}/></div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 hacker:bg-black p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] shadow-sm">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Jami Chiqim</p>
            <div className="flex items-center justify-between">
               <h3 className="text-3xl font-black text-red-500 dark:text-red-400 hacker:text-[#f00]">{shiftStats.chiqim.toLocaleString()} <span className="text-sm font-bold">so'm</span></h3>
               <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center"><ArrowDownRight size={20}/></div>
            </div>
          </div>
          <div className={`p-6 rounded-[2rem] border shadow-sm ${isProfit ? 'bg-green-600 dark:bg-green-700 border-green-600 text-white hacker:bg-[#003300]' : isLoss ? 'bg-red-500 dark:bg-red-700 border-red-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white'}`}>
            <p className={`text-xs font-bold uppercase mb-2 ${isProfit || isLoss ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
              {isProfit ? 'Jami Foyda' : isLoss ? 'Jami Zarar' : 'Natija'}
            </p>
            <div className="flex items-center justify-between">
               <h3 className="text-3xl font-black">{Math.abs(shiftStats.balance).toLocaleString()} <span className="text-sm font-bold">so'm</span></h3>
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isProfit || isLoss ? 'bg-white/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
                 {isProfit ? <TrendingDown className="rotate-180" size={20}/> : <TrendingDown size={20}/>}
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Categorized Summary */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-white hacker:text-[#0f0] flex items-center gap-2"><PieChart size={18}/> Kategoriyalar kesimida</h4>
            <div className="bg-white dark:bg-slate-900 hacker:bg-black p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] shadow-sm space-y-4">
              {Object.entries(shiftStats.categoryTotals).map(([cat, total]) => {
                const isExpense = cat === 'Xarajat';
                return (
                  <div key={cat} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isExpense ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'}`}>
                        {cat === 'Kassa' ? <Banknote size={18}/> : cat === 'Click' ? <CreditCard size={18}/> : <Tag size={18}/>}
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300 hacker:text-[#0f0] text-sm">{cat}</span>
                    </div>
                    <span className={`font-black text-sm ${isExpense ? 'text-red-500' : 'text-slate-800 dark:text-white hacker:text-[#0f0]'}`}>
                      {isExpense ? '-' : '+'}{total.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-900 hacker:bg-[#001100] hacker:border hacker:border-[#0f0] p-6 rounded-[2rem] text-white hacker:text-[#0f0] shadow-xl">
               <div className="flex items-center gap-2 mb-3 text-indigo-400 hacker:text-[#0f0]">
                 <Info size={18}/>
                 <h5 className="font-bold text-sm uppercase">Qisqacha xulosa</h5>
               </div>
               <p className="text-sm text-slate-300 hacker:text-[#0f0]/80 leading-relaxed font-medium">
                 Ushbu smena davomida jami <span className="text-white hacker:text-[#0f0] font-bold">{shiftStats.count} ta</span> operatsiya amalga oshirildi. 
                 {isProfit ? "Smena foyda bilan yakunlandi." : isLoss ? "Smena zarar bilan yakunlandi." : "Kirim va chiqim teng bo'ldi."}
               </p>
            </div>
          </div>

          {/* Detailed Transaction List */}
          <div className="lg:col-span-8 space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-white hacker:text-[#0f0]">Barcha operatsiyalar</h4>
            <div className="space-y-2">
              {shiftStats.transactions.map((t) => (
                <div key={t.id} className="bg-white dark:bg-slate-900 hacker:bg-black p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] shadow-sm flex items-center justify-between hover:border-indigo-100 dark:hover:border-indigo-900 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.type === 'kirim' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                      {t.type === 'kirim' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[9px] font-black uppercase tracking-wider hacker:border hacker:border-[#0f0]/30">{t.category}</span>
                        {t.sub_category && <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded text-[9px] font-black uppercase tracking-wider hacker:border hacker:border-[#0f0]/30">{t.sub_category}</span>}
                      </div>
                      <p className="font-bold text-slate-800 dark:text-white hacker:text-[#0f0] text-[13px] mt-1">{t.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-sm ${t.type === 'kirim' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {t.type === 'kirim' ? '+' : '-'}{t.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 hacker:text-[#0f0]/60">
                      {new Date(t.date).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reports List View
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hacker:text-[#0f0]" size={20} />
          <input 
            type="text"
            placeholder="Smena nomini qidiring..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 hacker:bg-black border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium dark:text-white hacker:text-[#0f0] hacker:font-mono"
          />
        </div>

        <div className="flex bg-white dark:bg-slate-900 hacker:bg-black p-1 rounded-2xl border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] shadow-sm w-full md:w-auto">
          <button 
            onClick={() => setFilter('all')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all hacker:font-mono ${filter === 'all' ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-md hacker:bg-[#002200]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            Barchasi
          </button>
          <button 
            onClick={() => setFilter('active')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 hacker:font-mono ${filter === 'active' ? 'bg-green-500 text-white shadow-md hacker:bg-[#004400]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <CheckCircle2 size={16} /> Faol
          </button>
          <button 
            onClick={() => setFilter('closed')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 hacker:font-mono ${filter === 'closed' ? 'bg-red-500 text-white shadow-md hacker:bg-[#440000]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <XCircle size={16} /> Yopilgan
          </button>
        </div>
      </div>

      {/* Shifts List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredShifts.length > 0 ? (
          filteredShifts.map((shift) => {
            const stats = getShiftStats(shift.id);
            const isProfit = stats.balance > 0;
            const isLoss = stats.balance < 0;

            return (
              <div 
                key={shift.id}
                onClick={() => setSelectedShiftId(shift.id)}
                className="bg-white dark:bg-slate-900 hacker:bg-black border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left info */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${shift.status === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'} hacker:border hacker:border-[#0f0]/30`}>
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white hacker:text-[#0f0] text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors hacker:font-mono">{shift.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500 hacker:text-[#0f0]/60 hacker:font-mono">
                          <Calendar size={12} /> {new Date(shift.start_date).toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider hacker:font-mono ${shift.status === 'active' ? 'bg-green-100 text-green-700 hacker:bg-[#002200] hacker:text-[#0f0] hacker:border hacker:border-[#0f0]' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {shift.status === 'active' ? 'Faol' : 'Yopilgan'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 flex-1 max-w-2xl">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 hacker:font-mono">Jami Kirim</p>
                      <p className="font-black text-green-600 dark:text-green-400 hacker:text-[#0f0] flex items-center gap-1 hacker:font-mono">
                        <ArrowUpRight size={14} /> {stats.kirim.toLocaleString()} <span className="text-[10px] font-normal">so'm</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 hacker:font-mono">Jami Chiqim</p>
                      <p className="font-black text-red-500 dark:text-red-400 hacker:text-[#f00] flex items-center gap-1 hacker:font-mono">
                        <ArrowDownRight size={14} /> {stats.chiqim.toLocaleString()} <span className="text-[10px] font-normal">so'm</span>
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 hacker:font-mono">
                        {isProfit ? 'Foyda' : isLoss ? 'Zarar' : 'Natija'}
                      </p>
                      <p className={`font-black hacker:font-mono ${isProfit ? 'text-green-600 dark:text-green-400' : isLoss ? 'text-red-500 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>
                        {Math.abs(stats.balance).toLocaleString()} <span className="text-[10px] font-normal opacity-50">so'm</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Action */}
                  <div className="flex items-center gap-2 justify-end">
                    <button 
                      onClick={(e) => handleDeleteShift(e, shift.id)}
                      className="p-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl hover:bg-red-100 transition-all hacker:border hacker:border-[#f00]"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm hacker:border hacker:border-[#0f0]">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-slate-900 hacker:bg-black rounded-3xl p-20 text-center border border-dashed border-slate-200 dark:border-slate-800 hacker:border-[#0f0]">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 hacker:border hacker:border-[#0f0]">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-400 dark:text-slate-500 mb-2 hacker:text-[#0f0] hacker:font-mono">Smenalar topilmadi</h3>
            <p className="text-slate-300 dark:text-slate-600 hacker:text-[#0f0]/60 hacker:font-mono">Qidiruv so'rovini yoki filtrni o'zgartirib ko'ring.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
