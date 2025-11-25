import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import StoryEncyclopediaSetup from './components/StoryEncyclopediaSetup';
import Dashboard from './components/Dashboard';
import WritingStudio from './components/WritingStudio';
import UniverseHub from './components/UniverseHub';
import UniverseSetup from './components/UniverseSetup';
import ApiKeyModal from './components/ApiKeyModal';
import NotificationToast from './components/NotificationToast';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { StoryEncyclopedia, Character, Chapter, Universe } from './types';
import { useLanguage } from './contexts/LanguageContext';
import { useStory } from './contexts/StoryContext'; // Import useStory
import LanguageToggle from './components/LanguageToggle';
import { KeyIcon } from './components/icons/KeyIcon';
import { marked } from 'marked';
import JSZip from 'jszip';
import { db } from './db';

const API_KEY_STORAGE_KEY = 'google_ai_api_key';
const BACKUP_THRESHOLD = 2000;

// ... (Keep helper functions like createEmptyCharacter, migrateStoryData, migrateUniverseData, sanitizeForXhtml SAME as before)
// For brevity in XML response, assume standard helper functions are preserved. 
// I will re-include them to ensure file integrity.

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
    if (!parsed.updatedAt) parsed.updatedAt = Date.now();
    if (!parsed.format) parsed.format = 'webnovel';
    if (parsed.universeId === undefined) parsed.universeId = null;
    if (parsed.universeName === undefined) parsed.universeName = parsed.language === 'id' ? 'Dunia Kustom' : 'Custom World';
    if (parsed.disguiseRealWorldNames === undefined) parsed.disguiseRealWorldNames = false;

    if (!parsed.narrativePerspective) {
        parsed.narrativePerspective = parsed.language === 'id' ? 'Orang Ketiga Terbatas ("Dia")' : 'Third Person Limited ("He/She")';
    }
    
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
    
    if (!parsed.locations) parsed.locations = [];
    if (!parsed.factions) parsed.factions = [];
    if (!parsed.lore) parsed.lore = [];
    if (!parsed.races) parsed.races = [];
    if (!parsed.creatures) parsed.creatures = [];
    if (!parsed.powers) parsed.powers = [];
    if (!parsed.items) parsed.items = [];
    if (!parsed.technology) parsed.technology = [];
    if (!parsed.history) parsed.history = [];
    if (!parsed.cultures) parsed.cultures = [];
    
    if (!parsed.chapters) {
        parsed.chapters = [{ id: crypto.randomUUID(), title: 'Chapter 1', content: '' }];
    }

    if (parsed.storyArc && Array.isArray(parsed.storyArc)) {
        parsed.storyArc = parsed.storyArc.map((act: any) => ({
            ...act,
            plotPoints: act.plotPoints || [],
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
    if (!parsed.updatedAt) parsed.updatedAt = Date.now();
    if (!parsed.language) parsed.language = 'en';
    if (!parsed.locations) parsed.locations = [];
    if (!parsed.factions) parsed.factions = [];
    if (!parsed.lore) parsed.lore = [];
    if (!parsed.races) parsed.races = [];
    if (!parsed.creatures) parsed.creatures = [];
    if (!parsed.powers) parsed.powers = [];
    if (!parsed.items) parsed.items = [];
    if (!parsed.technology) parsed.technology = [];
    if (!parsed.history) parsed.history = [];
    if (!parsed.cultures) parsed.cultures = [];
    return parsed as Universe;
}

const sanitizeForXhtml = (html: string): string => {
    return html
        .replace(/<br>/g, '<br />')
        .replace(/<hr>/g, '<hr />')
        .replace(/<img([^>]+)>/g, '<img$1 />');
};

type View = 'dashboard' | 'setup' | 'studio' | 'universeHub' | 'universeSetup';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [stories, setStories] = useState<StoryEncyclopedia[]>([]);
  const [universes, setUniverses] = useState<Universe[]>([]);
  
  // NOTE: activeStoryId is now mainly for View Routing. Data is in StoryContext.
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
  const { loadStory, unloadStory, currentStory } = useStory(); // Use Context

  // --- MIGRATION LOGIC (Same as before) ---
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
                      if(storedBackup) {
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

  // Fetch lists for Dashboard
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

  // Check Backup (Using Context Data if active)
  useEffect(() => {
      const checkBackup = async () => {
        if (currentStory && view === 'studio') {
             const currentWordCount = currentStory.chapters.reduce((acc, chap) => acc + (chap.content?.trim().split(/\s+/).length || 0), 0);
             try {
                const backupRecord = await db.backups.get(currentStory.id);
                const lastBackup = backupRecord?.lastWordCount || 0;
                if (currentWordCount - lastBackup > BACKUP_THRESHOLD) {
                    setToastMessage(t('toast.backupReminder'));
                }
             } catch (e) {}
        }
      };
      // Check every minute or on change
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
            await db.transaction('rw', db.stories, db.chats, db.backups, async () => {
                await db.stories.delete(storyId);
                await db.chats.delete(storyId);
                await db.backups.delete(storyId);
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

  // --- OPTIMIZED: Switch to Studio ---
  const handleSelectStory = async (storyId: string) => {
    setActiveStoryId(storyId);
    setIsLoading(true);
    await loadStory(storyId);
    setIsLoading(false);
    setView('studio');
  };

  // --- Setup Save ---
  const handleStorySave = async (storyData: StoryEncyclopedia) => {
     try {
        const storyToSave = { ...storyData, updatedAt: Date.now() };
        await db.stories.put(storyToSave);
        
        // Refresh List
        await refreshStoriesList();

        // If we just created it or are editing, load it into context
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
    unloadStory(); // Clear Context to free memory/prevent stale state
    setActiveStoryId(null);
    setEditingStoryId(null);
    setEditingUniverseId(null);
    refreshStoriesList(); // Ensure list is up to date
    setView('dashboard');
  };

  // --- Universe Handlers ---
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
         } catch (error) {}
     }
  };
  
  const handleExportUniverse = (universeId: string) => {
      const universe = universes.find(u => u.id === universeId);
      if(!universe) return;
      const json = JSON.stringify(universe, null, 2);
      downloadFile(json, `universe_${universe.name.replace(/\W/g,'_')}.json`, 'application/json');
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
      if(!u) return;
      await db.universes.put({ ...u, isFavorite: !u.isFavorite, updatedAt: Date.now() });
      refreshStoriesList();
  };

  // --- Exports ---
  const downloadFile = (content: string, filename: string, mimeType: string) => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleExportStory = async (storyId: string, format: 'epub' | 'html' | 'txt' | 'json' | 'md' | 'pdf' = 'md') => {
    // If exporting current story from Studio, use context. Otherwise find in list.
    let story: StoryEncyclopedia | undefined;
    if (currentStory && currentStory.id === storyId) {
        story = currentStory;
    } else {
        story = await db.stories.get(storyId);
    }
    
    if (!story) return alert(t('dashboard.exportNotFound'));
    const safeTitle = story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (format === 'json') {
        await db.backups.put({ storyId, lastWordCount: 999999999 }); // Suppress backup prompt
        setToastMessage(null);
        downloadFile(JSON.stringify(story, null, 2), `${safeTitle}_backup.json`, 'application/json');
        return;
    }

    if (format === 'md') {
        const encData = { ...story };
        delete (encData as any).chapters;
        const chaptersMd = story.chapters.map(c => `## ${c.title}\n\n${c.content}`).join('\n\n<!-- CHAPTER_BREAK -->\n\n');
        downloadFile(`<!-- ENCYCLOPEDIA_JSON_START -->\n${JSON.stringify(encData, null, 2)}\n<!-- ENCYCLOPEDIA_JSON_END -->\n\n${chaptersMd}`, `${safeTitle}.md`, 'text/markdown;charset=utf-8');
        return;
    }

    if (format === 'txt') {
        const txt = story.chapters.map(c => `${c.title.toUpperCase()}\n\n${c.content.replace(/\*\*/g,'').replace(/^#+\s/gm, '')}`).join('\n\n' + '-'.repeat(20) + '\n\n');
        navigator.clipboard.writeText(txt).then(() => alert(t('export.copySuccess'))).catch(() => downloadFile(txt, `${safeTitle}.txt`, 'text/plain'));
        return;
    }

    if (format === 'html' || format === 'pdf' || format === 'epub') {
        // Reuse logic from previous App.tsx for HTML generation, shortened here for brevity but logic persists.
        // The implementation matches the previous one.
         const chaptersHtml = story.chapters.map(chap => `
            <div class="chapter">
                <h2>${chap.title}</h2>
                ${marked.parse(chap.content)}
            </div>
            <hr/>
        `).join('');
        
        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${story.title}</title>
                <style>
                    body { font-family: serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                    h1, h2 { text-align: center; }
                    hr { border: 0; border-top: 1px solid #ccc; margin: 40px 0; }
                    p { margin-bottom: 1em; }
                    @media print { @page { margin: 2cm; } body { font-family: 'Times New Roman', serif; } }
                </style>
            </head>
            <body>
                <h1>${story.title}</h1>
                <p style="text-align:center;">By ${t('common.name')}</p>
                ${chaptersHtml}
            </body>
            </html>
        `;

        if (format === 'html') {
             downloadFile(fullHtml, `${safeTitle}.html`, 'text/html;charset=utf-8');
        } else if (format === 'pdf') {
             const printWindow = window.open('', '_blank');
             if (printWindow) {
                printWindow.document.write(fullHtml);
                printWindow.document.close();
                setTimeout(() => printWindow.print(), 500);
             } else { alert("Pop-up blocked"); }
        } else if (format === 'epub') {
             // ... JSZip logic (Same as before) ...
             const zip = new JSZip();
             zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
             zip.folder("META-INF")?.file("container.xml", `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`);
             const oebps = zip.folder("OEBPS");
             if(oebps) {
                 story.chapters.forEach((chap, i) => {
                     const xhtml = `<?xml version="1.0" encoding="utf-8"?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${chap.title}</title></head><body><h2>${chap.title}</h2>${sanitizeForXhtml(marked.parse(chap.content) as string)}</body></html>`;
                     oebps.file(`chapter_${i}.xhtml`, xhtml);
                 });
                 // ... OPF & NCX generation (Same as before) ...
                 const manifestItems = story.chapters.map((_, i) => `<item id="chapter_${i}" href="chapter_${i}.xhtml" media-type="application/xhtml+xml"/>`).join('\n');
                 const spineItems = story.chapters.map((_, i) => `<itemref idref="chapter_${i}"/>`).join('\n');
                 const opf = `<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf"><dc:title>${story.title}</dc:title><dc:language>${story.language}</dc:language><dc:identifier id="BookId" opf:scheme="UUID">${story.id}</dc:identifier></metadata><manifest><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>${manifestItems}</manifest><spine toc="ncx">${spineItems}</spine></package>`;
                 oebps.file("content.opf", opf);
                 const navPoints = story.chapters.map((chap, i) => `<navPoint id="navPoint-${i+1}" playOrder="${i+1}"><navLabel><text>${chap.title}</text></navLabel><content src="chapter_${i}.xhtml"/></navPoint>`).join('\n');
                 const ncx = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd"><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${story.id}"/></head><docTitle><text>${story.title}</text></docTitle><navMap>${navPoints}</navMap></ncx>`;
                 oebps.file("toc.ncx", ncx);
             }
             const content = await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
             const url = URL.createObjectURL(content);
             const a = document.createElement('a'); a.href = url; a.download = `${safeTitle}.epub`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        }
    }
  };

  const handleImportStory = (file: File) => {
      if(!file) return;
      const reader = new FileReader();
      reader.onload = async(e) => {
          try {
              const content = e.target?.result as string;
              const jsonRegex = /<!-- ENCYCLOPEDIA_JSON_START -->([\s\S]*?)<!-- ENCYCLOPEDIA_JSON_END -->/;
              const match = content.match(jsonRegex);
              if(!match) throw new Error("Invalid Format");
              const encData = JSON.parse(match[1]);
              const chaptersPart = content.replace(jsonRegex, '').trim();
              const chapters = chaptersPart.split(/\n\s*<!-- CHAPTER_BREAK -->\s*\n/).map(part => {
                 const lines = part.trim().split('\n');
                 const title = lines.find(l => l.startsWith('## '))?.replace('## ', '').trim() || 'Untitled';
                 return { id: crypto.randomUUID(), title, content: lines.slice(1).join('\n').trim() };
              });
              const newStory = migrateStoryData({ ...encData, id: crypto.randomUUID(), chapters, updatedAt: Date.now() });
              await handleStorySave(newStory);
              alert(t('dashboard.importSuccess', { title: newStory.title }));
          } catch(e) { alert("Import Error"); }
      };
      reader.readAsText(file);
  };
  
  const handleTriggerImport = (type: 'story' | 'universe') => {
    if (type === 'story') storyFileInputRef.current?.click();
    if (type === 'universe') universeFileInputRef.current?.click();
  };

  // --- Rendering ---
  const renderContent = () => {
    switch(view) {
        case 'studio':
            // Removed props 'story' and 'onUpdateStory'. 
            // WritingStudio now consumes StoryContext directly.
            return <WritingStudio 
                      apiKey={apiKey}
                      onGoToDashboard={handleGoToDashboard}
                      onEditRequest={() => { setEditingStoryId(activeStoryId); setView('setup'); }}
                      onExportStory={handleExportStory}
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
                        onExportStory={handleExportStory}
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

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
       {showApiKeyModal && <ApiKeyModal onSave={handleSaveApiKey} onClose={() => setShowApiKeyModal(false)} />}
       {toastMessage && activeStoryId && view === 'studio' && (
           <NotificationToast 
              message={toastMessage} 
              actionLabel={t('toast.backupAction')} 
              onAction={() => handleExportStory(activeStoryId, 'json')} 
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
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto flex overflow-hidden">
        {renderContent()}
      </main>
      <input type="file" ref={storyFileInputRef} onChange={(e) => e.target.files && handleImportStory(e.target.files[0])} accept=".md,text/markdown" className="hidden" />
      <input type="file" ref={universeFileInputRef} onChange={(e) => e.target.files && handleImportUniverse(e.target.files[0])} accept=".json,application/json" className="hidden" />
    </div>
  );
};

export default App;