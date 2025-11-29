import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ChangelogChanges {
    added?: string[];
    changed?: string[];
    fixed?: string[];
    deprecated?: string[];
    removed?: string[];
    security?: string[];
}

interface WhatsNewModalProps {
    version: string;
    date: string;
    changes: ChangelogChanges;
    onClose: () => void;
}

const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ version, date, changes, onClose }) => {
    const { t } = useLanguage();

    const handleDontShowAgain = () => {
        localStorage.setItem('lastSeenVersion', version);
        onClose();
    };

    const handleClose = () => {
        localStorage.setItem('lastSeenVersion', version);
        onClose();
    };

    const hasChanges = Object.values(changes).some(arr => arr && arr.length > 0);

    if (!hasChanges) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <span className="text-3xl">✨</span>
                                {t('whatsNew.title')}
                            </h2>
                            <p className="text-indigo-100 mt-1">
                                {t('whatsNew.version', { version })} • {date}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-white/80 hover:text-white transition-colors text-2xl leading-none"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-grow">
                    {changes.added && changes.added.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-3">
                                <span className="text-xl">🎉</span>
                                {t('whatsNew.added')}
                            </h3>
                            <ul className="space-y-2">
                                {changes.added.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-slate-300">
                                        <span className="text-emerald-500 mt-1">▸</span>
                                        <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, '<strong class="text-emerald-400">$1</strong>') }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {changes.fixed && changes.fixed.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2 mb-3">
                                <span className="text-xl">🔧</span>
                                {t('whatsNew.fixed')}
                            </h3>
                            <ul className="space-y-2">
                                {changes.fixed.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-slate-300">
                                        <span className="text-blue-500 mt-1">▸</span>
                                        <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, '<strong class="text-blue-400">$1</strong>') }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {changes.changed && changes.changed.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 mb-3">
                                <span className="text-xl">⚡</span>
                                {t('whatsNew.changed')}
                            </h3>
                            <ul className="space-y-2">
                                {changes.changed.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-slate-300">
                                        <span className="text-amber-500 mt-1">▸</span>
                                        <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, '<strong class="text-amber-400">$1</strong>') }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {changes.deprecated && changes.deprecated.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2 mb-3">
                                <span className="text-xl">⚠️</span>
                                {t('whatsNew.deprecated')}
                            </h3>
                            <ul className="space-y-2">
                                {changes.deprecated.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-slate-300">
                                        <span className="text-orange-500 mt-1">▸</span>
                                        <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, '<strong class="text-orange-400">$1</strong>') }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {changes.removed && changes.removed.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-3">
                                <span className="text-xl">🗑️</span>
                                {t('whatsNew.removed')}
                            </h3>
                            <ul className="space-y-2">
                                {changes.removed.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-slate-300">
                                        <span className="text-red-500 mt-1">▸</span>
                                        <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, '<strong class="text-red-400">$1</strong>') }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {changes.security && changes.security.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2 mb-3">
                                <span className="text-xl">🔒</span>
                                {t('whatsNew.security')}
                            </h3>
                            <ul className="space-y-2">
                                {changes.security.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-slate-300">
                                        <span className="text-purple-500 mt-1">▸</span>
                                        <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, '<strong class="text-purple-400">$1</strong>') }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-700 flex-shrink-0 flex justify-between items-center bg-slate-800/50">
                    <button
                        onClick={handleDontShowAgain}
                        className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
                    >
                        {t('whatsNew.dontShowAgain')}
                    </button>
                    <button
                        onClick={handleClose}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-600/30"
                    >
                        {t('whatsNew.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WhatsNewModal;
