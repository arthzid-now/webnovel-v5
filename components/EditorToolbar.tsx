import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { SparklesIcon } from './icons/SparklesIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { QuotaIndicator } from './quota/QuotaIndicator';

interface EditorToolbarProps {
    onAction: (action: 'rewrite' | 'expand' | 'fixGrammar' | 'beatToProse' | 'autoFormat') => void;
    onContinue: () => void;
    onAnalyze: () => void;
    isThinking: boolean;
    hasSelection: boolean;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ onAction, onContinue, onAnalyze, isThinking, hasSelection }) => {
    const { t } = useLanguage();
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const tools = [
        { id: 'rewrite', label: t('chapterEditor.rewrite') },
        { id: 'expand', label: t('chapterEditor.expand') },
        { id: 'fixGrammar', label: t('chapterEditor.fixGrammar') },
        { id: 'beatToProse', label: t('chapterEditor.beatToProse') },
        { id: 'autoFormat', label: t('chapterEditor.autoFormat') },
    ];

    const toggleMenu = () => {
        if (menuPosition) {
            setMenuPosition(null);
        } else if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 5,
                left: rect.left,
            });
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setMenuPosition(null);
            }
        };

        const handleScroll = () => {
            if (menuPosition) setMenuPosition(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [menuPosition]);

    const handleActionClick = (actionId: string) => {
        onAction(actionId as any);
        setMenuPosition(null);
    };

    return (
        <div className="sticky top-[73px] z-20 px-6 py-3 bg-white border-b border-amber-200/50 flex items-center gap-3 overflow-x-auto">
            {/* Primary CTA - Continue Writing */}
            <button
                onClick={onContinue}
                disabled={isThinking}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-all shadow-sm shadow-indigo-600/20 whitespace-nowrap"
            >
                {isThinking ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                {t('chapterEditor.continue')}
            </button>

            {/* Secondary CTA - Magic Tools Dropdown */}
            <button
                ref={buttonRef}
                onClick={toggleMenu}
                disabled={isThinking || !hasSelection}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${hasSelection
                    ? 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-300 hover:border-indigo-400'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed border-2 border-gray-100'
                    }`}
                title={!hasSelection ? t('chapterEditor.selectTextHint') : t('chapterEditor.magicTools')}
            >
                <SparklesIcon className="w-4 h-4" />
                {t('chapterEditor.magicTools')}
                <svg className={`w-3 h-3 transition-transform ${menuPosition ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {menuPosition && (
                <div
                    ref={menuRef}
                    className="fixed bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden py-1.5 z-50 w-52"
                    style={{ top: menuPosition.top, left: menuPosition.left }}
                >
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => handleActionClick(tool.id)}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors block font-medium"
                        >
                            {tool.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Tertiary CTA - Analyze Chapter */}
            <button
                onClick={onAnalyze}
                disabled={isThinking}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 border-2 border-gray-300 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 transition-all whitespace-nowrap"
            >
                {isThinking ? <SpinnerIcon className="w-4 h-4" /> : <BrainCircuitIcon className="w-4 h-4" />}
                {t('chapterEditor.analyze')}
            </button>

            <div className="flex-grow"></div>

            {/* Status bar - Lower visual weight */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
                <QuotaIndicator />
            </div>
        </div>
    );
};

export default EditorToolbar;