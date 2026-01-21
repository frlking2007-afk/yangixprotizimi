
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Calendar, Clock, 
  ChevronRight, ArrowUpRight, ArrowDownRight, 
  LayoutGrid, List, FileText, CheckCircle2,
  XCircle, RefreshCcw
} from 'lucide-react';
import { Shift, Transaction } from '../types';
import { getAllShifts, getTransactions } from '../services/supabase';

const Reports: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');

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
    return { kirim, chiqim, balance: kirim - chiqim, count: shiftTrans.length };
  };

  const filteredShifts = shifts.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <RefreshCcw className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 font-medium">Hisobotlar tayyorlanmoqda...</p>
      </div>
    );
  }

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
            return (
              <div 
                key={shift.id}
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
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sof Balans</p>
                      <p className="font-black text-slate-800">
                        {stats.balance.toLocaleString()} <span className="text-[10px] font-normal opacity-50">so'm</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Action */}
                  <div className="flex items-center justify-end">
                    <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
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
