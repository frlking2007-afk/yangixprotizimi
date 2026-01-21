
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Search, 
  Trash2, 
  BrainCircuit, 
  Wallet, 
  CreditCard, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  Banknote,
  X
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { getTransactions, saveTransaction, deleteTransaction } from '../services/supabase';
import { getFinancialInsights } from '../services/gemini';

const XPro: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'Boshqa',
    type: 'kirim' as TransactionType
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

  const handleAiAnalyze = async () => {
    setAiInsight("Tahlil qilinmoqda...");
    const insight = await getFinancialInsights(transactions);
    setAiInsight(insight);
  };

  const openActionModal = (type: TransactionType, category: string) => {
    setFormData({
      amount: '',
      description: '',
      category: category,
      type: type
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    await saveTransaction({
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category,
      type: formData.type
    });

    setFormData({ amount: '', description: '', category: 'Boshqa', type: 'kirim' });
    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Ushbu amallni o'chirmoqchimisiz?")) {
      await deleteTransaction(id);
      fetchData();
    }
  };

  const handleExport = () => {
    alert("Ma'lumotlar Excel formatida yuklab olinmoqda...");
    // Bu yerda real eksport logikasi bo'ladi
  };

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = transactions.reduce((acc, curr) => {
    if (curr.type === 'kirim') acc.in += curr.amount;
    else acc.out += curr.amount;
    return acc;
  }, { in: 0, out: 0 });

  return (
    <div className="space-y-6">
      {/* Quick Action Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <button 
          onClick={() => openActionModal('kirim', 'Naqd')}
          className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-green-200 hover:bg-green-50 transition-all group"
        >
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Banknote size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700">Kassa</span>
        </button>

        <button 
          onClick={() => openActionModal('kirim', 'Click')}
          className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 hover:bg-blue-50 transition-all group"
        >
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <CreditCard size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700">Click</span>
        </button>

        <button 
          onClick={() => openActionModal('kirim', 'Uzcard')}
          className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-cyan-200 hover:bg-cyan-50 transition-all group"
        >
          <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Wallet size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700">Uzcard</span>
        </button>

        <button 
          onClick={() => openActionModal('kirim', 'Humo')}
          className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-orange-200 hover:bg-orange-50 transition-all group"
        >
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <CreditCard size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700">Humo</span>
        </button>

        <button 
          onClick={() => openActionModal('chiqim', 'Xarajat')}
          className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-red-200 hover:bg-red-50 transition-all group"
        >
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <TrendingDown size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700">Xarajat</span>
        </button>

        <button 
          onClick={handleExport}
          className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
        >
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Download size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700">Eksport</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Jami Kirim</p>
            <h3 className="text-2xl font-bold text-green-600">+{stats.in.toLocaleString()} so'm</h3>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
            <ArrowUpRight size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Jami Chiqim</p>
            <h3 className="text-2xl font-bold text-red-600">-{stats.out.toLocaleString()} so'm</h3>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
            <ArrowDownRight size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Sof Balans</p>
            <h3 className={`text-2xl font-bold ${(stats.in - stats.out) >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
              {(stats.in - stats.out).toLocaleString()} so'm
            </h3>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Wallet size={24} />
          </div>
        </div>
      </div>

      {/* AI Insights Card */}
      <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <BrainCircuit size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="text-indigo-300" size={20} />
              <h4 className="text-lg font-bold">XisoBot AI Maslahatchi</h4>
            </div>
            <p className="text-indigo-100 text-sm max-w-2xl">
              {aiInsight || "Mablag'laringizni aqlli tahlil qilish uchun quyidagi tugmani bosing."}
            </p>
          </div>
          <button 
            onClick={handleAiAnalyze}
            className="px-6 py-2.5 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors whitespace-nowrap"
          >
            Tahlil qilish
          </button>
        </div>
      </div>

      {/* Search area */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Qidiruv..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4">Tavsif</th>
              <th className="px-6 py-4">Kategoriya</th>
              <th className="px-6 py-4">Sana</th>
              <th className="px-6 py-4 text-right">Summa</th>
              <th className="px-6 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-800">{t.description}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    t.category === 'Naqd' ? 'bg-green-100 text-green-700' :
                    t.category === 'Click' ? 'bg-blue-100 text-blue-700' :
                    t.category === 'Uzcard' ? 'bg-cyan-100 text-cyan-700' :
                    t.category === 'Humo' ? 'bg-orange-100 text-orange-700' :
                    t.category === 'Xarajat' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {t.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm">
                  {new Date(t.date).toLocaleDateString('uz-UZ')}
                </td>
                <td className={`px-6 py-4 text-right font-bold ${t.type === 'kirim' ? 'text-green-600' : 'text-red-500'}`}>
                  {t.type === 'kirim' ? '+' : '-'}{t.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleDelete(t.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <Clock className="mx-auto mb-2 opacity-20" size={48} />
                  Hech qanday ma'lumot topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Action Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">
                {formData.type === 'kirim' ? `${formData.category} - Kirim` : 'Xarajat - Chiqim'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Summa</label>
                <div className="relative">
                  <input 
                    type="number" 
                    autoFocus
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold"
                    placeholder="0.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-slate-400">so'm</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tavsif</label>
                <input 
                  type="text" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder={formData.type === 'kirim' ? "Kirim sababi..." : "Xarajat sababi..."}
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className={`w-full py-3 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 ${
                    formData.type === 'kirim' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Amalni tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default XPro;
