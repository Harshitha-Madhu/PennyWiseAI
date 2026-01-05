import React from 'react';
import { BudgetRecommendation, CURRENCY_SYMBOL, SpendingPersona, Transaction } from '../types';
import { CATEGORY_EMOJIS } from '../constants';

interface Props {
    recommendations: BudgetRecommendation[];
    loading: boolean;
    userName?: string;
    persona?: SpendingPersona | null;
    transactions: Transaction[];
}


const BudgetPlanner: React.FC<Props> = ({ recommendations, loading, userName = "User", persona, transactions }) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Smart Budget for {userName}</h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        {persona ? `Optimized for your "${persona.name}" profile.` : "AI-driven custom spending caps based on your lifestyle."}
                    </p>
                </div>
                {loading && <span className="text-blue-500 text-xs font-bold animate-pulse">ANALYZING SPENDING PATTERNS...</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.length > 0 ? (
                    recommendations.map((rec, index) => (
                        <div key={index} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🎯</div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                        {CATEGORY_EMOJIS[rec.category] || '📦'} {rec.category}
                                    </span>
                                </div>

                                <div className="mb-6">
                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Recommended Cap</div>
                                    <div className="text-4xl font-black text-slate-900">{CURRENCY_SYMBOL}{rec.recommendedCap}</div>
                                    <div className="text-xs font-bold text-red-400 mt-1">
                                        Current Avg: {CURRENCY_SYMBOL}{rec.currentAverage}
                                    </div>
                                </div>

                                <p className="text-sm font-medium text-slate-500 bg-slate-50 p-4 rounded-xl leading-relaxed mb-4">
                                    "{rec.reasoning}"
                                </p>

                                {rec.actionableTip && (
                                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 items-start">
                                        <span className="text-xl">💡</span>
                                        <div>
                                            <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">PennyWise Tip</div>
                                            <p className="text-xs font-bold text-amber-800 leading-relaxed">
                                                {rec.actionableTip}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 border-t border-slate-100 pt-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Activity</h4>
                                    <div className="space-y-2">
                                        {transactions
                                            .filter(t => t.category === rec.category)
                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                            .slice(0, 3)
                                            .map((t) => (
                                                <div key={t.id} className="flex justify-between items-center text-xs group cursor-default">
                                                    <span className="text-slate-600 font-medium truncate max-w-[120px]" title={t.merchant}>
                                                        {t.merchant}
                                                    </span>
                                                    <span className="text-slate-400 text-[10px]">{new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                    <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                                                        {CURRENCY_SYMBOL}{t.amount}
                                                    </span>
                                                </div>
                                            ))}
                                        {transactions.filter(t => t.category === rec.category).length === 0 && (
                                            <div className="text-xs text-slate-400 italic">No recent transactions</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    !loading && (
                        <div className="col-span-full bg-white p-12 rounded-[2rem] border border-dashed border-slate-300 text-center">
                            <div className="text-4xl mb-4">📉</div>
                            <h3 className="text-lg font-black text-slate-800">Not enough data</h3>
                            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
                                Once you add more transactions, I'll identify where you can save money without sacrificing your lifestyle.
                            </p>
                        </div>
                    )
                )}

                {loading && recommendations.length === 0 && (
                    [1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 h-64 animate-pulse">
                            <div className="h-6 w-24 bg-slate-100 rounded-lg mb-6"></div>
                            <div className="h-10 w-32 bg-slate-100 rounded-lg mb-2"></div>
                            <div className="h-4 w-20 bg-slate-100 rounded-lg mb-8"></div>
                            <div className="h-24 w-full bg-slate-100 rounded-xl"></div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BudgetPlanner;
