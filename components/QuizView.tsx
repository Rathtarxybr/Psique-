import * as React from 'react';
// FIX: Add .ts extension to file path.
import { QuizQuestion } from '../types.ts';
// FIX: Add .tsx extension to file path.
import Icon from './Icon.tsx';
import AIProgressBar from './AIProgressBar.tsx';

interface QuizViewProps {
    questions: QuizQuestion[];
    onGenerate: () => void;
    isGenerating: boolean;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, onGenerate, isGenerating }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
    const [userAnswers, setUserAnswers] = React.useState<(string | null)[]>([]);
    const [showResults, setShowResults] = React.useState(false);
    const [isReviewing, setIsReviewing] = React.useState(false);

    const handleAnswer = (answer: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = answer;
        setUserAnswers(newAnswers);
    };

    const goToNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            setShowResults(true);
        }
    };

    const goToPrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const restartQuiz = () => {
        setCurrentQuestionIndex(0);
        setUserAnswers(Array(questions.length).fill(null));
        setShowResults(false);
        setIsReviewing(false);
    }
    
    React.useEffect(() => {
        // Always restart the quiz when the questions prop changes.
        // This handles generating a new quiz, clearing the quiz, and prevents
        // stale state from a previous quiz run causing errors.
        restartQuiz();
    }, [questions]);

    if (isGenerating) {
        return (
            <AIProgressBar
                title="Montando seu Quiz..."
                messages={[
                    "Analisando o conteúdo para criar perguntas...",
                    "Elaborando opções desafiadoras...",
                    "Revisando o material para garantir precisão...",
                    "Finalizando as questões...",
                ]}
                isGenerating={isGenerating}
            />
        );
    }
    
    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Icon name="swords" className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Teste Seu Conhecimento com um Quiz</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-1">Clique no botão abaixo para que a IA crie um quiz de múltipla escolha com base em suas anotações e documentos.</p>
                <button onClick={onGenerate} disabled={isGenerating} className="mt-6 bg-green-500 text-white font-semibold py-2 px-5 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2 disabled:bg-slate-400">
                    <Icon name="sparkles" className="w-5 h-5" />
                    <span>Gerar Quiz</span>
                </button>
            </div>
        );
    }

    if (showResults) {
        if (isReviewing) {
            return (
                <div className="w-full max-w-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Revisão do Quiz</h2>
                        <button onClick={() => setIsReviewing(false)} className="text-sm font-semibold text-blue-500">Voltar aos Resultados</button>
                    </div>
                    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                        {questions.map((q, index) => {
                            const userAnswer = userAnswers[index];
                            return (
                                <div key={index} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{index + 1}. {q.question}</p>
                                    <div className="mt-3 space-y-2 text-sm">
                                        {q.options.map(option => {
                                            const isCorrectAnswer = option === q.correctAnswer;
                                            const isUserAnswer = option === userAnswer;
                                            let state: 'correct' | 'user_wrong' | 'neutral' = 'neutral';
                                            if (isCorrectAnswer) state = 'correct';
                                            else if (isUserAnswer) state = 'user_wrong';

                                            return (
                                                <div 
                                                    key={option} 
                                                    className={`flex items-center space-x-3 p-2 rounded-md ${
                                                        state === 'correct' ? 'bg-green-500/20' : 
                                                        state === 'user_wrong' ? 'bg-red-500/20' : 
                                                        'bg-slate-100 dark:bg-slate-800/50'
                                                    }`}
                                                >
                                                    {state === 'correct' && <Icon name="checkCircle" className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />}
                                                    {state === 'user_wrong' && <Icon name="xCircle" className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />}
                                                    {state === 'neutral' && <div className="w-5 h-5 flex-shrink-0" />}
                                                    <span className={`
                                                        ${state === 'correct' ? 'font-semibold text-slate-800 dark:text-slate-200' : ''} 
                                                        ${state === 'user_wrong' ? 'line-through text-slate-600 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}
                                                    `}>
                                                        {option}
                                                    </span>
                                                     {isUserAnswer && state === 'correct' && <span className="text-xs font-bold text-green-700 dark:text-green-300 ml-auto">(Sua resposta)</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )
        }
        
        const score = userAnswers.reduce((acc, answer, index) => {
            if (questions[index]) { // Safeguard against race conditions
                return answer === questions[index].correctAnswer ? acc + 1 : acc;
            }
            return acc;
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
                     <button onClick={() => setIsReviewing(true)} className="bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-600">
                        Revisar Respostas
                    </button>
                </div>
                 <button onClick={onGenerate} disabled={isGenerating} className="mt-6 text-sm font-semibold text-green-500 hover:text-green-600 flex items-center justify-center mx-auto space-x-1 disabled:text-slate-400">
                    {isGenerating ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="sparkles" className="w-4 h-4" />}
                    <span>{isGenerating ? 'Gerando...' : 'Gerar Novo Quiz'}</span>
                </button>
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex];
    const userAnswer = userAnswers[currentQuestionIndex];

    return (
        <div className="w-full max-w-2xl flex flex-col">
            <div className="mb-4">
                <span className="text-sm font-semibold text-slate-500">Questão {currentQuestionIndex + 1} de {questions.length}</span>
                <h2 className="text-xl font-semibold mt-1">{currentQuestion.question}</h2>
            </div>
            <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                     const isSelected = userAnswer === option;
                     
                     let buttonClass = 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700';
                     if (isSelected) {
                        buttonClass = 'bg-blue-200 dark:bg-blue-900/50 border-blue-400 text-blue-800 dark:text-blue-200 ring-2 ring-blue-500';
                     }
                     
                    return (
                        <button key={option} onClick={() => handleAnswer(option)}
                            className={`w-full text-left p-4 rounded-lg border-2 border-transparent transition-all duration-200 ${buttonClass}`}
                        >
                            {option}
                        </button>
                    )
                })}
            </div>

            <div className="mt-8 flex justify-between w-full">
                <button onClick={goToPrev} disabled={currentQuestionIndex === 0} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                    Anterior
                </button>
                <button onClick={goToNext} className="bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-600">
                    {currentQuestionIndex === questions.length - 1 ? 'Ver Resultados' : 'Próxima'}
                </button>
            </div>
        </div>
    );
};

export default QuizView;