
export enum ModelType {
  FLASH = 'gemini-flash-latest',
  PRO = 'gemini-3-pro-preview',
}

export interface Persona {
    id: string;
    defaultName: string;
    role: string;
    description: string;
    color: string; // Tailwind color name (e.g., 'emerald', 'violet')
    icon: string; // Icon key
    defaultThinking: boolean;
    systemInstructionEn: string;
    systemInstructionId: string;
}

export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

export interface Message {
  id: string;
  author: MessageAuthor;
  text: string;
  timestamp: number;
}

export interface CustomField {
  id: string;
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
  character1Id: string;
  character2Id: string;
  type: string;
  description: string;
}

export interface PlotPoint {
    id: string;
    summary: string;
}

export interface StoryArcAct {
    title: string;
    description: string;
    plotPoints: PlotPoint[];
    startChapter: string;
    endChapter: string;
    structureTemplate?: string; // 'freestyle', 'heros_journey', etc.
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  type?: 'story' | 'group_header';
}

export interface ChapterVersion {
    id?: number; // Auto-increment from Dexie
    storyId: string;
    chapterId: string;
    title: string;
    content: string;
    timestamp: number;
    label?: string;
}

export interface LoreEntry {
    id: string;
    name: string;
    description: string;
    date?: string; // For timeline/history items
}

export interface StoryEncyclopedia {
  id: string;
  updatedAt?: number; // Timestamp for sorting/sync
  language: 'en' | 'id';
  format: 'novel' | 'webnovel'; // New field for structure type
  title: string;
  universeId: string | null; // Link to Universe Library
  universeName: string; // Snapshot name for display
  genres: string[];
  otherGenre: string;
  setting: string;
  totalChapters: string;
  wordsPerChapter: string;
  mainPlot: string;
  characters: Character[];
  relationships: Relationship[];
  storyArc: StoryArcAct[];
  
  // Tone & Style
  comedyLevel: string;
  romanceLevel: string;
  actionLevel: string;
  maturityLevel: string;
  proseStyle: string;
  narrativePerspective: string;
  customProseStyleByExample?: string;
  styleProfile?: string; // New Field: Extracted Style DNA
  
  // World Building (Expanded)
  worldBuilding: string; // Summary
  magicSystem: string;   // Summary
  locations: LoreEntry[];
  factions: LoreEntry[];
  lore: LoreEntry[]; // General Lore
  
  // New Lore Categories
  races: LoreEntry[];
  creatures: LoreEntry[];
  powers: LoreEntry[];
  items: LoreEntry[];
  technology: LoreEntry[];
  history: LoreEntry[];
  cultures: LoreEntry[];
  
  chapters: Chapter[];
  
  // Flags
  disguiseRealWorldNames?: boolean;
}

export interface Universe {
    id: string;
    updatedAt?: number;
    language: 'en' | 'id';
    name: string;
    description: string;
    isFavorite?: boolean;
    
    // Shared Data
    worldBuilding: string;
    magicSystem: string;
    locations: LoreEntry[];
    factions: LoreEntry[];
    lore: LoreEntry[];
    races: LoreEntry[];
    creatures: LoreEntry[];
    powers: LoreEntry[];
    items: LoreEntry[];
    technology: LoreEntry[];
    history: LoreEntry[];
    cultures: LoreEntry[];
}

export type UILanguage = 'en' | 'id';

export interface Translations {
  [key: string]: any;
}

export interface LanguageContextType {
  uiLang: UILanguage;
  setUiLang: (lang: UILanguage) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

export interface SearchOptions {
    matchCase: boolean;
    wholeWord: boolean;
}

export interface SearchResult {
    chapterId: string;
    chapterTitle: string;
    matchCount: number;
}

export interface AnalysisResult {
    newCharacters: Character[];
    newLocations: LoreEntry[];
    newPlotPoints: string[];
    summary: string;
}