import React from 'react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  isSyncing: boolean;
  lastSynced: string;
  onRefresh: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isSyncing, lastSynced, onRefresh }) => {
  const menuItems: { id: AppView; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'transactions', label: 'Transactions', icon: '💳' },
    { id: 'chat', label: 'PennyWise AI', icon: '🤖' },
    { id: 'budget', label: 'Smart Budget', icon: '🎯' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-100 h-screen fixed left-0 top-0 flex flex-col z-40">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">
            P
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">PennyWise</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
              currentView === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
            }`}
          >
            <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="font-bold text-sm tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto">
         <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <div className="flex justify-between items-center mb-3">
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</span>
               <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-ping' : 'bg-green-400'}`}></div>
            </div>
            <p className="text-xs font-bold text-slate-600 mb-4">
               {isSyncing ? 'Syncing...' : 'All Systems Operational'}
            </p>
            <button 
               onClick={onRefresh}
               disabled={isSyncing}
               className="w-full py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50"
            >
               {isSyncing ? 'Updating...' : 'Refresh Data'}
            </button>
            <div className="mt-3 text-center">
               <span className="text-[9px] text-slate-400 font-medium">Last synced: {lastSynced}</span>
            </div>
         </div>
      </div>
    </aside>
  );
};

export default Sidebar;
