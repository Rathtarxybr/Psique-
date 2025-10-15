import * as React from 'react';
// FIX: Add .ts extension to file path.
import { IconName } from '../types.ts';
// FIX: Add .tsx extension to file path.
import Icon from './Icon.tsx';

interface DashboardCardProps {
  icon: IconName;
  title: string;
  description: string;
  onClick: () => void;
  colorClass: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, description, onClick, colorClass }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col group relative cursor-pointer hover:border-blue-400/50 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClass}`}>
        <Icon name={icon} className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm flex-grow">{description}</p>
      <div className="mt-4">
        <span className="text-sm font-semibold text-blue-500 dark:text-blue-400 flex items-center group-hover:underline">
          Acessar
          <Icon name="arrowRight" className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </div>
  );
};

export default DashboardCard;