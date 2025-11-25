
import { GoogleGenAI, Chat, Type, GenerateContentResponse, Content } from "@google/genai";
import { ModelType, StoryEncyclopedia, StoryArcAct, Character, Relationship, CustomField, LoreEntry, Universe, AnalysisResult, Message, MessageAuthor, Persona } from '../types';
import { SYSTEM_INSTRUCTION_EN, SYSTEM_INSTRUCTION_ID, MAX_THINKING_BUDGET, PROSE_STYLES_EN, PROSE_STYLES_ID, STRUCTURE_TEMPLATES, DEFAULT_PERSONAS } from '../constants';

const initializeGenAI = (apiKey: string) => {
    return new GoogleGenAI({ apiKey });
}

// --- SAFETY SETTINGS (JAILBREAK / CREATIVE FREEDOM) ---
const SAFETY_SETTINGS = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' }
];

// --- ERROR HANDLING UTILITY ---
const generateWithRetry = async <T>(
    fn: () => Promise<T>, 
    retries: number = 3, 
    delay: number = 2000
): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        const isQuotaError = error.status === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
        const isServerBusy = error.status === 503 || error.message?.includes('503') || error.message?.includes('Overloaded');

        if (retries > 0 && (isQuotaError || isServerBusy)) {
            console.warn(`API Rate Limit or Busy (Status ${error.status || 'Unknown'}). Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return generateWithRetry(fn, retries - 1, delay * 2); 
        }
        
        if (isQuotaError) {
            throw new Error("Quota Exceeded (429). Your API key has hit its daily or minute limit. Please wait a while or check your billing.");
        }
        throw error;
    }
};

const formatCharacterForPrompt = (character: Character): string => {
    if (!character || !character.name) return '';
    const rolesString = character.roles.length > 0 ? ` [${character.roles.join(', ')}]` : '';
    const customFieldsString = character.customFields?.map(cf => `- ${cf.label}: ${cf.value || 'N/A'}`).join('\n') || '';

    return `
**Character: ${character.name}${rolesString}**
- Age: ${character.age || 'N/A'}
- Gender: ${character.gender || 'N/A'}
- Physical Description: ${character.physicalDescription || 'N/A'}
- Voice & Speech Style: ${character.voiceAndSpeechStyle || 'N/A'}
- Personality Traits: ${character.personalityTraits || 'N/A'}
- Habits: ${character.habits || 'N/A'}
- Goal: ${character.goal || 'N/A'}
- Principles: ${character.principles || 'N/A'}
- Core Conflict: ${character.conflict || 'N/A'}` +
(customFieldsString ? `\n- Custom Details:\n${customFieldsString}` : '');
};


const formatRelationshipsForPrompt = (relationships: Relationship[], characters: Character[]): string => {
    if (!relationships || relationships.length === 0) return 'N/A';
    const characterMap = new Map(characters.map(c => [c.id, c.name]));
    return relationships.map(rel => {
        const name1 = characterMap.get(rel.character1Id) || 'Unknown';
        const name2 = characterMap.get(rel.character2Id) || 'Unknown';
        return `- ${name1} & ${name2}: [${rel.type}] ${rel.description}`;
    }).join('\n');
};

const formatLoreForPrompt = (lore: LoreEntry[], title: string): string => {
    if (!lore || lore.length === 0) return '';
    const entries = lore.map(item => `- ${item.name}: ${item.description}`).join('\n');
    return `\n**${title.toUpperCase()}:**\n${entries}`;
}

const formatStoryEncyclopediaForPrompt = (storyEncyclopedia: StoryEncyclopedia): string => {
    const allGenres = [...storyEncyclopedia.genres, storyEncyclopedia.otherGenre].filter(Boolean).join(', ');
    const storyArcString = storyEncyclopedia.storyArc.map((act, index) => {
        const plotPoints = (act.plotPoints || []).map(pp => `  - ${pp.summary}`).join('\n');
        const range = act.startChapter && act.endChapter ? ` (Ch.${act.startChapter}-${act.endChapter})` : '';
        const template = act.structureTemplate && act.structureTemplate !== 'freestyle' ? ` [Structure: ${act.structureTemplate}]` : '';
        return `- Act ${index + 1}: ${act.title}${range}${template}: ${act.description}` + (plotPoints ? `\n${plotPoints}` : '');
    }).join('\n');
    
    const charactersString = storyEncyclopedia.characters?.map(formatCharacterForPrompt).join('') || 'N/A';
    const relationshipsString = formatRelationshipsForPrompt(storyEncyclopedia.relationships, storyEncyclopedia.characters);
    
    const locationsString = formatLoreForPrompt(storyEncyclopedia.locations, 'Locations');
    const factionsString = formatLoreForPrompt(storyEncyclopedia.factions, 'Factions');
    const racesString = formatLoreForPrompt(storyEncyclopedia.races, 'Races & Species');
    const creaturesString = formatLoreForPrompt(storyEncyclopedia.creatures, 'Bestiary & Creatures');
    const powersString = formatLoreForPrompt(storyEncyclopedia.powers, 'Specific Powers & Spells');
    const itemsString = formatLoreForPrompt(storyEncyclopedia.items, 'Items & Artifacts');
    const techString = formatLoreForPrompt(storyEncyclopedia.technology, 'Technology');
    const historyString = formatLoreForPrompt(storyEncyclopedia.history, 'History & Timeline');
    const culturesString = formatLoreForPrompt(storyEncyclopedia.cultures, 'Culture & Traditions');
    const loreString = formatLoreForPrompt(storyEncyclopedia.lore, 'General Lore');
    
    const universeNameString = `${storyEncyclopedia.universeName}${storyEncyclopedia.disguiseRealWorldNames ? (storyEncyclopedia.language === 'id' ? ' (nama disamarkan)' : ' (names disguised)') : ''}`;

    const chapterTitlesString = storyEncyclopedia.chapters?.map(chap => `- ${chap.title}`).join('\n') || '(No chapters written yet)';

    const recentChapters = storyEncyclopedia.chapters?.slice(-2) || [];
    const recentChaptersContentString = recentChapters.length > 0
        ? recentChapters.map(chap => 
            `**${chap.title}**\n${chap.content || '(No content written for this chapter yet.)'}`
          ).join('\n\n---\n\n')
        : '(No recent chapters to display.)';
        
    // --- STYLE DNA INJECTION ---
    const styleProfile = storyEncyclopedia.styleProfile;
    const customStyle = storyEncyclopedia.customProseStyleByExample;
    
    let styleInstruction = '';
    if (styleProfile && styleProfile.trim() !== '') {
        styleInstruction = `\n\n**CRITICAL: STYLE DNA & VOICE PROFILE**
The user has defined a specific "Style DNA" for this story. You MUST adhere to these linguistic traits, sentence structures, and atmospheric instructions above all other style settings.
---
${styleProfile.trim()}
---`;
    } else if (customStyle && customStyle.trim() !== '') {
        styleInstruction = `\n\n**CRITICAL: CUSTOM PROSE STYLE BY EXAMPLE**
The user has provided a specific writing style to mimic. Analyze and replicate this style's pacing, tone, and vocabulary.
---
${customStyle.trim()}
---`;
    }
        
    const formatInstruction = storyEncyclopedia.format === 'webnovel'
        ? "STORY FORMAT: Webnovel (Fast-paced, episodic, cliffhangers at chapter ends, lighter descriptions, high dialogue)."
        : "STORY FORMAT: Traditional Novel (Slower burn, immersive descriptions, structured pacing, longer chapters).";

    return `
--- STORY ENCYCLOPEDIA CONTEXT ---

**TITLE:** ${storyEncyclopedia.title}
**FORMAT:** ${storyEncyclopedia.format || 'webnovel'}
**UNIVERSE:** ${universeNameString}
**GENRE:** ${allGenres}
**SETTING:** ${storyEncyclopedia.setting}

**TARGET STRUCTURE:**
- Total Chapters: ${storyEncyclopedia.totalChapters || 'Not Specified'}
- Words Per Chapter: ${storyEncyclopedia.wordsPerChapter || 'Not specified'}

**CORE PLOT:** ${storyEncyclopedia.mainPlot}

**CHARACTERS:**
${charactersString}

**RELATIONSHIPS:**
${relationshipsString}

**WORLD BUILDING & LORE:**
${storyEncyclopedia.worldBuilding ? `\n**WORLD SUMMARY:** ${storyEncyclopedia.worldBuilding}` : ''}
${storyEncyclopedia.magicSystem ? `\n**MAGIC/SYSTEM RULES:** ${storyEncyclopedia.magicSystem}` : ''}
${locationsString}
${factionsString}
${racesString}
${creaturesString}
${powersString}
${itemsString}
${techString}
${historyString}
${culturesString}
${loreString}


**PREVIOUS STORY EVENTS (CHRONOLOGICAL MEMORY):**
The following is the established chronology of events. You must adhere to this timeline.
${storyArcString}

**CHAPTERS (TITLES ONLY - FULL OVERVIEW):**
${chapterTitlesString}

**RECENT CHAPTERS (FULL TEXT FOR IMMEDIATE CONTEXT & STYLE MIMICRY):**
${recentChaptersContentString}

**TONE & STYLE:**
- Comedy: ${storyEncyclopedia.comedyLevel}/10
- Romance: ${storyEncyclopedia.romanceLevel}/10
- Action: ${storyEncyclopedia.actionLevel}/10
${storyEncyclopedia.maturityLevel && parseInt(storyEncyclopedia.maturityLevel, 10) > 1 ? `- Maturity: ${storyEncyclopedia.maturityLevel}/10` : ''}
- Narrative Perspective (POV): ${storyEncyclopedia.narrativePerspective}
- Prose: ${storyEncyclopedia.proseStyle}${styleInstruction}

${formatInstruction}

--- END OF CONTEXT ---

Based on this context, assist the user in developing their story.
- When asked to draft a chapter, you MUST adhere to the **Narrative Perspective (POV)**: "${storyEncyclopedia.narrativePerspective}". Do not switch POVs unless explicitly instructed.
- Try to adhere to the target words per chapter and **mimic the style and continue the events from the most recent chapters provided.**
- When asked about plot progression, consider the total number of chapters planned.
`;
}

export const createChatSession = (
    apiKey: string, 
    isThinkingMode: boolean, 
    storyEncyclopedia: StoryEncyclopedia,
    previousHistory: Message[] = [],
    activePersona?: Persona
): Chat => {
    const ai = initializeGenAI(apiKey);
    
    const isId = storyEncyclopedia.language === 'id';
    let baseInstruction = isId ? SYSTEM_INSTRUCTION_ID : SYSTEM_INSTRUCTION_EN;
    
    if (activePersona) {
        const personaInstruction = isId ? activePersona.systemInstructionId : activePersona.systemInstructionEn;
        baseInstruction = `
        ${personaInstruction}
        
        ---
        GENERAL GUIDELINES:
        ${baseInstruction}
        `;
    }

    const dynamicSystemInstruction = baseInstruction + formatStoryEncyclopediaForPrompt(storyEncyclopedia);
    const model = isThinkingMode ? ModelType.PRO : ModelType.FLASH;

    const config: any = {
        systemInstruction: dynamicSystemInstruction,
        safetySettings: SAFETY_SETTINGS,
    };

    if (model === ModelType.PRO && isThinkingMode) {
        config.thinkingConfig = { thinkingBudget: 4096 }; 
    }

    const history: Content[] = previousHistory
        .filter(msg => msg.id !== 'initial-ai-message' && !msg.id.startsWith('ai-placeholder'))
        .map(msg => ({
            role: msg.author === MessageAuthor.USER ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

    const chat = ai.chats.create({
        model: model,
        config: config,
        history: history,
    });

    return chat;
};

const customFieldSchema = {
    type: Type.OBJECT,
    properties: {
        label: { type: Type.STRING, description: "The name of the custom detail, e.g., 'Magical Ability'." },
        value: { type: Type.STRING, description: "The description of the custom detail." },
    },
    required: ["label", "value"],
};

const characterSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        roles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of roles for this character, e.g., ['Protagonist', 'Mentor']." },
        age: { type: Type.STRING },
        gender: { type: Type.STRING },
        physicalDescription: { type: Type.STRING, description: "A 1-2 sentence description of their physical appearance." },
        voiceAndSpeechStyle: { type: Type.STRING, description: "A short description of their physical voice AND their typical speech patterns (e.g., speaks quickly, uses sarcasm, has a catchphrase)." },
        personalityTraits: { type: Type.STRING, description: "A 1-2 sentence summary of their key personality traits." },
        habits: { type: Type.STRING, description: "A short description of a notable habit or quirk." },
        goal: { type: Type.STRING, description: "Their primary motivation or goal in the story." },
        principles: { type: Type.STRING, description: "A core principle or value they live by." },
        conflict: { type: Type.STRING, description: "The central internal or external conflict they face." },
        customFields: {
            type: Type.ARRAY,
            description: "Optional: An array of custom key-value details about the character.",
            items: customFieldSchema,
        },
    },
    required: ["name", "roles", "age", "gender", "physicalDescription", "voiceAndSpeechStyle", "personalityTraits", "habits", "goal", "principles", "conflict"]
};

const relationshipSchema = {
    type: Type.OBJECT,
    properties: {
        character1Id: { type: Type.STRING, description: "The ID of the first character in the relationship." },
        character2Id: { type: Type.STRING, description: "The ID of the second character in the relationship." },
        type: { type: Type.STRING, description: "The type of relationship (e.g., 'Rivals', 'Childhood Friends', 'Mentor-Mentee')." },
        description: { type: Type.STRING, description: "A 1-sentence description of their dynamic." },
    },
    required: ["character1Id", "character2Id", "type", "description"]
};

const plotPointSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A brief summary of the plot point or scene." },
    },
    required: ["summary"],
};

const loreEntrySchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING, description: "A 1-2 sentence description." },
    },
    required: ["name", "description"]
};


const generationConfig: any = {
    basic: {
        prompt: (context: string, options: { idea: string }) => {
            const storyData = JSON.parse(context) as Partial<StoryEncyclopedia>;
            const allGenres = [...(storyData.genres || []), storyData.otherGenre].filter(Boolean).join(', ');
            const isNovelFormat = storyData.format === 'novel';

            const chapterCountPrompt = isNovelFormat 
                ? "between 20-50 (Traditional Novel)" 
                : "between 100-300 (Webnovel)";
            const wordCountPrompt = isNovelFormat
                ? "between 3000-5000"
                : "between 1500-2000";
            
            let instruction = `Based on the user's core idea: "${options.idea}" and their chosen genres: "${allGenres}", generate the basic info for a ${storyData.format || 'webnovel'}.\n`;
            const existingInfo = [
                storyData.title && `Title: "${storyData.title}"`,
                storyData.setting && `Setting: "${storyData.setting}"`,
            ].filter(Boolean).join(', ');

            if (existingInfo) {
                instruction += `The user has already started writing some details: ${existingInfo}. Your task is to COMPLETE the remaining fields. Enhance the existing details if you can. Ensure the number of chapters is ${chapterCountPrompt} and words per chapter is ${wordCountPrompt}.`;
            } else {
                instruction += `Come up with a fitting title, a setting, a planned number of chapters (${chapterCountPrompt}), and words per chapter (${wordCountPrompt}).`;
            }
            return instruction;
        },
        schema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "The title of the story." },
                setting: { type: Type.STRING, description: "A one or two sentence description of the story's setting." },
                totalChapters: { type: Type.STRING, description: "Total planned chapters." },
                wordsPerChapter: { type: Type.STRING, description: "Target word count per chapter." },
            },
            required: ["title", "setting", "totalChapters", "wordsPerChapter"]
        }
    },
    core: {
        prompt: (context: string) => {
            const storyData = JSON.parse(context) as Partial<StoryEncyclopedia>;
            const existingPlot = storyData.mainPlot?.trim();
            const existingChars = storyData.characters?.filter(c => c.name.trim()).length || 0;
            let instruction = `Based on the story context: \n\n${context}\n\n`;

            if (existingPlot || existingChars > 0) {
                 instruction += `The user has already provided some core elements. Your task is to COMPLETE and EXPAND upon them. \n- If 'mainPlot' is present, refine it. \n- If characters exist, either complete their profiles or add new ones to reach a total of 3-4 diverse characters. \n- Generate 1-2 important locations and factions. \n- If relevant to the genre, also generate brief 'worldBuilding' and 'magicSystem' descriptions. Do not replace existing valid information, build upon it.`;
            } else {
                instruction += `Generate all core story elements. This includes:\n1. A compelling main plot summary (3-5 sentences).\n2. A list of 3-4 diverse and detailed main characters. For each character, assign logical roles and provide a full profile.\n3. A list of 1-2 important locations and factions.\n4. If relevant to the genre, generate brief 'worldBuilding' and 'magicSystem' descriptions.`;
            }
            return instruction;
        },
        schema: {
            type: Type.OBJECT,
            properties: {
                mainPlot: { type: Type.STRING },
                characters: {
                    type: Type.ARRAY,
                    description: "An array of 3-4 detailed character profiles.",
                    items: characterSchema
                },
                locations: { type: Type.ARRAY, description: "Optional: A list of 1-2 key locations.", items: loreEntrySchema },
                factions: { type: Type.ARRAY, description: "Optional: A list of 1-2 key factions or groups.", items: loreEntrySchema },
                lore: { type: Type.ARRAY, description: "Optional: A list of 1-2 key lore items or concepts.", items: loreEntrySchema },
                worldBuilding: { type: Type.STRING, description: "Optional: World-building details. Can be an empty string if not relevant to the genre." },
                magicSystem: { type: Type.STRING, description: "Optional: Magic/System rules. Can be an empty string if not relevant to the genre." },
            },
            required: ["mainPlot", "characters"]
        }
    },
    worldLore: { // Maps to Geography & General
        prompt: (context: string) => {
            return `Based on the story context provided below, generate a list of 2-3 important locations, 2-3 important factions/groups, and 2-3 general lore items. \n\n${context}`;
        },
        schema: {
            type: Type.OBJECT,
            properties: {
                locations: { type: Type.ARRAY, items: loreEntrySchema },
                factions: { type: Type.ARRAY, items: loreEntrySchema },
                lore: { type: Type.ARRAY, items: loreEntrySchema },
            },
            required: ["locations", "factions", "lore"]
        }
    },
    world_nature: { // Nature & Biology
        prompt: (context: string) => {
            return `Based on the story context provided below, generate:\n1. A list of 2-3 unique races or species inhabiting the world (e.g., Elves, Cyborgs, Cultivator Clans).\n2. A list of 2-3 unique creatures, monsters, or bestiary entries.\n\n${context}`;
        },
        schema: {
            type: Type.OBJECT,
            properties: {
                races: { type: Type.ARRAY, items: loreEntrySchema },
                creatures: { type: Type.ARRAY, items: loreEntrySchema },
            },
            required: ["races", "creatures"]
        }
    },
    world_power: { // Power & Assets
        prompt: (context: string) => {
            return `Based on the story context provided below, generate:\n1. A list of 2-3 specific powers, spells, or cultivation techniques.\n2. A list of 2-3 significant items, artifacts, or equipment.\n3. A list of 1-2 technological elements (if applicable, otherwise leave empty).\n\n${context}`;
        },
        schema: {
            type: Type.OBJECT,
            properties: {
                powers: { type: Type.ARRAY, items: loreEntrySchema },
                items: { type: Type.ARRAY, items: loreEntrySchema },
                technology: { type: Type.ARRAY, items: loreEntrySchema },
            },
            required: ["powers", "items"]
        }
    },
    world_history: { // History & Culture
        prompt: (context: string) => {
            return `Based on the story context provided below, generate:\n1. A list of 2-3 historical events or timelines that shaped the current world.\n2. A list of 2-3 cultural traditions, festivals, religions, or social norms.\n\n${context}`;
        },
        schema: {
            type: Type.OBJECT,
            properties: {
                history: { type: Type.ARRAY, items: loreEntrySchema },
                cultures: { type: Type.ARRAY, items: loreEntrySchema },
            },
            required: ["history", "cultures"]
        }
    },
    mainPlot: {
        prompt: (context: string) => {
            const storyData = JSON.parse(context) as Partial<StoryEncyclopedia>;
            const existingPlot = storyData.mainPlot?.trim();
            if (existingPlot) {
                return `Based on the story context provided below, enhance and expand the user's existing plot summary into a more compelling version (3-5 sentences), keeping the core ideas intact.\n\nExisting Plot: "${existingPlot}"\n\nFull Context:\n${context}`;
            }
            return `Based on the story context provided below, generate a compelling main plot summary in 3-5 sentences.\n\n${context}`;
        },
        schema: { type: Type.OBJECT, properties: { mainPlot: { type: Type.STRING, description: "A 3-5 sentence summary of the main plot." } }, required: ["mainPlot"] }
    },
    character: {
        prompt: (context: string, options: { index: number }) => {
            const storyData = JSON.parse(context) as StoryEncyclopedia;
            const characterData = storyData.characters[options.index];
            
            const formatPartialCharacter = (char: Character) => {
                if (!char) return "The user has not provided any details for this character.";
                const details = Object.entries(char)
                    .filter(([key, value]) => key !== 'id' && key !== 'customFields' && value && (!Array.isArray(value) || value.length > 0))
                    .map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`)
                    .join('\n');

                return details ? `The user has provided these starting details for the character:\n${details}\n\nYour task is to COMPLETE the rest of the profile, elaborating on the provided details and filling in any missing fields to create a cohesive and compelling character.` : `The user has not provided any specific details for this new character. Generate a full profile from scratch that fits the story.`;
            };
            
            const partialDataString = formatPartialCharacter(characterData);

            return `Based on the full story context provided below, generate a compelling and unique character profile.\n\n${partialDataString}\n\nEnsure ALL fields are filled out in your response: name, roles, age, gender, physicalDescription, voiceAndSpeechStyle, personalityTraits, habits, goal, principles, and conflict.\n\nFull Story Context:\n${context}`;
        },
        schema: characterSchema
    },
    relationships: {
        prompt: (context: string, characterJSON: string) => `Based on the character profiles in the context below, generate a list of 3-5 interesting and potentially conflict-driving relationships between them. For each relationship, you MUST use the character IDs provided in the JSON blob of characters. DO NOT use their names. \n\nStory Context:\n${context}\n\nCharacter Data (use these IDs):\n${characterJSON}`,
        schema: {
            type: Type.OBJECT,
            properties: {
                relationships: {
                    type: Type.ARRAY,
                    items: relationshipSchema
                }
            },
            required: ["relationships"]
        }
    },
    worldBuilding: {
        prompt: (context: string) => {
            const storyData = JSON.parse(context) as Partial<StoryEncyclopedia>;
            const existingData = storyData.worldBuilding?.trim();
            if (existingData) {
                return `Based on the story context provided below, enhance and expand the user's existing world-building details into 2-3 rich sentences.\n\nExisting Details: "${existingData}"\n\nFull Context:\n${context}`;
            }
            return `Based on the story context provided below, describe the key world-building details in 2-3 sentences. This is for genres like Fantasy, Sci-Fi, etc.\n\n${context}`;
        },
        schema: { type: Type.OBJECT, properties: { worldBuilding: { type: Type.STRING, description: "Key aspects of the world building."} }, required: ["worldBuilding"] }
    },
    magicSystem: {
        prompt: (context: string) => {
            const storyData = JSON.parse(context) as Partial<StoryEncyclopedia>;
            const existingData = storyData.magicSystem?.trim();
            if (existingData) {
                return `Based on the story context provided below, enhance and expand the user's existing magic/power system details into 2-3 rich sentences.\n\nExisting System: "${existingData}"\n\nFull Context:\n${context}`;
            }
            return `Based on the story context provided below, describe the magic or power system in 2-3 sentences. This is for genres like System, Fantasy, Wuxia, etc.\n\n${context}`;
        },
        schema: { type: Type.OBJECT, properties: { magicSystem: { type: Type.STRING, description: "Description of the rules of magic or the 'System'." } }, required: ["magicSystem"] }
    },
    singleArcAct: {
        prompt: (context: string, index: number, total: number) => {
             const storyData = JSON.parse(context) as StoryEncyclopedia;
             const actData = storyData.storyArc[index];
             const existingTitle = actData.title.trim();
             const existingDesc = actData.description.trim();
             const existingPoints = actData.plotPoints?.length > 0;
             const range = actData.startChapter && actData.endChapter ? `covering chapters ${actData.startChapter} to ${actData.endChapter}` : '';
             
             const templateId = actData.structureTemplate;
             const templateConfig = STRUCTURE_TEMPLATES.find(t => t.value === templateId);
             const templateInstruction = templateConfig && templateId !== 'freestyle' 
                ? `\n**CRITICAL STRUCTURE INSTRUCTION:** You MUST structure this act according to the "${templateConfig.label}" template. ${templateConfig.promptInstruction}`
                : '';

             let instruction = `Based on the story context provided below, generate details for Act ${index + 1} of a ${total}-act story structure${range ? `, ${range}` : ''}.${templateInstruction}\n`;
             
             if (existingTitle || existingDesc || existingPoints) {
                 instruction += `The user has provided the following: \n`;
                 if(existingTitle) instruction += `- Title: ${existingTitle}\n`;
                 if(existingDesc) instruction += `- Description: ${existingDesc}\n`;
                 if(existingPoints) instruction += `- Plot Points: ${actData.plotPoints.map(p => p.summary).join(', ')}\n`;
                 instruction += `Your task is to COMPLETE this act. Fill in any missing fields (title, description, 2-3 plot points) and enhance the existing details to be more compelling.`;
             } else {
                 instruction += `Generate a title, a 1-2 sentence description, and 2-3 key plot points for this act.`;
             }
             instruction += `\n\nFull Context:\n${context}`;
             return instruction;
        },
        schema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                plotPoints: { type: Type.ARRAY, items: plotPointSchema }
            },
            required: ["title", "description", "plotPoints"]
        }
    },
    arc: {
        prompt: (context: string) => {
            const storyData = JSON.parse(context) as StoryEncyclopedia;
            const existingActs = storyData.storyArc?.filter(a => a.title || a.description).length > 0;
            const templateList = STRUCTURE_TEMPLATES.map(t => `- ${t.value} (${t.label}): ${t.description}`).join('\n');
            const totalChapters = parseInt(storyData.totalChapters || '100', 10) || 100;
            const format = storyData.format || 'webnovel';
            const isWebnovel = format === 'webnovel';

            const targetPlotPoints = isWebnovel 
                ? "Act 1: 3-5 pts, Act 2: 8-12 pts, Act 3: 5-8 pts, Act 4: 2-4 pts"
                : "Act 1: 3-5 pts, Act 2: 6-10 pts, Act 3: 4-6 pts";

            if (existingActs) {
                return `Based on the following story context: \n\n${context}\n\nThe user has already started outlining the story arc. Your task is to COMPLETE the 4-act structure. For each act, if it's already started, enhance it. If it's empty, generate a title, a 1-2 sentence description, and key plot points that logically follow the previous act and build towards the main plot's conclusion.`;
            }

            return `
            **SMART ARCHITECT MODE: FULL GENERATION**
            
            Based on the following story context, generate a complete 4-Act Story Arc.
            
            **STORY CONTEXT:**
            ${context}
            
            **AVAILABLE STRUCTURE TEMPLATES:**
            ${templateList}
            
            **CRITICAL ARCHITECTURE INSTRUCTIONS:**
            
            1. **PACING & ASYMMETRY PROTOCOL:**
               You must strictly adhere to the following distribution of plot points density. Do NOT make them equal.
               **TARGET DENSITY:** ${targetPlotPoints}
            
            2. **TEMPLATE DIVERSITY:**
               - Act 1 Template: Choose a template suitable for setups (e.g., 'heros_journey' or 'freestyle').
               - Act 2 Template: MUST be different (e.g., 'kishotenketsu' for twists, or 'fichtean' for crises).
               - Act 3 Template: Choose a template for climaxes (e.g., 'seven_point' or 'save_the_cat').
               - Explicitly assign these values to \`structureTemplate\`.
            
            3. **FORMAT SPECIFICS (${format.toUpperCase()}):**
               ${isWebnovel ? '- WEBNOVEL: Act 2 is the main body. It requires the most plot points. End acts with cliffhangers.' : '- NOVEL: Focus on character arcs and thematic depth.'}
            
            4. **CHAPTER ESTIMATION:**
               - Total Chapters: approx ${totalChapters}.
               - Distribute chapters: Act 1 (~15%), Act 2 (~50%), Act 3 (~25%), Act 4 (~10%).
               - Fill \`startChapter\` and \`endChapter\` accordingly (as strings).
            
            Return a JSON object with a "storyArc" array containing 4 Act objects.
            `;
        },
        schema: {
            type: Type.OBJECT,
            properties: {
                storyArc: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            plotPoints: { type: Type.ARRAY, items: plotPointSchema },
                            startChapter: { type: Type.STRING, description: "Estimated start chapter number (as string)" },
                            endChapter: { type: Type.STRING, description: "Estimated end chapter number (as string)" },
                            structureTemplate: { type: Type.STRING, description: "The value key of the selected template (e.g., 'heros_journey')" }
                        },
                        required: ["title", "description", "plotPoints", "startChapter", "endChapter", "structureTemplate"]
                    }
                }
            },
            required: ["storyArc"]
        }
    },
    tone: {
        prompt: (context: string, language: 'en' | 'id') => {
            const styles = language === 'id' ? PROSE_STYLES_ID : PROSE_STYLES_EN;
            const styleOptions = styles.map(s => `- "${s.value}"`).join('\n');
            return `Based on the following story context: \n\n${context}\n\nSuggest the tone and style. Provide a comedy, romance, and action level from 1-10. If the context contains mature genres, also suggest a maturity level from 1-10, otherwise default maturity to "1". For the 'proseStyle' field, you MUST select ONE of the following options. Return the value exactly as it appears in the list.\n\nValid Prose Styles:\n${styleOptions}`;
        },
        schema: {
            type: Type.OBJECT,
            properties: {
                comedyLevel: { type: Type.STRING, description: "A number from 1 to 10." },
                romanceLevel: { type: Type.STRING, description: "A number from 1 to 10." },
                actionLevel: { type: Type.STRING, description: "A number from 1 to 10." },
                maturityLevel: { type: Type.STRING, description: "A number from 1 to 10." },
                proseStyle: { type: Type.STRING, description: "The most fitting prose style." },
            },
            required: ["comedyLevel", "romanceLevel", "actionLevel", "maturityLevel", "proseStyle"]
        }
    },
    styleExample: {
        prompt: (style: string, language: 'en' | 'id') => {
            const langInstruction = language === 'id' ? 'Tulis paragraf dalam Bahasa Indonesia.' : 'Write the paragraph in English.';
            return `Generate a short, illustrative paragraph (about 3-4 sentences) that perfectly demonstrates the following prose style for a webnovel: "${style}". The paragraph should be about a generic fantasy or urban fantasy scene. ${langInstruction}`;
        },
        schema: {
            type: Type.OBJECT,
            properties: {
                example: { type: Type.STRING, description: "The generated example paragraph." },
            },
            required: ["example"]
        }
    },
    // --- STYLE DNA EXTRACTOR ---
    analyzeStyle: {
        prompt: (context: string, sampleText: string) => {
            return `
            **STYLE DNA ANALYZER**
            
            Analyze the following text sample provided by the user. This text serves as the "Style Reference" for a webnovel.
            
            **TEXT SAMPLE:**
            "${sampleText}"
            
            **TASK:**
            Extract the "Style DNA" or "Voice Profile" of this author. Focus on:
            1. **Sentence Structure:** (e.g., Short/punchy vs Long/flowery, Staccato vs Lyrical).
            2. **Vocabulary Level:** (e.g., Simple/modern vs Archaic/complex, Technical vs Casual).
            3. **Tone & Atmosphere:** (e.g., Cynical, Whimsical, Dark, Hype-focused).
            4. **Specific Quirks:** (e.g., Uses lots of onomatopoeia, ignores dialogue tags, emphasizes internal monologue).
            
            **OUTPUT:**
            Return a concise but descriptive paragraph (3-5 sentences) that acts as a direct instruction to a Ghostwriter AI on how to mimic this exact style.
            Start with: "MIMIC THIS STYLE:"
            `;
        },
        schema: {
            type: Type.OBJECT,
            properties: {
                styleProfile: { type: Type.STRING, description: "The extracted style instructions (Style DNA)." },
            },
            required: ["styleProfile"]
        }
    }
};

const handleJsonResponse = async (responsePromise: Promise<any>, section: string) => {
    try {
        const response = await responsePromise;
        let jsonString = response.text ? response.text.trim() : '';
        
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonString = jsonMatch[0];
        } else {
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (jsonString.startsWith('```')) {
                 jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
        }

        const generatedData = JSON.parse(jsonString);

        const addIdsToLore = (loreArray?: any[]) => {
            if (!loreArray) return [];
            return loreArray.map((item: any) => ({ ...item, id: crypto.randomUUID() }));
        };

        if (section.startsWith('character')) {
            if (!generatedData.customFields) generatedData.customFields = [];
            return generatedData as Character;
        }

        if (section.startsWith('relationships') && generatedData.relationships) {
            generatedData.relationships = generatedData.relationships.map((r: any) => ({ ...r, id: crypto.randomUUID() }));
        }

        if (section.startsWith('singleArcAct')) {
            generatedData.plotPoints = (generatedData.plotPoints || []).map((p: any) => ({ ...p, id: crypto.randomUUID() }));
        }

        if (section.startsWith('arc') && generatedData.storyArc) {
            generatedData.storyArc = generatedData.storyArc.map((act: any) => ({
                ...act,
                plotPoints: (act.plotPoints || []).map((p: any) => ({ ...p, id: crypto.randomUUID() }))
            }));
        }

        if (section === 'core' && generatedData) {
            if (generatedData.characters && Array.isArray(generatedData.characters)) {
                generatedData.characters.forEach((char: Partial<Character>) => {
                    if (!char.customFields) char.customFields = [];
                    if (!char.id) char.id = crypto.randomUUID();
                });
            }
            generatedData.locations = addIdsToLore(generatedData.locations);
            generatedData.factions = addIdsToLore(generatedData.factions);
            generatedData.lore = addIdsToLore(generatedData.lore);
        }
        
        if (section === 'worldLore' || section === 'world_nature' || section === 'world_power' || section === 'world_history') {
             if(generatedData.locations) generatedData.locations = addIdsToLore(generatedData.locations);
             if(generatedData.factions) generatedData.factions = addIdsToLore(generatedData.factions);
             if(generatedData.lore) generatedData.lore = addIdsToLore(generatedData.lore);
             
             if(generatedData.races) generatedData.races = addIdsToLore(generatedData.races);
             if(generatedData.creatures) generatedData.creatures = addIdsToLore(generatedData.creatures);
             
             if(generatedData.powers) generatedData.powers = addIdsToLore(generatedData.powers);
             if(generatedData.items) generatedData.items = addIdsToLore(generatedData.items);
             if(generatedData.technology) generatedData.technology = addIdsToLore(generatedData.technology);
             
             if(generatedData.history) generatedData.history = addIdsToLore(generatedData.history);
             if(generatedData.cultures) generatedData.cultures = addIdsToLore(generatedData.cultures);
        }
        
        if (section === 'analyzeChapter') {
             if (generatedData.newCharacters) {
                generatedData.newCharacters.forEach((char: Partial<Character>) => {
                    if (!char.customFields) char.customFields = [];
                    if (!char.id) char.id = crypto.randomUUID();
                });
             }
             if (generatedData.newLocations) generatedData.newLocations = addIdsToLore(generatedData.newLocations);
             if (!generatedData.newPlotPoints) generatedData.newPlotPoints = [];
        }

        return generatedData;
    } catch (error) {
        console.error(`Error processing AI response for section ${section}:`, error);
        const errorMessage = error instanceof Error 
            ? `The AI returned an invalid response. ${error.message}` 
            : "The AI returned a response that was not valid JSON. Please try again.";
        throw new Error(errorMessage);
    }
};


export const generateStoryEncyclopediaSection = async (
    apiKey: string,
    section: string,
    storyEncyclopedia: Partial<StoryEncyclopedia | Universe>,
    language: 'en' | 'id',
    options?: { idea?: string; index?: number; style?: string },
): Promise<any> => {
    const ai = initializeGenAI(apiKey);
    const configKey = Object.keys(generationConfig).find(key => section.startsWith(key)) || '';
    const config = generationConfig[configKey];
    if (!config) throw new Error(`Invalid section for generation: ${section}`);

    const langInstruction = language === 'id' 
        ? 'Generate the entire JSON response strictly in Bahasa Indonesia.' 
        : 'Generate the entire JSON response strictly in English.';
    
    const context = JSON.stringify(storyEncyclopedia, null, 2);
    let prompt = '';

    if (section === 'basic') {
        if (!options?.idea) throw new Error("An initial idea is required to generate basic info.");
        prompt = config.prompt(context, { idea: options.idea });
    } else if (section.startsWith('singleArcAct')) {
        const actIndex = options?.index ?? 0;
        const totalActs = (storyEncyclopedia as StoryEncyclopedia).storyArc?.length || 4;
        prompt = config.prompt(context, actIndex, totalActs);
    } else if (section === 'tone') {
        prompt = config.prompt(context, language);
    } else if (section === 'relationships') {
        const characterJSON = JSON.stringify((storyEncyclopedia as StoryEncyclopedia).characters?.map(c => ({id: c.id, name: c.name})), null, 2);
        prompt = config.prompt(context, characterJSON);
    } else if (section === 'styleExample') {
        if (!options?.style) throw new Error("A style is required to generate an example.");
        prompt = config.prompt(options.style, language);
    } else if (section.startsWith('character')) {
        prompt = config.prompt(context, { index: options?.index ?? 0 });
    } else if (section === 'analyzeStyle') {
        // For style analysis, we pass the sample text as options.style or assume it's in context (less reliable)
        // Better to pass it explicitly
        const sampleText = options?.style || (storyEncyclopedia as StoryEncyclopedia).customProseStyleByExample || '';
        prompt = config.prompt(context, sampleText);
    }
    else {
        prompt = config.prompt(context);
    }

    const finalPrompt = `${langInstruction}\n\n${prompt}`;

    const responsePromise = generateWithRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: finalPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: config.schema,
            safetySettings: SAFETY_SETTINGS, 
        }
    }));

    return handleJsonResponse(responsePromise, section);
};


// --- NEW: AI Tools for Editor & Analysis ---

export const generateEditorAction = async (
    apiKey: string,
    action: 'rewrite' | 'expand' | 'fixGrammar' | 'beatToProse' | 'continue' | 'autoFormat',
    text: string,
    context: { precedingText: string; followingText: string; storyContext: StoryEncyclopedia }
): Promise<string> => {
    const ai = initializeGenAI(apiKey);
    const language = context.storyContext.language;
    const langInstruction = language === 'id' ? 'Response must be in Bahasa Indonesia.' : 'Response must be in English.';
    
    const contextString = formatStoryEncyclopediaForPrompt(context.storyContext);
    
    let prompt = '';
    
    if (action === 'continue') {
        prompt = `
        ${contextString}
        
        --- CURRENT WRITING CONTEXT ---
        The user is currently writing a chapter. 
        Preceding Text (What comes before):
        "${context.precedingText.slice(-2000)}"

        TASK: Continue writing the story from the exact point where the text ends. 
        - Mimic the existing style, tone, and narrative perspective (POV).
        - Do not repeat the last sentence.
        - Write about 200-400 words.
        ${langInstruction}
        `;
    } else {
        let instruction = '';
        switch(action) {
            case 'rewrite': instruction = 'Rewrite the selected text to improve flow, vocabulary, and impact while keeping the original meaning.'; break;
            case 'fixGrammar': instruction = 'Fix all grammar, spelling, and punctuation errors in the selected text. Do not change the style.'; break;
            case 'expand': instruction = 'Expand the selected text with more sensory details, internal monologue, and descriptive language. Make it more immersive.'; break;
            case 'beatToProse': instruction = 'Convert the selected bullet points or rough outline into full, high-quality novel prose. Add dialogue and action.'; break;
            case 'autoFormat': instruction = `
                Analyze the selected text.
                Identify any phrases or sentences that are in a foreign language relative to the story's main language (${language === 'id' ? 'Indonesian' : 'English'}).
                Wrap only these foreign phrases in markdown italics (*...*).
                Leave names, proper nouns, and the main language text untouched.
                Return the full text with the formatting applied.
            `; break;
        }

        prompt = `
        ${contextString}
        
        --- EDITING TASK ---
        Selected Text:
        "${text}"
        
        Context (Preceding): "...${context.precedingText.slice(-500)}"
        Context (Following): "${context.followingText.slice(0, 500)}..."
        
        INSTRUCTION: ${instruction}
        ${langInstruction}
        Return ONLY the result text.
        `;
    }

    const response = await generateWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            safetySettings: SAFETY_SETTINGS, 
        }
    }));

    return response.text?.trim() || '';
};

export const analyzeChapterContent = async (
    apiKey: string,
    chapterText: string,
    storyEncyclopedia: StoryEncyclopedia
): Promise<AnalysisResult> => {
    const ai = initializeGenAI(apiKey);
    const language = storyEncyclopedia.language;
    const langInstruction = language === 'id' ? 'Response must be in Bahasa Indonesia.' : 'Response must be in English.';

    const existingCharacters = storyEncyclopedia.characters.map(c => c.name).join(', ');
    const existingLocations = storyEncyclopedia.locations.map(l => l.name).join(', ');
    
    const prompt = `
    Analyze the following chapter text for a webnovel and extract NEW elements that should be added to the Story Encyclopedia.
    
    EXISTING CHARACTERS: ${existingCharacters}
    EXISTING LOCATIONS: ${existingLocations}
    
    CHAPTER TEXT:
    "${chapterText}"
    
    TASK:
    1. Identify NEW important characters introduced in this chapter (ignore minor unnamed ones).
    2. Identify NEW important locations visited.
    3. Summarize 3-5 key plot points that happened in this chapter.
    4. Provide a brief 1-sentence summary of the whole chapter.
    
    IMPORTANT: Do not include characters or locations that are already listed in the "EXISTING" lists above.
    
    ${langInstruction}
    `;

    const responsePromise = generateWithRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            safetySettings: SAFETY_SETTINGS, 
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    newCharacters: { type: Type.ARRAY, items: characterSchema },
                    newLocations: { type: Type.ARRAY, items: loreEntrySchema },
                    newPlotPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    summary: { type: Type.STRING }
                },
                required: ['newCharacters', 'newLocations', 'newPlotPoints', 'summary']
            }
        }
    }));

    return handleJsonResponse(responsePromise, 'analyzeChapter');
};
