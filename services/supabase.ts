
import { createClient } from '@supabase/supabase-js';
import { Transaction, Shift } from '../types';

const SUPABASE_URL = 'https://zvaxhyszcdvnylcljgxz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2YXhoeXN6Y2R2bnlsY2xqZ3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5OTQwNjUsImV4cCI6MjA4NDU3MDA2NX0.rBsMCwKE6x_vsEAeu4ALz7oJd_vl47VQt8URTxvQ5go';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// SHIFT FUNCTIONS
export const getActiveShift = async (): Promise<Shift | null> => {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('status', 'active')
      .maybeSingle(); // single() o'rniga maybeSingle() xatolik chiqishini kamaytiradi
    
    if (error) {
      console.error("Shift yuklashda xato:", error.message);
      return null;
    }
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

  if (error) {
    console.error("Smena ochishda xato:", error.message);
    throw new Error(error.message);
  }
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
  const { data } = await supabase.from('shifts').select('*').order('start_date', { ascending: false });
  return data || [];
};

// TRANSACTION FUNCTIONS
export const getTransactionsByShift = async (shiftId: string): Promise<Transaction[]> => {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('shift_id', shiftId)
    .order('date', { ascending: false });
  return data || [];
};

export const saveTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>): Promise<Transaction | null> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select()
    .single();
  if (error) throw error;
  return data as Transaction;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await supabase.from('transactions').delete().eq('id', id);
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false });
  return data || [];
};
