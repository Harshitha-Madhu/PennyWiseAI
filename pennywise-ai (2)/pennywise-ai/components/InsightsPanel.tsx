
import React, { useState, useEffect } from 'react';
import { generatePersona, getBudgetRecommendations, getFinancialHealth } from '../services/geminiService';
import { Transaction, SpendingPersona, BudgetRecommendation, CURRENCY_SYMBOL, FinancialHealth } from '../types';

interface Props {
  transactions: Transaction[];
}

const InsightsPanel: React.FC<Props> = ({ transactions }) => {
  const [persona, setPersona] = useState<SpendingPersona | null>(null);
  const [budgets, setBudgets] = useState<BudgetRecommendation[]>([]);
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    if (transactions.length < 3) return;
    setLoading(true);
    try {
      const [p, b, h] = await Promise.all([
        generatePersona(transactions),
        getBudgetRecommendations(transactions),
        getFinancialHealth(transactions)
      ]);
      setPersona(p);
      setBudgets(b);
      setHealth(h);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [transactions.length]);

  return (
    <div className="space-y-6">
      {/* Personalized Health Score */}
      <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200">
         <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          Financial Vitality
        </h3>
        {loading ? (
           <div className="h-20 bg-slate-50 animate-pulse rounded-2xl"></div>
        ) : health ? (
          <div className="flex items-center gap-6">
             <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                   <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                   <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-emerald-500" strokeDasharray={251.2} strokeDashoffset={251.2 - (health.score / 100) * 251.2} />
                </svg>
                <span className="absolute text-xl font-black text-slate-900">{health.score}</span>
             </div>
             <div className="flex-1">
                <div className="text-xs font-black uppercase text-emerald-600 tracking-wider mb-1">{health.status}</div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">"{health.tip}"</p>
             </div>
          </div>
        ) : (
          <p className="text-slate-400 text-[10px] text-center italic">Analyze data to see health score</p>
        )}
      </div>

      {/* Personalized Persona */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-7 rounded-3xl shadow-xl shadow-blue-200 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">Madhu's Identity</h3>
          <span className="text-[10px] bg-white/20 px-2 py-1 rounded-lg border border-white/20 backdrop-blur-md font-bold">SENTIMENT AI</span>
        </div>
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-2/3 bg-white/20 rounded-xl"></div>
            <div className="h-4 w-full bg-white/20 rounded-xl"></div>
          </div>
        ) : persona ? (
          <div>
            <div className="text-2xl font-black mb-3 leading-tight">
               {persona.name}
            </div>
            <p className="text-blue-50 text-sm font-medium leading-relaxed italic">"{persona.justification}"</p>
          </div>
        ) : (
          <p className="text-blue-100 text-sm font-medium italic">Log transactions to reveal Madhu's unique spending style.</p>
        )}
      </div>

      {/* Optimizations */}
      <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
          Tailored Fixes
        </h3>
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-10 w-10 bg-slate-100 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 bg-slate-100 rounded"></div>
                  <div className="h-3 w-3/4 bg-slate-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : budgets.length > 0 ? (
          <div className="space-y-4">
            {budgets.map((b, i) => (
              <div key={i} className="group p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-black text-slate-800 text-sm tracking-tight">{b.category}</div>
                  <div className="text-xs font-black text-blue-600 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                    CAP: {CURRENCY_SYMBOL}{b.recommendedCap}
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">"{b.reasoning}"</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Awaiting Analysis...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsPanel;
