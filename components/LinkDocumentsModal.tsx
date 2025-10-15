import * as React from 'react';
import { LibraryDocument } from '../types.ts';
import Modal from './Modal.tsx';
import Icon from './Icon.tsx';

interface LinkDocumentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    allDocuments: LibraryDocument[];
    linkedDocumentIds: string[];
    onLinkDocuments: (docIds: string[]) => void;
}

const LinkDocumentsModal: React.FC<LinkDocumentsModalProps> = ({ isOpen, onClose, allDocuments, linkedDocumentIds, onLinkDocuments }) => {
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

    React.useEffect(() => {
        if (isOpen) {
            setSelectedIds(new Set(linkedDocumentIds));
        }
    }, [isOpen, linkedDocumentIds]);

    const handleToggle = (docId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(docId)) {
                newSet.delete(docId);
            } else {
                newSet.add(docId);
            }
            return newSet;
        });
    };

    const handleSave = () => {
        onLinkDocuments(Array.from(selectedIds));
        onClose();
    };

    const getDocIcon = (type: LibraryDocument['type']) => {
        switch (type) {
            case 'pdf': return 'fileText';
            case 'epub': return 'book';
            case 'note': return 'edit';
            case 'web': return 'link';
            default: return 'fileText';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Vincular Documentos da Biblioteca">
            <div className="mt-4 max-h-96 overflow-y-auto pr-2 -mr-2 space-y-2">
                {allDocuments.length > 0 ? allDocuments.map(doc => {
                    const isSelected = selectedIds.has(doc.id);
                    return (
                        <div 
                            key={doc.id} 
                            onClick={() => handleToggle(doc.id)}
                            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-purple-100 dark:bg-purple-900/50 border-purple-300 dark:border-purple-700 border' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-slate-400'}`}>
                                {isSelected && <Icon name="check" className="w-4 h-4 text-white" />}
                            </div>
                            <Icon name={getDocIcon(doc.type)} className="w-5 h-5 text-slate-500 flex-shrink-0" />
                            <span className="truncate">{doc.name}</span>
                        </div>
                    )
                }) : (
                    <p className="text-slate-500 text-center py-4">Sua biblioteca está vazia.</p>
                )}
            </div>
             <div className="mt-6 flex justify-end">
                <button onClick={handleSave} className="bg-purple-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-purple-600">
                    Salvar
                </button>
            </div>
        </Modal>
    );
};

export default LinkDocumentsModal;
