import * as React from 'react';
import { LibraryDocument, Collection, Subject, View, IconName } from '../../types.ts';
import Icon from '../Icon.tsx';
import Modal from '../Modal.tsx';
import { findRelevantDocuments } from '../../services/geminiService.ts';
import useDebounce from '../../hooks/useDebounce.ts';
import { deleteDocumentContent, getDocumentContent, saveDocumentContent } from '../../utils/db.ts';
import ImportModal from '../ImportModal.tsx';
import WebClipModal from '../WebClipModal.tsx';

// A new modal component for moving documents to collections
const MoveToCollectionModal: React.FC<{
    document: LibraryDocument;
    collections: Collection[];
    onMove: (docId: string, collectionId: string | null) => void;
    onClose: () => void;
}> = ({ document, collections, onMove, onClose }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title={`Mover "${document.name}" para:`}>
            <div className="mt-4 max-h-60 overflow-y-auto">
                <ul className="space-y-2">
                    {collections.map(col => (
                        <li key={col.id}>
                            <button onClick={() => { onMove(document.id, col.id); onClose(); }} className="w-full text-left p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                {col.name}
                            </button>
                        </li>
                    ))}
                    {document.collectionId && (
                         <li>
                            <button onClick={() => { onMove(document.id, null); onClose(); }} className="w-full text-left p-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
                                Remover da coleção atual
                            </button>
                        </li>
                    )}
                </ul>
            </div>
        </Modal>
    );
};

interface LibraryViewProps {
    documents: LibraryDocument[];
    setDocuments: React.Dispatch<React.SetStateAction<LibraryDocument[]>>;
    collections: Collection[];
    setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
    setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
    setActiveView: (view: View) => void;
    setSelectedDoc: (doc: LibraryDocument | null) => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ documents, setDocuments, collections, setCollections, setSubjects, setActiveView, setSelectedDoc }) => {
    const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
    const [isWebClipModalOpen, setIsWebClipModalOpen] = React.useState(false);
    const [isNewCollectionModalOpen, setIsNewCollectionModalOpen] = React.useState(false);
    const [newCollectionName, setNewCollectionName] = React.useState('');
    const [docToDelete, setDocToDelete] = React.useState<LibraryDocument | null>(null);
    const [collectionToDelete, setCollectionToDelete] = React.useState<Collection | null>(null);
    const [docToMove, setDocToMove] = React.useState<LibraryDocument | null>(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [searchMode, setSearchMode] = React.useState<'keyword' | 'ai'>('keyword');
    const [aiSearchResults, setAiSearchResults] = React.useState<string[] | null>(null);
    const [isAiSearching, setIsAiSearching] = React.useState(false);
    const [selectedCollectionId, setSelectedCollectionId] = React.useState<string | null>(null);
    const [openMenuDocId, setOpenMenuDocId] = React.useState<string | null>(null);
    const [isAddMenuOpen, setIsAddMenuOpen] = React.useState(false);
    const addMenuRef = React.useRef<HTMLDivElement>(null);


    React.useEffect(() => {
        const performAiSearch = async () => {
            if (searchMode === 'ai' && debouncedSearchTerm) {
                setIsAiSearching(true);
                setAiSearchResults(null);
                const relevantIds = await findRelevantDocuments(debouncedSearchTerm, documents);
                setAiSearchResults(relevantIds);
                setIsAiSearching(false);
            } else {
                setAiSearchResults(null);
            }
        };
        performAiSearch();
    }, [debouncedSearchTerm, searchMode, documents]);
    
    // Close menus on any click outside
    React.useEffect(() => {
        const closeMenu = (event: MouseEvent) => {
             if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
                setIsAddMenuOpen(false);
            }
            setOpenMenuDocId(null)
        };
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    const handleAddCollection = () => {
        if (!newCollectionName.trim()) return;
        const newCollection: Collection = { id: new Date().toISOString(), name: newCollectionName.trim() };
        setCollections(prev => [...prev, newCollection]);
        setNewCollectionName('');
        setIsNewCollectionModalOpen(false);
    }
    
    const handleDeleteDoc = async () => {
        if(!docToDelete) return;
        await deleteDocumentContent(docToDelete.id);
        setDocuments(docs => docs.filter(d => d.id !== docToDelete.id));
        setDocToDelete(null);
    }

    const handleDeleteCollection = () => {
        if (!collectionToDelete) return;
        setDocuments(docs => docs.map(d => d.collectionId === collectionToDelete.id ? { ...d, collectionId: null } : d));
        setCollections(cols => cols.filter(c => c.id !== collectionToDelete.id));
        setCollectionToDelete(null);
    };

    const handleMoveDocument = (docId: string, collectionId: string | null) => {
        setDocuments(docs => docs.map(d => d.id === docId ? { ...d, collectionId: collectionId || undefined } : d));
    };

     const handleCreateQuickNote = async () => {
        const docId = `note-${new Date().toISOString()}`;
        const newDoc: LibraryDocument = {
            id: docId,
            name: "Nova Nota",
            type: 'note',
            createdAt: new Date().toISOString(),
        };
        await saveDocumentContent(docId, '', '');
        setDocuments(prev => [newDoc, ...prev]);
        setSelectedDoc(newDoc);
    };

    const handleDocumentAdded = (newDoc: LibraryDocument) => {
        setDocuments(prev => [newDoc, ...prev]);
    };

    const handleOpenExternally = async (e: React.MouseEvent, doc: LibraryDocument) => {
        e.stopPropagation();
        try {
            const content = await getDocumentContent(doc.id);
            if (content?.fileDataUrl) {
                window.open(content.fileDataUrl, '_blank');
            } else {
                alert('Conteúdo do arquivo não encontrado. Por favor, tente importar o documento novamente.');
            }
        } catch (error) {
            console.error("Error opening document:", error);
            alert('Não foi possível abrir o arquivo.');
        }
    };
    
    const getDocIcon = (type: LibraryDocument['type']): IconName => {
        switch (type) {
            case 'pdf': return 'fileText';
            case 'epub': return 'book';
            case 'note': return 'edit';
            case 'web': return 'link';
            default: return 'fileText';
        }
    };

    const filteredDocuments = React.useMemo(() => {
        let docs = documents;
        if (selectedCollectionId) {
            docs = docs.filter(doc => doc.collectionId === selectedCollectionId);
        }
        if (searchMode === 'ai') {
            if (aiSearchResults) {
                const aiResultIds = new Set(aiSearchResults);
                return docs.filter(doc => aiResultIds.has(doc.id));
            }
            return isAiSearching || debouncedSearchTerm ? [] : docs;
        }
        if (!debouncedSearchTerm) return docs;
        return docs.filter(doc => 
            doc.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
    }, [documents, selectedCollectionId, debouncedSearchTerm, searchMode, aiSearchResults, isAiSearching]);


    return (
        <div className="pt-12">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Biblioteca</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mt-2">Sua coleção pessoal de conhecimento e insights.</p>
            </header>

            <div className="sticky top-4 z-20 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md -mx-4 px-4 py-4 mb-4">
                 <div className="flex justify-between items-center gap-4">
                    <div className="relative flex-grow">
                        <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text"
                            placeholder={searchMode === 'ai' ? 'Busca semântica com IA...' : 'Buscar por palavra-chave...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                     <div className="relative" ref={addMenuRef}>
                        <button onClick={() => setIsAddMenuOpen(prev => !prev)} className="bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-600 transition-colors flex items-center space-x-2">
                            <Icon name="plus" className="w-5 h-5" />
                            <span className="hidden sm:inline">Adicionar</span>
                            <Icon name="chevronDown" className="w-4 h-4" />
                        </button>
                        {isAddMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-30">
                                <div className="py-1">
                                    <button onClick={() => { setIsImportModalOpen(true); setIsAddMenuOpen(false); }} className="group flex w-full items-center rounded-md px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <Icon name="upload" className="mr-3 h-5 w-5" />
                                        Importar Arquivo
                                    </button>
                                    <button onClick={() => { setIsWebClipModalOpen(true); setIsAddMenuOpen(false); }} className="group flex w-full items-center rounded-md px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <Icon name="link" className="mr-3 h-5 w-5" />
                                        Salvar Link da Web
                                    </button>
                                    <button onClick={() => { handleCreateQuickNote(); setIsAddMenuOpen(false); }} className="group flex w-full items-center rounded-md px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <Icon name="edit" className="mr-3 h-5 w-5" />
                                        Nova Nota Rápida
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-center mt-3">
                    <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
                        <button onClick={() => setSearchMode('keyword')} className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${searchMode === 'keyword' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow' : 'text-slate-500'}`}>
                            Padrão
                        </button>
                        <button onClick={() => setSearchMode('ai')} className={`flex items-center space-x-1 px-4 py-1 text-sm font-semibold rounded-md transition-colors ${searchMode === 'ai' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow' : 'text-slate-500'}`}>
                            <Icon name="sparkles" className="w-4 h-4 text-purple-500" />
                            <span>IA</span>
                        </button>
                    </div>
                </div>
            </div>

            <section className="mb-12">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-300">Coleções</h2>
                    <button onClick={() => setIsNewCollectionModalOpen(true)} className="text-sm font-semibold text-blue-500 hover:text-blue-600 flex items-center space-x-1">
                        <Icon name="plus" className="w-4 h-4" />
                        <span>Nova Coleção</span>
                    </button>
                </div>
                {collections.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
                        <div onClick={() => setSelectedCollectionId(null)} className={`relative group flex-shrink-0 w-56 h-32 bg-white dark:bg-slate-900/50 border rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${ selectedCollectionId === null ? 'border-blue-500 shadow-lg' : 'border-slate-200 dark:border-slate-800 hover:border-blue-400/50'}`}>
                            <Icon name="layoutGrid" className="w-10 h-10 text-slate-500 dark:text-slate-400 mb-2" />
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Todos os Documentos</h3>
                        </div>
                        {collections.map(col => (
                            <div key={col.id} onClick={() => setSelectedCollectionId(col.id)} className={`relative group flex-shrink-0 w-56 h-32 bg-white dark:bg-slate-900/50 border rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${ selectedCollectionId === col.id ? 'border-blue-500 shadow-lg' : 'border-slate-200 dark:border-slate-800 hover:border-blue-400/50'}`}>
                                <Icon name="folder" className="w-10 h-10 text-blue-500 dark:text-blue-400 mb-2" />
                                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{col.name}</h3>
                                <button onClick={(e) => { e.stopPropagation(); setCollectionToDelete(col); }} className="absolute top-2 right-2 p-1.5 bg-white/50 dark:bg-slate-800/50 rounded-full text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon name="trash" className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-slate-500">Crie coleções para organizar seus documentos.</p>}
            </section>
            
            <section>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-300 mb-4">{selectedCollectionId ? collections.find(c => c.id === selectedCollectionId)?.name : 'Todos os Documentos'}</h2>
                <div className="space-y-3">
                    { isAiSearching ? (
                         <div className="text-center py-10">
                            <Icon name="loader" className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto animate-spin" />
                            <p className="text-slate-500 dark:text-slate-500 mt-2">Buscando com IA...</p>
                        </div>
                    ) : filteredDocuments.length > 0 ? (
                        filteredDocuments.map(doc => (
                            <div key={doc.id} onClick={() => setSelectedDoc(doc)} className="group bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex items-center space-x-4 cursor-pointer hover:border-blue-400/50 transition-colors">
                                <Icon name={getDocIcon(doc.type)} className="w-6 h-6 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                <div className="flex-grow min-w-0">
                                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{doc.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="relative flex-shrink-0">
                                    <button onClick={(e) => { e.stopPropagation(); setOpenMenuDocId(openMenuDocId === doc.id ? null : doc.id); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 focus:ring-blue-500">
                                        <Icon name="ellipsisVertical" className="w-5 h-5" />
                                    </button>
                                    {openMenuDocId === doc.id && (
                                         <div onClick={e => e.stopPropagation()} className="absolute right-0 z-30 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                             <div className="py-1">
                                                 {(doc.type === 'pdf' || doc.type === 'epub') && (
                                                    <button onClick={(e) => { handleOpenExternally(e, doc); setOpenMenuDocId(null); }} className="group flex w-full items-center rounded-md px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                                                        <Icon name="download" className="mr-3 h-5 w-5" />
                                                        Abrir Externamente
                                                    </button>
                                                 )}
                                                 {doc.type === 'web' && doc.url && (
                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" onClick={() => setOpenMenuDocId(null)} className="group flex w-full items-center rounded-md px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                                                        <Icon name="link" className="mr-3 h-5 w-5" />
                                                        Abrir Link Original
                                                    </a>
                                                 )}
                                                 <button onClick={() => { setDocToMove(doc); setOpenMenuDocId(null); }} className="group flex w-full items-center rounded-md px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                                                     <Icon name="move" className="mr-3 h-5 w-5" />
                                                     Mover para...
                                                 </button>
                                                 <button onClick={() => { setDocToDelete(doc); setOpenMenuDocId(null); }} className="group flex w-full items-center rounded-md px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10">
                                                     <Icon name="trash" className="mr-3 h-5 w-5" />
                                                     Excluir
                                                 </button>
                                             </div>
                                         </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-lg">
                            <Icon name="fileText" className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
                            <h2 className="mt-4 text-lg font-semibold text-slate-600 dark:text-slate-400">Nenhum documento encontrado</h2>
                            <p className="text-slate-500 dark:text-slate-500 mt-1">{debouncedSearchTerm ? "Tente uma busca diferente." : "Clique em 'Adicionar' para começar."}</p>
                        </div>
                    )}
                </div>
            </section>

            <ImportModal 
                isOpen={isImportModalOpen} 
                onClose={() => setIsImportModalOpen(false)} 
                onFilesAdded={setDocuments}
            />
            <WebClipModal
                isOpen={isWebClipModalOpen}
                onClose={() => setIsWebClipModalOpen(false)}
                onDocumentAdded={handleDocumentAdded}
            />
            {docToMove && (
                <MoveToCollectionModal
                    document={docToMove}
                    collections={collections}
                    onMove={handleMoveDocument}
                    onClose={() => setDocToMove(null)}
                />
            )}

             <Modal isOpen={isNewCollectionModalOpen} onClose={() => setIsNewCollectionModalOpen(false)} title="Criar Nova Coleção">
                <div className="mt-4">
                    <label htmlFor="collection-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nome da Coleção</label>
                    <input type="text" id="collection-name" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} className="mt-1 w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" placeholder="Ex: Filosofia, Psicologia..." />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => setIsNewCollectionModalOpen(false)} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">Cancelar</button>
                    <button onClick={handleAddCollection} className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600">Criar</button>
                </div>
            </Modal>
             <Modal isOpen={!!docToDelete} onClose={() => setDocToDelete(null)} title="Confirmar Exclusão">
                <p className="mt-4 text-slate-600 dark:text-slate-400">Tem certeza que deseja excluir o documento <strong>{docToDelete?.name}</strong>? Esta ação não pode ser desfeita.</p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => setDocToDelete(null)} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">Cancelar</button>
                    <button onClick={handleDeleteDoc} className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600">Excluir</button>
                </div>
            </Modal>
            <Modal isOpen={!!collectionToDelete} onClose={() => setCollectionToDelete(null)} title="Confirmar Exclusão">
                <p className="mt-4 text-slate-600 dark:text-slate-400">Tem certeza que deseja excluir a coleção <strong>{collectionToDelete?.name}</strong>? Os documentos nesta coleção não serão excluídos.</p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => setCollectionToDelete(null)} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">Cancelar</button>
                    <button onClick={handleDeleteCollection} className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600">Excluir</button>
                </div>
            </Modal>
        </div>
    );
};

export default LibraryView;