import { describe, it, expect } from 'vitest';
import { migrateStoryData, migrateUniverseData } from './migrationService';
import { StoryEncyclopedia, Universe } from '../types';

describe('migrationService', () => {
    describe('migrateStoryData', () => {
        it('should add missing fields to story data', () => {
            const oldStory: any = {
                id: '123',
                title: 'Old Story',
                // Missing many fields
            };

            const migrated = migrateStoryData(oldStory);

            expect(migrated.id).toBe('123');
            expect(migrated.title).toBe('Old Story');
            expect(migrated.language).toBe('en'); // Default
            expect(migrated.comedyLevel).toBe('5'); // Default
            expect(migrated.styleProfile).toBe(''); // New field
            expect(migrated.disguiseRealWorldNames).toBe(false); // New field
        });

        it('should preserve existing fields', () => {
            const existingStory: any = {
                id: '456',
                title: 'Existing Story',
                language: 'id',
                comedyLevel: '8',
                styleProfile: 'Dark and gritty',
            };

            const migrated = migrateStoryData(existingStory);

            expect(migrated.language).toBe('id');
            expect(migrated.comedyLevel).toBe('8');
            expect(migrated.styleProfile).toBe('Dark and gritty');
        });
    });

    describe('migrateUniverseData', () => {
        it('should add missing fields to universe data', () => {
            const oldUniverse: any = {
                id: 'u1',
                name: 'Old Universe',
            };

            const migrated = migrateUniverseData(oldUniverse);

            expect(migrated.id).toBe('u1');
            expect(migrated.name).toBe('Old Universe');
            expect(migrated.language).toBe('en'); // Default
            expect(migrated.magicSystem).toBe(''); // Default
        });
    });
});
