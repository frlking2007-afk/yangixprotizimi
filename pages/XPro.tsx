
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2,
  Wallet, 
  CreditCard, 
  Download, 
  Banknote,
  TrendingDown,
  Save,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { getTransactions, saveTransaction, deleteTransaction } from '../services/supabase';

const XPro: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('Kassa');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
  });

  const fetchData = async () => {
    setLoading(true);
    const data = await getTransactions();
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    const type: TransactionType = activeCategory === 'Xarajat' ? 'chiqim' : 'kirim';
    
    // Note: Edit functionality would normally require a specific update service
    // For now, we follow the save pattern
    await saveTransaction({
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: activeCategory,
      type: type
    });

    setFormData({ amount: '', description: '' });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Ushbu amallni o'chirmoqchimisiz?")) {
      await deleteTransaction(id);
      fetchData();
    }
  };

  const handleExport = () => {
    alert("Barcha ma'lumotlar Excel formatida tayyorlanmoqda...");
  };

  // Filter logic: Only show transactions for the active category
  const filteredTransactions = transactions.filter(t => t.category === activeCategory);

  const categories = [
    { name: 'Kassa', icon: Banknote, color: 'green' },
    { name: 'Click', icon: CreditCard, color: 'blue' },
    { name: 'Uzcard', icon: Wallet, color: 'cyan' },
    { name: 'Humo', icon: CreditCard, color: 'orange' },
    { name: 'Xarajat', icon: TrendingDown, color: 'red' },
    { name: 'Eksport', icon: Download, color: 'indigo' },
  ];

  if (activeCategory === 'Eksport') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm border ${
                activeCategory === cat.name 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
              }`}
            >
              <cat.icon size={20} />
              {cat.name}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Download size={40} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Hisobotlarni yuklash</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Barcha tranzaksiyalarni Excel yoki PDF formatida yuklab olishingiz mumkin.</p>
          <button 
            onClick={handleExport}
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Excelga eksport qilish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Category Navigation */}
      <div className="flex flex-wrap gap-3">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm border ${
              activeCategory === cat.name 
              ? 'bg-slate-900 text-white border-slate-900' 
              : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
            }`}
          >
            <cat.icon size={20} />
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Form */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm sticky top-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 rounded-xl text-slate-800">
                <Plus size={20} />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Yangi {activeCategory} amali</h3>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Summa</label>
                <div className="relative">
                  <input 
                    type="number" 
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold text-lg transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-300">so'm</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tavsif</label>
                <textarea 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  placeholder="Izoh yozing..."
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Saqlash
              </button>
            </form>
          </div>
        </div>

        {/* Right: Category History */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-slate-400" />
              <h3 className="font-bold text-slate-800">{activeCategory} tarixi</h3>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">
              {filteredTransactions.length} ta amal
            </span>
          </div>

          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t) => (
                <div 
                  key={t.id} 
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      t.type === 'kirim' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {t.type === 'kirim' ? <Plus size={24} /> : <TrendingDown size={24} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">{t.description}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(t.date).toLocaleDateString('uz-UZ')} · {new Date(t.date).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute: '2-digit'})}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={`font-black text-lg ${t.type === 'kirim' ? 'text-green-600' : 'text-red-500'}`}>
                        {t.type === 'kirim' ? '+' : '-'}{t.amount.toLocaleString()} <span className="text-xs font-normal opacity-70">so'm</span>
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <CheckCircle2 size={12} className="text-green-500" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase">Tasdiqlangan</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => alert('Tahrirlash rejimi ishga tushirilmoqda...')}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={32} />
                </div>
                <p className="text-slate-400 font-medium">Bu kategoriya bo'yicha amallar hali yo'q</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default XPro;
