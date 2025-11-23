import { ModelType } from './types';

export const SYSTEM_INSTRUCTION_EN = `You are a world-class webnovel writing assistant. Your goal is to help the user brainstorm ideas, develop characters, create outlines, write chapter drafts, and refine their story.

Follow these rules:
- You must respond ONLY in English.
- Be creative, encouraging, and helpful.
- Provide detailed and structured responses when asked for outlines or character sheets.
- When drafting prose, adopt the user's requested tone and style.
- If the user asks for something complex, break it down into manageable steps.
- Maintain consistency with the story encyclopedia and previously established plot points.
- You are an assistant, not the author. Your role is to empower the user's creativity.`;

export const SYSTEM_INSTRUCTION_ID = `Anda adalah asisten penulis webnovel kelas dunia. Tujuan Anda adalah membantu pengguna bertukar pikiran, mengembangkan karakter, membuat kerangka, menulis draf bab, dan menyempurnakan cerita mereka.

Ikuti aturan ini:
- Anda harus merespons HANYA dalam Bahasa Indonesia.
- Jadilah kreatif, memberi semangat, dan membantu.
- Berikan tanggapan yang terperinci dan terstruktur saat diminta untuk kerangka atau lembar karakter.
- Saat menyusun prosa, gunakan nada dan gaya yang diminta pengguna.
- Jika pengguna meminta sesuatu yang rumit, pecah menjadi langkah-langkah yang dapat dikelola.
- Jaga konsistensi dengan ensiklopedia cerita dan poin plot yang telah ditetapkan sebelumnya.
- Anda adalah asisten, bukan penulis. Peran Anda adalah memberdayakan kreativitas pengguna.`;


export const MAX_THINKING_BUDGET = 32768;

export const GENRES_EN = ['Harem', 'Transmigration', 'Romance', 'System', 'Fantasy', 'Sci-Fi', 'Action', 'Adventure', 'Comedy', 'Mystery', 'Urban', 'Wuxia', 'Xianxia', 'Mature'];
export const GENRES_ID = ['Harem', 'Transmigrasi', 'Romansa', 'Sistem', 'Fantasi', 'Fiksi Ilmiah', 'Aksi', 'Petualangan', 'Komedi', 'Misteri', 'Perkotaan', 'Wuxia', 'Xianxia', 'Dewasa'];

export const PROSE_STYLES_EN = [
    { value: 'Light and descriptive, with witty dialogue.', description: 'Ideal for stories balancing world-building with character interactions.' },
    { value: 'Fast-paced and punchy, focusing on action.', description: 'Keeps the reader on the edge of their seat. Great for thrillers and action scenes.' },
    { value: 'Deeply introspective and character-focused.', description: 'Explores the inner thoughts and emotions of characters. Best for dramas and psychological stories.' },
    { value: 'Formal and elegant, like a classic novel.', description: 'Uses sophisticated language and a more traditional narrative structure.' },
    { value: 'Informal and conversational, first-person POV.', description: 'Creates a close, personal connection between the reader and the protagonist.' }
];

export const PROSE_STYLES_ID = [
    { value: 'Ringan dan deskriptif, dengan dialog jenaka.', description: 'Ideal untuk cerita yang menyeimbangkan pembangunan dunia dengan interaksi karakter.' },
    { value: 'Cepat dan lugas, berfokus pada aksi.', description: 'Membuat pembaca tegang. Bagus untuk thriller dan adegan aksi.' },
    { value: 'Sangat introspektif dan berfokus pada karakter.', description: 'Mengeksplorasi pikiran dan emosi batin karakter. Terbaik untuk drama dan cerita psikologis.' },
    { value: 'Formal dan elegan, seperti novel klasik.', description: 'Menggunakan bahasa yang canggih dan struktur naratif yang lebih tradisional.' },
    { value: 'Informal dan seperti percakapan, sudut pandang orang pertama.', description: 'Menciptakan hubungan pribadi yang erat antara pembaca dan protagonis.' }
];

export const NARRATIVE_PERSPECTIVES_EN = [
    { value: 'Third Person Limited ("He/She")', description: 'Focuses on the thoughts and perspective of one character at a time. The standard for modern novels.' },
    { value: 'First Person ("I")', description: 'Intimate and immediate. Great for LitRPG, System, and Romance genres.' },
    { value: 'Third Person Omniscient', description: 'The narrator knows everything about all characters. Good for epic fantasy or classic styles.' },
    { value: 'Second Person ("You")', description: 'Unconventional and immersive. "You walk into the room..."' }
];

export const NARRATIVE_PERSPECTIVES_ID = [
    { value: 'Orang Ketiga Terbatas ("Dia")', description: 'Fokus pada pikiran dan perspektif satu karakter dalam satu waktu. Standar novel modern.' },
    { value: 'Orang Pertama ("Aku")', description: 'Intim dan langsung. Bagus untuk genre LitRPG, Sistem, dan Romansa.' },
    { value: 'Orang Ketiga Serba Tahu', description: 'Narator mengetahui segalanya tentang semua karakter. Bagus untuk fantasi epik atau gaya klasik.' },
    { value: 'Orang Kedua ("Kamu")', description: 'Tidak konvensional dan imersif. "Kamu berjalan masuk ke ruangan..."' }
];

export const STORY_FORMATS = [
    { value: 'webnovel', label: 'Webnovel (Long, Episodic)', defaultChapters: '100+', defaultWords: '1500-2000' },
    { value: 'novel', label: 'Traditional Novel (Structured)', defaultChapters: '20-40', defaultWords: '3000-5000' }
];

export const STRUCTURE_TEMPLATES = [
    { 
        value: 'freestyle', 
        label: 'Freestyle (AI Default)', 
        promptInstruction: 'Use your own judgment to structure this act based on the context.' 
    },
    { 
        value: 'heros_journey', 
        label: "The Hero's Journey", 
        description: 'Departure, Initiation, Return.',
        promptInstruction: 'Structure this act following the "Hero\'s Journey" monomyth beats (e.g., Call to Adventure, Crossing the Threshold, Ordeal, Return). Ensure the plot points reflect a transformative journey.'
    },
    { 
        value: 'save_the_cat', 
        label: 'Save The Cat', 
        description: 'Standard Hollywood pacing.',
        promptInstruction: 'Structure this act following the "Save the Cat" beat sheet. Ensure clear pacing with beats like the Catalyst, Break into Two, Midpoint, or All is Lost, depending on where this act falls in the story.'
    },
    { 
        value: 'kishotenketsu', 
        label: 'Kishōtenketsu', 
        description: 'Intro, Development, Twist, Conclusion.',
        promptInstruction: 'Structure this act using the East Asian "Kishōtenketsu" structure: Ki (Introduction), Sho (Development), Ten (Twist/Complication), Ketsu (Conclusion). Focus on the shift/twist rather than direct conflict resolution.'
    },
    { 
        value: 'fichtean', 
        label: 'Fichtean Curve', 
        description: 'Series of crises building up.',
        promptInstruction: 'Structure this act using the Fichtean Curve: Skip the exposition and jump straight into a series of crises that build in intensity towards a local climax.'
    },
    { 
        value: 'seven_point', 
        label: 'Seven Point Structure', 
        description: 'Hook to Resolution.',
        promptInstruction: 'Structure this act following the Seven Point Structure (Hook, Plot Turn 1, Pinch 1, Midpoint, Pinch 2, Plot Turn 2, Resolution).'
    }
];

export const MODELS = {
    [ModelType.FLASH]: {
        id: ModelType.FLASH,
        name: 'Flash',
        description: 'Fast and capable model for a wide range of tasks.',
        supportsThinking: false,
    },
    [ModelType.PRO]: {
        id: ModelType.PRO,
        name: 'Pro',
        description: 'Most capable model for highly complex tasks.',
        supportsThinking: true,
    }
};