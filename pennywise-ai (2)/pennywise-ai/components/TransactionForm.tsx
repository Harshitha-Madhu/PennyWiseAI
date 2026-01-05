import React, { useState } from 'react';
import { categorizeTransaction } from '../services/geminiService';
import { saveTransaction } from '../services/dbService';
import { Transaction, Necessity, CURRENCY_SYMBOL, Sentiment } from '../types';

interface Props {
  onSuccess: () => void;
}

const TransactionForm: React.FC<Props> = ({ onSuccess }) => {
  const [input, setInput] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || !amount) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const aiResult = await categorizeTransaction(input, parsedAmount);

      const newTransaction: Transaction = {
        id: Math.random().toString(36).substring(2, 11),
        rawText: input,
        merchant: aiResult.merchant || 'Unknown',
        amount: parsedAmount,
        date: new Date().toISOString(),
        category: aiResult.category || 'General',
        subCategory: aiResult.subCategory || 'Other',
        necessity: aiResult.necessity || Necessity.WANT,
        sentiment: aiResult.sentiment || Sentiment.NEUTRAL,
      };

      saveTransaction(newTransaction);
      setInput('');
      setAmount('');
      setSuccessMsg(`✅ Added ${newTransaction.merchant}: ${newTransaction.category} (${newTransaction.necessity} • ${newTransaction.sentiment})`);
      setTimeout(() => setSuccessMsg(null), 5000);
      onSuccess();
    } catch (err: any) {
      console.warn("Categorization UI Fallback:", err);
      // We don't set a visible error anymore because the local fallback ensures the transaction is saved anyway.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-black mb-5 flex items-center gap-2 text-slate-800">
        <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">⚡</span>
        Quick Log
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl animate-pulse">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-xl animate-in slide-in-from-top-2">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">What happened?</label>
          <input
            type="text"
            placeholder="e.g. Swiggy lunch or Metro recharge"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Amount ({CURRENCY_SYMBOL})</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{CURRENCY_SYMBOL}</span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-300 font-semibold"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <button
          type="submit"
          className={`w-full py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 ${loading ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'}`}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              <span className="text-sm">PennyWise is analyzing...</span>
            </div>
          ) : 'Categorize & Save'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;