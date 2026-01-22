
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Wallet, CreditCard, 
  Banknote, TrendingDown, Clock, 
  PlayCircle, RefreshCcw, 
  Edit2, X, Check, ArrowUpRight, ArrowDownRight, 
  Calculator, Download, Printer, Save, Loader2,
  TrendingUp, Coins, Settings2
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { Transaction, Shift, ExpenseCategory } from '../types.ts';
import { 
  getActiveShift, startNewShift, closeShift, 
  getTransactionsByShift, deleteTransaction,
  getExpenseCategories, updateTransaction, getDeletionPassword,
  createExpenseCategory, updateExpenseCategory, deleteExpenseCategory,
  saveTransaction
} from '../services/supabase.ts';

const StatCard = ({ label, val, icon, color, onClick }: { label: string, val: number, icon: React.ReactNode, color: 'green' | 'red' | 'indigo' | 'amber', onClick?: () => void }) => {
  const colorClasses = {
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600"
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 hacker:bg-black p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-all ${onClick ? 'cursor-pointer hover:border-indigo-300 active:scale-95' : ''}`}
    >
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className={`text-2xl font-black ${color === 'red' ? 'text-red-500' : color === 'green' ? 'text-green-600' : 'text-slate-900 dark:text-white hacker:text-[#0f0]'}`}>
          {(val || 0).toLocaleString()} <span className="text-[10px] text-slate-400">so'm</span>
        </h3>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClasses[color]}`}>
        {icon}
      </div>
    </div>
  );
};

const XPro: React.FC = () => {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [activeTab, setActiveTab] = useState<string>('Kassa');
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  
  // Kassa manual sum state
  const [manualKassaSum, setManualKassaSum] = useState<number>(0);
  // Savdo manual sum state
  const [manualSavdoSums, setManualSavdoSums] = useState<Record<string, number>>({});
  
  // Custom Filters for Xarajat Stat Card
  const [expenseFilters, setExpenseFilters] = useState({
    xarajat: true,
    click: false,
    terminal: false
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // New Transaction Form State
  const [amountInput, setAmountInput] = useState('');
  const [descInput, setDescInput] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ amount: '', description: '' });

  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const initData = async () => {
    setLoading(true);
    try {
      const [shift, categories] = await Promise.all([
        getActiveShift(),
        getExpenseCategories()
      ]);
      
      setActiveShift(shift);
      setExpenseCategories(categories || []);
      
      if (shift) {
        const trans = await getTransactionsByShift(shift.id);
        setTransactions(trans || []);
        
        // Restore manual kassa sum
        const savedSum = localStorage.getItem(`kassa_sum_${shift.id}`);
        if (savedSum) setManualKassaSum(parseFloat(savedSum));

        // Restore manual savdo sums
        const savedSavdo = localStorage.getItem(`savdo_sums_${shift.id}`);
        if (savedSavdo) setManualSavdoSums(JSON.parse(savedSavdo));

        // Restore expense filters
        const savedFilters = localStorage.getItem(`expense_filters_${shift.id}`);
        if (savedFilters) setExpenseFilters(JSON.parse(savedFilters));
      }

      if (activeTab === 'Xarajat' && !activeSubTab && categories && categories.length > 0) {
        setActiveSubTab(categories[0].name);
      }
    } catch (err) {
      console.error("Ma'lumotlarni yuklashda xato:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  // Save filters whenever they change
  useEffect(() => {
    if (activeShift) {
      localStorage.setItem(`expense_filters_${activeShift.id}`, JSON.stringify(expenseFilters));
    }
  }, [expenseFilters, activeShift]);

  const formatAmount = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountInput(formatAmount(e.target.value));
  };

  const handleEditAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData({ ...editData, amount: formatAmount(e.target.value) });
  };

  const handleKassaSumClick = () => {
    const input = prompt("Kassa summasini kiriting:", manualKassaSum.toString());
    if (input === null) return;
    const cleanValue = input.replace(/\s/g, '');
    const num = parseFloat(cleanValue);
    if (!isNaN(num)) {
      setManualKassaSum(num);
      if (activeShift) localStorage.setItem(`kassa_sum_${activeShift.id}`, num.toString());
    }
  };

  const handleSavdoSumClick = () => {
    if (!activeSubTab) return;
    const currentVal = manualSavdoSums[activeSubTab] || 0;
    const input = prompt(`"${activeSubTab}" uchun savdo summasini kiriting:`, currentVal.toString());
    if (input === null) return;
    const cleanValue = input.replace(/\s/g, '');
    const num = parseFloat(cleanValue);
    if (!isNaN(num)) {
      const newSums = { ...manualSavdoSums, [activeSubTab]: num };
      setManualSavdoSums(newSums);
      if (activeShift) localStorage.setItem(`savdo_sums_${activeShift.id}`, JSON.stringify(newSums));
    }
  };

  const handleSaveTransaction = async () => {
    if (!activeShift) return;
    const cleanAmount = amountInput.replace(/\s/g, '');
    const numAmount = parseFloat(cleanAmount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Iltimos, summani to'g'ri kiriting");
      return;
    }

    setIsSaving(true);
    try {
      const isExpense = activeTab === 'Xarajat';
      const type = isExpense ? 'chiqim' : 'kirim';
      
      await saveTransaction({
        shift_id: activeShift.id,
        amount: numAmount,
        category: activeTab,
        sub_category: isExpense ? activeSubTab || undefined : undefined,
        description: descInput,
        type: type
      });

      setAmountInput('');
      setDescInput('');
      
      const trans = await getTransactionsByShift(activeShift.id);
      setTransactions(trans || []);
    } catch (err: any) {
      alert("Xato: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartShift = async () => {
    try {
      const shift = await startNewShift();
      if (shift) {
        setActiveShift(shift);
        setManualKassaSum(0);
        setManualSavdoSums({});
      }
    } catch (err: any) {
      alert("Smena ochishda xatolik: " + (err.message || "Noma'lum"));
    }
  };

  const handleAddCategory = async () => {
    const name = prompt("Yangi kategoriya:");
    if (!name || name.trim() === '') return;
    try {
      const newCat = await createExpenseCategory(name.trim());
      if (newCat) {
        setExpenseCategories([...expenseCategories, newCat]);
        setActiveSubTab(newCat.name);
      }
    } catch (err: any) {
      alert("Xato: " + err.message);
    }
  };

  const handleEditCategoryName = async (e: React.MouseEvent, id: string, oldName: string) => {
    e.stopPropagation();
    const newName = prompt("Yangi nom:", oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;
    try {
      await updateExpenseCategory(id, newName.trim());
      setExpenseCategories(expenseCategories.map(c => c.id === id ? { ...c, name: newName.trim() } : c));
      if (activeSubTab === oldName) setActiveSubTab(newName.trim());
    } catch (err: any) {
      alert("Xato: " + err.message);
    }
  };

  const handleDeleteCategoryWithConfirmation = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const password = prompt(`"${name}" o'chirish paroli:`);
    if (password === null) return;
    try {
      const correctPassword = await getDeletionPassword();
      if (password !== correctPassword) {
        alert("Parol noto'g'ri!");
        return;
      }
      if (confirm(`"${name}" o'chirilsinmi?`)) {
        await deleteExpenseCategory(id);
        const updatedCats = expenseCategories.filter(c => c.id !== id);
        setExpenseCategories(updatedCats);
        if (activeSubTab === name) setActiveSubTab(updatedCats.length > 0 ? updatedCats[0].name : null);
      }
    } catch (err: any) {
      alert("Xato: " + err.message);
    }
  };

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditData({
      amount: (t.amount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      description: t.description || ''
    });
  };

  const saveEdit = async (id: string) => {
    const cleanAmount = editData.amount.replace(/\s/g, '');
    const numAmount = parseFloat(cleanAmount);
    if (isNaN(numAmount)) return;
    try {
      await updateTransaction(id, { amount: numAmount, description: editData.description });
      setEditingId(null);
      if (activeShift) {
        const trans = await getTransactionsByShift(activeShift.id);
        setTransactions(trans || []);
      }
    } catch (err: any) {
      alert("Xato: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const password = prompt("O'chirish paroli:");
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
        setTransactions(trans || []);
      }
    } catch (err: any) {
      alert("Xato: " + err.message);
    }
  };

  const handlePrint = (catName: string) => {
    if (!activeShift) return;
    const catTransactions = transactions.filter(t => t.category === 'Xarajat' && t.sub_category === catName);
    const total = catTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    const now = new Date();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>XP-838l</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { font-family: 'Courier New', monospace; width: 72mm; margin: 0 auto; padding: 10px 0; font-size: 11pt; color: black; background: white; }
            .center { text-align: center; } .bold { font-weight: bold; }
            .header { font-size: 14pt; margin-bottom: 2px; }
            .divider { border-top: 1px dashed black; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .desc { flex: 1; padding-right: 5px; }
            .total { font-size: 12pt; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="center bold header">XPRO KASSA</div>
          <div class="center">${activeShift.name}</div>
          <div class="center bold">${catName.toUpperCase()}</div>
          <div class="divider"></div>
          ${catTransactions.map(t => `<div class="row"><span class="desc">${t.description || 'Xarajat'}</span><span class="bold">${(t.amount || 0).toLocaleString()}</span></div>`).join('')}
          <div class="divider"></div>
          <div class="row bold total"><span>JAMI:</span><span>${total.toLocaleString()} so'm</span></div>
          <div class="divider"></div>
          <div class="center" style="font-size: 8pt; margin-top: 10px;">${now.toLocaleString()}</div>
          <div style="height: 40px;"></div>
          <script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);};</script>
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
      const dataUrl = await htmlToImage.toPng(el, { cacheBust: true, backgroundColor: '#fff' });
      const link = document.createElement('a');
      link.download = `hisobot-${catId.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { alert('Xatolik yuz berdi.'); } finally { setIsExporting(false); }
  };

  // Stats for Kassa tab
  const totalExpensesAcrossTypes = transactions
    .filter(t => ['Click', 'Uzcard', 'Humo', 'Xarajat'].includes(t.category))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalBalance = manualKassaSum - totalExpensesAcrossTypes;

  // Stats for Xarajat sub-category
  const calculateConfiguredExpenses = () => {
    let total = 0;
    if (expenseFilters.xarajat) {
      total += transactions
        .filter(t => t.category === 'Xarajat' && t.sub_category === activeSubTab)
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    }
    if (expenseFilters.click) {
      total += transactions
        .filter(t => t.category === 'Click')
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    }
    if (expenseFilters.terminal) {
      total += transactions
        .filter(t => t.category === 'Uzcard' || t.category === 'Humo')
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    }
    return total;
  };

  const currentSubCatExpenses = calculateConfiguredExpenses();
  const currentSubCatSavdo = activeSubTab ? (manualSavdoSums[activeSubTab] || 0) : 0;
  const currentSubCatProfit = currentSubCatSavdo - currentSubCatExpenses;

  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'Xarajat') return t.category === 'Xarajat' && (activeSubTab ? t.sub_category === activeSubTab : true);
    return t.category === activeTab;
  });

  const mainTabs = [
    { name: 'Kassa', icon: Banknote }, { name: 'Click', icon: CreditCard }, { name: 'Uzcard', icon: Wallet },
    { name: 'Humo', icon: CreditCard }, { name: 'Xarajat', icon: TrendingDown }, { name: 'Eksport', icon: Download },
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
        <PlayCircle size={48} className="text-indigo-600 mb-6 animate-pulse" />
        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-3">Xush kelibsiz!</h2>
        <button onClick={handleStartShift} className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl flex items-center gap-3">
          <PlayCircle size={24} /> Hisobotni boshlash
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 no-print">
      {/* Settings Modal for Expense Filter */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 hacker:bg-black w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 dark:text-white hacker:text-[#0f0]">Hisoblash sozlamalari</h3>
              <button onClick={() => setIsFilterModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                <input 
                  type="checkbox" 
                  checked={expenseFilters.xarajat} 
                  onChange={() => setExpenseFilters(prev => ({...prev, xarajat: !prev.xarajat}))}
                  className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div className="flex-1">
                  <p className="font-bold text-slate-800 dark:text-white hacker:text-[#0f0]">Xarajatlarni hisoblash</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Faqat {activeSubTab} chiqimlari</p>
                </div>
              </label>

              <label className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                <input 
                  type="checkbox" 
                  checked={expenseFilters.click} 
                  onChange={() => setExpenseFilters(prev => ({...prev, click: !prev.click}))}
                  className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div className="flex-1">
                  <p className="font-bold text-slate-800 dark:text-white hacker:text-[#0f0]">Clicklarni hisoblash</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Shift'dagi barcha clicklar</p>
                </div>
              </label>

              <label className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                <input 
                  type="checkbox" 
                  checked={expenseFilters.terminal} 
                  onChange={() => setExpenseFilters(prev => ({...prev, terminal: !prev.terminal}))}
                  className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div className="flex-1">
                  <p className="font-bold text-slate-800 dark:text-white hacker:text-[#0f0]">Terminalni hisoblash</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Uzcard va Humo summasi</p>
                </div>
              </label>
            </div>

            <button 
              onClick={() => setIsFilterModalOpen(false)}
              className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all"
            >
              Tayyor
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 hacker:bg-black p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock size={20} className="text-green-600" />
          <h3 className="font-bold text-slate-800 dark:text-white hacker:text-[#0f0] text-sm">{activeShift.name}</h3>
        </div>
        <button onClick={() => closeShift(activeShift.id).then(() => window.location.reload())} className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl text-xs">Yopish</button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {mainTabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => {
              setActiveTab(tab.name);
              if (tab.name === 'Xarajat' && expenseCategories.length > 0) {
                if (!activeSubTab) setActiveSubTab(expenseCategories[0].name);
              } else if (tab.name !== 'Eksport') {
                setActiveSubTab(null);
              }
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all border text-sm ${
              activeTab === tab.name ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800'
            }`}
          >
            <tab.icon size={16} /> {tab.name}
          </button>
        ))}
      </div>

      {activeTab === 'Eksport' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expenseCategories.map(cat => (
            <div key={cat.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div ref={(el) => { exportRefs.current[cat.name] = el; }} className="p-6">
                 <h4 className="font-black text-slate-800 dark:text-white text-lg">{cat.name}</h4>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Smena Hisoboti</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 flex gap-2 border-t">
                <button onClick={() => handlePrint(cat.name)} className="flex-1 py-3 bg-white border rounded-xl flex items-center justify-center gap-2 text-xs font-bold"><Printer size={14} /> Chop etish</button>
                <button onClick={() => handleDownloadImage(cat.name)} disabled={isExporting} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold disabled:opacity-50">
                   {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Rasm
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Xarajat bo'limida SUB-KATEGORIYALAR */}
          {activeTab === 'Xarajat' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 animate-in slide-in-from-top-2 duration-300">
              {expenseCategories.map(cat => (
                <div key={cat.id} className={`relative h-12 rounded-xl border transition-all cursor-pointer flex items-center justify-center p-2 ${activeSubTab === cat.name ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-100 dark:border-slate-800'}`} onClick={() => setActiveSubTab(cat.name)}>
                  <span className="font-bold text-center text-[12px]">{cat.name}</span>
                  <div className="absolute -top-1.5 -right-1.5 flex gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg shadow-md border border-slate-100 z-10">
                     <button onClick={(e) => handleEditCategoryName(e, cat.id, cat.name)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 size={10} /></button>
                     <button onClick={(e) => handleDeleteCategoryWithConfirmation(e, cat.id, cat.name)} className="p-1 text-slate-400 hover:text-red-500"><X size={10} /></button>
                  </div>
                </div>
              ))}
              <button onClick={handleAddCategory} className="h-12 rounded-xl border-2 border-dashed border-indigo-200 flex items-center justify-center text-indigo-500 hover:bg-indigo-50 transition-colors"><Plus size={20} /></button>
            </div>
          )}

          {/* 2. STATISTIKA KARTALARI - Kassa bo'limida */}
          {activeTab === 'Kassa' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard 
                label="Kassa Summasi (O'zgartirish uchun bosing)" 
                val={manualKassaSum} 
                icon={<ArrowUpRight />} 
                color="green" 
                onClick={handleKassaSumClick}
              />
              <StatCard 
                label="Umumiy Xarajat (Click+Uzcard+Humo+Xarajat)" 
                val={totalExpensesAcrossTypes} 
                icon={<ArrowDownRight />} 
                color="red" 
              />
              <StatCard 
                label="Qolgan Pul (Balans)" 
                val={totalBalance} 
                icon={<Calculator />} 
                color="indigo" 
              />
            </div>
          )}

          {/* 3. YANGI OPERATSIYA FORMASI */}
          {activeTab !== 'Kassa' && (
            <div className="bg-white dark:bg-slate-900 hacker:bg-black p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in duration-300">
               <div className="flex items-center gap-2 mb-2">
                  <Plus size={18} className="text-indigo-600" />
                  <h4 className="font-bold text-sm uppercase tracking-widest text-slate-800 dark:text-white hacker:text-[#0f0]">Yangi operatsiya ({activeTab})</h4>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Summa</label>
                     <input 
                      type="text" 
                      value={amountInput}
                      onChange={handleAmountChange}
                      placeholder="0"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none font-black text-lg dark:text-white hacker:text-[#0f0]"
                     />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Tavsif (Ixtiyoriy)</label>
                     <input 
                      type="text" 
                      value={descInput}
                      onChange={(e) => setDescInput(e.target.value)}
                      placeholder="Operatsiya haqida..."
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none font-medium dark:text-white hacker:text-[#0f0]"
                     />
                  </div>
               </div>
               <button 
                 onClick={handleSaveTransaction}
                 disabled={isSaving}
                 className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
               >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Saqlash
               </button>
            </div>
          )}

          {/* 4. STATISTIKA KARTALARI - Xarajat bo'limida */}
          {activeTab === 'Xarajat' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <StatCard 
                label={`${activeSubTab || 'Tanlanmagan'} - Savdo`} 
                val={currentSubCatSavdo} 
                icon={<Coins />} 
                color="green" 
                onClick={handleSavdoSumClick}
              />
              <StatCard 
                label={`${activeSubTab || 'Tanlanmagan'} - Umumiy Xarajat`} 
                val={currentSubCatExpenses} 
                icon={<Settings2 />} 
                color="red" 
                onClick={() => setIsFilterModalOpen(true)}
              />
              <StatCard 
                label={`${activeSubTab || 'Tanlanmagan'} - Foyda`} 
                val={currentSubCatProfit} 
                icon={<TrendingUp />} 
                color="indigo" 
              />
            </div>
          )}

          {/* 5. TRANZAKSIYALAR RO'YXATI */}
          {activeTab !== 'Kassa' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-widest hacker:text-[#0f0]">Amallar</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hacker:text-[#0f0]">{filteredTransactions.length} ta</span>
              </div>
              <div className="space-y-2.5">
                {filteredTransactions.map((t) => (
                  <div key={t.id} className="bg-white dark:bg-slate-900 hacker:bg-black p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group">
                    {editingId === t.id ? (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 ml-1">Summa</label>
                            <input 
                              value={editData.amount} 
                              onChange={handleEditAmountChange} 
                              className="w-full p-3 bg-slate-50 dark:bg-slate-800 hacker:bg-black border border-slate-200 dark:border-slate-700 hacker:border-[#0f0] rounded-xl text-sm font-bold dark:text-white hacker:text-[#0f0] outline-none focus:ring-1 focus:ring-indigo-500" 
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 ml-1">Tavsif</label>
                            <input 
                              value={editData.description} 
                              onChange={(e) => setEditData({...editData, description: e.target.value})} 
                              className="w-full p-3 bg-slate-50 dark:bg-slate-800 hacker:bg-black border border-slate-200 dark:border-slate-700 hacker:border-[#0f0] rounded-xl text-sm font-medium dark:text-white hacker:text-[#0f0] outline-none focus:ring-1 focus:ring-indigo-500" 
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-1">
                          <button 
                            onClick={() => setEditingId(null)} 
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400"
                          >
                            <X size={14} /> Bekor qilish
                          </button>
                          <button 
                            onClick={() => saveEdit(t.id)} 
                            className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-xs font-bold rounded-xl shadow-md active:scale-95"
                          >
                            <Check size={14} /> Saqlash
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'kirim' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{t.type === 'kirim' ? <Plus size={18} /> : <TrendingDown size={18} />}</div>
                          <div><p className="font-bold text-slate-800 dark:text-white hacker:text-[#0f0] text-[13px]">{t.description || 'Tavsifsiz'}</p><p className="text-[10px] text-slate-400 uppercase font-bold hacker:text-[#0f0]/60">{t.sub_category || t.category}</p></div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <p className={`font-black text-sm ${t.type === 'kirim' ? 'text-green-600' : 'text-red-500'} hacker:text-[#0f0]`}>{(t.amount || 0).toLocaleString()}</p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => startEdit(t)} className="p-1 text-slate-400 hacker:text-[#0f0]"><Edit2 size={14} /></button><button onClick={() => handleDelete(t.id)} className="p-1 text-slate-400 hacker:text-[#0f0]"><Trash2 size={14} /></button></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-10 text-slate-400 italic text-sm hacker:text-[#0f0]/40">Ushbu bo'limda amallar mavjud emas</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default XPro;
