import React, { useState, useEffect } from 'react';
import { Universe, LoreEntry } from '../types';
import { GlobeIcon } from './icons/GlobeIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface UniverseSetupProps {
  apiKey: string;
  onSave: (data: Universe) => void;
  initialData?: Universe | null;
  onCancel: () => void;
}

const createEmptyLoreEntry = (): LoreEntry => ({ id: crypto.randomUUID(), name: '', description: '' });

const createInitialFormData = (language: 'en' | 'id'): Universe => ({
  id: crypto.randomUUID(),
  language: language,
  name: '',
  description: '',
  // Initialized empty arrays for all categories
  locations: [], factions: [], lore: [],
  races: [], creatures: [],
  powers: [], items: [], technology: [],
  history: [], cultures: [],
  magicSystem: '',
  worldBuilding: '',
});

const LoreListEditor: React.FC<{
  listTitle: string;
  entries: LoreEntry[];
  onLoreChange: (index: number, field: keyof LoreEntry, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}> = ({ listTitle, entries, onLoreChange, onAdd, onRemove }) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700 mt-4 border-t border-gray-200 pt-4">{listTitle}</h3>
      {entries?.map((entry, index) => (
        <div key={entry.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 relative group">
          <input
            type="text"
            placeholder={t('common.name')}
            value={entry.name}
            onChange={(e) => onLoreChange(index, 'name', e.target.value)}
            className="w-full bg-white font-bold text-gray-900 placeholder-gray-400 rounded-lg p-2.5 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
          />
          <textarea
            placeholder={t('common.description')}
            value={entry.description}
            onChange={(e) => onLoreChange(index, 'description', e.target.value)}
            rows={3}
            className="w-full bg-white text-gray-700 placeholder-gray-400 rounded-lg p-2.5 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title={t('universeSetup.removeEntry', { listTitle: listTitle })}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="w-full text-sm py-2.5 px-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 font-medium"
      >
        <PlusIcon className="w-4 h-4" />
        {t('universeSetup.addEntry', { listTitle: listTitle })}
      </button>
    </div>
  );
};

const UniverseSetup: React.FC<UniverseSetupProps> = ({ apiKey, onSave, initialData, onCancel }) => {
  const { t } = useLanguage();
  const [contentLanguage, setContentLanguage] = useState<'en' | 'id'>(initialData?.language || 'en');
  const [formData, setFormData] = useState<Universe>(initialData || createInitialFormData(contentLanguage));
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setContentLanguage(initialData.language);
    } else {
      setFormData(createInitialFormData(contentLanguage));
    }
  }, [initialData, contentLanguage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Generic handler for ANY lore list in the Universe object
  const handleLoreChange = (type: keyof Universe, index: number, field: keyof LoreEntry, value: string) => {
    setFormData(prev => {
      // Type assertion needed because TS doesn't know for sure that prev[type] is LoreEntry[]
      const list = (prev[type] as LoreEntry[]) || [];
      const newEntries = [...list];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return { ...prev, [type]: newEntries };
    });
  };

  const addLoreEntry = (type: keyof Universe) => {
    setFormData(prev => ({ ...prev, [type]: [...((prev[type] as LoreEntry[]) || []), createEmptyLoreEntry()] }));
  };

  const removeLoreEntry = (type: keyof Universe, index: number) => {
    setFormData(prev => ({ ...prev, [type]: (prev[type] as LoreEntry[]).filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert(t('universeSetup.nameRequired'));
      return;
    }
    onSave(formData);
  };

  // FIX: Prevent implicit submission on Enter for input fields
  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault();
    }
  };

  return (
    <div className="w-full p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight font-display">{isEditing ? t('universeSetup.titleEdit') : t('universeSetup.titleCreate')}</h2>
          <p className="text-gray-500 mt-2 text-lg">{isEditing ? t('universeSetup.subtitleEdit') : t('universeSetup.subtitleCreate')}</p>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-gray-900">{t('universeSetup.coreDetails')}</h3>
              {!isEditing && (
                <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
                  <button type="button" onClick={() => setContentLanguage('en')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${contentLanguage === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}> English </button>
                  <button type="button" onClick={() => setContentLanguage('id')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${contentLanguage === 'id' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}> Indonesia </button>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">{t('universeSetup.name')}</label>
              <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder={t('universeSetup.namePlaceholder')} className="w-full bg-white text-gray-900 placeholder-gray-400 rounded-lg p-3 border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition duration-200 shadow-sm" />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">{t('common.description')}</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder={t('universeSetup.descriptionPlaceholder')} rows={2} className="w-full bg-white text-gray-900 placeholder-gray-400 rounded-lg p-3 border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition duration-200 shadow-sm" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-8">
            <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">{t('universeSetup.worldAndLore')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="worldBuilding" className="block text-sm font-medium text-gray-700 mb-1.5">{t('universeSetup.worldBuildingSummary')}</label>
                <textarea id="worldBuilding" name="worldBuilding" value={formData.worldBuilding || ''} onChange={handleChange} rows={3} className="w-full bg-white text-gray-900 placeholder-gray-400 rounded-lg p-3 border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none shadow-sm" />
              </div>
              <div>
                <label htmlFor="magicSystem" className="block text-sm font-medium text-gray-700 mb-1.5">{t('universeSetup.magicSystemSummary')}</label>
                <textarea id="magicSystem" name="magicSystem" value={formData.magicSystem || ''} onChange={handleChange} rows={3} className="w-full bg-white text-gray-900 placeholder-gray-400 rounded-lg p-3 border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none shadow-sm" />
              </div>
            </div>

            {/* Expanded Universe Editing Sections */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t('world.subTabs.geo')}</h4>
              <div className="grid grid-cols-1 gap-6">
                <LoreListEditor listTitle={t('universeSetup.locations')} entries={formData.locations} onLoreChange={(i, f, v) => handleLoreChange('locations', i, f, v)} onAdd={() => addLoreEntry('locations')} onRemove={(i) => removeLoreEntry('locations', i)} />
                <LoreListEditor listTitle={t('universeSetup.factions')} entries={formData.factions} onLoreChange={(i, f, v) => handleLoreChange('factions', i, f, v)} onAdd={() => addLoreEntry('factions')} onRemove={(i) => removeLoreEntry('factions', i)} />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 pt-6 border-t border-gray-100">{t('world.subTabs.nature')}</h4>
              <div className="grid grid-cols-1 gap-6">
                <LoreListEditor listTitle={t('setup.lore.races')} entries={formData.races || []} onLoreChange={(i, f, v) => handleLoreChange('races', i, f, v)} onAdd={() => addLoreEntry('races')} onRemove={(i) => removeLoreEntry('races', i)} />
                <LoreListEditor listTitle={t('setup.lore.creatures')} entries={formData.creatures || []} onLoreChange={(i, f, v) => handleLoreChange('creatures', i, f, v)} onAdd={() => addLoreEntry('creatures')} onRemove={(i) => removeLoreEntry('creatures', i)} />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 pt-6 border-t border-gray-100">{t('world.subTabs.power')}</h4>
              <div className="grid grid-cols-1 gap-6">
                <LoreListEditor listTitle={t('setup.lore.powers')} entries={formData.powers || []} onLoreChange={(i, f, v) => handleLoreChange('powers', i, f, v)} onAdd={() => addLoreEntry('powers')} onRemove={(i) => removeLoreEntry('powers', i)} />
                <LoreListEditor listTitle={t('setup.lore.items')} entries={formData.items || []} onLoreChange={(i, f, v) => handleLoreChange('items', i, f, v)} onAdd={() => addLoreEntry('items')} onRemove={(i) => removeLoreEntry('items', i)} />
                <LoreListEditor listTitle={t('setup.lore.technology')} entries={formData.technology || []} onLoreChange={(i, f, v) => handleLoreChange('technology', i, f, v)} onAdd={() => addLoreEntry('technology')} onRemove={(i) => removeLoreEntry('technology', i)} />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 pt-6 border-t border-gray-100">{t('world.subTabs.history')}</h4>
              <div className="grid grid-cols-1 gap-6">
                <LoreListEditor listTitle={t('setup.lore.history')} entries={formData.history || []} onLoreChange={(i, f, v) => handleLoreChange('history', i, f, v)} onAdd={() => addLoreEntry('history')} onRemove={(i) => removeLoreEntry('history', i)} />
                <LoreListEditor listTitle={t('setup.lore.cultures')} entries={formData.cultures || []} onLoreChange={(i, f, v) => handleLoreChange('cultures', i, f, v)} onAdd={() => addLoreEntry('cultures')} onRemove={(i) => removeLoreEntry('cultures', i)} />
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center gap-4 pt-8 pb-12">
            <button type="button" onClick={onCancel} className="text-gray-500 font-bold py-3 px-8 rounded-xl hover:bg-gray-100 transition-colors duration-300">{t('common.cancel')}</button>
            <button type="submit" className="bg-indigo-600 text-white font-bold py-3 px-10 rounded-xl hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transform hover:-translate-y-0.5">
              {isEditing ? t('universeSetup.saveButton') : t('universeSetup.createButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UniverseSetup;