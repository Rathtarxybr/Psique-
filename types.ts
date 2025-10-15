export type IconName =
  | 'sun' | 'moon' | 'academy' | 'library' | 'breathing' | 'sparkles'
  | 'user' | 'arrowRight' | 'brainCircuit' | 'book' | 'feather' | 'cross'
  | 'search' | 'upload' | 'plus' | 'folder' | 'trash' | 'fileText'
  | 'loader' | 'chevronLeft' | 'download' | 'alertCircle' | 'checkCircle'
  | 'copy' | 'bell' | 'sliders' | 'hardDrive' | 'heart' | 'messageSquare'
  | 'send' | 'x' | 'clipboardCheck' | 'swords' | 'brain' | 'chevronDown'
  | 'edit' | 'folderPlus' | 'check' | 'layoutGrid' | 'list' | 'move'
  | 'ellipsisVertical' | 'youtube' | 'fileUp' | 'clipboardPaste' | 'heading1'
  | 'heading2' | 'heading3' | 'bold' | 'italic' | 'underline' | 'quote'
  | 'listOrdered' | 'mindMap' | 'link';

export enum View {
  Today = 'today',
  Academy = 'academy',
  Library = 'library',
  Sanctuary = 'sanctuary',
  AICompanion = 'ai_companion',
  Profile = 'profile',
}

export type MoodValue = 'radiant' | 'good' | 'meh' | 'bad' | 'awful';

export interface JournalEntry {
  id: string;
  date: string;
  mood: MoodValue;
  title: string;
  content: string;
}

export interface LibraryDocument {
  id: string;
  name: string;
  type: 'pdf' | 'epub' | 'note' | 'web';
  createdAt: string;
  collectionId?: string | null;
  summary?: string;
  url?: string;
}

export interface DocumentContent {
  id: string;
  content: string;
  fileDataUrl: string;
}

export interface Collection {
  id:string;
  name: string;
}

export interface Topic {
    id: string;
    name: string;
    content: string;
}

export interface Flashcard {
    front: string;
    back: string;
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
}

export interface MindMapNode {
  topic: string;
  children?: MindMapNode[];
}

export interface Subject {
  id: string;
  name: string;
  folderId?: string | null;
  topics: Topic[];
  documentIds: string[];
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
  studyPlan?: string;
  mindMap?: MindMapNode;
}

export interface Folder {
    id: string;
    name: string;
}


export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

export interface Suggestion {
  id: number;
  icon: IconName;
  title: string;
  description: string;
  module: View;
}

export type Theme = 'light' | 'dark';

export type ViewMode = 'grid' | 'list';