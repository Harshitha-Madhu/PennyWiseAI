import { CATEGORY_EMOJIS } from '../constants';
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Transaction, SpendingPersona, FinancialHealth } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  persona: SpendingPersona | null;
  health: FinancialHealth | null;
  isSyncing: boolean;
}

const formatINR = (val: number) => new Intl.NumberFormat('en-IN').format(val);

const Dashboard: React.FC<DashboardProps> = ({ transactions, persona, health, isSyncing }) => {
  const categoryTotals = transactions.reduce((acc: Record<string, number>, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
  const COLORS = ['#2563eb', '#4f46e5', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const scoreColor = health ? (health.score > 70 ? 'text-green-500' : health.score > 40 ? 'text-blue-500' : 'text-red-500') : 'text-slate-400';

  // Real-time Semantic Calculation
  const needsTotal = transactions.filter(t => t.necessity === 'Need').reduce((sum, t) => sum + t.amount, 0);
  const wantsTotal = transactions.filter(t => t.necessity === 'Want').reduce((sum, t) => sum + t.amount, 0);
  const savingsTotal = transactions.filter(t => t.necessity === 'Savings').reduce((sum, t) => sum + t.amount, 0);

  const pNeeds = totalSpent > 0 ? Math.round((needsTotal / totalSpent) * 100) : 0;
  const pWants = totalSpent > 0 ? Math.round((wantsTotal / totalSpent) * 100) : 0;
  // If savings track is not explicit in transactions (usually it's a transfer), fallback to persona or remaining logic. 
  // For now, let's trust the 'Savings' tag if users tag it, otherwise 100 - pNeeds - pWants might be unallocated.
  const pSavings = totalSpent > 0 ? Math.round((savingsTotal / totalSpent) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* AI Pulse Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-50/50">
        <div className="flex items-center gap-6 mb-4 md:mb-0">
          <div className={`w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-blue-200 transition-transform hover:rotate-6 ${isSyncing ? 'animate-pulse' : ''}`}>₹</div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Madhu's AI Pulse</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Active Analysis Session</p>
            </div>
          </div>
        </div>
        <div className="flex gap-8 items-center">
          <div className="text-center md:text-right">
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Financial Health</div>
            <div className={`text-4xl font-black ${scoreColor}`}>{isSyncing ? '--' : `${health?.score || 0}%`}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">{health?.status || 'Calculating...'}</div>
          </div>
          <div className="h-12 w-px bg-slate-100 hidden md:block"></div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Monthly Flow</div>
            <div className="text-4xl font-black text-slate-900">₹{formatINR(totalSpent)}</div>
            <div className="text-[10px] font-bold text-blue-500 uppercase">Live Update</div>
          </div>
        </div>
      </header>

      {/* Ticker Insight */}
      <div className="bg-slate-900 text-white py-3 px-6 rounded-2xl overflow-hidden flex items-center shadow-lg relative">
        <div className="absolute left-0 top-0 bottom-0 bg-blue-600 px-4 flex items-center font-bold text-xs uppercase tracking-widest z-10">Insight</div>
        <div className="flex-1 whitespace-nowrap animate-marquee pl-24">
          <span className="mx-8 font-medium">✨ {health?.tip || "Analyzing your recent transactions..."}</span>
          <span className="mx-8 font-medium">🚀 Persona detected: {persona?.name || "Tuning spending model..."}</span>
          <span className="mx-8 font-medium">💡 Pro Tip: Reducing "Wants" this week could boost your health score by 5%.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identity Hero */}
        <article className="lg:col-span-2 bg-gradient-to-br from-blue-700 via-indigo-600 to-indigo-800 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-white/10 backdrop-blur-xl border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Spending Identity</span>
              {isSyncing && <span className="text-[10px] font-bold animate-pulse text-blue-200">AI IS THINKING...</span>}
            </div>
            <h3 className="text-6xl font-black mb-6 tracking-tighter">{persona?.name || "Initializing..."}</h3>
            <p className="max-w-xl text-blue-50/90 text-xl leading-relaxed font-medium italic mb-10">"{persona?.justification || "Wait while I observe your emotional connection with money..."}"</p>
            <div className="mt-auto grid grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-md">
                <div className="text-[10px] text-blue-200 font-black uppercase tracking-widest mb-2">Needs</div>
                <div className="text-4xl font-black">{pNeeds}%</div>
                <div className="text-xs text-blue-300">₹{formatINR(needsTotal)}</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-md">
                <div className="text-[10px] text-blue-200 font-black uppercase tracking-widest mb-2">Wants</div>
                <div className="text-4xl font-black">{pWants}%</div>
                <div className="text-xs text-blue-300">₹{formatINR(wantsTotal)}</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-md">
                <div className="text-[10px] text-blue-200 font-black uppercase tracking-widest mb-2">Savings</div>
                <div className="text-4xl font-black">{pSavings}%</div>
                <div className="text-xs text-blue-300">₹{formatINR(savingsTotal)}</div>
              </div>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 opacity-5 pointer-events-none scale-150 transform rotate-12 transition-transform group-hover:rotate-0 duration-1000">
            <span className="text-[300px] font-black">₹</span>
          </div>
        </article>

        {/* Allocation Chart */}
        <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col min-w-0">
          <h3 className="font-black text-slate-800 mb-8 flex items-center gap-3">
            <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
            Allocation
          </h3>
          <div className="flex-1 w-full min-h-[250px] relative flex flex-col items-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData.length > 0 ? pieData : [{ name: 'Empty', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  {pieData.length === 0 && <Cell fill="#f1f5f9" />}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Custom Legend */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center mt-4 px-4">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span>{CATEGORY_EMOJIS[entry.name] || '📦'} {entry.name}</span>
                </div>
              ))}
            </div>

          </div>
        </section>
      </div>

      {/* Trends Section */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-1 gap-6">
        <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 mb-8 flex items-center gap-3">
            <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
            Daily Spending Trend
          </h3>
          <div className="w-full h-[300px]">
            <DailySpendingChart transactions={transactions} />
          </div>
        </section>
      </div>
    </div>
  );
};

const DailySpendingChart: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const dailyData = transactions.reduce((acc: Record<string, number>, t) => {
    acc[t.date] = (acc[t.date] || 0) + t.amount;
    return acc;
  }, {});

  const data = Object.entries(dailyData)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      amount
    }))
    .slice(-7); // Last 7 active days

  return (
    <div style={{ width: '100%', height: 300, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={40}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ fontWeight: 'bold', color: '#4f46e5' }}
            formatter={(value: number) => [`₹${value}`, 'Spent']}
          />
          <Bar dataKey="amount" fill="#6366f1" radius={[10, 10, 10, 10]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};


export default Dashboard;