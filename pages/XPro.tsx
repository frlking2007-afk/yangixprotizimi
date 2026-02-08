
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
import UIModal from '../components/UIModal.tsx';
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
    indigo: "bg-slate-50 text-slate-900 dark:bg-zinc-800 dark:text-white",
    amber: "bg-amber-50 text-amber-600"
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-zinc-900 hacker:bg-black p-6 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-all ${onClick ? 'cursor-pointer hover:border-slate-400 dark:hover:border-zinc-500 active:scale-95' : ''}`}
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

const XPro: React.FC<{ forcedShiftId?: string | null }> = ({ forcedShiftId }) => {
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
  const [allExpenseFilters, setAllExpenseFilters] = useState<Record<string, any>>({});
  const [amountInput, setAmountInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'input' | 'confirm' | 'password';
    title: string;
    description?: string;
    initialValue?: string;
    placeholder?: string;
    onConfirm: (val?: string) => void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    type: 'input',
    title: '',
    onConfirm: () => {},
  });

  const openModal = (config: Omit<typeof modal, 'isOpen'>) => {
    setModal({ ...config, isOpen: true });
  };

  const initData = async () => {
    setLoading(true);
    try {
      let shift = forcedShiftId ? await getShiftById(forcedShiftId) : await getActiveShift();
      const categories = await getExpenseCategories();
      setActiveShift(shift);
      setExpenseCategories(categories || []);
      if (shift) {
        setManualKassaSum(shift.manual_kassa_sum || 0);
        const [trans, configs] = await Promise.all([getTransactionsByShift(shift.id), getCategoryConfigs(shift.id)]);
        setTransactions(trans || []);
        const sums: Record<string, number> = {};
        const filters: Record<string, any> = {};
        configs.forEach(cfg => {
          sums[cfg.category_name] = cfg.savdo_sum || 0;
          filters[cfg.category_name] = cfg.filters || { xarajat: true, click: false, terminal: false };
        });
        setManualSavdoSums(sums);
        setAllExpenseFilters(filters);
      } else {
        const allShifts = await getAllShifts();
        setActiveShiftsList(allShifts.filter(s => s.status === 'active'));
      }
      if (activeTab === 'Xarajat' && !activeSubTab && categories?.length > 0) setActiveSubTab(categories[0].name);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { initData(); }, [forcedShiftId]);

  const handleKassaSumClick = () => {
    openModal({
      title: "Kassa summasini kiritish",
      description: "Amaldagi jami kassa summasini kiriting.",
      type: 'input',
      initialValue: manualKassaSum.toString(),
      onConfirm: async (val) => {
        const num = parseFloat(val?.replace(/\s/g, '') || '0');
        if (!isNaN(num)) {
          setManualKassaSum(num);
          if (activeShift) await updateShiftManualSum(activeShift.id, num);
        }
      }
    });
  };

  const handleAddCategory = () => {
    openModal({
      title: "Yangi toifa qo'shish",
      type: 'input',
      placeholder: "Toifa nomi (masalan: Oshxona)",
      onConfirm: async (name) => {
        if (!name?.trim()) return;
        const newCat = await createExpenseCategory(name.trim());
        if (newCat) {
          setExpenseCategories([...expenseCategories, newCat]);
          setActiveSubTab(newCat.name);
        }
      }
    });
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    const numAmount = parseFloat(amountInput.replace(/\s/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) return;
    setIsSaving(true);
    await saveTransaction({
      shift_id: activeShift.id,
      amount: numAmount,
      category: activeTab,
      sub_category: activeTab === 'Xarajat' ? activeSubTab || undefined : undefined,
      description: descInput,
      type: activeTab === 'Xarajat' ? 'chiqim' : 'kirim'
    });
    setAmountInput(''); setDescInput('');
    setTransactions(await getTransactionsByShift(activeShift.id) || []);
    setIsSaving(false);
  };

  const handleDownloadImage = async (catName: string) => {
    const el = exportRefs.current[catName];
    if (!el) return;
    setExportingId(catName);
    try {
      const dataUrl = await htmlToImage.toPng(el, { cacheBust: true, backgroundColor: '#fff', pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `xisobot-${catName.toLowerCase()}-${activeShift?.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { alert('Rasm yuklashda xatolik.'); } finally { setExportingId(null); }
  };

  const calculateCatStats = (catName: string) => {
    const filters = allExpenseFilters[catName] || { xarajat: true, click: false, terminal: false };
    const savdo = manualSavdoSums[catName] || 0;
    const catExpenses = transactions.filter(t => t.category === 'Xarajat' && t.sub_category === catName).reduce((acc, t) => acc + (t.amount || 0), 0);
    const clickSum = transactions.filter(t => t.category === 'Click').reduce((acc, t) => acc + (t.amount || 0), 0);
    const terminalSum = transactions.filter(t => t.category === 'Uzcard' || t.category === 'Humo').reduce((acc, t) => acc + (t.amount || 0), 0);
    let totalDeduction = 0;
    if (filters.xarajat) totalDeduction += catExpenses;
    if (filters.click) totalDeduction += clickSum;
    if (filters.terminal) totalDeduction += terminalSum;
    return { savdo, catExpenses, clickSum, terminalSum, totalDeduction, balance: savdo - totalDeduction, filters, transactions: transactions.filter(t => t.category === 'Xarajat' && t.sub_category === catName) };
  };

  const formatAmount = (val: string) => val.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  if (loading) return <div className="flex flex-col items-center justify-center h-96"><RefreshCcw className="animate-spin text-slate-900 dark:text-white mb-4" size={40} /><p className="text-slate-500 font-medium">Yuklanmoqda...</p></div>;

  if (!activeShift) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="max-w-xl w-full space-y-12">
        <h2 className="text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Xush kelibsiz!</h2>
        <div className="flex justify-center"><button onClick={() => startNewShift().then(s => setActiveShift(s))} className="px-16 py-6 bg-slate-900 dark:bg-white text-white dark:text-black font-black rounded-[2rem] shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-4 text-xl"><Plus size={24} /> <span>Hisobotni boshlash</span></button></div>
      </div>
    </div>
  );

  const totalExpenses = transactions.filter(t => ['Click', 'Uzcard', 'Humo', 'Xarajat'].includes(t.category)).reduce((acc, curr) => acc + (curr.amount || 0), 0) + expenseCategories.reduce((acc, cat) => {
    const stats = calculateCatStats(cat.name);
    return acc + (stats.balance > 0 ? stats.balance : 0);
  }, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 no-print">
      <UIModal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />
      <div className="flex flex-wrap gap-2">
        {['Kassa', 'Click', 'Uzcard', 'Humo', 'Xarajat', 'Eksport'].map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'Xarajat' && expenseCategories.length > 0 && !activeSubTab) setActiveSubTab(expenseCategories[0].name); }} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold border text-sm ${activeTab === tab ? 'bg-slate-900 text-white dark:bg-white dark:text-black border-slate-900 dark:border-white' : 'bg-white dark:bg-zinc-900 text-slate-500 border-slate-100 dark:border-zinc-800'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'Eksport' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expenseCategories.map(cat => {
            const stats = calculateCatStats(cat.name);
            return (
              <div key={cat.id} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 overflow-hidden flex flex-col group shadow-sm">
                <div ref={el => exportRefs.current[cat.name] = el} className="p-10 bg-white text-slate-900 w-[500px] mx-auto flex flex-col">
                   <div className="text-center mb-6 font-black text-3xl uppercase">XPRO KASSA</div>
                   <div className="space-y-4 mb-6 font-bold"><div className="flex justify-between border-b pb-2"><span className="text-[10px] uppercase text-slate-400">Nomi</span><span>{cat.name}</span></div><div className="flex justify-between border-b pb-2"><span className="text-[10px] uppercase text-slate-400">Savdo</span><span>{stats.savdo.toLocaleString()}</span></div><div className="flex justify-between border-b pb-2"><span className="text-[10px] uppercase text-slate-400">Xarajat</span><span>{stats.catExpenses.toLocaleString()}</span></div><div className="pt-4 border-t-2 border-dashed mt-4"><div className="flex justify-between p-6 bg-slate-100 border border-black rounded-[2rem] shadow-sm"><span className="text-[10px] uppercase text-slate-500">Qolgan Pul</span><span className="text-2xl font-black">{stats.balance.toLocaleString()} so'm</span></div></div></div>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-800 p-6 flex gap-3"><button onClick={() => window.print()} className="flex-1 py-4 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-2xl text-xs font-black">Chop etish</button><button onClick={() => handleDownloadImage(cat.name)} disabled={exportingId !== null} className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl text-xs font-black flex items-center justify-center gap-2">{exportingId === cat.name ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Rasm</button></div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'Kassa' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Kassa Summasi" val={manualKassaSum} icon={<ArrowUpRight />} color="green" onClick={handleKassaSumClick} />
              <StatCard label="Umumiy Chiqim" val={totalExpenses} icon={<ArrowDownRight />} color="red" />
              <StatCard label="Balans" val={manualKassaSum - totalExpenses} icon={<Calculator />} color="indigo" />
            </div>
          )}
          {activeTab === 'Xarajat' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {expenseCategories.map(cat => <div key={cat.id} className={`relative h-12 rounded-xl border flex items-center justify-center p-2 cursor-pointer transition-all ${activeSubTab === cat.name ? 'bg-slate-900 text-white dark:bg-white dark:text-black border-slate-900 dark:border-white' : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800'}`} onClick={() => setActiveSubTab(cat.name)}><span className="font-bold text-[12px]">{cat.name}</span></div>)}
              <button onClick={handleAddCategory} className="h-12 rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white"><Plus size={20} /></button>
            </div>
          )}
          {activeTab !== 'Kassa' && (
            <form onSubmit={handleSaveTransaction} className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="text" value={amountInput} onChange={(e) => setAmountInput(formatAmount(e.target.value))} placeholder="Summa (0)" className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none font-black text-lg dark:text-white" /><input type="text" value={descInput} onChange={(e) => setDescInput(e.target.value)} placeholder="Tavsif (ixtiyoriy)" className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none font-medium dark:text-white" /></div>
              <button type="submit" disabled={isSaving} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-black rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-black dark:hover:bg-slate-100 shadow-lg shadow-slate-200 dark:shadow-none">{isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Saqlash</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default XPro;
