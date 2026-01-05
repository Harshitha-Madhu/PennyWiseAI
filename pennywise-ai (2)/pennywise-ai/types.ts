
export enum Necessity {
  NEED = 'Need',
  WANT = 'Want',
  SAVINGS = 'Savings',
  DEBT = 'Debt'
}

export enum Sentiment {
  POSITIVE = 'Positive',
  NEUTRAL = 'Neutral',
  NEGATIVE = 'Negative'
}

export type AppView = 'dashboard' | 'transactions' | 'chat' | 'budget';

export interface Transaction {
  id: string;
  rawText: string;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  subCategory: string;
  necessity: Necessity;
  sentiment: Sentiment;
  isRecurring?: boolean;
}

export interface SpendingPersona {
  name: string;
  justification: string;
  analysisDate: string;
  percentages?: {
    needs: number;
    wants: number;
    savings: number;
  };
}

export interface BudgetRecommendation {
  category: string;
  currentAverage: number;
  recommendedCap: number;
  reasoning: string;
  actionableTip: string;
}

export interface FinancialHealth {
  score: number;
  status: string;
  tip: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const CURRENCY_SYMBOL = '₹';
