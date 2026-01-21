
export type TransactionType = 'kirim' | 'chiqim';

export interface Shift {
  id: string;
  name: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'closed';
}

export interface Transaction {
  id: string;
  shift_id: string;
  amount: number;
  category: string;
  description: string;
  type: TransactionType;
  date: string;
}

export interface SummaryStats {
  totalIn: number;
  totalOut: number;
  balance: number;
}
