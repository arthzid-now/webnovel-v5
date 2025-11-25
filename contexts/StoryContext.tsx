
import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import { StoryEncyclopedia, Chapter, SearchOptions, SearchResult, ChapterVersion } from '../types';
import { db } from '../db';

interface StoryContextType {
  currentStory: StoryEncyclopedia | null;
  isLoading: boolean;
  error: string | null;
  loadStory: (id: string) => Promise<void>;
  unloadStory: () => void;
  updateStoryMetadata: (updates: Partial<StoryEncyclopedia>) => Promise<void>;
  updateChapter: (chapterId: string, title: string, content: string) => Promise<void>;
  addChapter: () => Promise<void>;
  addSectionHeader: (title: string) => Promise<void>;
  deleteChapter: (chapterId: string) => Promise<void>;
  reorderChapters: (chapters: Chapter[]) => Promise<void>;
  saveStoryToDb: () => Promise<void>;
  searchGlobal: (query: string, options: SearchOptions) => SearchResult[];
  replaceGlobal: (query: string, replacement: string, options: SearchOptions) => Promise<{ matches: number, chaptersAffected: number }>;
  // Versioning
  createSnapshot: (chapterId: string, label?: string) => Promise<void>;
  getSnapshots: (chapterId: string) => Promise<ChapterVersion[]>;
  deleteSnapshot: (versionId: number) => Promise<void>;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const StoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStory, setCurrentStory] = useState<StoryEncyclopedia | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStory = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const story = await db.stories.get(id);
      if (story) {
        setCurrentStory(story);
      } else {
        setError("Story not found");
      }
    } catch (err) {
      console.error("Failed to load story", err);
      setError("Failed to load story from database");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unloadStory = useCallback(() => {
    setCurrentStory(null);
    setError(null);
  }, []);

  // Generic update for metadata (title, genre, lore, etc)
  const updateStoryMetadata = useCallback(async (updates: Partial<StoryEncyclopedia>) => {
    // Only update if currentStory exists
    setCurrentStory(prev => {
        if (!prev) return null;
        const updated = { ...prev, ...updates, updatedAt: Date.now() };
        // Fire and forget save
        db.stories.put(updated).catch(console.error);
        return updated;
    });
  }, []);

  // Specific optimized update for Chapter content (High frequency)
  const updateChapter = useCallback(async (chapterId: string, title: string, content: string) => {
     setCurrentStory(prev => {
         if (!prev) return null;
         
         // Optimization: If content hasn't changed, don't create new object ref
         const chapIndex = prev.chapters.findIndex(c => c.id === chapterId);
         if (chapIndex === -1) return prev;
         if (prev.chapters[chapIndex].title === title && prev.chapters[chapIndex].content === content) return prev;

         const updatedChapters = [...prev.chapters];
         updatedChapters[chapIndex] = { ...updatedChapters[chapIndex], title, content };
         
         const updatedStory = { ...prev, chapters: updatedChapters, updatedAt: Date.now() };
         
         // Fire and forget save to DB
         db.stories.put(updatedStory).catch(console.error);
         
         return updatedStory;
     });
  }, []);

  const addChapter = useCallback(async () => {
      let newChapterId = crypto.randomUUID();
      
      setCurrentStory(prev => {
          if (!prev) return null;
          const newChapter: Chapter = {
              id: newChapterId,
              title: prev.language === 'id' ? `Bab ${prev.chapters.length + 1}` : `Chapter ${prev.chapters.length + 1}`,
              content: '',
              type: 'story'
          };
          const updated = { 
              ...prev, 
              chapters: [...prev.chapters, newChapter],
              updatedAt: Date.now()
          };
          db.stories.put(updated).catch(console.error);
          return updated;
      });
  }, []);

  const addSectionHeader = useCallback(async (title: string) => {
      let newId = crypto.randomUUID();
      setCurrentStory(prev => {
          if (!prev) return null;
          const newHeader: Chapter = {
              id: newId,
              title: title,
              content: '',
              type: 'group_header'
          };
          const updated = {
              ...prev,
              chapters: [...prev.chapters, newHeader],
              updatedAt: Date.now()
          };
          db.stories.put(updated).catch(console.error);
          return updated;
      });
  }, []);

  const deleteChapter = useCallback(async (chapterId: string) => {
      setCurrentStory(prev => {
          if(!prev) return null;
          const updated = {
              ...prev,
              chapters: prev.chapters.filter(c => c.id !== chapterId),
              updatedAt: Date.now()
          };
          db.stories.put(updated).catch(console.error);
          
          // Also delete versions associated with this chapter to clean up
          db.chapter_versions.where('chapterId').equals(chapterId).delete().catch(console.error);
          
          return updated;
      });
  }, []);

  const reorderChapters = useCallback(async (chapters: Chapter[]) => {
    setCurrentStory(prev => {
        if(!prev) return null;
        const updated = { ...prev, chapters, updatedAt: Date.now() };
        db.stories.put(updated).catch(console.error);
        return updated;
    });
  }, []);

  const saveStoryToDb = useCallback(async () => {
      if (currentStory) {
          await db.stories.put({ ...currentStory, updatedAt: Date.now() });
      }
  }, [currentStory]);

  // --- Global Search & Replace Utils ---
  const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const createSearchRegex = (query: string, options: SearchOptions) => {
      const escaped = escapeRegExp(query);
      const pattern = options.wholeWord ? `\\b${escaped}\\b` : escaped;
      const flags = options.matchCase ? 'g' : 'gi';
      return new RegExp(pattern, flags);
  };

  const searchGlobal = useCallback((query: string, options: SearchOptions): SearchResult[] => {
      if (!currentStory || !query.trim()) return [];

      const regex = createSearchRegex(query, options);
      const results: SearchResult[] = [];

      currentStory.chapters.forEach(chapter => {
          if (chapter.type === 'group_header') return; // Skip headers
          const matches = chapter.content.match(regex);
          if (matches && matches.length > 0) {
              results.push({
                  chapterId: chapter.id,
                  chapterTitle: chapter.title,
                  matchCount: matches.length
              });
          }
      });

      return results;
  }, [currentStory]);

  const replaceGlobal = useCallback(async (query: string, replacement: string, options: SearchOptions) => {
      if (!currentStory || !query.trim()) return { matches: 0, chaptersAffected: 0 };

      const regex = createSearchRegex(query, options);
      let totalMatches = 0;
      let chaptersAffected = 0;
      
      let hasChanges = false;
      const newChapters = currentStory.chapters.map(chapter => {
          if (chapter.type === 'group_header') return chapter; // Skip headers
          const matches = chapter.content.match(regex);
          if (matches && matches.length > 0) {
              totalMatches += matches.length;
              chaptersAffected++;
              hasChanges = true;
              return { ...chapter, content: chapter.content.replace(regex, replacement) };
          }
          return chapter;
      });

      if (hasChanges) {
          setCurrentStory(prev => {
              if(!prev) return null;
              const updated = { ...prev, chapters: newChapters, updatedAt: Date.now() };
              db.stories.put(updated).catch(console.error);
              return updated;
          });
      }

      return { matches: totalMatches, chaptersAffected };
  }, [currentStory]);

  // --- Versioning Logic ---
  const createSnapshot = useCallback(async (chapterId: string, label?: string) => {
      if (!currentStory) return;
      const chapter = currentStory.chapters.find(c => c.id === chapterId);
      if (!chapter) return;

      const version: ChapterVersion = {
          storyId: currentStory.id,
          chapterId: chapter.id,
          title: chapter.title,
          content: chapter.content,
          timestamp: Date.now(),
          label
      };
      
      await db.chapter_versions.add(version);
  }, [currentStory]);

  const getSnapshots = useCallback(async (chapterId: string) => {
      return await db.chapter_versions.where('chapterId').equals(chapterId).reverse().sortBy('timestamp');
  }, []);

  const deleteSnapshot = useCallback(async (versionId: number) => {
      await db.chapter_versions.delete(versionId);
  }, []);


  const contextValue = useMemo(() => ({
    currentStory, 
    isLoading, 
    error, 
    loadStory, 
    unloadStory, 
    updateStoryMetadata, 
    updateChapter,
    addChapter,
    addSectionHeader,
    deleteChapter,
    reorderChapters,
    saveStoryToDb,
    searchGlobal,
    replaceGlobal,
    createSnapshot,
    getSnapshots,
    deleteSnapshot
  }), [
    currentStory, 
    isLoading, 
    error, 
    loadStory, 
    unloadStory, 
    updateStoryMetadata, 
    updateChapter,
    addChapter,
    addSectionHeader,
    deleteChapter,
    reorderChapters,
    saveStoryToDb,
    searchGlobal,
    replaceGlobal,
    createSnapshot,
    getSnapshots,
    deleteSnapshot
  ]);

  return (
    <StoryContext.Provider value={contextValue}>
      {children}
    </StoryContext.Provider>
  );
};

export const useStory = (): StoryContextType => {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error('useStory must be used within a StoryProvider');
  }
  return context;
};
