import * as React from 'react';
// FIX: Add .ts extension to file path.
import { IconName, View } from '../types.ts';
// FIX: Add .tsx extension to file path.
import Icon from './Icon.tsx';

interface BottomNavProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

// FIX: Define a type for navigation items to ensure item.icon is typed as IconName.
interface NavItem {
  view: View;
  icon: IconName;
  label: string;
}

const navItems: NavItem[] = [
  { view: View.Today, icon: 'sun', label: 'Hoje' },
  { view: View.Academy, icon: 'academy', label: 'Academia' },
  { view: View.Library, icon: 'library', label: 'Biblioteca' },
  { view: View.Sanctuary, icon: 'breathing', label: 'Santuário' },
  { view: View.AICompanion, icon: 'sparkles', label: 'IA' },
  { view: View.Profile, icon: 'user', label: 'Perfil' },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeView, setActiveView }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-t-lg z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`flex flex-1 flex-col items-center justify-center text-xs sm:text-sm font-medium transition-colors duration-200 ${
                activeView === item.view
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400'
              }`}
            >
              <Icon name={item.icon} className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;