
import { Transaction } from '../types';

const STORAGE_KEY = 'pennywise_transactions';

export const saveTransaction = (transaction: Transaction) => {
  const transactions = getTransactions();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([transaction, ...transactions]));
};

export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const deleteTransaction = (id: string) => {
  const transactions = getTransactions();
  const updated = transactions.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const detectSubscriptions = (transactions: Transaction[]): string[] => {
  const counts: Record<string, { count: number; amounts: Set<number> }> = {};

  transactions.forEach(t => {
    const key = t.merchant.toLowerCase();
    if (!counts[key]) counts[key] = { count: 0, amounts: new Set() };
    counts[key].count += 1;
    counts[key].amounts.add(t.amount);
  });

  return Object.entries(counts)
    .filter(([_, data]) => data.count >= 2 && data.amounts.size === 1)
    .map(([merchant]) => merchant);
};
