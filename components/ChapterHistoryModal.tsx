import React, { useState, useEffect } from 'react';
import { ChapterVersion } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useStory } from '../contexts/StoryContext';
import { XIcon } from './icons/XIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckIcon } from './icons/CheckIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ChapterHistoryModalProps {
    chapterId: string;
    onClose: () => void;
    onRestore: (version: ChapterVersion) => void;
}

const ChapterHistoryModal: React.FC<ChapterHistoryModalProps> = ({ chapterId, onClose, onRestore }) => {
    const { t } = useLanguage();
    const { getSnapshots, deleteSnapshot } = useStory();
    const [versions, setVersions] = useState<ChapterVersion[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<ChapterVersion | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const snaps = await getSnapshots(chapterId);
            setVersions(snaps);
            if (snaps.length > 0) {
                setSelectedVersion(snaps[0]);
            }
            setIsLoading(false);
        };
        load();
    }, [chapterId, getSnapshots]);

    const handleDelete = async (e: React.MouseEvent, versionId: number) => {
        e.stopPropagation();
        if (confirm(t('history.deleteConfirm'))) {
            await deleteSnapshot(versionId);
            setVersions(prev => prev.filter(v => v.id !== versionId));
            if (selectedVersion?.id === versionId) {
                setSelectedVersion(null);
            }
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-w-5xl w-full h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900/50 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                            <HistoryIcon className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-100">{t('history.title')}</h2>
                            <p className="text-xs text-slate-400">{t('history.subtitle')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow flex overflow-hidden">
                    {/* Sidebar List */}
                    <div className="w-64 bg-slate-900/30 border-r border-slate-700 overflow-y-auto flex-shrink-0 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex justify-center p-4"><SpinnerIcon className="w-6 h-6 text-indigo-500 animate-spin"/></div>
                        ) : versions.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 text-sm">{t('history.noVersions')}</div>
                        ) : (
                            <div className="flex flex-col">
                                {versions.map(v => (
                                    <div 
                                        key={v.id} 
                                        onClick={() => setSelectedVersion(v)}
                                        className={`p-3 border-b border-slate-700/50 cursor-pointer transition-colors hover:bg-slate-700/50 group flex justify-between items-start ${selectedVersion?.id === v.id ? 'bg-indigo-900/20 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'}`}
                                    >
                                        <div>
                                            <div className="font-bold text-slate-200 text-sm">{v.label || t('history.snapshot')}</div>
                                            <div className="text-xs text-slate-500 mt-1">{formatTime(v.timestamp)}</div>
                                            <div className="text-xs text-slate-600 mt-0.5">{v.content.length} chars</div>
                                        </div>
                                        <button onClick={(e) => handleDelete(e, v.id!)} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                            <TrashIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Preview Area */}
                    <div className="flex-grow flex flex-col bg-slate-800/50">
                        {selectedVersion ? (
                            <>
                                <div className="p-3 border-b border-slate-700 bg-slate-900/20 flex justify-between items-center">
                                    <div className="text-sm font-mono text-slate-400">
                                        <span className="font-bold text-slate-200">{selectedVersion.title}</span>
                                        <span className="mx-2">•</span>
                                        {formatTime(selectedVersion.timestamp)}
                                    </div>
                                    <button 
                                        onClick={() => onRestore(selectedVersion)}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-colors"
                                    >
                                        <CheckIcon className="w-4 h-4" />
                                        {t('history.restore')}
                                    </button>
                                </div>
                                <div className="flex-grow p-6 overflow-y-auto custom-scrollbar">
                                    <div className="prose prose-invert prose-sm max-w-none font-mono whitespace-pre-wrap text-slate-300">
                                        {selectedVersion.content}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                                {t('history.selectVersion')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChapterHistoryModal;