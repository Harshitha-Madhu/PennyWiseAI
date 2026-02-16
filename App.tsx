
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, ChatMessage, SpendingPersona, BudgetRecommendation, FinancialHealth, Category, Necessity } from './types';
import { api } from './api';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
const CATEGORIES: Category[] = ['Housing', 'Transportation', 'Food', 'Utilities', 'Insurance', 'Healthcare', 'Savings', 'Debt', 'Entertainment', 'Other'];
const NECESSITIES: Necessity[] = ['Need', 'Want', 'Obligation'];
const APP_PASSWORD = 'pennywise';

// --- Sub-components ---

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`w-full text-left px-5 py-3 rounded-xl flex items-center gap-4 transition-all duration-300 font-semibold group ${active ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}>
    <i className={`fas ${icon} text-base transition-transform group-hover:scale-110`}></i>
    <span className="text-sm tracking-tight">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white px-6 py-5 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 flex items-center gap-4 relative overflow-hidden group">
    <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${color} shadow-inner transition-transform group-hover:rotate-12`}><i className={`fas ${icon} text-lg`}></i></div>
    <div className="z-10">
      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
    </div>
  </div>
);

const QuickAction = ({ label, onClick }: any) => (
  <button onClick={onClick} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition shadow-sm">{label}</button>
);

const FloatingCoins = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
    <div className="coin-float delay-0" style={{ left: '5%', top: '20%' }}><i className="fas fa-coins text-indigo-200/40 text-4xl"></i></div>
    <div className="coin-float delay-1000" style={{ left: '85%', top: '15%' }}><i className="fas fa-coins text-purple-200/40 text-6xl"></i></div>
    <div className="coin-float delay-2000" style={{ left: '40%', top: '70%' }}><i className="fas fa-coins text-indigo-100/40 text-3xl"></i></div>
    <div className="coin-float delay-3000" style={{ left: '15%', top: '80%' }}><i className="fas fa-coins text-purple-100/40 text-5xl"></i></div>
    <div className="coin-float delay-1500" style={{ left: '70%', top: '60%' }}><i className="fas fa-coins text-yellow-200/30 text-4xl"></i></div>
  </div>
);

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === APP_PASSWORD) onLogin();
    else { setError(true); setTimeout(() => setError(false), 500); setPassword(''); }
  };
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden p-6">
      <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-indigo-100/40 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-100/40 blur-[120px] rounded-full"></div>
      <FloatingCoins />
      <div className={`w-full max-w-md bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white shadow-2xl transition-all duration-300 relative z-10 ${error ? 'animate-shake' : 'animate-in fade-in zoom-in-95 duration-500'}`}>
        <div className="text-center mb-10">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-16 h-16 rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center mx-auto mb-6"><i className="fas fa-coins text-3xl text-white"></i></div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">PennyWise AI</h1>
          <p className="text-slate-500 text-sm font-medium">Madhu Harshitha's Financial Vault</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <input type="password" autoFocus className={`w-full pl-12 pr-4 py-4 bg-slate-50 border ${error ? 'border-rose-400' : 'border-slate-100 group-focus-within:border-indigo-400'} rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all`} placeholder="Access Token" value={password} onChange={(e) => setPassword(e.target.value)} />
            <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-400 transition"></i>
          </div>
          <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold tracking-tight shadow-xl shadow-indigo-200 transition-all active:scale-[0.98]">Unlock Ledger</button>
        </form>
      </div>
    </div>
  );
};

// --- Transaction Edit Modal ---

const EditModal = ({ transaction, onClose, onSave }: { transaction: Transaction, onClose: () => void, onSave: (id: string, updates: Partial<Transaction>) => void }) => {
  const [formData, setFormData] = useState<Partial<Transaction>>({
    merchant: transaction.merchant,
    category: transaction.category,
    subCategory: transaction.subCategory,
    necessity: transaction.necessity
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(transaction.id, formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 border border-slate-100 relative animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><i className="fas fa-times"></i></button>
        <h3 className="text-2xl font-black text-slate-800 mb-6">Edit Record</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Merchant</label>
            <input 
              type="text" 
              className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
              value={formData.merchant}
              onChange={(e) => setFormData({...formData, merchant: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Category</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold text-sm"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value as Category})}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Necessity</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold text-sm"
                value={formData.necessity}
                onChange={(e) => setFormData({...formData, necessity: e.target.value as Necessity})}
              >
                {NECESSITIES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Sub Category</label>
            <input 
              type="text" 
              className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
              value={formData.subCategory}
              onChange={(e) => setFormData({...formData, subCategory: e.target.value})}
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all">Cancel</button>
            <button type="submit" className="flex-1 py-4 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('pw_auth') === 'true');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newRawText, setNewRawText] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [persona, setPersona] = useState<SpendingPersona | null>(null);
  const [budgets, setBudgets] = useState<BudgetRecommendation[]>([]);
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'ai-coach'>('dashboard');
  const [activeReferences, setActiveReferences] = useState<string[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleLogin = () => { setIsAuthenticated(true); sessionStorage.setItem('pw_auth', 'true'); };
  const handleLogout = () => { setIsAuthenticated(false); sessionStorage.removeItem('pw_auth'); };

  useEffect(() => {
    if (isAuthenticated) {
      api.fetchTransactions().then(setTransactions);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && transactions.length > 0) {
      const timer = setTimeout(async () => {
        const h = await api.fetchHealthScore();
        setHealth(h);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [transactions, isAuthenticated]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRawText || !newAmount) return;
    setIsProcessing(true);
    try {
      await api.addTransaction(newRawText, parseFloat(newAmount));
      const updated = await api.fetchTransactions();
      setTransactions(updated);
      setNewRawText(''); setNewAmount('');
    } finally { setIsProcessing(false); }
  };

  const handleSaveEdit = async (id: string, updates: Partial<Transaction>) => {
    try {
      await api.updateTransaction(id, updates);
      const updated = await api.fetchTransactions();
      setTransactions(updated);
      setEditingTransaction(null);
    } catch (e) { console.error(e); }
  };

  const handleChat = async () => {
    if (!userInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: userInput, timestamp: new Date().toLocaleTimeString() };
    setChatHistory(prev => [...prev, userMsg]);
    setUserInput('');
    try {
      const res = await api.sendChatMessage(userMsg.content);
      setChatHistory(prev => [...prev, { role: 'assistant', content: res.text, timestamp: new Date().toLocaleTimeString(), references: res.references }]);
      setActiveReferences(res.references || []);
    } catch (e) { console.error(e); }
  };

  const runAnalysis = async () => {
    setIsProcessing(true);
    setAnalysisError(null);
    try {
      // Switched to all-Flash model calls in server to prevent quota issues
      const data = await api.fetchAnalysis();
      setPersona(data.persona);
      setBudgets(data.budgets);
    } catch (err: any) {
      console.error(err);
      setAnalysisError("AI busy or quota limited. Reviewing local ledger context.");
    } finally { 
      setIsProcessing(false); 
    }
  };

  const pieData = useMemo(() => {
    const groups = transactions.reduce((acc: any, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});
    return Object.keys(groups).map(k => ({ name: k, value: groups[k] }));
  }, [transactions]);

  const areaData = useMemo(() => {
    const dates = [...new Set(transactions.map(t => t.date))].sort() as string[];
    return dates.map(date => ({
      date: date.split('-').slice(1).join('/'),
      amount: transactions.filter(t => t.date === date).reduce((s, t) => s + t.amount, 0)
    }));
  }, [transactions]);

  if (!isAuthenticated) return <><Login onLogin={handleLogin} /><style>{`@keyframes shake {0%,100%{transform:translateX(0);}25%{transform:translateX(-8px);}75%{transform:translateX(8px);}}.animate-shake{animation:shake 0.4s;}.coin-float{position:absolute;animation:float 6s infinite ease-in-out;opacity:0.6;}@keyframes float{0%,100%{transform:translateY(0) rotate(0deg);}50%{transform:translateY(-20px) rotate(15deg);}}.delay-1000{animation-delay:1s;}.delay-2000{animation-delay:2s;}.delay-3000{animation-delay:3s;}.delay-1500{animation-delay:1.5s;}`}</style></>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800 antialiased overflow-hidden relative">
      <FloatingCoins />
      
      {/* Sidebar */}
      <nav className="w-full md:w-72 bg-white/80 backdrop-blur-md border-r border-slate-100 p-8 flex flex-col shrink-0 z-50">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-100"><i className="fas fa-coins text-xl text-white"></i></div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">PennyWise</h1>
            <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold">AI Dashboard</p>
          </div>
        </div>
        
        <div className="space-y-2 flex-1">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="fa-home" label="Overview" />
          <NavItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon="fa-receipt" label="Transactions" />
          <NavItem active={activeTab === 'ai-coach'} onClick={() => setActiveTab('ai-coach')} icon="fa-magic" label="AI Coach" />
        </div>

        <div className="space-y-6 mt-8">
          {health && (
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Health</span>
                <span className="text-lg font-black" style={{ color: health.color }}>{health.score}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-3">
                <div className="h-full transition-all duration-1000" style={{ width: `${health.score}%`, backgroundColor: health.color }} />
              </div>
              <p className="text-[11px] leading-tight text-slate-500 font-medium">{health.advice}</p>
            </div>
          )}
          
          <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
             <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold border border-indigo-100">MH</div>
             <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate text-slate-800">Madhu Harshitha</p>
                <button onClick={handleLogout} className="text-[10px] text-slate-400 hover:text-rose-500 transition uppercase font-black tracking-widest">Sign Out</button>
             </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative p-6 md:p-12 z-10 custom-scrollbar">
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in duration-700 slide-in-from-bottom-4 max-w-6xl mx-auto h-full flex flex-col">
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-4xl font-black text-slate-900 mb-2">My Finances</h2>
                <p className="text-slate-500 font-medium">Real-time spending analysis for Madhu Harshitha.</p>
              </div>
              <div className="flex gap-4">
                <StatCard label="Monthly Average" value={`₹${(transactions.reduce((s,t) => s+t.amount, 0) / 30).toFixed(0)}/d`} icon="fa-chart-line" color="text-indigo-600" />
                <StatCard label="Net Outflow" value={`₹${transactions.reduce((s,t) => s+t.amount, 0).toLocaleString()}`} icon="fa-wallet" color="text-emerald-600" />
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              {/* Spending Curve */}
              <div className="lg:col-span-2 bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] border border-slate-100 min-h-[480px] flex flex-col group">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-bold text-slate-800">Spending Curve</h3>
                  <div className="flex gap-1 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activity Pulse</span>
                  </div>
                </div>
                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="neatCurve" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25}/>
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" hide />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} width={45} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '13px', background: '#fff' }}
                        cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#6366f1" 
                        strokeWidth={5} 
                        fill="url(#neatCurve)" 
                        animationDuration={2500}
                        dot={{ r: 0 }}
                        activeDot={{ r: 8, fill: '#6366f1', stroke: '#fff', strokeWidth: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col min-h-[480px]">
                <h3 className="text-xl font-bold text-slate-800 mb-8 text-center">Allocation</h3>
                <div className="flex-1 relative min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={pieData} 
                        innerRadius={90} 
                        outerRadius={125} 
                        paddingAngle={8} 
                        dataKey="value"
                        stroke="none"
                        animationDuration={2000}
                      >
                        {pieData.map((e, i) => <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-3xl font-black text-slate-800 tracking-tighter">₹{(transactions.reduce((s,t) => s+t.amount, 0)/1000).toFixed(1)}k</p>
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap gap-2 justify-center">
                   {pieData.slice(0, 4).map((d, i) => (
                     <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50/80 rounded-xl border border-slate-100">
                        <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{d.name}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-600 p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6 group mb-10">
               <div className="text-center md:text-left">
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight">AI Strategy Prepared</h3>
                  <p className="text-indigo-100 font-medium">Madhu, we have optimized your ₹ spending profile with Gemini.</p>
               </div>
               <button onClick={() => setActiveTab('ai-coach')} className="w-full md:w-auto px-10 py-4 bg-white text-indigo-600 rounded-2xl font-bold shadow-xl hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-3">
                  Go to Coach <i className="fas fa-magic text-sm"></i>
               </button>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-slate-900 mb-8">Financial Journal</h2>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-10">
              <form onSubmit={handleAddTransaction} className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                   <i className="fas fa-receipt absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400"></i>
                   <input type="text" placeholder="e.g. 'Coffee at Brew 12 today'" className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" value={newRawText} onChange={(e) => setNewRawText(e.target.value)} />
                </div>
                <div className="relative w-full md:w-40">
                   <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                   <input type="number" placeholder="0" className="w-full pl-10 pr-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
                </div>
                <button disabled={isProcessing} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2">
                  {isProcessing ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-plus"></i>} Log Entry
                </button>
              </form>
            </div>
            <div className="bg-white rounded-[2.5rem] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
              <div className="p-6 bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <i className="fas fa-info-circle"></i> Tip: Select any row to refine details manually
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50/30 border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Merchant</th>
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Tags</th>
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map(t => (
                    <tr 
                      key={t.id} 
                      onClick={() => setEditingTransaction(t)}
                      className={`hover:bg-indigo-50/40 transition-colors cursor-pointer group ${activeReferences.includes(t.id) ? 'bg-indigo-50' : ''}`}
                    >
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                           <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm transition-transform group-hover:scale-110 ${t.isSubscription ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                              <i className={`fas ${t.isSubscription ? 'fa-sync-alt' : 'fa-receipt'}`}></i>
                           </div>
                           <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{t.merchant}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.date}</span>
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col gap-1.5">
                          <span className="w-fit px-3 py-1 rounded-lg bg-slate-100 text-[10px] font-bold uppercase text-slate-600 tracking-wider">{t.category}</span>
                          <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest italic">{t.necessity}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right font-black text-slate-900 text-lg">₹{t.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && (
                <div className="py-24 text-center text-slate-300 font-bold">
                   <i className="fas fa-coins text-5xl mb-6 block opacity-10"></i>
                   Your ledger is currently empty.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ai-coach' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 h-[calc(100vh-14rem)] animate-in slide-in-from-right-8 duration-500 max-w-7xl mx-auto">
            <div className="space-y-8 overflow-y-auto pr-4 custom-scrollbar">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-black text-slate-800">Coach Intelligence</h3>
                  <button onClick={runAnalysis} disabled={isProcessing} className="px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all flex items-center gap-2">
                    {isProcessing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>} Re-Evaluate
                  </button>
                </div>
                {analysisError && (
                  <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-xs font-bold flex items-center gap-3 animate-pulse">
                    <i className="fas fa-exclamation-triangle"></i> {analysisError}
                  </div>
                )}
                {!persona && !isProcessing && (
                  <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                    <i className="fas fa-magic text-3xl text-slate-200 mb-4 block"></i>
                    <p className="text-slate-400 font-bold">Tap 'Re-Evaluate' to start your personalized AI analysis.</p>
                  </div>
                )}
                {isProcessing && (
                   <div className="py-20 text-center">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-slate-500 font-bold animate-pulse">Gemini is crunching your numbers...</p>
                  </div>
                )}
                {persona && !isProcessing && (
                  <div className="p-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2.5rem] text-white mb-10 shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform duration-700"><i className="fas fa-id-badge text-8xl"></i></div>
                    <h4 className="text-2xl font-black mb-4 flex items-center gap-3 relative z-10">{persona.name}</h4>
                    <p className="opacity-90 italic mb-10 leading-relaxed font-medium relative z-10 text-lg">"{persona.justification}"</p>
                    <ul className="space-y-4 relative z-10">
                      {persona.recommendations.map((r, i) => (
                        <li key={i} className="text-sm flex gap-4 bg-white/15 p-5 rounded-2xl backdrop-blur-md border border-white/20 hover:bg-white/25 transition-all">
                           <i className="fas fa-sparkles mt-1 text-yellow-300 text-xs"></i> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {!isProcessing && budgets.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {budgets.map((b, i) => (
                      <div key={i} className="p-8 border border-slate-100 rounded-[2.5rem] bg-slate-50/50 hover:bg-white hover:border-indigo-100 transition-all group cursor-default shadow-sm hover:shadow-md">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{b.category}</p>
                        <p className="text-2xl font-black text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors">₹{b.recommendedLimit}</p>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">{b.reasoning}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
               <div className="p-8 bg-white border-b border-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner"><i className="fas fa-robot text-xl"></i></div>
                    <div>
                      <h4 className="font-black text-slate-800 tracking-tight">Madhu's AI Concierge</h4>
                      <p className="text-[10px] font-bold text-green-500 tracking-widest uppercase flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Intelligent Context Link</p>
                    </div>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/20 custom-scrollbar">
                  {chatHistory.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center px-6">
                       <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-slate-100 text-indigo-500 text-4xl"><i className="fas fa-comment-dots"></i></div>
                       <h5 className="font-black text-slate-800 text-xl mb-3">Talk to your Money</h5>
                       <p className="text-sm text-slate-400 leading-relaxed mb-10 max-w-xs font-medium">Query specific transactions or ask for a high-level summary of your ₹ patterns.</p>
                       <div className="flex flex-wrap justify-center gap-3">
                          <QuickAction label="Daily Average" onClick={() => setUserInput("Calculate my daily average spend?")} />
                          <QuickAction label="Swiggy Total" onClick={() => setUserInput("How much spent on Swiggy so far?")} />
                       </div>
                    </div>
                  )}
                  {chatHistory.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                      <div className={`max-w-[85%] p-6 rounded-3xl text-sm shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'}`}>
                        <p className="leading-relaxed font-semibold">{m.content}</p>
                        <p className={`text-[10px] mt-4 font-black opacity-40 uppercase tracking-tighter ${m.role === 'user' ? 'text-right' : 'text-left'}`}>{m.timestamp}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
               </div>
               <div className="p-8 bg-white border-t border-slate-50">
                  <div className="relative group">
                    <input type="text" placeholder="Inquire about your ledger..." className="w-full pl-6 pr-16 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold shadow-sm group-hover:shadow-md" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} />
                    <button onClick={handleChat} className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"><i className="fas fa-paper-plane text-sm"></i></button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingTransaction && (
          <EditModal 
            transaction={editingTransaction} 
            onClose={() => setEditingTransaction(null)} 
            onSave={handleSaveEdit}
          />
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar{width:6px;}.custom-scrollbar::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:20px;}
        @keyframes shake {0%,100%{transform:translateX(0);}25%{transform:translateX(-8px);}75%{transform:translateX(8px);}}
        .animate-shake{animation:shake 0.4s;}
        .coin-float{position:absolute;animation:float 7s infinite ease-in-out;opacity:0.6; pointer-events:none;}
        @keyframes float{0%,100%{transform:translateY(0) rotate(0deg);}50%{transform:translateY(-20px) rotate(20deg);}}
        .delay-1000{animation-delay:1s;}.delay-2000{animation-delay:2s;}.delay-3000{animation-delay:3s;}.delay-1500{animation-delay:1.5s;}
      `}</style>
    </div>
  );
};

export default App;
