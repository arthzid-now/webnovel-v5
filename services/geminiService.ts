import { GoogleGenAI, Chat, Type, GenerateContentResponse, Content } from "@google/genai";
import { ModelType, StoryEncyclopedia, StoryArcAct, Character, Relationship, CustomField, LoreEntry, Universe, AnalysisResult, Message, MessageAuthor, Persona } from '../types.ts';
import { SYSTEM_INSTRUCTION_EN, SYSTEM_INSTRUCTION_ID, MAX_THINKING_BUDGET, PROSE_STYLES_EN, PROSE_STYLES_ID, STRUCTURE_TEMPLATES, DEFAULT_PERSONAS } from '../constants.ts';
import { auth } from '../firebase'; // Import Auth for Token

// --- SAFETY SETTINGS (JAILBREAK / CREATIVE FREEDOM) ---
const SAFETY_SETTINGS: any[] = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' }
];

// --- TIER MANAGEMENT ---
// Check if user is premium via API key OR manual premium flag
const isPremiumUser = (apiKey: string | null): boolean => {
    // Premium if they have their own API key
    if (apiKey !== null && apiKey.trim().length > 0) {
        return true;
    }

    // Premium if manually flagged by admin (checked separately in components)
    // This check happens at component level where we have access to user data
    return false;
};

// Helper to check premium status including manual flag
export const checkPremiumStatus = (apiKey: string | null, userIsPremium?: boolean): boolean => {
    return isPremiumUser(apiKey) || (userIsPremium === true);
};

export const selectModel = (
    useCase: 'basic' | 'analysis' | 'autoArchitect',
    apiKey: string | null,
    userIsPremium?: boolean // Add Firestore premium flag
): string => {
    // Premium if: has API key OR manually upgraded by admin
    const isPremium = (apiKey !== null && apiKey.trim().length > 0) || (userIsPremium === true);

    switch (useCase) {
        case 'basic':
            // Both tiers use Gemini 2.5 Flash
            return ModelType.FLASH_2_5;

        case 'analysis':
            // Premium gets Gemini 3 Pro, Free gets Gemini 2.5 Flash
            return isPremium ? ModelType.PRO_3 : ModelType.FLASH_2_5;

        case 'autoArchitect':
            // Auto Architect locked for free tier
            if (!isPremium) {
                throw new Error('AUTO_ARCHITECT_PREMIUM_ONLY');
            }
            return ModelType.PRO_3; // Gemini 3 Pro for complex reasoning

        default:
            return ModelType.FLASH_2_5;
    }
};

// --- HYBRID CLIENT (PROXY + DIRECT) ---
const PROXY_URL = "https://us-central1-inkvora-v1.cloudfunctions.net/generateContentProxy";

class ProxyGenAI {
    constructor() { }

    getGenerativeModel(config: { model: string, systemInstruction?: string }) {
        return {
            generateContent: async (params: { contents: Content[], generationConfig?: any }) => {
                const user = auth.currentUser;
                if (!user) throw new Error("User must be logged in to use Free Tier.");

                const token = await user.getIdToken();
                const prompt = params.contents[0].parts[0].text; // Simplified for now

                const response = await fetch(PROXY_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        model: config.model,
                        systemInstruction: config.systemInstruction,
                        prompt: prompt,
                        generationConfig: params.generationConfig // Send full config including schema
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    if (response.status === 429 || errorData.code === 'QUOTA_EXCEEDED') {
                        throw new Error("QUOTA_EXCEEDED: Daily limit reached. Please upgrade or add your own API Key.");
                    }
                    throw new Error(errorData.error || `Proxy Error: ${response.statusText}`);
                }

                const data = await response.json();
                // Return response object directly (not wrapped)
                return {
                    get text() { return data.text; },
                    candidates: data.candidates || []
                };
            }
        };
    }
}

const initializeGenAI = (apiKey: string | null) => {
    if (apiKey) {
        return new GoogleGenAI({ apiKey });
    } else {
        // Use Proxy if no key provided
        // We return a mock object that matches the GoogleGenAI interface enough for our usage
        return {
            getGenerativeModel: (config: any) => new ProxyGenAI().getGenerativeModel(config),
            chats: {
                create: (config: any) => {
                    // Chat via proxy is tricky because of history. 
                    // For now, we might need to handle chat differently or send full history to proxy.
                    // Let's implement a basic wrapper for chat that just calls generateContent with history appended.
                    return {
                        sendMessage: async (msg: string) => {
                            console.warn("Chat via Proxy is simplified.");
                            const model = new ProxyGenAI().getGenerativeModel({ model: config.model, systemInstruction: config.config?.systemInstruction });

                            const historyText = config.history.map((h: any) => `${h.role}: ${h.parts[0].text}`).join('\n');
                            const fullPrompt = `${historyText}\nuser: ${msg}`;

                            const result = await model.generateContent({
                                contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                                generationConfig: config.config
                            });
                            return result;
                        },
                        sendMessageStream: async (msg: string) => {
                            console.warn("Chat via Proxy is simplified (no real streaming).");
                            const model = new ProxyGenAI().getGenerativeModel({ model: config.model, systemInstruction: config.config?.systemInstruction });

                            const historyText = config.history.map((h: any) => `${h.role}: ${h.parts[0].text}`).join('\n');
                            const fullPrompt = `${historyText}\nuser: ${msg}`;

                            const result = await model.generateContent({
                                contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                                generationConfig: config.config
                            });

                            // Mock a stream response
                            return {
                                stream: (async function* () {
                                    yield {
                                        text: () => result.text,
                                        candidates: result.candidates
                                    };
                                })()
                            };
                        }
                    }
                }
            },
            models: {
                generateContent: async (params: any) => {
                    const model = new ProxyGenAI().getGenerativeModel({
                        model: params.model,
                        systemInstruction: params.config?.systemInstruction
                    });
                    return model.generateContent({ contents: [{ role: 'user', parts: [{ text: params.contents }] }], generationConfig: params.config });
                }
            }
        } as unknown as GoogleGenAI;
    }
}

// --- ERROR HANDLING UTILITY ---
export const getFriendlyErrorMessage = (error: any): string => {
    const msg = (error.message || error.toString()).toLowerCase();

    if (msg.includes('quota_exceeded') || msg.includes('daily limit')) {
        return "🛑 Kuota Harian Habis. Masukkan API Key sendiri di Settings untuk lanjut (Gratis & Unlimited).";
    }
    if (msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota')) {
        return "🚧 API Quota Exceeded (429). Kunci API Anda mencapai batas harian atau per menit. Tunggu sebentar.";
    }
    if (msg.includes('503') || msg.includes('overloaded') || msg.includes('unavailable')) {
        return "🔥 AI Server Overloaded (503). Server Google lagi sibuk banget. Coba lagi dalam 1 menit.";
    }
    if (msg.includes('safety') || msg.includes('blocked') || msg.includes('harm_category')) {
        return "🛡️ Content Blocked by Safety Filters. AI menolak merespon karena konten dianggap terlalu eksplisit/berbahaya (NSFW/Gore). Coba haluskan prompt Anda.";
    }
    if (msg.includes('recitation') || msg.includes('copyright')) {
        return "©️ Content Blocked (Copyright). AI menolak karena potensi pelanggaran hak cipta.";
    }
    if (msg.includes('api key') || msg.includes('403')) {
        return "🔑 Invalid API Key. Cek kembali API Key Anda.";
    }

    return `🤖 AI Error: ${error.message || "Unknown error occurred."}`;
};

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

        throw error;
    }
};

// Helper to check for safety blocks in response
const validateResponse = (response: any) => {
    if (!response || !response.candidates || response.candidates.length === 0) {
        if (response.promptFeedback?.blockReason) {
            throw new Error(`Request Blocked: ${response.promptFeedback.blockReason}. The AI refused the prompt.`);
        }
        // If absolutely nothing comes back, it's often a silent safety block in newer models
        return;
    }

    const candidate = response.candidates[0];
    // Check finish reason specifically
    if (candidate.finishReason === 'SAFETY') {
        throw new Error("SAFETY_BLOCK: The AI found your request or the story context too explicit/unsafe.");
    }
    if (candidate.finishReason === 'RECITATION') {
        throw new Error("RECITATION_BLOCK: Copyright infringement detected.");
    }

    // If no text but also no specific error, warn but don't crash (could be function call, though we don't use them yet)
    if (!candidate.content?.parts?.[0]?.text && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
        // console.warn(`Generation Stopped: ${candidate.finishReason}`);
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
    const entries = lore.map(item => `- ${item.date ? `[${item.date}] ` : ''}${item.name}: ${item.description}`).join('\n');
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
    ${formatInstruction}

    ${storyEncyclopedia.aiMemory ? `\n**AI MEMORY / SCRATCHPAD (PREVIOUS CONTEXT):**\n${storyEncyclopedia.aiMemory}\n` : ''}
--- END OF CONTEXT ---

Based on this context, assist the user in developing their story.
- When asked to draft a chapter, you MUST adhere to the **Narrative Perspective (POV)**: "${storyEncyclopedia.narrativePerspective}". Do not switch POVs unless explicitly instructed.
- Try to adhere to the target words per chapter and **mimic the style and continue the events from the most recent chapters provided.**
- When asked about plot progression, consider the total number of chapters planned.
`;
}

export const createChatSession = (
    apiKey: string | null,
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
    const model = isThinkingMode ? ModelType.PRO_3 : ModelType.FLASH_2_5;

    const config: any = {
        systemInstruction: dynamicSystemInstruction,
        safetySettings: SAFETY_SETTINGS,
    };

    if (model === ModelType.PRO_3 && isThinkingMode) {
        config.thinkingConfig = { thinkingBudget: 4096 };
    }

    // Filter out internal messages
    const history: Content[] = previousHistory
        .filter(msg => msg.id !== 'initial-ai-message' && !msg.id.startsWith('ai-placeholder') && !msg.id.startsWith('ai-error'))
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

export const summarizeChatSession = async (
    apiKey: string | null,
    messages: Message[],
    currentMemory: string
): Promise<string> => {
    const ai = initializeGenAI(apiKey);

    const conversationText = messages
        .filter(m => m.author === MessageAuthor.USER || m.author === MessageAuthor.AI)
        .map(m => `${m.author.toUpperCase()}: ${m.text}`)
        .join('\n');

    const prompt = `
    You are an AI assistant analyzing your own conversation history.
    
    Current Memory/Notes:
    "${currentMemory || 'No previous notes.'}"
    
    Recent Conversation:
    ${conversationText}
    
    Task:
    Update your internal memory/scratchpad. 
    1. Summarize the key points discussed in the recent conversation.
    2. Note any specific user preferences, plot ideas, or decisions made.
    3. Discard trivial chit-chat.
    4. Merge this with the "Current Memory" to create a single, concise reference note for yourself.
    
    Output ONLY the updated memory text. Keep it concise (under 300 words).
    `;

    return generateWithRetry(async () => {
        const response = await ai.models.generateContent({
            model: ModelType.FLASH_2_5,
            contents: prompt,
            config: {
                safetySettings: SAFETY_SETTINGS
            }
        });

        validateResponse(response);
        return response.text || currentMemory;
    });
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
        birthDate: { type: Type.STRING, description: "Format: 'DD Month' (e.g. '15 August'). Choose a date/Zodiac that matches their personality." },
        bloodType: { type: Type.STRING, description: "A, B, AB, or O. Choose based on Japanese Blood Type Personality Theory (e.g. A=Serious, B=Creative/Wild, O=Social/Leader, AB=Eccentric)." },
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
        date: { type: Type.STRING, description: "Optional: For history items, specific year or era (e.g. '1500 AE' or 'Year 2050')." },
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
    worldLore: {
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
    world_nature: {
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
    world_power: {
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
    world_history: {
        prompt: (context: string) => {
            return `Based on the story context provided below, generate:\n1. A list of 3-5 historical events or timelines that shaped the current world. IMPORTANT: You MUST include a 'date' or 'era' for each historical event (e.g. 'Year 500', 'Age of Fire', '2000 BC').\n2. A list of 2-3 cultural traditions, festivals, religions, or social norms.\n\n${context}`;
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
        schema: { type: Type.OBJECT, properties: { worldBuilding: { type: Type.STRING, description: "Key aspects of the world building." } }, required: ["worldBuilding"] }
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
                if (existingTitle) instruction += `- Title: ${existingTitle}\n`;
                if (existingDesc) instruction += `- Description: ${existingDesc}\n`;
                if (existingPoints) instruction += `- Plot Points: ${actData.plotPoints.map(p => p.summary).join(', ')}\n`;
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
            const totalChapters = parseInt(storyData.totalChapters || '100', 10) || 100;
            const format = storyData.format || 'webnovel';
            const isWebnovel = format === 'webnovel';

            if (existingActs) {
                return `Based on the following story context: \n\n${context}\n\nThe user has already started outlining the story arc. Your task is to COMPLETE the 4-act structure. For each act, if it's already started, enhance it. If it's empty, generate a title, a 1-2 sentence description, and key plot points that logically follow the previous act and build towards the main plot's conclusion.`;
            }

            return `Based on the story context provided below, generate a detailed 4-act story arc (Kishōtenketsu or Standard 4-Act).
            - Act 1: Introduction & Inciting Incident (Approx 15% of story)
            - Act 2: Rising Action & Complications (Approx 35% of story)
            - Act 3: Twist/Midpoint & Deepening Crisis (Approx 35% of story)
            - Act 4: Climax & Resolution (Approx 15% of story)
            
            Total Chapters: ${totalChapters}.
            Format: ${isWebnovel ? 'Webnovel (Episodic, Fast Paced)' : 'Traditional Novel'}.
            
            For each act, provide a Title, a Description, a Start/End Chapter range, and 3-5 Key Plot Points.
            \n\n${context}`;
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
                            startChapter: { type: Type.STRING },
                            endChapter: { type: Type.STRING },
                            plotPoints: { type: Type.ARRAY, items: plotPointSchema }
                        },
                        required: ["title", "description", "plotPoints"]
                    }
                }
            },
            required: ["storyArc"]
        }
    },
    tone: {
        prompt: (context: string) => {
            return `Based on the story context provided below, analyze and suggest the best tone and style settings. 
            - Recommend levels (1-10) for Comedy, Romance, Action, and Maturity based on the genre and plot.
            - Choose the best Narrative Perspective (e.g. "Third Person Limited") and Prose Style (e.g. "Fast-paced").
            - EXTRACT A STYLE DNA: Analyze the genres and plot to create a "Style Profile" instruction. This should be a paragraph instructing the AI on how to write prose for this specific story (e.g. "Use short, punchy sentences. Focus on sensory details of smell and sound. Dialogue should be witty.").
            \n\n${context}`;
        },
        schema: {
            type: Type.OBJECT,
            properties: {
                comedyLevel: { type: Type.STRING },
                romanceLevel: { type: Type.STRING },
                actionLevel: { type: Type.STRING },
                maturityLevel: { type: Type.STRING },
                narrativePerspective: { type: Type.STRING },
                proseStyle: { type: Type.STRING },
                styleProfile: { type: Type.STRING, description: "A prompt instruction paragraph defining the specific voice and writing style." }
            },
            required: ["comedyLevel", "romanceLevel", "actionLevel", "maturityLevel", "narrativePerspective", "proseStyle", "styleProfile"]
        }
    },
    styleExample: {
        prompt: (context: string, options: { style: string }) => {
            return `Generate a 100-word writing sample that perfectly demonstrates the following prose style: "${options.style}". Do not explain the style, just write a scene segment demonstrating it.`;
        },
        schema: { type: Type.OBJECT, properties: { example: { type: Type.STRING } }, required: ["example"] }
    },
    analyzeStyle: {
        prompt: (context: string, options: { style: string }) => {
            return `Analyze the following writing sample provided by the user. Deconstruct its "Style DNA".
            Identify:
            1. Sentence structure (length, complexity, rhythm).
            2. Vocabulary (simple, archaic, flowery, technical).
            3. Tone (humorous, dark, detached, intimate).
            4. Dialogue style (realistic, stylized, monologue-heavy).
            5. Sensory focus (visual, kinesthetic, internal monologue).
            
            Output a concise but comprehensive instruction paragraph (100-150 words) that can be fed into an AI to REPLICATE this exact style.
            \n\nSAMPLE:\n"${options.style}"`;
        },
        schema: { type: Type.OBJECT, properties: { styleProfile: { type: Type.STRING } }, required: ["styleProfile"] }
    }
};

// --- MAIN GENERATION FUNCTIONS ---

export const generateStoryEncyclopediaSection = async (
    apiKey: string | null,
    section: string,
    currentContext: any,
    language: 'en' | 'id',
    options: any = {},
    userIsPremium?: boolean // Add premium flag parameter
): Promise<any> => {
    const ai = initializeGenAI(apiKey);

    // Determine use case based on section
    let useCase: 'basic' | 'analysis' | 'autoArchitect' = 'basic';
    if (section === 'arc') {
        useCase = 'autoArchitect'; // Arc generation is part of Auto Architect
    } else if (['analyzeStyle', 'tone'].includes(section)) {
        useCase = 'analysis';
    }

    // Select model based on tier (may throw if premium-only)
    let selectedModel: string;
    try {
        selectedModel = selectModel(useCase, apiKey, userIsPremium);
    } catch (error: any) {
        if (error.message === 'AUTO_ARCHITECT_PREMIUM_ONLY') {
            throw new Error('⭐ Auto Architect requires a Premium account or API key. Upgrade to unlock this feature!');
        }
        throw error;
    }

    const config = generationConfig[section];
    if (!config) throw new Error(`Invalid generation section: ${section}`);

    const contextString = JSON.stringify(currentContext, null, 2);
    const prompt = config.prompt(contextString, options);

    const systemInstruction = language === 'id' ?
        "Anda adalah asisten penulis kreatif ahli. Tugas Anda adalah menghasilkan struktur JSON yang valid untuk ensiklopedia cerita berdasarkan permintaan pengguna. JANGAN gunakan markdown di luar string JSON. Hanya kembalikan JSON mentah." :
        "You are an expert creative writing assistant. Your task is to generate valid JSON structures for story encyclopedias based on user requests. DO NOT use markdown outside of the JSON string. Return raw JSON only.";

    return generateWithRetry(async () => {
        const response = await ai.models.generateContent({
            model: selectedModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: config.schema,
                systemInstruction: systemInstruction,
                safetySettings: SAFETY_SETTINGS,
            }
        });

        validateResponse(response);

        if (!response.text) throw new Error(`No response generated. Candidates: ${JSON.stringify(response.candidates)}`);
        return JSON.parse(response.text);
    });
};

export const generateEditorAction = async (
    apiKey: string | null,
    action: 'rewrite' | 'expand' | 'fixGrammar' | 'beatToProse' | 'continue' | 'autoFormat',
    selectedText: string,
    context: { precedingText: string; followingText: string; storyContext: StoryEncyclopedia }
): Promise<string> => {
    const ai = initializeGenAI(apiKey);
    const isId = context.storyContext.language === 'id';

    let prompt = '';
    const styleContext = context.storyContext.styleProfile ? `\nSTYLE DNA TO MIMIC:\n${context.storyContext.styleProfile}` : '';

    switch (action) {
        case 'rewrite':
            prompt = `STRICT INSTRUCTION: Rewrite the text below to improve flow, vocabulary, and impact. Keep the original meaning. Output ONLY the rewritten text. Do NOT add any conversational filler like "Here is the rewrite".\n${styleContext}\n\nTEXT:\n"${selectedText}"`;
            break;
        case 'expand':
            prompt = `STRICT INSTRUCTION: Expand the text below into a more detailed scene. Add sensory details, internal monologue, or dialogue. Output ONLY the expanded text. Do NOT add any conversational filler.\n${styleContext}\n\nTEXT:\n"${selectedText}"`;
            break;
        case 'fixGrammar':
            prompt = `STRICT INSTRUCTION: Fix grammar, spelling, and punctuation. Do not change the style or meaning. Output ONLY the fixed text. Do NOT add any conversational filler.\n\nTEXT:\n"${selectedText}"`;
            break;
        case 'beatToProse':
            prompt = `STRICT INSTRUCTION: Convert the plot beats below into full narrative prose. Output ONLY the prose. Do NOT add any conversational filler.\n${styleContext}\n\nBEATS:\n"${selectedText}"`;
            break;
        case 'autoFormat':
            prompt = `STRICT INSTRUCTION: Format the text for a novel (standard punctuation, italics for thoughts). Output ONLY the formatted text. Do NOT add any conversational filler.\n\nTEXT:\n"${selectedText}"`;
            break;
        case 'continue':
            prompt = `STRICT INSTRUCTION: Continue the story from the current point (approx 200-300 words). Adhere strictly to the established style. Output ONLY the story continuation. Do NOT add any conversational filler.\n${styleContext}
            \n\nCONTEXT SO FAR:\n...${context.precedingText.slice(-1000)}
            \n\n(The story continues below...)`;
            break;
    }

    return generateWithRetry(async () => {
        const response = await ai.models.generateContent({
            model: ModelType.PRO_3,
            contents: prompt,
            config: {
                systemInstruction: isId ? SYSTEM_INSTRUCTION_ID + formatStoryEncyclopediaForPrompt(context.storyContext) : SYSTEM_INSTRUCTION_EN + formatStoryEncyclopediaForPrompt(context.storyContext),
                safetySettings: SAFETY_SETTINGS
            }
        });

        validateResponse(response);
        return response.text || '';
    });
};

export const analyzeChapterContent = async (
    apiKey: string,
    content: string,
    storyContext: StoryEncyclopedia,
    language: 'en' | 'id' = 'en'
): Promise<AnalysisResult> => {
    const ai = initializeGenAI(apiKey);

    const prompt = `
    Analyze the following chapter text. Identify any NEW elements that are not currently in the Story Encyclopedia context provided below.
    
    IMPORTANT: The output MUST be in ${language === 'id' ? 'INDONESIAN (Bahasa Indonesia)' : 'ENGLISH'}.
    
    Looking for:
    1. **New Characters**: Important named characters introduced for the first time.
    2. **New Locations**: Significant locations visited.
    3. **New Plot Points**: Key events that happened in this chapter (summarize them).
    
    Story Context (Existing Data):
    - Characters: ${storyContext.characters.map(c => c.name).join(', ')}
    - Locations: ${storyContext.locations.map(l => l.name).join(', ')}
    
    Chapter Text:
    "${content.substring(0, 10000)}..." (Truncated for analysis)
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            newCharacters: { type: Type.ARRAY, items: characterSchema },
            newLocations: { type: Type.ARRAY, items: loreEntrySchema },
            newPlotPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING, description: "A brief analysis summary." }
        },
        required: ["newCharacters", "newLocations", "newPlotPoints", "summary"]
    };

    return generateWithRetry(async () => {
        const response = await ai.models.generateContent({
            model: ModelType.PRO_3,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                safetySettings: SAFETY_SETTINGS
            }
        });

        validateResponse(response);
        if (!response.text) throw new Error("No analysis generated");
        return JSON.parse(response.text);
    });
};
