import * as React from 'react';
import { Subject, Folder } from '../types.ts';
import Modal from './Modal.tsx';

interface MoveToFolderModalProps {
    subject: Subject;
    folders: Folder[];
    onMove: (subjectId: string, folderId: string | null) => void;
    onClose: () => void;
}

const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({ subject, folders, onMove, onClose }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title={`Mover "${subject.name}" para:`}>
            <div className="mt-4 max-h-60 overflow-y-auto">
                <ul className="space-y-2">
                    {folders.map(folder => (
                        <li key={folder.id}>
                            <button
                                onClick={() => { onMove(subject.id, folder.id); onClose(); }}
                                className="w-full text-left p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                {folder.name}
                            </button>
                        </li>
                    ))}
                    {subject.folderId && (
                        <li>
                            <button
                                onClick={() => { onMove(subject.id, null); onClose(); }}
                                className="w-full text-left p-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                                Remover da pasta atual
                            </button>
                        </li>
                    )}
                </ul>
            </div>
        </Modal>
    );
};

export default MoveToFolderModal;
