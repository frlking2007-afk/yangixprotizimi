
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Wallet, CreditCard, 
  Banknote, TrendingDown, Clock, 
  PlayCircle, StopCircle, RefreshCcw, 
  Edit2, X, Check, ArrowUpRight, ArrowDownRight, 
  Calculator, Download, Printer, Image as ImageIcon
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Transaction, Shift, ExpenseCategory } from '../types';
import { 
  getActiveShift, startNewShift, closeShift, 
  getTransactionsByShift, deleteTransaction,
  getExpenseCategories, updateTransaction, getDeletionPassword,
  createExpenseCategory, updateExpenseCategory, deleteExpenseCategory,
  saveTransaction
} from '../services/supabase';

const XPro: React.FC = () => {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // UI States
  const [activeTab, setActiveTab] = useState<string>('Kassa');
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ amount: '', description: '' });

  // Form states
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  const handleFormAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value);
    setFormAmount(formatted);
  };

  const handleSubmitTransaction = async () => {
    if (!activeShift) {
      alert('Smena topilmadi');
      return;
    }

    const cleanAmount = formAmount.replace(/\s/g, '');
    const numAmount = parseFloat(cleanAmount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Iltimos, to\'g\'ri miqdorni kiriting');
      return;
    }

    setIsSubmitting(true);
    try {
      const transactionData = {
        shift_id: activeShift.id,
        amount: numAmount,
        description: formDescription.trim() || (activeTab === 'Xarajat' ? 'Xarajat' : activeTab),
        category: activeTab,
        type: activeTab === 'Xarajat' ? 'chiqim' as const : 'kirim' as const,
        sub_category: activeTab === 'Xarajat' && activeSubTab ? activeSubTab : undefined
      };

      await saveTransaction(transactionData);
      
      // Reset form
      setFormAmount('');
      setFormDescription('');
      
      // Refresh transactions
      const trans = await getTransactionsByShift(activeShift.id);
      setTransactions(trans);
    } catch (err: any) {
      alert('Xatolik: ' + (err.message || 'Noma\'lum xatolik'));
    } finally {
      setIsSubmitting(false);
    }
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

  const handlePrint = (catName: string) => {
    if (!activeShift) return;
    
    // Filter transactions for this specific category/report
    const catTransactions = transactions.filter(t => 
      t.category === 'Xarajat' && t.sub_category === catName
    );
    
    const total = catTransactions.reduce((acc, t) => acc + t.amount, 0);
    const now = new Date();

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Build Receipt HTML for 80mm Thermal Printer
    printWindow.document.write(`
      <html>
        <head>
          <title>XP-838l Print</title>
          <style>
            @page { 
              margin: 0; 
              size: 80mm auto; 
            }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 72mm; 
              margin: 0 auto; 
              padding: 10px 0;
              font-size: 12pt;
              line-height: 1.2;
              color: black;
              background: white;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .header { font-size: 16pt; margin-bottom: 5px; }
            .subheader { font-size: 10pt; margin-bottom: 10px; }
            .divider { border-top: 1px dashed black; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .desc { flex: 1; padding-right: 5px; overflow: hidden; text-overflow: ellipsis; }
            .amount { font-weight: bold; white-space: nowrap; }
            .footer { margin-top: 15px; font-size: 9pt; }
            .total-row { font-size: 14pt; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="center bold header">XPRO KASSA</div>
          <div class="center subheader">${activeShift.name}</div>
          <div class="center bold" style="font-size: 14pt;">HISOBOT: ${catName.toUpperCase()}</div>
          
          <div class="divider"></div>
          
          ${catTransactions.length > 0 ? catTransactions.map(t => `
            <div class="row">
              <span class="desc">${t.description || 'Xarajat'}</span>
              <span class="amount">${t.amount.toLocaleString()}</span>
            </div>
          `).join('') : '<div class="center">Amallar mavjud emas</div>'}
          
          <div class="divider"></div>
          
          <div class="row total-row bold">
            <span>JAMI:</span>
            <span>${total.toLocaleString()} so'm</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer center">
            <div>Sana: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}</div>
            <div style="margin-top: 5px;">Raxmat!</div>
          </div>
          <div style="height: 30px;"></div> <!-- Extra space for paper tear -->
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
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
      const dataUrl = await toPng(el, { cacheBust: true, backgroundColor: document.documentElement.classList.contains('hacker') ? '#000' : '#fff' });
      const link = document.createElement('a');
      link.download = `hisobot-${catId.toLowerCase()}-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { alert('Rasmga saqlashda xatolik yuz berdi.'); } finally { setIsExporting(false); }
  };

  // GLOBAL STATS
  const totalIn = transactions.filter(t => t.type === 'kirim').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOut = transactions.filter(t => t.type === 'chiqim').reduce((acc, curr) => acc + curr.amount, 0);
  const totalBalance = totalIn - totalOut;

  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'Xarajat') {
      return t.category === 'Xarajat' && (activeSubTab ? t.sub_category === activeSubTab : true);
    }
    return t.category === activeTab;
  });

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
        <RefreshCcw className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 font-medium">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <PlayCircle size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-3">Xush kelibsiz!</h2>
        <button onClick={handleStartShift} className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl flex items-center gap-3">
          <PlayCircle size={24} /> Hisobotni boshlash
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 no-print">
      {/* 1. Smena Header */}
      <div className="bg-white dark:bg-slate-900 hacker:bg-black p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl flex items-center justify-center"><Clock size={20} /></div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white hacker:text-[#0f0] text-sm">{activeShift.name}</h3>
            <span className="text-[9px] font-bold text-green-600 uppercase tracking-widest">Faol Smena</span>
          </div>
        </div>
        <button onClick={() => closeShift(activeShift.id).then(() => window.location.reload())} className="px-5 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 font-bold rounded-xl text-xs">Smenani yopish</button>
      </div>

      {/* 2. Tabs Menu */}
      <div className="flex flex-wrap items-center gap-2">
        {mainTabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => {
              setActiveTab(tab.name);
              if (tab.name === 'Xarajat' && expenseCategories.length > 0) {
                setActiveSubTab(expenseCategories[0].name);
              } else if (tab.name !== 'Eksport') {
                setActiveSubTab(null);
              }
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all border text-sm ${
              activeTab === tab.name 
              ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900' 
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-200'
            }`}
          >
            <tab.icon size={16} />
            {tab.name}
          </button>
        ))}
      </div>

      {activeTab === 'Eksport' ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {expenseCategories.map(cat => (
              <div key={cat.id} className="bg-white dark:bg-slate-900 hacker:bg-black rounded-[2rem] border border-slate-100 dark:border-slate-800 hacker:border-[#0f0] shadow-sm overflow-hidden flex flex-col">
                <div ref={(el) => { exportRefs.current[cat.name] = el; }} className="p-6">
                   <h4 className="font-black text-slate-800 dark:text-white text-lg">{cat.name}</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Smena Hisoboti</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 flex gap-2 border-t border-slate-100">
                  <button onClick={() => handlePrint(cat.name)} className="flex-1 py-3 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                    <Printer size={14} /> Chop etish (80mm)
                  </button>
                  <button onClick={() => handleDownloadImage(cat.name)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-indigo-700 transition-colors">
                    Rasm
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 3. MAIN GLOBAL STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 hacker:bg-black p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Savdo (Jami)</p>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalIn.toLocaleString()}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">so'm</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-2xl flex items-center justify-center"><ArrowUpRight size={24} /></div>
            </div>

            <div className="bg-white dark:bg-slate-900 hacker:bg-black p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Umumiy Xarajat</p>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-2xl font-black text-red-500">{totalOut.toLocaleString()}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">so'm</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl flex items-center justify-center"><ArrowDownRight size={24} /></div>
            </div>

            <div className="bg-white dark:bg-slate-900 hacker:bg-black p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Qolgan Pul</p>
                <div className="flex items-baseline gap-1">
                  <h3 className={`text-2xl font-black ${totalBalance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-orange-500'}`}>{totalBalance.toLocaleString()}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">so'm</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl flex items-center justify-center"><Calculator size={24} /></div>
            </div>
          </div>

          {/* TRANSACTION FORM - For Kassa, Click, Uzcard, Humo tabs */}
          {['Kassa', 'Click', 'Uzcard', 'Humo'].includes(activeTab) && (
            <div className="bg-white dark:bg-slate-900 hacker:bg-black rounded-[2rem] border-2 border-green-200 dark:border-green-900/30 shadow-lg p-6">
              <h3 className="text-green-600 dark:text-green-400 font-bold text-lg mb-4">Savdo</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={formAmount}
                    onChange={handleFormAmountChange}
                    placeholder="0"
                    className="flex-1 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-lg text-slate-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900"
                  />
                  <span className="text-slate-600 dark:text-slate-400 font-bold">so'm</span>
                </div>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Izoh (ixtiyoriy)..."
                  className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm text-slate-700 dark:text-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900"
                />
                <button
                  onClick={handleSubmitTransaction}
                  disabled={isSubmitting || !formAmount}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCcw className="animate-spin" size={20} />
                      Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      Saqlash
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Xarajat' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kategoriyalar</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
                {expenseCategories.map(cat => (
                  <div key={cat.id} className={`relative h-12 rounded-xl border transition-all cursor-pointer flex items-center justify-center p-2 ${activeSubTab === cat.name ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`} onClick={() => setActiveSubTab(cat.name)}>
                    <span className="font-bold text-center break-words w-full text-[13px] leading-tight">{cat.name}</span>
                    
                    {/* Control Buttons - ALWAYS VISIBLE */}
                    <div className="absolute -top-1.5 -right-1.5 flex gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg shadow-md border border-slate-100 dark:border-slate-700 z-10">
                       <button onClick={(e) => handleEditCategoryName(e, cat.id, cat.name)} className="p-1 text-slate-400 hover:text-indigo-600 rounded-md"><Edit2 size={10} /></button>
                       <button onClick={(e) => handleDeleteCategoryWithConfirmation(e, cat.id, cat.name)} className="p-1 text-slate-400 hover:text-red-500 rounded-md"><X size={10} /></button>
                    </div>
                  </div>
                ))}
                <button onClick={handleAddCategory} className="h-12 rounded-xl border-2 border-dashed border-indigo-200 dark:border-slate-800 flex items-center justify-center gap-2 text-indigo-500 hover:bg-indigo-50 transition-all"><Plus size={20} /><span className="font-bold text-[12px]">Qo'shish</span></button>
              </div>
            </div>
          )}

          {/* EXPENSE FORM - For Xarajat tab - Kategoriyalar va So'nggi operatsiyalar orasida */}
          {activeTab === 'Xarajat' && (
            <div className="bg-white dark:bg-slate-900 hacker:bg-black rounded-[2rem] border-2 border-red-200 dark:border-red-900/30 shadow-lg p-6">
              <h3 className="text-red-600 dark:text-red-400 font-bold text-lg mb-4">Xarajat</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={formAmount}
                    onChange={handleFormAmountChange}
                    placeholder="0"
                    className="flex-1 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-lg text-slate-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900"
                  />
                  <span className="text-slate-600 dark:text-slate-400 font-bold">so'm</span>
                </div>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Izoh (ixtiyoriy)..."
                  className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm text-slate-700 dark:text-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900"
                />
                <button
                  onClick={handleSubmitTransaction}
                  disabled={isSubmitting || !formAmount || !activeSubTab}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCcw className="animate-spin" size={20} />
                      Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      Saqlash
                    </>
                  )}
                </button>
                {!activeSubTab && (
                  <p className="text-xs text-red-500 text-center">Iltimos, avval kategoriyani tanlang</p>
                )}
              </div>
            </div>
          )}

          {/* 4. Recent Transactions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-widest">So'nggi operatsiyalar</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredTransactions.length} ta amal</span>
            </div>
            <div className="space-y-2.5">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <div key={t.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group transition-all">
                    {editingId === t.id ? (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={editData.amount} onChange={handleEditAmountChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-lg outline-none font-bold text-sm dark:text-white" />
                          <input type="text" value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-lg outline-none font-medium text-sm dark:text-white" />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={cancelEdit} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
                          <button onClick={() => saveEdit(t.id)} className="p-2 text-white bg-green-500 rounded-lg"><Check size={18} /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${t.type === 'kirim' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{t.type === 'kirim' ? <Plus size={20} /> : <TrendingDown size={20} />}</div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white text-sm leading-tight">{t.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-slate-400">{new Date(t.date).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'})}</span>
                              {t.sub_category && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded text-[9px] font-black uppercase">{t.sub_category}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className={`font-black text-sm md:text-base ${t.type === 'kirim' ? 'text-green-600' : 'text-red-500'}`}>{t.type === 'kirim' ? '+' : '-'}{t.amount.toLocaleString()}</p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => startEdit(t)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-16 text-center border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-400 font-bold italic text-sm">Ushbu bo'limda hali amallar mavjud emas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default XPro;
