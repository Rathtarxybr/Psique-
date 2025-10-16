import * as React from 'react';
import { JournalEntry, MoodValue } from '../../types.ts';
import Icon from '../Icon.tsx';

interface JournalViewProps {
    entries: JournalEntry[];
    onDayClick: (date: Date) => void;
}

const moodToEmoji = (mood: MoodValue) => {
    const map: Record<MoodValue, string> = { radiant: '😁', good: '😊', meh: '😐', bad: '😕', awful: '😢' };
    return map[mood];
};

const JournalView: React.FC<JournalViewProps> = ({ entries, onDayClick }) => {
    const [currentDate, setCurrentDate] = React.useState(new Date());

    const entriesMap = React.useMemo(() => {
        const map = new Map<string, JournalEntry>();
        entries.forEach(entry => {
            const entryDate = new Date(entry.date);
            const key = `${entryDate.getFullYear()}-${entryDate.getMonth()}-${entryDate.getDate()}`;
            map.set(key, entry);
        });
        return map;
    }, [entries]);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDayOfWeek = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();

    const calendarDays = [];
    // Previous month's days
    for (let i = 0; i < startDayOfWeek; i++) {
        const date = new Date(startOfMonth);
        date.setDate(date.getDate() - (startDayOfWeek - i));
        calendarDays.push({ date, isCurrentMonth: false });
    }
    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        calendarDays.push({ date, isCurrentMonth: true });
    }
    // Next month's days
    const remainingCells = 42 - calendarDays.length; // 6 weeks grid
    for (let i = 1; i <= remainingCells; i++) {
        const date = new Date(endOfMonth);
        date.setDate(date.getDate() + i);
        calendarDays.push({ date, isCurrentMonth: false });
    }

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const today = new Date();

    return (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-6">
            <header className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Icon name="chevronLeft" className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-semibold">
                    {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={nextMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Icon name="arrowRight" className="w-6 h-6" />
                </button>
            </header>
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => <div key={i}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(({ date, isCurrentMonth }, index) => {
                    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                    const entry = entriesMap.get(key);
                    const isToday = date.toDateString() === today.toDateString();

                    return (
                        <div
                            key={index}
                            onClick={() => onDayClick(date)}
                            className={`h-20 sm:h-24 rounded-lg p-2 text-left transition-colors cursor-pointer flex flex-col
                                ${isCurrentMonth ? 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800' : 'text-slate-400 dark:text-slate-600'}
                                ${isToday ? 'border-2 border-green-500' : ''}
                            `}
                        >
                            <span className={`font-semibold ${isToday ? 'text-green-600 dark:text-green-400' : ''}`}>
                                {date.getDate()}
                            </span>
                            {entry && (
                                <span className="mt-auto text-2xl self-center">{moodToEmoji(entry.mood)}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default JournalView;