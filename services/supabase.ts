
// Bu yerda Supabase ulanishi uchun tayyor struktura
// Real loyihada: import { createClient } from '@supabase/supabase-js'
// Hozircha lokal storage orqali simulyatsiya qilamiz

import { Transaction } from '../types';

const STORAGE_KEY = 'xisobot_transactions';

export const getTransactions = async (): Promise<Transaction[]> => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>): Promise<Transaction> => {
  const transactions = await getTransactions();
  const newTransaction: Transaction = {
    ...transaction,
    id: Math.random().toString(36).substr(2, 9),
    date: new Date().toISOString()
  };
  const updated = [newTransaction, ...transactions];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newTransaction;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const transactions = await getTransactions();
  const updated = transactions.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
