import React from 'react';
import { ModelType } from '../types';
import { MODELS } from '../constants';
import { FlashIcon } from './icons/FlashIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';

interface ModelSelectorProps {
  selectedModel: ModelType;
  setSelectedModel: (model: ModelType) => void;
  isThinkingMode: boolean;
  setIsThinkingMode: (enabled: boolean) => void;
}

// FIX: Removed reference to non-existent ModelType.FLASH_LITE
const modelIcons: Record<ModelType, React.ReactNode> = {
    [ModelType.FLASH]: <FlashIcon className="w-5 h-5" />,
    [ModelType.PRO]: <BrainCircuitIcon className="w-5 h-5" />,
};

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  setSelectedModel,
  isThinkingMode,
  setIsThinkingMode,
}) => {
  const handleThinkingModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedModel === ModelType.PRO) {
      setIsThinkingMode(e.target.checked);
    }
  };

  const proModelSupportsThinking = MODELS[ModelType.PRO].supportsThinking;

  return (
    <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {Object.values(MODELS).map(model => (
          <button
            key={model.id}
            onClick={() => setSelectedModel(model.id)}
            className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
              selectedModel === model.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title={model.description}
          >
            {modelIcons[model.id]}
            {model.name}
          </button>
        ))}
      </div>
      
      {proModelSupportsThinking && (
         <div className="flex items-center gap-3">
            <label htmlFor="thinking-mode" className={`text-sm font-medium transition-colors ${selectedModel === ModelType.PRO ? 'text-slate-300' : 'text-slate-500'}`}>
                Thinking Mode
            </label>
            <div className="relative">
                 <input
                    id="thinking-mode"
                    type="checkbox"
                    checked={isThinkingMode && selectedModel === ModelType.PRO}
                    onChange={handleThinkingModeChange}
                    disabled={selectedModel !== ModelType.PRO}
                    className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ModelSelector;
