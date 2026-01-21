
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Wallet, CreditCard, 
  Banknote, TrendingDown, Save, Clock, 
  PlayCircle, StopCircle, RefreshCcw, 
  Edit2, X, Check, ArrowUpRight, ArrowDownRight, 
  Calculator, Download, Printer, Image as ImageIcon, FileText
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Transaction, TransactionType, Shift, ExpenseCategory } from '../types';
import { 
  getActiveShift, startNewShift, closeShift, 
  getTransactionsByShift, saveTransaction, deleteTransaction,
  getExpenseCategories, updateTransaction, getDeletionPassword,
  createExpenseCategory, updateExpenseCategory, deleteExpenseCategory
} from '../services/supabase';

const XPro: React.FC = () => {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // UI States
  const [activeTab, setActiveTab] = useState<string>('Kassa');
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  const [formData, setFormData] = useState({ amount: '', description: '' });
  const [entryType, setEntryType] = useState<TransactionType>('kirim');
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ amount: '', description: '' });

  // Refs
  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const amountInputRef = useRef<HTMLInputElement>(null);

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
        setEntryType('chiqim');
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

  // Sync entryType with activeTab
  useEffect(() => {
    if (activeTab === 'Xarajat') {
      setEntryType('chiqim');
    } else {
      setEntryType('kirim');
    }
  }, [activeTab]);

  const formatAmount = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value);
    setFormData({ ...formData, amount: formatted });
  };

  const handleEditAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value);
    setEditData({ ...editData, amount: formatted });
  };

  const handleStartShift = async () => {
    try {
      const shift = await startNewShift();
      if (shift) setActiveShift(shift);
    } catch (err: any) {
      alert("Smena ochishda xatolik: " + (err.message || "Noma'lum"));
    }
  };

  const handleAddCategory = async () => {
    const name = prompt("Yangi xarajat kategoriyasi nomini kiriting (masalan: Go'sht):");
    if (!name || name.trim() === '') return;

    try {
      const newCat = await createExpenseCategory(name.trim());
      if (newCat) {
        setExpenseCategories([...expenseCategories, newCat]);
        setActiveSubTab(newCat.name);
      }
    } catch (err: any) {
      alert("Kategoriya qo'shishda xato: " + err.message);
    }
  };

  const handleEditCategoryName = async (e: React.MouseEvent, id: string, oldName: string) => {
    e.stopPropagation();
    const newName = prompt("Kategoriya uchun yangi nom kiriting:", oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;

    try {
      await updateExpenseCategory(id, newName.trim());
      setExpenseCategories(expenseCategories.map(c => c.id === id ? { ...c, name: newName.trim() } : c));
      if (activeSubTab === oldName) setActiveSubTab(newName.trim());
    } catch (err: any) {
      alert("Nomni o'zgartirishda xato: " + err.message);
    }
  };

  const handleDeleteCategoryWithConfirmation = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const password = prompt(`"${name}" kategoriyasini o'chirish uchun parolni kiriting:`);
    if (password === null) return;

    try {
      const correctPassword = await getDeletionPassword();
      if (password !== correctPassword) {
        alert("Parol noto'g'ri!");
        return;
      }

      if (confirm(`Haqiqatan ham "${name}" kategoriyasini o'chirmoqchimisiz? Ushbu kategoriyadagi amallar o'chmaydi.`)) {
        await deleteExpenseCategory(id);
        setExpenseCategories(expenseCategories.filter(c => c.id !== id));
        if (activeSubTab === name) {
          setActiveSubTab(expenseCategories.length > 1 ? expenseCategories.find(c => c.id !== id)?.name || null : null);
        }
      }
    } catch (err: any) {
      alert("O'chirishda xato: " + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = formData.amount.replace(/\s/g, '');
    if (!cleanAmount || !activeShift) return;
    
    const numAmount = parseFloat(cleanAmount);
    if (isNaN(numAmount)) return;

    setIsSaving(true);
    try {
      const payload = {
        shift_id: activeShift.id,
        amount: numAmount,
        description: formData.description.trim() || (activeTab === 'Xarajat' ? (activeSubTab || 'Xarajat') : activeTab),
        category: activeTab,
        sub_category: activeTab === 'Xarajat' ? (activeSubTab || 'Boshqa') : null,
        type: entryType
      };

      const result = await saveTransaction(payload);
      
      if (result) {
        setFormData({ amount: '', description: '' });
        const trans = await getTransactionsByShift(activeShift.id);
        setTransactions(trans);
        // Reset to default type for the tab after saving
        if (activeTab === 'Xarajat') setEntryType('chiqim');
        else setEntryType('kirim');
      }
    } catch (err: any) {
      alert("Saqlashda xato: " + (err.message || "Xatolik"));
    } finally {
      setIsSaving(false);
    }
  };

  const setManualEntry = (type: TransactionType) => {
    setEntryType(type);
    setTimeout(() => {
      amountInputRef.current?.focus();
      amountInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditData({
      amount: t.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      description: t.description
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    const cleanAmount = editData.amount.replace(/\s/g, '');
    const numAmount = parseFloat(cleanAmount);
    if (isNaN(numAmount)) return;

    try {
      await updateTransaction(id, {
        amount: numAmount,
        description: editData.description
      });
      setEditingId(null);
      if (activeShift) {
        const trans = await getTransactionsByShift(activeShift.id);
        setTransactions(trans);
      }
    } catch (err: any) {
      alert("Tahrirlashda xato: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const password = prompt("Amalni o'chirish uchun parolni kiriting:");
    if (password === null) return;

    try {
      const correctPassword = await getDeletionPassword();
      if (password !== correctPassword) {
        alert("Parol noto'g'ri!");
        return;
      }

      await deleteTransaction(id);
      if (activeShift) {
        const trans = await getTransactionsByShift(activeShift.id);
        setTransactions(trans);
      }
    } catch (err: any) {
      alert("O'chirishda xato: " + err.message);
    }
  };

  const handlePrint = (catId: string) => {
    const el = exportRefs.current[catId];
    if (!el) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const isHacker = document.documentElement.classList.contains('hacker');
    const isDark = document.documentElement.classList.contains('dark');

    printWindow.document.write(`
      <html>
        <head>
          <title>Hisobot - ${catId}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body class="${isHacker ? 'bg-black text-[#0f0]' : isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}">
          <div class="max-w-2xl mx-auto">
            ${el.innerHTML}
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadImage = async (catId: string) => {
    const el = exportRefs.current[catId];
    if (!el) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(el, { 
        cacheBust: true,
        backgroundColor: document.documentElement.classList.contains('hacker') ? '#000' : '#fff'
      });
      const link = document.createElement('a');
      link.download = `hisobot-${catId.toLowerCase()}-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Image export error:', err);
      alert('Rasmga saqlashda xatolik yuz berdi.');
    } finally {
      setIsExporting(false);
    }
  };

  // Transaction Lists
  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'Xarajat') {
      return t.category === 'Xarajat' && (activeSubTab ? t.sub_category === activeSubTab : true);
    }
    return t.category === activeTab;
  });

  // Local Stats (Only for Expense sub-categories)
  const localSales = filteredTransactions
    .filter(t => t.type === 'kirim')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const localExpenses = filteredTransactions
    .filter(t => t.type === 'chiqim')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const localBalance = localSales - localExpenses;

  const isExpenseTab = activeTab === 'Xarajat';
  const currentCategoryName = activeSubTab || activeTab;

  const mainTabs = [
    { name: 'Kassa', icon: Banknote },
    { name: 'Click', icon: CreditCard },
    { name: 'Uzcard', icon: Wallet },
    { name: 'Humo', icon: CreditCard },
    { name: 'Xarajat', icon: TrendingDown },
    { name: 'Eksport', icon: Download },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <RefreshCcw className="animate-spin text-indigo-600 hacker:text-[#0f0]" size={40} />
        <p className="text-slate-500 hacker:text-[#0f0] font-medium hacker:font-mono">Yuklanmoqda...</p>
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

  const shiftNameWithoutTime = activeShift.name.split(' ').slice(0, 3).join(' ');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 no-print">
      {/* Smena Header */}
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

      {/* Tabs Menu */}
      <div className="flex flex-wrap items-center gap-2">
        {mainTabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => {
              setActiveTab(tab.name);
              if (tab.name === 'Xarajat' && expenseCategories.length > 0) {
                setActiveSubTab(expenseCategories[0].name);
                setEntryType('chiqim');
              } else if (tab.name !== 'Eksport') {
                setActiveSubTab(null);
                setEntryType('kirim');
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

      {activeTab === 'Eksport' ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {expenseCategories.map(cat => (
              <div key={cat.id} className="bg-white dark:bg-slate-900 hacker:bg-black rounded-[2rem] border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] shadow-sm overflow-hidden flex flex-col">
                <div ref={el => exportRefs.current[cat.name] = el} className="p-6 bg-white dark:bg-slate-900 hacker:bg-black">
                  <div className="flex items-center justify-between">
                    <div><h4 className="font-black text-slate-800 dark:text-white hacker:text-[#0f0] text-lg hacker:font-mono">{cat.name}</h4></div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 hacker:font-mono uppercase">Smena</p>
                      <p className="text-[10px] font-bold text-slate-800 dark:text-white hacker:text-[#0f0] hacker:font-mono">{shiftNameWithoutTime}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 hacker:bg-[#001100] p-4 flex gap-2 border-t border-slate-100 dark:border-slate-800 hacker:border-[#0f0]">
                  <button onClick={() => handlePrint(cat.name)} className="flex-1 py-2.5 bg-white dark:bg-slate-900 hacker:bg-black border border-slate-200 dark:border-slate-700 hacker:border-[#0f0] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hacker:text-[#0f0] hover:bg-slate-100 transition-all"><Printer size={14} /> Chop etish</button>
                  <button onClick={() => handleDownloadImage(cat.name)} disabled={isExporting} className="flex-1 py-2.5 bg-indigo-600 hacker:bg-[#0f0] text-white hacker:text-black rounded-xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-50">{isExporting ? <RefreshCcw size={14} className="animate-spin" /> : <ImageIcon size={14} />} Rasm (PNG)</button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-indigo-600 hacker:bg-[#002200] p-8 rounded-[2.5rem] text-white hacker:text-[#0f0] hacker:border hacker:border-[#0f0] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center"><FileText size={32} /></div>
              <div><h3 className="text-xl font-black hacker:font-mono">Smena bo'yicha to'liq hisobot</h3><p className="text-indigo-100 hacker:text-[#0f0]/60 text-sm font-medium hacker:font-mono">Hamma xarajatlarni bitta printer formatida chiqarish</p></div>
            </div>
            <button onClick={() => handlePrint('Barcha Xarajatlar')} className="px-8 py-4 bg-white hacker:bg-[#0f0] text-indigo-600 hacker:text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg hacker:font-mono">To'liq hisobotni chop etish</button>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'Xarajat' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 text-[10px] font-bold text-slate-400 hacker:text-[#0f0] uppercase tracking-widest hacker:font-mono">Kategoriyalar</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
                {expenseCategories.map(cat => (
                  <div 
                    key={cat.id} 
                    className={`relative group h-12 rounded-xl border transition-all cursor-pointer flex items-center justify-center p-2 ${activeSubTab === cat.name ? 'bg-indigo-600 hacker:bg-[#002200] border-indigo-600 hacker:border-[#0f0] text-white hacker:text-[#0f0]' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hacker:text-[#0f0]/60'} hacker:rounded-none hacker:font-mono`} 
                    onClick={() => { setActiveSubTab(cat.name); setEntryType('chiqim'); }}
                  >
                    <span className="font-bold text-center break-words w-full text-[13px] leading-tight px-1">{cat.name}</span>
                    
                    {/* Actions Overlay */}
                    <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={(e) => handleEditCategoryName(e, cat.id, cat.name)}
                         className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700"
                       >
                         <Edit2 size={10} />
                       </button>
                       <button 
                         onClick={(e) => handleDeleteCategoryWithConfirmation(e, cat.id, cat.name)}
                         className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700"
                       >
                         <X size={10} />
                       </button>
                    </div>
                  </div>
                ))}
                {/* Yangi kategoriya qo'shish tugmasi */}
                <button 
                  onClick={handleAddCategory}
                  className="h-12 rounded-xl border-2 border-dashed border-indigo-200 dark:border-slate-800 hacker:border-[#0f0] flex items-center justify-center gap-2 text-indigo-500 hacker:text-[#0f0] hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all hacker:rounded-none"
                >
                  <Plus size={20} />
                  <span className="font-bold text-[12px] hacker:font-mono">Qo'shish</span>
                </button>
              </div>
            </div>
          )}

          {/* 1. Form Section */}
          <div className="max-w-2xl mx-auto w-full scroll-mt-24">
            <div className={`bg-white dark:bg-slate-900 hacker:bg-black rounded-3xl p-5 md:p-6 border transition-all duration-300 shadow-sm hacker:rounded-none ${entryType === 'kirim' ? 'border-green-400 dark:border-green-600 ring-2 ring-green-50' : 'border-slate-100 dark:border-slate-800'}`}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h3 className={`font-black text-lg flex items-center gap-2 capitalize hacker:font-mono ${entryType === 'kirim' ? 'text-green-600' : 'text-slate-800 dark:text-white'}`}>
                    {entryType === 'kirim' ? 'Savdo' : 'Xarajat'} 
                    {activeSubTab && <span className="text-slate-400 dark:text-slate-600 text-sm hacker:font-mono">({activeSubTab})</span>}
                  </h3>
                  {entryType === 'kirim' && <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 rounded text-[10px] font-black uppercase animate-pulse">Savdo rejimi</span>}
                </div>
                {isExpenseTab && (
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase hacker:font-mono">{currentCategoryName} jami</p>
                    <p className="font-black text-slate-800 dark:text-white hacker:text-[#0f0] text-sm hacker:font-mono">{(entryType === 'kirim' ? localSales : localExpenses).toLocaleString()} so'm</p>
                  </div>
                )}
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="relative">
                  <input 
                    ref={amountInputRef}
                    type="text" 
                    required 
                    inputMode="numeric" 
                    value={formData.amount} 
                    onChange={handleAmountChange} 
                    placeholder="0" 
                    disabled={isSaving} 
                    className={`w-full pl-5 pr-14 py-4 bg-slate-50 dark:bg-slate-950 hacker:bg-black border rounded-2xl hacker:rounded-none outline-none font-black text-2xl dark:text-white hacker:text-[#0f0] hacker:font-mono transition-all ${entryType === 'kirim' ? 'border-green-200 focus:border-green-500' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500'}`} 
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-300 dark:text-slate-600 hacker:text-[#0f0]/40 text-sm hacker:font-mono">so'm</span>
                </div>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} disabled={isSaving} placeholder="Izoh yozing (ixtiyoriy)..." className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 hacker:bg-black border rounded-2xl hacker:rounded-none outline-none transition-all resize-none font-medium text-sm dark:text-white hacker:text-[#0f0] hacker:font-mono ${entryType === 'kirim' ? 'border-green-200 focus:border-green-500' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500'}`} />
                <button type="submit" disabled={isSaving} className={`w-full py-4 text-white hacker:text-black font-black rounded-2xl hacker:rounded-none transition-all shadow-lg flex items-center justify-center gap-2 text-sm hacker:font-mono disabled:opacity-70 ${entryType === 'kirim' ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {isSaving ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />}
                  {isSaving ? "Saqlanmoqda..." : entryType === 'kirim' ? "Savdoni saqlash" : "Xarajatni saqlash"}
                </button>
              </form>
            </div>
          </div>

          {/* 2. Stats Cards Section (Faqat Xarajat bo'limi uchun) */}
          {isExpenseTab && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {/* Savdo Card */}
              <div className={`bg-white dark:bg-slate-900 hacker:bg-black p-5 rounded-2xl border transition-all shadow-sm flex items-center justify-between group cursor-default ${entryType === 'kirim' ? 'border-green-400 ring-4 ring-green-50' : 'border-slate-100 dark:border-slate-800'}`}>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 hacker:font-mono">Savdo ({activeSubTab || 'Xarajat'})</p>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white hacker:text-[#0f0] hacker:font-mono">
                    {localSales.toLocaleString()} <span className="text-xs font-bold text-slate-400">so'm</span>
                  </h3>
                </div>
                <button 
                  onClick={() => setManualEntry('kirim')}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 ${entryType === 'kirim' ? 'bg-green-600 text-white' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-green-100'}`}
                  title="Savdo kiritish"
                >
                  <ArrowUpRight size={24} />
                </button>
              </div>

              {/* Xarajat Card */}
              <div className={`bg-white dark:bg-slate-900 hacker:bg-black p-5 rounded-2xl border transition-all shadow-sm flex items-center justify-between group cursor-default ${entryType === 'chiqim' ? 'border-red-400 ring-4 ring-red-50' : 'border-slate-100 dark:border-slate-800'}`}>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 hacker:font-mono">Xarajat ({activeSubTab || 'Xarajat'})</p>
                  <h3 className="text-xl font-black text-red-500 dark:text-red-400 hacker:text-[#f00] hacker:font-mono">
                    {localExpenses.toLocaleString()} <span className="text-xs font-bold text-slate-400">so'm</span>
                  </h3>
                </div>
                <button 
                  onClick={() => setManualEntry('chiqim')}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 ${entryType === 'chiqim' ? 'bg-red-600 text-white' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100'}`}
                  title="Xarajat kiritish"
                >
                  <ArrowDownRight size={24} />
                </button>
              </div>

              {/* Qoldiq Card */}
              <div className="bg-white dark:bg-slate-900 hacker:bg-black p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] shadow-sm flex items-center justify-between transition-all">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 hacker:font-mono">Qoldiq ({activeSubTab || 'Xarajat'})</p>
                  <h3 className={`text-xl font-black hacker:font-mono ${localBalance >= 0 ? 'text-green-600 dark:text-green-400 hacker:text-[#0f0]' : 'text-orange-500'}`}>
                    {localBalance.toLocaleString()} <span className="text-xs font-bold text-slate-400">so'm</span>
                  </h3>
                </div>
                <div className={`w-12 h-12 ${localBalance >= 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-orange-50 text-orange-500'} hacker:text-[#0f0] rounded-xl flex items-center justify-center`}><Calculator size={24} /></div>
              </div>
            </div>
          )}

          {/* 3. Recent Transactions Section */}
          <div className="space-y-3 mt-8">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-slate-800 dark:text-white hacker:text-[#0f0] text-sm hacker:font-mono">So'nggi operatsiyalar</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hacker:font-mono">{filteredTransactions.length} ta</span>
            </div>
            <div className="space-y-2">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <div key={t.id} className="bg-white dark:bg-slate-900 hacker:bg-black p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] shadow-sm group transition-all hacker:rounded-none">
                    {editingId === t.id ? (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={editData.amount} onChange={handleEditAmountChange} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none font-bold text-sm dark:text-white" />
                          <input type="text" value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none font-medium text-sm dark:text-white" />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={cancelEdit} className="p-2 text-slate-400 hacker:text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 hacker:bg-black rounded-lg"><X size={16} /></button>
                          <button onClick={() => saveEdit(t.id)} className="p-2 text-white bg-green-500 rounded-lg"><Check size={16} /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.type === 'kirim' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'} hacker:rounded-none hacker:border hacker:border-[#0f0]`}>{t.type === 'kirim' ? <Plus size={18} /> : <TrendingDown size={18} />}</div>
                          <div><p className="font-bold text-slate-800 dark:text-white hacker:text-[#0f0] text-[13px] leading-tight hacker:font-mono">{t.description}</p><div className="flex items-center gap-2 mt-0.5"><span className="text-[9px] font-bold text-slate-400 hacker:text-[#0f0]/60 hacker:font-mono">{new Date(t.date).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'})}</span>{t.sub_category && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-indigo-500 rounded text-[8px] font-black uppercase hacker:font-mono hacker:border hacker:border-[#0f0]"> {t.sub_category}</span>}</div></div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4">
                          <p className={`font-black text-sm ${t.type === 'kirim' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'} hacker:font-mono`}>{t.type === 'kirim' ? '+' : '-'}{t.amount.toLocaleString()}</p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 hacker:opacity-100 transition-all">
                            <button onClick={() => startEdit(t)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all hacker:text-[#0f0]"><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all hacker:text-[#f00]"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-slate-900 hacker:bg-black rounded-3xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 hacker:border-[#0f0] hacker:rounded-none">
                  <p className="text-slate-300 dark:text-slate-600 hacker:text-[#0f0]/40 font-bold italic text-sm hacker:font-mono">Ma'lumot yo'q</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default XPro;
