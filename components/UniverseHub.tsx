import React from 'react';
import { Universe } from '../types';
import { GlobeIcon } from './icons/GlobeIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { FilePlusIcon } from './icons/FilePlusIcon';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { LayoutDashboardIcon } from './icons/LayoutDashboardIcon';
import { StarIcon } from './icons/StarIcon';
import { useLanguage } from '../contexts/LanguageContext';


interface UniverseHubProps {
  universes: Universe[];
  onGoToDashboard: () => void;
  onAddNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
  onImport: () => void;
  onToggleFavorite: (id: string) => void;
}

const UniverseCard: React.FC<{
    universe: Universe;
    onEdit: () => void;
    onDelete: () => void;
    onExport: () => void;
    onToggleFavorite: () => void;
}> = ({ universe, onEdit, onDelete, onExport, onToggleFavorite }) => {
    const { t } = useLanguage();
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col justify-between hover:border-indigo-500 transition-colors duration-300">
            <div>
                <h3 className="text-lg font-bold text-slate-100 truncate mb-1" title={universe.name}>{universe.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-3" title={universe.description}>
                    {universe.description || t('universeHub.noDescription')}
                </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-end gap-2">
                 <button 
                    onClick={onToggleFavorite} 
                    className={`p-2 text-slate-400 ${universe.isFavorite ? 'text-amber-400' : 'hover:text-amber-400'} bg-slate-700 rounded-md transition-colors`} 
                    title={universe.isFavorite ? "Remove from favorites" : "Add to favorites"}
                 >
                    <StarIcon className="w-4 h-4" filled={!!universe.isFavorite} />
                </button>
                 <button onClick={onEdit} className="p-2 text-slate-400 hover:text-indigo-300 bg-slate-700 rounded-md transition-colors" title={t('universeHub.edit')}>
                    <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={onExport} className="p-2 text-slate-400 hover:text-indigo-300 bg-slate-700 rounded-md transition-colors" title={t('universeHub.export')}>
                    <DownloadIcon className="w-4 h-4" />
                </button>
                <button onClick={onDelete} className="p-2 text-slate-400 hover:text-rose-400 bg-slate-700 rounded-md transition-colors" title={t('universeHub.delete')}>
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};


const UniverseHub: React.FC<UniverseHubProps> = ({ universes, onGoToDashboard, onAddNew, onEdit, onDelete, onExport, onImport, onToggleFavorite }) => {
  const { t } = useLanguage();
  const sortedUniverses = [...universes].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));

  return (
    <div className="w-full p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-3"><GlobeIcon className="w-8 h-8 text-indigo-400"/> {t('universeHub.title')}</h2>
            <p className="text-slate-400 mt-1">{t('universeHub.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
                onClick={onGoToDashboard}
                className="bg-slate-700 text-white font-bold py-2 px-5 rounded-lg hover:bg-slate-600 transition-colors duration-300 flex items-center gap-2"
            >
                <LayoutDashboardIcon className="w-5 h-5" />
                {t('universeHub.backToDashboard')}
            </button>
            <button
                onClick={onAddNew}
                className="bg-indigo-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-indigo-500 transition-colors duration-300 shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
                <FilePlusIcon className="w-5 h-5" />
                {t('universeHub.createNew')}
            </button>
          </div>
        </div>
        
        {sortedUniverses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedUniverses.map(universe => (
              <UniverseCard
                key={universe.id}
                universe={universe}
                onEdit={() => onEdit(universe.id)}
                onDelete={() => onDelete(universe.id)}
                onExport={() => onExport(universe.id)}
                onToggleFavorite={() => onToggleFavorite(universe.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-lg">
            <GlobeIcon className="mx-auto w-12 h-12 text-slate-600" />
            <h3 className="mt-4 text-xl font-semibold text-slate-300">{t('universeHub.emptyTitle')}</h3>
            <p className="mt-1 text-slate-400">{t('universeHub.emptySubtitle')}</p>
          </div>
        )}
        <div className="mt-8 text-center">
            <button
                onClick={onImport}
                className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm transition-colors flex items-center gap-2 mx-auto"
                title={t('universeHub.importTooltip')}
            >
                <UploadIcon className="w-4 h-4" />
                {t('universeHub.import')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default UniverseHub;