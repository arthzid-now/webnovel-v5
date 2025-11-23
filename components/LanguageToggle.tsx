import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { uiLang, setUiLang } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-lg bg-slate-700 p-1">
      <button
        onClick={() => setUiLang('en')}
        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
          uiLang === 'en'
            ? 'bg-indigo-600 text-white'
            : 'text-slate-300 hover:bg-slate-600'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setUiLang('id')}
        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
          uiLang === 'id'
            ? 'bg-indigo-600 text-white'
            : 'text-slate-300 hover:bg-slate-600'
        }`}
      >
        ID
      </button>
    </div>
  );
};

export default LanguageToggle;
