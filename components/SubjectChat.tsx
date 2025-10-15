import * as React from 'react';
// FIX: Add .ts extension to file path.
import { Message } from '../types.ts';
// FIX: Add .ts extension to file path.
import { streamSubjectChatResponse } from '../services/geminiService.ts';
// FIX: Add .tsx extension to file path.
import Icon from './Icon.tsx';
import MarkdownRenderer from './MarkdownRenderer.tsx';

interface SubjectChatProps {
  subjectName: string;
  studyContext: string;
  history: Message[];
  setHistory: (messages: Message[]) => void;
}

const SubjectChat: React.FC<SubjectChatProps> = ({ subjectName, studyContext, history: messages, setHistory: setMessages }) => {
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Use a ref to hold the latest messages array to avoid stale closures in the streaming loop.
  const messagesRef = React.useRef(messages);
  React.useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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
    
    setMessages([...historyForAPI, aiMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const stream = await streamSubjectChatResponse(subjectName, studyContext, historyForAPI);
        let accumulatedText = '';
        
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                accumulatedText += chunkText;
                const currentMessages = messagesRef.current;
                const updatedMessages = currentMessages.map(m => 
                    m.id === aiMessageId ? { ...m, text: accumulatedText } : m
                );
                setMessages(updatedMessages);
            }
        }

    } catch (error) {
      console.error('Error streaming subject chat response:', error);
      const currentMessages = messagesRef.current;
      const updatedMessages = currentMessages.map(m => 
          m.id === aiMessageId ? { ...m, text: 'Desculpe, ocorreu um erro. Tente novamente.' } : m
      );
      setMessages(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
        {messages.length === 0 && (
            <div className="text-center text-slate-500 pt-10">
                <div className="relative inline-block">
                    <Icon name="brainCircuit" className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                     {messages.length > 0 && (
                        <button 
                            onClick={() => setMessages([])}
                            title="Limpar histórico"
                            className="absolute -top-2 -right-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <Icon name="trash" className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <h3 className="font-semibold">Converse com seus materiais de estudo</h3>
                <p className="text-sm">A IA responderá usando apenas o conteúdo desta disciplina.</p>
            </div>
        )}
        {messages.map((message, index) => (
          <div key={message.id} className={`flex items-end gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.sender === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                <Icon name="academy" className="w-5 h-5 text-purple-500" />
              </div>
            )}
            <div className={`max-w-lg p-3 rounded-lg prose prose-sm dark:prose-invert max-w-none ${message.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-800 rounded-bl-none'}`}>
                 <MarkdownRenderer content={message.text || ''} />
                 {isLoading && message.sender === 'ai' && index === messages.length -1 && (
                     <div className="inline-block w-1 h-3 bg-slate-500 dark:bg-slate-300 ml-1 animate-pulse"></div>
                 )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
         {messages.length > 0 && (
            <button 
                onClick={() => setMessages([])}
                title="Limpar histórico"
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
                <Icon name="trash" className="w-5 h-5" />
            </button>
        )}
        <form onSubmit={handleSendMessage} className="relative flex-grow">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre suas anotações..."
            disabled={isLoading}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg py-2.5 pl-4 pr-10 focus:ring-2 focus:ring-purple-500"
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-purple-500 text-white hover:bg-purple-600 disabled:bg-slate-400">
            <Icon name="send" className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubjectChat;