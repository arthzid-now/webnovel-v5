import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleExportStory, downloadFile } from './exportService';
import { StoryEncyclopedia } from '../types';

// Mock JSZip
vi.mock('jszip', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            file: vi.fn(),
            generateAsync: vi.fn().mockResolvedValue(new Blob(['zip content'])),
            folder: vi.fn().mockReturnValue({
                file: vi.fn(),
            }),
        })),
    };
});

// Mock db
vi.mock('../db.ts', () => ({
    db: {
        stories: {
            get: vi.fn().mockResolvedValue({
                id: '1',
                title: 'Test Story',
                language: 'en',
                chapters: [],
                // Add other required fields if needed by the test logic
            }),
        },
        backups: {
            put: vi.fn(),
        }
    }
}));

describe('exportService', () => {
    const mockStory: StoryEncyclopedia = {
        id: '1',
        title: 'Test Story',
        language: 'en',
        format: 'webnovel',
        genres: [],
        otherGenre: '',
        setting: '',
        totalChapters: '',
        wordsPerChapter: '',
        mainPlot: '',
        characters: [],
        relationships: [],
        storyArc: [],
        comedyLevel: '',
        romanceLevel: '',
        actionLevel: '',
        maturityLevel: '',
        proseStyle: '',
        narrativePerspective: '',
        customProseStyleByExample: '',
        styleProfile: '',
        chapters: [
            { id: 'c1', title: 'Chapter 1', content: 'Content 1', type: 'story' }
        ],
        universeId: null,
        universeName: '',
        locations: [],
        factions: [],
        lore: [],
        magicSystem: '',
        worldBuilding: '',
        races: [],
        creatures: [],
        powers: [],
        items: [],
        technology: [],
        history: [],
        cultures: [],
        disguiseRealWorldNames: false,
        updatedAt: 0,
        createdAt: 0
    };

    const mockT = (key: string) => key;
    const mockSetToast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock DOM for downloadFile
        global.URL.createObjectURL = vi.fn();
        global.URL.revokeObjectURL = vi.fn();
    });

    it('should export as JSON', () => {
        // We can't easily spy on downloadFile in the same module without changing the code structure.
        // But we can run it and ensure no errors.
        expect(() => handleExportStory('1', mockStory, mockT, mockSetToast, 'json')).not.toThrow();
    });

    it('should export as Markdown', () => {
        expect(() => handleExportStory('1', mockStory, mockT, mockSetToast, 'md')).not.toThrow();
    });

    // Add more tests as needed
});
