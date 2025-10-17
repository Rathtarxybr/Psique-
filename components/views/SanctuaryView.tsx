import * as React from 'react';
// FIX: Import MoodValue instead of Mood.
// FIX: Add .ts extension to file path.
import { JournalEntry, MoodValue, LibraryDocument } from '../../types.ts';
// FIX: Add .tsx extension to file path.
import Icon from '../Icon.tsx';
// FIX: Add .tsx extension to file path.
import Modal from '../Modal.tsx';
// FIX: Add .tsx extension to file path.
import JournalView from './JournalView.tsx';
import { stripHtml } from '../../utils/textUtils.ts';
import { generateJournalReflection } from '../../services/geminiService.ts';
import AIProgressBar from '../AIProgressBar.tsx';
import MarkdownRenderer from '../MarkdownRenderer.tsx';
import { saveDocumentContent } from '../../utils/db.ts';
import { marked } from 'marked';

type SanctuaryViewMode = 'list' | 'calendar';

interface SanctuaryViewProps {
    entries: JournalEntry[];
    setEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
    setSelectedEntry: (entry: JournalEntry | null) => void;
    setDocuments: React.Dispatch<React.SetStateAction<LibraryDocument[]>>;
}

// FIX: Update function signature and map to use MoodValue.
const moodToEmoji = (mood: MoodValue) => {
    const map: Record<MoodValue, string> = { radiant: '😁', good: '😊', meh: '😐', bad: '😕', awful: '😢'};
    return map[mood];
}

const SanctuaryView: React.FC<SanctuaryViewProps> = ({ entries, setEntries, setSelectedEntry, setDocuments }) => {
    const [entryToDelete, setEntryToDelete] = React.useState<JournalEntry | null>(null);
    const [viewMode, setViewMode] = React.useState<SanctuaryViewMode>('list');
    const [isReflectionModalOpen, setIsReflectionModalOpen] = React.useState(false);
    const [reflectionContent, setReflectionContent] = React.useState('');
    const [isGeneratingReflection, setIsGeneratingReflection] = React.useState(false);

    
    const handleDelete = () => {
        if (!entryToDelete) return;
        setEntries(entries.filter(e => e.id !== entryToDelete.id));
        setEntryToDelete(null);
    }

    const handleDayClick = (date: Date) => {
        const existingEntry = entries.find(e => {
            const entryDate = new Date(e.date);
            return entryDate.getFullYear() === date.getFullYear() &&
                   entryDate.getMonth() === date.getMonth() &&
                   entryDate.getDate() === date.getDate();
        });

        if (existingEntry) {
            setSelectedEntry(existingEntry);
        } else {
            setSelectedEntry({
                id: new Date().toISOString(),
                date: date.toISOString(),
                mood: 'good',
                title: '',
                content: ''
            });
        }
    };

    const handleNewEntry = () => {
        setSelectedEntry({
            id: new Date().toISOString(),
            date: new Date().toISOString(),
            mood: 'good',
            title: '',
            content: '',
        });
    };
    
    const handleGenerateReflection = async () => {
        setIsGeneratingReflection(true);
        setReflectionContent('');
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentEntries = entries.filter(e => new Date(e.date) >= oneWeekAgo);

        if (recentEntries.length < 2) {
            setReflectionContent("## Insights Indisponíveis\n\nNão há entradas suficientes na última semana para gerar uma reflexão significativa. Tente escrever um pouco mais e volte em breve!");
            setIsGeneratingReflection(false);
            return;
        }

        try {
            const reflection = await generateJournalReflection(recentEntries);
            setReflectionContent(reflection);
        } catch (error) {
            console.error("Failed to generate reflection:", error);
            setReflectionContent("## Erro na Geração\n\nDesculpe, ocorreu um erro ao gerar sua reflexão. Por favor, tente novamente mais tarde.");
        } finally {
            setIsGeneratingReflection(false);
        }
    };
    
    const handleOpenReflectionModal = () => {
        setIsReflectionModalOpen(true);
        handleGenerateReflection();
    };
    
    const handleSaveReflectionAsNote = async () => {
        if (!reflectionContent) return;
        const date = new Date().toLocaleDateString('pt-BR');
        const noteTitle = `Reflexão Semanal - ${date}`;
        const docId = `note-${new Date().toISOString()}`;
        const parsedHtml = await marked.parse(reflectionContent);

        const newDoc: LibraryDocument = {
            id: docId,
            name: noteTitle,
            type: 'note',
            createdAt: new Date().toISOString(),
        };
        await saveDocumentContent(docId, parsedHtml, '');
        setDocuments(prev => [newDoc, ...prev]);
        setIsReflectionModalOpen(false);
    };


    return (
        <div className="pt-12">
            <header className="mb-8">
                 <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Santuário</h1>
                        <p className="text-lg text-slate-500 dark:text-slate-400 mt-2">Seu refúgio para reflexão e escrita.</p>
                    </div>
                    <div className="flex items-center space-x-4">
                         <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}><Icon name="list" className="w-5 h-5"/></button>
                            <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}><Icon name="calendar" className="w-5 h-5"/></button>
                        </div>
                        <button onClick={handleOpenReflectionModal} className="bg-purple-500 text-white font-semibold py-3 px-3 sm:px-5 rounded-xl hover:bg-purple-600 transition-colors flex items-center space-x-2">
                            <Icon name="brain" className="w-5 h-5" />
                            <span className="hidden sm:inline">Reflexão IA</span>
                        </button>
                        <button onClick={handleNewEntry} className="bg-green-500 text-white font-semibold py-3 px-3 sm:px-5 rounded-xl hover:bg-green-600 transition-colors flex items-center space-x-2">
                            <Icon name="feather" className="w-5 h-5" />
                            <span className="hidden sm:inline">Nova Entrada</span>
                        </button>
                    </div>
                </div>
            </header>
            
            <section>
                {viewMode === 'list' ? (
                    <div className="space-y-4">
                        {entries.length > 0 ? entries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
                            <div key={entry.id} onClick={() => setSelectedEntry(entry)} className="group bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex items-start space-x-4 cursor-pointer hover:border-green-400/50 transition-colors">
                               <div className="text-2xl pt-1">{moodToEmoji(entry.mood)}</div>
                               <div className="flex-grow min-w-0">
                                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{entry.title || 'Entrada sem título'}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(entry.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric'})}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 truncate">{stripHtml(entry.content)}</p>
                               </div>
                               <button onClick={(e) => { e.stopPropagation(); setEntryToDelete(entry); }} className="p-1.5 text-slate-400 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon name="trash" className="w-5 h-5" />
                               </button>
                            </div>
                        )) : (
                            <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-lg">
                                <Icon name="feather" className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
                                <h2 className="mt-4 text-lg font-semibold text-slate-600 dark:text-slate-400">Nenhuma entrada no diário</h2>
                                <p className="text-slate-500 dark:text-slate-500 mt-1">Clique em "Nova Entrada" para começar a escrever.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <JournalView entries={entries} onDayClick={handleDayClick} />
                )}
            </section>
            
             <Modal isOpen={!!entryToDelete} onClose={() => setEntryToDelete(null)} title="Confirmar Exclusão">
                <p className="mt-4 text-slate-600 dark:text-slate-400">Tem certeza que deseja excluir esta entrada do diário? Esta ação não pode ser desfeita.</p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => setEntryToDelete(null)} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">Cancelar</button>
                    <button onClick={handleDelete} className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600">Excluir</button>
                </div>
            </Modal>
             <Modal isOpen={isReflectionModalOpen} onClose={() => setIsReflectionModalOpen(false)} title="Sua Reflexão Semanal">
                {isGeneratingReflection ? (
                    <AIProgressBar 
                        title="Gerando sua reflexão..."
                        messages={[
                            "Analisando seus sentimentos...",
                            "Identificando temas recorrentes...",
                            "Buscando padrões em suas anotações...",
                            "Preparando seus insights...",
                        ]}
                        isGenerating={isGeneratingReflection}
                    />
                ) : (
                    <>
                        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-4 -mr-2">
                           <div className="prose prose-slate dark:prose-invert max-w-none">
                                <MarkdownRenderer content={reflectionContent} />
                           </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setIsReflectionModalOpen(false)} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">Fechar</button>
                            {!reflectionContent.includes("Insights Indisponíveis") && !reflectionContent.includes("Erro na Geração") && (
                                <button onClick={handleSaveReflectionAsNote} className="bg-purple-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-600">Salvar como Nota</button>
                            )}
                        </div>
                    </>
                )}
            </Modal>
        </div>
    )
}

export default SanctuaryView;