
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Wallet, CreditCard, 
  Banknote, TrendingDown, Clock, 
  PlayCircle, RefreshCcw, 
  Edit2, X, Check, ArrowUpRight, ArrowDownRight, 
  Calculator, Download, Printer, Save, Loader2,
  TrendingUp, Coins, Settings2, Calendar, List,
  ToggleLeft, ToggleRight, GripHorizontal,
  LogOut, Search
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
  updateExpenseCategoriesOrder, getShiftById, getAllShifts, updateShiftName, deleteShift
} from '../services/supabase.ts';

const StatCard = ({ label, val, icon, color, onClick }: { label: string, val: number, icon: React.ReactNode, color: 'green' | 'red' | 'indigo' | 'amber', onClick?: () => void }) => {
  const colorClasses = {
    green: "bg-green-50 text-green-600 dark:bg-green-900/10",
    red: "bg-red-50 text-red-600 dark:bg-red-900/10",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/10",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/10"
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

const XPro: React.FC<{ forcedShiftId?: string | null, searchQuery?: string, onSearchClear?: () => void }> = ({ forcedShiftId, searchQuery = '', onSearchClear }) => {
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
  
  // Filter Modal State
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState<string | null>(null);

  // Edit Transaction Modal State
  const [editTransModalOpen, setEditTransModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editAmountVal, setEditAmountVal] = useState('');
  const [editDescVal, setEditDescVal] = useState('');

  // Add Amount to Transaction State
  const [addAmountModalOpen, setAddAmountModalOpen] = useState(false);
  const [targetAddTransaction, setTargetAddTransaction] = useState<Transaction | null>(null);

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
    enableNumberFormatting?: boolean;
  }>({
    isOpen: false,
    type: 'input',
    title: '',
    onConfirm: () => {},
  });

  // SEARCH LOGIC
  const filteredResults = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') return [];
    
    const lowerQuery = searchQuery.toLowerCase();
    
    // Search Categories
    const matchedCategories = expenseCategories.filter(cat => 
      cat.name.toLowerCase().includes(lowerQuery)
    ).map(cat => ({ type: 'category' as const, data: cat }));

    // Search Transactions
    const matchedTransactions = transactions.filter(t => 
      t.description?.toLowerCase().includes(lowerQuery) || 
      t.amount.toString().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery) ||
      (t.sub_category && t.sub_category.toLowerCase().includes(lowerQuery))
    ).map(t => ({ type: 'transaction' as const, data: t }));

    return [...matchedCategories, ...matchedTransactions];
  }, [searchQuery, expenseCategories, transactions]);

  const highlightElement = (elementId: string) => {
    // Wait for DOM update
    setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-indigo-500', 'ring-offset-2', 'dark:ring-offset-black', 'transition-all', 'duration-500', 'scale-[1.02]');
            setTimeout(() => {
                element.classList.remove('ring-4', 'ring-indigo-500', 'ring-offset-2', 'dark:ring-offset-black', 'scale-[1.02]');
            }, 2000);
        }
    }, 300); // Slight delay to ensure tab switch renders content
  };

  const handleSearchResultClick = (result: any) => {
    if (result.type === 'category') {
        // Switch to Expense tab
        setActiveTab('Xarajat');
        setActiveSubTab(result.data.name);
        // Clean search
        if (onSearchClear) onSearchClear();
        // Highlight category button
        highlightElement(`cat-btn-${result.data.id}`);
    } else if (result.type === 'transaction') {
        const trans = result.data as Transaction;
        
        // Handle Tab Switching
        if (trans.category === 'Xarajat') {
            setActiveTab('Xarajat');
            if (trans.sub_category) setActiveSubTab(trans.sub_category);
        } else {
            setActiveTab(trans.category);
            setActiveSubTab(null);
        }
        
        // Clean search
        if (onSearchClear) onSearchClear();
        // Highlight transaction row
        highlightElement(`trans-item-${trans.id}`);
    }
  };


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

  const handleSelectActiveShift = async (shift: Shift) => {
    setLoading(true);
    try {
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
        setActiveShift(shift);
    } catch (err) {
        console.error(err);
        alert("Smenani yuklashda xatolik");
    } finally {
        setLoading(false);
    }
  };

  const handleEditShiftName = () => {
    if (!activeShift) return;
    openModal({
        title: "Smena nomini o'zgartirish",
        type: 'input',
        initialValue: activeShift.name,
        onConfirm: async (val) => {
            if (val && val.trim()) {
                await updateShiftName(activeShift.id, val.trim());
                setActiveShift({ ...activeShift, name: val.trim() });
            }
        }
    });
  };

  const handleDeleteActiveShift = () => {
    if (!activeShift) return;
    openModal({
        title: "Smenani o'chirish",
        description: "Diqqat! Ushbu smena va unga tegishli barcha ma'lumotlar o'chib ketadi.",
        type: 'password',
        isDanger: true,
        onConfirm: async (password) => {
            const correctPassword = await getDeletionPassword();
            if (password !== correctPassword) return alert("Parol noto'g'ri!");
            await deleteShift(activeShift.id);
            setActiveShift(null);
            initData(); // Refresh to show welcome screen or other shifts
        }
    });
  };

  const handleCloseActiveShift = () => {
    if (!activeShift) return;
    openModal({
      title: "Smenani yopish",
      description: "Smenani yopishni tasdiqlaysizmi?",
      type: 'confirm',
      onConfirm: async () => {
         await closeShift(activeShift.id);
         setActiveShift(null);
         initData();
      }
    });
  }

  const handleKassaSumClick = () => {
    openModal({
      title: "Kassa summasini kiritish",
      description: "Amaldagi jami kassa summasini kiriting.",
      type: 'input',
      initialValue: manualKassaSum.toString(),
      enableNumberFormatting: true,
      onConfirm: async (val) => {
        const num = parseFloat(val?.replace(/\s/g, '') || '0');
        if (!isNaN(num)) {
          setManualKassaSum(num);
          if (activeShift) await updateShiftManualSum(activeShift.id, num);
        }
      }
    });
  };

  // Savdo summasini o'zgartirish
  const handleSavdoClick = (catName: string) => {
    openModal({
      title: `${catName} Savdosi`,
      description: "Ushbu toifa uchun savdo summasini kiriting.",
      type: 'input',
      initialValue: (manualSavdoSums[catName] || 0).toString(),
      enableNumberFormatting: true,
      onConfirm: async (val) => {
        const num = parseFloat(val?.replace(/\s/g, '') || '0');
        if (!isNaN(num) && activeShift) {
          setManualSavdoSums(prev => ({ ...prev, [catName]: num }));
          // Config ni saqlash
          const currentFilters = allExpenseFilters[catName] || { xarajat: true, click: false, terminal: false };
          await upsertCategoryConfig(activeShift.id, catName, {
            savdo_sum: num,
            filters: currentFilters
          });
        }
      }
    });
  };

  // Filtrlarni o'zgartirish
  const handleFilterToggle = async (type: 'xarajat' | 'click' | 'terminal') => {
    if (!activeFilterCategory || !activeShift) return;
    
    const currentFilters = allExpenseFilters[activeFilterCategory] || { xarajat: true, click: false, terminal: false };
    const newFilters = { ...currentFilters, [type]: !currentFilters[type] };
    
    setAllExpenseFilters(prev => ({ ...prev, [activeFilterCategory]: newFilters }));
    
    await upsertCategoryConfig(activeShift.id, activeFilterCategory, {
      savdo_sum: manualSavdoSums[activeFilterCategory] || 0,
      filters: newFilters
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

  const handleEditCategory = (e: React.MouseEvent, cat: ExpenseCategory) => {
    e.stopPropagation();
    openModal({
      title: "Toifani tahrirlash",
      type: 'input',
      initialValue: cat.name,
      onConfirm: async (newName) => {
        if (!newName?.trim() || newName === cat.name) return;
        await updateExpenseCategory(cat.id, newName.trim());
        setExpenseCategories(prev => prev.map(c => c.id === cat.id ? {...c, name: newName.trim()} : c));
        if (activeSubTab === cat.name) setActiveSubTab(newName.trim());
      }
    });
  };

  const handleDeleteCategory = (e: React.MouseEvent, catId: string, catName: string) => {
    e.stopPropagation();
    openModal({
      title: "Toifani o'chirish",
      description: "Haqiqatan ham ushbu toifani o'chirmoqchimisiz?",
      type: 'confirm',
      isDanger: true,
      onConfirm: async () => {
        await deleteExpenseCategory(catId);
        const newCats = expenseCategories.filter(c => c.id !== catId);
        setExpenseCategories(newCats);
        if (activeSubTab === catName) setActiveSubTab(newCats[0]?.name || null);
      }
    });
  };

  // DRAG AND DROP HANDLERS
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const newCategories = [...expenseCategories];
    const [movedItem] = newCategories.splice(sourceIndex, 1);
    newCategories.splice(targetIndex, 0, movedItem);

    setExpenseCategories(newCategories);
    await updateExpenseCategoriesOrder(newCategories);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    const numAmount = parseFloat(amountInput.replace(/\s/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) return;
    setIsSaving(true);
    try {
      await saveTransaction({
        shift_id: activeShift.id,
        amount: numAmount,
        category: activeTab,
        sub_category: activeTab === 'Xarajat' ? activeSubTab || undefined : undefined,
        description: descInput,
        type: activeTab === 'Xarajat' ? 'chiqim' : 'kirim'
      });
      setAmountInput(''); setDescInput('');
      const updatedTrans = await getTransactionsByShift(activeShift.id);
      setTransactions(updatedTrans || []);
    } catch (err) {
      alert("Xatolik saqlashda");
    } finally {
      setIsSaving(false);
    }
  };

  // TRANSAKSIYANI TAHRIRLASH
  const handleEditTransactionClick = (t: Transaction) => {
    // Parol so'rash
    openModal({
      title: "Tahrirlash paroli",
      type: 'password',
      onConfirm: async (password) => {
        const correctPassword = await getDeletionPassword();
        if (password !== correctPassword) return alert("Parol noto'g'ri!");
        
        // Parol to'g'ri bo'lsa tahrirlash oynasini ochamiz
        setEditingTransaction(t);
        setEditAmountVal(t.amount.toString());
        setEditDescVal(t.description || '');
        setEditTransModalOpen(true);
      }
    });
  };

  const handleSaveEditedTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction || !activeShift) return;
    const num = parseFloat(editAmountVal.replace(/\s/g, ''));
    if (isNaN(num) || num <= 0) return;
    
    setEditTransModalOpen(false);
    
    await updateTransaction(editingTransaction.id, {
      amount: num,
      description: editDescVal
    });
    
    // Refresh list
    const updatedTrans = await getTransactionsByShift(activeShift.id);
    setTransactions(updatedTrans || []);
    setEditingTransaction(null);
  };

  // ADD AMOUNT TO TRANSACTION
  const handleAddAmountClick = (t: Transaction) => {
    openModal({
      title: "Qo'shish paroli",
      type: 'password',
      onConfirm: async (password) => {
        const correctPassword = await getDeletionPassword();
        if (password !== correctPassword) return alert("Parol noto'g'ri!");
        
        setTargetAddTransaction(t);
        setAddAmountModalOpen(true);
      }
    });
  };

  const handleSaveAddedAmount = async (val?: string) => {
    if (!targetAddTransaction || !activeShift || !val) return;
    const addedAmount = parseFloat(val.replace(/\s/g, ''));
    if (isNaN(addedAmount) || addedAmount <= 0) return;

    const newTotal = targetAddTransaction.amount + addedAmount;

    setAddAmountModalOpen(false);
    
    await updateTransaction(targetAddTransaction.id, {
      amount: newTotal
    });

    // Refresh list
    const updatedTrans = await getTransactionsByShift(activeShift.id);
    setTransactions(updatedTrans || []);
    setTargetAddTransaction(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    openModal({
      title: "O'chirish paroli",
      type: 'password',
      isDanger: true,
      onConfirm: async (password) => {
        const correctPassword = await getDeletionPassword();
        if (password !== correctPassword) return alert("Parol noto'g'ri!");
        await deleteTransaction(id);
        if (activeShift) {
          const updatedTrans = await getTransactionsByShift(activeShift.id);
          setTransactions(updatedTrans || []);
        }
      }
    });
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

  const handlePrint = (catName: string) => {
    const stats = calculateCatStats(catName);
    const now = new Date();
    const shiftDate = activeShift ? new Date(activeShift.start_date) : now;
    
    // Time format: 24h, no emoji
    const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>XPRO - ${catName}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { 
              font-family: 'Inter', sans-serif; 
              width: 76mm; 
              margin: 0 auto; 
              padding: 10px 2px; 
              font-size: 11pt; /* Increased font size */
              color: black; 
              background: white; 
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: 700; }
            .black { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            
            .header { font-size: 22pt; margin-bottom: 10px; letter-spacing: -1px; }
            .date-row { font-size: 10pt; display: flex; justify-content: center; gap: 15px; font-weight: 700; margin-bottom: 8px; }
            .smena-line { border-top: 2px solid black; border-bottom: 2px solid black; padding: 6px 0; font-size: 9pt; font-weight: 800; text-align: center; margin-bottom: 25px; text-transform: uppercase; }
            
            .row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px; }
            .label { font-size: 10pt; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
            .value { font-size: 14pt; font-weight: 900; }
            
            .divider-dashed { border-top: 2px dashed #000; margin: 20px 0; }
            
            .balance-box { 
              border: 3px solid black; 
              border-radius: 16px; 
              padding: 12px 18px; 
              background-color: #f3f4f6; 
              display: flex; 
              justify-content: space-between; 
              align-items: center;
              margin: 20px 0;
            }
            .balance-label { font-size: 10pt; font-weight: 900; text-transform: uppercase; width: 70px; line-height: 1.2; }
            .balance-val { font-size: 18pt; font-weight: 900; }
            
            .list-header { 
              font-size: 10pt; 
              font-weight: 900; 
              text-transform: uppercase; 
              border-bottom: 2px solid black; 
              display: inline-block;
              margin-bottom: 15px;
              letter-spacing: 0.5px;
            }
            
            .list-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 10pt; font-weight: 700; }
            
            .footer { margin-top: 40px; text-align: center; font-size: 8pt; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; border-top: 2px solid black; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="center header black uppercase">XPRO</div>
          
          <div class="date-row">
            <span>${now.toLocaleDateString()}</span>
            <span>${now.toLocaleTimeString([], timeOpts)}</span>
          </div>
          
          <div class="smena-line">
            SMENA - ${shiftDate.toLocaleDateString()} ${shiftDate.toLocaleTimeString([], timeOpts)}
          </div>
          
          <div class="row">
            <span class="label">NOMI</span>
            <span class="value" style="font-size: 14pt;">${catName}</span>
          </div>
          
          <div class="row">
            <span class="label">SAVDO</span>
            <span class="value">${stats.savdo.toLocaleString()}</span>
          </div>
          
          <div class="row">
            <span class="label">XARAJAT</span>
            <span class="value">${stats.catExpenses.toLocaleString()}</span>
          </div>
          
          ${stats.filters.click ? `
            <div class="row">
              <span class="label">CLICK</span>
              <span class="value">${stats.clickSum.toLocaleString()}</span>
            </div>
          ` : ''}

          ${stats.filters.terminal ? `
            <div class="row">
              <span class="label">TERMINAL</span>
              <span class="value">${stats.terminalSum.toLocaleString()}</span>
            </div>
          ` : ''}
          
          <div class="divider-dashed"></div>
          
          <div class="balance-box">
            <div class="balance-label">QOLGAN PUL</div>
            <div class="balance-val">${stats.balance.toLocaleString()} <span style="font-size: 12pt; font-weight: 700;">so'm</span></div>
          </div>
          
          <div>
            <div class="list-header">XARAJATLAR RO'YXATI</div>
          </div>
          
          ${stats.transactions.length > 0 ? stats.transactions.map(t => `
            <div class="list-item">
              <span>${t.description || 'Xarajat'}</span>
              <span>${t.amount.toLocaleString()}</span>
            </div>
          `).join('') : '<div class="center" style="font-style:italic; font-size: 9pt;">Xarajatlar mavjud emas</div>'}
          
          <div class="footer">XPRO MANAGEMENT SYSTEM</div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
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
      link.download = `xpro-${catName.toLowerCase()}-${activeShift?.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { alert('Rasm yuklashda xatolik.'); } finally { setExportingId(null); }
  };

  const formatAmount = (val: string) => val.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  if (loading) return <div className="flex flex-col items-center justify-center h-96"><RefreshCcw className="animate-spin text-slate-900 dark:text-white mb-4" size={40} /><p className="text-slate-500 font-medium">Yuklanmoqda...</p></div>;

  if (!activeShift) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="max-w-xl w-full space-y-12 flex flex-col items-center">
        <div>
          <h2 className="text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none mb-4 text-center">Xush kelibsiz!</h2>
          <div className="flex justify-center"><button onClick={() => startNewShift().then(s => setActiveShift(s))} className="px-16 py-6 bg-slate-900 dark:bg-white text-white dark:text-black font-black rounded-[2rem] shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-4 text-xl"><Plus size={24} /> <span>Hisobotni boshlash</span></button></div>
        </div>

        {activeShiftsList.length > 0 && (
          <div className="mt-8 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
             <div className="flex items-center gap-4 mb-4">
                 <div className="h-px bg-slate-200 dark:bg-zinc-800 flex-1"></div>
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Faol smenalar</span>
                 <div className="h-px bg-slate-200 dark:bg-zinc-800 flex-1"></div>
             </div>
             <div className="space-y-3">
               {activeShiftsList.map(s => (
                 <button 
                   key={s.id}
                   onClick={() => handleSelectActiveShift(s)}
                   className="w-full bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-600 transition-all flex items-center justify-between group"
                 >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 dark:bg-green-900/20 flex items-center justify-center">
                          <Clock size={20} />
                       </div>
                       <div className="text-left">
                          <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">{s.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(s.start_date).toLocaleDateString()} • {new Date(s.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}</p>
                       </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                       <PlayCircle size={16} />
                    </div>
                 </button>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );

  const totalExpenses = transactions.filter(t => ['Click', 'Uzcard', 'Humo', 'Xarajat'].includes(t.category)).reduce((acc, curr) => acc + (curr.amount || 0), 0) + expenseCategories.reduce((acc, cat) => {
    const stats = calculateCatStats(cat.name);
    return acc + (stats.balance > 0 ? stats.balance : 0);
  }, 0);

  const filteredTransactions = transactions.filter(t => {
     if (activeTab === 'Xarajat') return t.category === 'Xarajat' && (activeSubTab ? t.sub_category === activeSubTab : true);
     return t.category === activeTab;
  });

  const currentTabTotal = filteredTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 no-print relative">
      <UIModal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />
      
      {/* SEARCH RESULTS DROPDOWN */}
      {filteredResults.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-50 mx-auto max-w-2xl bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                 <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Qidiruv natijalari ({filteredResults.length})</span>
                 <button onClick={onSearchClear} className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full"><X size={16} /></button>
             </div>
             <div className="max-h-[60vh] overflow-y-auto p-2 space-y-2">
                 {filteredResults.map((result, idx) => (
                     <div 
                         key={idx} 
                         onClick={() => handleSearchResultClick(result)}
                         className="p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer flex items-center justify-between group transition-colors"
                     >
                         <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${result.type === 'category' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                                 {result.type === 'category' ? <TrendingDown size={18} /> : (result.data.type === 'kirim' ? <ArrowUpRight size={18} className="text-green-600" /> : <ArrowDownRight size={18} className="text-red-600" />)}
                             </div>
                             <div>
                                 <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                                     {result.type === 'category' ? result.data.name : (result.data.description || 'Tavsifsiz')}
                                 </h4>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase">
                                     {result.type === 'category' ? 'Xarajat toifasi' : `${result.data.category} ${result.data.sub_category ? '• ' + result.data.sub_category : ''}`}
                                 </p>
                             </div>
                         </div>
                         {result.type === 'transaction' && (
                             <span className="font-black text-sm text-slate-900 dark:text-white">
                                 {result.data.amount.toLocaleString()}
                             </span>
                         )}
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                             <ArrowUpRight size={16} className="text-slate-400" />
                         </div>
                     </div>
                 ))}
             </div>
          </div>
      )}

      {/* Add Amount Modal */}
      {addAmountModalOpen && targetAddTransaction && (
        <UIModal
          isOpen={addAmountModalOpen}
          onClose={() => setAddAmountModalOpen(false)}
          onConfirm={handleSaveAddedAmount}
          title="Summa qo'shish"
          description={`"${targetAddTransaction.description || 'Ushbu operatsiya'}" summasiga qo'shimcha summa qo'shish.`}
          type="input"
          placeholder="Qo'shiladigan summa"
          enableNumberFormatting={true}
        />
      )}

      {/* Custom Filter Modal */}
      {filterModalOpen && activeFilterCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200 p-8">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Hisoblash Sozlamalari</h3>
                <button onClick={() => setFilterModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
             </div>
             
             <div className="space-y-4">
                {[
                  { id: 'xarajat', label: "Xarajatlarni hisoblash" },
                  { id: 'click', label: "Click ni hisoblash" },
                  { id: 'terminal', label: "Terminallarni hisoblash" }
                ].map((item) => {
                  const currentFilters = allExpenseFilters[activeFilterCategory] || { xarajat: true, click: false, terminal: false };
                  const isActive = currentFilters[item.id];
                  return (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl cursor-pointer" onClick={() => handleFilterToggle(item.id as any)}>
                       <span className="font-bold text-slate-700 dark:text-white text-sm">{item.label}</span>
                       <div className={`w-12 h-6 rounded-full p-1 flex items-center transition-all ${isActive ? 'bg-green-500 justify-end' : 'bg-slate-300 dark:bg-zinc-600 justify-start'}`}>
                          <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
                       </div>
                    </div>
                  )
                })}
             </div>
             
             <div className="mt-8">
               <button onClick={() => setFilterModalOpen(false)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform">Saqlash</button>
             </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editTransModalOpen && editingTransaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200 p-8">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Tahrirlash</h3>
                 <button onClick={() => setEditTransModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleSaveEditedTransaction} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Summa</label>
                    <input 
                      type="text" 
                      value={editAmountVal} 
                      onChange={(e) => setEditAmountVal(formatAmount(e.target.value))}
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none font-black text-lg dark:text-white focus:ring-2 focus:ring-slate-900/5 transition-all"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Tavsif</label>
                    <input 
                      type="text" 
                      value={editDescVal} 
                      onChange={(e) => setEditDescVal(e.target.value)}
                      placeholder="Tavsif..."
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none font-medium dark:text-white focus:ring-2 focus:ring-slate-900/5 transition-all"
                    />
                 </div>
                 <button type="submit" className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-black rounded-2xl mt-4">Saqlash</button>
              </form>
           </div>
        </div>
      )}

      {/* Active Shift Header */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
         <div>
             <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{activeShift.name}</h2>
             <p className="text-slate-400 font-bold text-xs uppercase mt-1 flex items-center gap-2">
                <Clock size={12} /> Boshlangan vaqt: {new Date(activeShift.start_date).toLocaleString('en-GB', { hour12: false })}
             </p>
         </div>
         <div className="flex items-center gap-2">
            <button 
                onClick={handleEditShiftName}
                className="p-3 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                title="Nomni tahrirlash"
            >
                <Edit2 size={18} />
            </button>
            <button 
                onClick={handleDeleteActiveShift}
                className="p-3 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl hover:bg-red-50 hover:text-red-500 dark:hover:text-red-400 transition-all"
                title="Smenani o'chirish"
            >
                <Trash2 size={18} />
            </button>
            <button 
                onClick={handleCloseActiveShift}
                className="px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-all flex items-center gap-2 shadow-lg dark:shadow-none"
            >
                <LogOut size={16} /> Yopish
            </button>
         </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['Kassa', 'Click', 'Uzcard', 'Humo', 'Xarajat', 'Eksport'].map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'Xarajat' && expenseCategories.length > 0 && !activeSubTab) setActiveSubTab(expenseCategories[0].name); }} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold border text-sm transition-all ${activeTab === tab ? 'bg-slate-900 text-white dark:bg-white dark:text-black border-slate-900 dark:border-white shadow-lg' : 'bg-white dark:bg-zinc-900 text-slate-500 border-slate-100 dark:border-zinc-800 hover:border-slate-300'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'Eksport' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expenseCategories.map(cat => {
            const stats = calculateCatStats(cat.name);
            const now = new Date();
            const shiftDate = activeShift ? new Date(activeShift.start_date) : now;

            return (
              <div key={cat.id} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 overflow-hidden flex flex-col group shadow-sm transition-all hover:shadow-md">
                {/* Visual Summary Card (On Screen) */}
                <div className="p-8 flex flex-col gap-6">
                    <div className="text-center">
                        <h3 className="font-black text-2xl text-slate-900 dark:text-white uppercase tracking-tighter">XPRO KASSA</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{cat.name}</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-dashed border-slate-200 dark:border-zinc-700 pb-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Savdo</span>
                            <span className="font-black text-lg text-slate-900 dark:text-white">{stats.savdo.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-dashed border-slate-200 dark:border-zinc-700 pb-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Xarajat</span>
                            <span className="font-black text-lg text-slate-900 dark:text-white">{stats.catExpenses.toLocaleString()}</span>
                        </div>
                        {stats.filters.click && (
                            <div className="flex justify-between items-center border-b border-dashed border-slate-200 dark:border-zinc-700 pb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click</span>
                                <span className="font-black text-lg text-slate-900 dark:text-white">{stats.clickSum.toLocaleString()}</span>
                            </div>
                        )}
                        {stats.filters.terminal && (
                            <div className="flex justify-between items-center border-b border-dashed border-slate-200 dark:border-zinc-700 pb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terminal</span>
                                <span className="font-black text-lg text-slate-900 dark:text-white">{stats.terminalSum.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="bg-slate-50 dark:bg-zinc-800 p-4 rounded-2xl flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Qolgan Pul</span>
                            <span className="font-black text-xl text-slate-900 dark:text-white">{stats.balance.toLocaleString()} <span className="text-[10px]">so'm</span></span>
                        </div>
                    </div>
                </div>

                {/* HIDDEN RECEIPT LAYOUT FOR IMAGE GENERATION - MATCHING THE SCREENSHOT EXACTLY */}
                {/* Increased Width and Font Sizes for "Katta" look */}
                <div className="fixed -left-[9999px] top-0">
                  <div ref={(el) => { exportRefs.current[cat.name] = el; }} className="w-[550px] bg-white p-12 font-sans text-black flex flex-col items-stretch border-2 border-gray-100">
                     {/* Header */}
                     <h1 className="text-center font-black text-5xl uppercase mb-4 tracking-tight">XPRO</h1>
                     
                     {/* Date Time Row - NO EMOJIS, 24H */}
                     <div className="flex justify-center gap-8 text-sm font-black text-black mb-4">
                        <span>{now.toLocaleDateString()}</span>
                        <span>{now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}</span>
                     </div>
                     
                     {/* Smena Line */}
                     <div className="border-t-4 border-b-4 border-black py-3 text-center text-xs font-black uppercase mb-10">
                        SMENA - {shiftDate.toLocaleDateString()} {shiftDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                     </div>
                     
                     {/* Financial Rows - LARGER TEXT */}
                     <div className="space-y-6 mb-8">
                        <div className="flex justify-between items-end">
                           <span className="text-lg font-black uppercase tracking-widest">NOMI</span>
                           <span className="text-3xl font-black text-right">{cat.name}</span>
                        </div>
                        
                        <div className="flex justify-between items-end">
                           <span className="text-lg font-black uppercase tracking-widest">SAVDO</span>
                           <span className="text-3xl font-black">{stats.savdo.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-end">
                           <span className="text-lg font-black uppercase tracking-widest">XARAJAT</span>
                           <span className="text-3xl font-black">{stats.catExpenses.toLocaleString()}</span>
                        </div>

                        {stats.filters.click && (
                            <div className="flex justify-between items-end">
                                <span className="text-lg font-black uppercase tracking-widest">CLICK</span>
                                <span className="text-3xl font-black">{stats.clickSum.toLocaleString()}</span>
                            </div>
                        )}

                        {stats.filters.terminal && (
                            <div className="flex justify-between items-end">
                                <span className="text-lg font-black uppercase tracking-widest">TERMINAL</span>
                                <span className="text-3xl font-black">{stats.terminalSum.toLocaleString()}</span>
                            </div>
                        )}
                     </div>
                     
                     {/* Dashed Divider */}
                     <div className="border-t-2 border-dashed border-gray-900 my-6"></div>
                     
                     {/* Result Box */}
                     <div className="border-4 border-black rounded-[2rem] bg-slate-50 p-8 flex justify-between items-center my-6 shadow-sm">
                        <span className="text-sm font-black uppercase w-24 leading-tight">QOLGAN PUL</span>
                        <span className="text-4xl font-black">{stats.balance.toLocaleString()} <span className="text-xl">so'm</span></span>
                     </div>
                     
                     {/* List Header */}
                     <div className="mt-8 mb-6">
                        <span className="border-b-4 border-black text-lg font-black uppercase pb-1">XARAJATLAR RO'YXATI:</span>
                     </div>
                     
                     {/* List Items */}
                     <div className="space-y-4 mb-10">
                       {stats.transactions.length > 0 ? stats.transactions.map(t => (
                         <div key={t.id} className="flex justify-between items-center border-4 border-black rounded-[1.5rem] p-5 mb-4 bg-white">
                           <span className="text-2xl font-black uppercase tracking-tight">{t.description || 'Xarajat'}</span>
                           <span className="text-3xl font-black">{t.amount.toLocaleString()}</span>
                         </div>
                       )) : (
                         <div className="text-center italic text-sm py-4">Xarajatlar mavjud emas</div>
                       )}
                     </div>
                     
                     {/* Footer */}
                     <div className="border-t-4 border-black pt-6 text-center">
                        <span className="text-xs font-black uppercase tracking-[0.3em]">XPRO MANAGEMENT SYSTEM</span>
                     </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 flex gap-3 border-t border-slate-100 dark:border-zinc-800 mt-auto">
                    <button onClick={() => handlePrint(cat.name)} className="flex-1 py-4 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-2xl text-slate-900 dark:text-white text-xs font-black uppercase hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
                      <Printer size={16} /> Chop etish
                    </button>
                    <button 
                      onClick={() => handleDownloadImage(cat.name)} 
                      disabled={exportingId !== null} 
                      className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl text-xs font-black uppercase hover:bg-black dark:hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
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
          {activeTab === 'Kassa' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Kassa Summasi" val={manualKassaSum} icon={<ArrowUpRight />} color="green" onClick={handleKassaSumClick} />
              <StatCard label="Umumiy Chiqim" val={totalExpenses} icon={<ArrowDownRight />} color="red" />
              <StatCard label="Balans" val={manualKassaSum - totalExpenses} icon={<Calculator />} color="indigo" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
               {activeTab !== 'Xarajat' && (
                 <StatCard 
                   label={`${activeTab} bo'yicha jami summa`} 
                   val={currentTabTotal} 
                   icon={activeTab === 'Xarajat' ? <TrendingDown /> : <ArrowUpRight />} 
                   color={activeTab === 'Xarajat' ? 'red' : 'green'} 
                 />
               )}
            </div>
          )}

          {activeTab === 'Xarajat' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {expenseCategories.map((cat, index) => (
                <div 
                  id={`cat-btn-${cat.id}`}
                  key={cat.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`group relative h-14 rounded-xl border flex items-center justify-center p-2 cursor-pointer transition-all ${activeSubTab === cat.name ? 'bg-slate-900 text-white dark:bg-white dark:text-black border-slate-900 dark:border-white shadow-lg' : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 hover:border-slate-300'}`} 
                  onClick={() => setActiveSubTab(cat.name)}
                >
                  <span className="font-bold text-[12px]">{cat.name}</span>
                  
                  {/* Action Buttons */}
                  <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                     <button 
                       onClick={(e) => handleEditCategory(e, cat)}
                       className="w-6 h-6 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 flex items-center justify-center hover:text-indigo-600 shadow-sm"
                     >
                       <Edit2 size={10} />
                     </button>
                     <button 
                       onClick={(e) => handleDeleteCategory(e, cat.id, cat.name)}
                       className="w-6 h-6 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 flex items-center justify-center hover:text-red-500 shadow-sm"
                     >
                       <Trash2 size={10} />
                     </button>
                  </div>
                </div>
              ))}
              <button onClick={handleAddCategory} className="h-14 rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white"><Plus size={20} /></button>
            </div>
          )}

          {activeTab === 'Xarajat' && activeSubTab && (
            (() => {
                 const stats = calculateCatStats(activeSubTab);
                 return (
                   <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="grid grid-cols-1">
                          <StatCard 
                             label={`${activeSubTab} bo'yicha jami xarajat`} 
                             val={stats.catExpenses} 
                             icon={<Wallet />} 
                             color="red" 
                          />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <StatCard 
                            label="Savdo" 
                            val={stats.savdo} 
                            icon={<Coins />} 
                            color="green" 
                            onClick={() => handleSavdoClick(activeSubTab)}
                         />
                         <StatCard 
                            label="Hisoblangan Chiqim" 
                            val={stats.totalDeduction} 
                            icon={<Settings2 />} 
                            color="amber" 
                            onClick={() => { setActiveFilterCategory(activeSubTab); setFilterModalOpen(true); }}
                         />
                         <StatCard 
                            label="Sof Foyda" 
                            val={stats.balance} 
                            icon={<TrendingUp />} 
                            color="indigo" 
                         />
                      </div>
                   </div>
                 )
            })()
          )}
          
          {activeTab !== 'Kassa' && (
            <form onSubmit={handleSaveTransaction} className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="text" value={amountInput} onChange={(e) => setAmountInput(formatAmount(e.target.value))} placeholder="Summa (0)" className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none font-black text-lg dark:text-white focus:ring-2 focus:ring-slate-900/5 transition-all" /><input type="text" value={descInput} onChange={(e) => setDescInput(e.target.value)} placeholder="Tavsif (ixtiyoriy)" className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none font-medium dark:text-white focus:ring-2 focus:ring-slate-900/5 transition-all" /></div>
              <button type="submit" disabled={isSaving} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-black rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-black dark:hover:bg-slate-100 shadow-lg active:scale-95 disabled:opacity-50">{isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Saqlash</button>
            </form>
          )}

          {/* Transaction History Section */}
          {activeTab !== 'Kassa' && (
            <div className="space-y-4 animate-in fade-in duration-500 delay-150">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <List size={14} /> So'nggi operatsiyalar
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">{filteredTransactions.length} ta</span>
               </div>
               
               <div className="space-y-2.5">
                  {filteredTransactions.map((t) => (
                    <div id={`trans-item-${t.id}`} key={t.id} className="group bg-white dark:bg-zinc-900 p-4 rounded-[1.5rem] border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between hover:border-slate-300 dark:hover:border-zinc-600 transition-all">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'kirim' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>
                             {t.type === 'kirim' ? <Plus size={18} /> : <TrendingDown size={18} />}
                          </div>
                          <div>
                             <p className="font-bold text-slate-800 dark:text-white text-[13px]">{t.description || 'Tavsifsiz operatsiya'}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.sub_category || t.category}</span>
                                <span className="text-[9px] text-slate-300">•</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-2">
                          <p className={`font-black text-sm mr-2 ${t.type === 'kirim' ? 'text-green-600' : 'text-red-500'}`}>
                             {t.type === 'kirim' ? '+' : '-'}{(t.amount || 0).toLocaleString()}
                          </p>
                          <button
                            onClick={() => handleAddAmountClick(t)}
                            className="p-2 text-slate-300 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Summa qo'shish"
                          >
                            <Plus size={16} />
                          </button>
                          <button 
                            onClick={() => handleEditTransactionClick(t)}
                            className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Tahrirlash"
                          >
                             <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="O'chirish"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-300 dark:text-zinc-700 bg-slate-50/50 dark:bg-zinc-900/30 rounded-[2rem] border border-dashed border-slate-200 dark:border-zinc-800">
                       <List size={32} className="mb-2 opacity-20" />
                       <p className="text-xs font-bold uppercase tracking-widest">Hozircha ma'lumot yo'q</p>
                    </div>
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
