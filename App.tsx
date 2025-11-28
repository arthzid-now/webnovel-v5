import React, { useState, useEffect, useRef } from 'react';
const StoryEncyclopediaSetup = React.lazy(() => import('./components/StoryEncyclopediaSetup'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const WritingStudio = React.lazy(() => import('./components/WritingStudio'));
const UniverseHub = React.lazy(() => import('./components/UniverseHub'));
const UniverseSetup = React.lazy(() => import('./components/UniverseSetup'));
import ApiKeyModal from './components/ApiKeyModal';
import NotificationToast from './components/NotificationToast';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { StoryEncyclopedia, Universe } from './types';
import { useLanguage } from './contexts/LanguageContext';
import { useStory } from './contexts/StoryContext';
import LanguageToggle from './components/LanguageToggle';
import { KeyIcon } from './components/icons/KeyIcon';
import { db } from './db';

import { migrateStoryData, migrateUniverseData } from './services/migrationService';
import { handleExportStory, downloadFile } from './services/exportService';
import { syncService } from './services/syncService';
import { LoginButton } from './components/auth/LoginButton';
import { UserProfile } from './components/auth/UserProfile';

import { auth, googleProvider, db as firestore } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const API_KEY_STORAGE_KEY = 'google_ai_api_key';
const BACKUP_THRESHOLD = 2000;

interface User {
    name: string;
    email: string;
    picture: string;
}

type View = 'dashboard' | 'setup' | 'studio' | 'universeHub' | 'universeSetup';

const App: React.FC = () => {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
    const [stories, setStories] = useState<StoryEncyclopedia[]>([]);
    const [universes, setUniverses] = useState<Universe[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [userIsPremium, setUserIsPremium] = useState<boolean>(false); // Track Firestore premium flag

    const [activeStoryId, setActiveStoryId] = useState<string | null>(null);

    const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
    const [editingUniverseId, setEditingUniverseId] = useState<string | null>(null);
    const [view, setView] = useState<View>('dashboard');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const storyFileInputRef = useRef<HTMLInputElement>(null);
    const universeFileInputRef = useRef<HTMLInputElement>(null);
    const migrationRan = useRef<boolean>(false);

    const { t } = useLanguage();
    const { loadStory, unloadStory, currentStory } = useStory();

    // Firebase Auth Listener
    useEffect(() => {
        if (!auth) {
            console.error("Auth not initialized");
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser({
                    name: currentUser.displayName || 'User',
                    email: currentUser.email || '',
                    picture: currentUser.photoURL || ''
                });

                // Auto-sync user data to Firestore for admin convenience
                try {
                    const userDocRef = doc(firestore, 'users', currentUser.uid);
                    await setDoc(userDocRef, {
                        email: currentUser.email,
                        displayName: currentUser.displayName,
                        photoURL: currentUser.photoURL,
                        isPremium: false, // Default to free tier (won't overwrite if already true)
                        lastLogin: new Date().toISOString()
                    }, { merge: true }); // merge: true preserves existing fields
                } catch (error) {
                    console.error("Failed to sync user data to Firestore:", error);
                }
            } else {
                setUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    // Firestore Listener for premium status
    useEffect(() => {
        if (!auth?.currentUser) {
            setUserIsPremium(false);
            return;
        }

        const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserIsPremium(docSnap.data()?.isPremium === true);
            } else {
                setUserIsPremium(false);
            }
        }, (error) => {
            console.error("Failed to listen to premium status:", error);
            setUserIsPremium(false);
        });

        return () => unsubscribe();
    }, [user]); // Re-run when user changes

    const handleLogin = async () => {
        try {
            if (!auth) throw new Error("Firebase Auth not initialized. Check console/env vars.");
            await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            console.error("Login Failed:", error);
            alert(`Login Failed: ${error.message}`);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            // Optional: Clear local data on logout? 
            // For now, let's keep it to allow offline access, 
            // but maybe warn user if they are on public device.
        } catch (error) {
            console.error("Logout Failed:", error);
        }
    };

    // Sync on user change (login)
    useEffect(() => {
        if (user && auth?.currentUser?.uid) {
            const uid = auth.currentUser.uid;
            syncService.syncUserData(uid).then(() => {
                refreshStoriesList();
                setToastMessage("Cloud Sync Complete");
                setTimeout(() => setToastMessage(null), 3000);
            });
        }
    }, [user]);

    const performMigration = async () => {
        if (migrationRan.current) return;
        migrationRan.current = true;

        try {
            const storedStories = localStorage.getItem('webnovel_stories');
            const storedUniverses = localStorage.getItem('webnovel_universes');

            if (storedStories) {
                const parsedStories = JSON.parse(storedStories);
                if (Array.isArray(parsedStories) && parsedStories.length > 0) {
                    const migratedStories = parsedStories.map(migrateStoryData);
                    await db.stories.bulkPut(migratedStories);
                    for (const story of migratedStories) {
                        const chatKey = `webnovel_chat_${story.id}`;
                        const storedChat = localStorage.getItem(chatKey);
                        if (storedChat) {
                            await db.chats.put({ storyId: story.id, messages: JSON.parse(storedChat) });
                            localStorage.removeItem(chatKey);
                        }
                        const backupKey = `backup_last_word_count_${story.id}`;
                        const storedBackup = localStorage.getItem(backupKey);
                        if (storedBackup) {
                            await db.backups.put({ storyId: story.id, lastWordCount: parseInt(storedBackup, 10) });
                            localStorage.removeItem(backupKey);
                        }
                    }
                    localStorage.removeItem('webnovel_stories');
                }
            }
            if (storedUniverses) {
                const parsedUniverses = JSON.parse(storedUniverses);
                if (Array.isArray(parsedUniverses) && parsedUniverses.length > 0) {
                    const migratedUniverses = parsedUniverses.map(migrateUniverseData);
                    await db.universes.bulkPut(migratedUniverses);
                    localStorage.removeItem('webnovel_universes');
                }
            }
        } catch (error) {
            console.error("Critical Migration Error:", error);
        }
    };

    useEffect(() => {
        const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (storedKey) setApiKey(storedKey);
    }, []);

    const refreshStoriesList = async () => {
        try {
            const allStories = await db.stories.orderBy('updatedAt').reverse().toArray();
            setStories(allStories);
            const allUniverses = await db.universes.orderBy('updatedAt').reverse().toArray();
            setUniverses(allUniverses);
        } catch (error) {
            console.error("Failed to load lists:", error);
        }
    };

    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            await performMigration();
            await refreshStoriesList();
            setIsLoading(false);
        };
        initData();
    }, []);

    useEffect(() => {
        const checkBackup = async () => {
            if (currentStory && view === 'studio') {
                const currentWordCount = currentStory.chapters.reduce((acc, chap) => acc + (chap.content?.trim() ? chap.content.trim().split(/\s+/).length : 0), 0);
                try {
                    const backupRecord = await db.backups.get(currentStory.id);
                    const lastBackup = backupRecord?.lastWordCount || 0;
                    if (currentWordCount - lastBackup > BACKUP_THRESHOLD) {
                        setToastMessage(t('toast.backupReminder'));
                    }
                } catch (e) { }
            }
        };
        const interval = setInterval(checkBackup, 60000);
        return () => clearInterval(interval);
    }, [currentStory, view, t]);

    const handleSaveApiKey = (key: string) => {
        setApiKey(key);
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
        setShowApiKeyModal(false);
    };

    const handleChangeApiKey = () => setShowApiKeyModal(true);
    const handleRequestApiKey = () => setShowApiKeyModal(true);

    const handleStartNew = () => {
        setEditingStoryId(null);
        setView('setup');
    };

    const handleEditStory = (storyId: string) => {
        setEditingStoryId(storyId);
        setView('setup');
    };

    const handleDeleteStory = async (storyId: string) => {
        const storyToDelete = stories.find(s => s.id === storyId);
        if (!storyToDelete) return;

        if (window.confirm(t('dashboard.deleteStoryConfirm', { title: storyToDelete.title }))) {
            try {
                await db.transaction('rw', db.stories, db.chats, db.backups, db.chapter_versions, async () => {
                    await db.stories.delete(storyId);
                    await db.chats.delete(storyId);
                    await db.backups.delete(storyId);
                    await db.chapter_versions.where('storyId').equals(storyId).delete();
                });
                refreshStoriesList();
                if (activeStoryId === storyId) {
                    setActiveStoryId(null);
                    unloadStory();
                }
            } catch (error) {
                console.error("Error deleting story:", error);
            }
        }
    };

    const handleSelectStory = async (storyId: string) => {
        setActiveStoryId(storyId);
        setIsLoading(true);
        await loadStory(storyId);
        setIsLoading(false);
        setView('studio');
    };

    const handleStorySave = async (storyData: StoryEncyclopedia) => {
        try {
            const storyToSave = { ...storyData, updatedAt: Date.now() };
            await db.stories.put(storyToSave);

            await refreshStoriesList();

            await loadStory(storyToSave.id);
            setActiveStoryId(storyToSave.id);
            setEditingStoryId(null);
            setView('studio');
        } catch (error) {
            console.error("Error saving story:", error);
            alert("Failed to save story to database.");
        }
    };

    const handleGoToDashboard = () => {
        unloadStory();
        setActiveStoryId(null);
        setEditingStoryId(null);
        setEditingUniverseId(null);
        refreshStoriesList();
        setView('dashboard');
    };

    const handleGoToUniverseHub = () => setView('universeHub');
    const handleCreateNewUniverse = () => { setEditingUniverseId(null); setView('universeSetup'); };
    const handleEditUniverse = (universeId: string) => { setEditingUniverseId(universeId); setView('universeSetup'); };

    const handleSaveUniverse = async (universeData: Universe) => {
        try {
            const universeToSave = { ...universeData, updatedAt: Date.now() };
            await db.universes.put(universeToSave);
            refreshStoriesList();
            setView('universeHub');
        } catch (error) {
            console.error("Error saving universe:", error);
        }
    };

    const handleDeleteUniverse = async (universeId: string) => {
        if (window.confirm(t('universeHub.deleteConfirm', { name: "Universe" }))) {
            try {
                await db.universes.delete(universeId);
                refreshStoriesList();
            } catch (error) { }
        }
    };

    const handleExportUniverse = (universeId: string) => {
        const universe = universes.find(u => u.id === universeId);
        if (!universe) return;
        const json = JSON.stringify(universe, null, 2);
        downloadFile(json, `universe_${universe.name.replace(/\W/g, '_')}.json`, 'application/json');
    };

    const handleImportUniverse = (file: File) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const newUniverse = JSON.parse(content) as Universe;
                if (!newUniverse.id || !newUniverse.name) throw new Error("Invalid Format");
                const toSave = { ...migrateUniverseData(newUniverse), id: crypto.randomUUID(), updatedAt: Date.now() };
                await db.universes.put(toSave);
                refreshStoriesList();
                alert(t('universeHub.importSuccess', { name: toSave.name }));
            } catch (e) { alert("Import Failed"); }
        };
        reader.readAsText(file);
    };

    const handleToggleUniverseFavorite = async (universeId: string) => {
        const u = universes.find(u => u.id === universeId);
        if (!u) return;
        await db.universes.put({ ...u, isFavorite: !u.isFavorite, updatedAt: Date.now() });
        refreshStoriesList();
    };

    const onExportStory = (storyId: string, format: 'epub' | 'html' | 'txt' | 'json' | 'md' | 'pdf' = 'md') => {
        handleExportStory(storyId, currentStory, t, setToastMessage, format);
    };

    const handleImportStory = (file: File) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const jsonRegex = /<!-- ENCYCLOPEDIA_JSON_START -->([\s\S]*?)<!-- ENCYCLOPEDIA_JSON_END -->/;
                const match = content.match(jsonRegex);
                if (!match) throw new Error("Invalid Format");
                const encData = JSON.parse(match[1]);
                const chaptersPart = content.replace(jsonRegex, '').trim();
                const chapters = chaptersPart.split(/\n\s*<!-- CHAPTER_BREAK -->\s*\n/).map(part => {
                    const lines = part.trim().split('\n');
                    const title = lines.find(l => l.startsWith('## '))?.replace('## ', '').trim() || 'Untitled';
                    return { id: crypto.randomUUID(), title, content: lines.slice(1).join('\n').trim(), type: 'story' as const };
                });
                const newStory = migrateStoryData({ ...encData, id: crypto.randomUUID(), chapters, updatedAt: Date.now() });
                await handleStorySave(newStory);
                alert(t('dashboard.importSuccess', { title: newStory.title }));
            } catch (e) { alert("Import Error"); }
        };
        reader.readAsText(file);
    };

    const handleTriggerImport = (type: 'story' | 'universe') => {
        if (type === 'story') storyFileInputRef.current?.click();
        if (type === 'universe') universeFileInputRef.current?.click();
    };

    const renderContent = () => {
        switch (view) {
            case 'studio':
                return <WritingStudio
                    apiKey={apiKey}
                    onGoToDashboard={handleGoToDashboard}
                    onEditRequest={() => { setEditingStoryId(activeStoryId); setView('setup'); }}
                    onExportStory={onExportStory}
                    onRequestApiKey={handleRequestApiKey}
                />;

            case 'setup':
                const editingStory = editingStoryId ? stories.find(s => s.id === editingStoryId) : null;
                return <StoryEncyclopediaSetup
                    apiKey={apiKey}
                    onStoryCreate={handleStorySave}
                    initialData={editingStory}
                    onCancel={() => { setEditingStoryId(null); setView('dashboard'); }}
                    universeLibrary={universes}
                    onSaveAsUniverse={handleSaveUniverse}
                    onToggleUniverseFavorite={handleToggleUniverseFavorite}
                    onRequestApiKey={handleRequestApiKey}
                    userIsPremium={userIsPremium} // Pass premium flag
                />;

            case 'universeHub':
                return <UniverseHub
                    universes={universes}
                    onGoToDashboard={handleGoToDashboard}
                    onAddNew={handleCreateNewUniverse}
                    onEdit={handleEditUniverse}
                    onDelete={handleDeleteUniverse}
                    onExport={handleExportUniverse}
                    onImport={() => handleTriggerImport('universe')}
                    onToggleFavorite={handleToggleUniverseFavorite}
                />;

            case 'universeSetup':
                const editingUniverse = editingUniverseId ? universes.find(u => u.id === editingUniverseId) : null;
                return <UniverseSetup
                    apiKey={apiKey}
                    onSave={handleSaveUniverse}
                    initialData={editingUniverse}
                    onCancel={() => setView('universeHub')}
                />;

            case 'dashboard':
            default:
                return <Dashboard
                    stories={stories}
                    onSelectStory={handleSelectStory}
                    onEditStory={handleEditStory}
                    onDeleteStory={handleDeleteStory}
                    onStartNew={handleStartNew}
                    onImportStory={() => handleTriggerImport('story')}
                    onExportStory={onExportStory}
                    onGoToUniverseHub={handleGoToUniverseHub}
                    onChangeApiKey={handleChangeApiKey}
                />;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col text-slate-300 gap-4">
                <SpinnerIcon className="w-12 h-12 text-indigo-500 animate-spin" />
                <p className="text-lg font-medium">Loading your worlds...</p>
            </div>
        );
    }

    const handleRemoveApiKey = () => {
        setApiKey(null);
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        setShowApiKeyModal(false);
        setToastMessage("API Key Removed. Using Free Tier.");
        setTimeout(() => setToastMessage(null), 3000);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-indigo-500/30">
            {showApiKeyModal && (
                <ApiKeyModal
                    currentKey={apiKey}
                    onSave={handleSaveApiKey}
                    onRemove={handleRemoveApiKey}
                    onClose={() => setShowApiKeyModal(false)}
                />
            )}
            {toastMessage && !activeStoryId && view !== 'studio' && <NotificationToast message={toastMessage} onClose={() => setToastMessage(null)} />}
            {toastMessage && activeStoryId && view === 'studio' && (
                <NotificationToast
                    message={toastMessage}
                    actionLabel={t('toast.backupAction')}
                    onAction={() => onExportStory(activeStoryId, 'json')}
                    onClose={() => setToastMessage(null)}
                />
            )}

            <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-4 sticky top-0 z-20">
                <div className="container mx-auto flex items-center justify-between">
                    <button onClick={handleGoToDashboard} className="flex items-center gap-3">
                        <SparklesIcon className="w-8 h-8 text-indigo-400" />
                        <h1 className="text-xl font-bold text-slate-200">
                            {t('app.title')}
                        </h1>
                    </button>
                    <div className="flex items-center gap-4">
                        {apiKey && (
                            <button
                                onClick={handleChangeApiKey}
                                className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-indigo-400 transition-colors"
                                title={t('dashboard.changeApiKey')}
                            >
                                <KeyIcon className="w-5 h-5" />
                            </button>
                        )}
                        <LanguageToggle />
                        {user ? (
                            <UserProfile
                                user={user}
                                onLogout={handleLogout}
                                onSync={async () => {
                                    if (user && auth?.currentUser?.uid) {
                                        await syncService.syncUserData(auth.currentUser.uid);
                                        await refreshStoriesList();
                                        setToastMessage("Synced with Cloud");
                                        setTimeout(() => setToastMessage(null), 3000);
                                    }
                                }}
                                isPremium={userIsPremium} // Pass premium status
                            />
                        ) : (
                            <LoginButton onClick={handleLogin} />
                        )}
                    </div>
                </div>
            </header>
            <main className="flex-grow container mx-auto flex overflow-hidden">
                <React.Suspense fallback={
                    <div className="flex-grow flex items-center justify-center text-slate-400">
                        <SpinnerIcon className="w-8 h-8 animate-spin" />
                    </div>
                }>
                    {renderContent()}
                </React.Suspense>
            </main>
            <input type="file" ref={storyFileInputRef} onChange={(e) => e.target.files && handleImportStory(e.target.files[0])} accept=".md,text/markdown" className="hidden" />
            <input type="file" ref={universeFileInputRef} onChange={(e) => e.target.files && handleImportUniverse(e.target.files[0])} accept=".json,application/json" className="hidden" />
        </div>
    );
};

export default App;
