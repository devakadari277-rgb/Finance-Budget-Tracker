import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Sparkles } from 'lucide-react';
import api from '../services/api';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ income: 0, expense: 0, savings: 0 });

  useEffect(() => {
    // Mock data for initial preview while backend is maturing
    const mockData = [
      { name: 'Jan', income: 4000, expense: 2400 },
      { name: 'Feb', income: 3000, expense: 1398 },
      { name: 'Mar', income: 2000, expense: 9800 },
      { name: 'Apr', income: 2780, expense: 3908 },
      { name: 'May', income: 1890, expense: 4800 },
      { name: 'Jun', income: 2390, expense: 3800 },
    ];
    setData(mockData);
    setStats({ income: 12450, expense: 8200, savings: 4250 });
  }, []);

  return (
    <div className="animate-fade">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Welcome back!</h1>
          <p className="text-slate-400">Here's what's happening with your finances today.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Sparkles size={18} />
          <span>Get AI Insight</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card border-l-4 border-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-400 font-medium mb-1">Total Income</p>
              <h3 className="text-2xl font-bold">${stats.income.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <ArrowUpRight size={20} />
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-rose-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-400 font-medium mb-1">Total Expenses</p>
              <h3 className="text-2xl font-bold">${stats.expense.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
              <ArrowDownRight size={20} />
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-indigo-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-400 font-medium mb-1">Smart Savings</p>
              <h3 className="text-2xl font-bold">${stats.savings.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <Wallet size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-400" />
            Financial Trend
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="income" stroke="#6366f1" fillOpacity={1} fill="url(#colorInc)" strokeWidth={3} />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
            <h3 className="text-lg font-bold mb-6">Recent AI Predictions</h3>
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                            <Brain size={20} className="text-indigo-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">Linear Regression Model</p>
                            <p className="text-xs text-slate-400">Predicted savings for next month: <span className="text-emerald-400">+$420</span></p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
