
import { createClient } from '@supabase/supabase-js';
import { Transaction, Shift, ExpenseCategory } from '../types';

const SUPABASE_URL = 'https://zvaxhyszcdvnylcljgxz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2YXhoeXN6Y2R2bnlsY2xqZ3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5OTQwNjUsImV4cCI6MjA4NDU3MDA2NX0.rBsMCwKE6x_vsEAeu4ALz7oJd_vl47VQt8URTxvQ5go';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to get current user ID
const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// SETTINGS (Password Management)
export const getDeletionPassword = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'deletion_password')
      .maybeSingle();
    
    if (error) throw error;
    return data?.value || '1234';
  } catch (err) {
    console.warn("Parol o'qishda xatolik, standart 1234 ishlatiladi");
    return '1234';
  }
};

export const setDeletionPassword = async (newPassword: string): Promise<void> => {
  const user = await getUser();
  
  try {
    // Eng sodda upsert: faqat kerakli ustunlar
    const { error } = await supabase
      .from('settings')
      .upsert({ 
        key: 'deletion_password', 
        value: newPassword,
        user_id: user?.id
      }, { onConflict: 'key' });

    if (error) throw error;
  } catch (err: any) {
    console.error("Settings update error:", err);
    throw new Error(err.message || "Parolni saqlashda xatolik yuz berdi");
  }
};

// EXPENSE CATEGORIES
export const getExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  try {
    const user = await getUser();
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('user_id', user?.id || '')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Categories fetch error:", err);
    return [];
  }
};

export const createExpenseCategory = async (name: string): Promise<ExpenseCategory | null> => {
  const user = await getUser();
  try {
    const { data, error } = await supabase
      .from('expense_categories')
      .insert([{ name, user_id: user?.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Category create error:", err);
    return null;
  }
};

export const updateExpenseCategory = async (id: string, name: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('expense_categories')
      .update({ name })
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error("Category update error:", err);
  }
};

export const deleteExpenseCategory = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error("Category delete error:", err);
  }
};

// SHIFT FUNCTIONS
export const getActiveShift = async (): Promise<Shift | null> => {
  try {
    const user = await getUser();
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('status', 'active')
      .eq('user_id', user?.id || '')
      .maybeSingle();
    
    if (error) throw error;
    return data as Shift;
  } catch (err) {
    return null;
  }
};

export const startNewShift = async (): Promise<Shift | null> => {
  const user = await getUser();
  const now = new Date();
  const name = `Smena - ${now.toLocaleDateString('uz-UZ')} ${now.toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'})}`;
  
  try {
    const { data, error } = await supabase
      .from('shifts')
      .insert([{ name, status: 'active', user_id: user?.id }])
      .select()
      .single();

    if (error) throw error;
    return data as Shift;
  } catch (err) {
    console.error("Start shift error:", err);
    throw err;
  }
};

export const closeShift = async (shiftId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('shifts')
      .update({ status: 'closed', end_date: new Date().toISOString() })
      .eq('id', shiftId);
    if (error) throw error;
  } catch (err) {
    console.error("Close shift error:", err);
  }
};

export const getAllShifts = async (): Promise<Shift[]> => {
  try {
    const user = await getUser();
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', user?.id || '')
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
};

export const deleteShift = async (shiftId: string): Promise<void> => {
  try {
    const { error } = await supabase.from('shifts').delete().eq('id', shiftId);
    if (error) throw error;
  } catch (err) {
    console.error("Delete shift error:", err);
  }
};

// TRANSACTION FUNCTIONS
export const getTransactionsByShift = async (shiftId: string): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('shift_id', shiftId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
};

export const saveTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>): Promise<Transaction | null> => {
  const user = await getUser();
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...transaction, user_id: user?.id }])
      .select()
      .single();
    if (error) throw error;
    return data as Transaction;
  } catch (err) {
    console.error("Save transaction error:", err);
    throw err;
  }
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<void> => {
  try {
    const { error } = await supabase.from('transactions').update(updates).eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error("Update transaction error:", err);
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error("Delete transaction error:", err);
  }
};

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const user = await getUser();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user?.id || '')
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
};
