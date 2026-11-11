import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

export const StatCard = ({ title, value, subtitle, changePercent, trend, icon: Icon, color = 'indigo' }) => {
  const colorStyles = {
    indigo: 'from-indigo-600 to-violet-600 shadow-glow-primary text-white',
    emerald: 'from-emerald-500 to-teal-600 shadow-glow-emerald text-white',
    amber: 'from-amber-500 to-orange-600 shadow-glow-amber text-white',
    rose: 'from-rose-500 to-pink-600 shadow-glow-rose text-white',
    cyan: 'from-cyan-500 to-blue-600 shadow-glow-cyan text-white'
  };

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="glass-card relative overflow-hidden rounded-3xl p-5 sm:p-6 border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 bg-[#0c1222]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">{value}</h3>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>
        
        {Icon && (
          <div className={clsx("p-3 rounded-2xl bg-gradient-to-br flex items-center justify-center", colorStyles[color] || colorStyles.indigo)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {changePercent !== undefined && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          {trend === 'up' && (
            <span className="flex items-center text-emerald-400 font-bold">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              +{changePercent}%
            </span>
          )}
          {trend === 'down' && (
            <span className="flex items-center text-slate-400 font-medium">
              <TrendingDown className="w-3.5 h-3.5 mr-1" />
              {changePercent}%
            </span>
          )}
          {trend === 'neutral' && (
            <span className="flex items-center text-slate-400 font-medium">
              <Minus className="w-3.5 h-3.5 mr-1" />
              0%
            </span>
          )}
          <span className="text-slate-500 font-mono text-[11px]">vs manual baseline</span>
        </div>
      )}
    </motion.div>
  );
};

