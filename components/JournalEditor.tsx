import * as React from 'react';
// FIX: Import MoodValue instead of Mood.
// FIX: Add .ts extension to file path.
import { JournalEntry, MoodValue } from '../types.ts';
// FIX: Add .tsx extension to file path.
import MoodSelector from './MoodSelector.tsx';
import RichTextEditor from './RichTextEditor.tsx';

interface JournalEditorProps {
    entry: JournalEntry | null;
    onSave: (entry: JournalEntry) => void;
    onCancel: () => void;
}

const JournalEditor: React.FC<JournalEditorProps> = ({ entry, onSave, onCancel }) => {
    // FIX: Use MoodValue for the state type.
    const [mood, setMood] = React.useState<MoodValue | null>(entry?.mood || null);
    const [title, setTitle] = React.useState(entry?.title || '');
    const [content, setContent] = React.useState(entry?.content || '');
    
    const handleSave = () => {
        if (!mood || !content.trim()) return;
        
        const newEntry: JournalEntry = {
            id: entry?.id || new Date().toISOString(),
            date: entry?.date || new Date().toISOString(),
            mood,
            title,
            content,
        };
        onSave(newEntry);
    }
    
    return (
         <div className="pt-12 max-w-3xl mx-auto">
             <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{entry ? 'Editar Entrada' : 'Nova Entrada'}</h1>
             </header>
             <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900/50 p-6 rounded-lg border border-slate-200 dark:border-slate-800">
                    <MoodSelector selectedMood={mood} onSelectMood={setMood} />
                </div>
                 <div>
                    <input 
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Dê um título para hoje (opcional)"
                        className="w-full text-xl font-semibold bg-white dark:bg-slate-900/50 p-4 border border-b-0 border-slate-200 dark:border-slate-800 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <RichTextEditor 
                        value={content}
                        onChange={setContent}
                        placeholder="Escreva livremente sobre seu dia, seus pensamentos e sentimentos..."
                    />
                 </div>
                 <div className="flex justify-end space-x-4">
                    <button onClick={onCancel} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={!mood || !content.trim()} className="bg-green-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-600 disabled:bg-slate-400">
                        Salvar
                    </button>
                 </div>
             </div>
         </div>
    );
}

export default JournalEditor;