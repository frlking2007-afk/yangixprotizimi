
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Wallet, CreditCard, 
  Banknote, TrendingDown, Clock, 
  PlayCircle, RefreshCcw, 
  Edit2, X, Check, ArrowUpRight, ArrowDownRight, 
  Calculator, Download, Printer, Save, Loader2,
  TrendingUp, Coins, Settings2, Calendar
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { Transaction, Shift, ExpenseCategory } from '../types.ts';
import { 
  getActiveShift, startNewShift, closeShift, 
  getTransactionsByShift, deleteTransaction,
  getExpenseCategories, updateTransaction, getDeletionPassword,
  createExpenseCategory, updateExpenseCategory, deleteExpenseCategory,
  saveTransaction, updateShiftManualSum, getCategoryConfigs, upsertCategoryConfig
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
  const [exportingId, setExportingId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>('Kassa');
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  
  const [manualKassaSum, setManualKassaSum] = useState<number>(0);
  const [manualSavdoSums, setManualSavdoSums] = useState<Record<string, number>>({});
  const [allExpenseFilters, setAllExpenseFilters] = useState<Record<string, { xarajat: boolean, click: boolean, terminal: boolean }>>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const defaultFilter = { xarajat: true, click: false, terminal: false };

  const [amountInput, setAmountInput] = useState('');
  const [descInput, setDescInput] = useState('');

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
        setManualKassaSum(shift.manual_kassa_sum || 0);
        const [trans, configs] = await Promise.all([
          getTransactionsByShift(shift.id),
          getCategoryConfigs(shift.id)
        ]);
        setTransactions(trans || []);
        
        const sums: Record<string, number> = {};
        const filters: Record<string, any> = {};
        configs.forEach(cfg => {
          sums[cfg.category_name] = cfg.savdo_sum || 0;
          filters[cfg.category_name] = cfg.filters || defaultFilter;
        });
        setManualSavdoSums(sums);
        setAllExpenseFilters(filters);
      }

      if (activeTab === 'Xarajat' && !activeSubTab && categories && categories.length > 0) {
        setActiveSubTab(categories[0].name);
      }
    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { initData(); }, []);

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

  const calculateCatStats = (catName: string) => {
    const filters = allExpenseFilters[catName] || defaultFilter;
    const savdo = manualSavdoSums[catName] || 0;
    
    const catExpenses = transactions
      .filter(t => t.category === 'Xarajat' && t.sub_category === catName)
      .reduce((acc, t) => acc + (t.amount || 0), 0);
      
    const clickSum = transactions
      .filter(t => t.category === 'Click')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
      
    const terminalSum = transactions
      .filter(t => t.category === 'Uzcard' || t.category === 'Humo')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
      
    let totalDeduction = 0;
    if (filters.xarajat) totalDeduction += catExpenses;
    if (filters.click) totalDeduction += clickSum;
    if (filters.terminal) totalDeduction += terminalSum;
    
    return {
      savdo,
      catExpenses,
      clickSum,
      terminalSum,
      totalDeduction,
      balance: savdo - totalDeduction,
      filters,
      transactions: transactions.filter(t => t.category === 'Xarajat' && t.sub_category === catName)
    };
  };

  const handleKassaSumClick = async () => {
    const input = prompt("Kassa summasini kiriting:", manualKassaSum.toString());
    if (input === null) return;
    const cleanValue = input.replace(/\s/g, '');
    const num = parseFloat(cleanValue);
    if (!isNaN(num)) {
      setManualKassaSum(num);
      if (activeShift) await updateShiftManualSum(activeShift.id, num);
    }
  };

  const handleSavdoSumClick = async () => {
    if (!activeSubTab || !activeShift) return;
    const currentVal = manualSavdoSums[activeSubTab] || 0;
    const input = prompt(`"${activeSubTab}" uchun savdo summasini kiriting:`, currentVal.toString());
    if (input === null) return;
    const cleanValue = input.replace(/\s/g, '');
    const num = parseFloat(cleanValue);
    if (!isNaN(num)) {
      const newSums = { ...manualSavdoSums, [activeSubTab]: num };
      setManualSavdoSums(newSums);
      await upsertCategoryConfig(activeShift.id, activeSubTab, { savdo_sum: num });
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    const cleanAmount = amountInput.replace(/\s/g, '');
    const numAmount = parseFloat(cleanAmount);
    if (isNaN(numAmount) || numAmount <= 0) return alert("Summani to'g'ri kiriting");
    setIsSaving(true);
    try {
      const isExpense = activeTab === 'Xarajat';
      await saveTransaction({
        shift_id: activeShift.id,
        amount: numAmount,
        category: activeTab,
        sub_category: isExpense ? activeSubTab || undefined : undefined,
        description: descInput,
        type: isExpense ? 'chiqim' : 'kirim'
      });
      setAmountInput(''); setDescInput('');
      const trans = await getTransactionsByShift(activeShift.id);
      setTransactions(trans || []);
    } catch (err: any) { alert("Xato: " + err.message); } finally { setIsSaving(false); }
  };

  const handleStartShift = async () => {
    try {
      const shift = await startNewShift();
      if (shift) setActiveShift(shift);
    } catch (err: any) { alert("Xato: " + err.message); }
  };

  const handleAddCategory = async () => {
    const name = prompt("Yangi kategoriya:");
    if (!name?.trim()) return;
    try {
      const newCat = await createExpenseCategory(name.trim());
      if (newCat) {
        setExpenseCategories([...expenseCategories, newCat]);
        setActiveSubTab(newCat.name);
      }
    } catch (err: any) { alert("Xato: " + err.message); }
  };

  const handleEditCategoryName = async (e: React.MouseEvent, id: string, oldName: string) => {
    e.stopPropagation();
    const password = prompt(`"${oldName}" tahrirlash paroli:`);
    if (password === null) return;
    if (password !== await getDeletionPassword()) return alert("Parol noto'g'ri!");
    const newName = prompt("Yangi nom:", oldName);
    if (!newName?.trim() || newName === oldName) return;
    try {
      await updateExpenseCategory(id, newName.trim());
      setExpenseCategories(expenseCategories.map(c => c.id === id ? { ...c, name: newName.trim() } : c));
      if (activeSubTab === oldName) setActiveSubTab(newName.trim());
    } catch (err: any) { alert("Xato: " + err.message); }
  };

  const handleDeleteCategoryWithConfirmation = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const password = prompt(`"${name}" o'chirish paroli:`);
    if (password === null) return;
    if (password !== await getDeletionPassword()) return alert("Parol noto'g'ri!");
    if (confirm(`"${name}" o'chirilsinmi?`)) {
      await deleteExpenseCategory(id);
      const updatedCats = expenseCategories.filter(c => c.id !== id);
      setExpenseCategories(updatedCats);
      if (activeSubTab === name) setActiveSubTab(updatedCats.length > 0 ? updatedCats[0].name : null);
    }
  };

  const startEdit = async (t: Transaction) => {
    const password = prompt("Tahrirlash paroli:");
    if (password === null) return;
    if (password !== await getDeletionPassword()) return alert("Parol noto'g'ri!");
    setEditingId(t.id);
    setEditData({ amount: t.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '), description: t.description || '' });
  };

  const saveEdit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const numAmount = parseFloat(editData.amount.replace(/\s/g, ''));
    if (isNaN(numAmount)) return;
    try {
      await updateTransaction(id, { amount: numAmount, description: editData.description });
      setEditingId(null);
      if (activeShift) setTransactions(await getTransactionsByShift(activeShift.id) || []);
    } catch (err: any) { alert("Xato: " + err.message); }
  };

  const handleDelete = async (id: string) => {
    const password = prompt("O'chirish paroli:");
    if (password === null) return;
    if (password !== await getDeletionPassword()) return alert("Parol noto'g'ri!");
    await deleteTransaction(id);
    if (activeShift) setTransactions(await getTransactionsByShift(activeShift.id) || []);
  };

  const handlePrint = (catName: string) => {
    if (!activeShift) return;
    const stats = calculateCatStats(catName);
    const now = new Date();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Export - ${catName}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { font-family: 'Inter', sans-serif; width: 72mm; margin: 0 auto; padding: 15px 0; font-size: 10pt; color: black; background: white; line-height: 1.4; }
            .center { text-align: center; } .bold { font-weight: bold; } .black { font-weight: 900; }
            .header { font-size: 16pt; margin-bottom: 5px; }
            .divider { border-top: 1.5px dashed black; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .label { color: black; font-size: 9pt; text-transform: uppercase; font-weight: 900; }
            .list-title { font-size: 10pt; margin: 10px 0 5px 0; font-weight: 900; }
            .item { font-size: 9pt; margin-bottom: 3px; border-bottom: 1px solid #eee; padding-bottom: 2px; }
            .total-row { font-size: 12pt; margin-top: 10px; background: #f0f0f0; padding: 8px; border-radius: 5px; border: 1px solid black; }
          </style>
        </head>
        <body>
          <div class="center black header">XPRO KASSA</div>
          <div class="center bold">${now.toLocaleDateString()} ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          <div class="center bold" style="margin-bottom: 15px; font-size: 9pt;">${activeShift.name}</div>
          
          <div class="row"><span class="label">Nomi:</span><span class="black">${catName}</span></div>
          <div class="divider"></div>
          
          <div class="row"><span class="label">Savdo:</span><span class="black">${stats.savdo.toLocaleString()}</span></div>
          <div class="row"><span class="label">Xarajat:</span><span class="black">${stats.catExpenses.toLocaleString()}</span></div>
          ${stats.filters.click ? `<div class="row"><span class="label">Click:</span><span class="black">${stats.clickSum.toLocaleString()}</span></div>` : ''}
          ${stats.filters.terminal ? `<div class="row"><span class="label">Terminal:</span><span class="black">${stats.terminalSum.toLocaleString()}</span></div>` : ''}
          
          <div class="divider"></div>
          <div class="row black total-row"><span>QOLGAN PUL:</span><span>${stats.balance.toLocaleString()} so'm</span></div>
          
          <div class="divider"></div>
          <div class="black list-title">XARAJATLAR RO'YXATI:</div>
          ${stats.transactions.map(t => `
            <div class="item">
              <div class="row"><span>${t.description || 'Xarajat'}</span><span class="bold">${t.amount.toLocaleString()}</span></div>
            </div>
          `).join('')}
          
          <div class="center" style="font-size: 8pt; margin-top: 20px; color: #555; font-weight: bold;">Dastur orqali yaratildi - Xpro</div>
          <div style="height: 50px;"></div>
          <script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);};</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadImage = async (catName: string) => {
    const el = exportRefs.current[catName];
    if (!el) return;
    setExportingId(catName);
    try {
      const dataUrl = await htmlToImage.toPng(el, { 
        cacheBust: true, 
        backgroundColor: '#fff', 
        pixelRatio: 3,
        style: {
          borderRadius: '0'
        }
      });
      const link = document.createElement('a');
      link.download = `xisobot-${catName.toLowerCase()}-${new Date().toISOString().slice(0,10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { alert('Rasm yuklashda xatolik.'); } finally { setExportingId(null); }
  };

  const toggleFilter = async (key: keyof typeof defaultFilter) => {
    if (!activeSubTab || !activeShift) return;
    const subTabFilters = { ...(allExpenseFilters[activeSubTab] || defaultFilter) };
    subTabFilters[key] = !subTabFilters[key];
    setAllExpenseFilters({ ...allExpenseFilters, [activeSubTab]: subTabFilters });
    await upsertCategoryConfig(activeShift.id, activeSubTab, { filters: subTabFilters });
  };

  const totalExpensesAcrossTypes = transactions
    .filter(t => ['Click', 'Uzcard', 'Humo', 'Xarajat'].includes(t.category))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalBalance = manualKassaSum - totalExpensesAcrossTypes;

  const currentFilters = activeSubTab ? (allExpenseFilters[activeSubTab] || defaultFilter) : defaultFilter;
  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'Xarajat') return t.category === 'Xarajat' && (activeSubTab ? t.sub_category === activeSubTab : true);
    return t.category === activeTab;
  });

  const mainTabs = [
    { name: 'Kassa', icon: Banknote }, { name: 'Click', icon: CreditCard }, { name: 'Uzcard', icon: Wallet },
    { name: 'Humo', icon: CreditCard }, { name: 'Xarajat', icon: TrendingDown }, { name: 'Eksport', icon: Download },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      <RefreshCcw className="animate-spin text-indigo-600" size={40} />
      <p className="text-slate-500 font-medium">Yuklanmoqda...</p>
    </div>
  );

  if (!activeShift) return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
      <PlayCircle size={48} className="text-indigo-600 mb-6 animate-pulse" />
      <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-3">Xush kelibsiz!</h2>
      <button onClick={handleStartShift} className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl flex items-center gap-3">
        <PlayCircle size={24} /> Hisobotni boshlash
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 no-print">
      {/* Settings Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 hacker:bg-black w-full max-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white hacker:text-[#0f0]">Hisoblash sozlamalari</h3>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{activeSubTab}</p>
              </div>
              <button onClick={() => setIsFilterModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {['xarajat', 'click', 'terminal'].map((key) => (
                <label key={key} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                  <input 
                    type="checkbox" 
                    checked={currentFilters[key as keyof typeof defaultFilter]} 
                    onChange={() => toggleFilter(key as keyof typeof defaultFilter)}
                    className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 dark:text-white capitalize">{key}ni hisoblash</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{key === 'xarajat' ? `Faqat ${activeSubTab} chiqimlari` : key === 'click' ? "Barcha clicklar" : "Uzcard va Humo"}</p>
                  </div>
                </label>
              ))}
            </div>
            <button onClick={() => setIsFilterModalOpen(false)} className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all">Tayyor</button>
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
              if (tab.name === 'Xarajat' && expenseCategories.length > 0 && !activeSubTab) setActiveSubTab(expenseCategories[0].name);
              else if (tab.name !== 'Xarajat' && tab.name !== 'Eksport') setActiveSubTab(null);
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
          {expenseCategories.map(cat => {
            const stats = calculateCatStats(cat.name);
            const now = new Date();
            return (
              <div key={cat.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group">
                {/* Visual Preview for Image Generation */}
                <div 
                   ref={(el) => { exportRefs.current[cat.name] = el; }} 
                   className="p-10 bg-white text-slate-900 w-[500px] mx-auto flex flex-col items-stretch"
                   style={{ minHeight: 'auto' }}
                >
                   <div className="text-center mb-10">
                      <h4 className="font-black text-3xl tracking-tighter text-black uppercase mb-2">XPRO KASSA</h4>
                      <div className="flex flex-col items-center justify-center gap-1 text-[12px] text-black font-black uppercase tracking-widest">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5"><Calendar size={12} /> {now.toLocaleDateString()}</div>
                          <div className="flex items-center gap-1.5"><Clock size={12} /> {now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                        <div className="mt-1 border-t border-black pt-1 px-4">{activeShift.name}</div>
                      </div>
                   </div>

                   <div className="space-y-4 mb-8">
                      <div className="flex justify-between items-center border-b-2 border-slate-100 pb-3">
                         <span className="text-[12px] font-black text-black uppercase tracking-[0.2em] flex-shrink-0">Nomi</span>
                         <span className="font-black text-black text-right text-lg ml-4 break-words">{cat.name}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                         <span className="text-[12px] font-black text-black uppercase tracking-[0.2em] flex-shrink-0">Savdo</span>
                         <span className="font-black text-lg text-black">{stats.savdo.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                         <span className="text-[12px] font-black text-black uppercase tracking-[0.2em] flex-shrink-0">Xarajat</span>
                         <span className="font-black text-lg text-black">{stats.catExpenses.toLocaleString()}</span>
                      </div>
                      {stats.filters.click && (
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                           <span className="text-[12px] font-black text-black uppercase tracking-[0.2em] flex-shrink-0">Click</span>
                           <span className="font-black text-lg text-black">{stats.clickSum.toLocaleString()}</span>
                        </div>
                      )}
                      {stats.filters.terminal && (
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                           <span className="text-[12px] font-black text-black uppercase tracking-[0.2em] flex-shrink-0">Terminal</span>
                           <span className="font-black text-lg text-black">{stats.terminalSum.toLocaleString()}</span>
                        </div>
                      )}
                      
                      <div className="pt-6 border-t-2 border-dashed border-black mt-6">
                         <div className="flex justify-between items-center p-5 bg-slate-100 border border-black rounded-3xl">
                            <span className="text-xs font-black text-black uppercase tracking-widest">Qolgan Pul</span>
                            <span className="text-2xl font-black text-black text-right">{stats.balance.toLocaleString()} so'm</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <p className="text-[12px] font-black text-black uppercase mb-4 border-b-2 border-black inline-block tracking-widest">Xarajatlar Ro'yxati:</p>
                      <div className="space-y-1.5">
                        {stats.transactions.length > 0 ? (
                          stats.transactions.map(t => (
                            <div key={t.id} className="flex justify-between items-start text-[12px] py-1.5 border-b border-slate-50">
                               <span className="font-bold text-black pr-4 break-words">{t.description || 'Xarajat'}</span>
                               <span className="font-black text-black flex-shrink-0">{(t.amount || 0).toLocaleString()}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[12px] italic text-slate-400 py-2">Ro'yxat bo'sh</p>
                        )}
                      </div>
                   </div>
                   
                   <div className="mt-auto pt-10 text-center">
                      <p className="text-[10px] font-black text-black uppercase tracking-[0.3em] border-t border-black pt-4">XPRO MANAGEMENT SYSTEM</p>
                   </div>
                </div>

                {/* Actions UI */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 flex gap-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
                  <button onClick={() => handlePrint(cat.name)} className="flex-1 py-4 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-xs font-black hover:bg-slate-100 transition-all"><Printer size={16} /> Chop etish</button>
                  <button 
                    onClick={() => handleDownloadImage(cat.name)} 
                    disabled={exportingId !== null} 
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black disabled:opacity-50 hover:bg-indigo-700 transition-all shadow-lg"
                  >
                     {exportingId === cat.name ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Rasm
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
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

          {activeTab === 'Kassa' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Kassa Summasi" val={manualKassaSum} icon={<ArrowUpRight />} color="green" onClick={handleKassaSumClick} />
              <StatCard label="Umumiy Xarajat" val={totalExpensesAcrossTypes} icon={<ArrowDownRight />} color="red" />
              <StatCard label="Balans" val={totalBalance} icon={<Calculator />} color="indigo" />
            </div>
          )}

          {activeTab !== 'Kassa' && (
            <form onSubmit={handleSaveTransaction} className="bg-white dark:bg-slate-900 hacker:bg-black p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in duration-300">
               <div className="flex items-center gap-2 mb-2">
                  <Plus size={18} className="text-indigo-600" />
                  <h4 className="font-bold text-sm uppercase tracking-widest text-slate-800 dark:text-white">Yangi operatsiya ({activeTab})</h4>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" value={amountInput} onChange={handleAmountChange} placeholder="Summa (0)" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none font-black text-lg dark:text-white" />
                  <input type="text" value={descInput} onChange={(e) => setDescInput(e.target.value)} placeholder="Tavsif (ixtiyoriy)" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none font-medium dark:text-white" />
               </div>
               <button type="submit" disabled={isSaving} className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50">
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Saqlash
               </button>
            </form>
          )}

          {activeTab === 'Xarajat' && activeSubTab && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-500">
              {(() => {
                const stats = calculateCatStats(activeSubTab);
                return (
                  <>
                    <StatCard label={`${activeSubTab} - Savdo`} val={stats.savdo} icon={<Coins />} color="green" onClick={handleSavdoSumClick} />
                    <StatCard label={`${activeSubTab} - Hisoblangan Xarajat`} val={stats.totalDeduction} icon={<Settings2 />} color="red" onClick={() => setIsFilterModalOpen(true)} />
                    <StatCard label={`${activeSubTab} - Foyda`} val={stats.balance} icon={<TrendingUp />} color="indigo" />
                  </>
                );
              })()}
            </div>
          )}

          {activeTab !== 'Kassa' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-widest">Amallar ({filteredTransactions.length})</h3>
              </div>
              <div className="space-y-2.5">
                {filteredTransactions.map((t) => (
                  <div key={t.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group">
                    {editingId === t.id ? (
                      <form onSubmit={(e) => saveEdit(e, t.id)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <input value={editData.amount} onChange={handleEditAmountChange} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-bold" />
                          <input value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-medium" />
                        </div>
                        <div className="flex justify-end gap-3">
                          <button type="button" onClick={() => setEditingId(null)} className="text-xs font-bold text-slate-500">Bekor qilish</button>
                          <button type="submit" className="px-5 py-2 bg-green-600 text-white text-xs font-bold rounded-xl">Saqlash</button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'kirim' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{t.type === 'kirim' ? <Plus size={18} /> : <TrendingDown size={18} />}</div>
                          <div><p className="font-bold text-slate-800 dark:text-white text-[13px]">{t.description || 'Tavsifsiz'}</p><p className="text-[10px] text-slate-400 uppercase font-bold">{t.sub_category || t.category}</p></div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className={`font-black text-sm ${t.type === 'kirim' ? 'text-green-600' : 'text-red-500'}`}>{(t.amount || 0).toLocaleString()}</p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => startEdit(t)} className="p-1 text-slate-400"><Edit2 size={14} /></button><button onClick={() => handleDelete(t.id)} className="p-1 text-slate-400"><Trash2 size={14} /></button></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default XPro;
