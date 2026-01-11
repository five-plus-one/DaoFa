
import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, label }) => {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1 text-[10px] font-black uppercase text-slate-400 tracking-widest">
        <span>{label || '进度'}</span>
        <span>{current} / {total} ({percentage}%)</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-50">
        <div 
          className="bg-red-500 h-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
