import * as React from 'react';
import { View, JournalEntry, LibraryDocument, Collection, Subject, Folder, Message, SearchResultItem } from './types.ts';
import BottomNav from './components/BottomNav.tsx';
import TodayView from './components/views/TodayView.tsx';
import AcademyView from './components/views/AcademyView.tsx';
import LibraryView from './components/views/LibraryView.tsx';
import SanctuaryView from './components/views/SanctuaryView.tsx';
import AICompanionView from './components/views/AICompanionView.tsx';
import ProfileView from './components/views/ProfileView.tsx';
import OnboardingView from './components/views/OnboardingView.tsx';
import SubjectDetailView from './components/views/SubjectDetailView.tsx';
import DocumentDetailView from './components/views/DocumentDetailView.tsx';
import JournalEditor from './components/JournalEditor.tsx';
import AnimatedView from './components/AnimatedView.tsx';
import GlobalSearchView from './components/views/GlobalSearchView.tsx';


// Helper to safely parse JSON from localStorage
const safeJSONParse = (key: string, defaultValue: any) => {
    try {
        const item = localStorage.getItem(key);
        // Handle boolean 'false' string correctly
        if (item === 'false') return false;
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
    const [isSearching, setIsSearching] = React.useState<boolean>(false);
    const [isSanctuaryEnabled, setIsSanctuaryEnabled] = React.useState<boolean>(() => safeJSONParse('isSanctuaryEnabled', true));

    // App Data State
    const [journalEntries, setJournalEntries] = React.useState<JournalEntry[]>(() => safeJSONParse('journalEntries', []));
    const [documents, setDocuments] = React.useState<LibraryDocument[]>(() => safeJSONParse('documents', []));
    const [collections, setCollections] = React.useState<Collection[]>(() => safeJSONParse('collections', []));
    const [subjects, setSubjects] = React.useState<Subject[]>(() => safeJSONParse('subjects', []));
    const [folders, setFolders] = React.useState<Folder[]>(() => safeJSONParse('folders', []));
    
    // Detail View State
    const [selectedDoc, setSelectedDoc] = React.useState<LibraryDocument | null>(null);
    const [selectedEntry, setSelectedEntry] = React.useState<JournalEntry | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = React.useState<string | null>(null);

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
    React.useEffect(() => { localStorage.setItem('isSanctuaryEnabled', JSON.stringify(isSanctuaryEnabled)); }, [isSanctuaryEnabled]);



    const handleOnboardingComplete = (name: string) => {
        setUserName(name);
        setOnboardingComplete(true);
    };

    const handleActivateSearch = () => {
        setIsSearching(true);
    };

    const handleCloseSearch = () => {
        setIsSearching(false);
    };

    const handleSearchResultSelect = (item: SearchResultItem) => {
        // Reset all selections first
        setSelectedDoc(null);
        setSelectedEntry(null);
        setSelectedSubjectId(null);

        switch (item.type) {
            case 'document':
                const doc = documents.find(d => d.id === item.id);
                if (doc) {
                    setSelectedDoc(doc);
                    setActiveView(View.Library);
                }
                break;
            case 'subject':
                setSelectedSubjectId(item.id);
                setActiveView(View.Academy);
                break;
            case 'topic':
                setSelectedSubjectId(item.parentId!);
                setActiveView(View.Academy);
                break;
            case 'journal':
                 if (isSanctuaryEnabled) {
                    const entry = journalEntries.find(e => e.id === item.id);
                    if (entry) {
                        setSelectedEntry(entry);
                        setActiveView(View.Sanctuary);
                    }
                }
                break;
        }
        setIsSearching(false);
    };

    const handleSaveJournalEntry = (entry: JournalEntry) => {
        const existing = journalEntries.find(e => e.id === entry.id);
        if (existing) {
            setJournalEntries(journalEntries.map(e => e.id === entry.id ? entry : e));
        } else {
            setJournalEntries([entry, ...journalEntries]);
        }
        setSelectedEntry(null);
    };


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

    if (isSearching) {
        return <GlobalSearchView 
            onClose={handleCloseSearch} 
            onResultSelect={handleSearchResultSelect}
            documents={documents}
            subjects={subjects}
            journalEntries={journalEntries}
        />;
    }


    const renderView = () => {
        if (activeView === View.Sanctuary && !isSanctuaryEnabled) {
             // Fallback if sanctuary is disabled but somehow still the active view
            setTimeout(() => setActiveView(View.Today), 0);
            return null;
        }
        
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
        if (activeView === View.Library && selectedDoc) {
            return <DocumentDetailView 
                doc={selectedDoc} 
                onBack={() => setSelectedDoc(null)} 
                setDocuments={setDocuments}
                setSubjects={setSubjects}
                setActiveView={setActiveView}
            />;
        }
        if (activeView === View.Sanctuary && selectedEntry) {
            return <JournalEditor 
                entry={selectedEntry} 
                onSave={handleSaveJournalEntry} 
                onCancel={() => setSelectedEntry(null)}
            />;
        }


        switch (activeView) {
            case View.Today:
                return <TodayView userName={userName} onActivateSearch={handleActivateSearch} subjects={subjects} setActiveView={setActiveView} isSanctuaryEnabled={isSanctuaryEnabled} />;
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
                return <LibraryView documents={documents} setDocuments={setDocuments} collections={collections} setCollections={setCollections} setSubjects={setSubjects} setActiveView={setActiveView} setSelectedDoc={setSelectedDoc} />;
            case View.Sanctuary:
                return <SanctuaryView entries={journalEntries} setEntries={setJournalEntries} setSelectedEntry={setSelectedEntry} setDocuments={setDocuments} />;
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
                return <ProfileView userName={userName} setUserName={setUserName} userPhoto={userPhoto} setUserPhoto={setUserPhoto} libraryDocCount={documents.length} journalEntryCount={journalEntries.length} isSanctuaryEnabled={isSanctuaryEnabled} setIsSanctuaryEnabled={setIsSanctuaryEnabled} />;
            default:
                return <TodayView userName={userName} onActivateSearch={handleActivateSearch} subjects={subjects} setActiveView={setActiveView} isSanctuaryEnabled={isSanctuaryEnabled} />;
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-200">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24">
                 <AnimatedView key={activeView + (selectedSubjectId || selectedDoc?.id || selectedEntry?.id || '')}>
                    {renderView()}
                </AnimatedView>
            </main>
            <BottomNav activeView={activeView} setActiveView={setActiveView} isSanctuaryEnabled={isSanctuaryEnabled} />
        </div>
    );
};

export default App;
