import React, { useMemo, useState } from 'react';
import { StoryEncyclopedia, Character, Relationship, Chapter, LoreEntry } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { PencilIcon } from './icons/PencilIcon';
import { LayoutDashboardIcon } from './icons/LayoutDashboardIcon';
import { FilePlusIcon } from './icons/FilePlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { GlobeIcon } from './icons/GlobeIcon';
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
}

const SidebarSection: React.FC<{ title: string; children: React.ReactNode; noPadding?: boolean }> = ({ title, children, noPadding = false }) => (
  <div>
    <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-2 px-1">{title}</h3>
    <div className={`space-y-2 text-sm text-slate-300 ${noPadding ? '' : 'bg-slate-800/50 p-3 rounded-md'}`}>
        {children}
    </div>
  </div>
);

const InfoPair: React.FC<{ label: string; value?: string | null | string[] }> = ({ label, value }) => {
    if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) return null;
    
    const displayValue = Array.isArray(value) ? value.join(', ') : value;

    return (
        <div>
            <p className="font-semibold text-slate-200">{label}</p>
            <p className="text-slate-400 whitespace-pre-wrap">{displayValue}</p>
        </div>
    );
};

const CharacterProfile: React.FC<{ character: Character }> = ({ character }) => {
    if (!character || !character.name) return null;
    const { t } = useLanguage();
    
    return (
        <div className="bg-slate-800/50 p-3 rounded-md space-y-2">
            <h4 className="font-bold text-base text-slate-100">{character.name}</h4>
            <InfoPair label={t('sidebar.character.roles')} value={character.roles} />
            <InfoPair label={t('sidebar.character.age')} value={character.age} />
            <InfoPair label={t('sidebar.character.gender')} value={character.gender} />
            <InfoPair label={t('sidebar.character.physical')} value={character.physicalDescription} />
            <InfoPair label={t('sidebar.character.voice')} value={character.voiceAndSpeechStyle} />
            <InfoPair label={t('sidebar.character.traits')} value={character.personalityTraits} />
            <InfoPair label={t('sidebar.character.habits')} value={character.habits} />
            <InfoPair label={t('sidebar.character.goal')} value={character.goal} />
            <InfoPair label={t('sidebar.character.principles')} value={character.principles} />
            <InfoPair label={t('sidebar.character.conflict')} value={character.conflict} />
            {character.customFields?.map(field => (
                <InfoPair key={field.id} label={field.label} value={field.value} />
            ))}
        </div>
    );
};


const RelationshipDisplay: React.FC<{ relationship: Relationship; characters: Character[] }> = ({ relationship, characters }) => {
    const { character1Id, character2Id, type, description } = relationship;
    const char1 = characters.find(c => c.id === character1Id);
    const char2 = characters.find(c => c.id === character2Id);
    if (!char1 || !char2 || !type) return null;

    return (
        <div>
            <p className="font-semibold text-slate-200">{char1.name} & {char2.name}</p>
            <p className="text-slate-400"><span className="font-medium text-indigo-400">[{type}]</span> {description}</p>
        </div>
    );
};

const LoreDisplay: React.FC<{entry: LoreEntry}> = ({entry}) => (
    <div>
        <p className="font-semibold text-slate-200">{entry.name}</p>
        <p className="text-slate-400 whitespace-pre-wrap">{entry.description}</p>
    </div>
);

const ChapterItem: React.FC<{
    chapter: Chapter;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
    canDelete: boolean;
    t: (key: string) => string;
}> = ({ chapter, isActive, onSelect, onDelete, canDelete, t }) => (
    <div className="group flex items-center justify-between rounded-md hover:bg-slate-700/50">
        <button
            onClick={onSelect}
            className={`flex-grow text-left px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-indigo-600/30 text-indigo-200' : 'text-slate-300'}`}
        >
            <span className="truncate block w-full">{chapter.title}</span>
        </button>
        {canDelete && (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="p-2 mr-1 flex-shrink-0 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title={t('sidebar.chapters.delete')}
            >
                <TrashIcon className="w-4 h-4" />
            </button>
        )}
    </div>
);


const StoryEncyclopediaSidebar: React.FC<StoryEncyclopediaSidebarProps> = ({ storyEncyclopedia, onEdit, onGoToDashboard, activeChapterId, onSelectChapter, onAddChapter, onDeleteChapter, onExportStory }) => {
  const displayGenre = [...(storyEncyclopedia.genres || []), storyEncyclopedia.otherGenre].filter(Boolean).join(', ');
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  
  const isSearching = searchQuery.trim().length > 0;

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

  // Group Chapters Logic (Updated to use filteredChapters)
  const groupedChapters = useMemo(() => {
    const chapters = filteredChapters || [];
    const arcs = storyEncyclopedia.storyArc || [];
    
    // If searching, don't group by arc, just show list
    if (isSearching) {
        return [{ type: 'search', title: t('sidebar.chapters.title'), chapters }];
    }

    const grouped: { type: 'act' | 'other' | 'search', title: string, chapters: Chapter[], range?: string }[] = [];
    const assignedChapterIds = new Set<string>();

    // Map original indices to IDs for range checking
    const originalChapterIds = storyEncyclopedia.chapters.map(c => c.id);

    arcs.forEach(act => {
        if (act.startChapter && act.endChapter) {
            const start = parseInt(act.startChapter, 10);
            const end = parseInt(act.endChapter, 10);
            if (!isNaN(start) && !isNaN(end) && start <= end) {
                // Find chapters that fall within this range indices
                const actChapterIds = originalChapterIds.slice(Math.max(0, start - 1), end);
                const actChapters = chapters.filter(c => actChapterIds.includes(c.id));
                
                if (actChapters.length > 0) {
                    actChapters.forEach(c => assignedChapterIds.add(c.id));
                    grouped.push({ type: 'act', title: act.title, chapters: actChapters, range: `Ch. ${start}-${end}` });
                }
            }
        }
    });

    const unassignedChapters = chapters.filter(c => !assignedChapterIds.has(c.id));
    if (unassignedChapters.length > 0) {
        const label = grouped.length > 0 ? "Other / Unassigned" : t('sidebar.chapters.title');
        grouped.push({ type: 'other', title: label, chapters: unassignedChapters });
    }
    return grouped;
  }, [filteredChapters, storyEncyclopedia.chapters, storyEncyclopedia.storyArc, isSearching, t]);


  const hasItems = (arr?: any[]) => arr && arr.length > 0;

  return (
    <aside className="w-80 lg:w-96 flex-shrink-0 bg-slate-800 border-r border-slate-700 p-4 flex flex-col h-full">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between gap-3 mb-2">
            <button 
              onClick={onGoToDashboard}
              className="flex items-center gap-2 p-2 rounded-md text-slate-400 hover:bg-slate-700 hover:text-indigo-400 transition-colors"
              title={t('sidebar.backToDashboard')}
            >
              <LayoutDashboardIcon className="w-5 h-5" />
              <span className="text-sm font-medium">{t('sidebar.dashboard')}</span>
            </button>
        </div>
        <div className="flex flex-col gap-3 mb-4 p-3 bg-slate-900/50 rounded-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                  <BookOpenIcon className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                  <h2 className="text-lg font-bold text-slate-200 truncate" title={storyEncyclopedia.title}>{storyEncyclopedia.title}</h2>
              </div>
              <div className="flex items-center flex-shrink-0">
                  <button onClick={() => onExportStory(storyEncyclopedia.id)} className="p-2 rounded-md text-slate-400 hover:bg-slate-700 hover:text-indigo-400 transition-colors" title={t('sidebar.exportStory')}>
                    <DownloadIcon className="w-5 h-5" />
                  </button>
                  <button onClick={onEdit} className="p-2 rounded-md text-slate-400 hover:bg-slate-700 hover:text-indigo-400 transition-colors" title={t('sidebar.editEncyclopedia')}>
                    <PencilIcon className="w-5 h-5" />
                  </button>
              </div>
            </div>
             <div className="flex items-center gap-2 text-xs text-slate-400 border-t border-slate-700 pt-2">
                <GlobeIcon className="w-4 h-4 text-slate-500"/>
                <span className="font-semibold">{t('sidebar.universe')}:</span>
                <span className="truncate">{storyEncyclopedia.universeName}</span>
            </div>
        </div>
        
        {/* SEARCH BAR */}
        <div className="mb-4">
            <input 
                type="text" 
                placeholder={t('sidebar.searchPlaceholder')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-700 text-slate-200 placeholder-slate-400 text-sm rounded-md p-2 border border-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
        </div>
      </div>

      <div className="space-y-6 overflow-y-auto flex-grow pr-1 -mr-4 pl-1 -ml-1">
        
        {/* CHAPTERS */}
        {groupedChapters.length > 0 && (
            <SidebarSection title={t('sidebar.chapters.title')} noPadding>
            <div className="space-y-4">
                {groupedChapters.map((group, idx) => (
                    <div key={idx} className="space-y-1">
                        {(groupedChapters.length > 1 || group.type === 'act') && (
                            <div className="flex items-center justify-between text-xs font-bold text-indigo-400/80 uppercase tracking-wider px-2 pt-2 pb-1 bg-slate-800/80 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-700/50">
                                <span className="truncate" title={group.title}>{group.title}</span>
                                {group.range && <span className="text-[10px] bg-slate-700/80 px-1.5 py-0.5 rounded text-slate-400 ml-2 whitespace-nowrap">{group.range}</span>}
                            </div>
                        )}
                        {group.chapters.map(chapter => (
                            <ChapterItem key={chapter.id} chapter={chapter} isActive={activeChapterId === chapter.id} onSelect={() => onSelectChapter(chapter.id)} onDelete={() => onDeleteChapter(chapter.id)} canDelete={storyEncyclopedia.chapters.length > 1} t={t} />
                        ))}
                    </div>
                ))}
                {!isSearching && (
                    <button onClick={onAddChapter} className="w-full flex items-center justify-center gap-2 text-sm py-2 px-4 mt-2 border-2 border-dashed border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 hover:border-slate-500 transition-colors">
                        <FilePlusIcon className="w-4 h-4" />
                        {t('sidebar.chapters.add')}
                    </button>
                )}
            </div>
            </SidebarSection>
        )}
        
        {/* BASIC INFO (Hide on Search) */}
        {!isSearching && (
            <>
                <SidebarSection title={t('sidebar.basicInfo')}>
                    <InfoPair label={t('sidebar.genre')} value={displayGenre} />
                    <InfoPair label={t('sidebar.setting')} value={storyEncyclopedia.setting} />
                </SidebarSection>

                <SidebarSection title={t('sidebar.corePlot')}>
                    <InfoPair label={t('sidebar.mainPlot')} value={storyEncyclopedia.mainPlot} />
                </SidebarSection>
                
                <SidebarSection title={t('sidebar.storyArc')}>
                    {storyEncyclopedia.storyArc?.map((act, index) => (
                        <div key={index} className="space-y-1">
                            <p className="font-semibold text-slate-200">{act.title}</p>
                            <p className="text-slate-400 italic text-xs mb-1">{act.description}</p>
                            {act.plotPoints && act.plotPoints.length > 0 && (
                                <ul className="list-disc list-inside text-xs text-slate-400 pl-2">
                                    {act.plotPoints?.map(pp => <li key={pp.id}>{pp.summary}</li>)}
                                </ul>
                            )}
                        </div>
                    ))}
                </SidebarSection>
            </>
        )}

        {/* CHARACTERS */}
        {filteredCharacters.length > 0 && (
            <SidebarSection title={t('sidebar.characters')} noPadding>
                {filteredCharacters.map((char) => (
                    <CharacterProfile key={char.id} character={char} />
                ))}
            </SidebarSection>
        )}

        {/* RELATIONSHIPS (Hide on Search for now to avoid complexity) */}
        {!isSearching && storyEncyclopedia.characters && storyEncyclopedia.relationships?.length > 0 && (
            <SidebarSection title={t('sidebar.relationships')}>
                {storyEncyclopedia.relationships?.map((rel) => (
                    <RelationshipDisplay key={rel.id} relationship={rel} characters={storyEncyclopedia.characters} />
                ))}
            </SidebarSection>
        )}
        
        {/* --- EXPANDED WORLD & LORE SECTIONS --- */}
        {(hasItems(filterLore(storyEncyclopedia.locations)) || hasItems(filterLore(storyEncyclopedia.factions)) || hasItems(filterLore(storyEncyclopedia.lore)) || hasItems(filterLore(storyEncyclopedia.races)) || hasItems(filterLore(storyEncyclopedia.creatures)) || hasItems(filterLore(storyEncyclopedia.powers)) || hasItems(filterLore(storyEncyclopedia.items)) || hasItems(filterLore(storyEncyclopedia.technology)) || hasItems(filterLore(storyEncyclopedia.history)) || hasItems(filterLore(storyEncyclopedia.cultures))) && (
            <SidebarSection title={t('sidebar.worldAndLore.title')}>
                {!isSearching && (storyEncyclopedia.worldBuilding || storyEncyclopedia.magicSystem) && (
                    <div className="mb-4 space-y-2">
                        <InfoPair label={t('sidebar.worldAndLore.worldSummary')} value={storyEncyclopedia.worldBuilding} />
                        <InfoPair label={t('sidebar.worldAndLore.magicSummary')} value={storyEncyclopedia.magicSystem} />
                    </div>
                )}

                {/* Geo */}
                {(hasItems(filterLore(storyEncyclopedia.locations)) || hasItems(filterLore(storyEncyclopedia.factions)) || hasItems(filterLore(storyEncyclopedia.lore))) && (
                    <div className="mb-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-700 pb-1">{t('world.subTabs.geo')}</h4>
                        {filterLore(storyEncyclopedia.locations)?.map(l => <LoreDisplay key={l.id} entry={l}/>)}
                        {filterLore(storyEncyclopedia.factions)?.map(f => <LoreDisplay key={f.id} entry={f}/>)}
                        {filterLore(storyEncyclopedia.lore)?.map(i => <LoreDisplay key={i.id} entry={i}/>)}
                    </div>
                )}
                
                {/* Nature */}
                {(hasItems(filterLore(storyEncyclopedia.races)) || hasItems(filterLore(storyEncyclopedia.creatures))) && (
                    <div className="mb-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-700 pb-1">{t('world.subTabs.nature')}</h4>
                        {filterLore(storyEncyclopedia.races)?.map(r => <LoreDisplay key={r.id} entry={r}/>)}
                        {filterLore(storyEncyclopedia.creatures)?.map(c => <LoreDisplay key={c.id} entry={c}/>)}
                    </div>
                )}

                {/* Power */}
                {(hasItems(filterLore(storyEncyclopedia.powers)) || hasItems(filterLore(storyEncyclopedia.items)) || hasItems(filterLore(storyEncyclopedia.technology))) && (
                    <div className="mb-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-700 pb-1">{t('world.subTabs.power')}</h4>
                        {filterLore(storyEncyclopedia.powers)?.map(p => <LoreDisplay key={p.id} entry={p}/>)}
                        {filterLore(storyEncyclopedia.items)?.map(i => <LoreDisplay key={i.id} entry={i}/>)}
                        {filterLore(storyEncyclopedia.technology)?.map(t => <LoreDisplay key={t.id} entry={t}/>)}
                    </div>
                )}
                
                {/* History */}
                {(hasItems(filterLore(storyEncyclopedia.history)) || hasItems(filterLore(storyEncyclopedia.cultures))) && (
                    <div className="mb-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-700 pb-1">{t('world.subTabs.history')}</h4>
                        {filterLore(storyEncyclopedia.history)?.map(h => <LoreDisplay key={h.id} entry={h}/>)}
                        {filterLore(storyEncyclopedia.cultures)?.map(c => <LoreDisplay key={c.id} entry={c}/>)}
                    </div>
                )}
            </SidebarSection>
        )}

        {/* TONE (Hide on Search) */}
        {!isSearching && (
            <>
                <SidebarSection title={t('sidebar.tone.title')}>
                    <div className="flex justify-between text-center">
                        <InfoPair label={t('sidebar.tone.comedy')} value={storyEncyclopedia.comedyLevel} />
                        <InfoPair label={t('sidebar.tone.romance')} value={storyEncyclopedia.romanceLevel} />
                        <InfoPair label={t('sidebar.tone.action')} value={storyEncyclopedia.actionLevel} />
                        {storyEncyclopedia.maturityLevel && parseInt(storyEncyclopedia.maturityLevel, 10) > 1 && (
                            <InfoPair label={t('sidebar.tone.maturity')} value={storyEncyclopedia.maturityLevel} />
                        )}
                    </div>
                </SidebarSection>
                
                <SidebarSection title={t('sidebar.proseStyle.title')}>
                    <InfoPair label={t('sidebar.proseStyle.style')} value={storyEncyclopedia.proseStyle} />
                    <InfoPair label={t('sidebar.tone.pov')} value={storyEncyclopedia.narrativePerspective} />
                    {storyEncyclopedia.customProseStyleByExample && (
                    <InfoPair label={t('sidebar.proseStyle.custom')} value={t('sidebar.proseStyle.customActive')} />
                    )}
                </SidebarSection>
            </>
        )}

      </div>
    </aside>
  );
};

export default StoryEncyclopediaSidebar;