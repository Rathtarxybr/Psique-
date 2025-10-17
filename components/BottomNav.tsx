import * as React from 'react';
// FIX: Add .ts extension to file path.
import { IconName, View } from '../types.ts';
// FIX: Add .tsx extension to file path.
import Icon from './Icon.tsx';

interface BottomNavProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isSanctuaryEnabled: boolean;
}

// FIX: Define a type for navigation items to ensure item.icon is typed as IconName.
interface NavItem {
  view: View;
  icon: IconName;
  label: string;
}

const allNavItems: NavItem[] = [
  { view: View.Today, icon: 'sun', label: 'Hoje' },
  { view: View.Academy, icon: 'academy', label: 'Academia' },
  { view: View.Library, icon: 'library', label: 'Biblioteca' },
  { view: View.Sanctuary, icon: 'breathing', label: 'Santuário' },
  { view: View.AICompanion, icon: 'sparkles', label: 'IA' },
  { view: View.Profile, icon: 'user', label: 'Perfil' },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeView, setActiveView, isSanctuaryEnabled }) => {
  const navItems = React.useMemo(() => {
    return allNavItems.filter(item => isSanctuaryEnabled || item.view !== View.Sanctuary);
  }, [isSanctuaryEnabled]);

  return (
    // Use padding on the nav to create the "floating" effect
    <nav className="fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-4">
      {/* The main container with background, border, etc. */}
      <div className="flex max-w-md mx-auto h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-300/20 dark:shadow-black/20">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              // flex-1 is the key for equal spacing. The parent has no padding. This guarantees centering.
              className="group relative flex-1 flex flex-col items-center justify-center text-center transition-transform duration-200 ease-in-out hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 focus-visible:ring-blue-500 rounded-lg"
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active state pill */}
              <div
                className={`absolute inset-2 sm:inset-3 rounded-xl transition-all duration-300 ease-out ${isActive ? 'bg-blue-100 dark:bg-blue-500/20 opacity-100 scale-100' : 'opacity-0 scale-90'}`}
              />

              <div className="relative z-10 flex flex-col items-center">
                <Icon
                  name={item.icon}
                  className={`w-6 h-6 mb-1 transition-colors duration-300
                  ${isActive 
                    ? 'text-blue-500 dark:text-blue-400' 
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                  }`}
                />
                <span
                  className={`text-xs font-semibold transition-colors duration-300
                  ${isActive 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-slate-500 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;