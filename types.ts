
export type TransactionType = 'kirim' | 'chiqim';

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  type: TransactionType;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface SummaryStats {
  totalIn: number;
  totalOut: number;
  balance: number;
}
