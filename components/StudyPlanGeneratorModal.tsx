import * as React from 'react';
import Modal from './Modal.tsx';
import Icon from './Icon.tsx';
import { generateStudyPlan } from '../services/geminiService.ts';
import { Subject } from '../types.ts';
import AIProgressBar from './AIProgressBar.tsx';

interface StudyPlanGeneratorModalProps {
    subject: Subject | null;
    onPlanGenerated: (plan: string) => void;
    onSkip: () => void;
    onClose: () => void;
}

const StudyPlanGeneratorModal: React.FC<StudyPlanGeneratorModalProps> = ({ subject, onPlanGenerated, onSkip, onClose }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [generatedPlan, setGeneratedPlan] = React.useState<string | null>(null);

    const handleGenerate = async () => {
        if (!subject) return;
        setIsLoading(true);
        setGeneratedPlan(null);
        try {
            const plan = await generateStudyPlan(subject.name);
            setGeneratedPlan(plan);
        } catch (error) {
            console.error("Failed to generate study plan", error);
            onSkip();
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = () => {
        if (generatedPlan) {
            onPlanGenerated(generatedPlan);
        } else {
            onSkip();
        }
    };

    const handleModalClose = () => {
        setIsLoading(false);
        setGeneratedPlan(null);
        onClose();
    };

    return (
        <Modal isOpen={!!subject} onClose={isLoading ? () => {} : handleModalClose} title="Plano de Estudos com IA">
            {isLoading || generatedPlan ? (
                <AIProgressBar
                    title="Gerando seu plano de estudos..."
                    messages={[
                        "Analisando o tema da disciplina...",
                        "Estruturando os módulos de aprendizado...",
                        "Definindo os tópicos principais...",
                        "Finalizando o plano...",
                    ]}
                    isGenerating={isLoading}
                    onComplete={handleComplete}
                />
            ) : (
                <>
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
                            <span>Gerar com IA</span>
                        </button>
                    </div>
                </>
            )}
        </Modal>
    );
}

export default StudyPlanGeneratorModal;
