
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Calendar, Clock, 
  ArrowUpRight, ArrowDownRight, 
  RefreshCcw, ArrowLeft, Wallet, 
  CreditCard, Banknote, TrendingDown,
  Trash2, Download, Printer, Loader2, Save,
  Coins, TrendingUp, Settings2, Calculator, Plus, PlayCircle
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { Shift, Transaction, ExpenseCategory } from '../types.ts';
import { 
  getAllShifts, getTransactionsByShift, deleteShift, 
  getDeletionPassword, getExpenseCategories, getCategoryConfigs,
  reopenShift
} from '../services/supabase.ts';

const StatCard = ({ label, val, icon, color }: { label: string, val: number, icon: React.ReactNode, color: 'green' | 'red' | 'indigo' | 'amber' }) => {
  const colorClasses = {
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600"
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className={`text-2xl font-black ${color === 'red' ? 'text-red-500' : color === 'green' ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
          {(val || 0).toLocaleString()} <span className="text-[10px] text-slate-400">so'm</span>
        </h3>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClasses[color]}`}>
        {icon}
      </div>
    </div>
  );
};

interface ReportsProps {
  onContinueShift?: (shiftId: string) => void;
}

const Reports: React.FC<ReportsProps> = ({ onContinueShift }) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Shift Details
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [manualSavdoSums, setManualSavdoSums] = useState<Record<string, number>>({});
  const [allExpenseFilters, setAllExpenseFilters] = useState<Record<string, any>>({});
  
  // Tabs within details
  const [activeTab, setActiveTab] = useState<string>('Kassa');
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const data = await getAllShifts();
      setShifts(data || []);
    } catch (err) {
      console.error("Fetch shifts error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleSelectShift = async (shift: Shift) => {
    setLoading(true);
    setSelectedShiftId(shift.id);
    setSelectedShift(shift);
    setActiveTab('Kassa');
    
    try {
      const [trans, categories, configs] = await Promise.all([
        getTransactionsByShift(shift.id),
        getExpenseCategories(),
        getCategoryConfigs(shift.id)
      ]);
      
      setTransactions(trans || []);
      setExpenseCategories(categories || []);
      
      const sums: Record<string, number> = {};
      const filters: Record<string, any> = {};
      const defaultFilter = { xarajat: true, click: false, terminal: false };
      
      configs.forEach(cfg => {
        sums[cfg.category_name] = cfg.savdo_sum || 0;
        filters[cfg.category_name] = cfg.filters || defaultFilter;
      });
      
      setManualSavdoSums(sums);
      setAllExpenseFilters(filters);
      
      if (categories && categories.length > 0) setActiveSubTab(categories[0].name);
    } catch (err) {
      console.error("Error fetching shift details:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateCatStats = (catName: string) => {
    const defaultFilter = { xarajat: true, click: false, terminal: false };
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

  const handlePrint = (catName: string) => {
    if (!selectedShift) return;
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
            .list-title { font-size: 14pt; margin: 20px 0 10px 0; font-weight: 900; text-transform: uppercase; }
            
            /* Yangi Xarajat Dizayni */
            .item-box { 
              border: 2px solid black; 
              padding: 10px; 
              margin-bottom: 8px; 
              font-size: 12pt; 
              font-weight: 900; 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-radius: 4px;
            }
            
            .total-row { font-size: 14pt; margin-top: 10px; background: #eee; padding: 10px; border: 2px solid black; font-weight: 900; }
          </style>
        </head>
        <body>
          <div class="center black header">XPRO</div>
          <div class="center bold" style="font-size: 14pt; margin-bottom: 10px;">${now.toLocaleDateString()} ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}</div>
          <div class="center bold" style="margin-bottom: 15px; font-size: 9pt;">${selectedShift.name}</div>
          
          <div class="center black" style="font-size: 22pt; margin: 15px 0; text-transform: uppercase;">${catName}</div>
          
          <div class="divider"></div>
          
          <div class="row"><span class="label">Savdo:</span><span class="black" style="font-size: 12pt;">${stats.savdo.toLocaleString()}</span></div>
          <div class="row"><span class="label">Xarajat:</span><span class="black" style="font-size: 12pt;">${stats.catExpenses.toLocaleString()}</span></div>
          ${stats.filters.click ? `<div class="row"><span class="label">Click:</span><span class="black" style="font-size: 12pt;">${stats.clickSum.toLocaleString()}</span></div>` : ''}
          ${stats.filters.terminal ? `<div class="row"><span class="label">Terminal:</span><span class="black" style="font-size: 12pt;">${stats.terminalSum.toLocaleString()}</span></div>` : ''}
          
          <div class="divider"></div>
          <div class="row black total-row"><span>QOLGAN PUL:</span><span>${stats.balance.toLocaleString()}</span></div>
          
          <div class="divider"></div>
          <div class="black list-title">XARAJATLAR RO'YXATI:</div>
          
          ${stats.transactions.map(t => `
            <div class="item-box">
              <span>${t.description || 'Xarajat'}</span>
              <span>${t.amount.toLocaleString()}</span>
            </div>
          `).join('')}
          
          <div class="center" style="font-size: 10pt; margin-top: 30px; font-weight: 900;">XPRO MANAGEMENT SYSTEM</div>
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
      const dataUrl = await htmlToImage.toPng(el, { cacheBust: true, backgroundColor: '#fff', pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `arxiv-${catName.toLowerCase()}-${selectedShift?.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { alert('Rasm yuklashda xatolik.'); } finally { setExportingId(null); }
  };

  const handleDeleteShift = async (e: React.MouseEvent, shiftId: string) => {
    e.stopPropagation();
    const password = prompt("Smenani o'chirish paroli:");
    if (password === null) return;
    const correctPassword = await getDeletionPassword();
    if (password !== correctPassword) return alert("Parol noto'g'ri!");
    if (confirm("Ushbu smena butunlay o'chirilsinmi?")) {
      await deleteShift(shiftId);
      await fetchShifts();
      setSelectedShiftId(null);
    }
  };

  const handleContinueShiftAction = async () => {
    if (!selectedShift || !onContinueShift) return;

    try {
      // If the shift is closed, reopen it in the database
      if (selectedShift.status === 'closed') {
        await reopenShift(selectedShift.id);
      }
      onContinueShift(selectedShift.id);
    } catch (error) {
      alert("Smenani ochishda xatolik yuz berdi");
    }
  };

  const filteredShifts = shifts.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading && !selectedShiftId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <RefreshCcw className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 font-medium">Smenalar yuklanmoqda...</p>
      </div>
    );
  }

  // --- DETAILED VIEW ---
  if (selectedShiftId && selectedShift) {
    // Base expenses (Click, Uzcard, Humo, Xarajat transactions)
    const baseExpenses = transactions
      .filter(t => ['Click', 'Uzcard', 'Humo', 'Xarajat'].includes(t.category))
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Profit addition logic for archive
    const positiveProfitSum = expenseCategories.reduce((acc, cat) => {
      const stats = calculateCatStats(cat.name);
      return acc + (stats.balance > 0 ? stats.balance : 0);
    }, 0);

    const totalExpensesAcrossTypes = baseExpenses + positiveProfitSum;
    const totalBalance = (selectedShift.manual_kassa_sum || 0) - totalExpensesAcrossTypes;

    const currentCategoryTotal = transactions
      .filter(t => t.category === activeTab)
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const mainTabs = [
      { name: 'Kassa', icon: Banknote }, { name: 'Click', icon: CreditCard }, { name: 'Uzcard', icon: Wallet },
      { name: 'Humo', icon: CreditCard }, { name: 'Xarajat', icon: TrendingDown }, { name: 'Eksport', icon: Download },
    ];

    const filteredTransactions = transactions.filter(t => {
      if (activeTab === 'Xarajat') return t.category === 'Xarajat' && (activeSubTab ? t.sub_category === activeSubTab : true);
      return t.category === activeTab;
    });

    return (
      <div className="space-y-6 animate-in fade-in duration-300 pb-20 no-print">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedShiftId(null)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-600 font-bold rounded-xl shadow-sm">
            <ArrowLeft size={18} /> Orqaga
          </button>
          
          <div className="flex items-center gap-2">
            {onContinueShift && (
              <button 
                onClick={handleContinueShiftAction}
                className="px-4 py-3 bg-green-50 text-green-600 font-bold rounded-2xl hover:bg-green-100 transition-all flex items-center gap-2 text-sm"
              >
                <PlayCircle size={18} /> Davom ettirish
              </button>
            )}
            <button onClick={(e) => handleDeleteShift(e, selectedShift.id)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all">
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-sm">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">{selectedShift.name}</h2>
          <div className="flex flex-wrap gap-4 text-slate-400 text-xs font-bold uppercase mt-2">
            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(selectedShift.start_date).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(selectedShift.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})} - {selectedShift.end_date ? new Date(selectedShift.end_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) : 'Aktiv'}</span>
          </div>
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
                activeTab === tab.name ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-zinc-900 text-slate-500 border-slate-100 dark:border-zinc-800'
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
                <div key={cat.id} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col group">
                  {/* Visual Preview for Image Generation */}
                  <div 
                     ref={(el) => { exportRefs.current[cat.name] = el; }} 
                     className="p-10 bg-white text-slate-900 w-[500px] mx-auto flex flex-col items-stretch"
                     style={{ minHeight: 'auto' }}
                  >
                     <div className="text-center mb-10">
                        <h4 className="font-black text-3xl tracking-tighter text-black uppercase mb-2">XPRO</h4>
                        <div className="flex flex-col items-center justify-center gap-1 text-[12px] text-black font-black uppercase tracking-widest">
                          <div className="border-t border-black pt-1 px-4">{selectedShift.name}</div>
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
                     
                     <div className="mt-auto pt-10 text-center">
                        <p className="text-[10px] font-black text-black uppercase tracking-[0.3em] border-t border-black pt-4">XPRO MANAGEMENT SYSTEM</p>
                     </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 flex gap-3 border-t border-slate-100 dark:border-zinc-800 mt-auto">
                    <button onClick={() => handlePrint(cat.name)} className="flex-1 py-4 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-2xl flex items-center justify-center gap-2 text-xs font-black hover:bg-slate-100 transition-all"><Printer size={16} /> Chop etish</button>
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
            {/* Category Total for archived shift */}
            {['Click', 'Uzcard', 'Humo', 'Xarajat'].includes(activeTab) && (
              <div className="grid grid-cols-1 gap-4">
                <StatCard 
                  label={`Arxiv ${activeTab} Umumiy Summasi`} 
                  val={currentCategoryTotal} 
                  icon={activeTab === 'Xarajat' ? <TrendingDown /> : <ArrowUpRight />} 
                  color={activeTab === 'Xarajat' ? 'red' : 'green'} 
                />
              </div>
            )}

            {activeTab === 'Xarajat' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {expenseCategories.map(cat => (
                  <div key={cat.id} className={`h-12 rounded-xl border transition-all cursor-pointer flex items-center justify-center p-2 ${activeSubTab === cat.name ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-zinc-900 text-slate-600 border-slate-100 dark:border-zinc-800'}`} onClick={() => setActiveSubTab(cat.name)}>
                    <span className="font-bold text-center text-[12px]">{cat.name}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Kassa' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Arxiv Kassa Summasi" val={selectedShift.manual_kassa_sum || 0} icon={<ArrowUpRight />} color="green" />
                <StatCard label="Umumiy Chiqim" val={totalExpensesAcrossTypes} icon={<ArrowDownRight />} color="red" />
                <StatCard label="Yakuniy Balans" val={totalBalance} icon={<Calculator />} color="indigo" />
              </div>
            )}

            {activeTab === 'Xarajat' && activeSubTab && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                  const stats = calculateCatStats(activeSubTab);
                  return (
                    <>
                      <StatCard label="Savdo" val={stats.savdo} icon={<Coins />} color="green" />
                      <StatCard label="Hisoblangan Chiqim" val={stats.totalDeduction} icon={<Settings2 />} color="red" />
                      <StatCard label="Sof Foyda" val={stats.balance} icon={<TrendingUp />} color="indigo" />
                    </>
                  );
                })()}
              </div>
            )}

            {activeTab !== 'Kassa' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase px-2">Amallar ({filteredTransactions.length})</h3>
                <div className="space-y-2.5">
                  {filteredTransactions.map((t) => (
                    <div key={t.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'kirim' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{t.type === 'kirim' ? <Plus size={18} /> : <TrendingDown size={18} />}</div>
                        <div><p className="font-bold text-slate-800 dark:text-white text-[13px]">{t.description || 'Tavsifsiz'}</p><p className="text-[10px] text-slate-400 uppercase font-bold">{t.sub_category || t.category}</p></div>
                      </div>
                      <p className={`font-black text-sm ${t.type === 'kirim' ? 'text-green-600' : 'text-red-500'}`}>{(t.amount || 0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Smena nomini qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none shadow-sm font-medium"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredShifts.map((shift) => {
          const trans = transactions.filter(t => t.shift_id === shift.id);
          const totalOut = trans.filter(t => t.type === 'chiqim').reduce((acc, t) => acc + (t.amount || 0), 0);
          const balance = (shift.manual_kassa_sum || 0) - totalOut;

          return (
            <div 
              key={shift.id}
              onClick={() => handleSelectShift(shift)}
              className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
            >
              <div>
                <h4 className="font-black text-lg group-hover:text-indigo-600 transition-colors">{shift.name}</h4>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">{new Date(shift.start_date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-indigo-600 text-lg">{balance.toLocaleString()} so'm</p>
                <p className={`text-[10px] font-black uppercase tracking-widest ${shift.status === 'active' ? 'text-green-500' : 'text-slate-300'}`}>{shift.status}</p>
              </div>
            </div>
          );
        })}
        {filteredShifts.length === 0 && (
          <div className="text-center py-20 text-slate-400 italic">Smenalar topilmadi</div>
        )}
      </div>
    </div>
  );
};

export default Reports;
