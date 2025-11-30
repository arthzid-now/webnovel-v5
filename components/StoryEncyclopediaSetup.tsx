import React, { useState, useMemo, useEffect } from 'react';
import { StoryEncyclopedia, StoryArcAct, Character, Relationship, CustomField, LoreEntry, PlotPoint, Universe } from '../types';
import { GENRES_EN, GENRES_ID, PROSE_STYLES_EN, PROSE_STYLES_ID, NARRATIVE_PERSPECTIVES_EN, NARRATIVE_PERSPECTIVES_ID, STORY_FORMATS, STRUCTURE_TEMPLATES } from '../constants';
import { generateStoryEncyclopediaSection } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import TagsInput from './TagsInput';
import { PencilIcon } from './icons/PencilIcon';
import { StarIcon } from './icons/StarIcon';
import { BoltIcon } from './icons/BoltIcon';
import { CheckIcon } from './icons/CheckIcon';
import { UserIcon } from './icons/UserIcon';
import { LockIcon } from './icons/LockIcon';

import { GripVerticalIcon } from './icons/GripVerticalIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { createEmptyCharacter } from '../utils';
import { GenerateButton, SubGenerateButton, FormSection, FormField } from './setup/Shared';
import { CharacterForm } from './setup/CharacterForm';
import { LoreListEditor } from './setup/LoreListEditor';
import { TimelineEditor } from './setup/TimelineEditor';
import { AutoBuildModal } from './setup/AutoBuildModal';
import { useStoryGeneration } from '../hooks/useStoryGeneration';


interface StoryEncyclopediaSetupProps {
    apiKey: string | null;
    onStoryCreate: (data: StoryEncyclopedia) => void;
    initialData?: StoryEncyclopedia | null;
    onCancel?: () => void;
    universeLibrary: Universe[];
    onSaveAsUniverse: (universe: Universe) => void;
    onToggleUniverseFavorite: (universeId: string) => void;
    onRequestApiKey: () => void;
    userIsPremium?: boolean;
    onSkipSetup?: () => void; // Allow skipping setup to go directly to Writing Studio
    userQuotaRemaining?: number;
}


const createEmptyRelationship = (): Relationship => ({ id: crypto.randomUUID(), character1Id: '', character2Id: '', type: '', description: '' });
const createEmptyLoreEntry = (): LoreEntry => ({ id: crypto.randomUUID(), name: '', description: '' });
const createEmptyPlotPoint = (): PlotPoint => ({ id: crypto.randomUUID(), summary: '' });

const createInitialFormData = (language: 'en' | 'id'): StoryEncyclopedia => ({
    id: crypto.randomUUID(),
    language: language,
    format: 'webnovel',
    title: '', genres: [], otherGenre: '', setting: '', totalChapters: '', wordsPerChapter: '', mainPlot: '',
    characters: [{ ...createEmptyCharacter(), roles: ['Protagonist'] }],
    relationships: [],
    storyArc: [{
        title: language === 'id' ? 'Babak 1' : 'Act 1',
        description: '',
        plotPoints: [],
        startChapter: '',
        endChapter: '',
        structureTemplate: 'freestyle'
    }],
    comedyLevel: '5', romanceLevel: '5', actionLevel: '5', maturityLevel: '1',
    proseStyle: PROSE_STYLES_EN[0].value,
    narrativePerspective: language === 'id' ? 'Orang Ketiga Terbatas ("Dia")' : 'Third Person Limited ("He/She")',
    customProseStyleByExample: '',
    styleProfile: '', // New Field
    chapters: [{ id: crypto.randomUUID(), title: language === 'id' ? 'Bab 1' : 'Chapter 1', content: '', type: 'story' }],
    universeId: null,
    universeName: language === 'id' ? 'Dunia Kustom' : 'Custom World',
    locations: [], factions: [], lore: [], magicSystem: '', worldBuilding: '',
    races: [], creatures: [], powers: [], items: [], technology: [], history: [], cultures: [],
    disguiseRealWorldNames: false,
});





// --- Main Setup Component ---
const StoryEncyclopediaSetup: React.FC<StoryEncyclopediaSetupProps> = ({
    apiKey, onStoryCreate, initialData, onCancel, universeLibrary, onSaveAsUniverse, onToggleUniverseFavorite, onRequestApiKey, userIsPremium, onSkipSetup, userQuotaRemaining
}) => {
    const { t, uiLang } = useLanguage();
    const [contentLanguage, setContentLanguage] = useState<'en' | 'id'>(initialData?.language || 'en');
    const [formData, setFormData] = useState<StoryEncyclopedia>(initialData || createInitialFormData(contentLanguage));
    const [initialIdea, setInitialIdea] = useState('');
    const [activeTab, setActiveTab] = useState<string>('basic'); // Re-add state that was accidentally removed
    const [activeWorldTab, setActiveWorldTab] = useState<string>('geo');
    const [activeCharacterIndex, setActiveCharacterIndex] = useState<number>(0);
    const [showUniverseModal, setShowUniverseModal] = useState<boolean>(!initialData);
    const [disguiseNames, setDisguiseNames] = useState(false);

    const [draggedPlotPoint, setDraggedPlotPoint] = useState<{ actIndex: number; ppIndex: number } | null>(null);
    const [dropTargetPlotPoint, setDropTargetPlotPoint] = useState<{ actIndex: number; ppIndex: number } | null>(null);


    const MAX_CUSTOM_STYLE_CHARS = 6000;

    const isEditing = !!initialData;
    const GENRES = contentLanguage === 'id' ? GENRES_ID : GENRES_EN;
    const PROSE_STYLES = contentLanguage === 'id' ? PROSE_STYLES_ID : PROSE_STYLES_EN;
    const NARRATIVE_PERSPECTIVES = contentLanguage === 'id' ? NARRATIVE_PERSPECTIVES_ID : NARRATIVE_PERSPECTIVES_EN;

    const showWorldBuilding = useMemo(() => formData.genres.some(g => ['Transmigration', 'Fantasy', 'Sci-Fi', 'Transmigrasi', 'Fiksi Ilmiah'].includes(g)), [formData.genres]);
    const showMagicSystem = useMemo(() => formData.genres.some(g => ['System', 'Fantasy', 'Wuxia', 'Xianxia', 'Sistem'].includes(g)), [formData.genres]);
    const showMaturityLevel = useMemo(() => formData.genres.some(g => ['Mature', 'Dewasa'].includes(g)), [formData.genres]);
    const allCharacters = useMemo(() => formData.characters.filter(c => c && c.name && c.name.trim() !== ''), [formData.characters]);

    // Check premium status (API Key OR Firestore flag)
    const isPremium = (apiKey !== null && apiKey.trim().length > 0) || (userIsPremium === true);

    const {
        generatingSection,
        error,
        setError,
        isAutoBuilding,
        setIsAutoBuilding,
        buildProgress,
        completedSteps,
        timeRemaining,
        styleExample,
        isGeneratingExample,
        handleGenerate,
        handleAutoBuild,
        cancelAutoBuild,
        handleGenerateStyleExample
    } = useStoryGeneration({
        apiKey,
        formData,
        setFormData,
        contentLanguage,
        initialIdea,
        onRequestApiKey,
        showWorldBuilding,
        showMagicSystem,
        userIsPremium // Pass premium flag to hook
    });

    const sortedUniverseLibrary = useMemo(() => {
        return [...universeLibrary].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
    }, [universeLibrary]);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setContentLanguage(initialData.language);
        } else {
            setFormData(createInitialFormData(contentLanguage));
        }
    }, [initialData, contentLanguage]);

    const isBasicInfoReady = useMemo(() => initialIdea.trim() !== '' && (formData.genres.length > 0 || formData.otherGenre.trim() !== ''), [initialIdea, formData.genres, formData.otherGenre]);
    const isBasicInfoComplete = useMemo(() => formData.title.trim() !== '' && (formData.genres.length > 0 || formData.otherGenre.trim() !== '') && formData.setting.trim() !== '', [formData]);
    const isCoreStoryComplete = useMemo(() => isBasicInfoComplete && formData.mainPlot.trim() !== '' && formData.characters.some(c => c.name.trim() !== ''), [isBasicInfoComplete, formData]);
    const isStoryArcComplete = useMemo(() => isCoreStoryComplete && formData.storyArc.length > 0 && formData.storyArc.every(act => act.title.trim() !== '' && act.description.trim() !== ''), [isCoreStoryComplete, formData]);

    const isWorldLoreReadyForGen = useMemo(() => {
        if (formData.universeName.toLowerCase().includes('real world')) {
            return !!formData.setting.trim();
        }
        return isBasicInfoComplete;
    }, [formData.universeName, formData.setting, isBasicInfoComplete]);


    const handleSaveAsUniverse = () => { if (!formData.worldBuilding && !formData.magicSystem && formData.locations.length === 0 && formData.factions.length === 0 && formData.lore.length === 0) { alert(t('setup.universe.noDataToSave')); return; } const universeName = prompt(t('setup.universe.enterNamePrompt')); if (universeName) { const newUniverse: Universe = { id: crypto.randomUUID(), language: contentLanguage, name: universeName, description: t('setup.universe.defaultDescription', { title: formData.title }), locations: formData.locations, factions: formData.factions, lore: formData.lore, magicSystem: formData.magicSystem, worldBuilding: formData.worldBuilding, races: formData.races, creatures: formData.creatures, powers: formData.powers, items: formData.items, technology: formData.technology, history: formData.history, cultures: formData.cultures }; onSaveAsUniverse(newUniverse); alert(t('setup.universe.saveSuccess', { name: universeName })); } };
    const handleSelectUniverse = (universe: Universe | null) => { const genIds = (arr: LoreEntry[]) => (arr || []).map(l => ({ ...l, id: crypto.randomUUID() })); if (universe) { setFormData(prev => ({ ...prev, universeId: universe.id, universeName: universe.name, locations: genIds(universe.locations), factions: genIds(universe.factions), lore: genIds(universe.lore), races: genIds(universe.races), creatures: genIds(universe.creatures), powers: genIds(universe.powers), items: genIds(universe.items), technology: genIds(universe.technology), history: genIds(universe.history), cultures: genIds(universe.cultures), magicSystem: universe.magicSystem, worldBuilding: universe.worldBuilding, disguiseRealWorldNames: false, })); } else { setFormData(prev => ({ ...prev, universeId: null, universeName: contentLanguage === 'id' ? 'Dunia Kustom' : 'Custom World', locations: [], factions: [], lore: [], races: [], creatures: [], powers: [], items: [], technology: [], history: [], cultures: [], magicSystem: '', worldBuilding: '', disguiseRealWorldNames: false, })); } setShowUniverseModal(false); };
    const handleRealWorldSelect = () => { setFormData(prev => ({ ...prev, universeId: null, universeName: 'Real World', locations: [], factions: [], lore: [], races: [], creatures: [], powers: [], items: [], technology: [], history: [], cultures: [], magicSystem: '', worldBuilding: '', disguiseRealWorldNames: disguiseNames, })); setShowUniverseModal(false); };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { const { name, value } = e.target; if (name === 'customProseStyleByExample' && value.length > MAX_CUSTOM_STYLE_CHARS) { return; } if (name === 'format') { const selectedFormat = STORY_FORMATS.find(f => f.value === value); if (selectedFormat && (!formData.totalChapters || !formData.wordsPerChapter)) { setFormData(prev => ({ ...prev, format: value as 'novel' | 'webnovel', totalChapters: prev.totalChapters || selectedFormat.defaultChapters, wordsPerChapter: prev.wordsPerChapter || selectedFormat.defaultWords })); return; } } setFormData(prev => ({ ...prev, [name]: value })); };
    const handleGenreChange = (genre: string) => setFormData(prev => ({ ...prev, genres: prev.genres.includes(genre) ? prev.genres.filter(g => g !== genre) : [...prev.genres, genre] }));
    const handleCharacterChange = (index: number, field: keyof Character, value: any) => setFormData(prev => { const newChars = [...prev.characters]; newChars[index] = { ...newChars[index], [field]: value }; return { ...prev, characters: newChars }; });
    const addCharacter = () => { setFormData(prev => ({ ...prev, characters: [...prev.characters, createEmptyCharacter()] })); setActiveCharacterIndex(formData.characters.length); };
    const removeCharacter = (index: number) => { setFormData(prev => { const characterIdToRemove = prev.characters[index].id; const newCharacters = prev.characters.filter((_, i) => i !== index); const newRelationships = prev.relationships.filter(rel => rel.character1Id !== characterIdToRemove && rel.character2Id !== characterIdToRemove); return { ...prev, characters: newCharacters, relationships: newRelationships }; }); if (index === activeCharacterIndex) { setActiveCharacterIndex(Math.max(0, index - 1)); } else if (index < activeCharacterIndex) { setActiveCharacterIndex(activeCharacterIndex - 1); } };
    const handleRelationshipChange = (index: number, field: keyof Relationship, value: string) => setFormData(prev => { const newRels = [...prev.relationships]; newRels[index] = { ...newRels[index], [field]: value }; return { ...prev, relationships: newRels }; });
    const addRelationship = () => setFormData(prev => ({ ...prev, relationships: [...prev.relationships, createEmptyRelationship()] }));
    const removeRelationship = (index: number) => setFormData(prev => ({ ...prev, relationships: prev.relationships.filter((_, i) => i !== index) }));

    const handleArcChange = (index: number, field: keyof StoryArcAct, value: any) => setFormData(prev => { const newArc = [...prev.storyArc]; newArc[index] = { ...newArc[index], [field]: value }; return { ...prev, storyArc: newArc }; });
    const handleAddAct = () => setFormData(prev => ({ ...prev, storyArc: [...prev.storyArc, { title: `${t('setup.arc.act')} ${prev.storyArc.length + 1}`, description: '', plotPoints: [], startChapter: '', endChapter: '', structureTemplate: 'freestyle' }] }));
    const handleRemoveAct = (index: number) => { if (formData.storyArc.length > 1) setFormData(prev => ({ ...prev, storyArc: prev.storyArc.filter((_, i) => i !== index) })); };

    const handlePlotPointChange = (actIndex: number, ppIndex: number, value: string) => setFormData(prev => { const newArc = [...prev.storyArc]; const newPPs = [...newArc[actIndex].plotPoints]; newPPs[ppIndex] = { ...newPPs[ppIndex], summary: value }; newArc[actIndex] = { ...newArc[actIndex], plotPoints: newPPs }; return { ...prev, storyArc: newArc }; });
    const addPlotPoint = (actIndex: number) => setFormData(prev => { const newArc = [...prev.storyArc]; newArc[actIndex].plotPoints.push(createEmptyPlotPoint()); return { ...prev, storyArc: newArc }; });
    const removePlotPoint = (actIndex: number, ppIndex: number) => setFormData(prev => { const newArc = [...prev.storyArc]; newArc[actIndex].plotPoints = newArc[actIndex].plotPoints.filter((_, i) => i !== ppIndex); return { ...prev, storyArc: newArc }; });

    const handleLoreChange = (type: any, index: number, field: keyof LoreEntry, value: string) => setFormData(prev => { const newEntries = [...(prev as any)[type]]; newEntries[index] = { ...newEntries[index], [field]: value }; return { ...prev, [type]: newEntries }; });
    const addLoreEntry = (type: any) => setFormData(prev => ({ ...prev, [type]: [...(prev as any)[type], createEmptyLoreEntry()] }));
    const removeLoreEntry = (type: any, index: number) => setFormData(prev => ({ ...prev, [type]: (prev as any)[type].filter((_: any, i: number) => i !== index) }));

    const handlePlotPointDragStart = (e: React.DragEvent, actIndex: number, ppIndex: number) => {
        setDraggedPlotPoint({ actIndex, ppIndex });
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", JSON.stringify({ actIndex, ppIndex }));
    };

    const handlePlotPointDragOver = (e: React.DragEvent, actIndex: number, ppIndex: number) => {
        e.preventDefault();
        if (!draggedPlotPoint || (draggedPlotPoint.actIndex === actIndex && draggedPlotPoint.ppIndex === ppIndex)) return;
        if (draggedPlotPoint.actIndex !== actIndex) return;

        setDropTargetPlotPoint({ actIndex, ppIndex });
        e.dataTransfer.dropEffect = "move";
    };

    const handlePlotPointDrop = (e: React.DragEvent, actIndex: number, ppIndex: number) => {
        e.preventDefault();
        setDropTargetPlotPoint(null);
        setDraggedPlotPoint(null);

        if (!draggedPlotPoint) return;
        if (draggedPlotPoint.actIndex !== actIndex) return;
        if (draggedPlotPoint.ppIndex === ppIndex) return;

        setFormData(prev => {
            const newArc = [...prev.storyArc];
            const newPlotPoints = [...newArc[actIndex].plotPoints];
            const [movedItem] = newPlotPoints.splice(draggedPlotPoint.ppIndex, 1);
            newPlotPoints.splice(ppIndex, 0, movedItem);
            newArc[actIndex] = { ...newArc[actIndex], plotPoints: newPlotPoints };
            return { ...prev, storyArc: newArc };
        });
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onStoryCreate(formData); };

    const handleFormKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
            e.preventDefault();
        }
    };

    const TABS = [{ id: 'basic', label: 'setup.tabs.basic' }, { id: 'world', label: 'setup.tabs.world' }, { id: 'characters', label: 'setup.tabs.characters' }, { id: 'arc', label: 'setup.tabs.arc' }, { id: 'tone', label: 'setup.tabs.tone' }];

    return (
        <div className="w-full p-4">
            {isAutoBuilding && (
                <AutoBuildModal
                    progress={buildProgress}
                    steps={completedSteps}
                    onClose={() => setIsAutoBuilding(false)}
                    error={error}
                    timeRemaining={timeRemaining}
                    onCancel={cancelAutoBuild}
                />
            )}{showUniverseModal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-6 flex flex-col max-h-[90vh]">
                        <h2 className="text-2xl font-bold text-gray-900 flex-shrink-0">{t('setup.universe.modalTitle')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-shrink-0">
                            <button onClick={() => handleSelectUniverse(null)} className="text-center p-6 bg-gray-50 hover:bg-white rounded-xl border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all flex flex-col items-center justify-center group">
                                <PencilIcon className="w-8 h-8 mb-3 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                <h3 className="font-bold text-gray-900">{t('setup.universe.blankCanvas')}</h3>
                                <p className="text-sm text-gray-500 mt-2">{t('setup.universe.blankCanvasDesc')}</p>
                            </button>
                            <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-between">
                                <div> <GlobeIcon className="w-8 h-8 mb-3 text-gray-400 mx-auto" /> <h3 className="font-bold text-gray-900">{t('setup.universe.realWorld')}</h3> <p className="text-sm text-gray-500 mt-2">{t('setup.universe.realWorldDesc')}</p> </div>
                                <div className="mt-4 space-y-3 w-full"> <label className="flex items-center justify-center text-xs text-gray-600 gap-2 cursor-pointer"> <input type="checkbox" checked={disguiseNames} onChange={() => setDisguiseNames(!disguiseNames)} className="form-checkbox h-4 w-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500" /> <span>{t('setup.universe.disguiseNames')}</span> </label> <button onClick={handleRealWorldSelect} className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">{t('common.confirm')}</button> </div>
                            </div>
                            <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center"> <DatabaseIcon className="w-8 h-8 mb-3 text-gray-400" /> <h3 className="font-bold text-gray-900">{t('setup.universe.fromLibrary')}</h3> <p className="text-sm text-gray-500 mt-2">{t('setup.universe.fromLibraryDesc')}</p> </div>
                        </div>
                        {sortedUniverseLibrary.length > 0 && (
                            <div className="flex-grow overflow-y-auto -mx-2 px-2 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {sortedUniverseLibrary.map(uni => (
                                        <button key={uni.id} onClick={() => handleSelectUniverse(uni)} className="relative text-left p-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-500 transition-all group shadow-sm hover:shadow-md">
                                            <p className="font-semibold text-gray-900 truncate pr-8">{uni.name}</p>
                                            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{uni.description}</p>
                                            <button onClick={(e) => { e.stopPropagation(); onToggleUniverseFavorite(uni.id); }} className="absolute top-3 right-3 p-1 rounded-full bg-gray-100 text-gray-400 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-all" title={uni.isFavorite ? "Remove from favorites" : "Add to favorites"} > <StarIcon className="w-4 h-4" filled={!!uni.isFavorite} /> </button>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {onCancel && <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-900 absolute top-6 right-6 font-medium">{t('common.cancel')}</button>}
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto py-10">
                <div className="text-center mb-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex-1 text-left">
                            <h2 className="text-5xl font-bold text-gray-900 tracking-tight font-display mb-3">{isEditing ? t('setup.titleEdit') : t('setup.titleCreate')}</h2>
                            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">{isEditing ? t('setup.subtitleEdit') : t('setup.subtitleCreate')}</p>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0 pt-2">
                            {/* Credit Indicator */}
                            {isPremium ? (
                                <div className="px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center gap-2 shadow-sm">
                                    <span className="text-xl text-amber-500">∞</span>
                                    <span className="text-sm font-bold text-amber-700">Unlimited</span>
                                </div>
                            ) : userQuotaRemaining !== undefined ? (
                                <div className={`px-4 py-2 border rounded-xl flex items-center gap-2 shadow-sm ${userQuotaRemaining > 50 ? 'bg-emerald-50 border-emerald-200' :
                                    userQuotaRemaining >= 20 ? 'bg-amber-50 border-amber-200' :
                                        'bg-red-50 border-red-200'
                                    }`}>
                                    <span className="text-lg">{userQuotaRemaining > 50 ? '✓' : '⚠'}</span>
                                    <div className="text-left">
                                        <div className={`text-xs font-bold uppercase tracking-wider ${userQuotaRemaining > 50 ? 'text-emerald-600' :
                                            userQuotaRemaining >= 20 ? 'text-amber-600' :
                                                'text-red-600'
                                            }`}>
                                            {userQuotaRemaining < 20 ? 'Low Credits' : 'AI Credits'}
                                        </div>
                                        <div className="text-base font-bold text-gray-900">{userQuotaRemaining}</div>
                                    </div>
                                </div>
                            ) : null}
                            {/* Skip Setup Button */}
                            {!isEditing && onSkipSetup && (
                                <button
                                    type="button"
                                    onClick={onSkipSetup}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 group"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                    {t('setup.skipSetup')}
                                    <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {error && !isAutoBuilding && <div className="bg-red-900/50 border border-red-800 text-red-200 p-3 rounded-md mb-6 text-center"><strong>{t('common.failed')}:</strong> {error}</div>}

                <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6">
                    {!isEditing && (

                        <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 rounded-2xl shadow-xl border border-slate-700 space-y-8 relative overflow-hidden group/panel transition-all hover:shadow-2xl hover:border-indigo-500/30">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                            <div className="flex justify-between items-center border-b border-slate-700/50 pb-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30 shadow-inner">
                                        <SparklesIcon className="w-6 h-6 text-indigo-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white tracking-tight">{t('setup.spark.title')}</h3>
                                        <p className="text-sm text-slate-400 mt-0.5">Start with a core idea, then let AI help you build the world.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 rounded-lg bg-slate-800/80 p-1.5 border border-slate-700 shadow-sm">
                                    <button type="button" onClick={() => setContentLanguage('en')} className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${contentLanguage === 'en' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}> EN </button>
                                    <button type="button" onClick={() => setContentLanguage('id')} className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${contentLanguage === 'id' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}> ID </button>
                                </div>
                            </div>

                            <div className="relative z-10 transition-opacity duration-300 group-focus-within/panel:opacity-100">
                                <FormField label={t('setup.spark.ideaLabel')} name="initialIdea" value={initialIdea} onChange={(e) => setInitialIdea(e.target.value)} isTextArea fullWidth placeholder={t('setup.spark.ideaPlaceholder')} />
                            </div>

                            {/* Custom styling for dark mode input inside this specific panel */}
                            <style jsx>{`
                                .bg-gradient-to-br textarea {
                                    background-color: rgba(30, 41, 59, 0.4) !important;
                                    border-color: rgba(71, 85, 105, 0.4) !important;
                                    color: white !important;
                                    padding: 1.5rem !important;
                                    font-size: 1.125rem !important;
                                    line-height: 1.75rem !important;
                                    min-height: 160px !important;
                                    transition: all 0.2s ease-in-out !important;
                                }
                                .bg-gradient-to-br textarea:focus {
                                    border-color: #6366f1 !important;
                                    background-color: rgba(30, 41, 59, 0.7) !important;
                                    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
                                }
                                .bg-gradient-to-br label {
                                    color: #cbd5e1 !important;
                                    font-size: 0.95rem !important;
                                    margin-bottom: 0.75rem !important;
                                }
                            `}</style>

                            <div className="relative z-10 transition-opacity duration-300 group-focus-within/panel:opacity-60 hover:!opacity-100">
                                <label className="block text-sm font-medium text-slate-300 mb-4">{t('setup.spark.genreLabel')}</label>
                                <div className="flex flex-wrap gap-y-3 gap-x-2 max-w-3xl">
                                    {GENRES.map(genre => (
                                        <label key={genre.value} className={`flex items-center space-x-2 cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${formData.genres.includes(genre.value) ? 'bg-indigo-900/60 border-indigo-500/50 text-indigo-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-700 hover:text-slate-200'}`} title={genre.description}>
                                            <input type="checkbox" checked={formData.genres.includes(genre.value)} onChange={() => handleGenreChange(genre.value)} className="hidden" />
                                            <span>{genre.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <input type="text" name="otherGenre" value={formData.otherGenre} onChange={handleChange} placeholder={t('setup.spark.otherGenrePlaceholder')} className="mt-6 w-full max-w-lg bg-slate-800/50 text-white placeholder-slate-400 rounded-xl p-4 border border-slate-700 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none transition shadow-sm" />
                            </div>
                        </div>
                    )}

                    <div className="border-b border-gray-200 flex space-x-8 sticky top-[65px] bg-white/95 backdrop-blur-sm z-40 py-3 -mx-2 px-8 overflow-x-auto whitespace-nowrap scrollbar-hide w-full flex-nowrap shadow-sm">
                        {TABS.map(tab => (<button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex-shrink-0 py-2 text-sm font-bold transition-all border-b-2 ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`} > {t(tab.label)} </button>))}
                    </div>

                    <div className="pt-4">
                        {activeTab === 'basic' && <FormSection title={t('setup.tabs.basic')} onGenerate={() => handleGenerate('basic')} generateDisabled={!isBasicInfoReady && !isEditing} isGenerating={generatingSection === 'basic'} actions={!isEditing && (
                            <button
                                type="button"
                                onClick={handleAutoBuild}
                                disabled={isAutoBuilding || !isBasicInfoReady}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-white rounded-md transition-all ${!isPremium
                                    ? 'bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600' // Locked style
                                    : isBasicInfoReady
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30 animate-pulse'
                                        : 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'
                                    }`}
                                title={!isPremium ? "⭐ Upgrade to Premium to unlock Auto Architect" : (isBasicInfoReady ? t('setup.autoBuild.buttonDesc') : "Please enter an idea and select a genre first.")}
                            >
                                {!isPremium ? <LockIcon className="w-4 h-4" /> : <BoltIcon className="w-4 h-4" />}
                                {t('setup.autoBuild.button')}
                                {!isPremium && <span className="ml-1 text-[10px] bg-slate-800 px-1 rounded text-yellow-500">PRO</span>}
                            </button>
                        )} >
                            <FormField label={t('setup.basic.title')} name="title" value={formData.title} onChange={handleChange} fullWidth />
                            <div className="col-span-1 md:col-span-2"> <label className="block text-sm font-medium text-gray-700 mb-2">{t('setup.basic.format')}</label> <div className="flex flex-col md:flex-row gap-4"> {STORY_FORMATS.map((fmt) => (<label key={fmt.value} className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all shadow-sm ${formData.format === fmt.value ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}> <div className="flex items-center gap-3"> <input type="radio" name="format" value={fmt.value} checked={formData.format === fmt.value} onChange={handleChange} className="text-indigo-600 focus:ring-indigo-500 border-gray-300" /> <div><div className="font-bold text-gray-900">{fmt.label}</div><div className="text-xs text-gray-500 mt-0.5">{fmt.defaultChapters} Chaps • {fmt.defaultWords} Words</div></div> </div> </label>))} </div> <p className="text-xs text-gray-500 mt-2">{t('setup.basic.formatDesc')}</p> </div>
                            <FormField label={t('setup.basic.setting')} name="setting" value={formData.setting} onChange={handleChange} isTextArea fullWidth placeholder={t('setup.basic.settingPlaceholder')} />
                            <FormField label={t('setup.basic.totalChapters')} name="totalChapters" value={formData.totalChapters} onChange={handleChange} />
                            <FormField label={t('setup.basic.wordsPerChapter')} name="wordsPerChapter" value={formData.wordsPerChapter} onChange={handleChange} />
                        </FormSection>}

                        {activeTab === 'world' && (

                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-8">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-6">
                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{t('setup.tabs.world')}</h3>
                                    <button type="button" onClick={handleSaveAsUniverse} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                                        <DatabaseIcon className="w-4 h-4" />
                                        {t('setup.universe.saveToLibrary')}
                                    </button>
                                </div>

                                <div>
                                    <div className="flex space-x-2 bg-gray-50 p-1.5 rounded-xl mb-8 overflow-x-auto whitespace-nowrap no-scrollbar border border-gray-200">
                                        <button type="button" onClick={() => setActiveWorldTab('geo')} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex-shrink-0 ${activeWorldTab === 'geo' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}>{t('world.subTabs.geo')}</button>
                                        <button type="button" onClick={() => setActiveWorldTab('nature')} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex-shrink-0 ${activeWorldTab === 'nature' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}>{t('world.subTabs.nature')}</button>
                                        <button type="button" onClick={() => setActiveWorldTab('power')} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex-shrink-0 ${activeWorldTab === 'power' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}>{t('world.subTabs.power')}</button>
                                        <button type="button" onClick={() => setActiveWorldTab('history')} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex-shrink-0 ${activeWorldTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}>{t('world.subTabs.history')}</button>
                                    </div>

                                    <div className="space-y-8">
                                        {activeWorldTab === 'geo' && (
                                            <>
                                                <div className="flex justify-end mb-4">
                                                    <GenerateButton onClick={() => handleGenerate('worldLore')} disabled={!isWorldLoreReadyForGen} isLoading={generatingSection === 'worldLore'} label={t('common.generateWithAi')} />
                                                </div>
                                                {showWorldBuilding && <FormField label={t('setup.world.worldBuilding')} name="worldBuilding" value={formData.worldBuilding || ''} onChange={handleChange} isTextArea onGenerate={() => handleGenerate('worldBuilding')} isGenerating={generatingSection === 'worldBuilding'} />}
                                                <LoreListEditor listTitle={t('setup.lore.locations')} entries={formData.locations} onLoreChange={(i, f, v) => handleLoreChange('locations', i, f, v)} onAdd={() => addLoreEntry('locations')} onRemove={(i) => removeLoreEntry('locations', i)} />
                                                <LoreListEditor listTitle={t('setup.lore.factions')} entries={formData.factions} onLoreChange={(i, f, v) => handleLoreChange('factions', i, f, v)} onAdd={() => addLoreEntry('factions')} onRemove={(i) => removeLoreEntry('factions', i)} />
                                                <LoreListEditor listTitle={t('setup.lore.general')} entries={formData.lore} onLoreChange={(i, f, v) => handleLoreChange('lore', i, f, v)} onAdd={() => addLoreEntry('lore')} onRemove={(i) => removeLoreEntry('lore', i)} />
                                            </>
                                        )}
                                        {activeWorldTab === 'nature' && (
                                            <>
                                                <div className="flex justify-end mb-4">
                                                    <GenerateButton onClick={() => handleGenerate('world_nature')} disabled={!isWorldLoreReadyForGen} isLoading={generatingSection === 'world_nature'} label={t('common.generateWithAi')} />
                                                </div>
                                                <LoreListEditor listTitle={t('setup.lore.races')} entries={formData.races} onLoreChange={(i, f, v) => handleLoreChange('races', i, f, v)} onAdd={() => addLoreEntry('races')} onRemove={(i) => removeLoreEntry('races', i)} />
                                                <LoreListEditor listTitle={t('setup.lore.creatures')} entries={formData.creatures} onLoreChange={(i, f, v) => handleLoreChange('creatures', i, f, v)} onAdd={() => addLoreEntry('creatures')} onRemove={(i) => removeLoreEntry('creatures', i)} />
                                            </>
                                        )}
                                        {activeWorldTab === 'power' && (
                                            <>
                                                <div className="flex justify-end mb-4">
                                                    <GenerateButton onClick={() => handleGenerate('world_power')} disabled={!isWorldLoreReadyForGen} isLoading={generatingSection === 'world_power'} label={t('common.generateWithAi')} />
                                                </div>
                                                {showMagicSystem && <FormField label={t('setup.world.magicSystem')} name="magicSystem" value={formData.magicSystem || ''} onChange={handleChange} isTextArea onGenerate={() => handleGenerate('magicSystem')} isGenerating={generatingSection === 'magicSystem'} />}
                                                <LoreListEditor listTitle={t('setup.lore.powers')} entries={formData.powers} onLoreChange={(i, f, v) => handleLoreChange('powers', i, f, v)} onAdd={() => addLoreEntry('powers')} onRemove={(i) => removeLoreEntry('powers', i)} />
                                                <LoreListEditor listTitle={t('setup.lore.items')} entries={formData.items} onLoreChange={(i, f, v) => handleLoreChange('items', i, f, v)} onAdd={() => addLoreEntry('items')} onRemove={(i) => removeLoreEntry('items', i)} />
                                                <LoreListEditor listTitle={t('setup.lore.technology')} entries={formData.technology} onLoreChange={(i, f, v) => handleLoreChange('technology', i, f, v)} onAdd={() => addLoreEntry('technology')} onRemove={(i) => removeLoreEntry('technology', i)} />
                                            </>
                                        )}
                                        {activeWorldTab === 'history' && (
                                            <>
                                                <div className="flex justify-end mb-4">
                                                    <div className="flex items-center gap-4 w-full justify-between">
                                                        <h3 className="text-xl font-bold text-gray-900">{t('setup.lore.history')}</h3>
                                                        <div className="flex items-center gap-3">
                                                            {/* Placeholder for View Toggle if needed later */}
                                                            <GenerateButton onClick={() => handleGenerate('world_history')} disabled={!isWorldLoreReadyForGen} isLoading={generatingSection === 'world_history'} label={t('common.generateWithAi')} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <TimelineEditor listTitle="" entries={formData.history} onLoreChange={(i, f, v) => handleLoreChange('history', i, f, v)} onAdd={() => addLoreEntry('history')} onRemove={(i) => removeLoreEntry('history', i)} />
                                                <LoreListEditor listTitle={t('setup.lore.cultures')} entries={formData.cultures} onLoreChange={(i, f, v) => handleLoreChange('cultures', i, f, v)} onAdd={() => addLoreEntry('cultures')} onRemove={(i) => removeLoreEntry('cultures', i)} />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'characters' && <FormSection title={t('setup.tabs.characters')} onGenerate={() => handleGenerate('core')} generateDisabled={!isBasicInfoComplete} isGenerating={generatingSection === 'core'} grid={false}>
                            <FormField label={t('setup.characters.mainPlot')} name="mainPlot" value={formData.mainPlot} onChange={handleChange} isTextArea onGenerate={() => handleGenerate('mainPlot')} isGenerating={generatingSection === 'mainPlot'} />
                            <h3 className="text-lg font-bold text-gray-700 mt-6 border-t border-gray-200 pt-6">{t('setup.characters.characters')}</h3>
                            <div className="flex flex-col md:flex-row gap-6 bg-white p-4 rounded-xl border border-gray-200 min-h-[600px] shadow-sm">
                                <div className="w-full md:w-1/3 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 md:pr-4">
                                    <div className="md:hidden flex overflow-x-auto whitespace-nowrap gap-2 pb-2 no-scrollbar"> {formData.characters?.map((char, index) => (<button key={char.id} type="button" onClick={() => setActiveCharacterIndex(index)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all flex-shrink-0 border ${activeCharacterIndex === index ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-gray-200 text-gray-600'}`} > <UserIcon className="w-4 h-4" /> {char.name || `Character ${index + 1}`} </button>))} <button type="button" onClick={addCharacter} className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-indigo-600 hover:text-white transition-colors flex-shrink-0" title={t('setup.characters.add')}> <PlusIcon className="w-5 h-5" /> </button> </div>
                                    <div className="hidden md:flex flex-col gap-2 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar"> {formData.characters?.map((char, index) => (<div key={char.id} onClick={() => setActiveCharacterIndex(index)} className={`group p-3 rounded-xl cursor-pointer border transition-all ${activeCharacterIndex === index ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'}`} > <div className="flex justify-between items-center"> <div className="flex items-center gap-3 overflow-hidden"> <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activeCharacterIndex === index ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}> <UserIcon className="w-4 h-4" /> </div> <div className="min-w-0"> <p className={`font-bold truncate text-sm ${activeCharacterIndex === index ? 'text-indigo-900' : 'text-gray-700'}`}> {char.name || t('setup.characters.newCharacter')} </p> <p className="text-xs text-gray-500 truncate"> {char.roles.length > 0 ? char.roles.join(', ') : 'No Role'} </p> </div> </div> <button type="button" onClick={(e) => { e.stopPropagation(); if (window.confirm("Are you sure you want to delete this character?")) removeCharacter(index); }} className={`p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-rose-500 transition-all ${activeCharacterIndex === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} title={t('setup.characters.delete')} > <TrashIcon className="w-4 h-4" /> </button> </div> </div>))} <button type="button" onClick={addCharacter} className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 mt-2" > <PlusIcon className="w-5 h-5" /> <span>{t('setup.characters.add')}</span> </button> </div>
                                </div>
                                <div className="w-full md:w-2/3 pl-0 md:pl-2 overflow-y-auto custom-scrollbar max-h-[600px]"> {formData.characters.length > 0 && formData.characters[activeCharacterIndex] ? (<CharacterForm key={formData.characters[activeCharacterIndex].id} character={formData.characters[activeCharacterIndex]} index={activeCharacterIndex} onCharacterChange={handleCharacterChange} onRemoveCharacter={removeCharacter} onGenerateCharacter={handleGenerate.bind(null, 'character')} isGenerating={generatingSection === `character_${activeCharacterIndex}`} />) : (<div className="h-full flex flex-col items-center justify-center text-gray-500"> <p>{t('setup.characters.relationshipsNeed2')}</p> <button type="button" onClick={addCharacter} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">{t('setup.characters.add')}</button> </div>)} </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center mt-6 border-t border-gray-200 pt-6"> <h3 className="text-lg font-bold text-gray-700">{t('setup.characters.relationships')}</h3> {allCharacters.length >= 2 && (<button type="button" onClick={() => handleGenerate('relationships')} disabled={!!generatingSection} className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg border border-indigo-100 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all" > {generatingSection === 'relationships' ? <><SpinnerIcon className="w-4 h-4" />{t('common.generating')}</> : <><SparklesIcon className="w-4 h-4" />{t('setup.characters.generateRelationships')}</>} </button>)} </div>
                                {allCharacters.length < 2 ? (<p className="text-sm text-gray-500 text-center">{t('setup.characters.relationshipsNeed2')}</p>) : (<div className="space-y-4"> {formData.relationships?.map((rel, index) => (<div key={rel.id} className="p-4 bg-white rounded-xl border border-gray-200 space-y-3 relative shadow-sm hover:shadow-md transition-all"> <div className="flex items-center gap-2"> <select value={rel.character1Id} onChange={(e) => handleRelationshipChange(index, 'character1Id', e.target.value)} className="w-full bg-gray-50 text-gray-900 rounded-lg p-2.5 border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"> <option value="">{t('setup.characters.character1')}</option> {allCharacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)} </select> <span className="text-gray-400 font-medium">&</span> <select value={rel.character2Id} onChange={(e) => handleRelationshipChange(index, 'character2Id', e.target.value)} className="w-full bg-gray-50 text-gray-900 rounded-lg p-2.5 border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"> <option value="">{t('setup.characters.character2')}</option> {allCharacters.filter(c => c.id !== rel.character1Id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)} </select> <button type="button" onClick={() => removeRelationship(index)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button> </div> <input type="text" placeholder={t('setup.characters.relationshipType')} value={rel.type} onChange={(e) => handleRelationshipChange(index, 'type', e.target.value)} className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 rounded-lg p-2.5 border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none" /> <textarea placeholder={t('common.description')} value={rel.description} onChange={(e) => handleRelationshipChange(index, 'description', e.target.value)} rows={2} className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 rounded-lg p-2.5 border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none" /> </div>))} <button type="button" onClick={addRelationship} className="w-full py-3 px-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 group"><div className="p-1 rounded-md bg-gray-100 group-hover:bg-indigo-50 transition-colors"><PlusIcon className="w-4 h-4" /></div><span className="font-medium">{t('setup.characters.addRelationship')}</span></button> </div>)}
                            </div>
                        </FormSection>}
                        {activeTab === 'arc' && <FormSection title={t('setup.tabs.arc')} grid={false} onGenerate={() => handleGenerate('arc')} generateDisabled={!isCoreStoryComplete} isGenerating={generatingSection === 'arc'} locked={!isPremium}>
                            {formData.storyArc?.map((act, index) => (
                                <div key={index} className="p-6 bg-white rounded-xl relative space-y-5 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                        <input type="text" value={act.title} onChange={(e) => handleArcChange(index, 'title', e.target.value)} placeholder={t('setup.arc.actTitlePlaceholder')} className="flex-grow bg-gray-50 font-bold text-gray-900 placeholder-gray-400 rounded-lg p-2.5 border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all" />
                                        <div className="flex items-center ml-3 gap-2">
                                            <SubGenerateButton onClick={() => handleGenerate('singleArcAct', index)} isLoading={generatingSection === `singleArcAct_${index}`} title={t('setup.arc.generateAct', { index: index + 1 })} />
                                            {formData.storyArc.length > 1 && (<button type="button" onClick={() => handleRemoveAct(index)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>)}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div> <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('setup.arc.start')}</label> <input type="number" value={act.startChapter || ''} onChange={(e) => handleArcChange(index, 'startChapter', e.target.value)} placeholder="#" className="w-full bg-white text-gray-900 text-sm rounded-lg p-2.5 border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none" /> </div>
                                        <div> <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('setup.arc.end')}</label> <input type="number" value={act.endChapter || ''} onChange={(e) => handleArcChange(index, 'endChapter', e.target.value)} placeholder="#" className="w-full bg-white text-gray-900 text-sm rounded-lg p-2.5 border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none" /> </div>
                                        <div className="lg:col-span-2"> <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('setup.arc.template')}</label> <select value={act.structureTemplate || 'freestyle'} onChange={(e) => handleArcChange(index, 'structureTemplate', e.target.value)} className="w-full bg-white text-gray-900 text-sm rounded-lg p-2.5 border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"> {STRUCTURE_TEMPLATES.map(tmp => <option key={tmp.value} value={tmp.value}>{tmp.label}</option>)} </select> </div>
                                    </div>
                                    <textarea value={act.description} onChange={(e) => handleArcChange(index, 'description', e.target.value)} rows={3} placeholder={t('setup.arc.actDescPlaceholder')} className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 rounded-xl p-3 border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all" />
                                    <div className="pl-4 border-l-2 border-indigo-100 space-y-3">
                                        <h5 className="text-sm font-bold text-gray-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div>{t('setup.arc.plotPoints')}</h5>
                                        {act.plotPoints?.map((pp, ppIndex) => (
                                            <div
                                                key={pp.id}
                                                className={`flex items-center gap-2 transition-all ${draggedPlotPoint?.actIndex === index && draggedPlotPoint?.ppIndex === ppIndex ? 'opacity-50' : ''
                                                    } ${dropTargetPlotPoint?.actIndex === index && dropTargetPlotPoint?.ppIndex === ppIndex ? 'border-b-2 border-indigo-500' : ''}`}
                                                draggable
                                                onDragStart={(e) => handlePlotPointDragStart(e, index, ppIndex)}
                                                onDragOver={(e) => handlePlotPointDragOver(e, index, ppIndex)}
                                                onDrop={(e) => handlePlotPointDrop(e, index, ppIndex)}
                                            >
                                                <div className="cursor-grab text-gray-400 hover:text-gray-600">
                                                    <GripVerticalIcon className="w-4 h-4" />
                                                </div>
                                                <input type="text" value={pp.summary} onChange={(e) => handlePlotPointChange(index, ppIndex, e.target.value)} placeholder={t('common.summary')} className="w-full bg-white text-sm p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none" />
                                                <button type="button" onClick={() => removePlotPoint(index, ppIndex)} className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"><TrashIcon className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => addPlotPoint(index)} className="w-full text-xs py-2 px-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-1.5"><PlusIcon className="w-3.5 h-3.5" />{t('setup.arc.addPoint')}</button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddAct} className="w-full py-4 px-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 group"><div className="p-1 rounded-md bg-gray-100 group-hover:bg-indigo-50 transition-colors"><PlusIcon className="w-5 h-5" /></div><span className="font-medium">{t('setup.arc.addAct')}</span></button>
                        </FormSection>}
                        {activeTab === 'tone' && <FormSection title={t('setup.tabs.tone')} onGenerate={() => handleGenerate('tone')} generateDisabled={!isStoryArcComplete} isGenerating={generatingSection === 'tone'}>
                            <div><FormField label={t('setup.tone.comedy')} name="comedyLevel" value={formData.comedyLevel} onChange={handleChange} /><p className="text-xs text-gray-500 mt-1">{t('setup.tone.comedyDesc')}</p></div>
                            <div><FormField label={t('setup.tone.romance')} name="romanceLevel" value={formData.romanceLevel} onChange={handleChange} /><p className="text-xs text-gray-500 mt-1">{t('setup.tone.romanceDesc')}</p></div>
                            <div><FormField label={t('setup.tone.action')} name="actionLevel" value={formData.actionLevel} onChange={handleChange} /><p className="text-xs text-gray-500 mt-1">{t('setup.tone.actionDesc')}</p></div>
                            {showMaturityLevel && (<div><FormField label={t('setup.tone.maturity')} name="maturityLevel" value={formData.maturityLevel} onChange={handleChange} /><p className="text-xs text-gray-500 mt-1">{t('setup.tone.maturityDesc')}</p></div>)}
                            <div className="col-span-1 md:col-span-2"> <label htmlFor="narrativePerspective" className="block text-sm font-medium text-gray-700 mb-1">{t('setup.tone.pov')}</label> <select id="narrativePerspective" name="narrativePerspective" value={formData.narrativePerspective} onChange={handleChange} className="w-full bg-white text-gray-900 rounded-xl p-3 border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all shadow-sm"> {NARRATIVE_PERSPECTIVES.map(pov => <option key={pov.value} value={pov.value}>{pov.value}</option>)} </select> <p className="text-xs text-gray-500 mt-1">{t('setup.tone.povDesc')}</p> </div>
                            <div className="col-span-1 md:col-span-2"> <label htmlFor="proseStyle" className="block text-sm font-medium text-gray-700 mb-1">{t('setup.tone.prose')}</label> <div className="flex items-center gap-2"> <select id="proseStyle" name="proseStyle" value={formData.proseStyle} onChange={handleChange} className="w-full bg-white text-gray-900 rounded-xl p-3 border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all shadow-sm"> {PROSE_STYLES.map(style => <option key={style.value} value={style.value}>{style.value}</option>)} </select> <button type="button" onClick={handleGenerateStyleExample} disabled={isGeneratingExample} className="px-4 py-3 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl whitespace-nowrap disabled:opacity-50 flex items-center justify-center border border-gray-200 font-medium transition-colors"> {isGeneratingExample ? <SpinnerIcon className="w-5 h-5" /> : t('setup.tone.showExample')} </button> </div> {styleExample && <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200 italic">"{styleExample}"</p>} </div>

                            <div className="col-span-1 md:col-span-2 border-t border-gray-200 pt-6 mt-2">
                                <label htmlFor="customProseStyleByExample" className="block text-sm font-medium text-gray-700 mb-1">{t('setup.tone.customStyleTitle')}</label>
                                <textarea id="customProseStyleByExample" name="customProseStyleByExample" value={formData.customProseStyleByExample || ''} onChange={handleChange} rows={6} placeholder={t('setup.tone.customStylePlaceholder', { maxChars: MAX_CUSTOM_STYLE_CHARS })} className="w-full bg-white text-gray-900 placeholder-gray-400 rounded-xl p-3 border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition duration-200 shadow-sm" />
                                <div className="flex justify-between items-center text-xs text-gray-500 mt-1"> <p>{t('setup.tone.customStyleOverride')}</p> <span>{(formData.customProseStyleByExample || '').length} / {MAX_CUSTOM_STYLE_CHARS}</span> </div>

                                <div className="flex justify-end mt-2">
                                    <button
                                        type="button"
                                        onClick={() => handleGenerate('analyzeStyle')}
                                        disabled={!formData.customProseStyleByExample || generatingSection === 'analyzeStyle'}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20"
                                    >
                                        {generatingSection === 'analyzeStyle' ? <SpinnerIcon className="w-3 h-3" /> : <SparklesIcon className="w-3 h-3" />}
                                        {t('setup.tone.analyzeStyle')}
                                    </button>
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label htmlFor="styleProfile" className="block text-sm font-medium text-gray-700 mb-1">{t('setup.tone.styleProfileLabel')}</label>
                                <textarea id="styleProfile" name="styleProfile" value={formData.styleProfile || ''} onChange={handleChange} rows={4} placeholder={t('setup.tone.styleProfilePlaceholder')} className="w-full bg-gray-50 text-indigo-900 placeholder-gray-500 rounded-xl p-3 border border-indigo-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition duration-200 font-mono text-xs" />
                            </div>
                        </FormSection>}
                    </div>

                    <div className="flex justify-center items-center gap-4 pt-8 pb-12">
                        {onCancel && (<button type="button" onClick={onCancel} className="text-gray-500 font-bold py-3 px-8 rounded-xl hover:bg-gray-100 transition-colors">{t('common.cancel')}</button>)}
                        <button type="submit" className="bg-indigo-600 text-white font-bold py-3 px-10 rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transform hover:-translate-y-0.5" disabled={!isStoryArcComplete && !isEditing} title={!isStoryArcComplete && !isEditing ? t('setup.submitDisabledTooltip') : (isEditing ? t('setup.submitButtonEdit') : t('setup.submitButtonCreate'))}>
                            {isEditing ? t('setup.submitButtonEdit') : t('setup.submitButtonCreate')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StoryEncyclopediaSetup;