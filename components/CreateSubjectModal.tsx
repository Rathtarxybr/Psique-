import * as React from 'react';
import Modal from './Modal.tsx';
import { Subject, Topic, IconName } from '../types.ts';
import Icon from './Icon.tsx';
import { extractTextFromPdf } from '../utils/pdfUtils.ts';
import { extractTextFromEpub } from '../utils/epubUtils.ts';
import { generateIntroFromTheme, summarizeYouTubeVideo } from '../services/geminiService.ts';

interface CreateSubjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
    onSubjectCreated: (subject: Subject) => void;
}

type CreationStep = 'source' | 'details';
type SourceType = 'upload' | 'youtube' | 'paste' | 'blank';

const SourceButton: React.FC<{ icon: IconName, title: string, description: string, onClick: () => void }> = ({ icon, title, description, onClick }) => (
    <button onClick={onClick} className="p-4 border border-slate-300 dark:border-slate-700 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <Icon name={icon} className="w-6 h-6 mb-2 text-purple-500" />
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-slate-500">{description}</p>
    </button>
);

const CreateSubjectModal: React.FC<CreateSubjectModalProps> = ({ isOpen, onClose, setSubjects, onSubjectCreated }) => {
    const [step, setStep] = React.useState<CreationStep>('source');
    const [source, setSource] = React.useState<SourceType | null>(null);
    const [subjectName, setSubjectName] = React.useState('');
    const [initialContent, setInitialContent] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const resetState = () => {
        setStep('source');
        setSource(null);
        setSubjectName('');
        setInitialContent('');
        setIsLoading(false);
        setError('');
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleSourceSelect = (selectedSource: SourceType) => {
        setSource(selectedSource);
        if (selectedSource === 'blank') {
            setStep('details');
        } else {
            // Specific logic for sources that need input
            if (selectedSource === 'upload') {
                fileInputRef.current?.click();
            } else {
                 setStep('details');
            }
        }
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError('');
        setSubjectName(file.name.replace(/\.(pdf|epub)$/i, ''));

        try {
            const text = file.name.endsWith('.epub') ? await extractTextFromEpub(file) : await extractTextFromPdf(file);
            setInitialContent(text);
            setStep('details');
        } catch (err) {
            setError("Falha ao processar o arquivo.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        setIsLoading(true);
        setError('');

        try {
            // Use local variables to hold the definitive name and content.
            let name = subjectName.trim();
            let content = initialContent;

            if (source === 'youtube') {
                const { title, summary } = await summarizeYouTubeVideo(initialContent);
                // If the user hasn't provided a name, use the one from the video.
                if (!name) {
                    name = title;
                }
                content = summary;
            } else if (source === 'paste' && initialContent.length > 0 && initialContent.length < 200) {
                // If the user provided a short text, treat it as a theme and generate an intro.
                content = await generateIntroFromTheme(initialContent);
            }

            // A single, robust check for the subject name before proceeding.
            if (!name) {
                setError("O nome da disciplina é obrigatório.");
                setIsLoading(false);
                return;
            }

            const newTopic: Topic = { 
                id: new Date().toISOString() + '-topic', 
                name: 'Visão Geral', 
                content: content 
            };
            const newSubject: Subject = {
                id: new Date().toISOString(),
                name: name,
                topics: [newTopic],
                documentIds: [],
            };

            setSubjects(prev => [newSubject, ...prev]);
            // onSubjectCreated unmounts this component by causing the parent to render a different view.
            // Do not call any state updates (like handleClose) after this line, as it will cause a React error.
            onSubjectCreated(newSubject);
        } catch (err) {
            console.error("Failed to create subject:", err);
            setError("Ocorreu um erro ao criar a disciplina. Tente novamente.");
            setIsLoading(false);
        }
    };

    const renderSourceStep = () => (
        <>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.epub" className="hidden" />
            {isLoading && <p>Processando arquivo...</p>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <SourceButton icon="fileUp" title="Enviar Arquivo" description="Envie PDFs ou EPUBs" onClick={() => handleSourceSelect('upload')} />
                <SourceButton icon="youtube" title="YouTube" description="Cole um link de vídeo" onClick={() => handleSourceSelect('youtube')} />
                <SourceButton icon="clipboardPaste" title="Tema ou Texto" description="Gere a partir de um tema ou cole um texto" onClick={() => handleSourceSelect('paste')} />
            </div>
             <div className="mt-4 flex justify-center">
                <button onClick={() => handleSourceSelect('blank')} className="text-sm font-semibold text-slate-500 hover:text-purple-500">Ou comece uma disciplina em branco</button>
            </div>
        </>
    );

    const renderDetailsStep = () => (
        <div className="mt-4 space-y-4">
            <div>
                <label className="text-sm font-medium">Nome da Disciplina</label>
                <input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="Ex: Psicologia Analítica" className="w-full mt-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3"/>
            </div>
            {(source === 'paste' || source === 'youtube') && (
                <div>
                     <label className="text-sm font-medium">{source === 'paste' ? 'Tema ou Texto para Anotação' : 'Link do Vídeo do YouTube'}</label>
                     <textarea value={initialContent} onChange={e => setInitialContent(e.target.value)} rows={5} className="w-full mt-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3"></textarea>
                </div>
            )}
             {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end space-x-2">
                 <button onClick={() => setStep('source')} className="bg-slate-200 dark:bg-slate-700 font-semibold py-2 px-4 rounded-lg">Voltar</button>
                 <button onClick={handleCreate} disabled={isLoading} className="bg-purple-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center">
                    {isLoading && <Icon name="loader" className="animate-spin w-5 h-5 mr-2"/>}
                    Criar Disciplina
                </button>
            </div>
        </div>
    );
    
    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={step === 'source' ? "Criar Nova Disciplina" : "Detalhes da Disciplina"}>
            {step === 'source' ? renderSourceStep() : renderDetailsStep()}
        </Modal>
    );
};

export default CreateSubjectModal;