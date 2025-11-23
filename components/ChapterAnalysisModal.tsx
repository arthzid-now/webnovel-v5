import React, { useState } from 'react';
import { AnalysisResult, Character, LoreEntry, StoryArcAct } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { CheckIcon } from './icons/CheckIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface ChapterAnalysisModalProps {
    result: AnalysisResult;
    storyArc: StoryArcAct[]; // Added prop
    onSave: (selectedResult: AnalysisResult, targetActIndex: number) => void; // Updated callback
    onClose: () => void;
}

const ChapterAnalysisModal: React.FC<ChapterAnalysisModalProps> = ({ result, storyArc, onSave, onClose }) => {
    const { t } = useLanguage();
    
    // Local state to track what the user wants to keep
    const [selectedChars, setSelectedChars] = useState<boolean[]>(new Array(result.newCharacters.length).fill(true));
    const [selectedLocs, setSelectedLocs] = useState<boolean[]>(new Array(result.newLocations.length).fill(true));
    const [selectedPlots, setSelectedPlots] = useState<boolean[]>(new Array(result.newPlotPoints.length).fill(true));
    
    // Default to the last act as it's the most likely target for new content
    const [selectedActIndex, setSelectedActIndex] = useState<number>(Math.max(0, storyArc.length - 1));

    const toggleChar = (index: number) => setSelectedChars(prev => { const n = [...prev]; n[index] = !n[index]; return n; });
    const toggleLoc = (index: number) => setSelectedLocs(prev => { const n = [...prev]; n[index] = !n[index]; return n; });
    const togglePlot = (index: number) => setSelectedPlots(prev => { const n = [...prev]; n[index] = !n[index]; return n; });

    const handleSave = () => {
        const filteredResult: AnalysisResult = {
            newCharacters: result.newCharacters.filter((_, i) => selectedChars[i]),
            newLocations: result.newLocations.filter((_, i) => selectedLocs[i]),
            newPlotPoints: result.newPlotPoints.filter((_, i) => selectedPlots[i]),
            summary: result.summary
        };
        onSave(filteredResult, selectedActIndex);
    };

    const isEmpty = result.newCharacters.length === 0 && result.newLocations.length === 0 && result.newPlotPoints.length === 0;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-700 flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                        <SparklesIcon className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-100">{t('analysis.title')}</h2>
                        <p className="text-sm text-slate-400">{t('analysis.subtitle')}</p>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-grow space-y-6">
                    {isEmpty && (
                        <div className="text-center text-slate-400 py-8">
                            {t('analysis.noData')}
                        </div>
                    )}

                    {result.newCharacters.length > 0 && (
                        <div>
                            <h3 className="text-indigo-400 font-semibold mb-3 flex items-center gap-2">
                                {t('analysis.newCharacters')} ({result.newCharacters.length})
                            </h3>
                            <div className="grid gap-3">
                                {result.newCharacters.map((char, i) => (
                                    <div key={i} onClick={() => toggleChar(i)} className={`cursor-pointer border rounded-md p-3 transition-colors ${selectedChars[i] ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-700/30 border-slate-700 opacity-60'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-slate-200">{char.name}</span>
                                            {selectedChars[i] && <CheckIcon className="w-4 h-4 text-indigo-400" />}
                                        </div>
                                        <p className="text-xs text-slate-400 line-clamp-2">{char.physicalDescription} {char.personalityTraits}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {result.newLocations.length > 0 && (
                        <div>
                            <h3 className="text-indigo-400 font-semibold mb-3 flex items-center gap-2">
                                {t('analysis.newLocations')} ({result.newLocations.length})
                            </h3>
                            <div className="grid gap-3">
                                {result.newLocations.map((loc, i) => (
                                    <div key={i} onClick={() => toggleLoc(i)} className={`cursor-pointer border rounded-md p-3 transition-colors ${selectedLocs[i] ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-700/30 border-slate-700 opacity-60'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-slate-200">{loc.name}</span>
                                            {selectedLocs[i] && <CheckIcon className="w-4 h-4 text-indigo-400" />}
                                        </div>
                                        <p className="text-xs text-slate-400 line-clamp-2">{loc.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {result.newPlotPoints.length > 0 && (
                        <div>
                            <h3 className="text-indigo-400 font-semibold mb-3 flex items-center gap-2">
                                {t('analysis.newPlotPoints')} ({result.newPlotPoints.length})
                            </h3>
                            <div className="space-y-2">
                                {result.newPlotPoints.map((point, i) => (
                                    <div key={i} onClick={() => togglePlot(i)} className={`cursor-pointer flex items-start gap-3 p-2 rounded-md transition-colors ${selectedPlots[i] ? 'bg-indigo-900/20' : 'opacity-60'}`}>
                                        <div className={`w-4 h-4 mt-1 rounded border flex items-center justify-center flex-shrink-0 ${selectedPlots[i] ? 'border-indigo-500 bg-indigo-500' : 'border-slate-500'}`}>
                                            {selectedPlots[i] && <CheckIcon className="w-3 h-3 text-white" />}
                                        </div>
                                        <p className="text-sm text-slate-300">{point}</p>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Act Selector for Plot Points */}
                            <div className="mt-4 p-3 bg-slate-700/50 rounded-md border border-slate-600">
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    {t('analysis.targetAct')}
                                </label>
                                <select 
                                    value={selectedActIndex} 
                                    onChange={(e) => setSelectedActIndex(Number(e.target.value))}
                                    className="w-full bg-slate-600 text-slate-200 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    {storyArc.map((act, index) => (
                                        <option key={index} value={index}>
                                            {act.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-700 bg-slate-900/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-slate-200 font-medium flex items-center gap-2">
                        <TrashIcon className="w-4 h-4"/> {t('analysis.discard')}
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isEmpty || (!selectedChars.some(Boolean) && !selectedLocs.some(Boolean) && !selectedPlots.some(Boolean))}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <CheckIcon className="w-4 h-4" />
                        {t('analysis.addToEncyclopedia')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChapterAnalysisModal;