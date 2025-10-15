import * as React from 'react';
// FIX: Add .ts extension to file path.
import { LibraryDocument } from '../types.ts';
// FIX: Add .tsx extension to file path.
import Icon from './Icon.tsx';
// FIX: Add .tsx extension to file path.
import Modal from './Modal.tsx';
// FIX: Add .ts extension to file path.
import { extractTextFromPdf } from '../utils/pdfUtils.ts';
// FIX: Add .ts extension to file path.
import { extractTextFromEpub } from '../utils/epubUtils.ts';
// FIX: Add .ts extension to file path.
import { saveDocumentContent } from '../utils/db.ts';

type Status = 'pending' | 'processing' | 'success' | 'error';

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

const StatusIcon: React.FC<{ status: Status }> = ({ status }) => {
    switch(status) {
        case 'processing': return <Icon name="loader" className="w-5 h-5 text-slate-400 animate-spin" />;
        case 'success': return <Icon name="checkCircle" className="w-5 h-5 text-green-500" />;
        case 'error': return <Icon name="x" className="w-5 h-5 text-red-500" />;
        default: return null;
    }
}

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFilesAdded: React.Dispatch<React.SetStateAction<LibraryDocument[]>>;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onFilesAdded }) => {
    const [files, setFiles] = React.useState<File[]>([]);
    const [statuses, setStatuses] = React.useState<Record<string, { status: Status, message?: string }>>({});
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [dragActive, setDragActive] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleFilesSelected = (selectedFiles: File[]) => {
        const newFiles = selectedFiles.filter(f => !files.some(ef => ef.name === f.name));
        setFiles(prev => [...prev, ...newFiles]);
        const newStatuses: Record<string, { status: Status, message?: string }> = {};
        newFiles.forEach(f => {
            newStatuses[f.name] = { status: 'pending' };
        });
        setStatuses(prev => ({...prev, ...newStatuses}));
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };
    
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files) handleFilesSelected(Array.from(e.dataTransfer.files));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files) handleFilesSelected(Array.from(e.target.files));
    };
    
    const onButtonClick = () => inputRef.current?.click();

    const processFile = async (file: File): Promise<{ success: boolean, doc?: LibraryDocument, error?: string }> => {
        try {
            const fileType: 'epub' | 'pdf' = file.name.endsWith('.epub') ? 'epub' : 'pdf';
            const [content, fileDataUrl] = await Promise.all([
                fileType === 'epub' ? extractTextFromEpub(file) : extractTextFromPdf(file),
                fileToDataUrl(file)
            ]);
            
            const docId = `${file.name}-${new Date().toISOString()}`;
            await saveDocumentContent(docId, content, fileDataUrl);

            const doc: LibraryDocument = {
                id: docId,
                name: file.name.replace(/\.(pdf|epub)$/i, ''),
                type: fileType,
                createdAt: new Date().toISOString(),
            };
            return { success: true, doc };
        } catch (error) {
            console.error("Error processing file:", file.name, error);
            let message = 'Falha ao processar arquivo.';
            if (error instanceof Error && error.message.includes('worker')) {
                message = 'Erro no processador de PDF. Verifique a conexão.';
            }
            return { success: false, error: message };
        }
    };

    const handleImport = async () => {
        setIsProcessing(true);
        const filesToProcess = files.filter(f => statuses[f.name]?.status === 'pending' || statuses[f.name]?.status === 'error');

        for (const file of filesToProcess) {
            setStatuses(prev => ({ ...prev, [file.name]: { status: 'processing' }}));
            const result = await processFile(file);
            if (result.success && result.doc) {
                onFilesAdded(prev => [result.doc!, ...prev]);
                setStatuses(prev => ({ ...prev, [file.name]: { status: 'success' }}));
            } else {
                setStatuses(prev => ({ ...prev, [file.name]: { status: 'error', message: result.error }}));
            }
        }
        setIsProcessing(false);
    };

    const handleClose = () => {
        setFiles([]);
        setStatuses({});
        onClose();
    }

    const allDone = files.length > 0 && files.every(f => statuses[f.name]?.status === 'success' || statuses[f.name]?.status === 'error');

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Importar Documentos">
            {!allDone && (
                <div className="mt-4">
                    <form onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()}>
                        <input ref={inputRef} type="file" multiple onChange={handleChange} accept=".pdf,.epub" className="hidden" />
                        <label 
                            className={`h-40 w-full border-2 border-dashed ${dragActive ? "border-blue-500" : "border-slate-300 dark:border-slate-700"} rounded-lg flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-800/50`}
                        >
                            <div className="text-center">
                                <Icon name="upload" className="w-10 h-10 text-slate-400 mb-2" />
                                <p>Arraste e solte ou <button type="button" onClick={onButtonClick} className="font-semibold text-blue-500 hover:text-blue-600">selecione</button></p>
                                <p className="text-xs text-slate-400 mt-1">PDF & EPUB</p>
                            </div>
                        </label>
                        {dragActive && <div className="absolute inset-0" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div>}
                    </form>
                </div>
            )}

            {files.length > 0 && (
                <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-2">
                    {files.map(f => (
                        <div key={f.name} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                           <div className="flex items-center space-x-2 min-w-0">
                             <Icon name={f.name.endsWith('.pdf') ? 'fileText' : 'book'} className="w-5 h-5 text-slate-500 flex-shrink-0" />
                             <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{f.name}</p>
                           </div>
                           <div className="flex items-center space-x-2 flex-shrink-0">
                             <StatusIcon status={statuses[f.name]?.status} />
                             {statuses[f.name]?.status === 'error' && <p className="text-xs text-red-500">{statuses[f.name].message}</p>}
                           </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="mt-6 flex justify-end space-x-3">
                <button onClick={handleClose} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                    {allDone ? 'Fechar' : 'Cancelar'}
                </button>
                {!allDone && (
                    <button onClick={handleImport} disabled={files.length === 0 || isProcessing} className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-slate-400 flex items-center space-x-2">
                        {isProcessing && <Icon name="loader" className="animate-spin w-5 h-5"/>}
                        <span>{isProcessing ? `Processando...` : `Importar ${files.length} arquivo(s)`}</span>
                    </button>
                )}
            </div>
        </Modal>
    )
};

export default ImportModal;