import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { SparklesIcon } from './icons/SparklesIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckIcon } from './icons/CheckIcon';

interface EditorToolbarProps {
    onAction: (action: 'rewrite' | 'expand' | 'fixGrammar' | 'beatToProse') => void;
    onContinue: () => void;
    onAnalyze: () => void;
    isThinking: boolean;
    hasSelection: boolean;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ onAction, onContinue, onAnalyze, isThinking, hasSelection }) => {
    const { t } = useLanguage();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const tools = [
        { id: 'rewrite', label: t('chapterEditor.rewrite') },
        { id: 'expand', label: t('chapterEditor.expand') },
        { id: 'fixGrammar', label: t('chapterEditor.fixGrammar') },
        { id: 'beatToProse', label: t('chapterEditor.beatToProse') },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleActionClick = (actionId: string) => {
        onAction(actionId as any);
        setIsMenuOpen(false);
    };

    return (
        <div className="px-4 py-2 bg-slate-700/30 border-b border-slate-700 flex items-center gap-4 overflow-x-auto relative z-10">
            {/* Magic Tools Dropdown */}
            <div className="relative" ref={menuRef}>
                 <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    disabled={isThinking || !hasSelection}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${hasSelection ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30' : 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'}`}
                    title={!hasSelection ? t('chapterEditor.selectTextHint') : t('chapterEditor.magicTools')}
                 >
                    <SparklesIcon className="w-3 h-3" /> 
                    {t('chapterEditor.magicTools')}
                    <svg className={`w-3 h-3 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                 </button>

                 {isMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1">
                        {tools.map((tool) => (
                             <button
                                key={tool.id}
                                onClick={() => handleActionClick(tool.id)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                             >
                                {tool.label}
                             </button>
                        ))}
                    </div>
                 )}
            </div>

            <div className="w-px h-6 bg-slate-600"></div>
            
            <button
                onClick={onContinue}
                disabled={isThinking}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors shadow-sm shadow-indigo-500/20 whitespace-nowrap"
            >
                {isThinking ? <SpinnerIcon className="w-3 h-3" /> : <SparklesIcon className="w-3 h-3" />}
                {t('chapterEditor.continue')}
            </button>

            <div className="flex-grow"></div>

            <button
                 onClick={onAnalyze}
                 disabled={isThinking}
                 className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/30 transition-colors whitespace-nowrap"
            >
                 {isThinking ? <SpinnerIcon className="w-3 h-3" /> : <BrainCircuitIcon className="w-3 h-3" />}
                 {t('chapterEditor.analyze')}
            </button>
        </div>
    );
};

export default EditorToolbar;