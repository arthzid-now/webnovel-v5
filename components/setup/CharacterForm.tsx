import React from 'react';
import { Character } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { TrashIcon } from '../icons/TrashIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { GenerateButton, SubGenerateButton, FormField } from './Shared';
import TagsInput from '../TagsInput';
import { getZodiacSign } from '../../utils';

interface CharacterFormProps {
    character: Character;
    index: number;
    onCharacterChange: (index: number, field: keyof Character, value: any) => void;
    onRemoveCharacter: (index: number) => void;
    onGenerateCharacter: (index: number) => void;
    isGenerating: boolean;
}

export const CharacterForm: React.FC<CharacterFormProps> = ({ character, index, onCharacterChange, onRemoveCharacter, onGenerateCharacter, isGenerating }) => {
    const { t } = useLanguage();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onCharacterChange(index, e.target.name as keyof Character, e.target.value);
    const handleRolesChange = (newRoles: string[]) => onCharacterChange(index, 'roles', newRoles);
    const handleCustomFieldChange = (cfIndex: number, field: 'label' | 'value', value: string) => { const newCustomFields = [...character.customFields]; newCustomFields[cfIndex] = { ...newCustomFields[cfIndex], [field]: value }; onCharacterChange(index, 'customFields', newCustomFields); };
    const addCustomField = () => onCharacterChange(index, 'customFields', [...character.customFields, { id: crypto.randomUUID(), label: '', value: '' }]);
    const removeCustomField = (cfIndex: number) => onCharacterChange(index, 'customFields', character.customFields.filter((_, i) => i !== cfIndex));
    return (
        <div className="bg-gray-100/30 p-4 rounded-lg space-y-4 border border-gray-300/50">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-300/50 md:hidden">
                <h4 className="font-semibold text-gray-900">{character.name || t('setup.characters.newCharacter')}</h4>
                <div className="flex items-center gap-2">
                    <SubGenerateButton onClick={() => onGenerateCharacter(index)} isLoading={isGenerating} title={t('setup.characters.generateThis')} />
                    <button type="button" onClick={() => onRemoveCharacter(index)} className="p-1.5 text-gray-600 hover:text-rose-400" title={t('setup.characters.delete')}><TrashIcon className="w-4 h-4" /></button>
                </div>
            </div>
            <div className="hidden md:flex justify-end mb-2">
                <GenerateButton onClick={() => onGenerateCharacter(index)} disabled={false} isLoading={isGenerating} label={t('setup.characters.generateThis')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                    <FormField
                        label={t('setup.characters.concept')}
                        name="initialConcept"
                        value={character.initialConcept || ''}
                        onChange={handleChange}
                        isTextArea
                        fullWidth
                        placeholder={t('setup.characters.conceptPlaceholder')}
                    />
                </div>
                <FormField label={t('setup.characters.name')} name="name" value={character.name} onChange={handleChange} fullWidth />
                <div className="col-span-1 md:col-span-2"> <label className="block text-sm font-medium text-gray-700 mb-1">{t('setup.characters.roles')}</label> <TagsInput tags={character.roles} onTagsChange={handleRolesChange} placeholder={t('setup.characters.rolesPlaceholder')} /> </div>
                <FormField label={t('setup.characters.age')} name="age" value={character.age} onChange={handleChange} />
                <FormField label={t('setup.characters.gender')} name="gender" value={character.gender} onChange={handleChange} />
                <div className="relative">
                    <FormField
                        label="Birth Date"
                        name="birthDate"
                        value={character.birthDate || ''}
                        onChange={handleChange}
                        placeholder="e.g. 15 August"
                    />
                    {getZodiacSign(character.birthDate || '') && (
                        <div className="absolute top-8 right-3 text-indigo-300 text-sm font-bold bg-gray-50/80 px-2 py-0.5 rounded pointer-events-none">
                            {getZodiacSign(character.birthDate || '')}
                        </div>
                    )}
                </div>
                <FormField label="Blood Type" name="bloodType" value={character.bloodType || ''} onChange={handleChange} placeholder="A, B, O, AB" />
                <FormField label={t('setup.characters.physical')} name="physicalDescription" value={character.physicalDescription} onChange={handleChange} isTextArea fullWidth />
                <FormField label={t('setup.characters.voice')} name="voiceAndSpeechStyle" value={character.voiceAndSpeechStyle} onChange={handleChange} isTextArea fullWidth placeholder={t('setup.characters.voicePlaceholder')} />
                <FormField label={t('setup.characters.personality')} name="personalityTraits" value={character.personalityTraits} onChange={handleChange} isTextArea fullWidth />
                <FormField label={t('setup.characters.habits')} name="habits" value={character.habits} onChange={handleChange} isTextArea fullWidth />
                <FormField label={t('setup.characters.goal')} name="goal" value={character.goal} onChange={handleChange} isTextArea fullWidth />
                <FormField label={t('setup.characters.principles')} name="principles" value={character.principles} onChange={handleChange} isTextArea fullWidth />
                <FormField label={t('setup.characters.conflict')} name="conflict" value={character.conflict} onChange={handleChange} isTextArea fullWidth />
                <div className="col-span-1 md:col-span-2 space-y-3">
                    <h5 className="text-sm font-medium text-gray-700">{t('setup.characters.customDetails')}</h5>
                    {character.customFields?.map((field, cfIndex) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start bg-slate-600/50 p-2 rounded-lg">
                            <input type="text" value={field.label} onChange={(e) => handleCustomFieldChange(cfIndex, 'label', e.target.value)} placeholder={t('setup.characters.customLabelPlaceholder')} className="md:col-span-1 w-full bg-gray-100 text-gray-900 placeholder-slate-400 rounded-lg p-2 border border-slate-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                            <textarea value={field.value} onChange={(e) => handleCustomFieldChange(cfIndex, 'value', e.target.value)} placeholder={t('common.description')} rows={2} className="md:col-span-2 w-full bg-gray-100 text-gray-900 placeholder-slate-400 rounded-lg p-2 border border-slate-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                            <button type="button" onClick={() => removeCustomField(cfIndex)} className="md:col-span-3 justify-self-end text-xs text-rose-400 hover:text-rose-300">{t('setup.characters.removeDetail')}</button>
                        </div>
                    ))}
                    <button type="button" onClick={addCustomField} className="w-full text-sm py-2 px-4 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 hover:border-slate-500 transition-colors flex items-center justify-center gap-2"><PlusIcon className="w-4 h-4" />{t('setup.characters.addCustomDetail')}</button>
                </div>
            </div>
        </div>
    );
};
