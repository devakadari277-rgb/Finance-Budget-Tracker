import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { UserPlus, Mail, Lock, User, Loader2 } from 'lucide-react';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/users/register', { name, email, password });
      const loginRes = await api.post('/users/login', { email, password });
      login(loginRes.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-white text-2xl mx-auto mb-4">F</div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-slate-400">Join Finance Intel to supercharge your savings</p>
        </div>

        {error && <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" required value={name} onChange={e => setName(e.target.value)}
                className="input pl-10" placeholder="John Doe"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="input pl-10" placeholder="name@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="input pl-10" placeholder="••••••••"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
            Create Account
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-slate-400">
          Already have an account? <Link to="/login" className="text-indigo-400 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
