import * as React from 'react';
import { Subject, LibraryDocument, Folder, ViewMode, Topic, Message } from '../../types.ts';
import Icon from '../Icon.tsx';
import CreateSubjectModal from '../CreateSubjectModal.tsx';
import MoveToFolderModal from '../MoveToFolderModal.tsx';
import Modal from '../Modal.tsx';
import StudyPlanGeneratorModal from '../StudyPlanGeneratorModal.tsx';
import { marked } from 'marked';

interface AcademyViewProps {
    subjects: Subject[];
    setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
    documents: LibraryDocument[];
    folders: Folder[];
    setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
    onSelectSubject: (subjectId: string) => void;
    setSubjectChatHistory: React.Dispatch<React.SetStateAction<{ [subjectId: string]: Message[] }>>;
}

const AcademyView: React.FC<AcademyViewProps> = ({ subjects, setSubjects, documents, folders, setFolders, onSelectSubject, setSubjectChatHistory }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = React.useState(false);
    const [newFolderName, setNewFolderName] = React.useState("");
    const [subjectToMove, setSubjectToMove] = React.useState<Subject | null>(null);
    const [subjectToDelete, setSubjectToDelete] = React.useState<Subject | null>(null);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(null);
    const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
    const [newlyCreatedSubject, setNewlyCreatedSubject] = React.useState<Subject | null>(null);

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        const newFolder: Folder = { id: new Date().toISOString(), name: newFolderName.trim() };
        setFolders(prev => [...prev, newFolder]);
        setNewFolderName("");
        setIsCreateFolderModalOpen(false);
    };

    const handleMoveSubject = (subjectId: string, folderId: string | null) => {
        setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, folderId: folderId || undefined } : s));
    };

    const handleDeleteSubject = () => {
        if (!subjectToDelete) return;

        // Remove the subject
        setSubjects(prev => prev.filter(s => s.id !== subjectToDelete.id));
    
        // Remove associated chat history
        setSubjectChatHistory(prev => {
            const newHistory = { ...prev };
            if (subjectToDelete.id) {
                delete newHistory[subjectToDelete.id];
            }
            return newHistory;
        });
    
        setSubjectToDelete(null);
    };

    const handlePlanGenerated = async (plan: string) => {
        if (!newlyCreatedSubject) return;
        
        const planHtml = await marked.parse(plan);
        const planTopic: Topic = { id: new Date().toISOString() + '-plan', name: 'Plano de Estudos (IA)', content: planHtml };

        const updatedSubject = { 
            ...newlyCreatedSubject, 
            topics: [...newlyCreatedSubject.topics, planTopic] 
        };
        
        setSubjects(prev => prev.map(s => s.id === updatedSubject.id ? updatedSubject : s));
        onSelectSubject(newlyCreatedSubject.id);
        setNewlyCreatedSubject(null);
    };

    const handlePlanSkippedOrClosed = () => {
        if (newlyCreatedSubject) {
            onSelectSubject(newlyCreatedSubject.id);
        }
        setNewlyCreatedSubject(null);
    };

    const filteredSubjects = React.useMemo(() => {
        return subjects.filter(subject => {
            const matchesFolder = selectedFolderId === null || subject.folderId === selectedFolderId;
            const matchesSearch = searchTerm === "" || subject.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesFolder && matchesSearch;
        });
    }, [subjects, selectedFolderId, searchTerm]);

    const subjectsInFolders = filteredSubjects.filter(s => s.folderId);
    const subjectsWithoutFolder = filteredSubjects.filter(s => !s.folderId);

    const SubjectCard: React.FC<{ subject: Subject }> = ({ subject }) => (
        <div className={`group relative bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-purple-400/50 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1 ${viewMode === 'list' ? 'flex items-center space-x-4' : ''}`}
            onClick={() => onSelectSubject(subject.id)}>
            <Icon name="academy" className={`w-10 h-10 text-purple-500 dark:text-purple-400 ${viewMode === 'list' ? '' : 'mb-4'}`} />
            <div className="flex-grow">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{subject.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subject.topics.length} tópico(s)</p>
            </div>
            {viewMode === 'grid' && (
                <div className="mt-4">
                    <span className="text-sm font-semibold text-purple-500 dark:text-purple-400 flex items-center group-hover:underline">
                        Estudar <Icon name="arrowRight" className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </span>
                </div>
            )}
             <div className="absolute top-3 right-3 flex items-center space-x-1">
                <button onClick={(e) => { e.stopPropagation(); setSubjectToMove(subject); }} className="p-2 rounded-full opacity-0 group-hover:opacity-100 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-500" title="Mover disciplina">
                    <Icon name="move" className="w-4 h-4" />
                </button>
                 <button onClick={(e) => { e.stopPropagation(); setSubjectToDelete(subject); }} className="p-2 rounded-full opacity-0 group-hover:opacity-100 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500" title="Excluir disciplina">
                    <Icon name="trash" className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="pt-12 animate-fadeIn">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Academia</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mt-2">Aprofunde seu conhecimento e organize seus estudos.</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <aside className="md:col-span-1">
                    <div className="sticky top-6">
                        <button onClick={() => setIsCreateModalOpen(true)} className="w-full mb-6 bg-purple-500 text-white font-semibold py-3 px-5 rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center space-x-2">
                            <Icon name="plus" className="w-5 h-5" />
                            <span>Nova Disciplina</span>
                        </button>
                        <div className="space-y-4">
                            <div>
                                <h3 className="px-2 text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Filtros</h3>
                                <div className="relative">
                                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text"
                                        placeholder="Buscar disciplina..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center px-2 mb-2">
                                     <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Pastas</h3>
                                     <button onClick={() => setIsCreateFolderModalOpen(true)} className="text-purple-500 hover:text-purple-600">
                                         <Icon name="folderPlus" className="w-5 h-5"/>
                                     </button>
                                </div>
                                <ul className="space-y-1">
                                    <li><button onClick={() => setSelectedFolderId(null)} className={`w-full text-left px-2 py-1.5 text-sm rounded-md font-medium ${selectedFolderId === null ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Todas as Disciplinas</button></li>
                                    {folders.map(folder => (
                                        <li key={folder.id}><button onClick={() => setSelectedFolderId(folder.id)} className={`w-full text-left px-2 py-1.5 text-sm rounded-md font-medium ${selectedFolderId === folder.id ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{folder.name}</button></li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </aside>
                
                <main className="md:col-span-3">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-300">
                            {selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : 'Todas as Disciplinas'}
                        </h2>
                        <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}><Icon name="layoutGrid" className="w-5 h-5"/></button>
                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}><Icon name="list" className="w-5 h-5"/></button>
                        </div>
                    </div>

                    <div className={viewMode === 'grid' ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-4"}>
                        {(selectedFolderId === null ? subjectsWithoutFolder : subjectsInFolders).map(subject => <SubjectCard key={subject.id} subject={subject} />)}
                    </div>
                    
                     {selectedFolderId === null && subjectsInFolders.length > 0 && subjectsWithoutFolder.length > 0 && <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6"></div>}

                    {selectedFolderId === null && folders.map(folder => {
                        const folderSubjects = subjectsInFolders.filter(s => s.folderId === folder.id);
                        if(folderSubjects.length === 0) return null;
                        return (
                             <div key={folder.id} className="mb-8">
                                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">{folder.name}</h3>
                                <div className={viewMode === 'grid' ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-4"}>
                                    {folderSubjects.map(subject => <SubjectCard key={subject.id} subject={subject} />)}
                                </div>
                             </div>
                        )
                    })}
                    
                    {filteredSubjects.length === 0 && (
                         <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-lg">
                            <Icon name="academy" className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
                            <h2 className="mt-4 text-lg font-semibold text-slate-600 dark:text-slate-400">Nenhuma disciplina encontrada</h2>
                            <p className="text-slate-500 dark:text-slate-500 mt-1">{searchTerm ? "Tente um termo de busca diferente." : "Crie uma nova disciplina para começar."}</p>
                        </div>
                    )}
                </main>
            </div>

            <CreateSubjectModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                setSubjects={setSubjects}
                onSubjectCreated={(subject) => {
                    setIsCreateModalOpen(false);
                    setNewlyCreatedSubject(subject);
                }}
            />

            <StudyPlanGeneratorModal
                subject={newlyCreatedSubject}
                onPlanGenerated={handlePlanGenerated}
                onSkip={handlePlanSkippedOrClosed}
                onClose={handlePlanSkippedOrClosed}
            />
            
            {subjectToMove && (
                <MoveToFolderModal
                    subject={subjectToMove}
                    folders={folders}
                    onMove={handleMoveSubject}
                    onClose={() => setSubjectToMove(null)}
                />
            )}
            
            <Modal isOpen={isCreateFolderModalOpen} onClose={() => setIsCreateFolderModalOpen(false)} title="Criar Nova Pasta">
                <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} className="mt-4 w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3" placeholder="Nome da pasta"/>
                <div className="mt-4 flex justify-end">
                    <button onClick={handleCreateFolder} className="bg-purple-500 text-white font-semibold py-2 px-4 rounded-lg">Criar</button>
                </div>
            </Modal>
            
            <Modal isOpen={!!subjectToDelete} onClose={() => setSubjectToDelete(null)} title="Confirmar Exclusão">
                <p className="mt-4 text-slate-600 dark:text-slate-400">
                    Tem certeza que deseja excluir a disciplina <strong>{subjectToDelete?.name}</strong>? Esta ação não pode ser desfeita e removerá todo o conteúdo associado.
                </p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => setSubjectToDelete(null)} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                        Cancelar
                    </button>
                    <button onClick={handleDeleteSubject} className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600">
                        Excluir
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default AcademyView;