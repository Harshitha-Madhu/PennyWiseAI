
import { server } from './server';
import { Transaction } from './types';

/**
 * CLIENT API UTILITY
 * This simulates 'fetch' calls to your backend server.
 */
export const api = {
  fetchTransactions: async () => {
    return (await server.getTransactions()).data;
  },
  
  addTransaction: async (rawText: string, amount: number) => {
    const res = await server.addTransaction({ rawText, amount });
    return res.data;
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>) => {
    const res = await server.updateTransaction(id, updates);
    return res.data;
  },

  sendChatMessage: async (query: string) => {
    const res = await server.processChat({ query });
    return res.data;
  },

  fetchAnalysis: async () => {
    const res = await server.getAnalysis();
    return res.data;
  },

  fetchHealthScore: async () => {
    const res = await server.getHealth();
    return res.data;
  }
};
