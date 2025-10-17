import * as React from 'react';
// FIX: Add .tsx extension to file path.
import Icon from '../Icon.tsx';
// FIX: Add .tsx extension to file path.
import ThemeToggle from '../ThemeToggle.tsx';
// FIX: Import IconName type to use for StatCard props.
import { IconName } from '../../types.ts';

interface ProfileViewProps {
  userName: string;
  setUserName: (name: string) => void;
  userPhoto: string;
  setUserPhoto: (photo: string) => void;
  libraryDocCount: number;
  journalEntryCount: number;
  isSanctuaryEnabled: boolean;
  setIsSanctuaryEnabled: (enabled: boolean) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ userName, setUserName, userPhoto, setUserPhoto, libraryDocCount, journalEntryCount, isSanctuaryEnabled, setIsSanctuaryEnabled }) => {
  const [nameInput, setNameInput] = React.useState(userName);
  const [isEditing, setIsEditing] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState('');
  const [backupMessage, setBackupMessage] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const restoreInputRef = React.useRef<HTMLInputElement>(null);


  const handleSaveName = () => {
    setUserName(nameInput);
    localStorage.setItem('userName', nameInput);
    setIsEditing(false);
    setSaveMessage('Nome salvo com sucesso!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  }

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      setUserPhoto(base64String);
      localStorage.setItem('userPhoto', base64String);
    }
    reader.readAsDataURL(file);
  }

  const handleBackup = () => {
    try {
        const dataToBackup: Record<string, string | null> = {};
        const keysToBackup = [
          'userName', 'userPhoto', 'documents', 'collections', 
          'journalEntries', 'subjects', 'folders', 'theme', 
          'onboardingComplete', 'isSanctuaryEnabled', 'aiCompanionHistory', 
          'subjectChatHistory'
        ];
        
        keysToBackup.forEach(key => {
            dataToBackup[key] = localStorage.getItem(key);
        });

        const jsonString = JSON.stringify(dataToBackup, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().slice(0, 10);
        link.download = `psique-backup-${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setBackupMessage('Backup criado com sucesso!');
    } catch (error) {
        console.error('Backup failed:', error);
        setBackupMessage('Erro ao criar o backup.');
    } finally {
        setTimeout(() => setBackupMessage(''), 3000);
    }
  }

  const handleRestoreClick = () => {
    restoreInputRef.current?.click();
  }

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("File is not valid text");
            
            const data = JSON.parse(text);
            
            // Basic validation
            if (!data.onboardingComplete) {
                throw new Error("Arquivo de backup inválido.");
            }

            Object.keys(data).forEach(key => {
                const value = data[key];
                if (value !== null && value !== undefined) {
                    localStorage.setItem(key, value);
                } else {
                    localStorage.removeItem(key);
                }
            });
            
            setBackupMessage('Dados restaurados! A aplicação será recarregada.');
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('Restore failed:', error);
            setBackupMessage('Erro ao restaurar. O arquivo pode ser inválido.');
            setTimeout(() => setBackupMessage(''), 3000);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  }


  // FIX: Changed icon prop type from "journal" | "library" to the more flexible IconName.
  const StatCard: React.FC<{icon: IconName, label: string, value: string | number}> = ({icon, label, value}) => (
    <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg flex items-center space-x-3">
      <Icon name={icon} className="w-6 h-6 text-yellow-500 dark:text-yellow-400"/>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="pt-12 animate-fadeIn max-w-2xl mx-auto">
       <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleAvatarFileChange} 
          accept="image/png, image/jpeg"
        />
        <input 
            type="file"
            className="hidden"
            ref={restoreInputRef}
            onChange={handleRestore}
            accept=".json"
        />
      <header className="text-center mb-10">
        <div className="relative inline-block mb-4 group">
            <div className="w-24 h-24 rounded-full bg-yellow-400/20 flex items-center justify-center overflow-hidden border-2 border-yellow-400/30">
                {userPhoto ? (
                  <img src={userPhoto} alt="User" className="w-full h-full object-cover"/>
                ) : (
                  <Icon name="user" className="w-12 h-12 text-yellow-500 dark:text-yellow-400" />
                )}
            </div>
             <button onClick={handleAvatarClick} className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Icon name="upload" className="w-6 h-6 text-white" />
            </button>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{userName}</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
          Acompanhe sua jornada e configure suas preferências.
        </p>
      </header>

      {/* Profile Section */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Personalização</h2>
        <div className="flex items-end space-x-4">
            <div className="flex-grow">
                <label htmlFor="name-input" className="text-sm font-medium text-gray-600 dark:text-gray-400">Seu Nome</label>
                <input 
                    id="name-input" type="text" value={nameInput}
                    onChange={(e) => {
                        setNameInput(e.target.value);
                        if (!isEditing) setIsEditing(true);
                    }}
                    className="mt-1 w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
            </div>
            <button onClick={handleSaveName} disabled={!isEditing || nameInput === userName}
                className="bg-yellow-500 text-black font-semibold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transform hover:scale-105">
                Salvar
            </button>
        </div>
        {saveMessage && <p className="text-green-500 dark:text-green-400 text-sm mt-3 animate-fadeIn">{saveMessage}</p>}
      </div>

       {/* Progress Section */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Seu Progresso</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* FIX: Replaced non-existent 'journal' icon with 'feather'. */}
            <StatCard icon="feather" label="Entradas no Santuário" value={journalEntryCount} />
            <StatCard icon="library" label="Livros na Biblioteca" value={libraryDocCount} />
        </div>
      </div>


      {/* Settings Section */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Configurações</h2>
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            <li className="py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {/* FIX: Replaced non-existent 'palette' icon with 'sliders'. */}
                    <Icon name="sliders" className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-800 dark:text-gray-200">Aparência</span>
                </div>
                <ThemeToggle />
            </li>
             <li className="py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Icon name="heart" className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-800 dark:text-gray-200">Exibir Módulo Santuário</span>
                </div>
                <button
                    onClick={() => setIsSanctuaryEnabled(!isSanctuaryEnabled)}
                    className={`relative inline-flex items-center h-8 w-14 rounded-full transition-colors duration-300 ${isSanctuaryEnabled ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                    aria-label="Toggle Sanctuary Module"
                >
                    <span
                        className={`absolute inline-flex items-center justify-center h-6 w-6 rounded-full bg-white shadow-lg transform transition-transform duration-300 ${isSanctuaryEnabled ? 'translate-x-7' : 'translate-x-1'}`}
                    ></span>
                </button>
            </li>
            <li className="py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Icon name="bell" className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-800 dark:text-gray-200">Notificações</span>
                </div>
                <button className="text-gray-400 dark:text-gray-500"><Icon name="arrowRight" className="w-5 h-5 -rotate-45"/></button>
            </li>
             <li className="py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {/* FIX: Replaced non-existent 'backup' icon with 'hardDrive'. */}
                        <Icon name="hardDrive" className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-800 dark:text-gray-200">Backup e Restauração</span>
                    </div>
                     <div className="flex space-x-2">
                        <button onClick={handleBackup} className="text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-1.5 px-3 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            Exportar
                        </button>
                        <button onClick={handleRestoreClick} className="text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-1.5 px-3 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            Importar
                        </button>
                    </div>
                </div>
                {backupMessage && <p className="text-green-500 dark:text-green-400 text-sm mt-3 animate-fadeIn text-right">{backupMessage}</p>}
            </li>
        </ul>
      </div>

      <footer className="text-center mt-12 mb-4">
        <p className="text-xs text-gray-400 dark:text-gray-500 italic flex items-center justify-center gap-1.5">
            Feito com amor, dedicado a nosso Senhor Jesus e nossa mãe Maria <Icon name="heart" className="w-3 h-3 text-red-400" />
        </p>
      </footer>
    </div>
  );
};

export default ProfileView;
