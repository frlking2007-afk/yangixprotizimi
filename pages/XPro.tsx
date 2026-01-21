
import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Wallet, CreditCard, 
  Banknote, TrendingDown, Save, Clock, 
  PlayCircle, StopCircle, RefreshCcw, 
  FolderPlus, Tags, Edit2, X, AlertTriangle
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

      // Default subtab
      if (activeTab === 'Xarajat' && !activeSubTab && categories.length > 0) {
        setActiveSubTab(categories[0].name);
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

  // Formatlash funksiyasi: 1234567 -> 1 234 567
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
      alert("Smena ochishda xatolik");
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
      alert("Xatolik!");
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCatName.trim()) return;
    try {
      await updateExpenseCategory(editingCategory.id, editCatName);
      const updated = expenseCategories.map(c => c.id === editingCategory.id ? { ...c, name: editCatName } : c);
      setExpenseCategories(updated);
      if (activeSubTab === editingCategory.name) setActiveSubTab(editCatName);
      setEditingCategory(null);
    } catch (err) {
      alert("Yangilashda xato!");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Ushbu kategoriyani butunlay o'chirmoqchimisiz? Tarixdagi ma'lumotlar saqlanib qoladi.")) return;
    try {
      await deleteExpenseCategory(id);
      const updated = expenseCategories.filter(c => c.id !== id);
      setExpenseCategories(updated);
      if (updated.length > 0) setActiveSubTab(updated[0].name);
      else setActiveSubTab(null);
      setEditingCategory(null);
    } catch (err) {
      alert("O'chirishda xato!");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = formData.amount.replace(/\s/g, '');
    // Faqat summa va smena majburiy, izoh ixtiyoriy
    if (!cleanAmount || !activeShift) return;

    try {
      const isExpense = activeTab === 'Xarajat';
      const type: TransactionType = isExpense ? 'chiqim' : 'kirim';
      
      await saveTransaction({
        shift_id: activeShift.id,
        amount: parseFloat(cleanAmount),
        description: formData.description || (isExpense ? (activeSubTab || 'Xarajat') : activeTab),
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
        <p className="text-slate-500 font-medium">Yuklanmoqda...</p>
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
    <div className="space-y-4 animate-in fade-in duration-500 pb-20">
      {/* Header - Yuqorida, yanada ixcham */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 -mt-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <Clock size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">{activeShift.name}</h3>
            <span className="text-[9px] font-bold text-green-600 uppercase">Faol Smena</span>
          </div>
        </div>
        <button onClick={() => closeShift(activeShift.id).then(() => window.location.reload())} className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all flex items-center gap-2 text-xs">
          <StopCircle size={16} /> Smenani yopish
        </button>
      </div>

      {/* Main Tabs - Ixchamroq */}
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
              ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
              : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Categories Grid - Gaplar va o'lchamlar kichraytirildi */}
      {activeTab === 'Xarajat' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kategoriyalar</h4>
            <button 
              onClick={() => setShowAddCategory(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all font-bold text-[10px]"
            >
              <Plus size={12} /> Kartochka qo'shish
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
            {expenseCategories.map(cat => (
              <div 
                key={cat.id}
                className={`relative group h-12 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center p-2 ${
                  activeSubTab === cat.name 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                  : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 shadow-sm'
                }`}
                onClick={() => setActiveSubTab(cat.name)}
              >
                <span className="font-bold text-center break-words w-full text-[13px] leading-tight px-1">{cat.name}</span>
                
                {/* Edit Button - Kichikroq */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategory(cat);
                    setEditCatName(cat.name);
                  }}
                  className={`absolute top-1 right-1 p-0.5 rounded-md transition-all ${
                    activeSubTab === cat.name ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-400 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <Edit2 size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal - Standart */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-800">Yangi Kartochka</h3>
              <button onClick={() => setShowAddCategory(false)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <input 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nomini kiriting..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                autoFocus
              />
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">Saqlash</button>
            </form>
          </div>
        </div>
      )}

      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-800">Tahrirlash</h3>
              <button onClick={() => setEditingCategory(null)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleUpdateCategory} className="space-y-3">
              <input 
                value={editCatName}
                onChange={(e) => setEditCatName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => handleDeleteCategory(editingCategory.id)} className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 flex items-center justify-center gap-1.5 text-sm">
                  <Trash2 size={16} /> O'chirish
                </button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg text-sm">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form - Izoh ixtiyoriy qilindi */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm sticky top-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-lg text-slate-800 flex items-center gap-2 capitalize">
                {activeTab} {activeSubTab && <span className="text-indigo-600 text-sm">({activeSubTab})</span>}
              </h3>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Jami</p>
                <p className="font-black text-slate-800 text-sm">{subTabTotal.toLocaleString()} so'm</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="relative">
                <input 
                  type="text" required inputMode="numeric"
                  value={formData.amount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-black text-2xl transition-all"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-300 text-sm">so'm</span>
              </div>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={2}
                placeholder="Izoh yozing (ixtiyoriy)..."
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none font-medium text-sm"
              />
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm">
                <Save size={20} /> Saqlash
              </button>
            </form>
          </div>
        </div>

        {/* History - Ro'yxat masofalari kamaytirildi */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-slate-800 text-sm">So'nggi operatsiyalar</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredTransactions.length} ta</span>
          </div>

          <div className="space-y-2">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t) => (
                <div key={t.id} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all animate-in slide-in-from-right-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.type === 'kirim' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {t.type === 'kirim' ? <Plus size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-[13px] leading-tight">{t.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-bold text-slate-400">{new Date(t.date).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'})}</span>
                        {t.sub_category && <span className="px-1.5 py-0.5 bg-slate-100 text-indigo-500 rounded text-[8px] font-black uppercase">{t.sub_category}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`font-black text-sm ${t.type === 'kirim' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'kirim' ? '+' : '-'}{t.amount.toLocaleString()}
                    </p>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                <p className="text-slate-300 font-bold italic text-sm">Ma'lumot yo'q</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default XPro;
