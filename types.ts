
export type TransactionType = 'kirim' | 'chiqim';

export interface Shift {
  id: string;
  name: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'closed';
  // Added to fix property access errors in components
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
  sub_category?: string; // Xarajat turi uchun (masalan: Shashlik)
  description: string;
  type: TransactionType;
  date: string;
}

export interface SummaryStats {
  totalIn: number;
  totalOut: number;
  balance: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}
