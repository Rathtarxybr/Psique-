import * as React from 'react';
// FIX: Add .ts extension to file path.
import { QuizQuestion } from '../types.ts';
// FIX: Add .tsx extension to file path.
import Icon from './Icon.tsx';

interface QuizViewProps {
    questions: QuizQuestion[];
    onGenerate: () => void;
    isGenerating: boolean;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, onGenerate, isGenerating }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
    const [userAnswers, setUserAnswers] = React.useState<string[]>([]);
    const [showResults, setShowResults] = React.useState(false);

    const handleAnswer = (answer: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = answer;
        setUserAnswers(newAnswers);

        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                setShowResults(true);
            }
        }, 300);
    };

    const restartQuiz = () => {
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setShowResults(false);
    }
    
    React.useEffect(() => {
        // Only reset the quiz if the question list fundamentally changes in a way
        // that isn't just appending (e.g., cleared completely).
        // This avoids resetting progress when more questions are added.
        if (currentQuestionIndex >= questions.length) {
            restartQuiz();
        }
    }, [questions]);

    if (isGenerating && questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Icon name="loader" className="w-8 h-8 text-green-500 animate-spin" />
                <p className="mt-2 text-slate-500">Gerando quiz com base no seu material...</p>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Icon name="swords" className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Teste Seu Conhecimento com um Quiz</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-1">Clique no botão abaixo para que a IA crie um quiz de múltipla escolha com base em suas anotações e documentos.</p>
                <button onClick={onGenerate} disabled={isGenerating} className="mt-6 bg-green-500 text-white font-semibold py-2 px-5 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2 disabled:bg-slate-400">
                    {isGenerating ? <Icon name="loader" className="w-5 h-5 animate-spin"/> : <Icon name="sparkles" className="w-5 h-5" />}
                    <span>{isGenerating ? 'Gerando...' : 'Gerar Quiz'}</span>
                </button>
            </div>
        );
    }

    if (showResults) {
        const score = userAnswers.reduce((acc, answer, index) => {
            return answer === questions[index].correctAnswer ? acc + 1 : acc;
        }, 0);

        return (
             <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Resultados do Quiz</h2>
                <p className="text-4xl font-bold mb-2">{score} / {questions.length}</p>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                    {score / questions.length > 0.7 ? "Excelente trabalho!" : "Continue estudando!"}
                </p>
                <div className="flex space-x-4 justify-center">
                    <button onClick={restartQuiz} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                        Tentar Novamente
                    </button>
                    <button onClick={onGenerate} disabled={isGenerating} className="bg-green-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-600 disabled:bg-slate-400 flex items-center">
                        {isGenerating && <Icon name="loader" className="animate-spin w-5 h-5 mr-2"/>}
                        {isGenerating ? 'Gerando...' : 'Gerar Mais Perguntas'}
                    </button>
                </div>
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex];
    const userAnswer = userAnswers[currentQuestionIndex];

    return (
        <div>
            <div className="mb-4">
                <span className="text-sm font-semibold text-slate-500">Questão {currentQuestionIndex + 1} de {questions.length}</span>
                <h2 className="text-xl font-semibold mt-1">{currentQuestion.question}</h2>
            </div>
            <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                     const isSelected = userAnswer === option;
                     const isCorrect = currentQuestion.correctAnswer === option;
                     
                     let buttonClass = 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700';
                     if (isSelected) {
                         buttonClass = isCorrect ? 'bg-green-200 dark:bg-green-900 border-green-400 text-green-800 dark:text-green-200' : 'bg-red-200 dark:bg-red-900 border-red-400 text-red-800 dark:text-red-200';
                     }

                    return (
                        <button key={option} onClick={() => handleAnswer(option)} disabled={!!userAnswer}
                            className={`w-full text-left p-4 rounded-lg border-2 border-transparent transition-colors duration-200 ${buttonClass}`}
                        >
                            {option}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

export default QuizView;