import React from 'react';
import { StoryEncyclopedia } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { FilePlusIcon } from './icons/FilePlusIcon';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { SparklesIcon } from './icons/SparklesIcon';
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
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-300 hover:shadow-2xl transition-all duration-300 group cursor-pointer hover:scale-[1.02]">
      <div className="mb-6">
        {/* Genre chip */}
        {genres && (
          <div className="mb-3">
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
              {genres}
            </span>
          </div>
        )}

        {/* Title - clamped */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2" title={story.title}>
          {story.title}
        </h3>

        {/* Universe - with icon */}
        <p className="text-xs text-gray-500 mb-4 truncate flex items-center gap-1.5" title={story.universeName}>
          <GlobeIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{story.universeName}</span>
        </p>

        {/* Plot - clamped to 3 lines */}
        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed" title={story.mainPlot}>
          {story.mainPlot || t('dashboard.noPlot')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          title="Open this story in the writing studio"
        >
          <BookOpenIcon className="w-4 h-4" />
          <span className="text-sm">{t('dashboard.open')}</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-indigo-600 rounded-lg transition-all"
          title="Edit story encyclopedia"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onExport(); }}
          className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-indigo-600 rounded-lg transition-all"
          title="Export story"
        >
          <DownloadIcon className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-lg transition-all"
          title="Delete story"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({
  stories,
  onSelectStory,
  onEditStory,
  onDeleteStory,
  onStartNew,
  onImportStory,
  onExportStory,
  onGoToUniverseHub,
  onChangeApiKey
}) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      {/* Hero Section with subtle gradient */}
      <div className="bg-gradient-to-b from-indigo-50/50 to-transparent pb-12">
        <div className="max-w-6xl mx-auto px-6 pt-16">
          {/* Title & Subtitle */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight" style={{ fontFamily: '"DM Serif Display", serif' }}>
              {t('dashboard.title')}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Select a story to continue writing, or start a new creative journey.
            </p>
          </div>

          {/* CTA Hierarchy */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Primary CTA */}
            <button
              onClick={onStartNew}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <SparklesIcon className="w-5 h-5" />
              Start New Story
            </button>

            {/* Secondary CTA */}
            <button
              onClick={onGoToUniverseHub}
              className="bg-white border-2 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 flex items-center gap-3"
            >
              <GlobeIcon className="w-5 h-5" />
              Universe Hub
            </button>

            {/* Tertiary CTA */}
            <button
              onClick={onImportStory}
              className="bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 flex items-center gap-2"
            >
              <UploadIcon className="w-5 h-5" />
              Import Story
            </button>
          </div>
        </div>
      </div>

      {/* Story Library Section - increased spacing */}
      <div className="max-w-6xl mx-auto px-6 pb-20 mt-12">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Story Library
          </h2>
          <p className="text-sm text-gray-500">
            {stories.length === 0
              ? 'Your stories will appear here'
              : `${stories.length} ${stories.length === 1 ? 'story' : 'stories'} in your library`
            }
          </p>
        </div>

        {/* Empty State */}
        {stories.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="max-w-md mx-auto">
              {/* Icon */}
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FilePlusIcon className="w-10 h-10 text-indigo-600" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No Stories Yet
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-8 leading-relaxed">
                Your creative journey begins here. Start your first story and bring your ideas to life with AI-powered assistance.
              </p>

              {/* CTA */}
              <button
                onClick={onStartNew}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-lg transition-all inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <SparklesIcon className="w-5 h-5" />
                Start New Story
              </button>
            </div>
          </div>
        ) : (
          /* Story Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
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
        )}
      </div>
    </div>
  );
};

export default Dashboard;