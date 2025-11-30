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
            className={`flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg border transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${locked
                ? 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100'
                : 'text-indigo-600 bg-white border-gray-200 hover:bg-indigo-50 hover:border-indigo-200'
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
    <button type="button" onClick={onClick} disabled={isLoading} title={title} className="p-1 text-indigo-400 hover:text-indigo-300 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
        {isLoading ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
    </button>
);

export const FormSection: React.FC<{ title: string; children: React.ReactNode; grid?: boolean; onGenerate?: () => void; generateDisabled?: boolean; isGenerating?: boolean; onClear?: () => void; actions?: React.ReactNode; locked?: boolean }> = ({ title, children, grid = true, onGenerate, generateDisabled = false, isGenerating = false, onClear, actions, locked = false }) => {
    const { t } = useLanguage();
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
                <div className="flex items-center gap-2">
                    {actions}
                    {onClear && <button type="button" onClick={onClear} className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title={t('setup.clearSection')}><TrashIcon className="w-4 h-4" /></button>}
                    {onGenerate && <GenerateButton onClick={onGenerate} disabled={generateDisabled} isLoading={!!isGenerating} locked={locked} />}
                </div>
            </div>
            <div className={grid ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6"}>{children}</div>
        </div>
    );
};

export const FormField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; isTextArea?: boolean; fullWidth?: boolean; onGenerate?: () => void; isGenerating?: boolean; generateTitle?: string; placeholder?: string; }> = ({ label, name, value, onChange, isTextArea = false, fullWidth = false, onGenerate, isGenerating, generateTitle, placeholder }) => (
    <div className={fullWidth ? 'col-span-1 md:col-span-2' : ''}>
        <div className="flex items-center justify-between mb-1.5">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
            {onGenerate && <SubGenerateButton onClick={onGenerate} isLoading={!!isGenerating} title={generateTitle || 'Generate'} />}
        </div>
        {isTextArea ? (
            <textarea id={name} name={name} value={value || ''} onChange={onChange} rows={3} placeholder={placeholder} className="w-full bg-white text-gray-900 placeholder-gray-400 rounded-lg p-3 border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition duration-200 shadow-sm" />
        ) : (
            <input id={name} type="text" name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full bg-white text-gray-900 placeholder-gray-400 rounded-lg p-3 border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition duration-200 shadow-sm" />
        )}
    </div>
);
