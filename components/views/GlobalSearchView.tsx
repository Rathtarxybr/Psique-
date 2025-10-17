import * as React from 'react';
import { LibraryDocument, Subject, JournalEntry, SearchResultItem, IconName } from '../../types.ts';
import useDebounce from '../../hooks/useDebounce.ts';
import Icon from '../Icon.tsx';
import { stripHtml } from '../../utils/textUtils.ts';

interface GlobalSearchViewProps {
    onClose: () => void;
    onResultSelect: (item: SearchResultItem) => void;
    documents: LibraryDocument[];
    subjects: Subject[];
    journalEntries: JournalEntry[];
}

// Function to create a snippet and highlight the term
const createSnippet = (text: string, term: string, maxLength = 100) => {
    if (!text) return '';
    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);

    if (index === -1) {
        return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }

    const start = Math.max(0, index - Math.floor((maxLength - term.length) / 2));
    const end = Math.min(text.length, start + maxLength);
    let snippet = text.substring(start, end);

    // Add ellipses
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    // Highlight
    const regex = new RegExp(`(${term})`, 'gi');
    return snippet.replace(regex, `<mark class="bg-yellow-200 dark:bg-yellow-600/50 rounded-sm px-0.5">$1</mark>`);
};


const GlobalSearchView: React.FC<GlobalSearchViewProps> = ({ onClose, onResultSelect, documents, subjects, journalEntries }) => {
    const [query, setQuery] = React.useState('');
    const debouncedQuery = useDebounce(query, 300);
    const [results, setResults] = React.useState<SearchResultItem[]>([]);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        inputRef.current?.focus();
    }, []);

    React.useEffect(() => {
        if (!debouncedQuery) {
            setResults([]);
            return;
        }

        const newResults: SearchResultItem[] = [];
        const lowerQuery = debouncedQuery.toLowerCase();

        // Search documents
        documents.forEach(doc => {
            if (doc.name.toLowerCase().includes(lowerQuery)) {
                newResults.push({
                    id: doc.id,
                    type: 'document',
                    title: doc.name,
                    snippet: createSnippet(doc.summary || `Documento do tipo ${doc.type}`, debouncedQuery)
                });
            } else if (doc.summary?.toLowerCase().includes(lowerQuery)) {
                newResults.push({
                    id: doc.id,
                    type: 'document',
                    title: doc.name,
                    snippet: createSnippet(doc.summary, debouncedQuery)
                });
            }
        });

        // Search subjects and topics
        subjects.forEach(subject => {
            if (subject.name.toLowerCase().includes(lowerQuery)) {
                newResults.push({
                    id: subject.id,
                    type: 'subject',
                    title: subject.name,
                    snippet: `Disciplina com ${subject.topics.length} tópico(s)`
                });
            }
            subject.topics.forEach(topic => {
                const cleanContent = stripHtml(topic.content);
                if (topic.name.toLowerCase().includes(lowerQuery)) {
                    newResults.push({
                        id: topic.id,
                        type: 'topic',
                        title: topic.name,
                        snippet: createSnippet(cleanContent, debouncedQuery),
                        parentId: subject.id
                    });
                } else if (cleanContent.toLowerCase().includes(lowerQuery)) {
                    newResults.push({
                        id: topic.id,
                        type: 'topic',
                        title: topic.name,
                        snippet: createSnippet(cleanContent, debouncedQuery),
                        parentId: subject.id
                    });
                }
            });
        });

        // Search journal entries
        journalEntries.forEach(entry => {
            const cleanContent = stripHtml(entry.content);
            if (entry.title.toLowerCase().includes(lowerQuery)) {
                newResults.push({
                    id: entry.id,
                    type: 'journal',
                    title: entry.title,
                    snippet: createSnippet(cleanContent, debouncedQuery)
                });
            } else if (cleanContent.toLowerCase().includes(lowerQuery)) {
                newResults.push({
                    id: entry.id,
                    type: 'journal',
                    title: entry.title || `Entrada de ${new Date(entry.date).toLocaleDateString()}`,
                    snippet: createSnippet(cleanContent, debouncedQuery)
                });
            }
        });

        setResults(newResults);

    }, [debouncedQuery, documents, subjects, journalEntries]);

    const getIcon = (type: SearchResultItem['type']): IconName => {
        switch (type) {
            case 'document': return 'library';
            case 'subject':
            case 'topic': return 'academy';
            case 'journal': return 'feather';
            default: return 'fileText';
        }
    };
    
    const getCategoryName = (type: SearchResultItem['type']): string => {
        switch (type) {
            case 'document': return 'Biblioteca';
            case 'subject':
            case 'topic': return 'Academia';
            case 'journal': return 'Santuário';
            default: return 'Resultado';
        }
    };

    const groupedResults = results.reduce((acc, item) => {
        const category = getCategoryName(item.type);
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {} as Record<string, SearchResultItem[]>);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 animate-fade-in flex flex-col">
            <header className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-4 flex-shrink-0">
                <div className="relative flex-grow">
                    <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Pesquisar em todo o Psique+..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 text-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button onClick={onClose} className="text-slate-500 dark:text-slate-400 font-semibold hover:text-blue-500 dark:hover:text-blue-400">
                    Cancelar
                </button>
            </header>
            <main className="flex-grow overflow-y-auto p-4 md:p-6">
                {debouncedQuery && results.length === 0 && (
                    <div className="text-center pt-16">
                        <Icon name="search" className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700"/>
                        <h2 className="mt-4 text-xl font-semibold">Nenhum resultado encontrado</h2>
                        <p className="text-slate-500">Tente usar termos de busca diferentes.</p>
                    </div>
                )}
                {debouncedQuery && results.length > 0 && (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {/* FIX: Replaced Object.entries with Object.keys for more robust type inference. */}
                        {Object.keys(groupedResults).map(category => {
                            const items = groupedResults[category];
                            return (
                                <section key={category}>
                                    <h2 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 px-2">{category}</h2>
                                    <div className="space-y-2">
                                        {items.map(item => (
                                            <button key={item.id + item.type} onClick={() => onResultSelect(item)} className="w-full text-left p-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 flex items-start space-x-4 transition-colors">
                                                <Icon name={getIcon(item.type)} className="w-6 h-6 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-1" />
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400" dangerouslySetInnerHTML={{ __html: item.snippet }}></p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
                {!debouncedQuery && (
                    <div className="text-center pt-16">
                        <Icon name="search" className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700"/>
                        <h2 className="mt-4 text-xl font-semibold">Busca Global</h2>
                        <p className="text-slate-500">Encontre qualquer coisa em sua biblioteca, academia ou santuário.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default GlobalSearchView;