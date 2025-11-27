import React from 'react';
import { LoreEntry } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { TrashIcon } from '../icons/TrashIcon';
import { PlusIcon } from '../icons/PlusIcon';

interface LoreListEditorProps {
    listTitle: string;
    entries: LoreEntry[];
    onLoreChange: (index: number, field: keyof LoreEntry, value: string) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
}

export const LoreListEditor: React.FC<LoreListEditorProps> = ({ listTitle, entries, onLoreChange, onAdd, onRemove }) => {
    const { t } = useLanguage();
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-300 mt-4 border-t border-slate-700 pt-4">{listTitle}</h3>
            {entries?.map((entry, index) => (
                <div key={entry.id} className="p-3 bg-slate-700/50 rounded-md space-y-2 relative">
                    <input type="text" placeholder={t('common.name')} value={entry.name} onChange={(e) => onLoreChange(index, 'name', e.target.value)} className="w-full bg-slate-600 font-bold text-slate-100 placeholder-slate-400 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    <textarea placeholder={t('common.description')} value={entry.description} onChange={(e) => onLoreChange(index, 'description', e.target.value)} rows={3} className="w-full bg-slate-600 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    <button type="button" onClick={() => onRemove(index)} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-400" title={t('setup.lore.removeEntry', { title: listTitle })}><TrashIcon className="w-4 h-4" /></button>
                </div>
            ))}
            <button type="button" onClick={onAdd} className="w-full text-sm py-2 px-4 border-2 border-dashed border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 hover:border-slate-500 transition-colors flex items-center justify-center gap-2"><PlusIcon className="w-4 h-4" />{t('setup.lore.addEntry', { title: listTitle })}</button>
        </div>
    );
};
