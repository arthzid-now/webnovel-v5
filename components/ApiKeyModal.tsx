import React, { useState } from 'react';
import { KeyIcon } from './icons/KeyIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface ApiKeyModalProps {
  onSave: (apiKey: string) => void;
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, onClose }) => {
  const [key, setKey] = useState('');
  const { t } = useLanguage();

  const handleSave = () => {
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-w-lg w-full p-6 text-center space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto w-12 h-12 flex items-center justify-center bg-indigo-500/20 rounded-full border border-indigo-500/30">
            <KeyIcon className="w-6 h-6 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">{t('apiKeyModal.title')}</h2>
        <p className="text-sm text-slate-400">{t('apiKeyModal.instruction')}</p>
        
        <div>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder={t('apiKeyModal.placeholder')}
            className="w-full bg-slate-700 text-slate-200 placeholder-slate-500 rounded-md p-3 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200"
            autoFocus
          />
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 inline-block"
          >
            {t('apiKeyModal.getApiKey')}
          </a>
        </div>
        
        <button
          onClick={handleSave}
          disabled={!key.trim()}
          className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
        >
          <SparklesIcon className="w-5 h-5" />
          {t('apiKeyModal.saveButton')}
        </button>
      </div>
    </div>
  );
};

export default ApiKeyModal;