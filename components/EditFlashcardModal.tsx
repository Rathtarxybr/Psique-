import * as React from 'react';
import { Flashcard } from '../types.ts';
import Modal from './Modal.tsx';

interface EditFlashcardModalProps {
    isOpen: boolean;
    onClose: () => void;
    flashcard: Flashcard;
    onSave: (updatedFlashcard: Flashcard) => void;
}

const EditFlashcardModal: React.FC<EditFlashcardModalProps> = ({ isOpen, onClose, flashcard, onSave }) => {
    const [front, setFront] = React.useState(flashcard.front);
    const [back, setBack] = React.useState(flashcard.back);

    React.useEffect(() => {
        setFront(flashcard.front);
        setBack(flashcard.back);
    }, [flashcard]);

    const handleSave = () => {
        onSave({ ...flashcard, front, back });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Flashcard">
            <div className="mt-4 space-y-4">
                <div>
                    <label htmlFor="front" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Frente</label>
                    <textarea 
                        id="front" 
                        value={front} 
                        onChange={(e) => setFront(e.target.value)} 
                        rows={3}
                        className="mt-1 w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="back" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Verso</label>
                    <textarea 
                        id="back" 
                        value={back} 
                        onChange={(e) => setBack(e.target.value)} 
                        rows={4}
                        className="mt-1 w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={handleSave} className="bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-600">
                    Salvar
                </button>
            </div>
        </Modal>
    );
};

export default EditFlashcardModal;