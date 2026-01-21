
import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar, Clock, 
  ChevronRight, ArrowUpRight, ArrowDownRight, 
  FileText, CheckCircle2, XCircle, RefreshCcw,
  ArrowLeft, Wallet, CreditCard, Banknote, TrendingDown,
  PieChart, Tag, Info
} from 'lucide-react';
import { Shift, Transaction } from '../types';
import { getAllShifts, getTransactions } from '../services/supabase';

const Reports: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [sData, tData] = await Promise.all([
        getAllShifts(),
        getTransactions()
      ]);
      setShifts(sData);
      setTransactions(tData);
      setLoading(false);
    };
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
        <RefreshCcw className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 font-medium">Hisobotlar tayyorlanmoqda...</p>
      </div>
    );
  }

  // Shift Detail View
  if (selectedShift && shiftStats) {
    const isProfit = shiftStats.balance > 0;
    const isLoss = shiftStats.balance < 0;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Detail Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedShiftId(null)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft size={18} /> Orqaga qaytish
          </button>
          <div className="flex items-center gap-3">
             <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${selectedShift.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
               {selectedShift.status === 'active' ? 'Faol' : 'Yopilgan'}
             </span>
          </div>
        </div>

        {/* Shift Title Info */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <h2 className="text-2xl font-black text-slate-800 mb-2">{selectedShift.name}</h2>
          <div className="flex flex-wrap gap-4 text-slate-400 text-sm font-medium">
            <span className="flex items-center gap-1.5"><Calendar size={16} /> Ochilgan: {new Date(selectedShift.start_date).toLocaleString('uz-UZ')}</span>
            {selectedShift.end_date && <span className="flex items-center gap-1.5"><Clock size={16} /> Yopilgan: {new Date(selectedShift.end_date).toLocaleString('uz-UZ')}</span>}
          </div>
        </div>

        {/* Big Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Jami Kirim</p>
            <div className="flex items-center justify-between">
               <h3 className="text-3xl font-black text-green-600">{shiftStats.kirim.toLocaleString()} <span className="text-sm font-bold">so'm</span></h3>
               <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><ArrowUpRight size={20}/></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Jami Chiqim</p>
            <div className="flex items-center justify-between">
               <h3 className="text-3xl font-black text-red-500">{shiftStats.chiqim.toLocaleString()} <span className="text-sm font-bold">so'm</span></h3>
               <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center"><ArrowDownRight size={20}/></div>
            </div>
          </div>
          <div className={`p-6 rounded-[2rem] border shadow-sm ${isProfit ? 'bg-green-600 border-green-600 text-white' : isLoss ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-slate-100 text-slate-800'}`}>
            <p className={`text-xs font-bold uppercase mb-2 ${isProfit || isLoss ? 'text-white/80' : 'text-slate-400'}`}>
              {isProfit ? 'Jami Foyda' : isLoss ? 'Jami Zarar' : 'Natija'}
            </p>
            <div className="flex items-center justify-between">
               <h3 className="text-3xl font-black">{Math.abs(shiftStats.balance).toLocaleString()} <span className="text-sm font-bold">so'm</span></h3>
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isProfit || isLoss ? 'bg-white/20' : 'bg-slate-50'}`}>
                 {isProfit ? <TrendingDown className="rotate-180" size={20}/> : <TrendingDown size={20}/>}
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Categorized Summary */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="font-bold text-slate-800 flex items-center gap-2"><PieChart size={18}/> Kategoriyalar kesimida</h4>
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              {Object.entries(shiftStats.categoryTotals).map(([cat, total]) => {
                const isExpense = cat === 'Xarajat';
                return (
                  <div key={cat} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isExpense ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600'}`}>
                        {cat === 'Kassa' ? <Banknote size={18}/> : cat === 'Click' ? <CreditCard size={18}/> : <Tag size={18}/>}
                      </div>
                      <span className="font-bold text-slate-700 text-sm">{cat}</span>
                    </div>
                    <span className={`font-black text-sm ${isExpense ? 'text-red-500' : 'text-slate-800'}`}>
                      {isExpense ? '-' : '+'}{total.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl">
               <div className="flex items-center gap-2 mb-3 text-indigo-400">
                 <Info size={18}/>
                 <h5 className="font-bold text-sm uppercase">Qisqacha xulosa</h5>
               </div>
               <p className="text-sm text-slate-300 leading-relaxed font-medium">
                 Ushbu smena davomida jami <span className="text-white font-bold">{shiftStats.count} ta</span> operatsiya amalga oshirildi. 
                 {isProfit ? "Smena foyda bilan yakunlandi." : isLoss ? "Smena zarar bilan yakunlandi." : "Kirim va chiqim teng bo'ldi."}
               </p>
            </div>
          </div>

          {/* Detailed Transaction List */}
          <div className="lg:col-span-8 space-y-4">
            <h4 className="font-bold text-slate-800">Barcha operatsiyalar</h4>
            <div className="space-y-2">
              {shiftStats.transactions.map((t) => (
                <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-indigo-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.type === 'kirim' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {t.type === 'kirim' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-wider">{t.category}</span>
                        {t.sub_category && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-wider">{t.sub_category}</span>}
                      </div>
                      <p className="font-bold text-slate-800 text-[13px] mt-1">{t.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-sm ${t.type === 'kirim' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'kirim' ? '+' : '-'}{t.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Smena nomini qidiring..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
          />
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-full md:w-auto">
          <button 
            onClick={() => setFilter('all')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === 'all' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Barchasi
          </button>
          <button 
            onClick={() => setFilter('active')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${filter === 'active' ? 'bg-green-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <CheckCircle2 size={16} /> Faol
          </button>
          <button 
            onClick={() => setFilter('closed')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${filter === 'closed' ? 'bg-red-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
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
                className="bg-white border border-slate-100 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left info */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${shift.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{shift.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                          <Calendar size={12} /> {new Date(shift.start_date).toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${shift.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {shift.status === 'active' ? 'Faol' : 'Yopilgan'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 flex-1 max-w-2xl">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jami Kirim</p>
                      <p className="font-black text-green-600 flex items-center gap-1">
                        <ArrowUpRight size={14} /> {stats.kirim.toLocaleString()} <span className="text-[10px] font-normal">so'm</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jami Chiqim</p>
                      <p className="font-black text-red-500 flex items-center gap-1">
                        <ArrowDownRight size={14} /> {stats.chiqim.toLocaleString()} <span className="text-[10px] font-normal">so'm</span>
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {isProfit ? 'Foyda' : isLoss ? 'Zarar' : 'Natija'}
                      </p>
                      <p className={`font-black ${isProfit ? 'text-green-600' : isLoss ? 'text-red-500' : 'text-slate-800'}`}>
                        {Math.abs(stats.balance).toLocaleString()} <span className="text-[10px] font-normal opacity-50">so'm</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Action */}
                  <div className="flex items-center justify-end">
                    <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-400 mb-2">Smenalar topilmadi</h3>
            <p className="text-slate-300">Qidiruv so'rovini yoki filtrni o'zgartirib ko'ring.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
