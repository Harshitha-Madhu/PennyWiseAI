import React, { useState, useEffect } from 'react';
import { Transaction, AppView, SpendingPersona, BudgetRecommendation, FinancialHealth, Necessity, Sentiment } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TransactionTable from './components/TransactionTable';
import TransactionForm from './components/TransactionForm';
import FinancialChat from './components/FinancialChat';
import BudgetPlanner from './components/BudgetPlanner';
import Login from './components/Login';
import { categorizeTransaction, getSpendingPersona, getBudgetAdvice, getFinancialHealthScore } from './services/geminiService';
import { getTransactions, saveTransaction } from './services/dbService';

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', rawText: 'Netflix Subscription', merchant: 'Netflix', amount: 1299, date: '2024-05-01', category: 'Entertainment', subCategory: 'Streaming', necessity: Necessity.WANT, sentiment: Sentiment.POSITIVE, isRecurring: true },
  { id: '2', rawText: 'Blinkit Groceries', merchant: 'Blinkit', amount: 4500, date: '2024-05-02', category: 'Groceries', subCategory: 'Food', necessity: Necessity.NEED, sentiment: Sentiment.NEUTRAL },
  { id: '3', rawText: 'Blue Tokai Coffee', merchant: 'Blue Tokai', amount: 450, date: '2024-05-03', category: 'Dining Out', subCategory: 'Coffee', necessity: Necessity.WANT, sentiment: Sentiment.POSITIVE },
  { id: '4', rawText: 'HP Petrol Pump', merchant: 'HPCL', amount: 3500, date: '2024-05-04', category: 'Transportation', subCategory: 'Gas', necessity: Necessity.NEED, sentiment: Sentiment.NEUTRAL },
];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState<AppView>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = getTransactions();
    return saved.length > 0 ? saved : INITIAL_TRANSACTIONS;
  });
  const [persona, setPersona] = useState<SpendingPersona | null>(null);
  const [budgetRecs, setBudgetRecs] = useState<BudgetRecommendation[]>([]);
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string>(new Date().toLocaleTimeString());
  const [error, setError] = useState<string | null>(null);

  const fetchAIInsights = async (currentTransactions: Transaction[]) => {
    if (!isLoggedIn) return;
    setIsSyncing(true);
    setError(null);

    // We use allSettled so one failure (e.g. rate limit on Persona) doesn't break everything else
    const results = await Promise.allSettled([
      getSpendingPersona(currentTransactions),
      getBudgetAdvice(currentTransactions, persona), // Pass current persona if available
      getFinancialHealthScore(currentTransactions)
    ]);

    const [personaResult, budgetResult, healthResult] = results;

    if (personaResult.status === 'fulfilled') setPersona(personaResult.value);
    if (budgetResult.status === 'fulfilled') setBudgetRecs(budgetResult.value);
    if (healthResult.status === 'fulfilled') setHealth(healthResult.value);

    setLastSynced(new Date().toLocaleTimeString());
    setIsSyncing(false);
  };

  useEffect(() => {
    if (isLoggedIn) fetchAIInsights(transactions);
  }, [isLoggedIn]);

  const handleAddTransaction = async (rawText: string, amount: number) => {
    setIsSyncing(true);
    setError(null);
    try {
      let aiTags: Partial<Transaction> = {};
      try {
        aiTags = await categorizeTransaction(rawText, amount);
      } catch (aiErr) {
        console.warn("AI Categorization failed, using local fallback.", aiErr);
        // We don't set global error here because the user still gets their transaction saved correctly via fallback.
        aiTags = { merchant: rawText, category: 'Uncategorized', necessity: Necessity.WANT, sentiment: Sentiment.NEUTRAL };
      }

      const newTx: Transaction = {
        id: Date.now().toString(),
        rawText,
        amount,
        date: new Date().toISOString().split('T')[0],
        merchant: aiTags.merchant || rawText,
        category: aiTags.category || 'Uncategorized',
        subCategory: aiTags.subCategory || 'General',
        necessity: (aiTags.necessity as Necessity) || Necessity.WANT,
        sentiment: (aiTags.sentiment as Sentiment) || Sentiment.NEUTRAL
      };

      const updatedTxs = [newTx, ...transactions];
      setTransactions(updatedTxs);
      await fetchAIInsights(updatedTxs);
    } catch (e: any) {
      console.error(e);
      setError("Failed to add transaction.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const { deleteTransaction } = await import('./services/dbService');
    deleteTransaction(id);
    const updatedTxs = transactions.filter(t => t.id !== id);
    setTransactions(updatedTxs);
    await fetchAIInsights(updatedTxs);
  };

  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="flex min-h-screen">
      <Sidebar currentView={view} setView={setView} isSyncing={isSyncing} lastSynced={lastSynced} onRefresh={() => fetchAIInsights(transactions)} />
      <main className="flex-1 ml-64 p-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          {error && view !== 'chat' && (
            <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex justify-between items-center animate-in slide-in-from-top-4">
              <div className="flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-black">×</button>
            </div>
          )}
          {view === 'dashboard' && <Dashboard transactions={transactions} persona={persona} health={health} isSyncing={isSyncing} />}
          {view === 'transactions' && (
            <div className="space-y-6">
              <TransactionForm onSuccess={() => setTransactions(getTransactions())} />
              <TransactionTable transactions={transactions} />
            </div>
          )}
          {view === 'chat' && <FinancialChat transactions={transactions} />}
          {view === 'budget' && (
            <BudgetPlanner
              recommendations={budgetRecs}
              loading={isSyncing}
              userName={localStorage.getItem('pennywise_user_name') || 'Friend'}
              persona={persona}
              transactions={transactions}
            />
          )}
        </div>
      </main>
    </div>
  );
};
export default App;