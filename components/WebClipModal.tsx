import * as React from 'react';
import { LibraryDocument } from '../types.ts';
import Icon from './Icon.tsx';
import Modal from './Modal.tsx';
import { summarizeWebPage, summarizeYouTubeVideo } from '../services/geminiService.ts';
import { saveDocumentContent } from '../utils/db.ts';
import AIProgressBar from './AIProgressBar.tsx';

interface WebClipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDocumentAdded: (newDoc: LibraryDocument) => void;
}

const WebClipModal: React.FC<WebClipModalProps> = ({ isOpen, onClose, onDocumentAdded }) => {
    const [url, setUrl] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleClose = () => {
        setUrl('');
        setIsLoading(false);
        setError('');
        onClose();
    };

    const handleSave = async () => {
        if (!url.trim()) {
            setError('Por favor, insira uma URL válida.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
            const { title, summary } = isYouTube 
                ? await summarizeYouTubeVideo(url)
                : await summarizeWebPage(url);
            
            if (!summary || summary.includes("Não foi possível gerar um resumo")) {
                throw new Error("A IA não conseguiu processar este link.");
            }

            const docId = `web-${new Date().toISOString()}`;
            await saveDocumentContent(docId, summary, url);

            const newDoc: LibraryDocument = {
                id: docId,
                name: title,
                type: 'web',
                createdAt: new Date().toISOString(),
                summary: summary,
                url: url,
            };

            onDocumentAdded(newDoc);
            handleClose();

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Salvar Link da Web">
            {isLoading ? (
                <AIProgressBar
                    title="Analisando Link..."
                    messages={[
                        "Acessando o conteúdo da página...",
                        "Extraindo o texto principal...",
                        "Gerando um resumo conciso...",
                        "Salvando em sua biblioteca...",
                    ]}
                    isGenerating={isLoading}
                />
            ) : (
                <>
                    <div className="mt-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Cole o link de um artigo ou vídeo do YouTube. A IA irá extrair e resumir o conteúdo para você.</p>
                        <div className="relative">
                            <Icon name="link" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg py-3 pl-10 pr-4"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button onClick={handleClose} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                            Cancelar
                        </button>
                        <button onClick={handleSave} disabled={isLoading} className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-slate-400 flex items-center space-x-2">
                            <span>Salvar</span>
                        </button>
                    </div>
                </>
            )}
        </Modal>
    );
};

export default WebClipModal;
