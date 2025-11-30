import React from 'react';
import { Universe } from '../types';
import { GlobeIcon } from './icons/GlobeIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { UploadIcon } from './icons/UploadIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface UniverseHubProps {
  universes: Universe[];
  onSelectUniverse: (universeId: string) => void;
  onEditUniverse: (universeId: string) => void;
  onDeleteUniverse: (universeId: string) => void;
  onCreateNew: () => void;
  onImportUniverse: () => void;
  onExportUniverse: (universeId: string) => void;
  onBackToDashboard: () => void;
}

const UniverseCard: React.FC<{
  universe: Universe;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExport: () => void;
}> = ({ universe, onSelect, onEdit, onDelete, onExport }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-300 hover:shadow-2xl transition-all duration-300 group cursor-pointer hover:scale-[1.02]">
      <div className="mb-6">
        {/* Universe icon */}
        <div className="mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <GlobeIcon className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Name - clamped */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2" title={universe.name}>
          {universe.name}
        </h3>

        {/* Description - clamped to 3 lines */}
        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed" title={universe.description}>
          {universe.description || t('universeHub.noDescription')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          title="Use this universe in a new story"
        >
          <GlobeIcon className="w-4 h-4" />
          <span className="text-sm">Use</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-indigo-600 rounded-lg transition-all"
          title="Edit universe details"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onExport(); }}
          className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-indigo-600 rounded-lg transition-all"
          title="Export universe"
        >
          <DownloadIcon className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-lg transition-all"
          title="Delete universe"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const UniverseHub: React.FC<UniverseHubProps> = ({
  universes,
  onSelectUniverse,
  onEditUniverse,
  onDeleteUniverse,
  onCreateNew,
  onImportUniverse,
  onExportUniverse,
  onBackToDashboard
}) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      {/* Header with subtle gradient */}
      <div className="bg-gradient-to-b from-purple-50/50 to-transparent pb-12">
        <div className="max-w-6xl mx-auto px-6 pt-16">
          {/* Back button */}
          <button
            onClick={onBackToDashboard}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors group"
          >
            <ChevronLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </button>

          {/* Title & Subtitle */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight" style={{ fontFamily: '"DM Serif Display", serif' }}>
              Universe Hub
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Manage your reusable worlds and settings. Create once, use across multiple stories.
            </p>
          </div>

          {/* CTA Hierarchy */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Primary CTA */}
            <button
              onClick={onCreateNew}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <PlusIcon className="w-5 h-5" />
              Create New Universe
            </button>

            {/* Tertiary CTA */}
            <button
              onClick={onImportUniverse}
              className="bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 flex items-center gap-2"
            >
              <UploadIcon className="w-5 h-5" />
              Import Universe
            </button>
          </div>
        </div>
      </div>

      {/* Universe Library Section */}
      <div className="max-w-6xl mx-auto px-6 pb-20 mt-12">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Your Universes
          </h2>
          <p className="text-sm text-gray-500">
            {universes.length === 0
              ? 'Your universes will appear here'
              : `${universes.length} ${universes.length === 1 ? 'universe' : 'universes'} created`
            }
          </p>
        </div>

        {/* Empty State */}
        {universes.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="max-w-md mx-auto">
              {/* Icon */}
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <GlobeIcon className="w-10 h-10 text-purple-600" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Your Cosmos Awaits
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-8 leading-relaxed">
                Build reusable worlds with magic systems, locations, and lore. Use them across multiple stories for consistency.
              </p>

              {/* CTA */}
              <button
                onClick={onCreateNew}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-lg transition-all inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <PlusIcon className="w-5 h-5" />
                Create New Universe
              </button>
            </div>
          </div>
        ) : (
          /* Universe Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {universes.map((universe) => (
              <UniverseCard
                key={universe.id}
                universe={universe}
                onSelect={() => onSelectUniverse(universe.id)}
                onEdit={() => onEditUniverse(universe.id)}
                onDelete={() => onDeleteUniverse(universe.id)}
                onExport={() => onExportUniverse(universe.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UniverseHub;