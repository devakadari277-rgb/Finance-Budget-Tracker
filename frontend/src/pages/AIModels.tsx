import React, { useState } from 'react';
import { Brain, TrendingUp, Filter, MessageSquare, Image, Users, Layers, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const AIModels: React.FC = () => {
  const models = [
    { title: 'Regression Models', desc: 'Predict continuous numerical values like house prices or savings.', icon: <TrendingUp className="text-blue-400" />, type: 'Supervised' },
    { title: 'Classification Models', desc: 'Categorize data into groups like Spam vs. Not Spam.', icon: <Filter className="text-green-400" />, type: 'Supervised' },
    { title: 'NLP (Text AI)', desc: 'Understand and generate human language using GPT-4 and BERT.', icon: <MessageSquare className="text-purple-400" />, type: 'Deep Learning' },
    { title: 'Generative Models', desc: 'Create new data like images (DALL·E) or synthetic text.', icon: <Image className="text-pink-400" />, type: 'Generative' },
    { title: 'Clustering Models', desc: 'Group similar items together like customer segments.', icon: <Users className="text-orange-400" />, type: 'Unsupervised' },
    { title: 'Sequence Models', desc: 'Handle time-series data using RNN, LSTM, and GRU.', icon: <Layers className="text-yellow-400" />, type: 'Deep Learning' },
    { title: 'Ensemble Models', desc: 'Combine multiple models for superior accuracy (XGBoost).', icon: <Zap className="text-red-400" />, type: 'Advanced' },
    { title: 'Reinforcement Learning', desc: 'Train agents to make sequences of decisions (Q-Learning).', icon: <Brain className="text-indigo-400" />, type: 'Advanced' },
  ];

  return (
    <div className="animate-fade">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI & Machine Learning Hub</h1>
        <p className="text-slate-400">Explore and interact with advanced models integrated into your financial ecosystem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {models.map((model, i) => (
          <motion.div 
            key={model.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="card group cursor-pointer border-slate-700/50 hover:border-indigo-500/50"
          >
            <div className="mb-4 p-3 bg-slate-900 rounded-xl w-fit group-hover:scale-110 transition-transform">
              {model.icon}
            </div>
            <div className="mb-3">
              <span className="text-xs font-semibold px-2 py-1 bg-slate-800 text-slate-400 rounded-full uppercase tracking-wider">
                {model.type}
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-400 transition-colors">{model.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{model.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AIModels;
