
import React from 'react';

interface ProficiencyButtonProps {
  level: number;
  onClick: () => void;
  label: string;
}

export const ProficiencyButton: React.FC<ProficiencyButtonProps> = ({ level, onClick, label }) => {
  const colors = [
    'bg-slate-100 text-slate-400', // 0
    'bg-red-50 text-red-600 border-red-200 hover:bg-red-100', // 1
    'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100', // 2
    'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100', // 3
    'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100', // 4
    'bg-green-50 text-green-600 border-green-200 hover:bg-green-100', // 5
  ];

  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-1 group ${colors[level]}`}
    >
      <span className="text-xl font-bold">{level}</span>
      <span className="text-xs font-medium opacity-80">{label}</span>
    </button>
  );
};
