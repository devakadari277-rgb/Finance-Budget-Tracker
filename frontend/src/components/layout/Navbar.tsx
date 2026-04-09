import React from 'react';
import { LayoutDashboard, Brain, PieChart, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'AI Models', path: '/ai-models', icon: <Brain size={20} /> },
    { name: 'Analytics', path: '/analytics', icon: <PieChart size={20} /> },
  ];

  if (!user) return null;

  return (
    <nav className="glass fixed left-0 top-0 h-full w-64 p-6 flex flex-col justify-between border-r border-slate-800">
      <div>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white">F</div>
          <span className="text-xl font-bold tracking-tight">Finance Intel</span>
        </div>
        
        <div className="space-y-2">
          {links.map(link => (
            <Link 
              key={link.path} 
              to={link.path}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                location.pathname === link.path ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {link.icon}
              <span className="font-medium">{link.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 p-3 mb-6 bg-slate-800/50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
            {user.name?.[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold truncate">{user.name}</p>
            <p className="text-sm text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="flex items-center gap-3 p-3 w-full text-slate-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
