
export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

export interface Message {
  id: string;
  author: MessageAuthor;
  text: string;
  timestamp?: any; // For Firestore serverTimestamp
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-2.5-pro',
}

export interface PlotPoint {
  id: string;
  summary: string;
}

export interface StoryArcAct {
  title: string;
  description: string;
  plotPoints: PlotPoint[];
  // New Fields for Narrative Engine
  startChapter?: string; // String to allow empty state in UI
  endChapter?: string;   // String to allow empty state in UI
  structureTemplate?: string;
}

export interface CustomField {
  id:string;
  label: string;
  value: string;
}

export interface Character {
  id: string;
  name: string;
  roles: string[];
  age: string;
  gender: string;
  physicalDescription: string;
  voiceAndSpeechStyle: string;
  personalityTraits: string;
  habits: string;
  goal: string;
  principles: string;
  conflict: string;
  customFields: CustomField[];
}

export interface Relationship {
  id: string;
  character1Id: string; // Changed from string name to ID
  character2Id: string; // Changed from string name to ID
  type: string;
  description: string;
}

export interface LoreEntry {
    id: string;
    name: string;
    description: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
}

export interface ChapterVersion {
  id?: number; // Auto-increment
  storyId: string;
  chapterId: string;
  title: string;
  content: string;
  timestamp: number;
  label?: string;
}

// New separate type for reusable world-building
export interface Universe {
  id: string;
  language: 'en' | 'id'; // Language of the content
  name: string;
  description: string;
  isFavorite?: boolean;
  updatedAt?: number; // For sorting
  
  // Geography & Politics
  locations: LoreEntry[];
  factions: LoreEntry[];
  
  // Nature & Biology
  races: LoreEntry[];
  creatures: LoreEntry[];

  // Power & Assets
  magicSystem?: string; // Summary
  powers: LoreEntry[];  // Specific spells/skills
  items: LoreEntry[];
  technology: LoreEntry[];

  // History & Culture
  history: LoreEntry[];
  cultures: LoreEntry[];
  lore: LoreEntry[]; // General Lore (Misc)
  
  worldBuilding?: string; // Summary
}


export interface StoryEncyclopedia {
  id: string;
  language: 'en' | 'id';
  format: 'novel' | 'webnovel'; // New Format Toggle
  title: string;
  genres: string[];
  otherGenre: string;
  setting: string;
  totalChapters: string;
  wordsPerChapter: string;
  mainPlot: string;
  characters: Character[];
  relationships: Relationship[];
  storyArc: StoryArcAct[];
  comedyLevel: string;
  romanceLevel: string;
  actionLevel: string;
  maturityLevel: string;
  proseStyle: string;
  narrativePerspective: string; // New POV field
  customProseStyleByExample?: string;
  chapters: Chapter[];
  updatedAt?: number; // For sorting
  
  // --- Fields snapshotted from a Universe ---
  universeId: string | null; // Link to the master Universe
  universeName: string;      // Display name of the universe
  
  // Geography & Politics
  locations: LoreEntry[];
  factions: LoreEntry[];
  
  // Nature & Biology
  races: LoreEntry[];
  creatures: LoreEntry[];

  // Power & Assets
  magicSystem?: string;
  powers: LoreEntry[];
  items: LoreEntry[];
  technology: LoreEntry[];

  // History & Culture
  history: LoreEntry[];
  cultures: LoreEntry[];
  lore: LoreEntry[]; // General Lore

  worldBuilding?: string;
  
  // For real-world templates
  disguiseRealWorldNames?: boolean;
}

// --- Analysis Types ---
export interface AnalysisResult {
  newCharacters: Character[];
  newLocations: LoreEntry[];
  newPlotPoints: string[]; // Strings to be added to the Story Arc
  summary: string; // Brief summary of the chapter
}

// --- Search Types ---
export interface SearchOptions {
  matchCase: boolean;
  wholeWord: boolean;
}

export interface SearchResult {
  chapterId: string;
  chapterTitle: string;
  matchCount: number;
}

// --- Types for Internationalization ---
export type UILanguage = 'en' | 'id';

export type Translations = {
  [key: string]: string | Translations;
};

export interface LanguageContextType {
  uiLang: UILanguage;
  setUiLang: (lang: UILanguage) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}