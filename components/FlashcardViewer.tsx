import * as React from 'react';
// FIX: Add .ts extension to file path.
import { Flashcard } from '../types.ts';
// FIX: Add .tsx extension to file path.
import Icon from './Icon.tsx';

interface FlashcardViewerProps {
    flashcards: Flashcard[];
    onGenerate: () => void;
    isGenerating: boolean;
}

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ flashcards, onGenerate, isGenerating }) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [isFlipped, setIsFlipped] = React.useState(false);

    const goToNext = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex(prev => (prev + 1) % flashcards.length), 150);
    };

    const goToPrev = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length), 150);
    };
    
    React.useEffect(() => {
        // When new flashcards are added, don't reset to the first card.
        // Only reset if the list becomes empty.
        if (flashcards.length === 0) {
            setCurrentIndex(0);
        }
        setIsFlipped(false);
    }, [flashcards]);

    if (isGenerating && flashcards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Icon name="loader" className="w-8 h-8 text-purple-500 animate-spin" />
                <p className="mt-2 text-slate-500">Gerando flashcards com base no seu material...</p>
            </div>
        );
    }

    if (flashcards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Icon name="clipboardCheck" className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Gere Flashcards com IA</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-1">Clique no botão abaixo para criar um conjunto de flashcards com base nas suas anotações e documentos vinculados.</p>
                <button onClick={onGenerate} disabled={isGenerating} className="mt-6 bg-purple-500 text-white font-semibold py-2 px-5 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2 disabled:bg-slate-400">
                    {isGenerating ? <Icon name="loader" className="w-5 h-5 animate-spin" /> : <Icon name="sparkles" className="w-5 h-5" />}
                    <span>{isGenerating ? 'Gerando...' : 'Gerar Flashcards'}</span>
                </button>
            </div>
        );
    }
    
    const currentCard = flashcards[currentIndex];

    return (
        <div className="flex flex-col items-center">
            <div className="w-full max-w-xl h-72 [perspective:1000px]">
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
        </div>
    );
};

export default FlashcardViewer;