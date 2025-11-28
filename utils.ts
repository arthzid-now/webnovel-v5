import { Character } from './types.ts';

export const createEmptyCharacter = (nameOrDesc: string = '', roles: string[] = []): Character => ({
    id: crypto.randomUUID(),
    name: nameOrDesc,
    initialConcept: '',
    roles: roles,
    age: '',
    gender: '',
    birthDate: '',
    bloodType: '',
    physicalDescription: '',
    voiceAndSpeechStyle: '',
    personalityTraits: '',
    habits: '',
    goal: '',
    principles: '',
    conflict: '',
    customFields: [],
});

export const getZodiacSign = (dateStr: string): string | null => {
    if (!dateStr) return null;

    // Try to parse "DD Month" (e.g. "15 August") or "YYYY-MM-DD"
    let day: number, month: number;

    const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const monthNamesId = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];

    // Check for "DD Month" format
    const textMatch = dateStr.match(/^(\d{1,2})\s+([a-zA-Z]+)/);
    if (textMatch) {
        day = parseInt(textMatch[1]);
        const monthStr = textMatch[2].toLowerCase();
        month = monthNames.indexOf(monthStr);
        if (month === -1) month = monthNamesId.indexOf(monthStr);
        if (month === -1) return null; // Invalid month
        month += 1; // 1-indexed
    } else {
        // Try standard date parse
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return null;
        day = date.getDate();
        month = date.getMonth() + 1;
    }

    if (month === 1) return day <= 19 ? "Capricorn ♑" : "Aquarius ♒";
    if (month === 2) return day <= 18 ? "Aquarius ♒" : "Pisces ♓";
    if (month === 3) return day <= 20 ? "Pisces ♓" : "Aries ♈";
    if (month === 4) return day <= 19 ? "Aries ♈" : "Taurus ♉";
    if (month === 5) return day <= 20 ? "Taurus ♉" : "Gemini ♊";
    if (month === 6) return day <= 20 ? "Gemini ♊" : "Cancer ♋";
    if (month === 7) return day <= 22 ? "Cancer ♋" : "Leo ♌";
    if (month === 8) return day <= 22 ? "Leo ♌" : "Virgo ♍";
    if (month === 9) return day <= 22 ? "Virgo ♍" : "Libra ♎";
    if (month === 10) return day <= 22 ? "Libra ♎" : "Scorpio ♏";
    if (month === 11) return day <= 21 ? "Scorpio ♏" : "Sagittarius ♐";
    if (month === 12) return day <= 21 ? "Sagittarius ♐" : "Capricorn ♑";

    return null;
};
