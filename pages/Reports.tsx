
import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar, Clock, 
  ChevronRight, ArrowUpRight, ArrowDownRight, 
  FileText, CheckCircle2, XCircle, RefreshCcw,
  ArrowLeft, Wallet, CreditCard, Banknote, TrendingDown,
  PieChart, Tag, Info, Trash2
} from 'lucide-react';
import { Shift, Transaction } from '../types.ts';
import { getAllShifts, getTransactions, deleteShift, getDeletionPassword } from '../services/supabase.ts';

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
      setShifts(sData || []);
      setTransactions(tData || []);
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
    const kirim = shiftTrans.filter(t => t.type === 'kirim').reduce((s, c) => s + (c.amount || 0), 0);
    const chiqim = shiftTrans.filter(t => t.type === 'chiqim').reduce((s, c) => s + (c.amount || 0), 0);
    
    const categoryTotals = shiftTrans.reduce((acc, t) => {
      const cat = t.category;
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += (t.amount || 0);
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
    e.stopPropagation();
    const password = prompt("Smenani o'chirish paroli:");
    if (password === null) return;
    try {
      const correctPassword = await getDeletionPassword();
      if (password !== correctPassword) {
        alert("Parol noto'g'ri!");
        return;
      }
      if (confirm("Haqiqatan ham o'chirilsinmi?")) {
        await deleteShift(shiftId);
        await fetchData();
        if (selectedShiftId === shiftId) setSelectedShiftId(null);
      }
    } catch (err: any) {
      alert("Xato: " + err.message);
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
        <p className="text-slate-500 hacker:text-[#0f0] font-medium">Hisobotlar tayyorlanmoqda...</p>
      </div>
    );
  }

  if (selectedShift && shiftStats) {
    const isProfit = shiftStats.balance > 0;
    const isLoss = shiftStats.balance < 0;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedShiftId(null)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 font-bold rounded-xl"
          >
            <ArrowLeft size={18} /> Orqaga
          </button>
          <button 
            onClick={(e) => handleDeleteShift(e, selectedShift.id)}
            className="p-2.5 bg-red-50 text-red-600 rounded-xl"
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">{selectedShift.name}</h2>
          <div className="flex flex-wrap gap-4 text-slate-400 text-sm mt-2">
            <span>Ochilgan: {new Date(selectedShift.start_date).toLocaleString()}</span>
            {selectedShift.end_date && <span>Yopilgan: {new Date(selectedShift.end_date).toLocaleString()}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Jami Kirim</p>
            <h3 className="text-2xl font-black text-green-600">{shiftStats.kirim.toLocaleString()} so'm</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Jami Chiqim</p>
            <h3 className="text-2xl font-black text-red-500">{shiftStats.chiqim.toLocaleString()} so'm</h3>
          </div>
          <div className={`p-6 rounded-[2rem] border ${isProfit ? 'bg-green-600 text-white' : isLoss ? 'bg-red-500 text-white' : 'bg-white text-slate-800'}`}>
            <p className="text-xs font-bold uppercase mb-2">{isProfit ? 'Foyda' : 'Zarar'}</p>
            <h3 className="text-2xl font-black">{Math.abs(shiftStats.balance).toLocaleString()} so'm</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100">
          <h4 className="font-bold mb-4">Amallar</h4>
          <div className="space-y-2">
            {shiftStats.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'kirim' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {t.type === 'kirim' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{t.description}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{t.category}</p>
                  </div>
                </div>
                <p className={`font-black text-sm ${t.type === 'kirim' ? 'text-green-600' : 'text-red-500'}`}>{(t.amount || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-100 rounded-2xl outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredShifts.map((shift) => {
          const stats = getShiftStats(shift.id);
          return (
            <div 
              key={shift.id}
              onClick={() => setSelectedShiftId(shift.id)}
              className="bg-white dark:bg-slate-900 border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-lg group-hover:text-indigo-600 transition-colors">{shift.name}</h4>
                  <p className="text-xs text-slate-400">{new Date(shift.start_date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-indigo-600">{stats.balance.toLocaleString()} so'm</p>
                  <p className="text-[10px] text-slate-400 uppercase">{shift.status}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Reports;
