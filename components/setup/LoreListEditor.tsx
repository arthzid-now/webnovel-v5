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
            <h3 className="text-lg font-bold text-gray-700 mt-6 mb-4">{listTitle}</h3>
            {entries?.map((entry, index) => (
                <div key={entry.id} className="p-4 bg-white rounded-xl border border-gray-200 space-y-3 relative group transition-all hover:border-gray-300 hover:shadow-sm">
                    <input type="text" placeholder={t('common.name')} value={entry.name} onChange={(e) => onLoreChange(index, 'name', e.target.value)} className="w-full bg-gray-50 font-bold text-gray-900 placeholder-gray-400 rounded-lg p-3 border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all" />
                    <textarea placeholder={t('common.description')} value={entry.description} onChange={(e) => onLoreChange(index, 'description', e.target.value)} rows={3} className="w-full bg-gray-50 text-gray-700 placeholder-gray-400 rounded-lg p-3 border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all" />
                    <button type="button" onClick={() => onRemove(index)} className="absolute top-3 right-3 p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100" title={t('setup.lore.removeEntry', { title: listTitle })}><TrashIcon className="w-4 h-4" /></button>
                </div>
            ))}
            <button type="button" onClick={onAdd} className="w-full py-4 px-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 group">
                <div className="p-1 rounded-md bg-gray-100 group-hover:bg-indigo-50 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                </div>
                <span className="font-medium">{t('setup.lore.addEntry', { title: listTitle })}</span>
            </button>
        </div>
    );
};
