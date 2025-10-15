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

const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({ subjectId, subjects, documents, onBack, setSubjects, subjectChatHistory, setSubjectChatHistory }) => {
    const subject = subjects.find(s => s.id === subjectId);
    
    const [activeTab, setActiveTab] = React.useState<StudyTab>('notes');
    const [activeTopicId, setActiveTopicId] = React.useState<string | null>(null);
    const [topicToEdit, setTopicToEdit] = React.useState<Topic | null>(null);
    const [newTopicName, setNewTopicName] = React.useState("");
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [isGeneratingAll, setIsGeneratingAll] = React.useState(false);
    const [studyContext, setStudyContext] = React.useState('');
    const [isEnhancing, setIsEnhancing] = React.useState(false);
    const [isLinkDocsModalOpen, setIsLinkDocsModalOpen] = React.useState(false);


    // Set initial active topic
    React.useEffect(() => {
        if (subject && (activeTopicId === null || !subject.topics.find(t => t.id === activeTopicId))) {
            setActiveTopicId(subject.topics[0]?.id || null);
        }
    }, [subject, activeTopicId]);

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

    const updateSubject = (updatedSubject: Subject) => {
        setSubjects(prev => prev.map(s => s.id === updatedSubject.id ? updatedSubject : s));
    };

    const handleTopicContentChange = (topicId: string, content: string) => {
        const updatedTopics = subject.topics.map(t => t.id === topicId ? { ...t, content } : t);
        updateSubject({ ...subject, topics: updatedTopics });
    };

    const handleAddTopic = () => {
        const newTopic: Topic = { id: new Date().toISOString(), name: 'Novo Tópico', content: '' };
        updateSubject({ ...subject, topics: [...subject.topics, newTopic] });
        setActiveTopicId(newTopic.id);
    };
    
    const handleDeleteTopic = (topicId: string) => {
        const updatedTopics = subject.topics.filter(t => t.id !== topicId);
        updateSubject({ ...subject, topics: updatedTopics });
        if (activeTopicId === topicId) {
            setActiveTopicId(updatedTopics[0]?.id || null);
        }
    };
    
    const handleRenameTopic = () => {
        if (!topicToEdit || !newTopicName.trim()) return;
        const updatedTopics = subject.topics.map(t => t.id === topicToEdit.id ? { ...t, name: newTopicName.trim() } : t);
        updateSubject({ ...subject, topics: updatedTopics });
        setTopicToEdit(null);
        setNewTopicName("");
    };

    const openRenameModal = (topic: Topic) => {
        setTopicToEdit(topic);
        setNewTopicName(topic.name);
    };

    const handleLinkDocuments = (docIds: string[]) => {
        updateSubject({ ...subject, documentIds: docIds });
    };

    const handleUnlinkDocument = (docId: string) => {
        updateSubject({ ...subject, documentIds: subject.documentIds.filter(id => id !== docId) });
    };
    
    const handleGenerateFlashcards = async () => {
        setIsGenerating(true);
        try {
            const newFlashcards = await generateFlashcards(studyContext);
            updateSubject({ ...subject, flashcards: [...(subject.flashcards || []), ...newFlashcards] });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGenerateQuiz = async () => {
        setIsGenerating(true);
        try {
            const newQuestions = await generateQuiz(studyContext);
            updateSubject({ ...subject, quiz: [...(subject.quiz || []), ...newQuestions] });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGenerateMindMap = async () => {
        setIsGenerating(true);
        try {
            const generatedMindMap = await generateMindMap(studyContext, subject.name);
            updateSubject({ ...subject, mindMap: generatedMindMap });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateAll = async () => {
        setIsGeneratingAll(true);
        try {
            const [generatedFlashcards, generatedQuiz, generatedMindMap] = await Promise.all([
                generateFlashcards(studyContext),
                generateQuiz(studyContext),
                generateMindMap(studyContext, subject.name)
            ]);
            updateSubject({
                ...subject,
                flashcards: [...(subject.flashcards || []), ...generatedFlashcards],
                quiz: [...(subject.quiz || []), ...generatedQuiz],
                mindMap: generatedMindMap // Mind map is replaced, not appended
            });
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

    const activeTopic = subject.topics.find(t => t.id === activeTopicId);
    
    const TabButton: React.FC<{tab: StudyTab, icon: IconName, label: string}> = ({ tab, icon, label }) => (
        <button onClick={() => setActiveTab(tab)} className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}>
            <Icon name={icon} className="w-5 h-5"/>
            <span>{label}</span>
        </button>
    );

    const renderContent = () => {
        const isAnyGenerating = isGenerating || isGeneratingAll;
        switch (activeTab) {
            case 'notes':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
                        <aside className="lg:col-span-1">
                            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sticky top-24">
                                <div className="flex justify-between items-center mb-3">
                                <h2 className="text-lg font-semibold">Tópicos</h2>
                                <button onClick={handleAddTopic} title="Adicionar Tópico" className="p-1.5 text-slate-500 hover:text-purple-500 rounded-full"><Icon name="plus" className="w-5 h-5"/></button>
                                </div>
                                <ul className="space-y-1 max-h-[35vh] overflow-y-auto">
                                    {subject.topics.map(topic => (
                                        <li key={topic.id} className={`group flex justify-between items-center p-2 rounded-md cursor-pointer transition-colors ${activeTopicId === topic.id ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`} onClick={() => setActiveTopicId(topic.id)}>
                                            <span className="truncate flex-grow">{topic.name}</span>
                                            <div className="flex items-center flex-shrink-0 opacity-0 group-hover:opacity-100">
                                                <button onClick={(e) => { e.stopPropagation(); openRenameModal(topic); }} className="p-1 text-slate-400 hover:text-blue-500"><Icon name="edit" className="w-4 h-4" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id); }} className="p-1 text-slate-400 hover:text-red-500"><Icon name="trash" className="w-4 h-4" /></button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-3">
                                        <h2 className="text-lg font-semibold">Documentos</h2>
                                        <button onClick={() => setIsLinkDocsModalOpen(true)} title="Vincular Documentos" className="p-1.5 text-slate-500 hover:text-purple-500 rounded-full"><Icon name="plus" className="w-5 h-5"/></button>
                                    </div>
                                    <ul className="space-y-1 max-h-[25vh] overflow-y-auto">
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
                return <div className="mt-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6 min-h-[50vh] flex items-center justify-center"><FlashcardViewer flashcards={subject.flashcards || []} onGenerate={handleGenerateFlashcards} isGenerating={isAnyGenerating} /></div>;
            case 'quiz':
                return <div className="mt-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6 min-h-[50vh] flex items-center justify-center"><QuizView questions={subject.quiz || []} onGenerate={handleGenerateQuiz} isGenerating={isAnyGenerating} /></div>;
            case 'mind-map':
                return <div className="mt-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6 min-h-[50vh] flex items-center justify-center"><MindMapView mindMap={subject.mindMap || null} onGenerate={handleGenerateMindMap} isGenerating={isAnyGenerating} /></div>;
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
            
            <Modal isOpen={!!topicToEdit} onClose={() => setTopicToEdit(null)} title="Renomear Tópico">
                <input type="text" value={newTopicName} onChange={e => setNewTopicName(e.target.value)} className="mt-4 w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3"/>
                <div className="mt-4 flex justify-end">
                    <button onClick={handleRenameTopic} className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg">Salvar</button>
                </div>
            </Modal>
             <LinkDocumentsModal
                isOpen={isLinkDocsModalOpen}
                onClose={() => setIsLinkDocsModalOpen(false)}
                allDocuments={documents}
                linkedDocumentIds={subject.documentIds}
                onLinkDocuments={handleLinkDocuments}
            />
        </div>
    );
};

export default SubjectDetailView;