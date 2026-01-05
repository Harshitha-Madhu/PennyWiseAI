
import React from 'react';
import { Transaction, Necessity, CURRENCY_SYMBOL, Sentiment } from '../types';
import { detectSubscriptions } from '../services/dbService';
import { CATEGORY_EMOJIS } from '../constants';

interface Props {
  transactions: Transaction[];
}

const SENTIMENT_EMOJI: Record<string, string> = {
  [Sentiment.POSITIVE]: '😊',
  [Sentiment.NEUTRAL]: '😐',
  [Sentiment.NEGATIVE]: '😟'
};


const TransactionTable: React.FC<Props> = ({ transactions }) => {
  const recurringMerchants = detectSubscriptions(transactions);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-black text-slate-900">Ledger</h3>
        <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-500">{transactions.length} ITEMS</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-white text-slate-400 text-[9px] uppercase font-black tracking-[0.15em] border-b border-slate-50">
            <tr>
              <th className="px-6 py-4">Beneficiary</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Sentiment</th>
              <th className="px-6 py-4 text-right">Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {transactions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="text-3xl mb-3">📉</div>
                  <p className="text-slate-400 text-sm font-medium">Clear as a summer sky. Start adding data.</p>
                </td>
              </tr>
            )}
            {transactions.map((t) => {
              const isSubscription = recurringMerchants.includes(t.merchant.toLowerCase());
              return (
                <tr key={t.id} className="group hover:bg-blue-50/30 transition-all cursor-default">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{t.merchant}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 group-hover:text-slate-500">{new Date(t.date).toLocaleDateString()}</span>
                        {isSubscription && (
                          <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest shadow-sm">Subscription</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[9px] font-black uppercase group-hover:bg-white group-hover:shadow-sm transition-all">
                        {CATEGORY_EMOJIS[t.category] || '📦'} {t.category}
                      </span>
                      <span className={`text-[8px] font-black uppercase tracking-wider ${t.necessity === Necessity.NEED ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {t.necessity}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{SENTIMENT_EMOJI[t.sentiment] || '⚪'}</span>
                      <span className={`text-[10px] font-black uppercase tracking-wide ${t.sentiment === Sentiment.POSITIVE ? 'text-emerald-500' :
                        t.sentiment === Sentiment.NEGATIVE ? 'text-red-500' :
                          'text-slate-400'
                        }`}>{t.sentiment}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">
                    {CURRENCY_SYMBOL}{t.amount.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
