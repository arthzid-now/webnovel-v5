import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import StoryEncyclopediaSetup from './components/StoryEncyclopediaSetup';
import Dashboard from './components/Dashboard';
import WritingStudio from './components/WritingStudio';
import UniverseHub from './components/UniverseHub';
import UniverseSetup from './components/UniverseSetup';
import ApiKeyModal from './components/ApiKeyModal';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { StoryEncyclopedia, Character, Chapter, Universe } from './types';
import { useLanguage } from './contexts/LanguageContext';
import LanguageToggle from './components/LanguageToggle';
import { KeyIcon } from './components/icons/KeyIcon';

const API_KEY_STORAGE_KEY = 'google_ai_api_key';

const createEmptyCharacter = (nameOrDesc: string = '', roles: string[] = []): Character => ({
  id: crypto.randomUUID(),
  name: nameOrDesc,
  roles: roles,
  age: '',
  gender: '',
  physicalDescription: '',
  voiceAndSpeechStyle: '',
  personalityTraits: '',
  habits: '',
  goal: '',
  principles: '',
  conflict: '',
  customFields: [],
});

const migrateStoryData = (data: any): StoryEncyclopedia => {
    let parsed = { ...data };

    if (!parsed.id) parsed.id = crypto.randomUUID();
    
    // NEW: Story Format Migration
    if (!parsed.format) parsed.format = 'webnovel';

    // Universe Migration
    if (parsed.universeId === undefined) parsed.universeId = null;
    if (parsed.universeName === undefined) parsed.universeName = parsed.language === 'id' ? 'Dunia Kustom' : 'Custom World';
    if (parsed.disguiseRealWorldNames === undefined) parsed.disguiseRealWorldNames = false;

    // POV Migration
    if (!parsed.narrativePerspective) {
        parsed.narrativePerspective = parsed.language === 'id' ? 'Orang Ketiga Terbatas ("Dia")' : 'Third Person Limited ("He/She")';
    }
    
    // --- New Character Migration ---
    if (!parsed.characters) parsed.characters = [];

    const ensureFullCharacter = (char: any, roles: string[]): Character => {
        if (typeof char === 'string') {
            return createEmptyCharacter(char, roles);
        }
        const newChar: Character = {
            id: char.id || crypto.randomUUID(),
            name: char.name || '',
            roles: Array.isArray(char.roles) && char.roles.length > 0 ? char.roles : roles,
            age: char.age || '',
            gender: char.gender || '',
            physicalDescription: char.physicalDescription || '',
            voiceAndSpeechStyle: char.voiceAndSpeechStyle || char.voiceDescription || '',
            personalityTraits: char.personalityTraits || char.protagonistPersonality || '',
            habits: char.habits || '',
            goal: char.goal || char.protagonistGoal || '',
            principles: char.principles || '',
            conflict: char.conflict || char.protagonistConflict || '',
            customFields: char.customFields || [],
        };
        if ('voiceDescription' in newChar) delete (newChar as any).voiceDescription;
        return newChar;
    };
    
    if (parsed.protagonist) {
        const protagonist = ensureFullCharacter(parsed.protagonist, ['Protagonist']);
        if (!parsed.characters.some(c => c.name === protagonist.name)) {
            parsed.characters.push(protagonist);
        }
    }
    if (parsed.loveInterests) {
        parsed.loveInterests.forEach((li: any) => {
            const loveInterest = ensureFullCharacter(li, ['Love Interest']);
            if (loveInterest.name && !parsed.characters.some(c => c.name === loveInterest.name)) {
                parsed.characters.push(loveInterest);
            }
        });
    }
    if (parsed.antagonists) {
        parsed.antagonists.forEach((ant: any) => {
            const antagonist = ensureFullCharacter(ant, ['Antagonist']);
            if (antagonist.name && !parsed.characters.some(c => c.name === antagonist.name)) {
                parsed.characters.push(antagonist);
            }
        });
    }
    delete parsed.protagonist;
    delete parsed.loveInterests;
    delete parsed.antagonists;
    // --- End Character Migration ---

    // --- Relationship Migration to ID-based ---
    if (parsed.relationships === null || parsed.relationships === undefined) parsed.relationships = [];
    if (parsed.relationships.length > 0 && parsed.relationships[0] && parsed.relationships[0].character1) {
        const nameToIdMap = new Map(parsed.characters.map((c: Character) => [c.name, c.id]));
        parsed.relationships = parsed.relationships.map((rel: any) => ({
            id: crypto.randomUUID(),
            character1Id: nameToIdMap.get(rel.character1) || '',
            character2Id: nameToIdMap.get(rel.character2) || '',
            type: rel.type,
            description: rel.description,
        })).filter((rel: any) => rel.character1Id && rel.character2Id);
    } else if (parsed.relationships.length > 0 && parsed.relationships[0] && !parsed.relationships[0].id) {
        parsed.relationships = parsed.relationships.map((rel:any) => ({...rel, id: rel.id || crypto.randomUUID()}));
    }
    
    // New structured world-building fields
    if (parsed.locations === null || parsed.locations === undefined) parsed.locations = [];
    if (parsed.factions === null || parsed.factions === undefined) parsed.factions = [];
    if (parsed.lore === null || parsed.lore === undefined) parsed.lore = [];
    
    if (!parsed.chapters) {
        parsed.chapters = [{ id: crypto.randomUUID(), title: 'Chapter 1', content: '' }];
    }

    if (parsed.storyArc && Array.isArray(parsed.storyArc)) {
        parsed.storyArc = parsed.storyArc.map((act: any) => ({
            ...act,
            plotPoints: act.plotPoints || [],
            // Initialize new fields
            startChapter: act.startChapter || '',
            endChapter: act.endChapter || '',
            structureTemplate: act.structureTemplate || 'freestyle'
        }));
    } else {
        parsed.storyArc = [{ 
            title: (parsed.language === 'id' ? 'Babak 1' : 'Act 1'), 
            description: '', 
            plotPoints: [],
            startChapter: '',
            endChapter: '',
            structureTemplate: 'freestyle'
        }];
    }

    if (parsed.customProseStyleByExample === undefined) {
        parsed.customProseStyleByExample = '';
    }

    return parsed as StoryEncyclopedia;
};

const migrateUniverseData = (data: any): Universe => {
    let parsed = { ...data };
    if (!parsed.id) parsed.id = crypto.randomUUID();
    if (!parsed.language) parsed.language = 'en';
    if (parsed.locations === null || parsed.locations === undefined) parsed.locations = [];
    if (parsed.factions === null || parsed.factions === undefined) parsed.factions = [];
    if (parsed.lore === null || parsed.lore === undefined) parsed.lore = [];
    return parsed as Universe;
}

type View = 'dashboard' | 'setup' | 'studio' | 'universeHub' | 'universeSetup';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [stories, setStories] = useState<StoryEncyclopedia[]>([]);
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [editingUniverseId, setEditingUniverseId] = useState<string | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const storyFileInputRef = useRef<HTMLInputElement>(null);
  const universeFileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  // Check for API Key on initial render
  useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) {
        setApiKey(storedKey);
    }
  }, []);

  // Load data from localStorage on initial render
  useEffect(() => {
    const loadData = () => {
        // Load stories
        try {
            const storedStories = localStorage.getItem('webnovel_stories');
            if (storedStories) {
                const storyList = (JSON.parse(storedStories) as StoryEncyclopedia[]).map(migrateStoryData);
                setStories(storyList);
            }
        } catch (error) {
            console.error("Failed to load stories from localStorage", error);
            setStories([]);
        }

        // Load universes
        try {
            const storedUniverses = localStorage.getItem('webnovel_universes');
            if (storedUniverses) {
                const universeList = (JSON.parse(storedUniverses) as Universe[]).map(migrateUniverseData);
                setUniverses(universeList);
            }
        } catch (error) {
            console.error("Failed to load universes from localStorage", error);
            setUniverses([]);
        }
    };

    loadData();
  }, []);

  // Save stories to localStorage whenever they change
  useEffect(() => {
    if (stories.length > 0) { // Avoid saving the initial empty state
        try {
            localStorage.setItem('webnovel_stories', JSON.stringify(stories));
        } catch (error) {
            console.error("Failed to save stories to localStorage", error);
        }
    }
  }, [stories]);
  
  // Save universes to localStorage whenever they change
  useEffect(() => {
    if (universes.length > 0) { // Avoid saving the initial empty state
        try {
            localStorage.setItem('webnovel_universes', JSON.stringify(universes));
        } catch (error) {
            console.error("Failed to save universes to localStorage", error);
        }
    }
  }, [universes]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
    setShowApiKeyModal(false);
  };

  const handleChangeApiKey = () => {
    setShowApiKeyModal(true);
  };
  
  const handleRequestApiKey = () => {
    setShowApiKeyModal(true);
  };

  const handleStartNew = () => {
    setEditingStoryId(null);
    setView('setup');
  };
  
  const handleEditStory = (storyId: string) => {
    setEditingStoryId(storyId);
    setView('setup');
  };

  const handleDeleteStory = (storyId: string) => {
    const storyToDelete = stories.find(s => s.id === storyId);
    if (!storyToDelete) return;

    const confirmMessage = t('dashboard.deleteStoryConfirm', { title: storyToDelete.title });

    if (window.confirm(confirmMessage)) {
       try {
            // Delete chat history from localStorage
            localStorage.removeItem(`webnovel_chat_${storyId}`);

            // Update local state, which will trigger save to localStorage
            const updatedStories = stories.filter(s => s.id !== storyId);
            setStories(updatedStories);
            
            if (activeStoryId === storyId) setActiveStoryId(null);
            if (editingStoryId === storyId) setEditingStoryId(null);
        } catch (error) {
            console.error("Error deleting story:", error);
            alert("Failed to delete story.");
        }
    }
  };

  const handleSelectStory = (storyId: string) => {
    setActiveStoryId(storyId);
    setView('studio');
  };

  const handleStorySave = (storyData: StoryEncyclopedia) => {
     try {
        const isUpdating = stories.some(s => s.id === storyData.id);
        const updatedStories = isUpdating
            ? stories.map(s => s.id === storyData.id ? storyData : s)
            : [...stories, storyData];
        setStories(updatedStories);

        setActiveStoryId(storyData.id);
        setEditingStoryId(null);
        setView('studio');
    } catch (error) {
        console.error("Error saving story:", error);
        alert("Failed to save story.");
    }
  };
  
  const handleGoToDashboard = () => {
    setActiveStoryId(null);
    setEditingStoryId(null);
    setEditingUniverseId(null);
    setView('dashboard');
  };

  // --- Universe Handlers ---
  const handleGoToUniverseHub = () => {
    setView('universeHub');
  };

  const handleCreateNewUniverse = () => {
    setEditingUniverseId(null);
    setView('universeSetup');
  };

  const handleEditUniverse = (universeId: string) => {
    setEditingUniverseId(universeId);
    setView('universeSetup');
  };

  const handleSaveUniverse = (universeData: Universe) => {
    try {
        const isUpdating = universes.some(u => u.id === universeData.id);
        const updatedUniverses = isUpdating
            ? universes.map(u => u.id === universeData.id ? universeData : u)
            : [...universes, universeData];
        setUniverses(updatedUniverses);

        setView('universeHub');
    } catch (error) {
        console.error("Error saving universe:", error);
        alert("Failed to save universe.");
    }
  };

  const handleDeleteUniverse = (universeId: string) => {
     const universeToDelete = universes.find(u => u.id === universeId);
     if (!universeToDelete) return;

     const confirmMessage = t('universeHub.deleteConfirm', { name: universeToDelete.name });
     if (window.confirm(confirmMessage)) {
         try {
            const updatedUniverses = universes.filter(u => u.id !== universeId);
            setUniverses(updatedUniverses);
         } catch (error) {
            console.error("Error deleting universe:", error);
            alert("Failed to delete universe.");
         }
     }
  };
  
  const handleExportUniverse = (universeId: string) => {
    const universe = universes.find(u => u.id === universeId);
    if (!universe) return alert(t('universeHub.exportNotFound'));

    const universeJson = JSON.stringify(universe, null, 2);
    const blob = new Blob([universeJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = universe.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `universe_${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleImportUniverse = (file: File) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const content = e.target?.result as string;
              const newUniverse = JSON.parse(content) as Universe;
              if (!newUniverse.id || !newUniverse.name) {
                  throw new Error(t('universeHub.importErrorFormat'));
              }
              // Assign a new ID to prevent conflicts, but keep the original for file consistency
              const universeToSave = { ...newUniverse, id: crypto.randomUUID() };
              universeToSave.language = universeToSave.language || 'en'; // Ensure language is set
              
              handleSaveUniverse(universeToSave); // Save and update state
              
              alert(t('universeHub.importSuccess', { name: universeToSave.name }));
          } catch (error) {
              alert(`${t('universeHub.importError')}: ${error instanceof Error ? error.message : "Unknown error"}`);
          } finally {
              if (universeFileInputRef.current) universeFileInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };

  const handleToggleUniverseFavorite = (universeId: string) => {
      const universe = universes.find(u => u.id === universeId);
      if (!universe) return;

      const updatedUniverse = { ...universe, isFavorite: !universe.isFavorite };

      try {
          setUniverses(universes.map(u => u.id === universeId ? updatedUniverse : u));
      } catch (error) {
          console.error("Error toggling universe favorite status:", error);
          alert("Failed to update universe favorite status.");
      }
  };

  // --- Prop Handlers ---
  const handleCancelSetup = () => {
    setEditingStoryId(null);
    setEditingUniverseId(null);
    setView('dashboard');
  };

  const handleRequestEditFromStudio = () => {
    if (activeStoryId) {
        setEditingStoryId(activeStoryId);
        setView('setup');
    }
  };

  const handleExportStory = (storyId: string) => {
    const story = stories.find(s => s.id === storyId);
    if (!story) return alert(t('dashboard.exportNotFound'));

    const encyclopediaData = { ...story };
    delete (encyclopediaData as Partial<StoryEncyclopedia>).chapters;
    const encyclopediaJson = JSON.stringify(encyclopediaData, null, 2);

    const chaptersMarkdown = story.chapters
        .map(chapter => `## ${chapter.title}\n\n${chapter.content}`)
        .join('\n\n<!-- CHAPTER_BREAK -->\n\n');

    const markdownContent = `<!-- ENCYCLOPEDIA_JSON_START -->\n${encyclopediaJson}\n<!-- ENCYCLOPEDIA_JSON_END -->\n\n${chaptersMarkdown}`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `${safeTitle}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportStory = (file: File) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const content = e.target?.result as string;
              
              const jsonRegex = /<!-- ENCYCLOPEDIA_JSON_START -->([\s\S]*?)<!-- ENCYCLOPEDIA_JSON_END -->/;
              const jsonMatch = content.match(jsonRegex);
              if (!jsonMatch || !jsonMatch[1]) throw new Error(t('dashboard.importErrorFormat'));
              const encyclopediaData = JSON.parse(jsonMatch[1]);
              
              const chaptersContent = content.replace(jsonRegex, '').trim();
              const chapterParts = chaptersContent.split(/\n\s*<!-- CHAPTER_BREAK -->\s*\n/);
              
              const chapters: Chapter[] = chapterParts.map((part): Chapter | null => {
                  const lines = part.trim().split('\n');
                  const titleLine = lines.find(line => line.startsWith('## '));
                  if (!titleLine) return null;
                  const title = titleLine.replace('## ', '').trim();
                  const chapterContent = lines.slice(lines.indexOf(titleLine) + 1).join('\n').trim();
                  return { id: crypto.randomUUID(), title, content: chapterContent };
              }).filter((c): c is Chapter => c !== null);

              const newStory: StoryEncyclopedia = {
                  ...encyclopediaData,
                  id: crypto.randomUUID(),
                  chapters: chapters.length > 0 ? chapters : [{id: crypto.randomUUID(), title: 'Chapter 1', content: ''}],
              };

              handleStorySave(newStory); // Save and update state
              alert(t('dashboard.importSuccess', { title: newStory.title }));
          } catch (error) {
              alert(`${t('dashboard.importError')}: ${error instanceof Error ? error.message : "Unknown error"}`);
          } finally {
              if (storyFileInputRef.current) storyFileInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };
  
  const handleTriggerImport = (type: 'story' | 'universe') => {
    if (type === 'story') storyFileInputRef.current?.click();
    if (type === 'universe') universeFileInputRef.current?.click();
  };

  const activeStory = stories.find(s => s.id === activeStoryId);
  const editingStory = stories.find(s => s.id === editingStoryId);
  const editingUniverse = universes.find(u => u.id === editingUniverseId);
  
  const renderContent = () => {
    switch(view) {
        case 'studio':
            if (activeStory) {
                return <WritingStudio 
                          apiKey={apiKey}
                          story={activeStory} 
                          onUpdateStory={handleStorySave} 
                          onGoToDashboard={handleGoToDashboard}
                          onEditRequest={handleRequestEditFromStudio}
                          onExportStory={handleExportStory}
                          onRequestApiKey={handleRequestApiKey}
                       />;
            }
            setView('dashboard');
            return null;
        
        case 'setup':
            return <StoryEncyclopediaSetup 
                      apiKey={apiKey}
                      onStoryCreate={handleStorySave} 
                      initialData={editingStory} 
                      onCancel={handleCancelSetup}
                      universeLibrary={universes}
                      onSaveAsUniverse={handleSaveUniverse}
                      onToggleUniverseFavorite={handleToggleUniverseFavorite}
                      onRequestApiKey={handleRequestApiKey}
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
                        onExportStory={handleExportStory}
                        onGoToUniverseHub={handleGoToUniverseHub}
                        onChangeApiKey={handleChangeApiKey}
                   />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
       {showApiKeyModal && <ApiKeyModal onSave={handleSaveApiKey} onClose={() => setShowApiKeyModal(false)} />}
       
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
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto flex overflow-hidden">
        {renderContent()}
      </main>
      <input 
        type="file" 
        ref={storyFileInputRef} 
        onChange={(e) => e.target.files && handleImportStory(e.target.files[0])}
        accept=".md,text/markdown"
        className="hidden"
      />
      <input 
        type="file" 
        ref={universeFileInputRef} 
        onChange={(e) => e.target.files && handleImportUniverse(e.target.files[0])}
        accept=".json,application/json"
        className="hidden"
      />
    </div>
  );
};

export default App;