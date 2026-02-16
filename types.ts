
export type Category = 'Housing' | 'Transportation' | 'Food' | 'Utilities' | 'Insurance' | 'Healthcare' | 'Savings' | 'Debt' | 'Entertainment' | 'Other';
export type Necessity = 'Need' | 'Want' | 'Obligation';

export interface Transaction {
  id: string;
  rawText: string;
  merchant: string;
  amount: number;
  date: string;
  category: Category;
  subCategory: string;
  necessity: Necessity;
  isSubscription: boolean;
  embedding?: number[];
}

export interface SpendingPersona {
  name: string;
  justification: string;
  recommendations: string[];
}

export interface BudgetRecommendation {
  category: Category;
  currentSpend: number;
  recommendedLimit: number;
  reasoning: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  references?: string[];
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: Category;
}

export interface FinancialHealth {
  score: number;
  label: string;
  color: string;
  advice: string;
}
