
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useStory } from '../contexts/StoryContext';
import { SearchIcon } from './icons/SearchIcon';
import { XIcon } from './icons/XIcon';
import { SearchOptions, SearchResult } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface SearchReplaceModalProps {
    onClose: () => void;
}

const SearchReplaceModal: React.FC<SearchReplaceModalProps> = ({ onClose }) => {
    const { t } = useLanguage();
    const { searchGlobal, replaceGlobal } = useStory();
    
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [options, setOptions] = useState<SearchOptions>({ matchCase: false, wholeWord: false });
    const [results, setResults] = useState<SearchResult[] | null>(null);
    const [isReplacing, setIsReplacing] = useState(false);

    // Lock scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const handlePreview = (e: React.FormEvent) => {
        e.preventDefault();
        const matches = searchGlobal(findText, options);
        setResults(matches);
    };

    const handleReplaceAll = async () => {
        if (!confirm("Are you sure? This cannot be undone easily.")) return;
        
        setIsReplacing(true);
        const { matches, chaptersAffected } = await replaceGlobal(findText, replaceText, options);
        setIsReplacing(false);
        
        alert(t('searchReplace.replacedMatches', { total: matches, chapters: chaptersAffected }));
        onClose();
    };

    const totalMatches = results?.reduce((acc, curr) => acc + curr.matchCount, 0) || 0;
    const affectedChapters = results?.length || 0;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-w-lg w-full p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                            <SearchIcon className="w-6 h-6 text-indigo-400" />
                            {t('searchReplace.title')}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handlePreview} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">{t('searchReplace.find')}</label>
                        <input 
                            type="text" 
                            value={findText} 
                            onChange={e => setFindText(e.target.value)}
                            className="w-full bg-slate-700 text-slate-200 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">{t('searchReplace.replace')}</label>
                        <input 
                            type="text" 
                            value={replaceText} 
                            onChange={e => setReplaceText(e.target.value)}
                            className="w-full bg-slate-700 text-slate-200 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-sm">
                            <input 
                                type="checkbox" 
                                checked={options.matchCase} 
                                onChange={e => setOptions({...options, matchCase: e.target.checked})}
                                className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500"
                            />
                            {t('searchReplace.matchCase')}
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-sm">
                            <input 
                                type="checkbox" 
                                checked={options.wholeWord} 
                                onChange={e => setOptions({...options, wholeWord: e.target.checked})}
                                className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500"
                            />
                            {t('searchReplace.wholeWord')}
                        </label>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={!findText}
                        className="w-full py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('searchReplace.preview')}
                    </button>
                </form>

                {results !== null && (
                    <div className="mt-6 flex-grow overflow-hidden flex flex-col">
                        <h3 className="font-bold text-slate-300 mb-2">{t('searchReplace.resultsTitle')}</h3>
                        {results.length === 0 ? (
                            <div className="p-4 bg-slate-700/30 rounded-md text-slate-400 text-center text-sm">
                                {t('searchReplace.noMatches')}
                            </div>
                        ) : (
                            <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[200px]">
                                <div className="p-2 bg-indigo-900/20 border border-indigo-500/30 rounded-md text-indigo-200 text-sm mb-2">
                                    {t('searchReplace.foundMatches', { total: totalMatches, chapters: affectedChapters })}
                                </div>
                                {results.map(r => (
                                    <div key={r.chapterId} className="flex justify-between items-center p-2 bg-slate-700/50 rounded-md text-sm">
                                        <span className="text-slate-200 truncate">{r.chapterTitle}</span>
                                        <span className="bg-slate-600 text-slate-300 px-2 py-0.5 rounded text-xs">{r.matchCount}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {results.length > 0 && (
                            <button 
                                onClick={handleReplaceAll}
                                disabled={isReplacing}
                                className="mt-4 w-full py-2 bg-rose-600 text-white font-bold rounded-md hover:bg-rose-500 flex items-center justify-center gap-2"
                            >
                                {isReplacing && <SpinnerIcon className="w-4 h-4" />}
                                {t('searchReplace.replaceAll')}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchReplaceModal;
