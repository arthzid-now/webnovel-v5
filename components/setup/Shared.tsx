import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SpinnerIcon } from '../icons/SpinnerIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { LockIcon } from '../icons/LockIcon';

export const GenerateButton: React.FC<{ onClick: () => void; disabled: boolean; isLoading: boolean; label?: string; locked?: boolean }> = ({ onClick, disabled, isLoading, label, locked = false }) => {
    const { t } = useLanguage();
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`flex items-center justify-center gap-2 px-3 py-1 text-sm font-semibold rounded-md border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${locked
                ? 'text-slate-400 bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                : 'text-indigo-300 bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                }`}
            title={locked ? "⭐ Premium Feature" : undefined}
        >
            {isLoading ? <><SpinnerIcon className="w-4 h-4" />{t('common.generating')}</> : (
                locked ? <><LockIcon className="w-4 h-4" />{label || t('common.generateWithAi')}</> : <><SparklesIcon className="w-4 h-4" />{label || t('common.generateWithAi')}</>
            )}
        </button>
    );
}

export const SubGenerateButton: React.FC<{ onClick: () => void; isLoading: boolean; title: string; }> = ({ onClick, isLoading, title }) => (
    <button type="button" onClick={onClick} disabled={isLoading} title={title} className="p-1 text-indigo-400 hover:text-indigo-300 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50">
        {isLoading ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
    </button>
);

export const FormSection: React.FC<{ title: string; children: React.ReactNode; grid?: boolean; onGenerate?: () => void; generateDisabled?: boolean; isGenerating?: boolean; onClear?: () => void; actions?: React.ReactNode; locked?: boolean }> = ({ title, children, grid = true, onGenerate, generateDisabled = false, isGenerating = false, onClear, actions, locked = false }) => {
    const { t } = useLanguage();
    return (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <div className="flex justify-between items-center mb-4 border-b border-slate-600 pb-2">
                <h3 className="text-xl font-bold text-indigo-400">{title}</h3>
                <div className="flex items-center gap-2">
                    {actions}
                    {onClear && <button type="button" onClick={onClear} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-900/50 rounded-md transition-colors" title={t('setup.clearSection')}><TrashIcon className="w-4 h-4" /></button>}
                    {onGenerate && <GenerateButton onClick={onGenerate} disabled={generateDisabled} isLoading={!!isGenerating} locked={locked} />}
                </div>
            </div>
            <div className={grid ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>{children}</div>
        </div>
    );
};

export const FormField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; isTextArea?: boolean; fullWidth?: boolean; onGenerate?: () => void; isGenerating?: boolean; generateTitle?: string; placeholder?: string; }> = ({ label, name, value, onChange, isTextArea = false, fullWidth = false, onGenerate, isGenerating, generateTitle, placeholder }) => (
    <div className={fullWidth ? 'col-span-1 md:col-span-2' : ''}>
        <div className="flex items-center justify-between mb-1">
            <label htmlFor={name} className="block text-sm font-medium text-slate-300">{label}</label>
            {onGenerate && <SubGenerateButton onClick={onGenerate} isLoading={!!isGenerating} title={generateTitle || 'Generate'} />}
        </div>
        {isTextArea ? (
            <textarea id={name} name={name} value={value || ''} onChange={onChange} rows={3} placeholder={placeholder} className="w-full bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200" />
        ) : (
            <input id={name} type="text" name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200" />
        )}
    </div>
);
