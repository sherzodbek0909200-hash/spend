
export type Category = 
  | 'Oziq-ovqat' 
  | 'Transport' 
  | 'Ko\'ngilochar' 
  | 'Sog\'liq' 
  | 'Ta\'lim' 
  | 'Uy-joy' 
  | 'Boshqa';

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  description: string;
  date: string;
}

export interface BudgetInsight {
  status: 'good' | 'warning' | 'critical';
  message: string;
  suggestions: string[];
}
