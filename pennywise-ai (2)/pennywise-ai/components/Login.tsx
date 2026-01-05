
import React, { useState } from 'react';

interface Props {
  onLogin: () => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simplified login: Only check for the authorized password "pennywise"
    if (password === 'pennywise') {
      localStorage.setItem('pennywise_auth', 'true');
      localStorage.setItem('pennywise_user_name', 'Madhu Harshitha');
      onLogin();
    } else {
      setError('Invalid password. Access denied.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-blue-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white font-black text-3xl mx-auto mb-4 backdrop-blur-sm">
            P
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">PennyWise AI</h1>
          <p className="text-blue-100 text-sm mt-1">Authorized Access for Madhu Harshitha</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium border border-red-100">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Secure Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
          >
            Access Dashboard
          </button>

          <p className="text-center text-slate-400 text-[10px] uppercase font-bold tracking-widest">
            Identity Verified: Madhu Harshitha
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
