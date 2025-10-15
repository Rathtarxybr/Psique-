import * as React from 'react';
// FIX: Add .tsx extension to file path.
import { useTheme } from '../contexts/ThemeContext.tsx';
// FIX: Add .tsx extension to file path.
import Icon from './Icon.tsx';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center h-8 w-14 rounded-full transition-colors duration-300 bg-gray-200 dark:bg-gray-700"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span
        className={`absolute inline-flex items-center justify-center h-6 w-6 rounded-full bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ${
          theme === 'light' ? 'translate-x-1' : 'translate-x-7'
        }`}
      >
        {theme === 'light' ? (
          <Icon name="sun" className="w-4 h-4 text-yellow-500" />
        ) : (
          <Icon name="moon" className="w-4 h-4 text-blue-400" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;