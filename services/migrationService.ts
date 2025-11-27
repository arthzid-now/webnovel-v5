import { StoryEncyclopedia, Character, Universe } from '../types.ts';
import { createEmptyCharacter } from '../utils.ts';

export const migrateStoryData = (data: any): StoryEncyclopedia => {
    let parsed = { ...data };

    if (!parsed.id) parsed.id = crypto.randomUUID();
    if (!parsed.updatedAt) parsed.updatedAt = Date.now();
    if (!parsed.format) parsed.format = 'webnovel';
    if (!parsed.language) parsed.language = 'en';
    if (!parsed.comedyLevel) parsed.comedyLevel = '5';
    if (!parsed.romanceLevel) parsed.romanceLevel = '5';
    if (!parsed.actionLevel) parsed.actionLevel = '5';
    if (!parsed.maturityLevel) parsed.maturityLevel = '1';
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
        if (!parsed.characters.some((c: Character) => c.name === protagonist.name)) {
            parsed.characters.push(protagonist);
        }
    }
    if (parsed.loveInterests) {
        parsed.loveInterests.forEach((li: any) => {
            const loveInterest = ensureFullCharacter(li, ['Love Interest']);
            if (loveInterest.name && !parsed.characters.some((c: Character) => c.name === loveInterest.name)) {
                parsed.characters.push(loveInterest);
            }
        });
    }
    if (parsed.antagonists) {
        parsed.antagonists.forEach((ant: any) => {
            const antagonist = ensureFullCharacter(ant, ['Antagonist']);
            if (antagonist.name && !parsed.characters.some((c: Character) => c.name === antagonist.name)) {
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
        parsed.relationships = parsed.relationships.map((rel: any) => ({ ...rel, id: rel.id || crypto.randomUUID() }));
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
        parsed.chapters = [{ id: crypto.randomUUID(), title: 'Chapter 1', content: '', type: 'story' }];
    } else {
        // Ensure type field exists for old chapters
        parsed.chapters = parsed.chapters.map((c: any) => ({ ...c, type: c.type || 'story' }));
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

    if (parsed.styleProfile === undefined) {
        parsed.styleProfile = '';
    }

    return parsed as StoryEncyclopedia;
};

export const migrateUniverseData = (data: any): Universe => {
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
    if (!parsed.magicSystem) parsed.magicSystem = '';
    if (!parsed.worldBuilding) parsed.worldBuilding = '';
    return parsed as Universe;
}
