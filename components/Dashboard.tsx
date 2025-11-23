import React from 'react';
import { StoryEncyclopedia } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { FilePlusIcon } from './icons/FilePlusIcon';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { KeyIcon } from './icons/KeyIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  stories: StoryEncyclopedia[];
  onSelectStory: (storyId: string) => void;
  onEditStory: (storyId: string) => void;
  onDeleteStory: (storyId: string) => void;
  onStartNew: () => void;
  onImportStory: () => void;
  onExportStory: (storyId: string) => void;
  onGoToUniverseHub: () => void;
  onChangeApiKey: () => void;
}

const StoryCard: React.FC<{
    story: StoryEncyclopedia;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onExport: () => void;
}> = ({ story, onSelect, onEdit, onDelete, onExport }) => {
    const { t } = useLanguage();
    const genres = [...story.genres, story.otherGenre].filter(Boolean).join(', ');

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col justify-between hover:border-indigo-500 transition-colors duration-300">
            <div>
                <h3 className="text-lg font-bold text-slate-100 truncate mb-1" title={story.title}>{story.title}</h3>
                <p className="text-xs text-slate-400 mb-2 truncate" title={story.universeName}>
                  <GlobeIcon className="w-3 h-3 inline -mt-1 mr-1" />
                  {story.universeName}
                </p>
                <p className="text-sm text-indigo-400 font-medium mb-2 truncate" title={genres}>{genres || t('dashboard.noGenres')}</p>
                <p className="text-xs text-slate-400 line-clamp-2" title={story.mainPlot}>
                    {story.mainPlot || t('dashboard.noPlot')}
                </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between gap-2">
                <button 
                    onClick={onSelect} 
                    className="flex-grow text-center bg-indigo-600 text-white font-semibold py-2 px-3 rounded-md text-sm hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2"
                >
                    <BookOpenIcon className="w-4 h-4" />
                    {t('dashboard.openStudio')}
                </button>
                <div className="flex items-center shrink-0 gap-1 bg-slate-700 rounded-md">
                    <button onClick={onEdit} className="p-2 text-slate-400 hover:text-indigo-300 rounded-md transition-colors" title={t('dashboard.editStory')}>
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={onExport} className="p-2 text-slate-400 hover:text-indigo-300 rounded-md transition-colors" title={t('dashboard.exportStory')}>
                        <DownloadIcon className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} className="p-2 text-slate-400 hover:text-rose-400 rounded-md transition-colors" title={t('dashboard.deleteStory')}>
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ stories, onSelectStory, onEditStory, onDeleteStory, onStartNew, onImportStory, onExportStory, onGoToUniverseHub, onChangeApiKey }) => {
  const { t } = useLanguage();
  
  return (
    <div className="w-full p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-100">{t('dashboard.title')}</h2>
            <p className="text-slate-400 mt-1">{t('dashboard.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
             <button
                onClick={onGoToUniverseHub}
                className="bg-slate-700 text-white font-bold py-2 px-5 rounded-lg hover:bg-slate-600 transition-colors duration-300 flex items-center gap-2"
                title={t('dashboard.universeHubTooltip')}
            >
                <GlobeIcon className="w-5 h-5" />
                {t('dashboard.universeHub')}
            </button>
            <button
                onClick={onStartNew}
                className="bg-indigo-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-indigo-500 transition-colors duration-300 shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
                <FilePlusIcon className="w-5 h-5" />
                {t('dashboard.startNewStory')}
            </button>
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-300 mb-4">{t('dashboard.storyLibrary')}</h3>
        
        {stories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stories.map(story => (
              <StoryCard
                key={story.id}
                story={story}
                onSelect={() => onSelectStory(story.id)}
                onEdit={() => onEditStory(story.id)}
                onDelete={() => onDeleteStory(story.id)}
                onExport={() => onExportStory(story.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-lg">
            <BookOpenIcon className="mx-auto w-12 h-12 text-slate-600" />
            <h3 className="mt-4 text-xl font-semibold text-slate-300">{t('dashboard.emptyLibraryTitle')}</h3>
            <p className="mt-1 text-slate-400">{t('dashboard.emptyLibrarySubtitle')}</p>
          </div>
        )}
        <div className="mt-8 flex justify-center items-center gap-6">
            <button
                onClick={onImportStory}
                className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm transition-colors flex items-center gap-2"
                title={t('dashboard.importStoryTooltip')}
            >
                <UploadIcon className="w-4 h-4" />
                {t('dashboard.importStory')}
            </button>
             <button
                onClick={onChangeApiKey}
                className="text-slate-400 hover:text-slate-200 font-semibold text-sm transition-colors flex items-center gap-2"
                title={t('dashboard.changeApiKey')}
            >
                <KeyIcon className="w-4 h-4" />
                {t('dashboard.changeApiKey')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;