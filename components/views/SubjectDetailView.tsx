import * as React from 'react';
import { Subject, Topic, LibraryDocument, Flashcard, QuizQuestion, MindMapNode, IconName, Message } from '../../types.ts';
import Icon from '../Icon.tsx';
import Modal from '../Modal.tsx';
import { getDocumentContent } from '../../utils/db.ts';
import { generateFlashcards, generateQuiz, generateMindMap, elaborateOnTopic, generateCriticalQuestions } from '../../services/geminiService.ts';
import FlashcardViewer from '../FlashcardViewer.tsx';
import QuizView from '../QuizView.tsx';
import SubjectChat from '../SubjectChat.tsx';
import MindMapView from '../MindMapView.tsx';
import LinkDocumentsModal from '../LinkDocumentsModal.tsx';
import RichTextEditor from '../RichTextEditor.tsx';
import { stripHtml } from '../../utils/textUtils.ts';
import { marked } from 'marked';
import AIProgressBar from '../AIProgressBar.tsx';


interface SubjectDetailViewProps {
    subjectId: string;
    subjects: Subject[];
    documents: LibraryDocument[];
    onBack: () => void;
    setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
    subjectChatHistory: { [subjectId: string]: Message[] };
    setSubjectChatHistory: React.Dispatch<React.SetStateAction<{ [subjectId: string]: Message[] }>>;
}

type StudyTab = 'notes' | 'chat' | 'flashcards' | 'quiz' | 'mind-map';

const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({ subjectId, subjects, onBack, setSubjects, documents, subjectChatHistory, setSubjectChatHistory }) => {
    const subject = subjects.find(s => s.id === subjectId);
    
    const [activeTab, setActiveTab] = React.useState<StudyTab>('notes');
    const [activeTopicId, setActiveTopicId] = React.useState<string | null>(null);
    const [editingTopic, setEditingTopic] = React.useState<Topic | null>(null);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [isGeneratingAll, setIsGeneratingAll] = React.useState(false);
    const [isGenerateAllModalOpen, setIsGenerateAllModalOpen] = React.useState(false);
    const [studyContext, setStudyContext] = React.useState('');
    const [isEnhancing, setIsEnhancing] = React.useState(false);
    const [isLinkDocsModalOpen, setIsLinkDocsModalOpen] = React.useState(false);
    const [draggedTopicId, setDraggedTopicId] = React.useState<string | null>(null);
    const [topicMenuId, setTopicMenuId] = React.useState<string | null>(null);
    const topicMenuRef = React.useRef<HTMLDivElement>(null);


    // Set initial active topic and handle cases where the active topic is deleted
    React.useEffect(() => {
        if (subject && (activeTopicId === null || !subject.topics.find(t => t.id === activeTopicId))) {
            setActiveTopicId(subject.topics[0]?.id || null);
        }
    }, [subject, activeTopicId]);

    // This effect ensures old flashcards without IDs get one for editing/deleting.
    React.useEffect(() => {
        if (subject && subject.flashcards && subject.flashcards.some(fc => !fc.id)) {
            const migratedFlashcards = subject.flashcards.map((fc, index) => 
                fc.id ? fc : { ...fc, id: `migrated-${subject.id}-${index}` }
            );
             setSubjects(prevSubjects => prevSubjects.map(s => 
                s.id === subjectId ? { ...s, flashcards: migratedFlashcards } : s
            ));
        }
    }, [subject, setSubjects, subjectId]);
    
    // Close topic menu on outside click
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (topicMenuRef.current && !topicMenuRef.current.contains(event.target as Node)) {
                setTopicMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [topicMenuRef]);


    // Pre-compile study context from topics and linked documents
    React.useEffect(() => {
        const fetchContext = async () => {
            if (!subject) return;
            let combinedText = subject.topics.map(t => `Tópico: ${t.name}\n${stripHtml(t.content)}`).join('\n\n');
            const linkedDocsContents = await Promise.all(
                subject.documentIds.map(async id => {
                    const docInfo = documents.find(d => d.id === id);
                    const docContent = await getDocumentContent(id);
                    const contentText = (docInfo?.type === 'note' && docContent?.content) ? stripHtml(docContent.content) : (docContent?.content || '');
                    return { ...docInfo, content: contentText };
                })
            );

            for (const doc of linkedDocsContents) {
                if (doc.content) {
                    combinedText += `\n\n--- INÍCIO DO DOCUMENTO: ${doc.name} ---\n${doc.content}\n--- FIM DO DOCUMENTO: ${doc.name} ---\n\n`;
                }
            }
            setStudyContext(combinedText);
        };
        fetchContext();
    }, [subject, documents]);


    if (!subject) {
        return <div className="pt-12 text-center">Disciplina não encontrada. <button onClick={onBack} className="text-blue-500 underline">Voltar</button></div>;
    }

    const handleTopicContentChange = (topicId: string, content: string) => {
        setSubjects(prevSubjects => prevSubjects.map(s => {
            if (s.id === subjectId) {
                const updatedTopics = s.topics.map(t => 
                    t.id === topicId ? { ...t, content } : t
                );
                return { ...s, topics: updatedTopics };
            }
            return s;
        }));
    };

    const handleAddTopic = () => {
        if (subject.topics.find(t => t.id.startsWith('new-')) || editingTopic) return;
        const newTopic: Topic = { id: `new-${Date.now()}`, name: '', content: '' };
        setSubjects(prevSubjects => prevSubjects.map(s => 
            s.id === subjectId ? { ...s, topics: [...s.topics, newTopic] } : s
        ));
        setActiveTopicId(newTopic.id);
        setEditingTopic(newTopic);
    };
    
    const handleDeleteTopic = (topicId: string) => {
        setSubjects(prevSubjects => prevSubjects.map(s => {
            if (s.id === subjectId) {
                const updatedTopics = s.topics.filter(t => t.id !== topicId);
                return { ...s, topics: updatedTopics };
            }
            return s;
        }));
        setTopicMenuId(null);
    };
    
    const handleStartEditing = (topic: Topic) => {
        setEditingTopic({ ...topic });
        setTopicMenuId(null);
    };

    const handleUpdateTopicName = () => {
        if (!editingTopic) return;
        if (!editingTopic.name.trim()) {
            handleDeleteTopic(editingTopic.id);
            setEditingTopic(null);
            return;
        }
        setSubjects(prev => prev.map(s => {
            if (s.id === subjectId) {
                const isNew = editingTopic.id.startsWith('new-');
                const finalId = isNew ? new Date().toISOString() : editingTopic.id;
                const updatedTopics = s.topics.map(t => 
                    t.id === editingTopic.id 
                        ? { ...t, id: finalId, name: editingTopic.name.trim() } 
                        : t
                );
                if (isNew) {
                    setActiveTopicId(finalId);
                }
                return { ...s, topics: updatedTopics };
            }
            return s;
        }));
        setEditingTopic(null);
    };

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, topicId: string) => {
        setDraggedTopicId(topicId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', topicId);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropTargetId: string) => {
        if (!draggedTopicId || draggedTopicId === dropTargetId) return;
        const newTopics = [...subject.topics];
        const draggedIndex = newTopics.findIndex(t => t.id === draggedTopicId);
        const dropIndex = newTopics.findIndex(t => t.id === dropTargetId);
        const [removed] = newTopics.splice(draggedIndex, 1);
        newTopics.splice(dropIndex, 0, removed);
        setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, topics: newTopics } : s));
    };
    const handleDragEnd = () => setDraggedTopicId(null);

    const handleLinkDocuments = (docIds: string[]) => {
        setSubjects(prevSubjects => prevSubjects.map(s => 
            s.id === subjectId ? { ...s, documentIds: docIds } : s
        ));
    };

    const handleUnlinkDocument = (docId: string) => {
        setSubjects(prevSubjects => prevSubjects.map(s => 
            s.id === subjectId ? { ...s, documentIds: s.documentIds.filter(id => id !== docId) } : s
        ));
    };
    
    const handleGenerateFlashcards = async () => {
        setIsGenerating(true);
        try {
            const newFlashcardsRaw = await generateFlashcards(studyContext);
            const newFlashcardsWithIds = newFlashcardsRaw.map(fc => ({...fc, id: `flashcard-${Date.now()}-${Math.random()}`}));
            setSubjects(prevSubjects => prevSubjects.map(s => 
                s.id === subjectId 
                    ? { ...s, flashcards: [...(s.flashcards || []), ...newFlashcardsWithIds] } 
                    : s
            ));
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGenerateQuiz = async () => {
        setIsGenerating(true);
        try {
            const newQuestions = await generateQuiz(studyContext);
             setSubjects(prevSubjects => prevSubjects.map(s => 
                s.id === subjectId ? { ...s, quiz: newQuestions } : s
            ));
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGenerateMindMap = async () => {
        setIsGenerating(true);
        try {
            const generatedMindMap = await generateMindMap(studyContext, subject.name);
            setSubjects(prevSubjects => prevSubjects.map(s => 
                s.id === subjectId ? { ...s, mindMap: generatedMindMap } : s
            ));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateAll = async () => {
        setIsGenerateAllModalOpen(true);
        setIsGeneratingAll(true);
        try {
            const [generatedFlashcardsRaw, generatedQuiz, generatedMindMap] = await Promise.all([
                generateFlashcards(studyContext),
                generateQuiz(studyContext),
                generateMindMap(studyContext, subject.name)
            ]);
            const generatedFlashcards = generatedFlashcardsRaw.map(fc => ({...fc, id: `flashcard-${Date.now()}-${Math.random()}`}));
            setSubjects(prevSubjects => prevSubjects.map(s => {
                if (s.id === subjectId) {
                    return {
                        ...s,
                        flashcards: [...(s.flashcards || []), ...generatedFlashcards],
                        quiz: generatedQuiz,
                        mindMap: generatedMindMap
                    };
                }
                return s;
            }));
        } catch (error) {
            console.error("Failed to generate all study materials:", error);
            // Optionally show an error message to the user here
        } finally {
            setIsGeneratingAll(false);
        }
    };

    const handleElaborate = async () => {
        if (!activeTopic) return;
        const textToElaborate = stripHtml(activeTopic.content);
        if (!textToElaborate.trim()) return;

        setIsEnhancing(true);
        try {
            const elaborationMarkdown = await elaborateOnTopic(textToElaborate, subject.name);
            const elaborationHtml = await marked.parse(elaborationMarkdown);
            const headerHtml = await marked.parse(`### Elaboração sobre "${textToElaborate.substring(0, 30)}..."`);
            const separatorHtml = '<hr>';

            const newContent = `${activeTopic.content}${separatorHtml}${headerHtml}${elaborationHtml}`;
            handleTopicContentChange(activeTopic.id, newContent);
        } catch (error) {
            console.error("Failed to elaborate on topic:", error);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleGenerateQuestions = async () => {
        if (!activeTopic) return;
        setIsEnhancing(true);
        try {
            const questionsMarkdown = await generateCriticalQuestions(studyContext);
            const questionsHtml = await marked.parse(questionsMarkdown);
            const headerHtml = await marked.parse('### Perguntas para Reflexão');
            const separatorHtml = '<hr>';
            
            const newContent = `${activeTopic.content}${separatorHtml}${headerHtml}${questionsHtml}`;
            handleTopicContentChange(activeTopic.id, newContent);
        } catch (error) {
            console.error("Failed to generate questions:", error);
        } finally {
            setIsEnhancing(false);
        }
    };

    const setChatHistoryForSubject = (messages: Message[]) => {
        setSubjectChatHistory(prev => ({
            ...prev,
            [subject.id]: messages
        }));
    };

    const handleUpdateFlashcards = (flashcards: Flashcard[]) => {
        setSubjects(prevSubjects => prevSubjects.map(s => 
            s.id === subjectId ? { ...s, flashcards } : s
        ));
    };

    const activeTopic = subject.topics.find(t => t.id === activeTopicId);
    
    const TabButton: React.FC<{tab: StudyTab, icon: IconName, label: string}> = ({ tab, icon, label }) => (
        <button onClick={() => setActiveTab(tab)} className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}>
            <Icon name={icon} className="w-5 h-5"/>
            <span>{label}</span>
        </button>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'notes':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
                        <aside className="lg:col-span-1">
                            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
                                <div className="flex justify-between items-center mb-3">
                                <h2 className="text-lg font-semibold">Tópicos</h2>
                                <button onClick={handleAddTopic} title="Adicionar Tópico" className="p-1.5 text-slate-500 hover:text-purple-500 rounded-full"><Icon name="plus" className="w-5 h-5"/></button>
                                </div>
                                <div className="space-y-1">
                                    {subject.topics.map(topic => (
                                        <div 
                                            key={topic.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, topic.id)}
                                            onDragEnd={handleDragEnd}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, topic.id)}
                                            className={`group flex items-center space-x-2 p-2 rounded-md transition-all duration-200 ${activeTopicId === topic.id ? 'bg-purple-100 dark:bg-purple-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800'} ${draggedTopicId === topic.id ? 'opacity-30' : 'opacity-100'}`}
                                        >
                                            <Icon name="move" className="w-5 h-5 text-slate-400 flex-shrink-0 cursor-move" />
                                            <div className="flex-grow min-w-0" onClick={() => setActiveTopicId(topic.id)}>
                                                {editingTopic?.id === topic.id ? (
                                                    <input
                                                        type="text"
                                                        value={editingTopic.name}
                                                        onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                                                        onBlur={handleUpdateTopicName}
                                                        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                                        autoFocus
                                                        className="w-full bg-transparent p-0 border-0 focus:ring-0 font-semibold"
                                                    />
                                                ) : (
                                                    <>
                                                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{topic.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{stripHtml(topic.content).substring(0, 50)}</p>
                                                    </>
                                                )}
                                            </div>
                                            <div className="relative flex-shrink-0">
                                                <button onClick={() => setTopicMenuId(topicMenuId === topic.id ? null : topic.id)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                                                    <Icon name="ellipsisVertical" className="w-4 h-4" />
                                                </button>
                                                {topicMenuId === topic.id && (
                                                    <div ref={topicMenuRef} className="absolute right-0 z-20 mt-1 w-32 origin-top-right rounded-md bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                        <div className="py-1">
                                                            <button onClick={() => handleStartEditing(topic)} className="group flex w-full items-center rounded-md px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                                                                <Icon name="edit" className="mr-2 h-4 w-4" /> Renomear
                                                            </button>
                                                            <button onClick={() => handleDeleteTopic(topic.id)} className="group flex w-full items-center rounded-md px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10">
                                                                <Icon name="trash" className="mr-2 h-4 w-4" /> Excluir
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>


                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-3">
                                        <h2 className="text-lg font-semibold">Documentos</h2>
                                        <button onClick={() => setIsLinkDocsModalOpen(true)} title="Vincular Documentos" className="p-1.5 text-slate-500 hover:text-purple-500 rounded-full"><Icon name="plus" className="w-5 h-5"/></button>
                                    </div>
                                    <ul className="space-y-1">
                                        {subject.documentIds.length > 0 ? subject.documentIds.map(docId => {
                                            const doc = documents.find(d => d.id === docId);
                                            if (!doc) return null;
                                            return (
                                                <li key={docId} className="group flex justify-between items-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                                                    <span className="text-sm truncate flex-grow">{doc.name}</span>
                                                    <button onClick={() => handleUnlinkDocument(docId)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Icon name="trash" className="w-4 h-4"/></button>
                                                </li>
                                            );
                                        }) : <p className="text-sm text-slate-400 p-2">Nenhum documento vinculado.</p>}
                                    </ul>
                                </div>
                            </div>
                        </aside>

                        <main className="lg:col-span-3">
                            {activeTopic ? (
                                <div className="h-full">
                                    <div className="p-2 border border-b-0 border-slate-200 dark:border-slate-700 flex items-center flex-wrap gap-2 bg-white dark:bg-slate-900/50 rounded-t-lg">
                                        <button 
                                            onClick={handleElaborate}
                                            disabled={isEnhancing}
                                            className="flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-wait"
                                            title="Elabora sobre o conteúdo do tópico atual."
                                        >
                                            {isEnhancing ? <Icon name="loader" className="w-4 h-4 animate-spin"/> : <Icon name="sparkles" className="w-4 h-4 text-purple-500"/>}
                                            <span>Elaborar com IA</span>
                                        </button>
                                        <button
                                            onClick={handleGenerateQuestions}
                                            disabled={isEnhancing}
                                            className="flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-wait"
                                            title="Gera perguntas de reflexão com base em todo o contexto da disciplina."
                                        >
                                            {isEnhancing ? <Icon name="loader" className="w-4 h-4 animate-spin"/> : <Icon name="brain" className="w-4 h-4 text-green-500"/>}
                                            <span>Perguntas para Reflexão</span>
                                        </button>
                                    </div>
                                    <RichTextEditor
                                        key={activeTopic.id}
                                        value={activeTopic.content}
                                        onChange={(content) => handleTopicContentChange(activeTopic.id, content)}
                                        placeholder="Comece a escrever suas anotações aqui..."
                                    />
                                </div>
                            ) : (
                                <div className="text-center p-8 flex flex-col items-center justify-center min-h-[40vh] bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg">
                                    <Icon name="fileText" className="w-12 h-12 text-slate-400 mb-4"/>
                                    <p className="text-slate-500">Selecione um tópico ou crie um novo para começar.</p>
                                </div>
                            )}
                        </main>
                    </div>
                );
            case 'chat':
                const historyForChat = subjectChatHistory[subject.id];
                return <div className="mt-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6"><SubjectChat subjectName={subject.name} studyContext={studyContext} history={Array.isArray(historyForChat) ? historyForChat : []} setHistory={setChatHistoryForSubject} /></div>;
            case 'flashcards':
                return <div className="mt-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6 min-h-[50vh] flex items-center justify-center"><FlashcardViewer subject={subject} onUpdateFlashcards={handleUpdateFlashcards} onGenerate={handleGenerateFlashcards} isGenerating={isGenerating} /></div>;
            case 'quiz':
                return <div className="mt-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6 min-h-[50vh] flex items-center justify-center"><QuizView questions={subject.quiz || []} onGenerate={handleGenerateQuiz} isGenerating={isGenerating} /></div>;
            case 'mind-map':
                return <div className="mt-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6 min-h-[50vh] flex items-center justify-center"><MindMapView mindMap={subject.mindMap || null} onGenerate={handleGenerateMindMap} isGenerating={isGenerating} /></div>;
            default: return null;
        }
    }

    return (
        <div className="pt-12 animate-fadeIn">
            <header className="mb-6">
                <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-4">
                    <Icon name="chevronLeft" className="w-5 h-5" />
                    <span>Voltar para Academia</span>
                </button>
                <div className="flex justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex-grow">{subject.name}</h1>
                    <button 
                        onClick={handleGenerateAll}
                        disabled={isGenerating || isGeneratingAll}
                        className="bg-purple-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2 disabled:bg-slate-400 disabled:cursor-wait flex-shrink-0"
                    >
                        {isGeneratingAll ? <Icon name="loader" className="w-5 h-5 animate-spin" /> : <Icon name="sparkles" className="w-5 h-5" />}
                        <span className="hidden sm:inline">{isGeneratingAll ? 'Gerando...' : 'Gerar Tudo'}</span>
                    </button>
                </div>
            </header>
            
            <div className="sticky top-4 z-10 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md -mx-4 px-4 py-3 mb-4">
                <div className="flex flex-wrap items-center p-1 bg-slate-200 dark:bg-slate-800 rounded-lg gap-1">
                    <TabButton tab="notes" icon="fileText" label="Anotações" />
                    <TabButton tab="chat" icon="brainCircuit" label="Chat IA" />
                    <TabButton tab="flashcards" icon="clipboardCheck" label="Flashcards" />
                    <TabButton tab="quiz" icon="swords" label="Quiz" />
                    <TabButton tab="mind-map" icon="mindMap" label="Mapa Mental" />
                </div>
            </div>

            {renderContent()}
            
             <LinkDocumentsModal
                isOpen={isLinkDocsModalOpen}
                onClose={() => setIsLinkDocsModalOpen(false)}
                allDocuments={documents}
                linkedDocumentIds={subject.documentIds}
                onLinkDocuments={handleLinkDocuments}
            />
            <Modal isOpen={isGenerateAllModalOpen} onClose={() => setIsGenerateAllModalOpen(false)} title="Gerando Materiais de Estudo">
                <AIProgressBar
                    title="Gerando tudo para você..."
                    messages={[
                        "Primeiro, os flashcards...",
                        "Agora, o quiz...",
                        "Desenhando o mapa mental...",
                        "Quase pronto...",
                    ]}
                    isGenerating={isGeneratingAll}
                    onComplete={() => {
                        setTimeout(() => setIsGenerateAllModalOpen(false), 1200);
                    }}
                />
            </Modal>
        </div>
    );
};

export default SubjectDetailView;