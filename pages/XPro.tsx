
import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Wallet, CreditCard, 
  Banknote, TrendingDown, Save, Clock, 
  PlayCircle, StopCircle, RefreshCcw, AlertTriangle,
  FolderPlus, ChevronRight, Tags
} from 'lucide-react';
import { Transaction, TransactionType, Shift, ExpenseCategory } from '../types';
import { 
  getActiveShift, startNewShift, closeShift, 
  getTransactionsByShift, saveTransaction, deleteTransaction,
  getExpenseCategories, createExpenseCategory
} from '../services/supabase';

const XPro: React.FC = () => {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States
  const [activeTab, setActiveTab] = useState<string>('Kassa');
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  const handleStartShift = async () => {
    setErrorMsg(null);
    try {
      const shift = await startNewShift();
      if (shift) setActiveShift(shift);
    } catch (err: any) {
      setErrorMsg("Smena ochishda xatolik: " + err.message);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const cat = await createExpenseCategory(newCatName);
      if (cat) {
        setExpenseCategories([...expenseCategories, cat]);
        setNewCatName('');
        setShowAddCategory(false);
        setActiveSubTab(cat.name);
      }
    } catch (err) {
      alert("Kategoriya qo'shishda xato");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description || !activeShift) return;

    try {
      const isExpense = activeTab === 'Xarajat';
      const type: TransactionType = isExpense ? 'chiqim' : 'kirim';
      
      await saveTransaction({
        shift_id: activeShift.id,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: activeTab,
        sub_category: isExpense ? (activeSubTab || 'Boshqa') : undefined,
        type: type
      });

      setFormData({ amount: '', description: '' });
      const trans = await getTransactionsByShift(activeShift.id);
      setTransactions(trans);
    } catch (err) {
      alert("Saqlashda xato yuz berdi.");
    }
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
        <button onClick={handleStartShift} className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 scale-105 hover:scale-110 active:scale-95">
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{activeShift.name}</h3>
            <span className="text-xs font-bold text-green-600 uppercase">Faol Smena</span>
          </div>
        </div>
        <button onClick={() => closeShift(activeShift.id).then(() => window.location.reload())} className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all flex items-center gap-2">
          <StopCircle size={20} /> Smenani yopish
        </button>
      </div>

      {/* Main Tabs and Add Category Button */}
      <div className="flex flex-wrap items-center gap-2">
        {mainTabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => {
              setActiveTab(tab.name);
              setActiveSubTab(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all border ${
              activeTab === tab.name 
              ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
              : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
            }`}
          >
            <tab.icon size={18} />
            {tab.name}
          </button>
        ))}
        
        {/* Dynamic Category Adder */}
        <div className="ml-auto">
          <button 
            onClick={() => setShowAddCategory(!showAddCategory)}
            className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all shadow-sm"
            title="Kategoriya qo'shish"
          >
            <FolderPlus size={20} />
          </button>
        </div>
      </div>

      {/* Expense Sub-categories (only if Xarajat is active) */}
      {activeTab === 'Xarajat' && (
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 rounded-2xl animate-in slide-in-from-top-2">
          <button
            onClick={() => setActiveSubTab(null)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!activeSubTab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Barchasi
          </button>
          {expenseCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveSubTab(cat.name)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSubTab === cat.name ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Add Category Form (Modal-like) */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-800 mb-6">Yangi Kategoriya</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <input 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Masalan: Shashlik, Ijara..."
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                autoFocus
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddCategory(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl">Bekor qilish</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm sticky top-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-xl text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Plus size={20} /></div>
                {activeTab} {activeSubTab && `(${activeSubTab})`}
              </h3>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Jami sarf</p>
                <p className="font-black text-slate-800">{subTabTotal.toLocaleString()} so'm</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Summa</label>
                <div className="relative">
                  <input 
                    type="number" required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full pl-6 pr-16 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-black text-2xl transition-all"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-slate-300">so'm</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Tavsif / Izoh</label>
                <textarea 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  placeholder="Nima uchun?"
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none font-medium"
                />
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98]">
                <Save size={24} /> Saqlash
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-slate-400" />
              Tarix {activeSubTab && <span className="text-indigo-600">/ {activeSubTab}</span>}
            </h3>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Tags size={14} /> {filteredTransactions.length} ta
            </div>
          </div>

          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t) => (
                <div key={t.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all animate-in slide-in-from-right-2">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.type === 'kirim' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {t.type === 'kirim' ? <Plus size={24} /> : <TrendingDown size={24} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{t.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400">{new Date(t.date).toLocaleTimeString('uz-UZ')}</span>
                        {t.sub_category && <span className="px-2 py-0.5 bg-slate-50 text-indigo-500 rounded-md text-[9px] font-black uppercase">{t.sub_category}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className={`font-black text-lg ${t.type === 'kirim' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'kirim' ? '+' : '-'}{t.amount.toLocaleString()}
                    </p>
                    <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-[2.5rem] p-20 text-center border border-dashed border-slate-200">
                <p className="text-slate-300 font-bold italic">Ma'lumot topilmadi</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default XPro;
