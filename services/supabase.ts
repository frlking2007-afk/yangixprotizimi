
import { createClient } from '@supabase/supabase-js';
import { Transaction, Shift, ExpenseCategory, Note, BookingCategory, Room } from '../types';

const SUPABASE_URL = 'https://zvaxhyszcdvnylcljgxz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2YXhoeXN6Y2R2bnlsY2xqZ3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5OTQwNjUsImV4cCI6MjA4NDU3MDA2NX0.rBsMCwKE6x_vsEAeu4ALz7oJd_vl47VQt8URTxvQ5go';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// BOOKING FUNCTIONS
export const getBookingCategories = async (): Promise<BookingCategory[]> => {
  const user = await getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('booking_categories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  if (error) return [];
  return data;
};

export const createBookingCategory = async (name: string): Promise<BookingCategory | null> => {
  const user = await getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('booking_categories')
    .insert([{ name, user_id: user.id }])
    .select()
    .single();
  if (error) return null;
  return data;
};

export const updateBookingCategory = async (id: string, name: string): Promise<void> => {
  const { error } = await supabase
    .from('booking_categories')
    .update({ name })
    .eq('id', id);
  if (error) throw error;
};

export const deleteBookingCategory = async (id: string) => {
  await supabase.from('booking_categories').delete().eq('id', id);
};

export const getRooms = async (categoryId?: string): Promise<Room[]> => {
  const user = await getUser();
  if (!user) return [];
  
  let query = supabase
    .from('rooms')
    .select('*')
    .eq('user_id', user.id);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query.order('name', { ascending: true });
  
  if (error) {
    console.error("Error fetching rooms:", error);
    return [];
  }
  return data || [];
};

export const createRoom = async (categoryId: string, name: string): Promise<Room | null> => {
  const user = await getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('rooms')
    .insert([{ 
      category_id: categoryId, 
      name: name.trim(), 
      status: 'free', 
      user_id: user.id 
    }])
    .select()
    .single();
  if (error) {
    console.error("Error creating room:", error);
    return null;
  }
  return data;
};

export const updateRoomStatus = async (roomId: string, status: 'free' | 'busy') => {
  await supabase.from('rooms').update({ status }).eq('id', roomId);
};

export const deleteRoom = async (roomId: string) => {
  const { error } = await supabase.from('rooms').delete().eq('id', roomId);
  if (error) throw error;
};

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

export const getShiftById = async (id: string): Promise<Shift | null> => {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Shift;
  } catch (err) {
    return null;
  }
};

export const updateShiftName = async (shiftId: string, name: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('shifts')
      .update({ name })
      .eq('id', shiftId);
    if (error) throw error;
  } catch (err) {
    console.error("Update shift name error:", err);
    throw err;
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

export const reopenShift = async (shiftId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('shifts')
      .update({ status: 'active', end_date: null })
      .eq('id', shiftId);
    if (error) throw error;
  } catch (err) {
    throw err;
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

export const updateShiftManualSum = async (shiftId: string, sum: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('shifts')
      .update({ manual_kassa_sum: sum })
      .eq('id', shiftId);
    if (error) throw error;
  } catch (err) {
    console.error("Update shift sum error:", err);
  }
};

export const getCategoryConfigs = async (shiftId: string) => {
  try {
    const { data, error } = await supabase
      .from('category_configs')
      .select('*')
      .eq('shift_id', shiftId);
    if (error) throw error;
    return data || [];
  } catch (err) {
    return [];
  }
};

export const upsertCategoryConfig = async (shiftId: string, categoryName: string, config: { savdo_sum?: number, filters?: any }) => {
  const user = await getUser();
  try {
    const { error } = await supabase
      .from('category_configs')
      .upsert({
        user_id: user?.id,
        shift_id: shiftId,
        category_name: categoryName,
        ...config
      }, { onConflict: 'shift_id,category_name' });
    if (error) throw error;
  } catch (err) {
    console.error("Upsert config error:", err);
  }
};

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

export const getExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  try {
    const user = await getUser();
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('user_id', user?.id || '')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    return [];
  }
};

export const createExpenseCategory = async (name: string): Promise<ExpenseCategory | null> => {
  const user = await getUser();
  try {
    const { data: currentCats } = await supabase
      .from('expense_categories')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);
    const nextOrder = (currentCats && currentCats[0]?.sort_order || 0) + 1;
    const { data, error } = await supabase
      .from('expense_categories')
      .insert([{ name, user_id: user?.id, sort_order: nextOrder }])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    return null;
  }
};

export const updateExpenseCategory = async (id: string, name: string): Promise<void> => {
  try {
    const { error } = await supabase.from('expense_categories').update({ name }).eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error("Category update error:", err);
  }
};

export const deleteExpenseCategory = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('expense_categories').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error("Category delete error:", err);
  }
};

export const updateExpenseCategoriesOrder = async (categories: ExpenseCategory[]): Promise<void> => {
  try {
    const updates = categories.map((cat, index) => ({
      id: cat.id,
      name: cat.name,
      user_id: (cat as any).user_id,
      sort_order: index
    }));
    const { error } = await supabase.from('expense_categories').upsert(updates);
    if (error) throw error;
  } catch (err) {
    console.error("Order update error:", err);
  }
};

export const getNotes = async (): Promise<Note[]> => {
  try {
    const user = await getUser();
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user?.id || '')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
};

export const createNote = async (title: string, content: string): Promise<Note | null> => {
  const user = await getUser();
  try {
    const { data, error } = await supabase
      .from('notes')
      .insert([{ title, content, user_id: user?.id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    return null;
  }
};

export const updateNote = async (id: string, title: string, content: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notes')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error("Update note error:", err);
  }
};

export const deleteNote = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error("Delete note error:", err);
  }
};

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
    return '1234';
  }
};

export const setDeletionPassword = async (newPassword: string): Promise<void> => {
  const user = await getUser();
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ 
        key: 'deletion_password', 
        value: newPassword,
        user_id: user?.id
      }, { onConflict: 'key' });
    if (error) throw error;
  } catch (err: any) {
    throw new Error(err.message || "Parolni saqlashda xatolik");
  }
};
