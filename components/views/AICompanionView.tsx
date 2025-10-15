import * as React from 'react';
// FIX: Add .ts extension to file path.
import { Message, JournalEntry, LibraryDocument, Subject } from '../../types.ts';
// FIX: Add .ts extension to file path.
import { streamAICompanionResponse } from '../../services/geminiService.ts';
// FIX: Add .tsx extension to file path.
import Icon from '../Icon.tsx';
import MarkdownRenderer from '../MarkdownRenderer.tsx';

interface AICompanionViewProps {
  userName: string;
  userPhoto: string;
  journalEntries: JournalEntry[];
  documents: LibraryDocument[];
  subjects: Subject[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const AICompanionView: React.FC<AICompanionViewProps> = ({ userName, userPhoto, journalEntries, documents, subjects, messages, setMessages }) => {
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    const historyForAPI = [...messages, userMessage];
    
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      text: '',
      sender: 'ai',
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage, aiMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const stream = await streamAICompanionResponse(userName, historyForAPI, journalEntries, documents, subjects);
        
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                setMessages(prev => prev.map(m => 
                    m.id === aiMessageId ? { ...m, text: (m.text || '') + chunkText } : m
                ));
            }
        }

    } catch (error) {
      console.error('Error streaming AI response:', error);
      setMessages(prev => prev.map(m => 
          m.id === aiMessageId ? { ...m, text: 'Desculpe, ocorreu um erro. Tente novamente.' } : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-12 flex flex-col h-[calc(100vh-7rem)] max-w-4xl mx-auto w-full">
      <header className="mb-4 text-center relative">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Companheiro IA</h1>
          <p className="text-md text-slate-500 dark:text-slate-400 mt-1">Converse com Psique para insights e reflexões.</p>
        </div>
        {messages.length > 0 && (
          <button 
            onClick={() => setMessages([])} 
            title="Limpar histórico"
            className="absolute top-0 right-0 p-2 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Icon name="trash" className="w-5 h-5" />
          </button>
        )}
      </header>
      
      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
            <div className="text-center text-slate-500 pt-16">
                <Icon name="messageSquare" className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <p>Faça uma pergunta para começar a conversa.</p>
                <p className="text-sm">Ex: "Me ajude a refletir sobre meu dia" ou "O que posso estudar sobre estoicismo?"</p>
            </div>
        )}
        {messages.map((message, index) => (
          <div key={message.id} className={`flex items-end gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.sender === 'ai' && (
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                <Icon name="sparkles" className="w-6 h-6 text-indigo-500" />
              </div>
            )}
            <div className={`max-w-xl p-4 rounded-2xl prose prose-slate dark:prose-invert max-w-none ${message.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 rounded-bl-none'}`}>
               <MarkdownRenderer content={message.text || ''} />
               {isLoading && message.sender === 'ai' && index === messages.length -1 && (
                   <div className="inline-block w-1 h-4 bg-slate-500 dark:bg-slate-300 ml-1 animate-pulse"></div>
               )}
            </div>
             {message.sender === 'user' && (
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                {userPhoto ? <img src={userPhoto} alt="User" className="w-full h-full object-cover" /> : <Icon name="user" className="w-6 h-6 text-slate-500" />}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-auto p-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md">
        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-4 pr-12 focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-slate-400">
            <Icon name="send" className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AICompanionView;