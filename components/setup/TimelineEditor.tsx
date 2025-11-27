import React, { useState, useMemo } from 'react';
import { LoreEntry } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { TrashIcon } from '../icons/TrashIcon';
import { PlusIcon } from '../icons/PlusIcon';

interface TimelineEditorProps {
    listTitle: string;
    entries: LoreEntry[];
    onLoreChange: (index: number, field: keyof LoreEntry, value: string) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({ listTitle, entries, onLoreChange, onAdd, onRemove }) => {
    const { t } = useLanguage();
    const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');

    // Improved simple sorting logic
    const sortedEntries = useMemo(() => {
        if (viewMode === 'list') return entries.map((e, i) => ({ ...e, originalIndex: i }));
        return entries
            .map((e, i) => ({ ...e, originalIndex: i }))
            .sort((a, b) => {
                // Try to extract a year (number) from the start of the date string
                const getYear = (d?: string) => {
                    if (!d) return 999999; // No date goes to end
                    const match = d.match(/^-?\d+/); // Matches "2000", "-500"
                    return match ? parseInt(match[0], 10) : 999999;
                };
                const yearA = getYear(a.date);
                const yearB = getYear(b.date);
                if (yearA !== yearB) return yearA - yearB;
                return 0;
            });
    }, [entries, viewMode]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mt-4 border-t border-slate-700 pt-4">
                <h3 className="text-lg font-semibold text-slate-300">{listTitle}</h3>
                <div className="flex bg-slate-700 rounded-lg p-1 text-xs">
                    <button
                        type="button"
                        onClick={() => setViewMode('visual')}
                        className={`px-3 py-1 rounded-md transition-all ${viewMode === 'visual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Timeline
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        List
                    </button>
                </div>
            </div>

            {viewMode === 'visual' && entries.length > 0 ? (
                <div className="relative py-8 px-2">
                    {/* The Spine */}
                    <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-indigo-500 to-transparent opacity-50"></div>

                    <div className="space-y-8">
                        {sortedEntries.map((entry, index) => (
                            <div key={entry.id} className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'} flex-row`}>
                                {/* Node on the line */}
                                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-2 border-indigo-400 rounded-full z-10 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>

                                {/* Spacer for desktop alternating layout */}
                                <div className="hidden md:block md:w-1/2"></div>

                                {/* Content Card */}
                                <div className={`w-full md:w-1/2 pl-10 md:pl-0 ${index % 2 === 0 ? 'md:pr-8 text-left' : 'md:pl-8 text-left'}`}>
                                    <div className="bg-slate-800/40 border border-slate-600/50 backdrop-blur-sm p-4 rounded-lg hover:border-indigo-500/50 transition-all group relative">
                                        <input
                                            type="text"
                                            placeholder="Year/Era (e.g., 2050)"
                                            value={entry.date || ''}
                                            onChange={(e) => onLoreChange(entry.originalIndex, 'date', e.target.value)}
                                            className="text-xs font-mono text-indigo-300 bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none w-full mb-1"
                                        />
                                        <input
                                            type="text"
                                            value={entry.name}
                                            onChange={(e) => onLoreChange(entry.originalIndex, 'name', e.target.value)}
                                            placeholder={t('common.name')}
                                            className="w-full bg-transparent font-bold text-slate-200 placeholder-slate-500 focus:outline-none text-sm mb-1"
                                        />
                                        <textarea
                                            value={entry.description}
                                            onChange={(e) => onLoreChange(entry.originalIndex, 'description', e.target.value)}
                                            placeholder={t('common.description')}
                                            rows={2}
                                            className="w-full bg-transparent text-xs text-slate-400 placeholder-slate-600 focus:outline-none resize-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => onRemove(entry.originalIndex)}
                                            className="absolute top-2 right-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <TrashIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {entries?.map((entry, index) => (
                        <div key={entry.id} className="p-3 bg-slate-700/50 rounded-md space-y-2 relative border-l-4 border-indigo-500">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Year/Era"
                                    value={entry.date || ''}
                                    onChange={(e) => onLoreChange(index, 'date', e.target.value)}
                                    className="w-1/3 bg-slate-600 text-xs font-mono text-indigo-200 placeholder-slate-400 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder={t('common.name')}
                                    value={entry.name}
                                    onChange={(e) => onLoreChange(index, 'name', e.target.value)}
                                    className="w-2/3 bg-slate-600 font-bold text-slate-100 placeholder-slate-400 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>
                            <textarea
                                placeholder={t('common.description')}
                                value={entry.description}
                                onChange={(e) => onLoreChange(index, 'description', e.target.value)}
                                rows={2}
                                className="w-full bg-slate-600 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                            <button type="button" onClick={() => onRemove(index)} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-400"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
            )}

            <button type="button" onClick={onAdd} className="w-full text-sm py-2 px-4 border-2 border-dashed border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 hover:border-slate-500 transition-colors flex items-center justify-center gap-2"><PlusIcon className="w-4 h-4" />{t('setup.lore.addEntry', { title: listTitle })}</button>
        </div>
    );
};
