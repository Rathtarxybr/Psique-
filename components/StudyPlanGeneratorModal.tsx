import * as React from 'react';
// FIX: Add .tsx extension to file path.
import Modal from './Modal.tsx';
// FIX: Add .tsx extension to file path.
import Icon from './Icon.tsx';
// FIX: Add .ts extension to file path.
import { generateStudyPlan } from '../services/geminiService.ts';
// FIX: Add .ts extension to file path.
import { Subject } from '../types.ts';

interface StudyPlanGeneratorModalProps {
    subject: Subject | null;
    onPlanGenerated: (plan: string) => void;
    onSkip: () => void;
    onClose: () => void;
}

const StudyPlanGeneratorModal: React.FC<StudyPlanGeneratorModalProps> = ({ subject, onPlanGenerated, onSkip, onClose }) => {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleGenerate = async () => {
        if (!subject) return;
        setIsLoading(true);
        try {
            const plan = await generateStudyPlan(subject.name);
            onPlanGenerated(plan);
        } catch (error) {
            console.error("Failed to generate study plan", error);
            // Fallback to skipping if there's an error
            onSkip();
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Modal isOpen={!!subject} onClose={onClose} title="Plano de Estudos com IA">
            <div className="text-center mt-4">
                <Icon name="sparkles" className="w-12 h-12 text-purple-500 dark:text-purple-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                    Gostaria que a IA gerasse um plano de estudos inicial para a disciplina <strong className="text-gray-800 dark:text-gray-200">{subject?.name}</strong>?
                </p>
            </div>
            <div className="mt-8 flex justify-center space-x-4">
                <button
                    onClick={onSkip}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                    Começar em Branco
                </button>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="bg-purple-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2 disabled:bg-gray-500 disabled:cursor-wait"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Gerando...</span>
                        </>
                    ) : (
                        <span>Gerar com IA</span>
                    )}
                </button>
            </div>
        </Modal>
    );
}

export default StudyPlanGeneratorModal;