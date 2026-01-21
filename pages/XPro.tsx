
import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit2, Wallet, CreditCard, Download, 
  Banknote, TrendingDown, Save, Clock, CheckCircle2, 
  PlayCircle, StopCircle, RefreshCcw
} from 'lucide-react';
import { Transaction, TransactionType, Shift } from '../types';
import { 
  getActiveShift, startNewShift, closeShift, 
  getTransactionsByShift, saveTransaction, deleteTransaction 
} from '../services/supabase';

const XPro: React.FC = () => {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('Kassa');
  
  const [formData, setFormData] = useState({ amount: '', description: '' });

  const initShift = async () => {
    setLoading(true);
    const shift = await getActiveShift();
    setActiveShift(shift);
    if (shift) {
      const trans = await getTransactionsByShift(shift.id);
      setTransactions(trans);
    }
    setLoading(false);
  };

  useEffect(() => {
    initShift();
  }, []);

  const handleStartShift = async () => {
    const shift = await startNewShift();
    if (shift) setActiveShift(shift);
  };

  const handleCloseShift = async () => {
    if (activeShift && confirm("Smenani yopmoqchimisiz? Yopilgandan so'ng ma'lumot kiritib bo'lmaydi.")) {
      await closeShift(activeShift.id);
      setActiveShift(null);
      setTransactions([]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description || !activeShift) return;

    const type: TransactionType = activeCategory === 'Xarajat' ? 'chiqim' : 'kirim';
    
    await saveTransaction({
      shift_id: activeShift.id,
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: activeCategory,
      type: type
    });

    setFormData({ amount: '', description: '' });
    const trans = await getTransactionsByShift(activeShift.id);
    setTransactions(trans);
  };

  const handleDelete = async (id: string) => {
    if (confirm("O'chirmoqchimisiz?")) {
      await deleteTransaction(id);
      if (activeShift) {
        const trans = await getTransactionsByShift(activeShift.id);
        setTransactions(trans);
      }
    }
  };

  const categories = [
    { name: 'Kassa', icon: Banknote },
    { name: 'Click', icon: CreditCard },
    { name: 'Uzcard', icon: Wallet },
    { name: 'Humo', icon: CreditCard },
    { name: 'Xarajat', icon: TrendingDown },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <RefreshCcw className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 font-medium">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <PlayCircle size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-3">Xush kelibsiz!</h2>
        <p className="text-slate-500 mb-8 max-w-sm">Kassa operatsiyalarini boshlash uchun avval yangi smena ochishingiz kerak.</p>
        <button 
          onClick={handleStartShift}
          className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 scale-105 hover:scale-110 active:scale-95"
        >
          <PlayCircle size={24} />
          Hisobotni boshlash
        </button>
      </div>
    );
  }

  const filteredTransactions = transactions.filter(t => t.category === activeCategory);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Header with Shift Status */}
      <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{activeShift.name}</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
              <span className="text-xs font-bold text-green-600 uppercase tracking-tighter">Smena Faol</span>
            </div>
          </div>
        </div>
        <button 
          onClick={handleCloseShift}
          className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all border border-red-100"
        >
          <StopCircle size={20} />
          Smenani yopish
        </button>
      </div>

      {/* Category Buttons */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all border ${
              activeCategory === cat.name 
              ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
              : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
            }`}
          >
            <cat.icon size={18} />
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm sticky top-8">
            <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
              <Plus className="text-indigo-600" size={20} />
              Yangi {activeCategory}
            </h3>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Summa</label>
                <div className="relative">
                  <input 
                    type="number" required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full pl-4 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold text-xl transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-300">so'm</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Tavsif</label>
                <textarea 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  placeholder="Izoh qoldiring..."
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none"
                />
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                <Save size={20} /> Saqlash
              </button>
            </form>
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-slate-400" />
              Smena Tarixi
            </h3>
            <span className="text-xs font-bold text-slate-400">{filteredTransactions.length} ta operatsiya</span>
          </div>

          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t) => (
                <div key={t.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.type === 'kirim' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {t.type === 'kirim' ? <Plus size={24} /> : <TrendingDown size={24} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{t.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(t.date).toLocaleTimeString('uz-UZ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className={`font-black text-lg ${t.type === 'kirim' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'kirim' ? '+' : '-'}{t.amount.toLocaleString()}
                    </p>
                    <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium italic">Ushbu bo'limda hali ma'lumot yo'q</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default XPro;
