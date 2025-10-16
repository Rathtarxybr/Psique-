import * as React from 'react';
import { View, JournalEntry, LibraryDocument, Collection, Subject, Folder, Message } from './types.ts';
import BottomNav from './components/BottomNav.tsx';
import TodayView from './components/views/TodayView.tsx';
import AcademyView from './components/views/AcademyView.tsx';
import LibraryView from './components/views/LibraryView.tsx';
import SanctuaryView from './components/views/SanctuaryView.tsx';
import AICompanionView from './components/views/AICompanionView.tsx';
import ProfileView from './components/views/ProfileView.tsx';
import OnboardingView from './components/views/OnboardingView.tsx';
import SubjectDetailView from './components/views/SubjectDetailView.tsx';
import AnimatedView from './components/AnimatedView.tsx';

// Helper to safely parse JSON from localStorage
const safeJSONParse = (key: string, defaultValue: any) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.warn(`Error parsing localStorage key "${key}":`, e);
        return defaultValue;
    }
};


const App: React.FC = () => {
    const [onboardingComplete, setOnboardingComplete] = React.useState<boolean>(() => safeJSONParse('onboardingComplete', false));
    const [userName, setUserName] = React.useState<string>(() => localStorage.getItem('userName') || 'Amigo(a)');
    const [userPhoto, setUserPhoto] = React.useState<string>(() => localStorage.getItem('userPhoto') || '');
    const [activeView, setActiveView] = React.useState<View>(View.Today);

    // App Data State
    const [journalEntries, setJournalEntries] = React.useState<JournalEntry[]>(() => safeJSONParse('journalEntries', []));
    const [documents, setDocuments] = React.useState<LibraryDocument[]>(() => safeJSONParse('documents', []));
    const [collections, setCollections] = React.useState<Collection[]>(() => safeJSONParse('collections', []));
    const [subjects, setSubjects] = React.useState<Subject[]>(() => safeJSONParse('subjects', []));
    const [folders, setFolders] = React.useState<Folder[]>(() => safeJSONParse('folders', []));
    
    // Chat History State
    const [aiCompanionHistory, setAiCompanionHistory] = React.useState<Message[]>(() => {
        const data = safeJSONParse('aiCompanionHistory', []);
        return Array.isArray(data) ? data : [];
    });
    const [subjectChatHistory, setSubjectChatHistory] = React.useState<{[subjectId: string]: Message[]}>(() => {
        const data = safeJSONParse('subjectChatHistory', {});
        // Ensure it's a non-array object
        return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    });


    // Persist data to localStorage whenever it changes
    React.useEffect(() => { localStorage.setItem('journalEntries', JSON.stringify(journalEntries)); }, [journalEntries]);
    React.useEffect(() => { localStorage.setItem('documents', JSON.stringify(documents)); }, [documents]);
    React.useEffect(() => { localStorage.setItem('collections', JSON.stringify(collections)); }, [collections]);
    React.useEffect(() => { localStorage.setItem('subjects', JSON.stringify(subjects)); }, [subjects]);
    React.useEffect(() => { localStorage.setItem('folders', JSON.stringify(folders)); }, [folders]);
    React.useEffect(() => { localStorage.setItem('userName', userName); }, [userName]);
    React.useEffect(() => { localStorage.setItem('userPhoto', userPhoto); }, [userPhoto]);
    React.useEffect(() => { localStorage.setItem('onboardingComplete', JSON.stringify(onboardingComplete)); }, [onboardingComplete]);
    React.useEffect(() => { localStorage.setItem('aiCompanionHistory', JSON.stringify(aiCompanionHistory)); }, [aiCompanionHistory]);
    React.useEffect(() => { localStorage.setItem('subjectChatHistory', JSON.stringify(subjectChatHistory)); }, [subjectChatHistory]);



    const handleOnboardingComplete = (name: string) => {
        setUserName(name);
        setOnboardingComplete(true);
    };
    
    // State for the selected subject ID to pass to the detail view
    const [selectedSubjectId, setSelectedSubjectId] = React.useState<string | null>(null);


    if (!onboardingComplete) {
        return <OnboardingView onComplete={handleOnboardingComplete} />;
    }
    
    const onSelectSubject = (subjectId: string) => {
        setSelectedSubjectId(subjectId);
        setActiveView(View.Academy); // Ensure we are on the academy view
    };
    
    const onBackFromSubject = () => {
        setSelectedSubjectId(null);
    };


    const renderView = () => {
        // Special case for Academy: if a subject is selected, show its detail view
        if (activeView === View.Academy && selectedSubjectId) {
             return <SubjectDetailView 
                        subjectId={selectedSubjectId}
                        subjects={subjects}
                        documents={documents}
                        onBack={onBackFromSubject}
                        setSubjects={setSubjects}
                        subjectChatHistory={subjectChatHistory}
                        setSubjectChatHistory={setSubjectChatHistory}
                    />;
        }

        switch (activeView) {
            case View.Today:
                return <TodayView userName={userName} journalEntries={journalEntries} documents={documents} subjects={subjects} setActiveView={setActiveView} />;
            case View.Academy:
                return <AcademyView 
                            subjects={subjects} 
                            setSubjects={setSubjects} 
                            documents={documents} 
                            folders={folders}
                            setFolders={setFolders}
                            onSelectSubject={onSelectSubject}
                            setSubjectChatHistory={setSubjectChatHistory}
                        />;
            case View.Library:
                return <LibraryView documents={documents} setDocuments={setDocuments} collections={collections} setCollections={setCollections} setSubjects={setSubjects} setActiveView={setActiveView} />;
            case View.Sanctuary:
                return <SanctuaryView entries={journalEntries} setEntries={setJournalEntries} />;
            case View.AICompanion:
                return <AICompanionView 
                            userName={userName} 
                            userPhoto={userPhoto} 
                            journalEntries={journalEntries} 
                            documents={documents} 
                            subjects={subjects} 
                            messages={aiCompanionHistory}
                            setMessages={setAiCompanionHistory}
                        />;
            case View.Profile:
                return <ProfileView userName={userName} setUserName={setUserName} userPhoto={userPhoto} setUserPhoto={setUserPhoto} libraryDocCount={documents.length} journalEntryCount={journalEntries.length} />;
            default:
                return <TodayView userName={userName} journalEntries={journalEntries} documents={documents} subjects={subjects} setActiveView={setActiveView} />;
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-200">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24">
                 <AnimatedView key={activeView + (selectedSubjectId || '')}>
                    {renderView()}
                </AnimatedView>
            </main>
            <BottomNav activeView={activeView} setActiveView={setActiveView} />
        </div>
    );
};

export default App;