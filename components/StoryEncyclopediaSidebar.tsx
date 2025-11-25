import React, { useMemo, useState, useEffect } from 'react';
import { StoryEncyclopedia, Character, Relationship, Chapter, LoreEntry } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { PencilIcon } from './icons/PencilIcon';
import { LayoutDashboardIcon } from './icons/LayoutDashboardIcon';
import { FilePlusIcon } from './icons/FilePlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { GripVerticalIcon } from './icons/GripVerticalIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface StoryEncyclopediaSidebarProps {
  storyEncyclopedia: StoryEncyclopedia;
  onEdit: () => void;
  onGoToDashboard: () => void;
  activeChapterId: string;
  onSelectChapter: (chapterId: string) => void;
  onAddChapter: () => void;
  onDeleteChapter: (chapterId: string) => void;
  onExportStory: (storyId: string) => void;
  onReorderChapters: (chapters: Chapter[]) => void;
  onOpenSearch: () => void;
}

// --- COLLAPSIBLE SECTION COMPONENT ---
interface CollapsibleSectionProps {
    id: string;
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: (id: string) => void;
    noPadding?: boolean;
    count?: number;
    subHeader?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ id, title, children, isOpen, onToggle, noPadding = false, count, subHeader = false }) => {
    return (
        <div className="mb-1">
            <button 
                onClick={() => onToggle(id)} 
                className={`w-full flex items-center justify-between p-2 rounded-md transition-colors group ${
                    subHeader 
                    ? 'hover:bg-slate-700/30 text-slate-400' 
                    : 'bg-slate-900/30 hover:bg-slate-800 text-indigo-300'
                }`}
            >
                <div className="flex items-center gap-2">
                    <ChevronRightIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                    <span className={`font-bold uppercase tracking-wider ${subHeader ? 'text-xs' : 'text-xs'}`}>{title}</span>
                </div>
                {count !== undefined && (
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-mono">{count}</span>
                )}
            </button>
            
            {isOpen && (
                <div className={`animate-in slide-in-from-top-2 duration-200 ${noPadding ? 'pt-1' : 'p-2 bg-slate-800/20 rounded-b-md'}`}>
                    <div className="space-y-3 text-sm text-slate-300">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoPair: React.FC<{ label: string; value?: string | null | string[] }> = ({ label, value }) => {
    if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) return null;
    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    return (
        <div>
            <p className="font-semibold text-slate-200 text-xs uppercase tracking-wide opacity-70">{label}</p>
            <p className="text-slate-400 whitespace-pre-wrap text-sm leading-relaxed">{displayValue}</p>
        </div>
    );
};

const CharacterProfile: React.FC<{ character: Character }> = ({ character }) => {
    if (!character || !character.name) return null;
    const { t } = useLanguage();
    return (
        <div className="bg-slate-800/80 p-3 rounded-md space-y-2 border border-slate-700/50 hover:border-slate-600 transition-colors">
            <h4 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block"></span>
                {character.name}
            </h4>
            <InfoPair label={t('sidebar.character.roles')} value={character.roles} />
            <InfoPair label={t('sidebar.character.age')} value={character.age} />
            <InfoPair label={t('sidebar.character.gender')} value={character.gender} />
            <InfoPair label={t('sidebar.character.physical')} value={character.physicalDescription} />
            <InfoPair label={t('sidebar.character.traits')} value={character.personalityTraits} />
            <InfoPair label={t('sidebar.character.goal')} value={character.goal} />
            <InfoPair label={t('sidebar.character.conflict')} value={character.conflict} />
        </div>
    );
};

const RelationshipDisplay: React.FC<{ relationship: Relationship; characters: Character[] }> = ({ relationship, characters }) => {
    const { character1Id, character2Id, type, description } = relationship;
    const char1 = characters.find(c => c.id === character1Id);
    const char2 = characters.find(c => c.id === character2Id);
    if (!char1 || !char2 || !type) return null;
    return (
        <div className="p-2 border-l-2 border-slate-600 bg-slate-800/30 pl-3">
            <p className="font-semibold text-slate-200 text-xs">{char1.name} <span className="text-slate-500">&</span> {char2.name}</p>
            <p className="text-slate-400 text-sm mt-1"><span className="text-indigo-400 text-xs uppercase font-bold">[{type}]</span> {description}</p>
        </div>
    );
};

const LoreDisplay: React.FC<{entry: LoreEntry}> = ({entry}) => (
    <div className="p-2 hover:bg-slate-800/50 rounded transition-colors">
        <p className="font-bold text-slate-300 text-sm">{entry.name}</p>
        <p className="text-slate-500 text-xs line-clamp-3">{entry.description}</p>
    </div>
);

const ChapterItem: React.FC<{
    chapter: Chapter;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
    canDelete: boolean;
    t: (key: string) => string;
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    isDragging: boolean;
    isDropTarget: boolean;
}> = ({ chapter, isActive, onSelect, onDelete, canDelete, t, draggable, onDragStart, onDragOver, onDrop, isDragging, isDropTarget }) => (
    <div 
        className={`group flex items-center justify-between rounded-md transition-all pl-1 ${
            isDragging ? 'opacity-50' : ''
        } ${isDropTarget ? 'border-b-2 border-indigo-500' : 'hover:bg-slate-700/50'}`}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
    >
        <div className="flex items-center flex-grow min-w-0">
             {draggable && (
                <div className="p-2 cursor-grab text-slate-600 hover:text-slate-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVerticalIcon className="w-3 h-3" />
                </div>
             )}
            <button
                onClick={onSelect}
                className={`flex-grow text-left px-2 py-1.5 rounded-md transition-colors truncate text-sm ${isActive ? 'text-indigo-300 font-bold bg-indigo-900/20' : 'text-slate-400'}`}
            >
                <span className="truncate block w-full">{chapter.title}</span>
            </button>
        </div>
        
        {canDelete && (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="p-2 mr-1 flex-shrink-0 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title={t('sidebar.chapters.delete')}
            >
                <TrashIcon className="w-3 h-3" />
            </button>
        )}
    </div>
);

const StoryEncyclopediaSidebar: React.FC<StoryEncyclopediaSidebarProps> = ({ storyEncyclopedia, onEdit, onGoToDashboard, activeChapterId, onSelectChapter, onAddChapter, onDeleteChapter, onExportStory, onReorderChapters, onOpenSearch }) => {
  const displayGenre = [...(storyEncyclopedia.genres || []), storyEncyclopedia.otherGenre].filter(Boolean).join(', ');
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedChapterId, setDraggedChapterId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // --- SMART MEMORY STATE ---
  // Default states: Chapters, Characters = Open. Others = Closed.
  const DEFAULT_SECTIONS = {
      'chapters': true,
      'basic_info': false,
      'core_plot': false,
      'story_arc': false,
      'characters': true,
      'relationships': false,
      'world_lore': false,
      'tone': false,
      'style': false
  };

  // Load from sessionStorage or use default
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
      try {
          const stored = sessionStorage.getItem(`sidebar_state_${storyEncyclopedia.id}`);
          return stored ? { ...DEFAULT_SECTIONS, ...JSON.parse(stored) } : DEFAULT_SECTIONS;
      } catch {
          return DEFAULT_SECTIONS;
      }
  });

  // Persistence Effect
  useEffect(() => {
      sessionStorage.setItem(`sidebar_state_${storyEncyclopedia.id}`, JSON.stringify(expandedSections));
  }, [expandedSections, storyEncyclopedia.id]);

  const toggleSection = (id: string) => {
      setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isSearching = searchQuery.trim().length > 0;

  // Helper to determine if a section should be open (Memory vs Search Override)
  const isSectionOpen = (id: string) => isSearching || expandedSections[id];

  // --- Filtering Logic ---
  const filteredChapters = useMemo(() => {
      if (!isSearching) return storyEncyclopedia.chapters;
      return storyEncyclopedia.chapters.filter(c => 
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          c.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [storyEncyclopedia.chapters, searchQuery, isSearching]);

  const filteredCharacters = useMemo(() => {
      if (!isSearching) return storyEncyclopedia.characters;
      return storyEncyclopedia.characters.filter(c => 
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.roles.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  }, [storyEncyclopedia.characters, searchQuery, isSearching]);

  const filterLore = (entries: LoreEntry[]) => {
      if (!isSearching) return entries;
      return entries.filter(e => 
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
  };

  // Group Chapters Logic
  const groupedChapters = useMemo(() => {
    const chapters = filteredChapters || [];
    const arcs = storyEncyclopedia.storyArc || [];
    
    if (isSearching) {
        return [{ type: 'search', id: 'search_results', title: t('sidebar.chapters.title'), chapters }];
    }

    const grouped: { type: 'act' | 'other', id: string, title: string, chapters: Chapter[], range?: string }[] = [];
    const assignedChapterIds = new Set<string>();
    const originalChapterIds = storyEncyclopedia.chapters.map(c => c.id);

    arcs.forEach((act, index) => {
        if (act.startChapter && act.endChapter) {
            const start = parseInt(act.startChapter, 10);
            const end = parseInt(act.endChapter, 10);
            if (!isNaN(start) && !isNaN(end) && start <= end) {
                const actChapterIds = originalChapterIds.slice(Math.max(0, start - 1), end);
                const actChapters = chapters.filter(c => actChapterIds.includes(c.id));
                
                if (actChapters.length > 0) {
                    actChapters.forEach(c => assignedChapterIds.add(c.id));
                    grouped.push({ 
                        type: 'act', 
                        id: `act_${index}`, // Unique ID for toggle
                        title: act.title, 
                        chapters: actChapters, 
                        range: `Ch. ${start}-${end}` 
                    });
                }
            }
        }
    });

    const unassignedChapters = chapters.filter(c => !assignedChapterIds.has(c.id));
    if (unassignedChapters.length > 0) {
        grouped.push({ type: 'other', id: 'chapters_other', title: t('sidebar.chapters.title'), chapters: unassignedChapters });
    }
    return grouped;
  }, [filteredChapters, storyEncyclopedia.chapters, storyEncyclopedia.storyArc, isSearching, t]);

  const hasItems = (arr?: any[]) => arr && arr.length > 0;

  // Drag handlers (Same as before)
  const handleDragStart = (e: React.DragEvent, id: string) => { setDraggedChapterId(id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", id); };
  const handleDragOver = (e: React.DragEvent, targetId: string) => { e.preventDefault(); if (draggedChapterId === targetId) return; setDropTargetId(targetId); e.dataTransfer.dropEffect = "move"; };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault(); setDropTargetId(null); setDraggedChapterId(null);
    if (!draggedChapterId || draggedChapterId === targetId) return;
    const allChapters = [...storyEncyclopedia.chapters];
    const sourceIndex = allChapters.findIndex(c => c.id === draggedChapterId);
    const targetIndex = allChapters.findIndex(c => c.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const [movedChapter] = allChapters.splice(sourceIndex, 1);
    allChapters.splice(targetIndex, 0, movedChapter);
    onReorderChapters(allChapters);
  };

  return (
    <aside className="w-80 lg:w-96 flex-shrink-0 bg-slate-800 border-r border-slate-700 p-4 flex flex-col h-full">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between gap-3 mb-2">
            <button onClick={onGoToDashboard} className="flex items-center gap-2 p-2 rounded-md text-slate-400 hover:bg-slate-700 hover:text-indigo-400 transition-colors" title={t('sidebar.backToDashboard')}>
              <LayoutDashboardIcon className="w-5 h-5" /> <span className="text-sm font-medium">{t('sidebar.dashboard')}</span>
            </button>
        </div>
        <div className="flex flex-col gap-3 mb-4 p-3 bg-slate-900/50 rounded-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                  <BookOpenIcon className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                  <h2 className="text-lg font-bold text-slate-200 truncate" title={storyEncyclopedia.title}>{storyEncyclopedia.title}</h2>
              </div>
              <div className="flex items-center flex-shrink-0">
                  <button onClick={() => onExportStory(storyEncyclopedia.id)} className="p-2 rounded-md text-slate-400 hover:bg-slate-700 hover:text-indigo-400 transition-colors" title={t('sidebar.exportStory')}><DownloadIcon className="w-5 h-5" /></button>
                  <button onClick={onOpenSearch} className="p-2 rounded-md text-slate-400 hover:bg-slate-700 hover:text-indigo-400 transition-colors" title={t('sidebar.searchStory')}><SearchIcon className="w-5 h-5" /></button>
                  <button onClick={onEdit} className="p-2 rounded-md text-slate-400 hover:bg-slate-700 hover:text-indigo-400 transition-colors" title={t('sidebar.editEncyclopedia')}><PencilIcon className="w-5 h-5" /></button>
              </div>
            </div>
             <div className="flex items-center gap-2 text-xs text-slate-400 border-t border-slate-700 pt-2">
                <GlobeIcon className="w-4 h-4 text-slate-500"/> <span className="font-semibold">{t('sidebar.universe')}:</span> <span className="truncate">{storyEncyclopedia.universeName}</span>
            </div>
        </div>
        <div className="mb-4">
            <input type="text" placeholder={t('sidebar.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-700 text-slate-200 placeholder-slate-400 text-sm rounded-md p-2 border border-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"/>
        </div>
      </div>

      <div className="space-y-1 overflow-y-auto flex-grow pr-1 -mr-2 custom-scrollbar">
        
        {/* --- CHAPTERS (Collapsible Hierarchical) --- */}
        <CollapsibleSection 
            id="chapters" 
            title={t('sidebar.chapters.title')} 
            isOpen={isSectionOpen('chapters')} 
            onToggle={toggleSection}
            noPadding
        >
            {groupedChapters.map((group) => (
                <div key={group.id} className="mb-1">
                    {/* Act Header (Collapsible if it's an Act group) */}
                    {group.type === 'act' ? (
                        <CollapsibleSection
                            id={group.id}
                            title={`${group.title} ${group.range ? `(${group.range})` : ''}`}
                            isOpen={isSectionOpen(group.id)}
                            onToggle={toggleSection}
                            subHeader
                            noPadding
                            count={group.chapters.length}
                        >
                            <div className="pl-2 space-y-0.5">
                                {group.chapters.map(c => (
                                    <ChapterItem 
                                        key={c.id} chapter={c} isActive={activeChapterId === c.id} onSelect={() => onSelectChapter(c.id)} onDelete={() => onDeleteChapter(c.id)} canDelete={storyEncyclopedia.chapters.length > 1} t={t} draggable={!isSearching} onDragStart={(e) => handleDragStart(e, c.id)} onDragOver={(e) => handleDragOver(e, c.id)} onDrop={(e) => handleDrop(e, c.id)} isDragging={draggedChapterId === c.id} isDropTarget={dropTargetId === c.id}
                                    />
                                ))}
                            </div>
                        </CollapsibleSection>
                    ) : (
                        // Simple list for 'Search Results' or 'Other'
                        <div className="space-y-0.5">
                            {group.type === 'other' && <h5 className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 mt-2">{group.title}</h5>}
                            {group.chapters.map(c => (
                                <ChapterItem 
                                    key={c.id} chapter={c} isActive={activeChapterId === c.id} onSelect={() => onSelectChapter(c.id)} onDelete={() => onDeleteChapter(c.id)} canDelete={storyEncyclopedia.chapters.length > 1} t={t} draggable={!isSearching} onDragStart={(e) => handleDragStart(e, c.id)} onDragOver={(e) => handleDragOver(e, c.id)} onDrop={(e) => handleDrop(e, c.id)} isDragging={draggedChapterId === c.id} isDropTarget={dropTargetId === c.id}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ))}
            {!isSearching && (
                <button onClick={onAddChapter} className="w-full flex items-center justify-center gap-2 text-xs py-2 px-4 mt-2 border border-dashed border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 hover:border-slate-500 transition-colors">
                    <FilePlusIcon className="w-3 h-3" /> {t('sidebar.chapters.add')}
                </button>
            )}
        </CollapsibleSection>

        {/* --- BASIC INFO & PLOT --- */}
        {!isSearching && (
            <>
                <CollapsibleSection id="basic_info" title={t('sidebar.basicInfo')} isOpen={isSectionOpen('basic_info')} onToggle={toggleSection}>
                    <InfoPair label={t('sidebar.genre')} value={displayGenre} />
                    <InfoPair label={t('sidebar.setting')} value={storyEncyclopedia.setting} />
                </CollapsibleSection>

                <CollapsibleSection id="core_plot" title={t('sidebar.corePlot')} isOpen={isSectionOpen('core_plot')} onToggle={toggleSection}>
                    <InfoPair label={t('sidebar.mainPlot')} value={storyEncyclopedia.mainPlot} />
                </CollapsibleSection>

                <CollapsibleSection id="story_arc" title={t('sidebar.storyArc')} isOpen={isSectionOpen('story_arc')} onToggle={toggleSection}>
                    {storyEncyclopedia.storyArc?.map((act, index) => (
                        <div key={index} className="space-y-1 mb-2 pb-2 border-b border-slate-700/50 last:border-0 last:pb-0">
                            <p className="font-bold text-slate-200 text-xs">{act.title}</p>
                            <p className="text-slate-400 italic text-xs mb-1 line-clamp-2" title={act.description}>{act.description}</p>
                            {act.plotPoints && act.plotPoints.length > 0 && (
                                <ul className="list-disc list-inside text-[10px] text-slate-500 pl-1">
                                    {act.plotPoints?.slice(0, 3).map(pp => <li key={pp.id} className="truncate">{pp.summary}</li>)}
                                    {act.plotPoints.length > 3 && <li>... (+{act.plotPoints.length - 3})</li>}
                                </ul>
                            )}
                        </div>
                    ))}
                </CollapsibleSection>
            </>
        )}

        {/* --- CHARACTERS --- */}
        <CollapsibleSection id="characters" title={t('sidebar.characters')} isOpen={isSectionOpen('characters')} onToggle={toggleSection} count={filteredCharacters.length} noPadding>
            {filteredCharacters.map((char) => (
                <div key={char.id} className="mb-2 px-2"><CharacterProfile character={char} /></div>
            ))}
        </CollapsibleSection>

        {/* --- RELATIONSHIPS --- */}
        {!isSearching && hasItems(storyEncyclopedia.relationships) && (
            <CollapsibleSection id="relationships" title={t('sidebar.relationships')} isOpen={isSectionOpen('relationships')} onToggle={toggleSection} count={storyEncyclopedia.relationships.length}>
                {storyEncyclopedia.relationships?.map((rel) => (
                    <RelationshipDisplay key={rel.id} relationship={rel} characters={storyEncyclopedia.characters} />
                ))}
            </CollapsibleSection>
        )}

        {/* --- WORLD & LORE --- */}
        {(hasItems(filterLore(storyEncyclopedia.locations)) || hasItems(filterLore(storyEncyclopedia.factions)) || hasItems(filterLore(storyEncyclopedia.lore)) || hasItems(filterLore(storyEncyclopedia.races)) || hasItems(filterLore(storyEncyclopedia.creatures))) && (
            <CollapsibleSection id="world_lore" title={t('sidebar.worldAndLore.title')} isOpen={isSectionOpen('world_lore')} onToggle={toggleSection}>
                {!isSearching && (storyEncyclopedia.worldBuilding || storyEncyclopedia.magicSystem) && (
                    <div className="mb-4 space-y-2">
                        <InfoPair label={t('sidebar.worldAndLore.worldSummary')} value={storyEncyclopedia.worldBuilding} />
                        <InfoPair label={t('sidebar.worldAndLore.magicSummary')} value={storyEncyclopedia.magicSystem} />
                    </div>
                )}
                {/* Grouped by Category inside World & Lore */}
                {(hasItems(filterLore(storyEncyclopedia.locations)) || hasItems(filterLore(storyEncyclopedia.factions)) || hasItems(filterLore(storyEncyclopedia.lore))) && (
                    <div>
                        <h4 className="text-[10px] font-bold text-indigo-400/70 uppercase mb-1 mt-2">{t('world.subTabs.geo')}</h4>
                        {filterLore(storyEncyclopedia.locations)?.map(l => <LoreDisplay key={l.id} entry={l}/>)}
                        {filterLore(storyEncyclopedia.factions)?.map(f => <LoreDisplay key={f.id} entry={f}/>)}
                        {filterLore(storyEncyclopedia.lore)?.map(i => <LoreDisplay key={i.id} entry={i}/>)}
                    </div>
                )}
                {(hasItems(filterLore(storyEncyclopedia.races)) || hasItems(filterLore(storyEncyclopedia.creatures))) && (
                    <div>
                        <h4 className="text-[10px] font-bold text-indigo-400/70 uppercase mb-1 mt-2">{t('world.subTabs.nature')}</h4>
                        {filterLore(storyEncyclopedia.races)?.map(r => <LoreDisplay key={r.id} entry={r}/>)}
                        {filterLore(storyEncyclopedia.creatures)?.map(c => <LoreDisplay key={c.id} entry={c}/>)}
                    </div>
                )}
                 {(hasItems(filterLore(storyEncyclopedia.powers)) || hasItems(filterLore(storyEncyclopedia.items))) && (
                    <div>
                        <h4 className="text-[10px] font-bold text-indigo-400/70 uppercase mb-1 mt-2">{t('world.subTabs.power')}</h4>
                        {filterLore(storyEncyclopedia.powers)?.map(p => <LoreDisplay key={p.id} entry={p}/>)}
                        {filterLore(storyEncyclopedia.items)?.map(i => <LoreDisplay key={i.id} entry={i}/>)}
                    </div>
                )}
            </CollapsibleSection>
        )}

        {/* --- TONE & STYLE --- */}
        {!isSearching && (
            <>
                <CollapsibleSection id="tone" title={t('sidebar.tone.title')} isOpen={isSectionOpen('tone')} onToggle={toggleSection}>
                    <div className="flex justify-between text-center">
                        <div className="flex flex-col"><span className="text-xs text-slate-500 uppercase">{t('sidebar.tone.comedy')}</span><span className="font-bold text-indigo-300">{storyEncyclopedia.comedyLevel}</span></div>
                        <div className="flex flex-col"><span className="text-xs text-slate-500 uppercase">{t('sidebar.tone.romance')}</span><span className="font-bold text-pink-300">{storyEncyclopedia.romanceLevel}</span></div>
                        <div className="flex flex-col"><span className="text-xs text-slate-500 uppercase">{t('sidebar.tone.action')}</span><span className="font-bold text-orange-300">{storyEncyclopedia.actionLevel}</span></div>
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection id="style" title={t('sidebar.proseStyle.title')} isOpen={isSectionOpen('style')} onToggle={toggleSection}>
                    <InfoPair label={t('sidebar.proseStyle.style')} value={storyEncyclopedia.proseStyle} />
                    <InfoPair label={t('sidebar.tone.pov')} value={storyEncyclopedia.narrativePerspective} />
                </CollapsibleSection>
            </>
        )}
      </div>
    </aside>
  );
};

// Reuse existing Comparator logic
function sidebarPropsAreEqual(prev: StoryEncyclopediaSidebarProps, next: StoryEncyclopediaSidebarProps) {
    if (prev.activeChapterId !== next.activeChapterId) return false;
    if (prev.storyEncyclopedia.id !== next.storyEncyclopedia.id) return false;
    const prevStory = prev.storyEncyclopedia;
    const nextStory = next.storyEncyclopedia;
    if (prevStory.title !== nextStory.title) return false;
    if (prevStory.universeName !== nextStory.universeName) return false;
    if (prevStory.chapters.length !== nextStory.chapters.length) return false;
    if (prevStory.characters.length !== nextStory.characters.length) return false;
    if (prevStory.locations.length !== nextStory.locations.length) return false;
    const prevChapSig = prevStory.chapters.map(c => c.id + c.title).join('|');
    const nextChapSig = nextStory.chapters.map(c => c.id + c.title).join('|');
    if (prevChapSig !== nextChapSig) return false;
    const prevCharSig = prevStory.characters.map(c => c.id + c.name + c.roles.join(',')).join('|');
    const nextCharSig = nextStory.characters.map(c => c.id + c.name + c.roles.join(',')).join('|');
    if (prevCharSig !== nextCharSig) return false;
    const prevLoreSig = prevStory.locations.map(l => l.name).join('|') + prevStory.factions.map(f => f.name).join('|');
    const nextLoreSig = nextStory.locations.map(l => l.name).join('|') + nextStory.factions.map(f => f.name).join('|');
    if (prevLoreSig !== nextLoreSig) return false;
    return true;
}

export default React.memo(StoryEncyclopediaSidebar, sidebarPropsAreEqual);