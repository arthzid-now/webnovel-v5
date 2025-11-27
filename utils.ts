import { Character } from './types.ts';

export const createEmptyCharacter = (nameOrDesc: string = '', roles: string[] = []): Character => ({
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
