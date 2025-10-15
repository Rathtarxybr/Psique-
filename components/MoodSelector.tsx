import * as React from 'react';
// FIX: Use MoodValue for the string literal type.
// FIX: Add .ts extension to file path.
import { MoodValue } from '../types.ts';
// FIX: Add .tsx extension to file path.
import Icon from './Icon.tsx';

interface MoodSelectorProps {
  // FIX: Use MoodValue for the string literal type.
  selectedMood: MoodValue | null;
  onSelectMood: (mood: MoodValue) => void;
}

// FIX: Use MoodValue for the mood property type.
const moods: { mood: MoodValue; label: string; icon: React.ReactNode }[] = [
  { mood: 'radiant', label: 'Radiante', icon: <span className="text-4xl">😁</span> },
  { mood: 'good', label: 'Bem', icon: <span className="text-4xl">😊</span> },
  { mood: 'meh', label: 'Ok', icon: <span className="text-4xl">😐</span> },
  { mood: 'bad', label: 'Mal', icon: <span className="text-4xl">😕</span> },
  { mood: 'awful', label: 'Péssimo', icon: <span className="text-4xl">😢</span> },
];

// FIX: Use MoodValue as the key for the record.
const moodColors: Record<MoodValue, string> = {
    radiant: 'border-yellow-400 bg-yellow-400/10',
    good: 'border-green-400 bg-green-400/10',
    meh: 'border-blue-400 bg-blue-400/10',
    bad: 'border-purple-400 bg-purple-400/10',
    awful: 'border-slate-400 bg-slate-400/10',
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onSelectMood }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 text-center">Como você está se sentindo?</h3>
      <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-4 sm:flex-nowrap sm:justify-around">
        {moods.map(({ mood, label, icon }) => (
          <button
            key={mood}
            onClick={() => onSelectMood(mood)}
            className={`flex flex-col items-center p-3 rounded-full transition-all duration-200 transform hover:scale-110 ${
              selectedMood === mood ? `scale-110 border-2 ${moodColors[mood]}` : 'opacity-70 hover:opacity-100'
            }`}
            aria-label={label}
          >
            {icon}
            <span className={`mt-2 text-xs font-semibold ${selectedMood === mood ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500'}`}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;