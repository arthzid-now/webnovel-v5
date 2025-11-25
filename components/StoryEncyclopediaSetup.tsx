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
import { GripVerticalIcon } from './icons/GripVerticalIcon';
import { useLanguage } from '../contexts/LanguageContext';


interface StoryEncyclopediaSetupProps {
  apiKey: string | null;
  onStoryCreate: (data: StoryEncyclopedia) => void;
  initialData?: StoryEncyclopedia | null;
  onCancel?: () => void;
  universeLibrary: Universe[];
  onSaveAsUniverse: (universe: Universe) => void;
  onToggleUniverseFavorite: (universeId: string) => void;
  onRequestApiKey: () => void;
}

// ... (keep helper functions createEmptyCharacter, etc.)
// Re-declaring for completeness in XML block if file is replaced
const createEmptyCharacter = (): Character => ({ id: crypto.randomUUID(), name: '', roles: [], age: '', gender: '', physicalDescription: '', voiceAndSpeechStyle: '', personalityTraits: '', habits: '', goal: '', principles: '', conflict: '', customFields: [], });
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
  chapters: [{ id: crypto.randomUUID(), title: language === 'id' ? 'Bab 1' : 'Chapter 1', content: '' }],
  universeId: null,
  universeName: language === 'id' ? 'Dunia Kustom' : 'Custom World',
  locations: [], factions: [], lore: [], magicSystem: '', worldBuilding: '',
  races: [], creatures: [], powers: [], items: [], technology: [], history: [], cultures: [],
  disguiseRealWorldNames: false,
});

// ... (Keep reusable components: GenerateButton, SubGenerateButton, FormSection, FormField, CharacterForm, LoreListEditor, AutoBuildModal)
// I will assume they are preserved or I must include them. I'll include them to be safe.

const GenerateButton: React.FC<{onClick: () => void; disabled: boolean; isLoading: boolean; label?: string}> = ({ onClick, disabled, isLoading, label }) => {
    const { t } = useLanguage();
    return (
        <button type="button" onClick={onClick} disabled={disabled || isLoading} className="flex items-center justify-center gap-2 px-3 py-1 text-sm font-semibold text-indigo-300 bg-slate-700/50 rounded-md border border-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {isLoading ? <><SpinnerIcon className="w-4 h-4" />{t('common.generating')}</> : <><SparklesIcon className="w-4 h-4" />{label || t('common.generateWithAi')}</>}
        </button>
    );
}
const SubGenerateButton: React.FC<{onClick: () => void; isLoading: boolean; title: string;}> = ({ onClick, isLoading, title }) => ( <button type="button" onClick={onClick} disabled={isLoading} title={title} className="p-1 text-indigo-400 hover:text-indigo-300 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50"> {isLoading ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />} </button> );
const FormSection: React.FC<{ title: string; children: React.ReactNode; grid?: boolean; onGenerate?: () => void; generateDisabled?: boolean; isGenerating?: boolean; onClear?: () => void; actions?: React.ReactNode }> = ({ title, children, grid = true, onGenerate, generateDisabled = false, isGenerating = false, onClear, actions }) => {
    const { t } = useLanguage();
    return (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <div className="flex justify-between items-center mb-4 border-b border-slate-600 pb-2">
                <h3 className="text-xl font-bold text-indigo-400">{title}</h3>
                <div className="flex items-center gap-2">
                    {actions}
                    {onClear && <button type="button" onClick={onClear} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-900/50 rounded-md transition-colors" title={t('setup.clearSection')}><TrashIcon className="w-4 h-4" /></button>}
                    {onGenerate && <GenerateButton onClick={onGenerate} disabled={generateDisabled} isLoading={!!isGenerating} />}
                </div>
            </div>
            <div className={grid ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>{children}</div>
        </div>
    );
};
const FormField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; isTextArea?: boolean; fullWidth?: boolean; onGenerate?: () => void; isGenerating?: boolean; generateTitle?: string; placeholder?: string; }> = ({ label, name, value, onChange, isTextArea = false, fullWidth = false, onGenerate, isGenerating, generateTitle, placeholder }) => ( <div className={fullWidth ? 'col-span-1 md:col-span-2' : ''}> <div className="flex items-center justify-between mb-1"> <label htmlFor={name} className="block text-sm font-medium text-slate-300">{label}</label> {onGenerate && <SubGenerateButton onClick={onGenerate} isLoading={!!isGenerating} title={generateTitle || 'Generate'} />} </div> {isTextArea ? ( <textarea id={name} name={name} value={value || ''} onChange={onChange} rows={3} placeholder={placeholder} className="w-full bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200" /> ) : ( <input id={name} type="text" name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200" /> )} </div> );

const CharacterForm: React.FC<{ character: Character; index: number; onCharacterChange: (index: number, field: keyof Character, value: any) => void; onRemoveCharacter: (index: number) => void; onGenerateCharacter: (index: number) => void; isGenerating: boolean;}> = ({ character, index, onCharacterChange, onRemoveCharacter, onGenerateCharacter, isGenerating }) => {
    const { t } = useLanguage();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onCharacterChange(index, e.target.name as keyof Character, e.target.value);
    const handleRolesChange = (newRoles: string[]) => onCharacterChange(index, 'roles', newRoles);
    const handleCustomFieldChange = (cfIndex: number, field: 'label' | 'value', value: string) => { const newCustomFields = [...character.customFields]; newCustomFields[cfIndex] = { ...newCustomFields[cfIndex], [field]: value }; onCharacterChange(index, 'customFields', newCustomFields); };
    const addCustomField = () => onCharacterChange(index, 'customFields', [...character.customFields, { id: crypto.randomUUID(), label: '', value: '' }]);
    const removeCustomField = (cfIndex: number) => onCharacterChange(index, 'customFields', character.customFields.filter((_, i) => i !== cfIndex));
    return (
        <div className="bg-slate-700/30 p-4 rounded-lg space-y-4 border border-slate-600/50">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-600/50 md:hidden"> 
                <h4 className="font-semibold text-slate-200">{character.name || t('setup.characters.newCharacter')}</h4> 
                <div className="flex items-center gap-2"> 
                    <SubGenerateButton onClick={() => onGenerateCharacter(index)} isLoading={isGenerating} title={t('setup.characters.generateThis')} /> 
                    <button type="button" onClick={() => onRemoveCharacter(index)} className="p-1.5 text-slate-400 hover:text-rose-400" title={t('setup.characters.delete')}><TrashIcon className="w-4 h-4" /></button> 
                </div> 
            </div>
            <div className="hidden md:flex justify-end mb-2">
                 <GenerateButton onClick={() => onGenerateCharacter(index)} disabled={false} isLoading={isGenerating} label={t('setup.characters.generateThis')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label={t('setup.characters.name')} name="name" value={character.name} onChange={handleChange} fullWidth/>
                <div className="col-span-1 md:col-span-2"> <label className="block text-sm font-medium text-slate-300 mb-1">{t('setup.characters.roles')}</label> <TagsInput tags={character.roles} onTagsChange={handleRolesChange} placeholder={t('setup.characters.rolesPlaceholder')} /> </div>
                <FormField label={t('setup.characters.age')} name="age" value={character.age} onChange={handleChange} />
                <FormField label={t('setup.characters.gender')} name="gender" value={character.gender} onChange={handleChange} />
                <FormField label={t('setup.characters.physical')} name="physicalDescription" value={character.physicalDescription} onChange={handleChange} isTextArea fullWidth />
                <FormField label={t('setup.characters.voice')} name="voiceAndSpeechStyle" value={character.voiceAndSpeechStyle} onChange={handleChange} isTextArea fullWidth placeholder={t('setup.characters.voicePlaceholder')} />
                <FormField label={t('setup.characters.personality')} name="personalityTraits" value={character.personalityTraits} onChange={handleChange} isTextArea fullWidth />
                <FormField label={t('setup.characters.habits')} name="habits" value={character.habits} onChange={handleChange} isTextArea fullWidth />
                <FormField label={t('setup.characters.goal')} name="goal" value={character.goal} onChange={handleChange} isTextArea fullWidth />
                <FormField label={t('setup.characters.principles')} name="principles" value={character.principles} onChange={handleChange} isTextArea fullWidth />
                <FormField label={t('setup.characters.conflict')} name="conflict" value={character.conflict} onChange={handleChange} isTextArea fullWidth />
                <div className="col-span-1 md:col-span-2 space-y-3">
                    <h5 className="text-sm font-medium text-slate-300">{t('setup.characters.customDetails')}</h5>
                    {character.customFields?.map((field, cfIndex) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start bg-slate-600/50 p-2 rounded-md">
                           <input type="text" value={field.label} onChange={(e) => handleCustomFieldChange(cfIndex, 'label', e.target.value)} placeholder={t('setup.characters.customLabelPlaceholder')} className="md:col-span-1 w-full bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                           <textarea value={field.value} onChange={(e) => handleCustomFieldChange(cfIndex, 'value', e.target.value)} placeholder={t('common.description')} rows={2} className="md:col-span-2 w-full bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                           <button type="button" onClick={() => removeCustomField(cfIndex)} className="md:col-span-3 justify-self-end text-xs text-rose-400 hover:text-rose-300">{t('setup.characters.removeDetail')}</button>
                        </div>
                    ))}
                    <button type="button" onClick={addCustomField} className="w-full text-sm py-2 px-4 border-2 border-dashed border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 hover:border-slate-500 transition-colors flex items-center justify-center gap-2"><PlusIcon className="w-4 h-4" />{t('setup.characters.addCustomDetail')}</button>
                </div>
            </div>
        </div>
    );
};

const LoreListEditor: React.FC<{ listTitle: string; entries: LoreEntry[]; onLoreChange: (index: number, field: keyof LoreEntry, value: string) => void; onAdd: () => void; onRemove: (index: number) => void; }> = ({ listTitle, entries, onLoreChange, onAdd, onRemove }) => {
    const { t } = useLanguage();
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-300 mt-4 border-t border-slate-700 pt-4">{listTitle}</h3>
            {entries?.map((entry, index) => (
                <div key={entry.id} className="p-3 bg-slate-700/50 rounded-md space-y-2 relative">
                    <input type="text" placeholder={t('common.name')} value={entry.name} onChange={(e) => onLoreChange(index, 'name', e.target.value)} className="w-full bg-slate-600 font-bold text-slate-100 placeholder-slate-400 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    <textarea placeholder={t('common.description')} value={entry.description} onChange={(e) => onLoreChange(index, 'description', e.target.value)} rows={3} className="w-full bg-slate-600 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    <button type="button" onClick={() => onRemove(index)} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-400" title={t('setup.lore.removeEntry', { title: listTitle })}><TrashIcon className="w-4 h-4" /></button>
                </div>
            ))}
            <button type="button" onClick={onAdd} className="w-full text-sm py-2 px-4 border-2 border-dashed border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 hover:border-slate-500 transition-colors flex items-center justify-center gap-2"><PlusIcon className="w-4 h-4" />{t('setup.lore.addEntry', { title: listTitle })}</button>
        </div>
    );
};

const AutoBuildModal: React.FC<{ progress: string; steps: Record<string, boolean>; onClose: () => void; error?: string | null; }> = ({ progress, steps, onClose, error }) => {
    const { t } = useLanguage();
    const isComplete = progress === 'complete';
    const isError = !!error;
    useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'unset'; }; }, []);
    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-w-md w-full p-6 space-y-6">
                 <div className="text-center">
                    <div className={`mx-auto w-16 h-16 flex items-center justify-center rounded-full border mb-4 relative ${isError ? 'bg-red-500/20 border-red-500/30' : 'bg-indigo-500/20 border-indigo-500/30'}`}>
                        {isError ? <TrashIcon className="w-8 h-8 text-red-400" /> : isComplete ? <CheckIcon className="w-8 h-8 text-emerald-400" /> : <BoltIcon className="w-8 h-8 text-indigo-400 animate-pulse" />}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-100">{isError ? t('common.failed') : t('setup.autoBuild.modalTitle')}</h2>
                 </div>
                 {isError ? <div className="bg-red-900/30 text-red-200 p-4 rounded-md border border-red-800 text-sm">{error}</div> : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-300"> {steps.basic ? <CheckIcon className="w-5 h-5 text-emerald-400" /> : <SpinnerIcon className="w-5 h-5 text-indigo-400" />} <span className={steps.basic ? "text-emerald-400" : "font-medium"}>{t('setup.autoBuild.stepBasic')}</span> </div>
                        <div className="flex items-center gap-3 text-slate-300"> {steps.core ? <CheckIcon className="w-5 h-5 text-emerald-400" /> : (steps.basic ? <SpinnerIcon className="w-5 h-5 text-indigo-400" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-600" />)} <span className={steps.core ? "text-emerald-400" : (steps.basic ? "font-medium" : "text-slate-500")}>{t('setup.autoBuild.stepCore')}</span> </div>
                        <div className="flex items-center gap-3 text-slate-300"> {steps.world ? <CheckIcon className="w-5 h-5 text-emerald-400" /> : (steps.core ? <SpinnerIcon className="w-5 h-5 text-indigo-400" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-600" />)} <span className={steps.world ? "text-emerald-400" : (steps.core ? "font-medium" : "text-slate-500")}>{t('setup.autoBuild.stepWorld')}</span> </div>
                        <div className="flex items-center gap-3 text-slate-300"> {steps.relations ? <CheckIcon className="w-5 h-5 text-emerald-400" /> : (steps.world ? <SpinnerIcon className="w-5 h-5 text-indigo-400" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-600" />)} <span className={steps.relations ? "text-emerald-400" : (steps.world ? "font-medium" : "text-slate-500")}>{t('setup.autoBuild.stepRelations')}</span> </div>
                        <div className="flex items-center gap-3 text-slate-300"> {steps.arc ? <CheckIcon className="w-5 h-5 text-emerald-400" /> : (steps.relations ? <SpinnerIcon className="w-5 h-5 text-indigo-400" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-600" />)} <span className={steps.arc ? "text-emerald-400" : (steps.relations ? "font-medium" : "text-slate-500")}>{t('setup.autoBuild.stepArc')}</span> </div>
                        <div className="flex items-center gap-3 text-slate-300"> {steps.tone ? <CheckIcon className="w-5 h-5 text-emerald-400" /> : (steps.arc ? <SpinnerIcon className="w-5 h-5 text-indigo-400" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-600" />)} <span className={steps.tone ? "text-emerald-400" : (steps.arc ? "font-medium" : "text-slate-500")}>{t('setup.autoBuild.stepTone')}</span> </div>
                    </div>
                 )}
                 {(isComplete || isError) && (
                     <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <button onClick={onClose} className={`w-full font-bold py-3 px-6 rounded-lg transition-colors shadow-lg ${isError ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'}`}>
                             {isError ? t('common.cancel') : t('common.confirm')}
                         </button>
                     </div>
                 )}
            </div>
        </div>
    );
};

// --- Main Setup Component ---
const StoryEncyclopediaSetup: React.FC<StoryEncyclopediaSetupProps> = ({ apiKey, onStoryCreate, initialData, onCancel, universeLibrary, onSaveAsUniverse, onToggleUniverseFavorite, onRequestApiKey }) => {
  const { t, uiLang } = useLanguage();
  const [contentLanguage, setContentLanguage] = useState<'en' | 'id'>(initialData?.language || 'en');
  const [formData, setFormData] = useState<StoryEncyclopedia>(initialData || createInitialFormData(contentLanguage));
  const [initialIdea, setInitialIdea] = useState('');
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [activeWorldTab, setActiveWorldTab] = useState<string>('geo');
  const [activeCharacterIndex, setActiveCharacterIndex] = useState<number>(0);
  const [showUniverseModal, setShowUniverseModal] = useState<boolean>(!initialData);
  const [disguiseNames, setDisguiseNames] = useState(false);
  const [styleExample, setStyleExample] = useState('');
  const [isGeneratingExample, setIsGeneratingExample] = useState(false);
  
  // Auto-Architect State
  const [isAutoBuilding, setIsAutoBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState<string>('');
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  
  // DnD State
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

  // ... (isBasicInfoReady, isBasicInfoComplete, etc.)
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

  // ... (mergeUnique, handleGenerate, handleAutoBuild, etc. omitted for brevity in snippet, assuming present)
  // Re-include for completeness
  const mergeUnique = (existing: LoreEntry[], incoming: LoreEntry[]) => {
      const map = new Map();
      existing.forEach(item => map.set(item.name.toLowerCase().trim(), item));
      incoming.forEach(item => {
          if (!map.has(item.name.toLowerCase().trim())) {
              map.set(item.name.toLowerCase().trim(), item);
          }
      });
      return Array.from(map.values());
  };

  const handleGenerate = async (section: string, index?: number) => {
    if (!apiKey) {
      onRequestApiKey();
      return;
    }
    setGeneratingSection(section + (index !== undefined ? `_${index}` : ''));
    setError(null);
    try {
      const result = await generateStoryEncyclopediaSection(apiKey, section, formData, contentLanguage, { idea: initialIdea, index });
      if (section === 'character' && index !== undefined) setFormData(prev => { const newCharacters = [...prev.characters]; newCharacters[index] = { ...result, id: newCharacters[index].id }; return { ...prev, characters: newCharacters }; });
      else if (section === 'singleArcAct' && index !== undefined) setFormData(prev => { const newStoryArc = [...prev.storyArc]; newStoryArc[index] = result as StoryArcAct; return { ...prev, storyArc: newStoryArc }; });
      else if (section === 'relationships') setFormData(prev => ({ ...prev, relationships: [...prev.relationships, ...result.relationships] }));
      else if (section === 'worldLore' || section === 'world_nature' || section === 'world_power' || section === 'world_history') {
          setFormData(prev => ({
              ...prev,
              locations: mergeUnique(prev.locations, result.locations || []),
              factions: mergeUnique(prev.factions, result.factions || []),
              lore: mergeUnique(prev.lore, result.lore || []),
              races: mergeUnique(prev.races, result.races || []),
              creatures: mergeUnique(prev.creatures, result.creatures || []),
              powers: mergeUnique(prev.powers, result.powers || []),
              items: mergeUnique(prev.items, result.items || []),
              technology: mergeUnique(prev.technology, result.technology || []),
              history: mergeUnique(prev.history, result.history || []),
              cultures: mergeUnique(prev.cultures, result.cultures || []),
          }));
      }
      else setFormData(prev => ({ ...prev, ...result }));
    } catch (err) { setError(err instanceof Error ? err.message : "An unknown error occurred."); } 
    finally { setGeneratingSection(null); }
  };
  
  const handleAutoBuild = async () => {
    if (!apiKey) { onRequestApiKey(); return; }
    setIsAutoBuilding(true); setBuildProgress('basic'); setCompletedSteps({}); setError(null);
    let currentData = { ...formData };
    try {
        const basicRes = await generateStoryEncyclopediaSection(apiKey, 'basic', currentData, contentLanguage, { idea: initialIdea });
        currentData = { ...currentData, ...basicRes }; setFormData(currentData); setCompletedSteps(prev => ({...prev, basic: true}));
        
        setBuildProgress('core');
        const coreRes = await generateStoryEncyclopediaSection(apiKey, 'core', currentData, contentLanguage);
        currentData = { ...currentData, ...coreRes }; setFormData(currentData); setCompletedSteps(prev => ({...prev, core: true}));
        
        setBuildProgress('world');
        const worldRes = await generateStoryEncyclopediaSection(apiKey, 'worldLore', currentData, contentLanguage);
        const natureRes = await generateStoryEncyclopediaSection(apiKey, 'world_nature', currentData, contentLanguage);
        const powerRes = await generateStoryEncyclopediaSection(apiKey, 'world_power', currentData, contentLanguage);
        const historyRes = await generateStoryEncyclopediaSection(apiKey, 'world_history', currentData, contentLanguage);
        currentData = { ...currentData, locations: mergeUnique(currentData.locations, worldRes.locations || []), factions: mergeUnique(currentData.factions, worldRes.factions || []), lore: mergeUnique(currentData.lore, worldRes.lore || []), races: mergeUnique(currentData.races, natureRes.races || []), creatures: mergeUnique(currentData.creatures, natureRes.creatures || []), powers: mergeUnique(currentData.powers, powerRes.powers || []), items: mergeUnique(currentData.items, powerRes.items || []), technology: mergeUnique(currentData.technology, powerRes.technology || []), history: mergeUnique(currentData.history, historyRes.history || []), cultures: mergeUnique(currentData.cultures, historyRes.cultures || []) };
        if (showWorldBuilding) { const wbRes = await generateStoryEncyclopediaSection(apiKey, 'worldBuilding', currentData, contentLanguage); currentData = { ...currentData, ...wbRes }; }
        if (showMagicSystem) { const msRes = await generateStoryEncyclopediaSection(apiKey, 'magicSystem', currentData, contentLanguage); currentData = { ...currentData, ...msRes }; }
        setFormData(currentData); setCompletedSteps(prev => ({...prev, world: true}));
        
        setBuildProgress('relations');
        if (currentData.characters.length >= 2) { const relRes = await generateStoryEncyclopediaSection(apiKey, 'relationships', currentData, contentLanguage); currentData = { ...currentData, relationships: relRes.relationships || [] }; setFormData(currentData); }
        setCompletedSteps(prev => ({...prev, relations: true}));
        
        setBuildProgress('arc');
        const arcRes = await generateStoryEncyclopediaSection(apiKey, 'arc', currentData, contentLanguage);
        if (arcRes.storyArc) { const mappedArc = arcRes.storyArc.map((act: any) => ({ ...act, plotPoints: (act.plotPoints || []).map((p: any) => ({ ...p, id: crypto.randomUUID() })) })); currentData = { ...currentData, storyArc: mappedArc }; setFormData(currentData); }
        setCompletedSteps(prev => ({...prev, arc: true}));
        
        setBuildProgress('tone');
        const toneRes = await generateStoryEncyclopediaSection(apiKey, 'tone', currentData, contentLanguage);
        currentData = { ...currentData, ...toneRes }; setFormData(currentData); setCompletedSteps(prev => ({...prev, tone: true}));
        setBuildProgress('complete');
    } catch (err) { setError(err instanceof Error ? err.message : "Auto-build failed."); setBuildProgress('error'); }
  };

  const handleGenerateStyleExample = async () => { if (!apiKey) { onRequestApiKey(); return; } if (!formData.proseStyle) return; setIsGeneratingExample(true); setStyleExample(''); setError(null); try { const result = await generateStoryEncyclopediaSection(apiKey, 'styleExample', {}, contentLanguage, { style: formData.proseStyle }); setStyleExample(result.example); } catch (err) { setError(err instanceof Error ? err.message : "An unknown error occurred."); } finally { setIsGeneratingExample(false); } };
  const handleSaveAsUniverse = () => { if (!formData.worldBuilding && !formData.magicSystem && formData.locations.length === 0 && formData.factions.length === 0 && formData.lore.length === 0) { alert(t('setup.universe.noDataToSave')); return; } const universeName = prompt(t('setup.universe.enterNamePrompt')); if (universeName) { const newUniverse: Universe = { id: crypto.randomUUID(), language: contentLanguage, name: universeName, description: t('setup.universe.defaultDescription', { title: formData.title }), locations: formData.locations, factions: formData.factions, lore: formData.lore, magicSystem: formData.magicSystem, worldBuilding: formData.worldBuilding, races: formData.races, creatures: formData.creatures, powers: formData.powers, items: formData.items, technology: formData.technology, history: formData.history, cultures: formData.cultures }; onSaveAsUniverse(newUniverse); alert(t('setup.universe.saveSuccess', { name: universeName })); } };
  const handleSelectUniverse = (universe: Universe | null) => { const genIds = (arr: LoreEntry[]) => (arr || []).map(l => ({...l, id: crypto.randomUUID()})); if (universe) { setFormData(prev => ({ ...prev, universeId: universe.id, universeName: universe.name, locations: genIds(universe.locations), factions: genIds(universe.factions), lore: genIds(universe.lore), races: genIds(universe.races), creatures: genIds(universe.creatures), powers: genIds(universe.powers), items: genIds(universe.items), technology: genIds(universe.technology), history: genIds(universe.history), cultures: genIds(universe.cultures), magicSystem: universe.magicSystem, worldBuilding: universe.worldBuilding, disguiseRealWorldNames: false, })); } else { setFormData(prev => ({ ...prev, universeId: null, universeName: contentLanguage === 'id' ? 'Dunia Kustom' : 'Custom World', locations: [], factions: [], lore: [], races:[], creatures:[], powers:[], items:[], technology:[], history:[], cultures:[], magicSystem: '', worldBuilding: '', disguiseRealWorldNames: false, })); } setShowUniverseModal(false); };
  const handleRealWorldSelect = () => { setFormData(prev => ({ ...prev, universeId: null, universeName: 'Real World', locations: [], factions: [], lore: [], races:[], creatures:[], powers:[], items:[], technology:[], history:[], cultures:[], magicSystem: '', worldBuilding: '', disguiseRealWorldNames: disguiseNames, })); setShowUniverseModal(false); };

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

  // --- DnD Handlers for Plot Points ---
  const handlePlotPointDragStart = (e: React.DragEvent, actIndex: number, ppIndex: number) => {
      setDraggedPlotPoint({ actIndex, ppIndex });
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", JSON.stringify({ actIndex, ppIndex }));
  };

  const handlePlotPointDragOver = (e: React.DragEvent, actIndex: number, ppIndex: number) => {
      e.preventDefault();
      if (!draggedPlotPoint || (draggedPlotPoint.actIndex === actIndex && draggedPlotPoint.ppIndex === ppIndex)) return;
      if (draggedPlotPoint.actIndex !== actIndex) return; // Only allow sort within same act for now
      
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
  const TABS = [{ id: 'basic', label: 'setup.tabs.basic' }, { id: 'world', label: 'setup.tabs.world' }, { id: 'characters', label: 'setup.tabs.characters' }, { id: 'arc', label: 'setup.tabs.arc' }, { id: 'tone', label: 'setup.tabs.tone' }];

  return (
    <div className="w-full p-4">
      {/* ... (Keep AutoBuildModal and Universe Modal - logic unchanged) ... */}
      {isAutoBuilding && <AutoBuildModal progress={buildProgress} steps={completedSteps} onClose={() => setIsAutoBuilding(false)} error={error} />}
      {showUniverseModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            {/* ... Modal content simplified for brevity, logic remains ... */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-w-4xl w-full p-6 space-y-6 flex flex-col max-h-[90vh]">
                <h2 className="text-2xl font-bold text-indigo-400 flex-shrink-0">{t('setup.universe.modalTitle')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-shrink-0">
                    <button onClick={() => handleSelectUniverse(null)} className="text-center p-6 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-600 hover:border-indigo-500 transition-all flex flex-col items-center justify-center">
                        <PencilIcon className="w-8 h-8 mb-2 text-slate-400" />
                        <h3 className="font-bold text-slate-100">{t('setup.universe.blankCanvas')}</h3>
                        <p className="text-sm text-slate-400 mt-1">{t('setup.universe.blankCanvasDesc')}</p>
                    </button>
                    <div className="text-center p-6 bg-slate-700 rounded-lg border border-slate-600 flex flex-col items-center justify-between">
                       <div> <GlobeIcon className="w-8 h-8 mb-2 text-slate-400 mx-auto" /> <h3 className="font-bold text-slate-100">{t('setup.universe.realWorld')}</h3> <p className="text-sm text-slate-400 mt-1">{t('setup.universe.realWorldDesc')}</p> </div>
                       <div className="mt-4 space-y-3 w-full"> <label className="flex items-center justify-center text-xs text-slate-300 gap-2 cursor-pointer"> <input type="checkbox" checked={disguiseNames} onChange={(e) => setDisguiseNames(e.target.checked)} className="form-checkbox h-4 w-4 text-indigo-600 bg-slate-600 border-slate-500 rounded focus:ring-indigo-500"/> <span>{t('setup.universe.disguiseNames')}</span> </label> <button onClick={handleRealWorldSelect} className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-500 transition-colors">{t('common.confirm')}</button> </div>
                    </div>
                     <div className="text-center p-6 bg-slate-700 rounded-lg border border-slate-600 flex flex-col items-center justify-center"> <DatabaseIcon className="w-8 h-8 mb-2 text-slate-400" /> <h3 className="font-bold text-slate-100">{t('setup.universe.fromLibrary')}</h3> <p className="text-sm text-slate-400 mt-1">{t('setup.universe.fromLibraryDesc')}</p> </div>
                </div>
                {sortedUniverseLibrary.length > 0 && (
                     <div className="flex-grow overflow-y-auto -mx-2 px-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sortedUniverseLibrary.map(uni => (
                                <button key={uni.id} onClick={() => handleSelectUniverse(uni)} className="relative text-left p-3 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-600 hover:border-indigo-500 transition-all group">
                                    <p className="font-semibold text-indigo-300 truncate pr-8">{uni.name}</p>
                                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{uni.description}</p>
                                    <button onClick={(e) => { e.stopPropagation(); onToggleUniverseFavorite(uni.id); }} className="absolute top-2 right-2 p-1 rounded-full bg-slate-800/20 text-slate-400 hover:text-amber-400 opacity-50 group-hover:opacity-100 transition-all" title={uni.isFavorite ? "Remove from favorites" : "Add to favorites"} > <StarIcon className="w-4 h-4" filled={!!uni.isFavorite} /> </button>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {onCancel && <button type="button" onClick={onCancel} className="text-sm text-slate-400 hover:text-slate-200 absolute top-4 right-4">{t('common.cancel')}</button>}
            </div>
        </div>
      )}

      {/* --- MAIN FORM CONTENT --- */}
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-100">{isEditing ? t('setup.titleEdit') : t('setup.titleCreate')}</h2>
            <p className="text-slate-400 mt-2">{isEditing ? t('setup.subtitleEdit') : t('setup.subtitleCreate')}</p>
        </div>
        
        {error && !isAutoBuilding && <div className="bg-red-900/50 border border-red-800 text-red-200 p-3 rounded-md mb-6 text-center"><strong>{t('common.failed')}:</strong> {error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
            {!isEditing && (
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-4">
                        <h3 className="text-xl font-bold text-indigo-400">{t('setup.spark.title')}</h3>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-700 p-1">
                            <button type="button" onClick={() => setContentLanguage('en')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${ contentLanguage === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-600' }`}> English </button>
                            <button type="button" onClick={() => setContentLanguage('id')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${ contentLanguage === 'id' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-600' }`}> Indonesia </button>
                        </div>
                    </div>
                     <FormField label={t('setup.spark.ideaLabel')} name="initialIdea" value={initialIdea} onChange={(e) => setInitialIdea(e.target.value)} isTextArea fullWidth />
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">{t('setup.spark.genreLabel')}</label>
                        <div className="flex flex-wrap gap-2"> {GENRES.map(genre => ( <label key={genre.value} className="flex items-center space-x-2 cursor-pointer bg-slate-700 px-3 py-1 rounded-full text-sm hover:bg-slate-600 transition-colors" title={genre.description}> <input type="checkbox" checked={formData.genres.includes(genre.value)} onChange={() => handleGenreChange(genre.value)} className="form-checkbox h-4 w-4 text-indigo-600 bg-slate-600 border-slate-500 rounded focus:ring-indigo-500"/> <span>{genre.label}</span> </label> ))} </div>
                        <input type="text" name="otherGenre" value={formData.otherGenre} onChange={handleChange} placeholder={t('setup.spark.otherGenrePlaceholder')} className="mt-3 w-full bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition" />
                    </div>
                </div>
            )}
            
            <div className="border-b border-slate-700 flex space-x-1 sticky top-[72px] bg-slate-900 z-10 py-1 -mx-2 px-2 overflow-x-auto whitespace-nowrap scrollbar-hide w-full flex-nowrap">
              {TABS.map(tab => ( <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${ activeTab === tab.id ? 'bg-slate-800 border-slate-700 border-b-0 border-l border-r border-t text-indigo-400' : 'bg-transparent text-slate-400 hover:bg-slate-800/60' }`} > {t(tab.label)} </button>))}
            </div>
            
            <div className="pt-4">
            {activeTab === 'basic' && <FormSection title={t('setup.tabs.basic')} onGenerate={() => handleGenerate('basic')} generateDisabled={!isBasicInfoReady && !isEditing} isGenerating={generatingSection === 'basic'} actions={ !isEditing && ( <button type="button" onClick={handleAutoBuild} disabled={isAutoBuilding || !isBasicInfoReady} className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-white rounded-md transition-all ${ isBasicInfoReady ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30 animate-pulse' : 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600' }`} title={isBasicInfoReady ? t('setup.autoBuild.buttonDesc') : "Please enter an idea and select a genre first."} > <BoltIcon className="w-4 h-4" /> {t('setup.autoBuild.button')} </button> ) } > 
                <FormField label={t('setup.basic.title')} name="title" value={formData.title} onChange={handleChange} fullWidth/>
                <div className="col-span-1 md:col-span-2"> <label className="block text-sm font-medium text-slate-300 mb-2">{t('setup.basic.format')}</label> <div className="flex flex-col md:flex-row gap-4"> {STORY_FORMATS.map((fmt) => ( <label key={fmt.value} className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all ${formData.format === fmt.value ? 'bg-indigo-900/40 border-indigo-500' : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'}`}> <div className="flex items-center gap-3"> <input type="radio" name="format" value={fmt.value} checked={formData.format === fmt.value} onChange={handleChange} className="text-indigo-600 focus:ring-indigo-500 bg-slate-700 border-slate-500"/> <div><div className="font-bold text-slate-200">{fmt.label}</div><div className="text-xs text-slate-400 mt-0.5">{fmt.defaultChapters} Chaps • {fmt.defaultWords} Words</div></div> </div> </label> ))} </div> <p className="text-xs text-slate-400 mt-2">{t('setup.basic.formatDesc')}</p> </div>
                <FormField label={t('setup.basic.setting')} name="setting" value={formData.setting} onChange={handleChange} isTextArea fullWidth placeholder={t('setup.basic.settingPlaceholder')}/> 
                <FormField label={t('setup.basic.totalChapters')} name="totalChapters" value={formData.totalChapters} onChange={handleChange} /> 
                <FormField label={t('setup.basic.wordsPerChapter')} name="wordsPerChapter" value={formData.wordsPerChapter} onChange={handleChange} /> 
            </FormSection>}
            
            {activeTab === 'world' && (
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-600 pb-2"> <h3 className="text-xl font-bold text-indigo-400">{t('setup.tabs.world')}</h3> <button type="button" onClick={handleSaveAsUniverse} className="flex items-center gap-2 px-3 py-1 text-sm font-semibold text-slate-300 bg-slate-700/50 rounded-md border border-slate-600 hover:bg-slate-700"><DatabaseIcon className="w-4 h-4" /> {t('setup.universe.saveToLibrary')}</button> </div>
                    <div className="flex space-x-2 bg-slate-900/50 p-1 rounded-md mb-4 overflow-x-auto whitespace-nowrap no-scrollbar"> <button type="button" onClick={() => setActiveWorldTab('geo')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex-shrink-0 ${activeWorldTab === 'geo' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>{t('world.subTabs.geo')}</button> <button type="button" onClick={() => setActiveWorldTab('nature')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex-shrink-0 ${activeWorldTab === 'nature' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>{t('world.subTabs.nature')}</button> <button type="button" onClick={() => setActiveWorldTab('power')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex-shrink-0 ${activeWorldTab === 'power' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>{t('world.subTabs.power')}</button> <button type="button" onClick={() => setActiveWorldTab('history')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex-shrink-0 ${activeWorldTab === 'history' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>{t('world.subTabs.history')}</button> </div>
                    <div className="space-y-4">
                        {activeWorldTab === 'geo' && ( <> <div className="flex justify-end"><GenerateButton onClick={() => handleGenerate('worldLore')} disabled={!isWorldLoreReadyForGen} isLoading={generatingSection === 'worldLore'} label={t('common.generateWithAi')}/></div> {showWorldBuilding && <FormField label={t('setup.world.worldBuilding')} name="worldBuilding" value={formData.worldBuilding || ''} onChange={handleChange} isTextArea onGenerate={() => handleGenerate('worldBuilding')} isGenerating={generatingSection === 'worldBuilding'} />} <LoreListEditor listTitle={t('setup.lore.locations')} entries={formData.locations} onLoreChange={(i, f, v) => handleLoreChange('locations', i, f, v)} onAdd={() => addLoreEntry('locations')} onRemove={(i) => removeLoreEntry('locations', i)}/> <LoreListEditor listTitle={t('setup.lore.factions')} entries={formData.factions} onLoreChange={(i, f, v) => handleLoreChange('factions', i, f, v)} onAdd={() => addLoreEntry('factions')} onRemove={(i) => removeLoreEntry('factions', i)}/> <LoreListEditor listTitle={t('setup.lore.general')} entries={formData.lore} onLoreChange={(i, f, v) => handleLoreChange('lore', i, f, v)} onAdd={() => addLoreEntry('lore')} onRemove={(i) => removeLoreEntry('lore', i)}/> </> )}
                        {activeWorldTab === 'nature' && ( <> <div className="flex justify-end"><GenerateButton onClick={() => handleGenerate('world_nature')} disabled={!isWorldLoreReadyForGen} isLoading={generatingSection === 'world_nature'} label={t('common.generateWithAi')}/></div> <LoreListEditor listTitle={t('setup.lore.races')} entries={formData.races} onLoreChange={(i, f, v) => handleLoreChange('races', i, f, v)} onAdd={() => addLoreEntry('races')} onRemove={(i) => removeLoreEntry('races', i)}/> <LoreListEditor listTitle={t('setup.lore.creatures')} entries={formData.creatures} onLoreChange={(i, f, v) => handleLoreChange('creatures', i, f, v)} onAdd={() => addLoreEntry('creatures')} onRemove={(i) => removeLoreEntry('creatures', i)}/> </> )}
                        {activeWorldTab === 'power' && ( <> <div className="flex justify-end"><GenerateButton onClick={() => handleGenerate('world_power')} disabled={!isWorldLoreReadyForGen} isLoading={generatingSection === 'world_power'} label={t('common.generateWithAi')}/></div> {showMagicSystem && <FormField label={t('setup.world.magicSystem')} name="magicSystem" value={formData.magicSystem || ''} onChange={handleChange} isTextArea onGenerate={() => handleGenerate('magicSystem')} isGenerating={generatingSection === 'magicSystem'} />} <LoreListEditor listTitle={t('setup.lore.powers')} entries={formData.powers} onLoreChange={(i, f, v) => handleLoreChange('powers', i, f, v)} onAdd={() => addLoreEntry('powers')} onRemove={(i) => removeLoreEntry('powers', i)}/> <LoreListEditor listTitle={t('setup.lore.items')} entries={formData.items} onLoreChange={(i, f, v) => handleLoreChange('items', i, f, v)} onAdd={() => addLoreEntry('items')} onRemove={(i) => removeLoreEntry('items', i)}/> <LoreListEditor listTitle={t('setup.lore.technology')} entries={formData.technology} onLoreChange={(i, f, v) => handleLoreChange('technology', i, f, v)} onAdd={() => addLoreEntry('technology')} onRemove={(i) => removeLoreEntry('technology', i)}/> </> )}
                        {activeWorldTab === 'history' && ( <> <div className="flex justify-end"><GenerateButton onClick={() => handleGenerate('world_history')} disabled={!isWorldLoreReadyForGen} isLoading={generatingSection === 'world_history'} label={t('common.generateWithAi')}/></div> <LoreListEditor listTitle={t('setup.lore.history')} entries={formData.history} onLoreChange={(i, f, v) => handleLoreChange('history', i, f, v)} onAdd={() => addLoreEntry('history')} onRemove={(i) => removeLoreEntry('history', i)}/> <LoreListEditor listTitle={t('setup.lore.cultures')} entries={formData.cultures} onLoreChange={(i, f, v) => handleLoreChange('cultures', i, f, v)} onAdd={() => addLoreEntry('cultures')} onRemove={(i) => removeLoreEntry('cultures', i)}/> </> )}
                    </div>
                </div>
            )}

            {activeTab === 'characters' && <FormSection title={t('setup.tabs.characters')} onGenerate={() => handleGenerate('core')} generateDisabled={!isBasicInfoComplete} isGenerating={generatingSection === 'core'} grid={false}>
                <FormField label={t('setup.characters.mainPlot')} name="mainPlot" value={formData.mainPlot} onChange={handleChange} isTextArea onGenerate={() => handleGenerate('mainPlot')} isGenerating={generatingSection === 'mainPlot'} />
                <h3 className="text-lg font-semibold text-slate-300 mt-4 border-t border-slate-700 pt-4">{t('setup.characters.characters')}</h3>
                <div className="flex flex-col md:flex-row gap-4 bg-slate-900/50 p-2 rounded-lg border border-slate-700 min-h-[600px]">
                    <div className="w-full md:w-1/3 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-slate-700 pb-4 md:pb-0 md:pr-2">
                        <div className="md:hidden flex overflow-x-auto whitespace-nowrap gap-2 pb-2 no-scrollbar"> {formData.characters?.map((char, index) => ( <button key={char.id} type="button" onClick={() => setActiveCharacterIndex(index)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all flex-shrink-0 border ${activeCharacterIndex === index ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300'}`} > <UserIcon className="w-4 h-4" /> {char.name || `Character ${index + 1}`} </button> ))} <button type="button" onClick={addCharacter} className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-700 text-slate-400 hover:bg-indigo-600 hover:text-white transition-colors flex-shrink-0" title={t('setup.characters.add')}> <PlusIcon className="w-5 h-5" /> </button> </div>
                        <div className="hidden md:flex flex-col gap-2 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar"> {formData.characters?.map((char, index) => ( <div key={char.id} onClick={() => setActiveCharacterIndex(index)} className={`group p-3 rounded-lg cursor-pointer border transition-all ${activeCharacterIndex === index ? 'bg-indigo-900/30 border-indigo-500' : 'bg-slate-700/50 border-transparent hover:bg-slate-700 hover:border-slate-600'}`} > <div className="flex justify-between items-center"> <div className="flex items-center gap-3 overflow-hidden"> <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activeCharacterIndex === index ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-slate-400'}`}> <UserIcon className="w-4 h-4" /> </div> <div className="min-w-0"> <p className={`font-bold truncate text-sm ${activeCharacterIndex === index ? 'text-indigo-200' : 'text-slate-300'}`}> {char.name || t('setup.characters.newCharacter')} </p> <p className="text-xs text-slate-500 truncate"> {char.roles.length > 0 ? char.roles.join(', ') : 'No Role'} </p> </div> </div> <button type="button" onClick={(e) => { e.stopPropagation(); if (window.confirm("Are you sure you want to delete this character?")) removeCharacter(index); }} className={`p-2 rounded-full hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-all ${activeCharacterIndex === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} title={t('setup.characters.delete')} > <TrashIcon className="w-4 h-4" /> </button> </div> </div> ))} <button type="button" onClick={addCharacter} className="w-full py-3 border-2 border-dashed border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700/50 hover:border-slate-500 hover:text-indigo-300 transition-all flex items-center justify-center gap-2 mt-2" > <PlusIcon className="w-5 h-5" /> <span>{t('setup.characters.add')}</span> </button> </div>
                    </div>
                    <div className="w-full md:w-2/3 pl-0 md:pl-2 overflow-y-auto custom-scrollbar max-h-[600px]"> {formData.characters.length > 0 && formData.characters[activeCharacterIndex] ? ( <CharacterForm key={formData.characters[activeCharacterIndex].id} character={formData.characters[activeCharacterIndex]} index={activeCharacterIndex} onCharacterChange={handleCharacterChange} onRemoveCharacter={removeCharacter} onGenerateCharacter={handleGenerate.bind(null, 'character')} isGenerating={generatingSection === `character_${activeCharacterIndex}`} /> ) : ( <div className="h-full flex flex-col items-center justify-center text-slate-500"> <p>{t('setup.characters.relationshipsNeed2')}</p> <button type="button" onClick={addCharacter} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">{t('setup.characters.add')}</button> </div> )} </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center mt-4 border-t border-slate-700 pt-4"> <h3 className="text-lg font-semibold text-slate-300">{t('setup.characters.relationships')}</h3> {allCharacters.length >= 2 && ( <button type="button" onClick={() => handleGenerate('relationships')} disabled={!!generatingSection} className="flex items-center justify-center gap-2 px-3 py-1 text-sm font-semibold text-indigo-300 bg-slate-700/50 rounded-md border border-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all" > {generatingSection === 'relationships' ? <><SpinnerIcon className="w-4 h-4" />{t('common.generating')}</> : <><SparklesIcon className="w-4 h-4" />{t('setup.characters.generateRelationships')}</>} </button> )} </div>
                    {allCharacters.length < 2 ? ( <p className="text-sm text-slate-400 text-center">{t('setup.characters.relationshipsNeed2')}</p> ) : ( <div className="space-y-4"> {formData.relationships?.map((rel, index) => ( <div key={rel.id} className="p-3 bg-slate-700/50 rounded-md space-y-2 relative"> <div className="flex items-center gap-2"> <select value={rel.character1Id} onChange={(e) => handleRelationshipChange(index, 'character1Id', e.target.value)} className="w-full bg-slate-600 text-slate-200 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"> <option value="">{t('setup.characters.character1')}</option> {allCharacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)} </select> <span className="text-slate-400">&</span> <select value={rel.character2Id} onChange={(e) => handleRelationshipChange(index, 'character2Id', e.target.value)} className="w-full bg-slate-600 text-slate-200 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"> <option value="">{t('setup.characters.character2')}</option> {allCharacters.filter(c => c.id !== rel.character1Id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)} </select> <button type="button" onClick={() => removeRelationship(index)} className="p-1.5 text-slate-400 hover:text-rose-400"><TrashIcon className="w-4 h-4" /></button> </div> <input type="text" placeholder={t('setup.characters.relationshipType')} value={rel.type} onChange={(e) => handleRelationshipChange(index, 'type', e.target.value)} className="w-full bg-slate-600 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-500" /> <textarea placeholder={t('common.description')} value={rel.description} onChange={(e) => handleRelationshipChange(index, 'description', e.target.value)} rows={2} className="w-full bg-slate-600 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-500" /> </div> ))} <button type="button" onClick={addRelationship} className="w-full py-2 px-4 border-2 border-dashed border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700">{t('setup.characters.addRelationship')}</button> </div> )}
                </div>
            </FormSection>}
            {activeTab === 'arc' && <FormSection title={t('setup.tabs.arc')} grid={false} onGenerate={() => handleGenerate('arc')} generateDisabled={!isCoreStoryComplete} isGenerating={generatingSection === 'arc'}> 
                {formData.storyArc?.map((act, index) => ( 
                    <div key={index} className="p-4 bg-slate-700/50 rounded-md relative space-y-4 border border-slate-600/50"> 
                        <div className="flex items-center justify-between"> 
                            <input type="text" value={act.title} onChange={(e) => handleArcChange(index, 'title', e.target.value)} placeholder={t('setup.arc.actTitlePlaceholder')} className="flex-grow bg-slate-600 font-bold text-slate-100 placeholder-slate-400 rounded-md p-2 border border-slate-500" /> 
                            <div className="flex items-center ml-2"> 
                                <SubGenerateButton onClick={() => handleGenerate('singleArcAct', index)} isLoading={generatingSection === `singleArcAct_${index}`} title={t('setup.arc.generateAct', { index: index + 1 })} /> 
                                {formData.storyArc.length > 1 && (<button type="button" onClick={() => handleRemoveAct(index)} className="p-1 text-slate-400 hover:text-red-500 ml-1"><TrashIcon className="w-4 h-4" /></button>)} 
                            </div> 
                        </div> 
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-800/50 p-3 rounded-md">
                            <div> <label className="block text-xs font-medium text-slate-400 mb-1">{t('setup.arc.start')}</label> <input type="number" value={act.startChapter || ''} onChange={(e) => handleArcChange(index, 'startChapter', e.target.value)} placeholder="#" className="w-full bg-slate-700 text-slate-200 text-sm rounded-md p-1.5 border border-slate-600" /> </div>
                            <div> <label className="block text-xs font-medium text-slate-400 mb-1">{t('setup.arc.end')}</label> <input type="number" value={act.endChapter || ''} onChange={(e) => handleArcChange(index, 'endChapter', e.target.value)} placeholder="#" className="w-full bg-slate-700 text-slate-200 text-sm rounded-md p-1.5 border border-slate-600" /> </div>
                            <div className="lg:col-span-2"> <label className="block text-xs font-medium text-slate-400 mb-1">{t('setup.arc.template')}</label> <select value={act.structureTemplate || 'freestyle'} onChange={(e) => handleArcChange(index, 'structureTemplate', e.target.value)} className="w-full bg-slate-700 text-slate-200 text-sm rounded-md p-1.5 border border-slate-600 focus:outline-none focus:border-indigo-500"> {STRUCTURE_TEMPLATES.map(tmp => <option key={tmp.value} value={tmp.value}>{tmp.label}</option>)} </select> </div>
                        </div>
                        <textarea value={act.description} onChange={(e) => handleArcChange(index, 'description', e.target.value)} rows={2} placeholder={t('setup.arc.actDescPlaceholder')} className="w-full bg-slate-600 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-500" /> 
                        <div className="pl-4 border-l-2 border-slate-600 space-y-2"> 
                            <h5 className="text-sm font-medium text-slate-300">{t('setup.arc.plotPoints')}</h5> 
                            {act.plotPoints?.map((pp, ppIndex) => ( 
                                <div 
                                    key={pp.id} 
                                    className={`flex items-center gap-2 transition-all ${
                                        draggedPlotPoint?.actIndex === index && draggedPlotPoint?.ppIndex === ppIndex ? 'opacity-50' : ''
                                    } ${dropTargetPlotPoint?.actIndex === index && dropTargetPlotPoint?.ppIndex === ppIndex ? 'border-b-2 border-indigo-500' : ''}`}
                                    draggable
                                    onDragStart={(e) => handlePlotPointDragStart(e, index, ppIndex)}
                                    onDragOver={(e) => handlePlotPointDragOver(e, index, ppIndex)}
                                    onDrop={(e) => handlePlotPointDrop(e, index, ppIndex)}
                                > 
                                    <div className="cursor-grab text-slate-500 hover:text-slate-300">
                                        <GripVerticalIcon className="w-4 h-4" />
                                    </div>
                                    <input type="text" value={pp.summary} onChange={(e) => handlePlotPointChange(index, ppIndex, e.target.value)} placeholder={t('common.summary')} className="w-full bg-slate-600/70 text-sm p-1.5 border border-slate-500/50 rounded-md" /> 
                                    <button type="button" onClick={() => removePlotPoint(index, ppIndex)} className="p-1 text-slate-500 hover:text-rose-400"><TrashIcon className="w-3 h-3" /></button> 
                                </div> 
                            ))} 
                            <button type="button" onClick={() => addPlotPoint(index)} className="w-full text-xs py-1 px-2 border-2 border-dashed border-slate-600 text-slate-400 rounded-md hover:bg-slate-600/50 flex items-center justify-center gap-1"><PlusIcon className="w-3 h-3" />{t('setup.arc.addPoint')}</button> 
                        </div> 
                    </div> 
                ))} 
                <button type="button" onClick={handleAddAct} className="w-full py-2 px-4 border-2 border-dashed border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700">{t('setup.arc.addAct')}</button> 
            </FormSection>}
            {activeTab === 'tone' && <FormSection title={t('setup.tabs.tone')} onGenerate={() => handleGenerate('tone')} generateDisabled={!isStoryArcComplete} isGenerating={generatingSection === 'tone'}> 
                {/* ... Tone fields ... */}
                <div><FormField label={t('setup.tone.comedy')} name="comedyLevel" value={formData.comedyLevel} onChange={handleChange} /><p className="text-xs text-slate-400 mt-1">{t('setup.tone.comedyDesc')}</p></div> 
                <div><FormField label={t('setup.tone.romance')} name="romanceLevel" value={formData.romanceLevel} onChange={handleChange} /><p className="text-xs text-slate-400 mt-1">{t('setup.tone.romanceDesc')}</p></div> 
                <div><FormField label={t('setup.tone.action')} name="actionLevel" value={formData.actionLevel} onChange={handleChange} /><p className="text-xs text-slate-400 mt-1">{t('setup.tone.actionDesc')}</p></div> 
                {showMaturityLevel && (<div><FormField label={t('setup.tone.maturity')} name="maturityLevel" value={formData.maturityLevel} onChange={handleChange} /><p className="text-xs text-slate-400 mt-1">{t('setup.tone.maturityDesc')}</p></div>)} 
                <div className="col-span-1 md:col-span-2"> <label htmlFor="narrativePerspective" className="block text-sm font-medium text-slate-300 mb-1">{t('setup.tone.pov')}</label> <select id="narrativePerspective" name="narrativePerspective" value={formData.narrativePerspective} onChange={handleChange} className="w-full bg-slate-700 text-slate-200 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"> {NARRATIVE_PERSPECTIVES.map(pov => <option key={pov.value} value={pov.value}>{pov.value}</option>)} </select> <p className="text-xs text-slate-400 mt-1">{t('setup.tone.povDesc')}</p> </div>
                <div className="col-span-1 md:col-span-2"> <label htmlFor="proseStyle" className="block text-sm font-medium text-slate-300 mb-1">{t('setup.tone.prose')}</label> <div className="flex items-center gap-2"> <select id="proseStyle" name="proseStyle" value={formData.proseStyle} onChange={handleChange} className="w-full bg-slate-700 text-slate-200 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"> {PROSE_STYLES.map(style => <option key={style.value} value={style.value}>{style.value}</option>)} </select> <button type="button" onClick={handleGenerateStyleExample} disabled={isGeneratingExample} className="px-3 py-2 text-sm bg-slate-600 hover:bg-slate-500 rounded-md whitespace-nowrap disabled:opacity-50 flex items-center justify-center"> {isGeneratingExample ? <SpinnerIcon className="w-5 h-5"/> : t('setup.tone.showExample')} </button> </div> {styleExample && <p className="text-xs text-slate-400 mt-2 bg-slate-700/50 p-2 rounded-md border border-slate-600">"{styleExample}"</p>} </div>
                <div className="col-span-1 md:col-span-2"> <label htmlFor="customProseStyleByExample" className="block text-sm font-medium text-slate-300 mb-1">{t('setup.tone.customStyleTitle')}</label> <textarea id="customProseStyleByExample" name="customProseStyleByExample" value={formData.customProseStyleByExample || ''} onChange={handleChange} rows={6} placeholder={t('setup.tone.customStylePlaceholder', { maxChars: MAX_CUSTOM_STYLE_CHARS })} className="w-full bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200" /> <div className="flex justify-between items-center text-xs text-slate-400 mt-1"> <p>{t('setup.tone.customStyleOverride')}</p> <span>{(formData.customProseStyleByExample || '').length} / {MAX_CUSTOM_STYLE_CHARS}</span> </div> </div>
            </FormSection>}
            </div>

            <div className="flex justify-center items-center gap-4 pt-4">
                {onCancel && (<button type="button" onClick={onCancel} className="text-slate-400 font-bold py-3 px-8 rounded-lg hover:bg-slate-700 transition-colors">{t('common.cancel')}</button>)}
                <button type="submit" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-600/30" disabled={!isStoryArcComplete && !isEditing} title={!isStoryArcComplete && !isEditing ? t('setup.submitDisabledTooltip') : (isEditing ? t('setup.submitButtonEdit') : t('setup.submitButtonCreate'))}>
                    {isEditing ? t('setup.submitButtonEdit') : t('setup.submitButtonCreate')}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default StoryEncyclopediaSetup;