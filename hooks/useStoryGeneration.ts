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
    userIsPremium?: boolean; // Add premium flag
}

export const useStoryGeneration = ({
    apiKey,
    formData,
    setFormData,
    contentLanguage,
    initialIdea,
    onRequestApiKey,
    showWorldBuilding,
    showMagicSystem,
    userIsPremium // Destructure premium flag
}: UseStoryGenerationProps) => {
    const [generatingSection, setGeneratingSection] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAutoBuilding, setIsAutoBuilding] = useState(false);
    const [buildProgress, setBuildProgress] = useState<string>('');
    const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
    const [styleExample, setStyleExample] = useState('');
    const [isGeneratingExample, setIsGeneratingExample] = useState(false);

    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const mergeUnique = (existing: LoreEntry[], incoming: LoreEntry[]) => {
        const map = new Map();
        existing.forEach(item => map.set(item.name.toLowerCase().trim(), item));
        incoming.forEach(item => {
            if (!map.has(item.name.toLowerCase().trim())) {
                map.set(item.name.toLowerCase().trim(), { ...item, id: item.id || crypto.randomUUID() });
            }
        });
        return Array.from(map.values());
    };

    const handleGenerate = async (section: string, index?: number) => {
        // if (!apiKey) {
        //     onRequestApiKey();
        //     return;
        // }
        setGeneratingSection(section + (index !== undefined ? `_${index}` : ''));
        setError(null);
        try {
            const result = await generateStoryEncyclopediaSection(apiKey, section, formData, contentLanguage, { idea: initialIdea, index, style: formData.customProseStyleByExample }, userIsPremium);

            if (section === 'character' && index !== undefined) {
                setFormData(prev => {
                    const newCharacters = [...prev.characters];
                    newCharacters[index] = { ...result, id: newCharacters[index].id };
                    return { ...prev, characters: newCharacters };
                });
            } else if (section === 'singleArcAct' && index !== undefined) {
                setFormData(prev => {
                    const newStoryArc = [...prev.storyArc];
                    const actData = result as StoryArcAct;
                    // Ensure plot points have IDs
                    if (actData.plotPoints) {
                        actData.plotPoints = actData.plotPoints.map(pp => ({ ...pp, id: pp.id || crypto.randomUUID() }));
                    }
                    newStoryArc[index] = actData;
                    return { ...prev, storyArc: newStoryArc };
                });
            } else if (section === 'relationships') {
                const newRels = (result.relationships || []).map((r: any) => ({ ...r, id: r.id || crypto.randomUUID() }));
                setFormData(prev => ({ ...prev, relationships: [...prev.relationships, ...newRels] }));
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
        // if (!apiKey) { onRequestApiKey(); return; }
        setIsAutoBuilding(true);
        setBuildProgress('basic');
        setCompletedSteps({});
        setError(null);
        setTimeRemaining(60); // Initial estimate: 60 seconds

        let currentData = { ...formData };

        try {
            // Step 1: Basic Info (~3s)
            const basicRes = await generateStoryEncyclopediaSection(apiKey, 'basic', currentData, contentLanguage, { idea: initialIdea }, {}, userIsPremium);
            currentData = { ...currentData, ...basicRes };
            setFormData(currentData);
            setCompletedSteps(prev => ({ ...prev, basic: true }));
            setTimeRemaining(55);

            await delay(2000); // Cool-down

            // Step 2: Core Story (~8s)
            setBuildProgress('core');
            const coreRes = await generateStoryEncyclopediaSection(apiKey, 'core', currentData, contentLanguage, {}, userIsPremium);
            currentData = { ...currentData, ...coreRes };
            setFormData(currentData);
            setCompletedSteps(prev => ({ ...prev, core: true }));
            setTimeRemaining(45);

            await delay(2000); // Cool-down

            // Step 3: World Building (~15s)
            setBuildProgress('world');
            const worldRes = await generateStoryEncyclopediaSection(apiKey, 'worldLore', currentData, contentLanguage, {}, userIsPremium);
            await delay(1000);
            const natureRes = await generateStoryEncyclopediaSection(apiKey, 'world_nature', currentData, contentLanguage, {}, userIsPremium);
            await delay(1000);
            const powerRes = await generateStoryEncyclopediaSection(apiKey, 'world_power', currentData, contentLanguage, {}, userIsPremium);
            await delay(1000);
            const historyRes = await generateStoryEncyclopediaSection(apiKey, 'world_history', currentData, contentLanguage, {}, userIsPremium);

            currentData = { ...currentData, locations: mergeUnique(currentData.locations, worldRes.locations || []), factions: mergeUnique(currentData.factions, worldRes.factions || []), lore: mergeUnique(currentData.lore, worldRes.lore || []), races: mergeUnique(currentData.races, natureRes.races || []), creatures: mergeUnique(currentData.creatures, natureRes.creatures || []), powers: mergeUnique(currentData.powers, powerRes.powers || []), items: mergeUnique(currentData.items, powerRes.items || []), technology: mergeUnique(currentData.technology, powerRes.technology || []), history: mergeUnique(currentData.history, historyRes.history || []), cultures: mergeUnique(currentData.cultures, historyRes.cultures || []) };

            if (showWorldBuilding) {
                await delay(1000);
                const wbRes = await generateStoryEncyclopediaSection(apiKey, 'worldBuilding', currentData, contentLanguage, {}, userIsPremium);
                currentData = { ...currentData, ...wbRes };
            }
            if (showMagicSystem) {
                await delay(1000);
                const msRes = await generateStoryEncyclopediaSection(apiKey, 'magicSystem', currentData, contentLanguage, {}, userIsPremium);
                currentData = { ...currentData, ...msRes };
            }
            setFormData(currentData);
            setCompletedSteps(prev => ({ ...prev, world: true }));
            setTimeRemaining(25);

            await delay(2000); // Cool-down

            // Step 4: Relationships (~5s)
            setBuildProgress('relations');
            if (currentData.characters.length >= 2) {
                const relRes = await generateStoryEncyclopediaSection(apiKey, 'relationships', currentData, contentLanguage, {}, userIsPremium);
                const newRels = (relRes.relationships || []).map((r: any) => ({ ...r, id: r.id || crypto.randomUUID() }));
                currentData = { ...currentData, relationships: newRels };
                setFormData(currentData);
            }
            setCompletedSteps(prev => ({ ...prev, relations: true }));
            setTimeRemaining(18);

            await delay(2000); // Cool-down

            // Step 5: Arc (~10s)
            setBuildProgress('arc');
            const arcRes = await generateStoryEncyclopediaSection(apiKey, 'arc', currentData, contentLanguage, {}, userIsPremium);
            if (arcRes.storyArc) {
                const mappedArc = arcRes.storyArc.map((act: any) => ({ ...act, plotPoints: (act.plotPoints || []).map((p: any) => ({ ...p, id: crypto.randomUUID() })) }));
                currentData = { ...currentData, storyArc: mappedArc };
                setFormData(currentData);
            }
            setCompletedSteps(prev => ({ ...prev, arc: true }));
            setTimeRemaining(5);

            await delay(2000); // Cool-down

            // Step 6: Tone (~5s)
            setBuildProgress('tone');
            const toneRes = await generateStoryEncyclopediaSection(apiKey, 'tone', currentData, contentLanguage, {}, userIsPremium);
            currentData = { ...currentData, ...toneRes };
            setFormData(currentData);
            setCompletedSteps(prev => ({ ...prev, tone: true }));

            setBuildProgress('complete');
            setTimeRemaining(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Auto-build failed.");
            setBuildProgress('error');
            setTimeRemaining(null);
        }
    };

    const handleGenerateStyleExample = async () => {
        // if (!apiKey) { onRequestApiKey(); return; }
        if (!formData.proseStyle) return;
        setIsGeneratingExample(true);
        setStyleExample('');
        setError(null);
        try {
            const result = await generateStoryEncyclopediaSection(apiKey, 'styleExample', {}, contentLanguage, { style: formData.proseStyle }, userIsPremium);
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
        timeRemaining,
        styleExample,
        isGeneratingExample,
        handleGenerate,
        handleAutoBuild,
        handleGenerateStyleExample
    };
};
