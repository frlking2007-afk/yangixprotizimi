
export type TransactionType = 'kirim' | 'chiqim';

export interface Shift {
  id: string;
  name: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'closed';
  manual_kassa_sum?: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  created_at: string;
  sort_order?: number;
}

export interface Transaction {
  id: string;
  shift_id: string;
  amount: number;
  category: string;
  sub_category?: string;
  description: string;
  type: TransactionType;
  date: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Booking Types
export interface BookingCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface Room {
  id: string;
  category_id: string;
  name: string;
  status: 'free' | 'busy'; // Legacy status, we will calculate real status from bookings
  user_id: string;
  created_at: string;
}

export interface Booking {
  id: string;
  room_id: string;
  customer_name: string;
  phone_number: string;
  description: string;
  booking_time: string;
  created_at: string;
}
