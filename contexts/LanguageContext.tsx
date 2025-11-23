import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { UILanguage, Translations, LanguageContextType } from '../types';

// Hardcoded translations to bypass module resolution issues.
const enTranslations: Translations = {
  "app": { "title": "Webnovel AI Studio" },
  "common": { "name": "Name", "description": "Description...", "summary": "Summary...", "generating": "Generating...", "generateWithAi": "Generate with AI", "confirm": "Confirm", "cancel": "Cancel", "failed": "Failed", "language": "Language", "save": "Save" },
  "apiKeyModal": { "title": "Enter Your Google AI API Key", "instruction": "To use this application, you need to provide your own Google AI API key. Your key is stored securely in your browser and is never sent to our servers.", "getApiKey": "Get your API key from Google AI Studio", "placeholder": "Enter your API key here", "saveButton": "Save and Start Writing" },
  "dashboard": { "title": "Your Dashboard", "subtitle": "Select a project or manage your universes.", "universeHub": "Universe Hub", "universeHubTooltip": "Manage your writing universes", "startNewStory": "Start New Story", "storyLibrary": "Story Library", "emptyLibraryTitle": "Your library is empty", "emptyLibrarySubtitle": "Time to write your first chapter!", "importStory": "Import Story from File", "importStoryTooltip": "Import story from .md file", "noGenres": "No genres", "noPlot": "No main plot defined.", "openStudio": "Open Studio", "editStory": "Edit Encyclopedia", "exportStory": "Export Story", "deleteStory": "Delete Story", "deleteStoryConfirm": "Are you sure you want to permanently delete \"{{title}}\"?", "exportNotFound": "Story not found for export.", "importErrorFormat": "Invalid format: Could not find story encyclopedia data.", "importSuccess": "Story \"{{title}}\" imported successfully!", "importError": "Import failed", "changeApiKey": "Change API Key" },
  "universeHub": { "title": "Universe Hub", "subtitle": "Manage your reusable worlds and settings.", "backToDashboard": "Back to Dashboard", "createNew": "Create New Universe", "emptyTitle": "Your cosmos is awaiting creation", "emptySubtitle": "Create your first universe to reuse across multiple stories.", "import": "Import Universe from File", "importTooltip": "Import universe from .json file", "noDescription": "No description provided.", "edit": "Edit Universe", "export": "Export Universe", "delete": "Delete Universe", "deleteConfirm": "Are you sure you want to permanently delete the universe \"{{name}}\"? This cannot be undone.", "exportNotFound": "Universe not found for export.", "importErrorFormat": "Invalid universe file format.", "importSuccess": "Universe \"{{name}}\" imported successfully!", "importError": "Import failed" },
  "universeSetup": { "titleEdit": "Edit Universe", "titleCreate": "Create New Universe", "subtitleEdit": "Refine the details of your world.", "subtitleCreate": "Build a reusable world for your stories.", "coreDetails": "Core Details", "name": "Universe Name", "namePlaceholder": "e.g., The Ashen Empires", "descriptionPlaceholder": "A brief, one-sentence summary of this universe.", "worldAndLore": "World & Lore", "worldBuildingSummary": "World Building (Summary)", "magicSystemSummary": "System/Magic Rules (Summary)", "locations": "Locations", "factions": "Factions", "generalLore": "General Lore", "removeEntry": "Remove {{listTitle}} Entry", "addEntry": "Add {{listTitle}} Entry", "nameRequired": "Universe name is required.", "saveButton": "Save Universe", "createButton": "Create Universe" },
  "setup": { 
    "titleEdit": "Edit Story Encyclopedia", 
    "titleCreate": "Create a New Story", 
    "subtitleEdit": "Refine the details of your world.", 
    "subtitleCreate": "Start with a core idea, then let AI help you build the world.", 
    "clearSection": "Clear this section", 
    "submitDisabledTooltip": "Please fill out all sections", 
    "submitButtonEdit": "Save Changes", 
    "submitButtonCreate": "Create Story", 
    "autoBuild": {
      "button": "Auto-Architect Story",
      "buttonDesc": "One-click generation of the entire story bible.",
      "confirm": "This will overwrite empty fields and build a full story structure based on your idea. Continue?",
      "modalTitle": "Constructing Your Story",
      "stepBasic": "Drafting Core Concepts...",
      "stepCore": "Creating Characters & Plot...",
      "stepWorld": "Building the World...",
      "stepRelations": "Weaving Relationships...",
      "stepArc": "Outlining the Story Arc...",
      "stepTone": "Calibrating Tone & Style...",
      "complete": "Construction Complete!"
    },
    "spark": { "title": "The Spark of Creation", "ideaLabel": "Write your core idea here (1-3 sentences)", "genreLabel": "Choose your genres", "otherGenrePlaceholder": "Other" }, 
    "tabs": { "basic": "Basic Info", "world": "World & Lore", "characters": "Characters & Relationships", "arc": "Story Arc", "tone": "Tone & Style" }, 
    "basic": { "title": "Title", "setting": "Setting", "settingPlaceholder": "e.g., Jakarta, 2045 or The Kingdom of Aethelgard", "totalChapters": "Total Chapters", "wordsPerChapter": "Words Per Chapter" }, 
    "world": { "worldBuilding": "World Building", "magicSystem": "System/Magic" }, 
    "lore": { "locations": "Locations", "factions": "Factions", "general": "General Lore", "addEntry": "Add {{title}} Entry", "removeEntry": "Remove {{title}} Entry" }, 
    "characters": { "mainPlot": "Main Plot", "characters": "Characters", "relationships": "Relationships", "add": "Add Character", "addRelationship": "Add Relationship", "generateRelationships": "Generate Relationships", "relationshipsNeed2": "Need min. 2 characters", "character1": "Character 1", "character2": "Character 2", "relationshipType": "Relationship Type", "newCharacter": "New Character", "generateThis": "Generate This Character", "delete": "Delete Character", "name": "Name", "roles": "Roles", "rolesPlaceholder": "Add a role (e.g., Rival) and press Enter", "age": "Age", "gender": "Gender", "physical": "Physical Description", "voice": "Voice & Speech Style", "voicePlaceholder": "e.g., A calm baritone voice; speaks slowly.", "personality": "Personality Traits", "habits": "Habits/Quirks", "goal": "Goal/Motivation", "principles": "Principles/Values", "conflict": "Core Conflict", "customDetails": "Custom Details", "customLabelPlaceholder": "Label (e.g., Magic Power)", "removeDetail": "Remove Detail", "addCustomDetail": "Add Custom Detail" }, 
    "arc": { "act": "Act", "actTitlePlaceholder": "Act Title", "actDescPlaceholder": "Act description...", "generateAct": "Generate Act {{index}}", "plotPoints": "Plot Points", "addPoint": "Add Point", "addAct": "Add Act" }, 
    "tone": { 
      "comedy": "Comedy (1-10)", "comedyDesc": "Controls frequency of jokes.", 
      "romance": "Romance (1-10)", "romanceDesc": "Determines focus on relationships.", 
      "action": "Action (1-10)", "actionDesc": "Dictates amount of combat.", 
      "maturity": "Maturity (1-10)", "maturityDesc": "Controls adult themes.", 
      "pov": "Narrative Perspective (POV)", "povDesc": "Controls whose eyes the story is told through.",
      "prose": "Prose Style", "showExample": "Show Example", "customStyleTitle": "Custom Prose Style by Example", "customStylePlaceholder": "Paste a text sample (up to {{maxChars}} characters, ~1000 words) here...", "customStyleOverride": "Note: Providing a sample will override the dropdown selection above." 
    }, 
    "universe": { "modalTitle": "Select a Universe for Your Story", "blankCanvas": "Blank Canvas", "blankCanvasDesc": "Build your world from scratch.", "realWorld": "Real World", "realWorldDesc": "Use the real world as a baseline.", "disguiseNames": "Disguise names", "fromLibrary": "From Library", "fromLibraryDesc": "Choose a world you already saved.", "noDataToSave": "No world data to save.", "enterNamePrompt": "Enter a name for this Universe:", "defaultDescription": "Universe for the story: {{title}}", "saveSuccess": "Universe \"{{name}}\" saved!", "saveToLibrary": "Save to Universe Library" } 
  },
  "studio": { "deleteLastError": "Cannot delete the last chapter. Every story must have at least one chapter.", "deleteConfirm": "Are you sure you want to permanently delete the chapter \"{{title}}\"? This action cannot be undone.", "noChapterSelected": "Select a chapter to start writing or add a new one.", "mobile": { "openEncyclopedia": "Open Encyclopedia", "closeEncyclopedia": "Close Encyclopedia", "openChat": "Open AI Chat", "closeChat": "Close AI Chat" }, "zenMode": { "toggleSidebar": "Toggle Sidebar", "toggleChat": "Toggle Chat" } },
  "sidebar": { "backToDashboard": "Back to Dashboard", "dashboard": "Dashboard", "exportStory": "Export Story (.md)", "editEncyclopedia": "Edit Encyclopedia", "universe": "Universe", "chapters": { "title": "Chapters", "delete": "Delete Chapter", "add": "Add New Chapter" }, "basicInfo": "Basic Info", "genre": "Genre", "setting": "Setting", "corePlot": "Core Plot", "mainPlot": "Main Plot", "storyArc": "Story Arc", "characters": "Characters", "relationships": "Relationships", "worldAndLore": { "title": "World & Lore", "worldSummary": "World Summary", "magicSummary": "System/Magic Summary" }, "tone": { "title": "Tone (out of 10)", "comedy": "Comedy", "romance": "Romance", "action": "Action", "maturity": "Maturity", "pov": "POV" }, "proseStyle": { "title": "Prose Style", "style": "Style", "custom": "Custom Style", "customActive": "Active (Sample Provided)" }, "character": { "roles": "Roles", "age": "Age", "gender": "Gender", "physical": "Physical Description", "voice": "Voice & Speech Style", "traits": "Personality", "habits": "Habits", "goal": "Goal", "principles": "Principles", "conflict": "Conflict" } },
  "chapterEditor": { 
    "statusEditing": "Editing...", "statusSaved": "Saved", "wordCount": "Word Count",
    "magicTools": "Magic Tools", "tools": "AI Tools", "rewrite": "Rewrite", "expand": "Expand", "fixGrammar": "Fix Grammar", "beatToProse": "Beat to Prose", "continue": "Continue Writing", "analyze": "Analyze Chapter", "analyzing": "Analyzing...", "selectTextHint": "Select text to use Magic Tools" 
  },
  "analysis": {
    "title": "Chapter Analysis Results",
    "subtitle": "The AI found new elements in this chapter. Select what you want to add to the Encyclopedia.",
    "newCharacters": "New Characters Found",
    "newLocations": "New Locations Found",
    "newPlotPoints": "New Plot Points",
    "targetAct": "Add Plot Points to Act:",
    "noData": "No new significant data found.",
    "addToEncyclopedia": "Add Selected to Encyclopedia",
    "discard": "Discard All",
    "selectToContinue": "Please select items to save.",
    "success": "Encyclopedia updated successfully!"
  },
  "chat": { "errorMessage": "Sorry, I encountered an error. Please try again.", "thinkingMode": "Thinking Mode", "thinkingModeTooltip": "Enable for more complex and creative tasks using the Pro model.", "placeholder": "Let's build your story..." }
};

const idTranslations: Translations = {
  "app": { "title": "Studio AI Webnovel" },
  "common": { "name": "Nama", "description": "Deskripsi...", "summary": "Ringkasan...", "generating": "Menghasilkan...", "generateWithAi": "Buat dengan AI", "confirm": "Konfirmasi", "cancel": "Batal", "failed": "Gagal", "language": "Bahasa", "save": "Simpan" },
  "apiKeyModal": { "title": "Masukkan Kunci API Google AI Anda", "instruction": "Untuk menggunakan aplikasi ini, Anda perlu menyediakan kunci API Google AI Anda sendiri. Kunci Anda disimpan dengan aman di browser Anda dan tidak pernah dikirim ke server kami.", "getApiKey": "Dapatkan kunci API Anda dari Google AI Studio", "placeholder": "Masukkan kunci API Anda di sini", "saveButton": "Simpan dan Mulai Menulis" },
  "dashboard": { "title": "Dasbor Anda", "subtitle": "Pilih sebuah proyek atau kelola semesta Anda.", "universeHub": "Pusat Semesta", "universeHubTooltip": "Kelola semesta tulisan Anda", "startNewStory": "Mulai Cerita Baru", "storyLibrary": "Perpustakaan Cerita", "emptyLibraryTitle": "Perpustakaan Anda kosong", "emptyLibrarySubtitle": "Saatnya menulis bab pertama Anda!", "importStory": "Impor Cerita dari File", "importStoryTooltip": "Impor cerita dari file .md", "noGenres": "Tanpa genre", "noPlot": "Tidak ada plot utama yang ditentukan.", "openStudio": "Buka Studio", "editStory": "Edit Ensiklopedia", "exportStory": "Ekspor Cerita", "deleteStory": "Hapus Cerita", "deleteStoryConfirm": "Anda yakin ingin menghapus \"{{title}}\" secara permanen?", "exportNotFound": "Cerita tidak ditemukan untuk diekspor.", "importErrorFormat": "Format tidak valid: Tidak dapat menemukan data ensiklopedia cerita.", "importSuccess": "Cerita \"{{title}}\" berhasil diimpor!", "importError": "Impor gagal", "changeApiKey": "Ganti Kunci API" },
  "universeHub": { "title": "Pusat Semesta", "subtitle": "Kelola dunia dan latar yang dapat digunakan kembali.", "backToDashboard": "Kembali ke Dasbor", "createNew": "Buat Semesta Baru", "emptyTitle": "Kosmos Anda menanti ciptaan", "emptySubtitle": "Buat semesta pertama Anda untuk digunakan kembali di berbagai cerita.", "import": "Impor Semesta dari File", "importTooltip": "Impor semesta dari file .json", "noDescription": "Tidak ada deskripsi yang diberikan.", "edit": "Edit Semesta", "export": "Ekspor Semesta", "delete": "Hapus Semesta", "deleteConfirm": "Anda yakin ingin menghapus semesta \"{{name}}\" secara permanen? Tindakan ini tidak dapat diurungkan.", "exportNotFound": "Semesta tidak ditemukan untuk diekspor.", "importErrorFormat": "Format file semesta tidak valid.", "importSuccess": "Semesta \"{{name}}\" berhasil diimpor!", "importError": "Impor gagal" },
  "universeSetup": { "titleEdit": "Edit Semesta", "titleCreate": "Buat Semesta Baru", "subtitleEdit": "Sempurnakan detail dunia Anda.", "subtitleCreate": "Bangun dunia yang dapat digunakan kembali untuk cerita Anda.", "coreDetails": "Detail Inti", "name": "Nama Semesta", "namePlaceholder": "contoh: Kekaisaran Kelabu", "descriptionPlaceholder": "Ringkasan singkat satu kalimat tentang semesta ini.", "worldAndLore": "Dunia & Lore", "worldBuildingSummary": "Pembangunan Dunia (Ringkasan)", "magicSystemSummary": "Aturan Sistem/Sihir (Ringkasan)", "locations": "Lokasi", "factions": "Faksi", "generalLore": "Lore Umum", "removeEntry": "Hapus Entri {{listTitle}}", "addEntry": "Tambah Entri {{listTitle}}", "nameRequired": "Nama semesta harus diisi.", "saveButton": "Simpan Semesta", "createButton": "Buat Semesta" },
  "setup": { 
    "titleEdit": "Edit Ensiklopedia Cerita", 
    "titleCreate": "Buat Cerita Baru", 
    "subtitleEdit": "Sempurnakan detail dunia Anda.", 
    "subtitleCreate": "Mulai dengan ide inti, lalu biarkan AI membantu Anda membangun dunia.", 
    "clearSection": "Bersihkan bagian ini", 
    "submitDisabledTooltip": "Harap isi semua bagian", 
    "submitButtonEdit": "Simpan Perubahan", 
    "submitButtonCreate": "Buat Cerita", 
    "autoBuild": {
      "button": "Auto-Arsitek Cerita",
      "buttonDesc": "Hasilkan seluruh ensiklopedia cerita dengan satu klik.",
      "confirm": "Ini akan menimpa bidang yang kosong dan membangun struktur cerita lengkap berdasarkan ide Anda. Lanjutkan?",
      "modalTitle": "Membangun Cerita Anda",
      "stepBasic": "Menyusun Konsep Inti...",
      "stepCore": "Membuat Karakter & Plot...",
      "stepWorld": "Membangun Dunia...",
      "stepRelations": "Menenun Hubungan...",
      "stepArc": "Menguraikan Alur Cerita...",
      "stepTone": "Mengkalibrasi Nada & Gaya...",
      "complete": "Konstruksi Selesai!"
    },
    "spark": { "title": "Percikan Kreasi", "ideaLabel": "Tuliskan ide dasarmu di sini (1-3 kalimat)", "genreLabel": "Pilih genre-mu", "otherGenrePlaceholder": "Lainnya" }, 
    "tabs": { "basic": "Info Dasar", "world": "Dunia & Lore", "characters": "Karakter & Hubungan", "arc": "Alur Cerita", "tone": "Nada & Gaya" }, 
    "basic": { "title": "Judul", "setting": "Latar", "settingPlaceholder": "e.g., Jakarta, 2045 atau Kerajaan Aethelgard", "totalChapters": "Total Bab", "wordsPerChapter": "Kata per Bab" }, 
    "world": { "worldBuilding": "Pembangunan Dunia", "magicSystem": "Sistem/Sihir" }, 
    "lore": { "locations": "Lokasi", "factions": "Faksi", "general": "Lore Umum", "addEntry": "Tambah Entri {{title}}", "removeEntry": "Hapus Entri {{title}}" }, 
    "characters": { "mainPlot": "Plot Utama", "characters": "Karakter", "relationships": "Hubungan", "add": "Tambah Karakter", "addRelationship": "Tambah Hubungan", "generateRelationships": "Buat Hubungan", "relationshipsNeed2": "Perlu min. 2 karakter", "character1": "Karakter 1", "character2": "Karakter 2", "relationshipType": "Jenis Hubungan", "newCharacter": "Karakter Baru", "generateThis": "Buat Karakter Ini", "delete": "Hapus Karakter", "name": "Nama", "roles": "Peran", "rolesPlaceholder": "Tambah peran (e.g., Rival) lalu tekan Enter", "age": "Usia", "gender": "Gender", "physical": "Deskripsi Fisik", "voice": "Suara & Gaya Bicara", "voicePlaceholder": "contoh: Suara bariton yang tenang; bicara perlahan.", "personality": "Sifat Kepribadian", "habits": "Kebiasaan/Kekhasan", "goal": "Tujuan/Motivasi", "principles": "Prinsip/Nilai", "conflict": "Konflik Inti", "customDetails": "Detail Tambahan", "customLabelPlaceholder": "Label (e.g., Kekuatan Sihir)", "removeDetail": "Hapus Detail", "addCustomDetail": "Tambah Detail Tambahan" }, 
    "arc": { "act": "Babak", "actTitlePlaceholder": "Judul Babak", "actDescPlaceholder": "Deskripsi babak...", "generateAct": "Buat Babak {{index}}", "plotPoints": "Poin Plot", "addPoint": "Tambah Poin", "addAct": "Tambah Babak" }, 
    "tone": { 
      "comedy": "Komedi (1-10)", "comedyDesc": "Mengontrol frekuensi lelucon.", 
      "romance": "Romansa (1-10)", "romanceDesc": "Menentukan fokus pada hubungan.", 
      "action": "Aksi (1-10)", "actionDesc": "Menentukan jumlah pertempuran.", 
      "maturity": "Dewasa (1-10)", "maturityDesc": "Mengontrol tema dewasa.", 
      "pov": "Sudut Pandang (POV)", "povDesc": "Mengontrol dari mata siapa cerita dikisahkan.",
      "prose": "Gaya Prosa", "showExample": "Lihat Contoh", "customStyleTitle": "Gaya Prosa Kustom dengan Contoh", "customStylePlaceholder": "Tempel contoh teks (hingga {{maxChars}} karakter, ~1000 kata) di sini...", "customStyleOverride": "Catatan: Memberikan contoh akan mengesampingkan pilihan di atas." 
    }, 
    "universe": { "modalTitle": "Pilih Semesta untuk Cerita Anda", "blankCanvas": "Kanvas Kosong", "blankCanvasDesc": "Bangun dunia Anda dari awal.", "realWorld": "Dunia Nyata", "realWorldDesc": "Gunakan dunia nyata sebagai dasar.", "disguiseNames": "Samarkan nama", "fromLibrary": "Dari Pustaka", "fromLibraryDesc": "Pilih dunia yang sudah Anda simpan.", "noDataToSave": "Tidak ada data dunia untuk disimpan.", "enterNamePrompt": "Masukkan nama untuk Semesta ini:", "defaultDescription": "Semesta untuk cerita: {{title}}", "saveSuccess": "Semesta \"{{name}}\" berhasil disimpan!", "saveToLibrary": "Simpan ke Pustaka Semesta" } 
  },
  "studio": { "deleteLastError": "Tidak dapat menghapus bab terakhir. Setiap cerita harus memiliki setidaknya satu bab.", "deleteConfirm": "Anda yakin ingin menghapus bab \"{{title}}\" secara permanen? Tindakan ini tidak dapat diurungkan.", "noChapterSelected": "Pilih bab untuk mulai menulis atau tambahkan bab baru.", "mobile": { "openEncyclopedia": "Buka Ensiklopedia", "closeEncyclopedia": "Tutup Ensiklopedia", "openChat": "Buka Obrolan AI", "closeChat": "Tutup Obrolan AI" }, "zenMode": { "toggleSidebar": "Buka/Tutup Sidebar", "toggleChat": "Buka/Tutup Chat" } },
  "sidebar": { "backToDashboard": "Kembali ke Dasbor", "dashboard": "Dasbor", "exportStory": "Ekspor Cerita (.md)", "editEncyclopedia": "Edit Ensiklopedia", "universe": "Semesta", "chapters": { "title": "Bab", "delete": "Hapus Bab", "add": "Tambah Bab Baru" }, "basicInfo": "Info Dasar", "genre": "Genre", "setting": "Latar", "corePlot": "Plot Inti", "mainPlot": "Plot Utama", "storyArc": "Alur Cerita", "characters": "Karakter", "relationships": "Hubungan", "worldAndLore": { "title": "Dunia & Lore", "worldSummary": "Ringkasan Dunia", "magicSummary": "Ringkasan Sistem/Sihir" }, "tone": { "title": "Nada (dari 10)", "comedy": "Komedi", "romance": "Romansa", "action": "Aksi", "maturity": "Dewasa", "pov": "Sudut Pandang (POV)" }, "proseStyle": { "title": "Gaya Prosa", "style": "Gaya", "custom": "Gaya Kustom", "customActive": "Aktif (Contoh Disediakan)" }, "character": { "roles": "Peran", "age": "Usia", "gender": "Gender", "physical": "Deskripsi Fisik", "voice": "Suara & Gaya Bicara", "traits": "Sifat", "habits": "Kebiasaan", "goal": "Tujuan", "principles": "Prinsip", "conflict": "Konflik" } },
  "chapterEditor": { 
    "statusEditing": "Menyunting...", "statusSaved": "Tersimpan", "wordCount": "Jumlah Kata",
    "magicTools": "Alat Ajaib", "tools": "Alat AI", "rewrite": "Tulis Ulang", "expand": "Perluas", "fixGrammar": "Perbaiki Tata Bahasa", "beatToProse": "Poin ke Prosa", "continue": "Lanjut Menulis", "analyze": "Analisa Bab", "analyzing": "Menganalisa...", "selectTextHint": "Pilih teks untuk menggunakan Alat Ajaib" 
  },
  "analysis": {
    "title": "Hasil Analisa Bab",
    "subtitle": "AI menemukan elemen baru di bab ini. Pilih yang ingin Anda tambahkan ke Ensiklopedia.",
    "newCharacters": "Karakter Baru Ditemukan",
    "newLocations": "Lokasi Baru Ditemukan",
    "newPlotPoints": "Poin Plot Baru",
    "targetAct": "Tambahkan Poin ke Babak:",
    "noData": "Tidak ditemukan data baru yang signifikan.",
    "addToEncyclopedia": "Tambahkan ke Ensiklopedia",
    "discard": "Buang Semua",
    "selectToContinue": "Harap pilih item untuk disimpan.",
    "success": "Ensiklopedia berhasil diperbarui!"
  },
  "chat": { "errorMessage": "Maaf, terjadi kesalahan. Silakan coba lagi.", "thinkingMode": "Mode Berpikir", "thinkingModeTooltip": "Aktifkan untuk tugas yang lebih kompleks dan kreatif menggunakan model Pro.", "placeholder": "Ayo bangun ceritamu..." }
};

const translations: Record<UILanguage, Translations> = { en: enTranslations, id: idTranslations };
const LANGUAGE_STORAGE_KEY = 'uiLanguage';

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uiLang, setUiLangState] = useState<UILanguage>(() => {
    try {
      const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      return (storedLang === 'id' || storedLang === 'en') ? storedLang : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, uiLang);
    } catch (error) {
      console.error("Could not save UI language to localStorage", error);
    }
  }, [uiLang]);
  
  const setUiLang = (lang: UILanguage) => {
      setUiLangState(lang);
  };

  const t = useCallback((key: string, options?: { [key: string]: string | number }): string => {
    const keys = key.split('.');
    let result: any = translations[uiLang];
    
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Fallback to English if translation is missing
        result = translations['en'];
        for (const fk of keys) {
            result = result?.[fk];
        }
        if (result === undefined) return key; // Return key if not found in English either
      }
    }

    if (typeof result === 'string' && options) {
      return Object.entries(options).reduce((acc, [optKey, optValue]) => {
        return acc.replace(`{{${optKey}}}`, String(optValue));
      }, result);
    }

    return result || key;
  }, [uiLang]);

  return (
    <LanguageContext.Provider value={{ uiLang, setUiLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};