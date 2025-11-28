
import React, { useState, useEffect } from 'react';
import { KeyIcon } from './icons/KeyIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface ApiKeyModalProps {
  currentKey?: string | null;
  onSave: (apiKey: string) => void;
  onRemove?: () => void;
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ currentKey, onSave, onRemove, onClose }) => {
  const [key, setKey] = useState('');
  const { t } = useLanguage();

  // Lock scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <SparklesIcon className="w-5 h-5" />
            {t('apiKeyModal.saveButton')}
          </button>

          {currentKey && onRemove && (
            <button
              onClick={() => {
                if (window.confirm(t('apiKeyModal.removeConfirm') || "Are you sure you want to remove your API Key? You will be switched to the Free Tier with limited quota.")) {
                  onRemove();
                }
              }}
              className="w-full bg-red-500/10 text-red-400 font-bold py-3 px-6 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/30 flex items-center justify-center gap-2"
            >
              <TrashIcon className="w-5 h-5" />
              Remove API Key (Use Free Tier)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
