import Dexie, { Table } from 'dexie';
import { StoryEncyclopedia, Universe, Message, ChapterVersion } from './types';

// Define types for Chat Session and Backups distinct from the main types
export interface ChatSession {
    storyId: string;
    messages: Message[];
}

export interface BackupMetadata {
    storyId: string;
    lastWordCount: number;
}

// Use instance based pattern to avoid TS inheritance issues with Dexie types
const db = new Dexie('WebnovelStudioDB') as Dexie & {
    stories: Table<StoryEncyclopedia, string>;
    universes: Table<Universe, string>;
    chats: Table<ChatSession, string>;
    backups: Table<BackupMetadata, string>;
    chapter_versions: Table<ChapterVersion, number>;
};

// Version 1
db.version(1).stores({
    stories: 'id, title, updatedAt', // Primary key and indexed props
    universes: 'id, name, updatedAt', // Added updatedAt
    chats: 'storyId',
    backups: 'storyId'
});

// Version 2: Add chapter_versions
db.version(2).stores({
    chapter_versions: '++id, chapterId, storyId, timestamp'
});

export { db };