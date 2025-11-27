import React, { useState } from 'react';
import { StoryEncyclopedia, StoryArcAct, LoreEntry } from '../types.ts';
import { generateStoryEncyclopediaSection } from '../services/geminiService.ts';

interface UseStoryGenerationProps {
    apiKey: string | null;
    formData: StoryEncyclopedia;
    setFormData: React.Dispatch<React.SetStateAction<StoryEncyclopedia>>;
    contentLanguage: 'en' | 'id';
    initialIdea: string;
    onRequestApiKey: () => void;
    showWorldBuilding: boolean;
    showMagicSystem: boolean;
}

export const useStoryGeneration = ({
    apiKey,
    formData,
    setFormData,
    contentLanguage,
    initialIdea,
    onRequestApiKey,
    showWorldBuilding,
    showMagicSystem
}: UseStoryGenerationProps) => {
    const [generatingSection, setGeneratingSection] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAutoBuilding, setIsAutoBuilding] = useState(false);
    const [buildProgress, setBuildProgress] = useState<string>('');
    const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
    const [styleExample, setStyleExample] = useState('');
    const [isGeneratingExample, setIsGeneratingExample] = useState(false);

    const mergeUnique = (existing: LoreEntry[], incoming: LoreEntry[]) => {
        const map = new Map();
        existing.forEach(item => map.set(item.name.toLowerCase().trim(), item));
        incoming.forEach(item => {
            if (!map.has(item.name.toLowerCase().trim())) {
                map.set(item.name.toLowerCase().trim(), item);
            }
        });
        return Array.from(map.values());
    };

    const handleGenerate = async (section: string, index?: number) => {
        if (!apiKey) {
            onRequestApiKey();
            return;
        }
        setGeneratingSection(section + (index !== undefined ? `_${index}` : ''));
        setError(null);
        try {
            const result = await generateStoryEncyclopediaSection(apiKey, section, formData, contentLanguage, { idea: initialIdea, index, style: formData.customProseStyleByExample });

            if (section === 'character' && index !== undefined) {
                setFormData(prev => {
                    const newCharacters = [...prev.characters];
                    newCharacters[index] = { ...result, id: newCharacters[index].id };
                    return { ...prev, characters: newCharacters };
                });
            } else if (section === 'singleArcAct' && index !== undefined) {
                setFormData(prev => {
                    const newStoryArc = [...prev.storyArc];
                    newStoryArc[index] = result as StoryArcAct;
                    return { ...prev, storyArc: newStoryArc };
                });
            } else if (section === 'relationships') {
                setFormData(prev => ({ ...prev, relationships: [...prev.relationships, ...result.relationships] }));
            } else if (section === 'worldLore' || section === 'world_nature' || section === 'world_power' || section === 'world_history') {
                setFormData(prev => ({
                    ...prev,
                    locations: mergeUnique(prev.locations, result.locations || []),
                    factions: mergeUnique(prev.factions, result.factions || []),
                    lore: mergeUnique(prev.lore, result.lore || []),
                    races: mergeUnique(prev.races, result.races || []),
                    creatures: mergeUnique(prev.creatures, result.creatures || []),
                    powers: mergeUnique(prev.powers, result.powers || []),
                    items: mergeUnique(prev.items, result.items || []),
                    technology: mergeUnique(prev.technology, result.technology || []),
                    history: mergeUnique(prev.history, result.history || []),
                    cultures: mergeUnique(prev.cultures, result.cultures || []),
                }));
            } else {
                setFormData(prev => ({ ...prev, ...result }));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setGeneratingSection(null);
        }
    };

    const handleAutoBuild = async () => {
        if (!apiKey) { onRequestApiKey(); return; }
        setIsAutoBuilding(true); setBuildProgress('basic'); setCompletedSteps({}); setError(null);
        let currentData = { ...formData };
        try {
            const basicRes = await generateStoryEncyclopediaSection(apiKey, 'basic', currentData, contentLanguage, { idea: initialIdea });
            currentData = { ...currentData, ...basicRes }; setFormData(currentData); setCompletedSteps(prev => ({ ...prev, basic: true }));

            setBuildProgress('core');
            const coreRes = await generateStoryEncyclopediaSection(apiKey, 'core', currentData, contentLanguage);
            currentData = { ...currentData, ...coreRes }; setFormData(currentData); setCompletedSteps(prev => ({ ...prev, core: true }));

            setBuildProgress('world');
            const worldRes = await generateStoryEncyclopediaSection(apiKey, 'worldLore', currentData, contentLanguage);
            const natureRes = await generateStoryEncyclopediaSection(apiKey, 'world_nature', currentData, contentLanguage);
            const powerRes = await generateStoryEncyclopediaSection(apiKey, 'world_power', currentData, contentLanguage);
            const historyRes = await generateStoryEncyclopediaSection(apiKey, 'world_history', currentData, contentLanguage);
            currentData = { ...currentData, locations: mergeUnique(currentData.locations, worldRes.locations || []), factions: mergeUnique(currentData.factions, worldRes.factions || []), lore: mergeUnique(currentData.lore, worldRes.lore || []), races: mergeUnique(currentData.races, natureRes.races || []), creatures: mergeUnique(currentData.creatures, natureRes.creatures || []), powers: mergeUnique(currentData.powers, powerRes.powers || []), items: mergeUnique(currentData.items, powerRes.items || []), technology: mergeUnique(currentData.technology, powerRes.technology || []), history: mergeUnique(currentData.history, historyRes.history || []), cultures: mergeUnique(currentData.cultures, historyRes.cultures || []) };
            if (showWorldBuilding) { const wbRes = await generateStoryEncyclopediaSection(apiKey, 'worldBuilding', currentData, contentLanguage); currentData = { ...currentData, ...wbRes }; }
            if (showMagicSystem) { const msRes = await generateStoryEncyclopediaSection(apiKey, 'magicSystem', currentData, contentLanguage); currentData = { ...currentData, ...msRes }; }
            setFormData(currentData); setCompletedSteps(prev => ({ ...prev, world: true }));

            setBuildProgress('relations');
            if (currentData.characters.length >= 2) { const relRes = await generateStoryEncyclopediaSection(apiKey, 'relationships', currentData, contentLanguage); currentData = { ...currentData, relationships: relRes.relationships || [] }; setFormData(currentData); }
            setCompletedSteps(prev => ({ ...prev, relations: true }));

            setBuildProgress('arc');
            const arcRes = await generateStoryEncyclopediaSection(apiKey, 'arc', currentData, contentLanguage);
            if (arcRes.storyArc) { const mappedArc = arcRes.storyArc.map((act: any) => ({ ...act, plotPoints: (act.plotPoints || []).map((p: any) => ({ ...p, id: crypto.randomUUID() })) })); currentData = { ...currentData, storyArc: mappedArc }; setFormData(currentData); }
            setCompletedSteps(prev => ({ ...prev, arc: true }));

            setBuildProgress('tone');
            const toneRes = await generateStoryEncyclopediaSection(apiKey, 'tone', currentData, contentLanguage);
            currentData = { ...currentData, ...toneRes }; setFormData(currentData); setCompletedSteps(prev => ({ ...prev, tone: true }));
            setBuildProgress('complete');
        } catch (err) { setError(err instanceof Error ? err.message : "Auto-build failed."); setBuildProgress('error'); }
    };

    const handleGenerateStyleExample = async () => {
        if (!apiKey) { onRequestApiKey(); return; }
        if (!formData.proseStyle) return;
        setIsGeneratingExample(true);
        setStyleExample('');
        setError(null);
        try {
            const result = await generateStoryEncyclopediaSection(apiKey, 'styleExample', {}, contentLanguage, { style: formData.proseStyle });
            setStyleExample(result.example);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsGeneratingExample(false);
        }
    };

    return {
        generatingSection,
        error,
        setError,
        isAutoBuilding,
        setIsAutoBuilding,
        buildProgress,
        completedSteps,
        styleExample,
        isGeneratingExample,
        handleGenerate,
        handleAutoBuild,
        handleGenerateStyleExample
    };
};
