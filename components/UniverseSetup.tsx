
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
        <h3 className="text-lg font-semibold text-slate-300 mt-4 border-t border-slate-700 pt-4">{listTitle}</h3>
        {entries?.map((entry, index) => (
            <div key={entry.id} className="p-3 bg-slate-700/50 rounded-md space-y-2 relative">
                <input
                    type="text"
                    placeholder={t('common.name')}
                    value={entry.name}
                    onChange={(e) => onLoreChange(index, 'name', e.target.value)}
                    className="w-full bg-slate-600 font-bold text-slate-100 placeholder-slate-400 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <textarea
                    placeholder={t('common.description')}
                    value={entry.description}
                    onChange={(e) => onLoreChange(index, 'description', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-600 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-400"
                    title={t('universeSetup.removeEntry', { listTitle: listTitle })}
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        ))}
        <button
            type="button"
            onClick={onAdd}
            className="w-full text-sm py-2 px-4 border-2 border-dashed border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 hover:border-slate-500 transition-colors flex items-center justify-center gap-2"
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

  return (
    <div className="w-full p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-100">{isEditing ? t('universeSetup.titleEdit') : t('universeSetup.titleCreate')}</h2>
          <p className="text-slate-400 mt-2">{isEditing ? t('universeSetup.subtitleEdit') : t('universeSetup.subtitleCreate')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-indigo-400">{t('universeSetup.coreDetails')}</h3>
                {!isEditing && (
                    <div className="flex items-center gap-2 rounded-lg bg-slate-700 p-1">
                        <button type="button" onClick={() => setContentLanguage('en')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${ contentLanguage === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-600' }`}> English </button>
                        <button type="button" onClick={() => setContentLanguage('id')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${ contentLanguage === 'id' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-600' }`}> Indonesia </button>
                    </div>
                )}
            </div>
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">{t('universeSetup.name')}</label>
                <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder={t('universeSetup.namePlaceholder')} className="w-full bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200" />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">{t('common.description')}</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder={t('universeSetup.descriptionPlaceholder')} rows={2} className="w-full bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200" />
            </div>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 space-y-8">
              <h3 className="text-xl font-bold text-indigo-400 border-b border-slate-600 pb-2">{t('universeSetup.worldAndLore')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="worldBuilding" className="block text-sm font-medium text-slate-300 mb-1">{t('universeSetup.worldBuildingSummary')}</label>
                    <textarea id="worldBuilding" name="worldBuilding" value={formData.worldBuilding || ''} onChange={handleChange} rows={3} className="w-full bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                    <label htmlFor="magicSystem" className="block text-sm font-medium text-slate-300 mb-1">{t('universeSetup.magicSystemSummary')}</label>
                    <textarea id="magicSystem" name="magicSystem" value={formData.magicSystem || ''} onChange={handleChange} rows={3} className="w-full bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>

              {/* Expanded Universe Editing Sections */}
              <div>
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">{t('world.subTabs.geo')}</h4>
                  <div className="grid grid-cols-1 gap-6">
                     <LoreListEditor listTitle={t('universeSetup.locations')} entries={formData.locations} onLoreChange={(i, f, v) => handleLoreChange('locations', i, f, v)} onAdd={() => addLoreEntry('locations')} onRemove={(i) => removeLoreEntry('locations', i)} />
                     <LoreListEditor listTitle={t('universeSetup.factions')} entries={formData.factions} onLoreChange={(i, f, v) => handleLoreChange('factions', i, f, v)} onAdd={() => addLoreEntry('factions')} onRemove={(i) => removeLoreEntry('factions', i)} />
                  </div>
              </div>

              <div>
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2 pt-4 border-t border-slate-700">{t('world.subTabs.nature')}</h4>
                   <div className="grid grid-cols-1 gap-6">
                     <LoreListEditor listTitle={t('setup.lore.races')} entries={formData.races || []} onLoreChange={(i, f, v) => handleLoreChange('races', i, f, v)} onAdd={() => addLoreEntry('races')} onRemove={(i) => removeLoreEntry('races', i)} />
                     <LoreListEditor listTitle={t('setup.lore.creatures')} entries={formData.creatures || []} onLoreChange={(i, f, v) => handleLoreChange('creatures', i, f, v)} onAdd={() => addLoreEntry('creatures')} onRemove={(i) => removeLoreEntry('creatures', i)} />
                  </div>
              </div>

              <div>
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2 pt-4 border-t border-slate-700">{t('world.subTabs.power')}</h4>
                   <div className="grid grid-cols-1 gap-6">
                     <LoreListEditor listTitle={t('setup.lore.powers')} entries={formData.powers || []} onLoreChange={(i, f, v) => handleLoreChange('powers', i, f, v)} onAdd={() => addLoreEntry('powers')} onRemove={(i) => removeLoreEntry('powers', i)} />
                     <LoreListEditor listTitle={t('setup.lore.items')} entries={formData.items || []} onLoreChange={(i, f, v) => handleLoreChange('items', i, f, v)} onAdd={() => addLoreEntry('items')} onRemove={(i) => removeLoreEntry('items', i)} />
                     <LoreListEditor listTitle={t('setup.lore.technology')} entries={formData.technology || []} onLoreChange={(i, f, v) => handleLoreChange('technology', i, f, v)} onAdd={() => addLoreEntry('technology')} onRemove={(i) => removeLoreEntry('technology', i)} />
                  </div>
              </div>

               <div>
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2 pt-4 border-t border-slate-700">{t('world.subTabs.history')}</h4>
                   <div className="grid grid-cols-1 gap-6">
                     <LoreListEditor listTitle={t('setup.lore.history')} entries={formData.history || []} onLoreChange={(i, f, v) => handleLoreChange('history', i, f, v)} onAdd={() => addLoreEntry('history')} onRemove={(i) => removeLoreEntry('history', i)} />
                     <LoreListEditor listTitle={t('setup.lore.cultures')} entries={formData.cultures || []} onLoreChange={(i, f, v) => handleLoreChange('cultures', i, f, v)} onAdd={() => addLoreEntry('cultures')} onRemove={(i) => removeLoreEntry('cultures', i)} />
                  </div>
              </div>
          </div>

          <div className="flex justify-center items-center gap-4 pt-4">
            <button type="button" onClick={onCancel} className="text-slate-400 font-bold py-3 px-8 rounded-lg hover:bg-slate-700 transition-colors duration-300">{t('common.cancel')}</button>
            <button type="submit" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-500 transition-colors duration-300 shadow-lg shadow-indigo-600/30">
              {isEditing ? t('universeSetup.saveButton') : t('universeSetup.createButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UniverseSetup;
