
import React from 'react';

interface Props {
  onLogout: () => void;
}

const Navbar: React.FC<Props> = ({ onLogout }) => {
  const userName = localStorage.getItem('pennywise_user_name') || 'Madhu Harshitha';

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-200">
              P
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">PennyWise <span className="text-blue-600">AI</span></span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs font-black text-slate-900 leading-none">{userName}</span>
              <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">Premium Account</span>
            </div>
            <button 
              onClick={onLogout}
              className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors border border-slate-200 px-3 py-1.5 rounded-lg"
            >
              Sign Out
            </button>
            <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 shadow-sm overflow-hidden p-0.5">
               <img src="https://ui-avatars.com/api/?name=Madhu+Harshitha&background=2563eb&color=fff" alt="Avatar" className="rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
