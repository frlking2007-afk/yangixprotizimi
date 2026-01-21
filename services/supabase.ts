
import { createClient } from '@supabase/supabase-js';
import { Transaction } from '../types';

const SUPABASE_URL = 'https://zvaxhyszcdvnylcljgxz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2YXhoeXN6Y2R2bnlsY2xqZ3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5OTQwNjUsImV4cCI6MjA4NDU3MDA2NX0.rBsMCwKE6x_vsEAeu4ALz7oJd_vl47VQt8URTxvQ5go';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Supabase xatoligi (Olish):', error.message);
      return [];
    }

    return data as Transaction[];
  } catch (err) {
    console.error('Tarmoq xatoligi:', err);
    return [];
  }
};

export const saveTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>): Promise<Transaction | null> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          type: transaction.type,
          date: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      alert("Xatolik: Jadval yaratilmagan bo'lishi mumkin. Supabase-da 'transactions' jadvali mavjudligini tekshiring.");
      console.error('Supabase xatoligi (Saqlash):', error.message);
      return null;
    }

    return data as Transaction;
  } catch (err) {
    console.error('Insert error:', err);
    return null;
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      // Fix: Use double quotes to correctly handle the single quote in (O'chirish)
      console.error("Supabase xatoligi (O'chirish):", error.message);
    }
  } catch (err) {
    console.error('Delete error:', err);
  }
};
