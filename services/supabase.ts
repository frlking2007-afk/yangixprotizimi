
import { createClient } from '@supabase/supabase-js';
import { Transaction, Shift, ExpenseCategory } from '../types';

const SUPABASE_URL = 'https://zvaxhyszcdvnylcljgxz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2YXhoeXN6Y2R2bnlsY2xqZ3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5OTQwNjUsImV4cCI6MjA4NDU3MDA2NX0.rBsMCwKE6x_vsEAeu4ALz7oJd_vl47VQt8URTxvQ5go';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// SETTINGS (Password Management)
export const getDeletionPassword = async (): Promise<string> => {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'deletion_password')
    .single();
  
  if (error || !data) return '1234'; // Default password if not found
  return data.value;
};

export const setDeletionPassword = async (newPassword: string): Promise<void> => {
  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'deletion_password', value: newPassword });
  if (error) throw error;
};

// EXPENSE CATEGORIES
export const getExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  try {
    const { data, error } = await supabase.from('expense_categories').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Categories fetch error:", err);
    return [];
  }
};

export const createExpenseCategory = async (name: string): Promise<ExpenseCategory | null> => {
  const { data, error } = await supabase.from('expense_categories').insert([{ name }]).select().single();
  if (error) throw error;
  return data;
};

export const updateExpenseCategory = async (id: string, name: string): Promise<void> => {
  const { error } = await supabase.from('expense_categories').update({ name }).eq('id', id);
  if (error) throw error;
};

export const deleteExpenseCategory = async (id: string): Promise<void> => {
  const { error } = await supabase.from('expense_categories').delete().eq('id', id);
  if (error) throw error;
};

// SHIFT FUNCTIONS
export const getActiveShift = async (): Promise<Shift | null> => {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('status', 'active')
      .maybeSingle();
    
    if (error) return null;
    return data as Shift;
  } catch (err) {
    return null;
  }
};

export const startNewShift = async (): Promise<Shift | null> => {
  const now = new Date();
  const name = `Smena - ${now.toLocaleDateString('uz-UZ')} ${now.toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'})}`;
  
  const { data, error } = await supabase
    .from('shifts')
    .insert([{ name, status: 'active' }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Shift;
};

export const closeShift = async (shiftId: string): Promise<void> => {
  const { error } = await supabase
    .from('shifts')
    .update({ status: 'closed', end_date: new Date().toISOString() })
    .eq('id', shiftId);
  if (error) throw error;
};

export const getAllShifts = async (): Promise<Shift[]> => {
  try {
    const { data } = await supabase.from('shifts').select('*').order('start_date', { ascending: false });
    return data || [];
  } catch {
    return [];
  }
};

// TRANSACTION FUNCTIONS
export const getTransactionsByShift = async (shiftId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('shift_id', shiftId)
    .order('date', { ascending: false });
  if (error) {
    console.error("Transactions fetch error:", error);
    return [];
  }
  return data || [];
};

export const saveTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>): Promise<Transaction | null> => {
  if (!transaction.shift_id) {
    throw new Error("Smena aniqlanmadi.");
  }

  const cleanTransaction = {
    shift_id: transaction.shift_id,
    amount: transaction.amount,
    category: transaction.category,
    description: transaction.description || "",
    type: transaction.type,
    sub_category: transaction.sub_category || null
  };

  const { data, error } = await supabase
    .from('transactions')
    .insert([cleanTransaction])
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false });
  return data || [];
};
