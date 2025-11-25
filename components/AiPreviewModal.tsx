import React, { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CheckIcon } from './icons/CheckIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface AiPreviewModalProps {
    isOpen: boolean;
    type: 'modification' | 'addition';
    originalText: string;
    generatedText: string;
    onApply: () => void;
    onDiscard: () => void;
}

const AiPreviewModal: React.FC<AiPreviewModalProps> = ({ isOpen, type, originalText, generatedText, onApply, onDiscard }) => {
    const { t } = useLanguage();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onDiscard}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-5 border-b border-slate-700 flex items-center gap-3 bg-slate-900/50 rounded-t-lg">
                    <div className="p-2 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                        <SparklesIcon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-100">{t('editor.previewTitle')}</h2>
                        <p className="text-xs text-slate-400">{type === 'modification' ? 'Compare changes before applying' : 'Review generated content'}</p>
                    </div>
                </div>

                {/* Content Comparison */}
                <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                    {type === 'modification' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-900/30 p-2 rounded border border-slate-700/50">
                                    {t('editor.originalSelection')}
                                </span>
                                <div className="flex-grow bg-slate-900/30 p-4 rounded-lg border border-rose-900/30 text-slate-300 whitespace-pre-wrap font-mono text-sm overflow-y-auto max-h-[60vh] shadow-inner">
                                    {originalText}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider bg-indigo-900/20 p-2 rounded border border-indigo-500/30">
                                    {t('editor.aiSuggestion')}
                                </span>
                                <div className="flex-grow bg-indigo-900/10 p-4 rounded-lg border border-indigo-500/30 text-slate-200 whitespace-pre-wrap font-mono text-sm overflow-y-auto max-h-[60vh] shadow-inner">
                                    {generatedText}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 h-full">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider bg-indigo-900/20 p-2 rounded border border-indigo-500/30">
                                {t('editor.addition')}
                            </span>
                            <div className="flex-grow bg-indigo-900/10 p-4 rounded-lg border border-indigo-500/30 text-slate-200 whitespace-pre-wrap font-mono text-sm overflow-y-auto max-h-[60vh] shadow-inner">
                                {generatedText}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-slate-700 bg-slate-900/50 rounded-b-lg flex justify-end gap-3">
                    <button 
                        onClick={onDiscard}
                        className="px-5 py-2.5 rounded-lg font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-all flex items-center gap-2"
                    >
                        <TrashIcon className="w-4 h-4"/> {t('editor.discard')}
                    </button>
                    <button 
                        onClick={onApply}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
                    >
                        <CheckIcon className="w-4 h-4" />
                        {t('editor.apply')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiPreviewModal;