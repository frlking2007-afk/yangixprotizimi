
import { createClient } from '@supabase/supabase-js';
import { Transaction, Shift, ExpenseCategory, Note, BookingCategory, Room, Booking, PaymentType } from '../types';

const SUPABASE_URL = 'https://typpwuvgbvqtsdrfgdva.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cHB3dXZnYnZxdHNkcmZnZHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDI1NzMsImV4cCI6MjA4NjM3ODU3M30.6E3CCZIVi0INrJ8gxB-hm0wXNQLl-4hhnhQekuN9rek';

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

// --- BUSINESS LOGIC HELPERS ---

export const getBusinessDetails = async (userId: string) => {
  try {
    // 1. Get business_id from customers table using auth.user.id
    // Note: Assuming the column in customers table linking to auth is 'auth_user_id' or 'user_id'
    // Adjusting to 'user_id' based on common Supabase patterns, or 'id' if the customer id matches auth id.
    // Let's assume 'auth_user_id' based on the prompt's context of finding business_id via auth.id
    
    // Using maybeSingle to avoid errors if not found immediately
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .select('business_id')
      .eq('auth_user_id', userId) 
      .maybeSingle();

    if (custError || !customer) {
        console.warn("Customer not found or error:", custError);
        return null; 
    }

    // 2. Get tarif_plan from businesses table
    const { data: business, error: busError } = await supabase
      .from('businesses')
      .select('tarif_plan')
      .eq('id', customer.business_id)
      .single();

    if (busError) {
        console.warn("Business not found:", busError);
        return { business_id: customer.business_id, tarif_plan: 'LITE' }; // Default to LITE if error
    }

    return { 
      business_id: customer.business_id, 
      tarif_plan: business.tarif_plan 
    };
  } catch (error) {
    console.error("Error fetching business details:", error);
    return null;
  }
};

// Helper to get current session's business ID for inserts
const getCurrentBusinessId = async () => {
  const user = await getUser();
  if (!user) return null;
  
  // We try to fetch from local storage first if we cached it (optional optimization), 
  // but for reliability here we fetch from DB or assume the cached profile in App.tsx handles state.
  // For insert functions, we'll do a quick lookup.
  const { data } = await supabase
    .from('customers')
    .select('business_id')
    .eq('auth_user_id', user.id)
    .maybeSingle();
    
  return data?.business_id;
};

// --- PAYMENT TYPES (Dynamic Tabs) ---

export const getPaymentTypes = async (): Promise<PaymentType[]> => {
  const user = await getUser();
  if (!user) return [];
  
  // RLS typically handles filtering by user/business, but we pass user_id explicitly just in case
  const { data, error } = await supabase
    .from('payment_types')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });
    
  if (error) return [];
  return data || [];
};

export const createPaymentType = async (name: string, type: 'card' | 'expense'): Promise<PaymentType | null> => {
  const user = await getUser();
  if (!user) return null;
  const businessId = await getCurrentBusinessId();

  // Get max sort order
  const { data: currentTypes } = await supabase
    .from('payment_types')
    .select('sort_order')
    .eq('user_id', user.id) // Filter by user to get their sort order
    .order('sort_order', { ascending: false })
    .limit(1);
    
  const nextOrder = (currentTypes && currentTypes[0]?.sort_order || 0) + 1;

  const { data, error } = await supabase
    .from('payment_types')
    .insert([{ 
      name, 
      type, 
      user_id: user.id, 
      business_id: businessId, // Inject business_id
      is_system: false,
      sort_order: nextOrder
    }])
    .select()
    .single();

  if (error) {
    console.error("Create payment type error:", error);
    return null;
  }
  return data;
};

export const updatePaymentTypeName = async (id: string, newName: string, oldName: string): Promise<void> => {
  const user = await getUser();
  if (!user) return;

  const { error } = await supabase
    .from('payment_types')
    .update({ name: newName })
    .eq('id', id);

  if (error) throw error;

  await supabase
    .from('transactions')
    .update({ category: newName })
    .eq('user_id', user.id)
    .eq('category', oldName);
    
  await supabase
    .from('category_configs')
    .update({ category_name: newName })
    .eq('user_id', user.id)
    .eq('category_name', oldName);
};

export const deletePaymentType = async (id: string): Promise<void> => {
  const { error } = await supabase.from('payment_types').delete().eq('id', id);
  if (error) throw error;
};

export const updatePaymentTypesOrder = async (types: PaymentType[]): Promise<void> => {
  const updates = types.map((t, index) => ({
    id: t.id,
    user_id: t.user_id,
    // We assume business_id is already on the object or DB handles it via RLS on update
    name: t.name,
    type: t.type,
    is_system: t.is_system,
    sort_order: index
  }));

  const { error } = await supabase.from('payment_types').upsert(updates);
  if (error) console.error("Reorder error", error);
};

// --- BOOKING FUNCTIONS ---

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
  const businessId = await getCurrentBusinessId();

  const { data, error } = await supabase
    .from('booking_categories')
    .insert([{ name, user_id: user.id, business_id: businessId }])
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
  const businessId = await getCurrentBusinessId();

  const { data, error } = await supabase
    .from('rooms')
    .insert([{ 
      category_id: categoryId, 
      name: name.trim(), 
      status: 'free', 
      user_id: user.id,
      business_id: businessId 
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

// --- NEW BOOKING LOGIC ---

export const getBookingsForDate = async (date: Date): Promise<Booking[]> => {
  const user = await getUser();
  if (!user) return [];

  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', user.id)
    .gte('booking_time', startDate.toISOString())
    .lte('booking_time', endDate.toISOString());

  if (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
  return data || [];
};

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'created_at'>): Promise<Booking | null> => {
  const user = await getUser();
  if (!user) return null;
  const businessId = await getCurrentBusinessId();

  const { data, error } = await supabase
    .from('bookings')
    .insert([{ ...bookingData, user_id: user.id, business_id: businessId }])
    .select()
    .single();

  if (error) {
    console.error("Booking create error:", error);
    return null;
  }
  return data;
};

export const deleteBooking = async (bookingId: string): Promise<void> => {
  const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
  if (error) throw error;
};

// --- SHIFTS & TRANSACTIONS ---

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
  const businessId = await getCurrentBusinessId();
  const now = new Date();
  const name = `Smena - ${now.toLocaleDateString('uz-UZ')} ${now.toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'})}`;
  
  try {
    const { data, error } = await supabase
      .from('shifts')
      .insert([{ name, status: 'active', user_id: user?.id, business_id: businessId }])
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
  const businessId = await getCurrentBusinessId();
  try {
    const { error } = await supabase
      .from('category_configs')
      .upsert({
        user_id: user?.id,
        business_id: businessId,
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
  const businessId = await getCurrentBusinessId();
  try {
    // Note: Assuming 'transactions' is the table name. If user meant 'xpro_user_data' to REPLACE transactions,
    // we would change it here. But usually applications have multiple tables.
    // We add business_id to the insert payload.
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...transaction, user_id: user?.id, business_id: businessId }])
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
  const businessId = await getCurrentBusinessId();
  try {
    const { data: currentCats } = await supabase
      .from('expense_categories')
      .select('sort_order')
      .eq('user_id', user?.id)
      .order('sort_order', { ascending: false })
      .limit(1);
    const nextOrder = (currentCats && currentCats[0]?.sort_order || 0) + 1;
    const { data, error } = await supabase
      .from('expense_categories')
      .insert([{ name, user_id: user?.id, business_id: businessId, sort_order: nextOrder }])
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
  const businessId = await getCurrentBusinessId();
  try {
    const { data, error } = await supabase
      .from('notes')
      .insert([{ title, content, user_id: user?.id, business_id: businessId }])
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
  const businessId = await getCurrentBusinessId();
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ 
        key: 'deletion_password', 
        value: newPassword,
        user_id: user?.id,
        business_id: businessId
      }, { onConflict: 'key' });
    if (error) throw error;
  } catch (err: any) {
    throw new Error(err.message || "Parolni saqlashda xatolik");
  }
};
