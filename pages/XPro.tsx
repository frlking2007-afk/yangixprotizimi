
import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Wallet, CreditCard, 
  Banknote, TrendingDown, Save, Clock, 
  PlayCircle, StopCircle, RefreshCcw, 
  Edit2
} from 'lucide-react';
import { Transaction, TransactionType, Shift, ExpenseCategory } from '../types';
import { 
  getActiveShift, startNewShift, closeShift, 
  getTransactionsByShift, saveTransaction, deleteTransaction,
  getExpenseCategories, createExpenseCategory, 
  updateExpenseCategory, deleteExpenseCategory
} from '../services/supabase';

const XPro: React.FC = () => {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // UI States
  const [activeTab, setActiveTab] = useState<string>('Kassa');
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [editCatName, setEditCatName] = useState('');
  const [formData, setFormData] = useState({ amount: '', description: '' });

  const initData = async () => {
    setLoading(true);
    try {
      const [shift, categories] = await Promise.all([
        getActiveShift(),
        getExpenseCategories()
      ]);
      
      setActiveShift(shift);
      setExpenseCategories(categories);
      
      if (shift) {
        const trans = await getTransactionsByShift(shift.id);
        setTransactions(trans);
      }

      if (activeTab === 'Xarajat' && !activeSubTab && categories.length > 0) {
        setActiveSubTab(categories[0].name);
      }
    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  const formatAmount = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value);
    setFormData({ ...formData, amount: formatted });
  };

  const handleStartShift = async () => {
    try {
      const shift = await startNewShift();
      if (shift) setActiveShift(shift);
    } catch (err: any) {
      alert("Smena ochishda xatolik: " + (err.message || "Noma'lum"));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = formData.amount.replace(/\s/g, '');
    if (!cleanAmount || !activeShift) return;
    
    const numAmount = parseFloat(cleanAmount);
    if (isNaN(numAmount)) {
      alert("Iltimos, to'g'ri raqam kiriting.");
      return;
    }

    setIsSaving(true);
    try {
      const isExpense = activeTab === 'Xarajat';
      const type: TransactionType = isExpense ? 'chiqim' : 'kirim';
      
      const payload = {
        shift_id: activeShift.id,
        amount: numAmount,
        description: formData.description.trim() || (isExpense ? (activeSubTab || 'Xarajat') : activeTab),
        category: activeTab,
        sub_category: isExpense ? (activeSubTab || 'Boshqa') : null,
        type: type
      };

      const result = await saveTransaction(payload);
      
      if (result) {
        setFormData({ amount: '', description: '' });
        const trans = await getTransactionsByShift(activeShift.id);
        setTransactions(trans);
      }
    } catch (err: any) {
      console.error("Save error details:", err);
      alert("Saqlashda xato yuz berdi: " + (err.message || "Bazaga bog'lanib bo'lmadi"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("O'chirmoqchimisiz?")) {
      try {
        await deleteTransaction(id);
        if (activeShift) {
          const trans = await getTransactionsByShift(activeShift.id);
          setTransactions(trans);
        }
      } catch (err: any) {
        alert("O'chirishda xato: " + err.message);
      }
    }
  };

  const mainTabs = [
    { name: 'Kassa', icon: Banknote },
    { name: 'Click', icon: CreditCard },
    { name: 'Uzcard', icon: Wallet },
    { name: 'Humo', icon: CreditCard },
    { name: 'Xarajat', icon: TrendingDown },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <RefreshCcw className="animate-spin text-indigo-600 hacker:text-[#0f0]" size={40} />
        <p className="text-slate-500 dark:text-slate-400 hacker:text-[#0f0] font-medium hacker:font-mono">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hacker:bg-[#001100] hacker:border hacker:border-[#0f0] hacker:text-[#0f0] rounded-full flex items-center justify-center mb-6 animate-pulse">
          <PlayCircle size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white hacker:text-[#0f0] hacker:font-mono mb-3">Xush kelibsiz!</h2>
        <button onClick={handleStartShift} className="px-10 py-4 bg-indigo-600 hacker:bg-[#0f0] text-white hacker:text-black font-bold rounded-2xl hacker:rounded-none hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none flex items-center gap-3 scale-105 hover:scale-110 active:scale-95">
          <PlayCircle size={24} /> Hisobotni boshlash
        </button>
      </div>
    );
  }

  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'Xarajat') {
      return t.category === 'Xarajat' && (activeSubTab ? t.sub_category === activeSubTab : true);
    }
    return t.category === activeTab;
  });

  const subTabTotal = filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20">
      <div className="bg-white dark:bg-slate-900 hacker:bg-black p-3 md:p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 -mt-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hacker:text-[#0f0] rounded-xl flex items-center justify-center">
            <Clock size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white hacker:text-[#0f0] text-sm hacker:font-mono">{activeShift.name}</h3>
            <span className="text-[9px] font-bold text-green-600 dark:text-green-400 hacker:text-[#0f0] uppercase hacker:font-mono">Faol Smena</span>
          </div>
        </div>
        <button onClick={() => closeShift(activeShift.id).then(() => window.location.reload())} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 transition-all flex items-center gap-2 text-xs hacker:font-mono hacker:border hacker:border-[#f00]">
          <StopCircle size={16} /> Smenani yopish
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {mainTabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => {
              setActiveTab(tab.name);
              if (tab.name === 'Xarajat' && expenseCategories.length > 0) {
                setActiveSubTab(expenseCategories[0].name);
              } else {
                setActiveSubTab(null);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all border text-sm ${
              activeTab === tab.name 
              ? 'bg-slate-900 dark:bg-slate-700 hacker:bg-[#003300] text-white hacker:text-[#0f0] border-slate-900 dark:border-slate-700 hacker:border-[#0f0] shadow-md' 
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hacker:text-[#0f0]/60 border-slate-100 dark:border-slate-800 hacker:border-[#0f0]/30 hover:border-slate-300'
            } hacker:rounded-none hacker:font-mono`}
          >
            <tab.icon size={16} />
            {tab.name}
          </button>
        ))}
      </div>

      {activeTab === 'Xarajat' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hacker:text-[#0f0] uppercase tracking-widest hacker:font-mono">Kategoriyalar</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
            {expenseCategories.map(cat => (
              <div 
                key={cat.id}
                className={`relative group h-12 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center p-2 ${
                  activeSubTab === cat.name 
                  ? 'bg-indigo-600 hacker:bg-[#002200] border-indigo-600 hacker:border-[#0f0] text-white hacker:text-[#0f0] shadow-sm' 
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hacker:text-[#0f0]/60 hover:border-indigo-200 shadow-sm'
                } hacker:rounded-none hacker:font-mono`}
                onClick={() => setActiveSubTab(cat.name)}
              >
                <span className="font-bold text-center break-words w-full text-[13px] leading-tight px-1">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 hacker:bg-black rounded-3xl p-5 md:p-6 border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] shadow-sm sticky top-4 hacker:rounded-none">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-lg text-slate-800 dark:text-white hacker:text-[#0f0] flex items-center gap-2 capitalize hacker:font-mono">
                {activeTab} {activeSubTab && <span className="text-indigo-600 dark:text-indigo-400 hacker:text-[#0f0] text-sm hacker:font-mono">({activeSubTab})</span>}
              </h3>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 hacker:text-[#0f0] uppercase hacker:font-mono">Jami</p>
                <p className="font-black text-slate-800 dark:text-white hacker:text-[#0f0] text-sm hacker:font-mono">{subTabTotal.toLocaleString()} so'm</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="relative">
                <input 
                  type="text" required inputMode="numeric"
                  value={formData.amount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  disabled={isSaving}
                  className="w-full pl-5 pr-14 py-4 bg-slate-50 dark:bg-slate-950 hacker:bg-black border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] rounded-2xl hacker:rounded-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none font-black text-2xl transition-all dark:text-white hacker:text-[#0f0] hacker:font-mono disabled:opacity-50"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-300 dark:text-slate-600 hacker:text-[#0f0]/40 text-sm hacker:font-mono">so'm</span>
              </div>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={2}
                disabled={isSaving}
                placeholder="Izoh yozing (ixtiyoriy)..."
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 hacker:bg-black border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] rounded-2xl hacker:rounded-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all resize-none font-medium text-sm dark:text-white hacker:text-[#0f0] hacker:font-mono disabled:opacity-50"
              />
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full py-4 bg-indigo-600 hacker:bg-[#0f0] text-white hacker:text-black font-black rounded-2xl hacker:rounded-none hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm hacker:font-mono disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />}
                {isSaving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-slate-800 dark:text-white hacker:text-[#0f0] text-sm hacker:font-mono">So'nggi operatsiyalar</h3>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hacker:text-[#0f0] uppercase tracking-widest hacker:font-mono">{filteredTransactions.length} ta</span>
          </div>

          <div className="space-y-2">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t) => (
                <div key={t.id} className="bg-white dark:bg-slate-900 hacker:bg-black p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all hacker:rounded-none">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.type === 'kirim' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'} hacker:rounded-none hacker:border hacker:border-[#0f0]`}>
                      {t.type === 'kirim' ? <Plus size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white hacker:text-[#0f0] text-[13px] leading-tight hacker:font-mono">{t.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 hacker:text-[#0f0]/60 hacker:font-mono">{new Date(t.date).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'})}</span>
                        {t.sub_category && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 rounded text-[8px] font-black uppercase hacker:font-mono hacker:border hacker:border-[#0f0] hacker:bg-black">{t.sub_category}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`font-black text-sm ${t.type === 'kirim' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'} hacker:font-mono`}>
                      {t.type === 'kirim' ? '+' : '-'}{t.amount.toLocaleString()}
                    </p>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 hacker:opacity-100 hacker:text-[#f00]">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-slate-900 hacker:bg-black rounded-3xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 hacker:border-[#0f0] hacker:rounded-none">
                <p className="text-slate-300 dark:text-slate-600 hacker:text-[#0f0]/40 font-bold italic text-sm hacker:font-mono">Ma'lumot yo'q</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default XPro;
