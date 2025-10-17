import * as React from 'react';
import { Flashcard, Subject } from '../types.ts';
import Icon from './Icon.tsx';
import AIProgressBar from './AIProgressBar.tsx';
import Modal from './Modal.tsx';
import EditFlashcardModal from './EditFlashcardModal.tsx';

interface FlashcardViewerProps {
    subject: Subject;
    onUpdateFlashcards: (flashcards: Flashcard[]) => void;
    onGenerate: () => void;
    isGenerating: boolean;
}

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ subject, onUpdateFlashcards, onGenerate, isGenerating }) => {
    const flashcards = subject.flashcards || [];
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [isFlipped, setIsFlipped] = React.useState(false);
    const [cardToEdit, setCardToEdit] = React.useState<Flashcard | null>(null);
    const [cardToDelete, setCardToDelete] = React.useState<Flashcard | null>(null);

    const goToNext = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex(prev => (prev + 1) % flashcards.length), 150);
    };

    const goToPrev = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length), 150);
    };
    
    React.useEffect(() => {
        if (flashcards.length > 0 && currentIndex >= flashcards.length) {
            setCurrentIndex(flashcards.length - 1);
        } else if (flashcards.length === 0) {
            setCurrentIndex(0);
        }
        setIsFlipped(false);
    }, [flashcards, currentIndex]);

    const handleSaveCard = (updatedCard: Flashcard) => {
        const updatedFlashcards = flashcards.map(card => 
            card.id === updatedCard.id ? updatedCard : card
        );
        onUpdateFlashcards(updatedFlashcards);
        setCardToEdit(null);
    };

    const handleDeleteCard = () => {
        if (!cardToDelete) return;
        const updatedFlashcards = flashcards.filter(card => card.id !== cardToDelete.id);
        onUpdateFlashcards(updatedFlashcards);
        setCardToDelete(null);
    };

    if (isGenerating) {
        return (
            <AIProgressBar
                title="Gerando Flashcards..."
                messages={[
                    "Analisando seus materiais de estudo...",
                    "Identificando conceitos-chave...",
                    "Formulando perguntas e respostas...",
                    "Construindo os cartões...",
                ]}
                isGenerating={isGenerating}
            />
        );
    }

    if (flashcards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Icon name="clipboardCheck" className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Gere Flashcards com IA</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-1">Clique no botão abaixo para criar um conjunto de flashcards com base nas suas anotações e documentos vinculados.</p>
                <button onClick={onGenerate} disabled={isGenerating} className="mt-6 bg-purple-500 text-white font-semibold py-2 px-5 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2 disabled:bg-slate-400">
                    <Icon name="sparkles" className="w-5 h-5" />
                    <span>Gerar Flashcards</span>
                </button>
            </div>
        );
    }
    
    const currentCard = flashcards[currentIndex];

    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full max-w-xl h-72 [perspective:1000px] relative">
                 <div
                    className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <div className="absolute w-full h-full [backface-visibility:hidden] bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center p-6 text-center border border-slate-200 dark:border-slate-700">
                        <p className="text-xl font-semibold text-slate-800 dark:text-slate-200">{currentCard.front}</p>
                    </div>
                    <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center p-6 text-center border border-blue-200 dark:border-blue-800">
                        <p className="text-lg text-slate-800 dark:text-slate-200">{currentCard.back}</p>
                    </div>
                </div>
                 <div className="absolute top-2 right-2 flex space-x-1">
                    <button onClick={() => setCardToEdit(currentCard)} className="p-2 rounded-full bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-blue-500"><Icon name="edit" className="w-4 h-4" /></button>
                    <button onClick={() => setCardToDelete(currentCard)} className="p-2 rounded-full bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-red-500"><Icon name="trash" className="w-4 h-4" /></button>
                </div>
            </div>
            
             <div className="mt-6 flex items-center justify-between w-full max-w-xl">
                <button onClick={goToPrev} className="p-3 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700">
                    <Icon name="arrowRight" className="w-6 h-6 transform rotate-180" />
                </button>
                <span className="font-semibold text-slate-600 dark:text-slate-400">{currentIndex + 1} / {flashcards.length}</span>
                <button onClick={goToNext} className="p-3 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700">
                    <Icon name="arrowRight" className="w-6 h-6" />
                </button>
            </div>
             <button onClick={onGenerate} disabled={isGenerating} className="mt-8 text-sm font-semibold text-purple-500 hover:text-purple-600 flex items-center space-x-1 disabled:text-slate-400">
                {isGenerating ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="sparkles" className="w-4 h-4" />}
                <span>{isGenerating ? 'Gerando...' : 'Gerar Mais Flashcards'}</span>
            </button>

            {cardToEdit && (
                <EditFlashcardModal
                    isOpen={!!cardToEdit}
                    onClose={() => setCardToEdit(null)}
                    flashcard={cardToEdit}
                    onSave={handleSaveCard}
                />
            )}
            
            <Modal isOpen={!!cardToDelete} onClose={() => setCardToDelete(null)} title="Confirmar Exclusão">
                <p className="mt-4 text-slate-600 dark:text-slate-400">Tem certeza que deseja excluir este flashcard? Esta ação não pode ser desfeita.</p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => setCardToDelete(null)} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">Cancelar</button>
                    <button onClick={handleDeleteCard} className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600">Excluir</button>
                </div>
            </Modal>
        </div>
    );
};

export default FlashcardViewer;
