
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
import { useStory } from '../contexts/StoryContext';

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
    // New props for editable/draggable header
    onDelete?: () => void;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
    isDragging?: boolean;
    isDropTarget?: boolean;
    headerId?: string; // Chapter ID if this is a volume header
    onUpdateTitle?: (id: string, newTitle: string) => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    id, title, children, isOpen, onToggle, noPadding = false, count, subHeader = false,
    onDelete, draggable, onDragStart, onDragOver, onDrop, isDragging, isDropTarget, headerId, onUpdateTitle
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempTitle, setTempTitle] = useState(title);

    const handleTitleSubmit = () => {
        if (headerId && onUpdateTitle && tempTitle.trim() !== '') {
            onUpdateTitle(headerId, tempTitle);
        }
        setIsEditing(false);
    };

    return (
        <div
            className={`mb-1 rounded-lg transition-all ${isDragging ? 'opacity-50' : ''} ${
                // Visual Fix: If dropping onto a header, highlight the whole box instead of just a border
                isDropTarget && headerId ? 'ring-2 ring-indigo-500 bg-indigo-900/20' : ''
                }`}
            draggable={draggable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <div className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors group ${subHeader
                ? 'bg-amber-50/10 hover:bg-white/95 text-gray-700'
                : 'bg-white/80 hover:bg-white text-indigo-600'
                }`}
            >
                <div className="flex items-center gap-2 flex-grow min-w-0">
                    {draggable && (
                        <div className="cursor-grab text-gray-400 hover:text-gray-600 flex-shrink-0">
                            <GripVerticalIcon className="w-3 h-3" />
                        </div>
                    )}
                    <button onClick={() => onToggle(id)} className="flex items-center gap-2 min-w-0 flex-grow text-left">
                        <ChevronRightIcon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                        {isEditing ? (
                            <input
                                type="text"
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                onBlur={handleTitleSubmit}
                                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                                className="bg-white text-white text-xs font-bold uppercase px-1 rounded w-full border border-indigo-500 focus:outline-none"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className={`font-bold uppercase tracking-wider truncate ${subHeader ? 'text-xs' : 'text-xs'}`}>{title}</span>
                        )}
                    </button>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {count !== undefined && (
                        <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-gray-500 font-mono">{count}</span>
                    )}
                    {headerId && (
                        <>
                            <button
                                onClick={() => { setTempTitle(title); setIsEditing(true); }}
                                className="p-1 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <PencilIcon className="w-3 h-3" />
                            </button>
                            {onDelete && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete this volume header? Chapters inside will be merged into the previous section.')) onDelete(); }}
                                    className="p-1 text-gray-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <TrashIcon className="w-3 h-3" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {isOpen && (
                <div className={`animate-in slide-in-from-top-2 duration-200 ${noPadding ? 'pt-1' : 'p-2 bg-amber-50/20 rounded-b-md'}`}>
                    <div className="space-y-3 text-sm text-gray-700">
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
            <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide opacity-80">{label}</p>
            <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{displayValue}</p>
        </div>
    );
};

const CharacterProfile: React.FC<{ character: Character }> = ({ character }) => {
    if (!character || !character.name) return null;
    const { t } = useLanguage();
    return (
        <div className="bg-white/95 p-3 rounded-lg space-y-2 border border-amber-200/40 hover:border-gray-300 transition-colors">
            <h4 className="font-bold text-base text-gray-900 flex items-center gap-2">
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
        <div className="p-2 border-l-2 border-gray-300 bg-amber-50/20 pl-3">
            <p className="font-semibold text-gray-900 text-xs">{char1.name} <span className="text-gray-500">&</span> {char2.name}</p>
            <p className="text-gray-600 text-sm mt-1"><span className="text-indigo-600 text-xs uppercase font-bold">[{type}]</span> {description}</p>
        </div>
    );
};

const LoreDisplay: React.FC<{ entry: LoreEntry }> = ({ entry }) => (
    <div className="p-2 hover:bg-white/80 rounded transition-colors">
        <p className="font-bold text-gray-700 text-sm">{entry.name}</p>
        <p className="text-gray-500 text-xs line-clamp-3">{entry.description}</p>
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
        className={`group flex items-center justify-between rounded-lg transition-all pl-1 ${isDragging ? 'opacity-50' : ''
            } ${isDropTarget ? 'border-b-2 border-indigo-500' : 'hover:bg-white/95'}`}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
    >
        <div className="flex items-center flex-grow min-w-0">
            {draggable && (
                <div className="p-2 cursor-grab text-gray-400 hover:text-gray-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVerticalIcon className="w-3 h-3" />
                </div>
            )}
            <button
                onClick={onSelect}
                className={`flex-grow text-left px-2 py-1.5 rounded-lg transition-colors truncate text-sm ${isActive ? 'text-indigo-600 font-bold bg-indigo-900/20' : 'text-gray-600'}`}
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
                className="p-2 mr-1 flex-shrink-0 text-gray-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
    const { addSectionHeader, updateChapter } = useStory();
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
            (c.type !== 'group_header' && c.content.toLowerCase().includes(searchQuery.toLowerCase()))
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

    // --- GROUPING LOGIC FOR CHAPTERS ---
    // Uses 'group_header' type chapters as dividers
    const groupedChapters = useMemo(() => {
        const chapters = filteredChapters || [];

        if (isSearching) {
            return [{ type: 'search', id: 'search_results', title: t('sidebar.chapters.title'), chapters: chapters.filter(c => c.type !== 'group_header') }];
        }

        const grouped: { type: 'group', id: string, title: string, chapters: Chapter[], headerId?: string }[] = [];
        let currentGroup = { type: 'group', id: 'ungrouped', title: t('sidebar.chapters.title'), chapters: [] as Chapter[], headerId: undefined as string | undefined };

        chapters.forEach((c, index) => {
            if (c.type === 'group_header') {
                // If current group has items, push it. 
                // Exception: if it's the initial 'ungrouped' and empty, we can overwrite/discard it to avoid empty top group if headers start immediately.
                if (currentGroup.chapters.length > 0 || currentGroup.id !== 'ungrouped') {
                    grouped.push(currentGroup as any);
                }

                // Start new group
                currentGroup = {
                    type: 'group',
                    id: c.id, // Use header ID for collapsible toggle
                    title: c.title,
                    chapters: [],
                    headerId: c.id
                };
            } else {
                currentGroup.chapters.push(c);
            }
        });

        // Push the final group
        if (currentGroup.chapters.length > 0 || currentGroup.id !== 'ungrouped') {
            grouped.push(currentGroup as any);
        }

        return grouped;
    }, [filteredChapters, isSearching, t]);

    const hasItems = (arr?: any[]) => arr && arr.length > 0;

    // Drag handlers
    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.stopPropagation(); // Prevent bubbling
        setDraggedChapterId(id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling
        if (draggedChapterId === targetId) return;
        setDropTargetId(targetId);
        e.dataTransfer.dropEffect = "move";
    };

    // --- FIX LOGIC BUG: TYPE-AWARE INSERTION ---
    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling
        setDropTargetId(null);
        setDraggedChapterId(null);
        if (!draggedChapterId || draggedChapterId === targetId) return;

        const allChapters = [...storyEncyclopedia.chapters];
        const sourceIndex = allChapters.findIndex(c => c.id === draggedChapterId);
        if (sourceIndex === -1) return;
        const sourceChapter = allChapters[sourceIndex];
        const sourceIsHeader = sourceChapter.type === 'group_header';

        let targetIndex = allChapters.findIndex(c => c.id === targetId);
        if (targetIndex === -1) return;

        const targetChapter = allChapters[targetIndex];
        const targetIsHeader = targetChapter.type === 'group_header';

        // 1. Remove from original position
        const [movedChapter] = allChapters.splice(sourceIndex, 1);

        // 2. Adjust targetIndex because splice shifted array if source was before target
        if (sourceIndex < targetIndex) {
            targetIndex--;
        }

        // 3. Insert Logic
        // CASE A: Dragging a CHAPTER onto a HEADER -> "Move Into Volume" (Insert After Header)
        if (targetIsHeader && !sourceIsHeader) {
            allChapters.splice(targetIndex + 1, 0, movedChapter);
            if (!expandedSections[targetId]) {
                toggleSection(targetId);
            }
        }
        // CASE B: Dragging HEADER onto HEADER -> "Reorder Volumes" (Insert Before Target Header)
        // CASE C: Dragging CHAPTER onto CHAPTER -> "Reorder Chapters" (Insert Before Target Chapter)
        // CASE D: Dragging HEADER onto CHAPTER -> "Split Volume" (Insert Before Target Chapter)
        else {
            allChapters.splice(targetIndex, 0, movedChapter);
        }

        onReorderChapters(allChapters);
    };

    const handleAddVolume = async () => {
        await addSectionHeader(t('sidebar.chapters.newVolume'));
    };

    return (
        <aside className="w-80 lg:w-96 flex-shrink-0 bg-white border-r border-gray-200 p-4 flex flex-col h-full">
            <div className="flex-shrink-0">
                <div className="flex items-center justify-between gap-3 mb-2">
                    <button onClick={onGoToDashboard} className="flex items-center gap-2 p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-indigo-600 transition-colors" title={t('sidebar.backToDashboard')}>
                        <LayoutDashboardIcon className="w-5 h-5" /> <span className="text-sm font-medium">{t('sidebar.dashboard')}</span>
                    </button>
                </div>
                <div className="flex flex-col gap-3 mb-4 p-3 bg-amber-50/20 rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <BookOpenIcon className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                            <h2 className="text-lg font-bold text-gray-900 truncate" title={storyEncyclopedia.title}>{storyEncyclopedia.title}</h2>
                        </div>
                        <div className="flex items-center flex-shrink-0">
                            <button onClick={() => onExportStory(storyEncyclopedia.id)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-indigo-600 transition-colors" title={t('sidebar.exportStory')}><DownloadIcon className="w-5 h-5" /></button>
                            <button onClick={onOpenSearch} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-indigo-600 transition-colors" title={t('sidebar.searchStory')}><SearchIcon className="w-5 h-5" /></button>
                            <button onClick={onEdit} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-indigo-600 transition-colors" title={t('sidebar.editEncyclopedia')}><PencilIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 border-t border-gray-200 pt-2">
                        <GlobeIcon className="w-4 h-4 text-gray-500" /> <span className="font-semibold">{t('sidebar.universe')}:</span> <span className="truncate">{storyEncyclopedia.universeName}</span>
                    </div>
                </div>
                <div className="mb-4">
                    <input type="text" placeholder={t('sidebar.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-amber-50/30 text-gray-800 placeholder-gray-400 text-sm rounded-lg p-2.5 border border-amber-200/50 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                </div>
            </div>

            <div className="space-y-1 overflow-y-auto flex-grow pr-1 -mr-2 custom-scrollbar">

                {/* --- CHAPTERS (Grouped by Volumes) --- */}
                <CollapsibleSection
                    id="chapters"
                    title={t('sidebar.chapters.title')}
                    isOpen={isSectionOpen('chapters')}
                    onToggle={toggleSection}
                    noPadding
                >
                    {groupedChapters.map((group) => (
                        <div key={group.id} className="mb-1">
                            {/* Group Header (Collapsible if it's a volume/header group) */}
                            {group.headerId ? (
                                <CollapsibleSection
                                    id={group.id}
                                    title={group.title}
                                    isOpen={isSectionOpen(group.id)}
                                    onToggle={toggleSection}
                                    subHeader
                                    noPadding
                                    count={group.chapters.length}
                                    // Properties for editing/dragging the volume header itself
                                    headerId={group.headerId}
                                    onUpdateTitle={(id, title) => updateChapter(id, title, '')}
                                    onDelete={() => onDeleteChapter(group.headerId!)}
                                    draggable={!isSearching}
                                    onDragStart={(e) => handleDragStart(e, group.headerId!)}
                                    onDragOver={(e) => handleDragOver(e, group.headerId!)}
                                    onDrop={(e) => handleDrop(e, group.headerId!)}
                                    isDragging={draggedChapterId === group.headerId}
                                    isDropTarget={dropTargetId === group.headerId}
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
                                // Simple list for Ungrouped chapters at the top
                                <div className="space-y-0.5">
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
                        <div className="flex gap-2 mt-2">
                            <button onClick={onAddChapter} className="flex-grow flex items-center justify-center gap-2 text-xs py-2 px-2 border border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors">
                                <FilePlusIcon className="w-3 h-3" /> {t('sidebar.chapters.add')}
                            </button>
                            <button onClick={handleAddVolume} className="flex-grow flex items-center justify-center gap-2 text-xs py-2 px-2 border border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors" title={t('sidebar.chapters.addVolume')}>
                                <BookOpenIcon className="w-3 h-3" /> {t('sidebar.chapters.addVolume')}
                            </button>
                        </div>
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
                                <div key={index} className="space-y-1 mb-2 pb-2 border-b border-amber-200/40 last:border-0 last:pb-0">
                                    <p className="font-bold text-gray-900 text-xs">{act.title}</p>
                                    <p className="text-gray-600 italic text-xs mb-1 line-clamp-2" title={act.description}>{act.description}</p>
                                    {act.plotPoints && act.plotPoints.length > 0 && (
                                        <ul className="list-disc list-inside text-[10px] text-gray-500 pl-1">
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
                                <h4 className="text-[10px] font-bold text-indigo-600/70 uppercase mb-1 mt-2">{t('world.subTabs.geo')}</h4>
                                {filterLore(storyEncyclopedia.locations)?.map(l => <LoreDisplay key={l.id} entry={l} />)}
                                {filterLore(storyEncyclopedia.factions)?.map(f => <LoreDisplay key={f.id} entry={f} />)}
                                {filterLore(storyEncyclopedia.lore)?.map(i => <LoreDisplay key={i.id} entry={i} />)}
                            </div>
                        )}
                        {(hasItems(filterLore(storyEncyclopedia.races)) || hasItems(filterLore(storyEncyclopedia.creatures))) && (
                            <div>
                                <h4 className="text-[10px] font-bold text-indigo-600/70 uppercase mb-1 mt-2">{t('world.subTabs.nature')}</h4>
                                {filterLore(storyEncyclopedia.races)?.map(r => <LoreDisplay key={r.id} entry={r} />)}
                                {filterLore(storyEncyclopedia.creatures)?.map(c => <LoreDisplay key={c.id} entry={c} />)}
                            </div>
                        )}
                        {(hasItems(filterLore(storyEncyclopedia.powers)) || hasItems(filterLore(storyEncyclopedia.items))) && (
                            <div>
                                <h4 className="text-[10px] font-bold text-indigo-600/70 uppercase mb-1 mt-2">{t('world.subTabs.power')}</h4>
                                {filterLore(storyEncyclopedia.powers)?.map(p => <LoreDisplay key={p.id} entry={p} />)}
                                {filterLore(storyEncyclopedia.items)?.map(i => <LoreDisplay key={i.id} entry={i} />)}
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {/* --- TONE & STYLE --- */}
                {!isSearching && (
                    <>
                        <CollapsibleSection id="tone" title={t('sidebar.tone.title')} isOpen={isSectionOpen('tone')} onToggle={toggleSection}>
                            <div className="flex justify-between text-center">
                                <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase tracking-wide">{t('sidebar.tone.comedy')}</span><span className="font-bold text-indigo-600">{storyEncyclopedia.comedyLevel}</span></div>
                                <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase tracking-wide">{t('sidebar.tone.romance')}</span><span className="font-bold text-pink-300">{storyEncyclopedia.romanceLevel}</span></div>
                                <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase tracking-wide">{t('sidebar.tone.action')}</span><span className="font-bold text-orange-300">{storyEncyclopedia.actionLevel}</span></div>
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
    // Deep check for chapter structure changes (headers added/removed/moved)
    const prevChapSig = prevStory.chapters.map(c => c.id + c.title + (c.type || '')).join('|');
    const nextChapSig = nextStory.chapters.map(c => c.id + c.title + (c.type || '')).join('|');
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
