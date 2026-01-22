
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

// Error handler helper
const handleDbError = (error: any, context: string) => {
  console.error(`${context}:`, error);
  // Code 42703 is "undefined_column" in Postgres
  if (error?.code === '42703') {
    console.warn("Database schema missing 'user_id' column. Please run the migration SQL.");
    // Optional: Alert the user once per session or just log
    if (!window.sessionStorage.getItem('db_alert_shown')) {
      alert("Diqqat: Ma'lumotlar bazasi yangilanmagan (user_id ustuni yetishmayapti). Iltimos, Supabase SQL muharririda kerakli o'zgartirishlarni kiriting.");
      window.sessionStorage.setItem('db_alert_shown', 'true');
    }
  }
  throw error;
};

// SETTINGS (Password Management)
export const getDeletionPassword = async (): Promise<string> => {
  const user = await getUser();
  if (!user) return '1234';

  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'deletion_password')
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (error) {
    // If table doesn't have user_id yet, fallback gracefully for reading
    if (error.code === '42703') return '1234'; 
    return '1234';
  }
  return data?.value || '1234';
};

export const setDeletionPassword = async (newPassword: string): Promise<void> => {
  const user = await getUser();
  if (!user) throw new Error("Foydalanuvchi aniqlanmadi");

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('settings')
      .select('id')
      .eq('key', 'deletion_password')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      const { error } = await supabase
        .from('settings')
        .update({ value: newPassword })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('settings')
        .insert({ 
          key: 'deletion_password', 
          value: newPassword,
          user_id: user.id
        });
      if (error) throw error;
    }
  } catch (err) {
    handleDbError(err, "Settings update error");
  }
};

// EXPENSE CATEGORIES
export const getExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  try {
    const user = await getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (err: any) {
    if (err?.code === '42703') {
       console.warn("Categories: Missing user_id column");
       return []; // Return empty to prevent crash
    }
    console.error("Categories fetch error:", err);
    return [];
  }
};

export const createExpenseCategory = async (name: string): Promise<ExpenseCategory | null> => {
  const user = await getUser();
  if (!user) throw new Error("Foydalanuvchi aniqlanmadi");

  try {
    const { data, error } = await supabase
      .from('expense_categories')
      .insert([{ name, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (err) {
    handleDbError(err, "Category create error");
    return null;
  }
};

export const updateExpenseCategory = async (id: string, name: string): Promise<void> => {
  const user = await getUser();
  if (!user) throw new Error("Foydalanuvchi aniqlanmadi");

  try {
    const { error } = await supabase
      .from('expense_categories')
      .update({ name })
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (error) throw error;
  } catch (err) {
    handleDbError(err, "Category update error");
  }
};

export const deleteExpenseCategory = async (id: string): Promise<void> => {
  const user = await getUser();
  if (!user) throw new Error("Foydalanuvchi aniqlanmadi");

  try {
    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (error) throw error;
  } catch (err) {
    handleDbError(err, "Category delete error");
  }
};

// SHIFT FUNCTIONS
export const getActiveShift = async (): Promise<Shift | null> => {
  try {
    const user = await getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('status', 'active')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) {
       if (error.code === '42703') return null; // Handle missing column gracefuly
       throw error;
    }
    return data as Shift;
  } catch (err) {
    console.error("Active shift fetch error:", err);
    return null;
  }
};

export const startNewShift = async (): Promise<Shift | null> => {
  const user = await getUser();
  if (!user) throw new Error("Foydalanuvchi aniqlanmadi");

  const now = new Date();
  const name = `Smena - ${now.toLocaleDateString('uz-UZ')} ${now.toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'})}`;
  
  try {
    const { data, error } = await supabase
      .from('shifts')
      .insert([{ name, status: 'active', user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data as Shift;
  } catch (err) {
    handleDbError(err, "Start shift error");
    throw err;
  }
};

export const closeShift = async (shiftId: string): Promise<void> => {
  const user = await getUser();
  if (!user) throw new Error("Foydalanuvchi aniqlanmadi");

  try {
    const { error } = await supabase
      .from('shifts')
      .update({ status: 'closed', end_date: new Date().toISOString() })
      .eq('id', shiftId)
      .eq('user_id', user.id);
      
    if (error) throw error;
  } catch (err) {
    handleDbError(err, "Close shift error");
  }
};

export const getAllShifts = async (): Promise<Shift[]> => {
  try {
    const user = await getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (err: any) {
    if (err?.code === '42703') return [];
    return [];
  }
};

export const deleteShift = async (shiftId: string): Promise<void> => {
  const user = await getUser();
  if (!user) throw new Error("Foydalanuvchi aniqlanmadi");

  try {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', shiftId)
      .eq('user_id', user.id);
      
    if (error) throw error;
  } catch (err) {
    handleDbError(err, "Delete shift error");
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
  } catch (err: any) {
    console.error("Transactions fetch error:", err);
    return [];
  }
};

export const saveTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>): Promise<Transaction | null> => {
  const user = await getUser();
  if (!user) throw new Error("Foydalanuvchi aniqlanmadi");

  if (!transaction.shift_id) {
    throw new Error("Smena aniqlanmadi.");
  }

  const cleanTransaction = {
    shift_id: transaction.shift_id,
    amount: transaction.amount,
    category: transaction.category,
    description: transaction.description || "",
    type: transaction.type,
    sub_category: transaction.sub_category || null,
    user_id: user.id
  };

  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([cleanTransaction])
      .select()
      .single();

    if (error) throw error;
    return data as Transaction;
  } catch (err) {
    handleDbError(err, "Save transaction error");
    throw err;
  }
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<void> => {
  const user = await getUser();
  if (!user) throw new Error("Foydalanuvchi aniqlanmadi");

  try {
    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (error) throw error;
  } catch (err) {
    handleDbError(err, "Update transaction error");
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const user = await getUser();
  if (!user) throw new Error("Foydalanuvchi aniqlanmadi");

  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (error) throw error;
  } catch (err) {
    handleDbError(err, "Delete transaction error");
  }
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const user = await getUser();
  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (err: any) {
    if (err?.code === '42703') return [];
    return [];
  }
};
