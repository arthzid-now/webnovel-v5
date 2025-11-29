
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { UILanguage, Translations, LanguageContextType } from '../types';

// Hardcoded translations to bypass module resolution issues.
const enTranslations: Translations = {
  "app": { "title": "Inkvora" },
  "common": { "name": "Name", "description": "Description...", "summary": "Summary...", "generating": "Generating...", "generateWithAi": "Generate with AI", "confirm": "Confirm", "cancel": "Cancel", "failed": "Failed", "language": "Language", "save": "Save", "close": "Close", "download": "Download" },
  "apiKeyModal": { "title": "Enter Your Google AI API Key", "instruction": "To use this application, you need to provide your own Google AI API key. Your key is stored securely in your browser and is never sent to our servers.", "getApiKey": "Get your API key from Google AI Studio", "placeholder": "Enter your API key here", "saveButton": "Save and Start Writing" },
  "dashboard": { "title": "Your Dashboard", "subtitle": "Select a project or manage your universes.", "universeHub": "Universe Hub", "universeHubTooltip": "Manage your writing universes", "startNew": "Start New Story", "import": "Import Story", "open": "Open", "edit": "Edit", "export": "Export", "delete": "Delete", "storyLibrary": "Story Library", "noStories": "No stories yet", "noStoriesYet": "No Stories Yet", "createFirstStory": "Create your first story to get started.", "emptyLibraryTitle": "Your library is empty", "emptyLibrarySubtitle": "Time to write your first chapter!", "importStory": "Import Story from File", "importStoryTooltip": "Import story from .md file", "noGenres": "No genres", "noPlot": "No main plot defined.", "openStudio": "Open Studio", "editStory": "Edit Encyclopedia", "exportStory": "Export Manager", "deleteStory": "Delete Story", "deleteStoryConfirm": "Are you sure you want to permanently delete \"{{title}}\"?", "exportNotFound": "Story not found for export.", "importErrorFormat": "Invalid format: Could not find story encyclopedia data.", "importSuccess": "Story \"{{title}}\" imported successfully!", "importError": "Import failed", "changeApiKey": "Change API Key", "featuredTitle": "Featured Stories", "featuredSubtitle": "Discover amazing stories created with Inkvora" },
  "universeHub": { "title": "Universe Hub", "subtitle": "Manage your reusable worlds and settings.", "backToDashboard": "Back to Dashboard", "createNew": "Create New Universe", "emptyTitle": "Your cosmos is awaiting creation", "emptySubtitle": "Create your first universe to reuse across multiple stories.", "import": "Import Universe from File", "importTooltip": "Import universe from .json file", "noDescription": "No description provided.", "edit": "Edit Universe", "export": "Export Universe", "delete": "Delete Universe", "deleteConfirm": "Are you sure you want to permanently delete the universe \"{{name}}\"? This cannot be undone.", "exportNotFound": "Universe not found for export.", "importErrorFormat": "Invalid universe file format.", "importSuccess": "Universe \"{{name}}\" imported successfully!", "importError": "Import failed" },
  "universeSetup": { "titleEdit": "Edit Universe", "titleCreate": "Create New Universe", "subtitleEdit": "Refine the details of your world.", "subtitleCreate": "Build a reusable world for your stories.", "coreDetails": "Core Details", "name": "Universe Name", "namePlaceholder": "e.g., The Ashen Empires", "descriptionPlaceholder": "A brief, one-sentence summary of this universe.", "worldAndLore": "World & Lore", "worldBuildingSummary": "World Building (Summary)", "magicSystemSummary": "System/Magic Rules (Summary)", "locations": "Locations", "factions": "Factions", "generalLore": "General Lore", "removeEntry": "Remove {{listTitle}} Entry", "addEntry": "Add {{listTitle}} Entry", "nameRequired": "Universe name is required.", "saveButton": "Save Universe", "createButton": "Create Universe" },
  "world": {
    "subTabs": {
      "geo": "Geography & Politics",
      "nature": "Nature & Biology",
      "power": "Power & Assets",
      "history": "History & Culture"
    }
  },
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
    "spark": {
      "title": "The Spark of Creation",
      "ideaLabel": "Write your core idea here (1-3 sentences)",
      "genreLabel": "Choose your genres",
      "otherGenrePlaceholder": "Or specify your own genre...",
      "untitledStory": "Untitled Story"
    },
    "tabs": {
      "basic": "Basic Info",
      "world": "World & Lore",
      "characters": "Characters & Relationships",
      "arc": "Story Arc",
      "tone": "Tone & Style"
    },
    "basic": {
      "title": "Title",
      "format": "Story Format",
      "formatDesc": "Determines AI pacing and structure.",
      "setting": "Setting",
      "settingPlaceholder": "e.g., Jakarta, 2045 or The Kingdom of Aethelgard",
      "totalChapters": "Total Chapters",
      "wordsPerChapter": "Words Per Chapter"
    },
    "world": {
      "worldBuilding": "World Building (Summary)",
      "magicSystem": "System/Magic (Summary)"
    },
    "lore": {
      "locations": "Locations",
      "factions": "Factions",
      "races": "Races / Species",
      "creatures": "Bestiary / Creatures",
      "powers": "Spells / Skills / Abilities",
      "items": "Items / Artifacts",
      "technology": "Technology",
      "history": "History & Timeline",
      "cultures": "Culture & Traditions",
      "general": "General Lore",
      "addEntry": "Add {{title}} Entry",
      "removeEntry": "Remove {{title}} Entry"
    },
    "characters": { "mainPlot": "Main Plot", "characters": "Characters", "relationships": "Relationships", "add": "Add Character", "addRelationship": "Add Relationship", "generateRelationships": "Generate Relationships", "relationshipsNeed2": "Need min. 2 characters", "character1": "Character 1", "character2": "Character 2", "relationshipType": "Relationship Type", "newCharacter": "New Character", "generateThis": "Generate This Character", "concept": "Character Concept / Idea", "conceptPlaceholder": "e.g. A retired assassin who now runs a flower shop. Grumpy but loves cats.", "delete": "Delete Character", "name": "Name", "roles": "Roles", "rolesPlaceholder": "Add a role (e.g., Rival) and press Enter", "age": "Age", "gender": "Gender", "physical": "Physical Description", "voice": "Voice & Speech Style", "voicePlaceholder": "e.g., A calm baritone voice; speaks slowly.", "personality": "Personality Traits", "habits": "Habits/Quirks", "goal": "Goal/Motivation", "principles": "Principles/Values", "conflict": "Core Conflict", "customDetails": "Custom Details", "customLabelPlaceholder": "Label (e.g., Magic Power)", "removeDetail": "Remove Detail", "addCustomDetail": "Add Custom Detail" },
    "arc": {
      "act": "Act",
      "actTitlePlaceholder": "Act Title",
      "actDescPlaceholder": "Act description...",
      "generateAct": "Generate Act {{index}}",
      "plotPoints": "Plot Points",
      "addPoint": "Add Point",
      "addAct": "Add Act",
      "chapters": "Chapters",
      "start": "Start",
      "end": "End",
      "template": "Structure Template",
      "templateDesc": "Defines the narrative beats for this act."
    },
    "tone": {
      "comedy": "Comedy (1-10)", "comedyDesc": "Controls frequency of jokes.",
      "romance": "Romance (1-10)", "romanceDesc": "Determines focus on relationships.",
      "action": "Action (1-10)", "actionDesc": "Dictates amount of combat.",
      "maturity": "Maturity (1-10)", "maturityDesc": "Controls adult themes.",
      "pov": "Narrative Perspective (POV)", "povDesc": "Controls whose eyes the story is told through.",
      "prose": "Prose Style", "showExample": "Show Example", "customStyleTitle": "Custom Prose Style by Example", "customStylePlaceholder": "Paste a text sample (up to {{maxChars}} characters, ~1000 words) here...", "customStyleOverride": "Note: Providing a sample will override the dropdown selection above.",
      "analyzeStyle": "Analyze Style DNA", "styleProfileLabel": "Style Profile (DNA)", "styleProfilePlaceholder": "The AI analysis of your writing style will appear here. You can also edit this manually to guide the ghostwriter."
    },
    "universe": { "modalTitle": "Select a Universe for Your Story", "blankCanvas": "Blank Canvas", "blankCanvasDesc": "Build your world from scratch.", "realWorld": "Real World", "realWorldDesc": "Use the real world as a baseline.", "disguiseNames": "Disguise names", "fromLibrary": "From Library", "fromLibraryDesc": "Choose a world you already saved.", "noDataToSave": "No world data to save.", "enterNamePrompt": "Enter a name for this Universe:", "defaultDescription": "Universe for the story: {{title}}", "saveSuccess": "Universe \"{{name}}\" saved!", "saveToLibrary": "Save to Universe Library" },
    "skipSetup": "Skip Setup & Start Writing"
  },
  "studio": { "deleteLastError": "Cannot delete the last chapter. Every story must have at least one chapter.", "deleteConfirm": "Are you sure you want to permanently delete the chapter \"{{title}}\"? This action cannot be undone.", "noChapterSelected": "Select a chapter to start writing or add a new one.", "mobile": { "openEncyclopedia": "Open Encyclopedia", "closeEncyclopedia": "Close Encyclopedia", "openChat": "Open AI Chat", "closeChat": "Close AI Chat" }, "zenMode": { "toggleSidebar": "Toggle Sidebar", "toggleChat": "Toggle Chat" } },
  "sidebar": {
    "backToDashboard": "Back to Dashboard", "dashboard": "Dashboard", "exportStory": "Export Story (.md)", "editEncyclopedia": "Edit Encyclopedia", "universe": "Universe", "searchStory": "Global Search & Replace", "searchPlaceholder": "Search chapters...",
    "chapters": { "title": "Chapters", "delete": "Delete Chapter", "add": "Add New Chapter", "addVolume": "Add Volume / Arc", "newVolume": "New Volume" },
    "basicInfo": "Basic Info", "genre": "Genre", "setting": "Setting", "corePlot": "Core Plot", "mainPlot": "Main Plot", "storyArc": "Story Arc", "characters": "Characters", "relationships": "Relationships", "worldAndLore": { "title": "World & Lore", "worldSummary": "World Summary", "magicSummary": "System/Magic Summary" }, "tone": { "title": "Tone (out of 10)", "comedy": "Comedy", "romance": "Romance", "action": "Action", "maturity": "Maturity", "pov": "POV" }, "proseStyle": { "title": "Prose Style", "style": "Style", "custom": "Custom Style", "customActive": "Active (Sample Provided)" }, "character": { "roles": "Roles", "age": "Age", "gender": "Gender", "physical": "Physical Description", "voice": "Voice & Speech Style", "traits": "Personality", "habits": "Habits", "goal": "Goal", "principles": "Principles", "conflict": "Conflict" }
  },
  "chapterEditor": {
    "statusEditing": "Editing...", "statusSaved": "Saved", "wordCount": "Word Count",
    "magicTools": "Magic Tools", "tools": "AI Tools", "rewrite": "Rewrite", "expand": "Expand", "fixGrammar": "Fix Grammar", "beatToProse": "Beat to Prose", "continue": "Continue Writing", "analyze": "Analyze Chapter", "analyzing": "Analyzing...", "selectTextHint": "Select text to use Magic Tools", "autoFormat": "Auto-Format Foreign Text"
  },
  "editor": {
    "undo": "Undo",
    "redo": "Redo",
    "previewTitle": "AI Suggestion Preview",
    "originalSelection": "Original Selection",
    "aiSuggestion": "AI Suggestion",
    "addition": "AI Generated Addition",
    "apply": "Apply Changes",
    "discard": "Discard"
  },
  "searchReplace": {
    "title": "Global Search & Replace",
    "find": "Find what",
    "replace": "Replace with",
    "matchCase": "Match Case",
    "wholeWord": "Whole Word",
    "preview": "Preview",
    "replaceAll": "Replace All",
    "noMatches": "No matches found.",
    "foundMatches": "Found {{total}} matches in {{chapters}} chapters.",
    "replacedMatches": "Replaced {{total}} occurrences in {{chapters}} chapters.",
    "resultsTitle": "Preview Results"
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
  "history": {
    "tooltip": "Version History",
    "saveSnapshot": "Save Snapshot",
    "enterLabel": "Enter a label for this version (optional):",
    "saved": "Snapshot saved.",
    "title": "Chapter Version History",
    "subtitle": "Review and restore previous versions of this chapter.",
    "noVersions": "No history saved yet.",
    "snapshot": "Manual Snapshot",
    "restore": "Restore this Version",
    "deleteConfirm": "Delete this version?",
    "restoreConfirm": "Are you sure? Current content will be overwritten (a snapshot will be created automatically).",
    "selectVersion": "Select a version to preview."
  },
  "export": {
    "title": "Export Story",
    "subtitle": "Choose a format to download your story.",
    "pdf": {
      "title": "PDF (Print/Digital)",
      "desc": "Formatted document ready for printing or digital reading. Professional layout.",
      "button": "Print / Save as PDF"
    },
    "epub": {
      "title": "EPUB (E-Book)",
      "desc": "Standard ebook format. Best for reading on Kindle, Apple Books, or tablets.",
      "button": "Download EPUB"
    },
    "html": {
      "title": "HTML (Web)",
      "desc": "A single HTML file with styled text. Good for sharing online or printing.",
      "button": "Download HTML"
    },
    "txt": {
      "title": "Plain Text (Wattpad)",
      "desc": "Clean text format with no markdown. Optimized for pasting into Wattpad or web editors.",
      "button": "Copy to Clipboard"
    },
    "json": {
      "title": "Full Backup (JSON)",
      "desc": "Complete raw data of your story, including settings and lore. Use this for backups.",
      "button": "Download JSON"
    },
    "markdown": {
      "title": "Markdown (.md)",
      "desc": "The raw format used by this editor. Good for other writing apps.",
      "button": "Download Markdown"
    },
    "copySuccess": "Story copied to clipboard!"
  },
  "chat": { "errorMessage": "Sorry, I encountered an error. Please try again.", "thinkingMode": "Thinking Mode", "thinkingModeTooltip": "Enable for more complex and creative tasks using the Pro model.", "placeholder": "Let's build your story..." },
  "toast": {
    "backupReminder": "Don't forget to back up your work!",
    "backupAction": "Back Up Now"
  },
  "whatsNew": {
    "title": "What's New in Inkvora",
    "version": "Version {{version}}",
    "added": "New Features",
    "fixed": "Bug Fixes",
    "changed": "Improvements",
    "deprecated": "Deprecated",
    "removed": "Removed",
    "security": "Security Fixes",
    "dontShowAgain": "Don't show this again",
    "close": "Got it!"
  }
};

const idTranslations: Translations = {
  "app": { "title": "Inkvora" },
  "common": { "name": "Nama", "description": "Deskripsi...", "summary": "Ringkasan...", "generating": "Menghasilkan...", "generateWithAi": "Buat dengan AI", "confirm": "Konfirmasi", "cancel": "Batal", "failed": "Gagal", "language": "Bahasa", "save": "Simpan", "close": "Tutup", "download": "Unduh" },
  "apiKeyModal": { "title": "Masukkan Kunci API Google AI Anda", "instruction": "Untuk menggunakan aplikasi ini, Anda perlu menyediakan kunci API Google AI Anda sendiri. Kunci Anda disimpan dengan aman di browser Anda dan tidak pernah dikirim ke server kami.", "getApiKey": "Dapatkan kunci API Anda dari Google AI Studio", "placeholder": "Masukkan kunci API Anda di sini", "saveButton": "Simpan dan Mulai Menulis" },
  "dashboard": { "title": "Dasbor Anda", "subtitle": "Pilih sebuah proyek atau kelola semesta Anda.", "universeHub": "Pusat Semesta", "universeHubTooltip": "Kelola semesta tulisan Anda", "startNewStory": "Mulai Cerita Baru", "storyLibrary": "Perpustakaan Cerita", "emptyLibraryTitle": "Perpustakaan Anda kosong", "emptyLibrarySubtitle": "Saatnya menulis bab pertama Anda!", "importStory": "Impor Cerita dari File", "importStoryTooltip": "Impor cerita dari file .md", "noGenres": "Tanpa genre", "noPlot": "Tidak ada plot utama yang ditentukan.", "openStudio": "Buka Studio", "editStory": "Edit Ensiklopedia", "exportStory": "Manajer Ekspor", "deleteStory": "Hapus Cerita", "deleteStoryConfirm": "Anda yakin ingin menghapus \"{{title}}\" secara permanen?", "exportNotFound": "Cerita tidak ditemukan untuk diekspor.", "importErrorFormat": "Format tidak valid: Tidak dapat menemukan data ensiklopedia cerita.", "importSuccess": "Cerita \"{{title}}\" berhasil diimpor!", "importError": "Impor gagal", "changeApiKey": "Ganti Kunci API" },
  "universeHub": { "title": "Pusat Semesta", "subtitle": "Kelola dunia dan latar yang dapat digunakan kembali.", "backToDashboard": "Kembali ke Dasbor", "createNew": "Buat Semesta Baru", "emptyTitle": "Kosmos Anda menanti ciptaan", "emptySubtitle": "Buat semesta pertama Anda untuk digunakan kembali di berbagai cerita.", "import": "Impor Semesta dari File", "importTooltip": "Impor semesta dari file .json", "noDescription": "Tidak ada deskripsi yang diberikan.", "edit": "Edit Semesta", "export": "Ekspor Semesta", "delete": "Hapus Semesta", "deleteConfirm": "Anda yakin ingin menghapus semesta \"{{name}}\" secara permanen? Tindakan ini tidak dapat diurungkan.", "exportNotFound": "Semesta tidak ditemukan untuk diekspor.", "importErrorFormat": "Format file semesta tidak valid.", "importSuccess": "Semesta \"{{name}}\" berhasil diimpor!", "importError": "Impor gagal" },
  "universeSetup": { "titleEdit": "Edit Semesta", "titleCreate": "Buat Semesta Baru", "subtitleEdit": "Sempurnakan detail dunia Anda.", "subtitleCreate": "Bangun dunia yang dapat digunakan kembali untuk cerita Anda.", "coreDetails": "Detail Inti", "name": "Nama Semesta", "namePlaceholder": "contoh: Kekaisaran Kelabu", "descriptionPlaceholder": "Ringkasan singkat satu kalimat tentang semesta ini.", "worldAndLore": "Dunia & Lore", "worldBuildingSummary": "Pembangunan Dunia (Ringkasan)", "magicSystemSummary": "Aturan Sistem/Sihir (Ringkasan)", "locations": "Lokasi", "factions": "Faksi", "generalLore": "Lore Umum", "removeEntry": "Hapus Entri {{listTitle}}", "addEntry": "Tambah Entri {{listTitle}}", "nameRequired": "Nama semesta harus diisi.", "saveButton": "Simpan Semesta", "createButton": "Buat Semesta" },
  "world": {
    "subTabs": {
      "geo": "Geografi & Politik",
      "nature": "Alam & Biologi",
      "power": "Kekuatan & Aset",
      "history": "Sejarah & Budaya"
    }
  },
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
    "spark": {
      "title": "Percikan Kreasi",
      "ideaLabel": "Tulis ide inti Anda di sini (1-3 kalimat)",
      "genreLabel": "Pilih genre Anda",
      "otherGenrePlaceholder": "Atau tentukan genre Anda sendiri...",
      "untitledStory": "Cerita Tanpa Judul"
    },
    "tabs": {
      "basic": "Info Dasar",
      "world": "Dunia & Lore",
      "characters": "Karakter & Hubungan",
      "arc": "Alur Cerita",
      "tone": "Nada & Gaya"
    },
    "basic": {
      "title": "Judul",
      "format": "Format Cerita",
      "formatDesc": "Menentukan struktur dan kecepatan AI.",
      "setting": "Latar",
      "settingPlaceholder": "e.g., Jakarta, 2045 atau Kerajaan Aethelgard",
      "totalChapters": "Total Bab",
      "wordsPerChapter": "Kata per Bab"
    },
    "world": {
      "worldBuilding": "Pembangunan Dunia (Ringkasan)",
      "magicSystem": "Sistem/Sihir (Ringkasan)"
    },
    "lore": {
      "locations": "Lokasi",
      "factions": "Faksi",
      "races": "Ras / Spesies",
      "creatures": "Bestiary / Makhluk",
      "powers": "Mantra / Skill / Kemampuan",
      "items": "Item / Artefak",
      "technology": "Teknologi",
      "history": "Sejarah & Garis Waktu",
      "cultures": "Budaya & Tradisi",
      "general": "Lore Umum",
      "addEntry": "Tambah Entri {{title}}",
      "removeEntry": "Hapus Entri {{title}}"
    },
    "characters": { "mainPlot": "Plot Utama", "characters": "Karakter", "relationships": "Hubungan", "add": "Tambah Karakter", "addRelationship": "Tambah Hubungan", "generateRelationships": "Buat Hubungan", "relationshipsNeed2": "Perlu min. 2 karakter", "character1": "Karakter 1", "character2": "Karakter 2", "relationshipType": "Jenis Hubungan", "newCharacter": "Karakter Baru", "generateThis": "Buat Karakter Ini", "delete": "Hapus Karakter", "concept": "Konsep / Ide Karakter", "conceptPlaceholder": "Contoh: Mantan pembunuh bayaran yang sekarang jualan bunga. Galak tapi suka kucing.", "name": "Nama", "roles": "Peran", "rolesPlaceholder": "Tambah peran (e.g., Rival) lalu tekan Enter", "age": "Usia", "gender": "Gender", "physical": "Deskripsi Fisik", "voice": "Suara & Gaya Bicara", "traits": "Sifat", "habits": "Kebiasaan", "goal": "Tujuan", "principles": "Prinsip", "conflict": "Konflik" },
    "arc": { "act": "Babak", "actTitlePlaceholder": "Judul Babak", "actDescPlaceholder": "Deskripsi babak...", "generateAct": "Buat Babak {{index}}", "plotPoints": "Poin Plot", "addPoint": "Tambah Poin", "addAct": "Tambah Babak", "chapters": "Bab", "start": "Awal", "end": "Akhir", "template": "Templat Struktur", "templateDesc": "Mendefinisikan irama naratif untuk babak ini." },
    "tone": {
      "comedy": "Komedi (1-10)", "comedyDesc": "Mengontrol frekuensi lelucon.",
      "romance": "Romansa (1-10)", "romanceDesc": "Menentukan fokus pada hubungan.",
      "action": "Aksi (1-10)", "actionDesc": "Menentukan jumlah pertempuran.",
      "maturity": "Dewasa (1-10)", "maturityDesc": "Mengontrol tema dewasa.",
      "pov": "Sudut Pandang (POV)", "povDesc": "Mengontrol dari mata siapa cerita dikisahkan.",
      "prose": "Gaya Prosa", "showExample": "Lihat Contoh", "customStyleTitle": "Gaya Prosa Kustom dengan Contoh", "customStylePlaceholder": "Tempel contoh teks (hingga {{maxChars}} karakter, ~1000 kata) di sini...", "customStyleOverride": "Catatan: Memberikan contoh akan mengesampingkan pilihan di atas.",
      "analyzeStyle": "Analisa DNA Gaya", "styleProfileLabel": "Profil Gaya (DNA)", "styleProfilePlaceholder": "Analisa AI tentang gaya tulisan Anda akan muncul di sini. Anda juga bisa mengeditnya secara manual untuk memandu ghostwriter."
    },
    "universe": { "modalTitle": "Pilih Semesta untuk Cerita Anda", "blankCanvas": "Kanvas Kosong", "blankCanvasDesc": "Bangun dunia Anda dari awal.", "realWorld": "Dunia Nyata", "realWorldDesc": "Gunakan dunia nyata sebagai dasar.", "disguiseNames": "Samarkan nama", "fromLibrary": "Dari Pustaka", "fromLibraryDesc": "Pilih dunia yang sudah Anda simpan.", "noDataToSave": "Tidak ada data dunia untuk disimpan.", "enterNamePrompt": "Masukkan nama untuk Semesta ini:", "defaultDescription": "Semesta untuk cerita: {{title}}", "saveSuccess": "Semesta \"{{name}}\" berhasil disimpan!", "saveToLibrary": "Simpan ke Pustaka Semesta" }
  },
  "skipSetup": "Lewati Setup & Mulai Menulis",
  "studio": { "deleteLastError": "Tidak dapat menghapus bab terakhir. Setiap cerita harus memiliki setidaknya satu bab.", "deleteConfirm": "Anda yakin ingin menghapus bab \"{{title}}\" secara permanen? Tindakan ini tidak dapat diurungkan.", "noChapterSelected": "Pilih bab untuk mulai menulis atau tambahkan bab baru.", "mobile": { "openEncyclopedia": "Buka Ensiklopedia", "closeEncyclopedia": "Tutup Ensiklopedia", "openChat": "Buka Obrolan AI", "closeChat": "Tutup Obrolan AI" }, "zenMode": { "toggleSidebar": "Buka/Tutup Sidebar", "toggleChat": "Buka/Tutup Chat" } },
  "sidebar": {
    "backToDashboard": "Kembali ke Dasbor", "dashboard": "Dasbor", "exportStory": "Ekspor Cerita (.md)", "editEncyclopedia": "Edit Ensiklopedia", "universe": "Semesta", "searchStory": "Cari & Ganti Global", "searchPlaceholder": "Cari bab...",
    "chapters": { "title": "Bab", "delete": "Hapus Bab", "add": "Tambah Bab Baru", "addVolume": "Tambah Volume / Babak", "newVolume": "Volume Baru" },
    "basicInfo": "Info Dasar", "genre": "Genre", "setting": "Latar", "corePlot": "Plot Inti", "mainPlot": "Plot Utama", "storyArc": "Alur Cerita", "characters": "Karakter", "relationships": "Hubungan", "worldAndLore": { "title": "Dunia & Lore", "worldSummary": "Ringkasan Dunia", "magicSummary": "Ringkasan Sistem/Sihir" }, "tone": { "title": "Nada (dari 10)", "comedy": "Komedi", "romance": "Romansa", "action": "Aksi", "maturity": "Dewasa", "pov": "Sudut Pandang (POV)" }, "proseStyle": { "title": "Gaya Prosa", "style": "Gaya", "custom": "Gaya Kustom", "customActive": "Aktif (Contoh Disediakan)" }, "character": { "roles": "Peran", "age": "Usia", "gender": "Gender", "physical": "Deskripsi Fisik", "voice": "Suara & Gaya Bicara", "traits": "Sifat", "habits": "Kebiasaan", "goal": "Tujuan", "principles": "Prinsip", "conflict": "Konflik" }
  },
  "chapterEditor": {
    "statusEditing": "Menyunting...", "statusSaved": "Tersimpan", "wordCount": "Jumlah Kata",
    "magicTools": "Alat Ajaib", "tools": "Alat AI", "rewrite": "Tulis Ulang", "expand": "Perluas", "fixGrammar": "Perbaiki Tata Bahasa", "beatToProse": "Poin ke Prosa", "continue": "Lanjut Menulis", "analyze": "Analisa Bab", "analyzing": "Menganalisa...", "selectTextHint": "Pilih teks untuk menggunakan Alat Ajaib", "autoFormat": "Format Teks Asing Otomatis"
  },
  "editor": {
    "undo": "Urungkan",
    "redo": "Ulangi",
    "previewTitle": "Pratinjau Saran AI",
    "originalSelection": "Teks Asli",
    "aiSuggestion": "Saran AI",
    "addition": "Tambahan dari AI",
    "apply": "Terapkan",
    "discard": "Buang"
  },
  "searchReplace": {
    "title": "Cari & Ganti Global",
    "find": "Cari apa",
    "replace": "Ganti dengan",
    "matchCase": "Cocokkan Huruf",
    "wholeWord": "Kata Utuh",
    "preview": "Pratinjau",
    "replaceAll": "Ganti Semua",
    "noMatches": "Tidak ditemukan kecocokan.",
    "foundMatches": "Ditemukan {{total}} kecocokan di {{chapters}} bab.",
    "replacedMatches": "Mengganti {{total}} kejadian di {{chapters}} bab.",
    "resultsTitle": "Hasil Pratinjau"
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
  "history": {
    "tooltip": "Riwayat Versi",
    "saveSnapshot": "Simpan Snapshot",
    "enterLabel": "Masukkan label untuk versi ini (opsional):",
    "saved": "Snapshot disimpan.",
    "title": "Riwayat Versi Bab",
    "subtitle": "Tinjau dan pulihkan versi sebelumnya dari bab ini.",
    "noVersions": "Belum ada riwayat tersimpan.",
    "snapshot": "Snapshot Manual",
    "restore": "Pulihkan Versi Ini",
    "deleteConfirm": "Hapus versi ini?",
    "restoreConfirm": "Anda yakin? Konten saat ini akan ditimpa (snapshot otomatis akan dibuat).",
    "selectVersion": "Pilih versi untuk pratinjau."
  },
  "export": {
    "title": "Ekspor Cerita",
    "subtitle": "Pilih format untuk mengunduh cerita Anda.",
    "pdf": {
      "title": "PDF (Cetak/Digital)",
      "desc": "Dokumen berformat siap cetak atau baca digital. Tata letak profesional.",
      "button": "Cetak / Simpan PDF"
    },
    "epub": {
      "title": "EPUB (E-Book)",
      "desc": "Format ebook standar. Terbaik untuk dibaca di Kindle, Apple Books, atau tablet.",
      "button": "Unduh EPUB"
    },
    "html": {
      "title": "HTML (Web)",
      "desc": "File HTML tunggal dengan teks bergaya. Bagus untuk dibagikan secara online atau dicetak.",
      "button": "Unduh HTML"
    },
    "txt": {
      "title": "Teks Polos (Wattpad)",
      "desc": "Format teks bersih tanpa markdown. Dioptimalkan untuk ditempel ke Wattpad atau editor web.",
      "button": "Salin ke Clipboard"
    },
    "json": {
      "title": "Cadangan Penuh (JSON)",
      "desc": "Data mentah lengkap dari cerita Anda, termasuk pengaturan dan lore. Gunakan ini untuk cadangan.",
      "button": "Unduh JSON"
    },
    "markdown": {
      "title": "Markdown (.md)",
      "desc": "Format mentah yang digunakan oleh editor ini. Bagus untuk aplikasi menulis lainnya.",
      "button": "Unduh Markdown"
    },
    "copySuccess": "Cerita disalin ke clipboard!"
  },
  "chat": {
    "errorMessage": "Maaf, terjadi kesalahan. Silakan coba lagi.",
    "thinkingMode": "Mode Berpikir",
    "thinkingModeTooltip": "Aktifkan untuk tugas yang lebih kompleks dan kreatif menggunakan model Pro.",
    "placeholder": "Ayo bangun ceritamu..."
  },
  "toast": {
    "backupReminder": "Jangan lupa mencadangkan pekerjaan Anda!",
    "backupAction": "Cadangkan Sekarang"
  },
  "whatsNew": {
    "title": "Yang Baru di Inkvora",
    "version": "Versi {{version}}",
    "added": "Fitur Baru",
    "fixed": "Perbaikan Bug",
    "changed": "Peningkatan",
    "deprecated": "Usang",
    "removed": "Dihapus",
    "security": "Perbaikan Keamanan",
    "dontShowAgain": "Jangan tampilkan lagi",
    "close": "Mengerti!"
  }
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
