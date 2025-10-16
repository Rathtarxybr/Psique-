import * as React from 'react';
// FIX: Add .ts extension to file path.
import { IconName, JournalEntry, LibraryDocument, Subject, Suggestion, View } from '../../types.ts';
// FIX: Add .ts extension to file path.
import { getDailySuggestions } from '../../services/suggestionService.ts';
// FIX: Add .tsx extension to file path.
import Icon from '../Icon.tsx';
// FIX: Add .tsx extension to file path.
import DashboardCard from '../DashboardCard.tsx';
import AIStudyAssistant from '../AIStudyAssistant.tsx';

interface TodayViewProps {
  userName: string;
  journalEntries: JournalEntry[];
  documents: LibraryDocument[];
  subjects: Subject[];
  setActiveView: (view: View) => void;
}

// FIX: Define a type for dashboard items to ensure item.icon is typed as IconName.
interface DashboardItem {
  icon: IconName;
  title: string;
  description: string;
  module: View;
  colorClass: string;
}

const TodayView: React.FC<TodayViewProps> = ({ userName, journalEntries, documents, subjects, setActiveView }) => {
  const greeting = `Olá, ${userName}`;

  const dashboardItems: DashboardItem[] = [
    {
      icon: 'breathing',
      title: 'Santuário',
      description: 'Seu espaço para introspecção, meditação e escrita terapêutica.',
      module: View.Sanctuary,
      colorClass: 'text-green-500 bg-green-100 dark:bg-green-900/50',
    },
    {
      icon: 'academy',
      title: 'Academia',
      description: 'Aprofunde seu conhecimento com trilhas de estudo e anotações.',
      module: View.Academy,
      colorClass: 'text-purple-500 bg-purple-100 dark:bg-purple-900/50',
    },
    {
      icon: 'library',
      title: 'Biblioteca',
      description: 'Construa sua coleção pessoal de livros e artigos.',
      module: View.Library,
      colorClass: 'text-blue-500 bg-blue-100 dark:bg-blue-900/50',
    },
    {
      icon: 'sparkles',
      title: 'Companheiro IA',
      description: 'Converse com sua IA para obter insights personalizados.',
      module: View.AICompanion,
      colorClass: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/50',
    },
  ];

  return (
    <div className="pt-12 animate-fadeIn">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{greeting}</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mt-2">Pronto para mais um dia de descobertas?</p>
      </header>
      
      <section className="mb-12">
        <AIStudyAssistant subjects={subjects} />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-300 mb-4">Módulos Principais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {dashboardItems.map(item => (
            <DashboardCard
              key={item.module + item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
              onClick={() => setActiveView(item.module)}
              colorClass={item.colorClass}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default TodayView;