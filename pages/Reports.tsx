
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { getTransactions } from '../services/supabase';
import { Transaction } from '../types';

const Reports: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    getTransactions().then(setTransactions);
  }, []);

  // Process data for charts
  const categoryData = transactions.reduce((acc: any[], curr) => {
    const existing = acc.find(a => a.name === curr.category);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.category, value: curr.amount, type: curr.type });
    }
    return acc;
  }, []);

  const kirimCategories = categoryData.filter(c => c.type === 'kirim');
  const chiqimCategories = categoryData.filter(c => c.type === 'chiqim');

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Chiqimlar Kategoriya Bo'yicha</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chiqimCategories}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chiqimCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart for Kirim/Chiqim ratio */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Mablag'lar Ta'qsimoti</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Kirim', value: transactions.filter(t => t.type === 'kirim').reduce((s, c) => s + c.amount, 0) },
                    { name: 'Chiqim', value: transactions.filter(t => t.type === 'chiqim').reduce((s, c) => s + c.amount, 0) }
                  ]}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-600 font-medium">Kirim</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-slate-600 font-medium">Chiqim</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Trends (Simplified) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
         <h3 className="text-lg font-bold text-slate-800 mb-6">Oxirgi tranzaksiyalar oqimi</h3>
         <div className="space-y-4">
           {transactions.slice(0, 5).map(t => (
             <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
               <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'kirim' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                   {t.type === 'kirim' ? '↑' : '↓'}
                 </div>
                 <div>
                   <p className="font-bold text-slate-800">{t.description}</p>
                   <p className="text-xs text-slate-500">{new Date(t.date).toLocaleString()}</p>
                 </div>
               </div>
               <p className={`font-bold ${t.type === 'kirim' ? 'text-green-600' : 'text-red-500'}`}>
                 {t.type === 'kirim' ? '+' : '-'}{t.amount.toLocaleString()} so'm
               </p>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};

export default Reports;
