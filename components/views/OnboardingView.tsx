import * as React from 'react';
import Icon from '../Icon.tsx';
import Logo from '../Logo.tsx'; // New Logo component

interface OnboardingViewProps {
    onComplete: (name: string) => void;
}

const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
    const [name, setName] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onComplete(name.trim());
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <div className="text-center p-8 max-w-lg w-full">
                
                <Logo className="w-24 h-24 mx-auto mb-6 animate-fade-in-up" />

                <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 tracking-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    Bem-vindo(a) ao Psique+
                </h1>
                
                <p className="text-xl text-slate-500 dark:text-slate-400 mt-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    Seu ecossistema para a exploração da consciência.
                </p>
                
                <form onSubmit={handleSubmit} className="mt-12 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                    <label htmlFor="name" className="text-lg font-medium text-slate-700 dark:text-slate-300">
                        Como podemos te chamar?
                    </label>
                    
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Digite seu nome ou apelido"
                        className="mt-4 block w-full bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl py-4 px-5 text-center text-lg focus:ring-2 focus:ring-blue-500 shadow-sm transition"
                    />
                    
                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="mt-6 w-full bg-blue-500 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-600 transition-all duration-300 disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed group flex items-center justify-center space-x-2 shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-1"
                    >
                        <span>Começar Jornada</span>
                        <Icon name="arrowRight" className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OnboardingView;