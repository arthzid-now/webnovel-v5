
import React, { useMemo, useState } from 'react';
import { StoryEncyclopedia, Character, Relationship, Chapter, CustomField, LoreEntry, StoryArcAct } from '../types';
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
  
  // Group Chapters Logic (Unchanged)
  const groupedChapters = useMemo(() => {
    const chapters = storyEncyclopedia.chapters || [];
    const arcs = storyEncyclopedia.storyArc || [];
    const grouped: { type: 'act' | 'other', title: string, chapters: Chapter[], range?: string }[] = [];
    const assignedChapterIndices = new Set<number>();

    arcs.forEach(act => {
        if (act.startChapter && act.endChapter) {
            const start = parseInt(act.startChapter, 10);
            const end = parseInt(act.endChapter, 10);
            if (!isNaN(start) && !isNaN(end) && start <= end) {
                const actChapters = chapters.slice(Math.max(0, start - 1), end);
                if (actChapters.length > 0) {
                    for (let i = Math.max(0, start - 1); i < Math.min(end, chapters.length); i++) {
                        assignedChapterIndices.add(i);
                    }
                    grouped.push({ type: 'act', title: act.title, chapters: actChapters, range: `Ch. ${start}-${end}` });
                }
            }
        }
    });

    const unassignedChapters = chapters.filter((_, index) => !assignedChapterIndices.has(index));
    if (unassignedChapters.length > 0) {
        const label = grouped.length > 0 ? "Other / Unassigned" : t('sidebar.chapters.title');
        grouped.push({ type: 'other', title: label, chapters: unassignedChapters });
    }
    return grouped;
  }, [storyEncyclopedia.chapters, storyEncyclopedia.storyArc, t]);


  // Helper to check if a lore category has items
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
      </div>

      <div className="space-y-6 overflow-y-auto flex-grow pr-1 -mr-4 pl-1 -ml-1">
        
        {/* CHAPTERS */}
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
             <button onClick={onAddChapter} className="w-full flex items-center justify-center gap-2 text-sm py-2 px-4 mt-2 border-2 border-dashed border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 hover:border-slate-500 transition-colors">
                <FilePlusIcon className="w-4 h-4" />
                {t('sidebar.chapters.add')}
              </button>
          </div>
        </SidebarSection>
        
        {/* BASIC INFO */}
        <SidebarSection title={t('sidebar.basicInfo')}>
            <InfoPair label={t('sidebar.genre')} value={displayGenre} />
            <InfoPair label={t('sidebar.setting')} value={storyEncyclopedia.setting} />
        </SidebarSection>

        {/* CORE PLOT */}
        <SidebarSection title={t('sidebar.corePlot')}>
             <InfoPair label={t('sidebar.mainPlot')} value={storyEncyclopedia.mainPlot} />
        </SidebarSection>
        
        {/* ARC */}
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

        {/* CHARACTERS */}
        <SidebarSection title={t('sidebar.characters')} noPadding>
            {storyEncyclopedia.characters?.map((char) => (
                <CharacterProfile key={char.id} character={char} />
            ))}
        </SidebarSection>

        {/* RELATIONSHIPS */}
        {storyEncyclopedia.characters && storyEncyclopedia.relationships?.length > 0 && (
            <SidebarSection title={t('sidebar.relationships')}>
                {storyEncyclopedia.relationships?.map((rel) => (
                    <RelationshipDisplay key={rel.id} relationship={rel} characters={storyEncyclopedia.characters} />
                ))}
            </SidebarSection>
        )}
        
        {/* --- EXPANDED WORLD & LORE SECTIONS --- */}
        <SidebarSection title={t('sidebar.worldAndLore.title')}>
            {(storyEncyclopedia.worldBuilding || storyEncyclopedia.magicSystem) && (
                <div className="mb-4 space-y-2">
                    <InfoPair label={t('sidebar.worldAndLore.worldSummary')} value={storyEncyclopedia.worldBuilding} />
                    <InfoPair label={t('sidebar.worldAndLore.magicSummary')} value={storyEncyclopedia.magicSystem} />
                </div>
            )}

            {/* Geo */}
            {(hasItems(storyEncyclopedia.locations) || hasItems(storyEncyclopedia.factions) || hasItems(storyEncyclopedia.lore)) && (
                <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-700 pb-1">{t('world.subTabs.geo')}</h4>
                    {storyEncyclopedia.locations?.map(l => <LoreDisplay key={l.id} entry={l}/>)}
                    {storyEncyclopedia.factions?.map(f => <LoreDisplay key={f.id} entry={f}/>)}
                    {storyEncyclopedia.lore?.map(i => <LoreDisplay key={i.id} entry={i}/>)}
                </div>
            )}
            
            {/* Nature */}
            {(hasItems(storyEncyclopedia.races) || hasItems(storyEncyclopedia.creatures)) && (
                <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-700 pb-1">{t('world.subTabs.nature')}</h4>
                    {storyEncyclopedia.races?.map(r => <LoreDisplay key={r.id} entry={r}/>)}
                    {storyEncyclopedia.creatures?.map(c => <LoreDisplay key={c.id} entry={c}/>)}
                </div>
            )}

            {/* Power */}
            {(hasItems(storyEncyclopedia.powers) || hasItems(storyEncyclopedia.items) || hasItems(storyEncyclopedia.technology)) && (
                <div className="mb-4">
                     <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-700 pb-1">{t('world.subTabs.power')}</h4>
                    {storyEncyclopedia.powers?.map(p => <LoreDisplay key={p.id} entry={p}/>)}
                    {storyEncyclopedia.items?.map(i => <LoreDisplay key={i.id} entry={i}/>)}
                    {storyEncyclopedia.technology?.map(t => <LoreDisplay key={t.id} entry={t}/>)}
                </div>
            )}
            
            {/* History */}
            {(hasItems(storyEncyclopedia.history) || hasItems(storyEncyclopedia.cultures)) && (
                <div className="mb-4">
                     <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-700 pb-1">{t('world.subTabs.history')}</h4>
                    {storyEncyclopedia.history?.map(h => <LoreDisplay key={h.id} entry={h}/>)}
                    {storyEncyclopedia.cultures?.map(c => <LoreDisplay key={c.id} entry={c}/>)}
                </div>
            )}
        </SidebarSection>

        {/* TONE */}
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
        
        {/* PROSE */}
        <SidebarSection title={t('sidebar.proseStyle.title')}>
            <InfoPair label={t('sidebar.proseStyle.style')} value={storyEncyclopedia.proseStyle} />
            <InfoPair label={t('sidebar.tone.pov')} value={storyEncyclopedia.narrativePerspective} />
            {storyEncyclopedia.customProseStyleByExample && (
              <InfoPair label={t('sidebar.proseStyle.custom')} value={t('sidebar.proseStyle.customActive')} />
            )}
        </SidebarSection>

      </div>
    </aside>
  );
};

export default StoryEncyclopediaSidebar;
