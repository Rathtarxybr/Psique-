import * as React from 'react';
import Icon from './Icon.tsx';

interface AIProgressBarProps {
    title: string;
    messages: string[];
    isGenerating: boolean;
    onComplete?: () => void;
    className?: string;
}

const AIProgressBar: React.FC<AIProgressBarProps> = ({ title, messages, isGenerating, onComplete, className }) => {
    const [progress, setProgress] = React.useState(0);
    const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);
    const [isComplete, setIsComplete] = React.useState(false);

    // Message cycling effect
    React.useEffect(() => {
        if (isGenerating && messages.length > 1) {
            const interval = setInterval(() => {
                setCurrentMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
            }, 2500);
            return () => clearInterval(interval);
        }
    }, [isGenerating, messages.length]);

    // Progress simulation effect
    React.useEffect(() => {
        let interval: number;

        if (isGenerating) {
            setIsComplete(false);
            setProgress(0);
            setCurrentMessageIndex(0);
            
            interval = window.setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) {
                        clearInterval(interval);
                        return 95;
                    }
                    const increment = Math.random() * (10 / (1 + prev * 0.1));
                    return Math.min(prev + increment, 95);
                });
            }, 500);
        } else if (!isGenerating && progress > 0 && !isComplete) {
            // This block runs when isGenerating becomes false
            setProgress(100);
            setIsComplete(true);
            
            if (onComplete) {
                setTimeout(onComplete, 1200);
            }
        }

        return () => clearInterval(interval);
    }, [isGenerating]);

    return (
        <div className={`flex flex-col items-center justify-center text-center p-4 ${className}`}>
            <Icon name={isComplete ? "checkCircle" : "sparkles"} className={`w-12 h-12 mb-4 transition-colors duration-500 ${isComplete ? 'text-green-500' : 'text-purple-500'}`} />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {isComplete ? "Concluído!" : title}
            </h3>
            
            <div className="w-full max-w-sm bg-slate-200 dark:bg-slate-700 rounded-full h-4 my-4 relative overflow-hidden">
                <div 
                    className={`h-4 rounded-full transition-all duration-500 ease-in-out ${isComplete ? 'bg-green-500' : 'bg-purple-500'}`}
                    style={{ width: `${progress}%` }}
                ></div>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-overlay">
                    {Math.round(progress)}%
                </span>
            </div>

            <p className="text-slate-500 dark:text-slate-400 min-h-[2.5rem] transition-opacity duration-500">
                {isComplete ? "Seu material está pronto." : messages[currentMessageIndex]}
            </p>
        </div>
    );
};

export default AIProgressBar;
