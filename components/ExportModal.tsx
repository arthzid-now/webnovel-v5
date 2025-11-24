
import React, { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { XIcon } from './icons/XIcon';

interface ExportModalProps {
    onClose: () => void;
    onExport: (format: 'epub' | 'html' | 'txt' | 'json' | 'md') => void;
}

const ExportOption: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    buttonLabel: string;
    onClick: () => void;
    primary?: boolean;
}> = ({ icon, title, description, buttonLabel, onClick, primary }) => (
    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 flex flex-col gap-3 hover:bg-slate-700 transition-colors">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${primary ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-600/50 text-slate-400'}`}>
                {icon}
            </div>
            <h3 className="font-bold text-slate-100">{title}</h3>
        </div>
        <p className="text-xs text-slate-400 flex-grow">{description}</p>
        <button 
            onClick={onClick}
            className={`w-full py-2 px-3 rounded-md text-sm font-bold transition-colors ${primary ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-600 hover:bg-slate-500 text-slate-200'}`}
        >
            {buttonLabel}
        </button>
    </div>
);

const ExportModal: React.FC<ExportModalProps> = ({ onClose, onExport }) => {
    const { t } = useLanguage();

    // Lock scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-w-3xl w-full p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                            <DownloadIcon className="w-6 h-6 text-indigo-400" />
                            {t('export.title')}
                        </h2>
                        <p className="text-slate-400 mt-1">{t('export.subtitle')}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ExportOption 
                        icon={<BookOpenIcon className="w-5 h-5" />}
                        title={t('export.epub.title')}
                        description={t('export.epub.desc')}
                        buttonLabel={t('export.epub.button')}
                        onClick={() => onExport('epub')}
                        primary
                    />
                    <ExportOption 
                        icon={<GlobeIcon className="w-5 h-5" />}
                        title={t('export.html.title')}
                        description={t('export.html.desc')}
                        buttonLabel={t('export.html.button')}
                        onClick={() => onExport('html')}
                    />
                    <ExportOption 
                        icon={<ClipboardIcon className="w-5 h-5" />}
                        title={t('export.txt.title')}
                        description={t('export.txt.desc')}
                        buttonLabel={t('export.txt.button')}
                        onClick={() => onExport('txt')}
                    />
                    <ExportOption 
                        icon={<DatabaseIcon className="w-5 h-5" />}
                        title={t('export.json.title')}
                        description={t('export.json.desc')}
                        buttonLabel={t('export.json.button')}
                        onClick={() => onExport('json')}
                    />
                    <ExportOption 
                        icon={<DownloadIcon className="w-5 h-5" />}
                        title={t('export.markdown.title')}
                        description={t('export.markdown.desc')}
                        buttonLabel={t('export.markdown.button')}
                        onClick={() => onExport('md')}
                    />
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end">
                    <button onClick={onClose} className="text-slate-400 hover:text-white font-semibold">
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
