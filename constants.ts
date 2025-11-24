
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

export const GENRES_EN = [
    { value: 'Action', label: 'Action', description: 'Focuses on physical challenges, fights, and chases.' },
    { value: 'Adventure', label: 'Adventure', description: 'Journeys to new worlds or locations; exploration focused.' },
    { value: 'Comedy', label: 'Comedy', description: 'Humorous tone, funny situations, and witty dialogue.' },
    { value: 'Drama', label: 'Drama', description: 'Serious stories focusing on realistic characters and emotional conflict.' },
    { value: 'Fantasy', label: 'Fantasy', description: 'Magic, supernatural elements, and imaginary worlds.' },
    { value: 'Harem', label: 'Harem', description: 'Protagonist attracts multiple love interests.' },
    { value: 'Historical', label: 'Historical', description: 'Set in a real-world past era (e.g., Victorian, Feudal Japan).' },
    { value: 'Horror', label: 'Horror', description: 'Intended to scare, unsettle, or horrify the reader.' },
    { value: 'Mature', label: 'Mature', description: 'Contains adult themes, violence, or sexual content.' },
    { value: 'Mystery', label: 'Mystery', description: 'Focuses on solving a crime, puzzle, or secret.' },
    { value: 'Psychological', label: 'Psychological', description: 'Emphasizes the inner life and mental states of characters; mind games.' },
    { value: 'Romance', label: 'Romance', description: 'Focuses on romantic love and relationships.' },
    { value: 'School Life', label: 'School Life', description: 'Set in a school environment; focuses on student life and youth.' },
    { value: 'Sci-Fi', label: 'Sci-Fi', description: 'Futuristic science, technology, space exploration, or aliens.' },
    { value: 'Slice of Life', label: 'Slice of Life', description: 'Realistic representation of everyday life experiences.' },
    { value: 'Supernatural', label: 'Supernatural', description: 'Modern setting with ghosts, vampires, or other paranormal elements.' },
    { value: 'System', label: 'System', description: 'Protagonist uses a game-like interface/status screen in real life.' },
    { value: 'Thriller', label: 'Thriller', description: 'Fast-paced, high stakes, anxiety-inducing suspense.' },
    { value: 'Transmigration', label: 'Transmigration', description: 'Protagonist travels to another world or body (Isekai).' },
    { value: 'Urban', label: 'Urban', description: 'Set in a modern city environment.' },
    { value: 'Wuxia', label: 'Wuxia', description: 'Martial heroes, chivalry, and low-fantasy martial arts.' },
    { value: 'Xianxia', label: 'Xianxia', description: 'Immortal heroes, cultivation, Daoism, and high fantasy.' }
];

export const GENRES_ID = [
    { value: 'Aksi', label: 'Aksi', description: 'Berfokus pada tantangan fisik, pertarungan, dan kejar-kejaran.' },
    { value: 'Dewasa', label: 'Dewasa', description: 'Mengandung tema dewasa, kekerasan, atau konten seksual.' },
    { value: 'Drama', label: 'Drama', description: 'Cerita serius yang berfokus pada karakter realistis dan konflik emosional.' },
    { value: 'Fantasi', label: 'Fantasi', description: 'Sihir, elemen supranatural, dan dunia imajiner.' },
    { value: 'Fiksi Ilmiah', label: 'Fiksi Ilmiah', description: 'Sains futuristik, teknologi, penjelajahan luar angkasa.' },
    { value: 'Harem', label: 'Harem', description: 'Protagonis menarik banyak minat cinta.' },
    { value: 'Horor', label: 'Horor', description: 'Bertujuan untuk menakut-nakuti atau membuat pembaca merasa ngeri.' },
    { value: 'Kehidupan Sekolah', label: 'Kehidupan Sekolah', description: 'Berlatar di lingkungan sekolah; fokus pada kehidupan siswa.' },
    { value: 'Komedi', label: 'Komedi', description: 'Nada humor, situasi lucu, dan dialog jenaka.' },
    { value: 'Misteri', label: 'Misteri', description: 'Berfokus pada pemecahan kejahatan, teka-teki, atau rahasia.' },
    { value: 'Perkotaan', label: 'Perkotaan', description: 'Berlatar di lingkungan kota modern.' },
    { value: 'Petualangan', label: 'Petualangan', description: 'Perjalanan ke dunia atau lokasi baru; fokus pada eksplorasi.' },
    { value: 'Psikologis', label: 'Psikologis', description: 'Menekankan kehidupan batin dan kondisi mental karakter; permainan pikiran.' },
    { value: 'Romansa', label: 'Romansa', description: 'Berfokus pada cinta romantis dan hubungan.' },
    { value: 'Sejarah', label: 'Sejarah', description: 'Berlatar di era masa lalu dunia nyata (misal: Majapahit, Victorian).' },
    { value: 'Sistem', label: 'Sistem', description: 'Protagonis menggunakan antarmuka/layar status seperti game di dunia nyata.' },
    { value: 'Slice of Life', label: 'Slice of Life', description: 'Gambaran realistis pengalaman kehidupan sehari-hari yang santai.' },
    { value: 'Supranatural', label: 'Supranatural', description: 'Latar modern dengan hantu, vampir, atau elemen paranormal lainnya.' },
    { value: 'Thriller', label: 'Thriller', description: 'Alur cepat, taruhan tinggi, ketegangan yang memicu kecemasan.' },
    { value: 'Transmigrasi', label: 'Transmigrasi', description: 'Protagonis berpindah ke dunia atau tubuh lain (Isekai).' },
    { value: 'Wuxia', label: 'Wuxia', description: 'Pahlawan bela diri, ksatria, dan seni bela diri fantasi rendah.' },
    { value: 'Xianxia', label: 'Xianxia', description: 'Pahlawan abadi, kultivasi, Taoisme, dan fantasi tinggi.' }
];

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
