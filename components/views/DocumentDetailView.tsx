import * as React from 'react';
import { LibraryDocument, DocumentContent, Subject, View, Topic } from '../../types.ts';
import Icon from '../Icon.tsx';
import { getDocumentContent, saveDocumentContent } from '../../utils/db.ts';
import { summarizeNotes, generateTopicsFromSummary } from '../../services/geminiService.ts';
import useDebounce from '../../hooks/useDebounce.ts';
import RichTextEditor from '../RichTextEditor.tsx';
import { stripHtml } from '../../utils/textUtils.ts';
import AIProgressBar from '../AIProgressBar.tsx';
import Modal from '../Modal.tsx';


interface DocumentDetailViewProps {
    doc: LibraryDocument;
    onBack: () => void;
    setDocuments: React.Dispatch<React.SetStateAction<LibraryDocument[]>>;
    setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
    setActiveView: (view: View) => void;
}

const DocumentDetailView: React.FC<DocumentDetailViewProps> = ({ doc, onBack, setDocuments, setSubjects, setActiveView }) => {
    const [content, setContent] = React.useState<DocumentContent | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [summaryLoading, setSummaryLoading] = React.useState(false);
    const [copySuccess, setCopySuccess] = React.useState(false);
    const [currentDoc, setCurrentDoc] = React.useState(doc);
    const [isCreatingSubject, setIsCreatingSubject] = React.useState(false);
    const [isCreateSubjectModalOpen, setIsCreateSubjectModalOpen] = React.useState(false);
    
    // State specific to 'note' type
    const [editorContent, setEditorContent] = React.useState('');
    const debouncedEditorContent = useDebounce(editorContent, 1000);

    React.useEffect(() => {
        setCurrentDoc(doc);
    }, [doc]);

    React.useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true);
            const docContent = await getDocumentContent(currentDoc.id);
            if (docContent) {
                setContent(docContent);
                if (currentDoc.type === 'note') {
                    setEditorContent(docContent.content);
                }
            } else if (currentDoc.type === 'note') {
                setContent({id: currentDoc.id, content: '', fileDataUrl: ''});
            }
            setIsLoading(false);
        };
        fetchContent();
    }, [currentDoc.id, currentDoc.type]);

    // Debounced save for notes
    React.useEffect(() => {
        if (currentDoc.type === 'note' && content) {
            saveDocumentContent(currentDoc.id, debouncedEditorContent, '');
        }
    }, [debouncedEditorContent, currentDoc.id, currentDoc.type, content]);
    
    const handleGenerateSummary = async () => {
        const textToSummarize = currentDoc.type === 'note' ? stripHtml(editorContent) : (content?.content || currentDoc.summary);
        if (!textToSummarize) return;

        setSummaryLoading(true);
        try {
            const summary = await summarizeNotes(textToSummarize);
            const updatedDoc = { ...currentDoc, summary };
            setCurrentDoc(updatedDoc);
            setDocuments(docs => docs.map(d => d.id === currentDoc.id ? updatedDoc : d));
        } catch (error) {
            console.error("Failed to generate summary:", error);
        } finally {
            setSummaryLoading(false);
        }
    };
    
    const handleCopyToClipboard = () => {
        if (!currentDoc.summary) return;
        navigator.clipboard.writeText(currentDoc.summary);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };
    
    const handleCreateSubject = async () => {
        if (!currentDoc.summary) return;
        setIsCreateSubjectModalOpen(true);
        setIsCreatingSubject(true);
        try {
            const topicNames = await generateTopicsFromSummary(currentDoc.summary, currentDoc.name);

            const summaryTopic: Topic = {
                id: new Date().toISOString() + '-summary-topic',
                name: `Resumo de ${currentDoc.name}`,
                content: `<p>Resumo gerado por IA do documento "${currentDoc.name}":</p><blockquote>${currentDoc.summary}</blockquote>`,
            };

            const generatedTopics: Topic[] = topicNames.map((name, index) => ({
                id: `${new Date().toISOString()}-gen-topic-${index}`,
                name: name,
                content: `<p>Este tópico foi gerado pela IA como uma área de estudo chave a partir do documento "${currentDoc.name}". Adicione suas anotações aqui.</p>`
            }));

            const newSubject: Subject = {
                id: new Date().toISOString(),
                name: currentDoc.name,
                topics: [summaryTopic, ...generatedTopics],
                documentIds: [currentDoc.id],
            };
            setSubjects(prev => [newSubject, ...prev]);
            
            // Allow the completion animation to run
            setIsCreatingSubject(false);
            
            // Navigate after modal closes
            setTimeout(() => setActiveView(View.Academy), 1500);

        } catch (error) {
            console.error("Failed to create subject with generated topics:", error);
            const fallbackTopic: Topic = {
                id: new Date().toISOString() + '-topic',
                name: `Resumo de ${currentDoc.name}`,
                content: `<p>Resumo gerado por IA do documento "${currentDoc.name}":</p><blockquote>${currentDoc.summary}</blockquote>`,
            };
            const fallbackSubject: Subject = {
                id: new Date().toISOString(),
                name: currentDoc.name,
                topics: [fallbackTopic],
                documentIds: [currentDoc.id],
            };
            setSubjects(prev => [fallbackSubject, ...prev]);
            setIsCreatingSubject(false);
             setTimeout(() => setActiveView(View.Academy), 1500);
        }
    }

    const SummarySection = () => (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-300">Resumo da IA</h2>
                { currentDoc.type === 'web' && currentDoc.url ? (
                     <a href={currentDoc.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-500 hover:text-blue-600 flex items-center space-x-1">
                        <span>Visitar Fonte Original</span>
                        <Icon name="link" className="w-4 h-4"/>
                    </a>
                ) : (
                    <button onClick={handleGenerateSummary} disabled={summaryLoading} className="bg-purple-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2 disabled:bg-slate-400">
                        {summaryLoading ? <Icon name="loader" className="w-5 h-5 animate-spin" /> : <Icon name="sparkles" className="w-5 h-5" />}
                        <span>{currentDoc.summary ? 'Gerar Novamente' : 'Resumir com IA'}</span>
                    </button>
                )}
            </div>
            
            { summaryLoading ? (
                 <AIProgressBar
                    title="Gerando Resumo..."
                    messages={[
                        "Lendo o documento...",
                        "Identificando os pontos-chave...",
                        "Estruturando as ideias principais...",
                        "Escrevendo uma síntese concisa...",
                    ]}
                    isGenerating={summaryLoading}
                />
            ) : currentDoc.summary ? (
                 <div className="prose prose-slate dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{currentDoc.summary}</p>
                 </div>
            ) : (
                <div className="text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-lg">
                    <Icon name="brainCircuit" className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
                    <p className="mt-2 text-slate-500">{currentDoc.type === 'web' ? 'Este é o resumo gerado pela IA.' : 'Gere um resumo para começar.'}</p>
                </div>
            )}
            
            {currentDoc.summary && !summaryLoading && (
                 <div className="flex justify-end items-center space-x-3 mt-4">
                    <button onClick={handleCopyToClipboard} className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-2">
                       {copySuccess ? <Icon name="checkCircle" className="w-5 h-5 text-green-500" /> : <Icon name="copy" className="w-5 h-5" />}
                       <span>{copySuccess ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                     <button onClick={handleCreateSubject} disabled={isCreatingSubject} className="text-sm font-semibold bg-green-500/10 dark:bg-green-400/10 text-green-600 dark:text-green-300 py-2 px-4 rounded-lg hover:bg-green-500/20 dark:hover:bg-green-400/20 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-wait">
                       <Icon name="plus" className="w-5 h-5" />
                       <span>Criar Disciplina de Estudo</span>
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="pt-12">
            <header className="mb-8">
                <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-4">
                    <Icon name="chevronLeft" className="w-5 h-5" />
                    <span>Voltar para Biblioteca</span>
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{currentDoc.name}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Adicionado em {new Date(currentDoc.createdAt).toLocaleDateString()}</p>
                    </div>
                    {(currentDoc.type === 'pdf' || currentDoc.type === 'epub') && content?.fileDataUrl && (
                         <a 
                            href={content.fileDataUrl} 
                            download={currentDoc.name + (currentDoc.type === 'pdf' ? '.pdf' : '.epub')}
                            className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                        >
                           <Icon name="download" className="w-5 h-5" />
                           <span>Baixar Arquivo</span>
                        </a>
                    )}
                </div>
            </header>

            {isLoading ? (
                <div className="text-center py-10">
                    <Icon name="loader" className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto animate-spin" />
                    <p className="text-slate-500 dark:text-slate-500 mt-2">Carregando conteúdo...</p>
                </div>
            ) : currentDoc.type === 'note' ? (
                <div className="space-y-6">
                    <RichTextEditor
                        value={editorContent}
                        onChange={setEditorContent}
                        placeholder="Comece a escrever sua nota aqui..."
                    />
                    <SummarySection />
                </div>
            ) : (
                <SummarySection />
            )}
             <Modal isOpen={isCreateSubjectModalOpen} onClose={() => setIsCreateSubjectModalOpen(false)} title="Criando Disciplina de Estudo">
                <AIProgressBar
                    title="Criando sua nova disciplina..."
                    messages={[
                        "Analisando o resumo para extrair tópicos...",
                        "Estruturando as seções de estudo...",
                        "Vinculando o documento original...",
                        "Montando a área de estudo...",
                    ]}
                    isGenerating={isCreatingSubject}
                    onComplete={() => {
                        setTimeout(() => setIsCreateSubjectModalOpen(false), 1200);
                    }}
                />
            </Modal>
        </div>
    );
};

export default DocumentDetailView;
