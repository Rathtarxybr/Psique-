import * as React from 'react';
// FIX: Add .ts extension to file path.
import { Subject } from '../types.ts';
// FIX: Add .tsx extension to file path.
import Icon from './Icon.tsx';
// FIX: Add .ts extension to file path.
import { answerFromSubjects } from '../services/geminiService.ts';
import MarkdownRenderer from './MarkdownRenderer.tsx';

interface AIStudyAssistantProps {
    subjects: Subject[];
}

const AIStudyAssistant: React.FC<AIStudyAssistantProps> = ({ subjects }) => {
    const [query, setQuery] = React.useState('');
    const [answer, setAnswer] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError('');
        setAnswer('');

        try {
            const result = await answerFromSubjects(query, subjects);
            setAnswer(result);
        } catch (err) {
            setError('Ocorreu um erro ao buscar a resposta.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-300 mb-4 flex items-center">
                <Icon name="brainCircuit" className="w-6 h-6 mr-2 text-purple-500" />
                Assistente de Estudos IA
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Faça uma pergunta e a IA buscará a resposta em todas as suas anotações da Academia.
            </p>

            <form onSubmit={handleSearch}>
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ex: O que é o Id segundo Freud?"
                        className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 focus:ring-purple-500 rounded-lg py-3 pl-4 pr-12"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-purple-500 text-white hover:bg-purple-600 disabled:bg-slate-400"
                    >
                        <Icon name={isLoading ? 'loader' : 'search'} className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </form>

            {error && <p className="text-red-500 mt-4">{error}</p>}
            
            {answer && (
                <div className="mt-6 prose prose-slate dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                   <MarkdownRenderer content={answer} />
                </div>
            )}
        </div>
    );
};

export default AIStudyAssistant;