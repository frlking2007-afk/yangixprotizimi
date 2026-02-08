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
  saveTransaction, updateShiftManualSum, getCategoryConfigs, upsertCategoryConfig,
  updateExpenseCategoriesOrder, getShiftById, getAllShifts, updateShiftName
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
      className={`bg-white dark:bg-zinc-900 hacker:bg-black p-6 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-all ${onClick ? 'cursor-pointer hover:border-indigo-300 active:scale-95' : ''}`}
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

interface XProProps {
  forcedShiftId?: string | null;
}

const XPro: React.FC<XProProps> = ({ forcedShiftId }) => {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [activeShiftsList, setActiveShiftsList] = useState<Shift[]>([]);
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

  const [isRenaming, setIsRenaming] = useState(false);
  const [tempShiftName, setTempShiftName] = useState('');

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const defaultFilter = { xarajat: true, click: false, terminal: false };

  const [amountInput, setAmountInput] = useState('');
  const [descInput, setDescInput] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ amount: '', description: '' });

  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const initData = async () => {
    setLoading(true);
    try {
      let shift: Shift | null = null;
      if (forcedShiftId) {
        shift = await getShiftById(forcedShiftId);
      } else {
        shift = await getActiveShift();
      }
      
      const categories = await getExpenseCategories();
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
      } else {
        const allShifts = await getAllShifts();
        setActiveShiftsList(allShifts.filter(s => s.status === 'active'));
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

  useEffect(() => { initData(); }, [forcedShiftId]);

  const formatAmount = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountInput(formatAmount(e.target.value));
  };

  const handleEditShiftName = () => {
    if (!activeShift) return;
    setTempShiftName(activeShift.name);
    setIsRenaming(true);
  };

  const handleSaveShiftName = async () => {
    if (!activeShift || !tempShiftName.trim() || tempShiftName === activeShift.name) {
      setIsRenaming(false);
      return;
    }
    
    try {
      await updateShiftName(activeShift.id, tempShiftName.trim());
      setActiveShift({ ...activeShift, name: tempShiftName.trim() });
      setIsRenaming(false);
    } catch (err: any) {
      alert("Xato: " + err.message);
      setIsRenaming(false);
    }
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

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedItemId === targetId || !draggedItemId) return;
    const items = [...expenseCategories];
    const dragIndex = items.findIndex(item => item.id === draggedItemId);
    const dropIndex = items.findIndex(item => item.id === targetId);
    const [draggedItem] = items.splice(dragIndex, 1);
    items.splice(dropIndex, 0, draggedItem);
    setExpenseCategories(items);
    setDraggedItemId(null);
    await updateExpenseCategoriesOrder(items);
  };

  const startEdit = async (t: Transaction) => {
    const password = prompt("Tahrirlash paroli:");
    if (password === null) return;
    if (password !== await getDeletionPassword()) return alert("Parol noto'g'ri!");
    setEditingId(t.id);
    setEditData({ amount: formatAmount(t.amount.toString()), description: t.description || '' });
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
            .header { font-size: 24pt; margin-bottom: 5px; text-transform: uppercase; font-weight: 900; }
            .divider { border-top: 2px dashed black; margin: 15px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .label { color: black; font-size: 10pt; text-transform: uppercase; font-weight: 900; }
            .item-box { border-bottom: 1px solid #eee; padding: 8px 0; font-size: 11pt; font-weight: 500; display: flex; justify-content: space-between; align-items: center; }
            .total-row { font-size: 14pt; margin-top: 10px; background: white; padding: 12px; border: 2px solid black; font-weight: 900; border-radius: 20px; text-align: center; }
            .list-title { font-weight: 900; text-transform: uppercase; border-bottom: 2px solid black; display: inline-block; margin: 20px 0 10px 0; font-size: 11pt; }
          </style>
        </head>
        <body>
          <div class="center black header">XPRO KASSA</div>
          <div class="center" style="font-size: 9pt; margin-bottom: 5px; font-weight: 800;">📅 ${now.toLocaleDateString()}  🕒 ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          <div class="center bold" style="font-size: 8pt; text-transform: uppercase;">${activeShift.name}</div>
          <div class="divider"></div>
          
          <div class="row"><span class="label">NOMI:</span><span class="black" style="font-size: 12pt;">${catName}</span></div>
          <div class="row"><span class="label">SAVDO:</span><span class="black" style="font-size: 12pt;">${stats.savdo.toLocaleString()}</span></div>
          <div class="row"><span class="label">XARAJAT:</span><span class="black" style="font-size: 12pt;">${stats.catExpenses.toLocaleString()}</span></div>
          <div class="divider" style="border-style: dashed;"></div>
          
          <div class="total-row">
            <span style="font-size: 10pt; color: #666; vertical-align: middle;">QOLGAN PUL</span>
            <span style="font-size: 16pt; margin-left: 10px; vertical-align: middle;">${stats.balance.toLocaleString()} so'm</span>
          </div>

          <div class="list-title">XARAJATLAR RO'YXATI:</div>
          ${stats.transactions.map(t => `<div class="item-box"><span>${t.description || 'Xarajat'}</span><span>${t.amount.toLocaleString()}</span></div>`).join('')}
          
          <div class="divider"></div>
          <div class="center" style="font-size: 9pt; margin-top: 20px; font-weight: 900; letter-spacing: 1px;">XPRO MANAGEMENT SYSTEM</div>
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
      const dataUrl = await htmlToImage.toPng(el, { cacheBust: true, backgroundColor: '#fff', pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `xisobot-${catName.toLowerCase()}-${new Date().toISOString().slice(0,10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { alert('Rasm yuklashda xatolik.'); } finally { setExportingId(null); }
  };

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
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in duration-700">
      <div className="max-w-xl w-full flex flex-col items-center space-y-12">
        <div className="space-y-6">
          <h2 className="text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Xush kelibsiz!</h2>
          <p className="text-slate-400 font-medium text-lg">Kassa operatsiyalarini boshlash uchun yangi smena oching yoki faol hisobotlarni davom ettiring.</p>
        </div>
        
        <div className="flex justify-center w-full">
          <button 
            onClick={handleStartShift} 
            className="w-full md:w-auto px-16 py-6 bg-slate-900 dark:bg-indigo-600 text-white font-black rounded-[2rem] shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4 text-xl"
          >
            <Plus size={24} strokeWidth={3} /> <span>Hisobotni boshlash</span>
          </button>
        </div>

        {activeShiftsList.length > 0 && (
          <div className="w-full space-y-6 pt-12 border-t border-slate-100 dark:border-zinc-800">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Faol xisobotlar</h3>
            <div className="grid grid-cols-1 gap-3">
              {activeShiftsList.map((s) => (
                <div key={s.id} onClick={() => setActiveShift(s)} className="group bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-6 rounded-[2.5rem] flex items-center justify-between hover:border-indigo-400 cursor-pointer transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center"><Clock size={28} /></div>
                    <div className="text-left">
                      <h4 className="font-black text-slate-800 dark:text-white text-lg">{s.name}</h4>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(s.start_date).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-indigo-600 font-black text-sm uppercase opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">Davom etish <ArrowUpRight size={18} /></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const baseExpensesTotal = transactions.filter(t => ['Click', 'Uzcard', 'Humo', 'Xarajat'].includes(t.category)).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const positiveProfitSum = expenseCategories.reduce((acc, cat) => {
    const stats = calculateCatStats(cat.name);
    return acc + (stats.balance > 0 ? stats.balance : 0);
  }, 0);
  const totalExpensesAcrossTypes = baseExpensesTotal + positiveProfitSum;
  const totalBalance = manualKassaSum - totalExpensesAcrossTypes;
  const currentCategoryTotal = transactions.filter(t => t.category === activeTab).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'Xarajat') return t.category === 'Xarajat' && (activeSubTab ? t.sub_category === activeSubTab : true);
    return t.category === activeTab;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 no-print">
      {isFilterModalOpen && activeSubTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-zinc-800 space-y-6">
            <div className="flex items-center justify-between">
              <div><h3 className="text-xl font-black text-slate-800 dark:text-white">Sozlamalar</h3><p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{activeSubTab}</p></div>
              <button onClick={() => setIsFilterModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {['xarajat', 'click', 'terminal'].map((key) => {
                const curFilters = allExpenseFilters[activeSubTab] || defaultFilter;
                return (
                  <label key={key} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 cursor-pointer hover:bg-slate-50 transition-all">
                    <input type="checkbox" checked={curFilters[key as keyof typeof defaultFilter]} onChange={async () => {
                      const newF = { ...curFilters, [key]: !curFilters[key as keyof typeof defaultFilter] };
                      setAllExpenseFilters({ ...allExpenseFilters, [activeSubTab]: newF });
                      await upsertCategoryConfig(activeShift.id, activeSubTab, { filters: newF });
                    }} className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                    <div className="flex-1"><p className="font-bold text-slate-800 dark:text-white capitalize">{key}ni hisoblash</p></div>
                  </label>
                );
              })}
            </div>
            <button onClick={() => setIsFilterModalOpen(false)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl active:scale-95 transition-all">Tayyor</button>
          </div>
        </div>
      )}

      {/* Smena Sarlavhasi / Inline Tahrirlash */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Clock size={20} className="text-green-600 shrink-0" />
          {isRenaming ? (
            <div className="flex items-center gap-2 flex-1 animate-in slide-in-from-left-2">
              <input 
                autoFocus
                type="text"
                value={tempShiftName}
                onChange={(e) => setTempShiftName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveShiftName()}
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-indigo-200 dark:border-indigo-900 rounded-lg outline-none font-bold text-sm dark:text-white"
              />
              <button onClick={handleSaveShiftName} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Check size={18} /></button>
              <button onClick={() => setIsRenaming(false)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={18} /></button>
            </div>
          ) : (
            <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate">{activeShift.name}</h3>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          {!isRenaming && (
            <button onClick={handleEditShiftName} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-indigo-100 transition-all"><Edit2 size={14} /> Tahrirlash</button>
          )}
          <button onClick={() => closeShift(activeShift.id).then(() => window.location.reload())} className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl text-xs hover:bg-red-100 transition-all">Yopish</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {mainTabs.map((tab) => (
          <button key={tab.name} onClick={() => { setActiveTab(tab.name); if (tab.name === 'Xarajat' && expenseCategories.length > 0 && !activeSubTab) setActiveSubTab(expenseCategories[0].name); }} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all border text-sm ${activeTab === tab.name ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-zinc-900 text-slate-500 border-slate-100 dark:border-zinc-800'}`}>
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
              <div key={cat.id} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col group">
                {/* Visual Preview for Image Generation */}
                <div 
                  ref={(el) => { exportRefs.current[cat.name] = el; }} 
                  className="p-10 bg-white text-slate-900 w-[500px] mx-auto flex flex-col items-stretch"
                >
                   <div className="text-center mb-6">
                      <h4 className="font-black text-3xl text-black uppercase mb-2">XPRO KASSA</h4>
                      <div className="flex items-center justify-center gap-4 text-[11px] font-black text-slate-600">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {now.toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 border-t pt-2 border-slate-100">{activeShift.name}</p>
                   </div>

                   <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nomi</span>
                        <span className="font-black text-lg text-black">{cat.name}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Savdo</span>
                        <span className="font-black text-lg text-black">{stats.savdo.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Xarajat</span>
                        <span className="font-black text-lg text-black">{stats.catExpenses.toLocaleString()}</span>
                      </div>
                      
                      <div className="pt-4 border-t-2 border-dashed border-slate-200 mt-4">
                        <div className="flex justify-between items-center p-6 bg-white border-2 border-black rounded-[2rem] shadow-sm">
                           <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Qolgan Pul</span>
                           <span className="text-2xl font-black text-black">{stats.balance.toLocaleString()} so'm</span>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-2 mb-8">
                      <h5 className="text-[10px] font-black uppercase text-black border-b-2 border-black inline-block mb-2">Xarajatlar ro'yxati:</h5>
                      {stats.transactions.map((t, i) => (
                        <div key={i} className="flex justify-between items-center text-[13px] py-1.5 border-b border-slate-50">
                          <span className="font-bold text-slate-800">{t.description || 'Xarajat'}</span>
                          <span className="font-black text-black">{t.amount.toLocaleString()}</span>
                        </div>
                      ))}
                   </div>

                   <div className="mt-auto text-center border-t border-slate-100 pt-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">XPRO MANAGEMENT SYSTEM</p>
                   </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 flex gap-3 border-t border-slate-100 dark:border-zinc-800 mt-auto">
                  <button onClick={() => handlePrint(cat.name)} className="flex-1 py-4 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-2xl flex items-center justify-center gap-2 text-xs font-black hover:bg-slate-100 transition-all"><Printer size={16} /> Chop etish</button>
                  <button onClick={() => handleDownloadImage(cat.name)} disabled={exportingId !== null} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black disabled:opacity-50 hover:bg-indigo-700 transition-all shadow-lg">{exportingId === cat.name ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Rasm</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'Kassa' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Kassa Summasi" val={manualKassaSum} icon={<ArrowUpRight />} color="green" onClick={handleKassaSumClick} />
              <StatCard label="Umumiy Chiqim" val={totalExpensesAcrossTypes} icon={<ArrowDownRight />} color="red" />
              <StatCard label="Balans" val={totalBalance} icon={<Calculator />} color="indigo" />
            </div>
          )}
          {activeTab === 'Xarajat' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {expenseCategories.map((cat) => (
                <div key={cat.id} draggable onDragStart={(e) => handleDragStart(e, cat.id)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, cat.id)} className={`relative h-12 rounded-xl border transition-all cursor-move flex items-center justify-center p-2 ${activeSubTab === cat.name ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-zinc-900 text-slate-600 border-slate-100 dark:border-zinc-800'}`} onClick={() => setActiveSubTab(cat.name)}>
                  <span className="font-bold text-center text-[12px]">{cat.name}</span>
                  <div className="absolute -top-1.5 -right-1.5 flex gap-1 bg-white dark:bg-zinc-800 p-0.5 rounded-lg shadow-md border border-slate-100 z-10">
                     <button onClick={(e) => handleEditCategoryName(e, cat.id, cat.name)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 size={10} /></button>
                     <button onClick={(e) => handleDeleteCategoryWithConfirmation(e, cat.id, cat.name)} className="p-1 text-slate-400 hover:text-red-500"><X size={10} /></button>
                  </div>
                </div>
              ))}
              <button onClick={handleAddCategory} className="h-12 rounded-xl border-2 border-dashed border-indigo-200 flex items-center justify-center text-indigo-500 hover:bg-indigo-50 transition-colors"><Plus size={20} /></button>
            </div>
          )}
          {activeTab !== 'Kassa' && (
            <form onSubmit={handleSaveTransaction} className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-sm space-y-4">
               <div className="flex items-center gap-2 mb-2"><Plus size={18} className="text-indigo-600" /><h4 className="font-bold text-sm uppercase tracking-widest text-slate-800 dark:text-white">Yangi operatsiya ({activeTab})</h4></div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" value={amountInput} onChange={handleAmountChange} placeholder="Summa (0)" className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none font-black text-lg dark:text-white" />
                  <input type="text" value={descInput} onChange={(e) => setDescInput(e.target.value)} placeholder="Tavsif (ixtiyoriy)" className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none font-medium dark:text-white" />
               </div>
               <button type="submit" disabled={isSaving} className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50">{isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Saqlash</button>
            </form>
          )}
          {activeTab === 'Xarajat' && activeSubTab && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const stats = calculateCatStats(activeSubTab);
                return (<><StatCard label={`${activeSubTab} - Savdo`} val={stats.savdo} icon={<Coins />} color="green" onClick={handleSavdoSumClick} /><StatCard label={`${activeSubTab} - Chiqim`} val={stats.totalDeduction} icon={<Settings2 />} color="red" onClick={() => setIsFilterModalOpen(true)} /><StatCard label={`${activeSubTab} - Foyda`} val={stats.balance} icon={<TrendingUp />} color="indigo" /></>);
              })()}
            </div>
          )}
          {activeTab !== 'Kassa' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase px-2">Amallar ({filteredTransactions.length})</h3>
              <div className="space-y-2.5">
                {filteredTransactions.map((t) => (
                  <div key={t.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm group">
                    {editingId === t.id ? (
                      <form onSubmit={(e) => saveEdit(e, t.id)} className="space-y-4"><div className="grid grid-cols-2 gap-3"><input value={editData.amount} onChange={(e) => setEditData({ ...editData, amount: formatAmount(e.target.value) })} className="w-full p-3 bg-slate-50 dark:bg-zinc-800 border rounded-xl text-sm font-bold" /><input value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-zinc-800 border rounded-xl text-sm font-medium" /></div><div className="flex justify-end gap-3"><button type="button" onClick={() => setEditingId(null)} className="text-xs font-bold text-slate-500">Bekor qilish</button><button type="submit" className="px-5 py-2 bg-green-600 text-white text-xs font-bold rounded-xl">Saqlash</button></div></form>
                    ) : (
                      <div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'kirim' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{t.type === 'kirim' ? <Plus size={18} /> : <TrendingDown size={18} />}</div><div><p className="font-bold text-slate-800 dark:text-white text-[13px]">{t.description || 'Tavsifsiz'}</p><p className="text-[10px] text-slate-400 uppercase font-bold">{t.sub_category || t.category}</p></div></div><div className="flex items-center gap-4"><p className={`font-black text-sm ${t.type === 'kirim' ? 'text-green-600' : 'text-red-500'}`}>{(t.amount || 0).toLocaleString()}</p><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => startEdit(t)} className="p-1 text-slate-400"><Edit2 size={14} /></button><button onClick={() => handleDelete(t.id)} className="p-1 text-slate-400"><Trash2 size={14} /></button></div></div></div>
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