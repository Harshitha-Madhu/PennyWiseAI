
import { Transaction } from "../types";

const DB_KEY = 'pennywise_transactions';

export const saveTransactions = (transactions: Transaction[]) => {
  localStorage.setItem(DB_KEY, JSON.stringify(transactions));
};

export const loadTransactions = (): Transaction[] => {
  const stored = localStorage.getItem(DB_KEY);
  if (!stored) {
    // Return some seed data if empty with Indian context
    return [
      { id: '1', rawText: 'Netflix India Monthly', merchant: 'Netflix', amount: 499, date: '2024-03-01', category: 'Entertainment', subCategory: 'Streaming', necessity: 'Want', isSubscription: true },
      { id: '2', rawText: 'Chai and Samosa at local stall', merchant: 'Local Stall', amount: 45, date: '2024-03-05', category: 'Food', subCategory: 'Cafe', necessity: 'Want', isSubscription: false },
      { id: '3', rawText: 'Apartment Maintenance', merchant: 'Housing Society', amount: 4500, date: '2024-03-01', category: 'Housing', subCategory: 'Maintenance', necessity: 'Need', isSubscription: false },
      { id: '4', rawText: 'Spotify Premium Individual', merchant: 'Spotify', amount: 119, date: '2024-03-02', category: 'Entertainment', subCategory: 'Music', necessity: 'Want', isSubscription: true },
      { id: '5', rawText: 'Petrol refill at HP Petrol Pump', merchant: 'HP Petrol Pump', amount: 2000, date: '2024-03-06', category: 'Transportation', subCategory: 'Fuel', necessity: 'Need', isSubscription: false }
    ];
  }
  return JSON.parse(stored);
};

export const detectSubscriptions = (transactions: Transaction[]): Transaction[] => {
  // Logic: Merchants with similar amounts appearing monthly
  const merchants = new Map<string, { amounts: Set<number>, count: number }>();
  transactions.forEach(t => {
    const key = t.merchant.toLowerCase();
    if (!merchants.has(key)) merchants.set(key, { amounts: new Set(), count: 0 });
    const data = merchants.get(key)!;
    data.amounts.add(t.amount);
    data.count += 1;
  });

  return transactions.map(t => {
    const data = merchants.get(t.merchant.toLowerCase());
    const isLikelySub = data && data.count >= 2 && data.amounts.size === 1;
    return { ...t, isSubscription: isLikelySub || t.isSubscription };
  });
};
