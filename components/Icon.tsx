import * as React from 'react';
import {
  Sun, Moon, GraduationCap, Library as LibraryIcon, Wind, Sparkles, User, ArrowRight,
  BrainCircuit, Book, Feather, Cross, Search, Upload, Plus, Folder, Trash2, FileText,
  Loader2, ChevronLeft, Download, AlertCircle, CheckCircle, Copy, Bell, SlidersHorizontal,
  HardDrive, Heart, MessageSquare, Send, X, ClipboardCheck, Swords, Brain, ChevronDown,
  Pencil, FolderPlus, Check, LayoutGrid, List, Move, MoreVertical, Youtube, FileUp,
  ClipboardPaste, Heading1, Heading2, Heading3, Bold, Italic, Underline, Quote, ListOrdered,
  GitMerge,
  Link,
  type LucideProps
} from 'lucide-react';
import { IconName } from '../types.ts';

interface IconProps extends LucideProps {
  name: IconName;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'sun': return <Sun {...props} />;
    case 'moon': return <Moon {...props} />;
    case 'academy': return <GraduationCap {...props} />;
    case 'library': return <LibraryIcon {...props} />;
    case 'breathing': return <Wind {...props} />;
    case 'sparkles': return <Sparkles {...props} />;
    case 'user': return <User {...props} />;
    case 'arrowRight': return <ArrowRight {...props} />;
    case 'brainCircuit': return <BrainCircuit {...props} />;
    case 'book': return <Book {...props} />;
    case 'feather': return <Feather {...props} />;
    case 'cross': return <Cross {...props} />;
    case 'search': return <Search {...props} />;
    case 'upload': return <Upload {...props} />;
    case 'plus': return <Plus {...props} />;
    case 'folder': return <Folder {...props} />;
    case 'trash': return <Trash2 {...props} />;
    case 'fileText': return <FileText {...props} />;
    case 'loader': return <Loader2 {...props} />;
    case 'chevronLeft': return <ChevronLeft {...props} />;
    case 'download': return <Download {...props} />;
    case 'alertCircle': return <AlertCircle {...props} />;
    case 'checkCircle': return <CheckCircle {...props} />;
    case 'copy': return <Copy {...props} />;
    case 'bell': return <Bell {...props} />;
    case 'sliders': return <SlidersHorizontal {...props} />;
    case 'hardDrive': return <HardDrive {...props} />;
    case 'heart': return <Heart {...props} />;
    case 'messageSquare': return <MessageSquare {...props} />;
    case 'send': return <Send {...props} />;
    case 'x': return <X {...props} />;
    case 'clipboardCheck': return <ClipboardCheck {...props} />;
    case 'swords': return <Swords {...props} />;
    case 'brain': return <Brain {...props} />;
    case 'chevronDown': return <ChevronDown {...props} />;
    case 'edit': return <Pencil {...props} />;
    case 'folderPlus': return <FolderPlus {...props} />;
    case 'check': return <Check {...props} />;
    case 'layoutGrid': return <LayoutGrid {...props} />;
    case 'list': return <List {...props} />;
    case 'move': return <Move {...props} />;
    case 'ellipsisVertical': return <MoreVertical {...props} />;
    case 'youtube': return <Youtube {...props} />;
    case 'fileUp': return <FileUp {...props} />;
    case 'clipboardPaste': return <ClipboardPaste {...props} />;
    case 'heading1': return <Heading1 {...props} />;
    case 'heading2': return <Heading2 {...props} />;
    case 'heading3': return <Heading3 {...props} />;
    case 'bold': return <Bold {...props} />;
    case 'italic': return <Italic {...props} />;
    case 'underline': return <Underline {...props} />;
    case 'quote': return <Quote {...props} />;
    case 'listOrdered': return <ListOrdered {...props} />;
    case 'mindMap': return <GitMerge {...props} />;
    case 'link': return <Link {...props} />;
    default: return null;
  }
};

export default Icon;