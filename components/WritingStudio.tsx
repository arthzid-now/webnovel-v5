
import React, { useState, useEffect, useCallback } from 'react';
import StoryEncyclopediaSidebar from './StoryEncyclopediaSidebar';
import ChapterEditor from './ChapterEditor';
import ChatWindow from './ChatWindow';
import { useLanguage } from '../contexts/LanguageContext';
import { useStory } from '../contexts/StoryContext'; // Use Context
import { BookOpenIcon } from './icons/BookOpenIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { XIcon } from './icons/XIcon';
import ExportModal from './ExportModal';
import SearchReplaceModal from './SearchReplaceModal';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface WritingStudioProps {
  apiKey: string | null;
  onGoToDashboard: () => void;
  onEditRequest: () => void;
  onExportStory: (storyId: string, format?: 'epub' | 'html' | 'txt' | 'json' | 'md') => void;
  onRequestApiKey: () => void;
}

const WritingStudio: React.FC<WritingStudioProps> = ({ apiKey, onGoToDashboard, onEditRequest, onExportStory, onRequestApiKey }) => {
  const { currentStory, updateStoryMetadata, addChapter, deleteChapter, updateChapter, reorderChapters, isLoading } = useStory();
  const { t } = useLanguage();

  const [activeChapterId, setActiveChapterId] = useState<string>('');

  // Mobile Sidebar States
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Desktop Zen Mode States
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // Modal States
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Initialize active chapter
  useEffect(() => {
    if (currentStory && currentStory.chapters.length > 0) {
      if (!activeChapterId || !currentStory.chapters.some(c => c.id === activeChapterId)) {
        setActiveChapterId(currentStory.chapters[0].id);
      }
    }
  }, [currentStory, activeChapterId]);

  // STABLE CALLBACKS FOR SIDEBAR
  const handleAddChapterWrapper = useCallback(async () => {
    await addChapter();
  }, [addChapter]);

  const handleDeleteChapterWrapper = useCallback(async (chapterId: string) => {
    if (!currentStory) return;
    if (currentStory.chapters.length <= 1) {
      alert(t('studio.deleteLastError'));
      return;
    }
    const chapterToDelete = currentStory.chapters.find(c => c.id === chapterId);
    if (window.confirm(t('studio.deleteConfirm', { title: chapterToDelete?.title || '' }))) {
      await deleteChapter(chapterId);
    }
  }, [currentStory, deleteChapter, t]);

  const handleOpenExport = useCallback(() => setIsExportModalOpen(true), []);
  const handleOpenSearch = useCallback(() => setIsSearchModalOpen(true), []);

  const handleExport = (format: 'epub' | 'html' | 'txt' | 'json' | 'md') => {
    if (!currentStory) return;
    onExportStory(currentStory.id, format);
    setIsExportModalOpen(false);
  };

  const handleUpdateChapter = useCallback((chapterId: string, title: string, content: string) => {
    updateChapter(chapterId, title, content);
  }, [updateChapter]);

  if (isLoading || !currentStory) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-600 flex-col gap-4 bg-white">
        <SpinnerIcon className="w-10 h-10 animate-spin text-indigo-600" />
        <p>Loading Studio...</p>
      </div>
    );
  }

  const activeChapter = currentStory.chapters.find(c => c.id === activeChapterId);

  return (
    <div className="relative flex flex-grow w-full h-[calc(100vh-73px)] overflow-hidden bg-gray-50">
      {isExportModalOpen && <ExportModal onClose={() => setIsExportModalOpen(false)} onExport={handleExport} />}
      {isSearchModalOpen && <SearchReplaceModal onClose={() => setIsSearchModalOpen(false)} />}

      {/* --- DESKTOP LEFT SIDEBAR --- */}
      <div
        className={`hidden md:block flex-shrink-0 transition-all duration-300 ease-in-out border-r border-gray-200 bg-white shadow-sm ${isLeftSidebarOpen ? 'w-80 lg:w-96' : 'w-0 overflow-hidden'}`}
      >
        <StoryEncyclopediaSidebar
          storyEncyclopedia={currentStory}
          onEdit={onEditRequest}
          onGoToDashboard={onGoToDashboard}
          activeChapterId={activeChapterId}
          onSelectChapter={setActiveChapterId}
          onAddChapter={handleAddChapterWrapper}
          onDeleteChapter={handleDeleteChapterWrapper}
          onExportStory={handleOpenExport}
          onReorderChapters={reorderChapters}
          onOpenSearch={handleOpenSearch}
        />
      </div>

      {/* --- MOBILE LEFT SIDEBAR (OVERLAY) --- */}
      <div
        className={`fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="absolute inset-0 bg-gray-900/40" onClick={() => setIsMobileSidebarOpen(false)}></div>
        <div className="relative w-full max-w-sm h-full bg-white shadow-2xl flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-gray-900 font-bold px-2">{t('sidebar.dashboard')}</h3>
            <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200">
              <XIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-grow overflow-hidden">
            <StoryEncyclopediaSidebar
              storyEncyclopedia={currentStory}
              onEdit={onEditRequest}
              onGoToDashboard={onGoToDashboard}
              activeChapterId={activeChapterId}
              onSelectChapter={(id) => { setActiveChapterId(id); setIsMobileSidebarOpen(false); }}
              onAddChapter={handleAddChapterWrapper}
              onDeleteChapter={handleDeleteChapterWrapper}
              onExportStory={handleOpenExport}
              onReorderChapters={reorderChapters}
              onOpenSearch={handleOpenSearch}
            />
          </div>
        </div>
      </div>

      {/* --- CENTER EDITOR AREA --- */}
      <div className="flex-grow h-full p-1 sm:p-4 overflow-y-auto min-w-0 bg-white">
        {activeChapter ? (
          <ChapterEditor
            key={activeChapter.id}
            chapter={activeChapter}
            language={currentStory.language}
            storyEncyclopedia={currentStory}
            apiKey={apiKey}
            onUpdate={handleUpdateChapter}
            onEncyclopediaUpdate={updateStoryMetadata}
            isLeftSidebarOpen={isLeftSidebarOpen}
            isRightSidebarOpen={isRightSidebarOpen}
            onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>{t('studio.noChapterSelected')}</p>
          </div>
        )}
      </div>

      {/* --- DESKTOP RIGHT CHAT --- */}
      <div
        className={`hidden md:block flex-shrink-0 transition-all duration-300 ease-in-out border-l border-gray-200 bg-white shadow-sm h-full ${isRightSidebarOpen ? 'w-[400px] xl:w-[500px]' : 'w-0 overflow-hidden'}`}
      >
        <div className="h-full w-full p-4">
          <ChatWindow apiKey={apiKey} storyEncyclopedia={currentStory} key={currentStory.id} onRequestApiKey={onRequestApiKey} />
        </div>
      </div>

      {/* --- MOBILE RIGHT CHAT (OVERLAY) --- */}
      <div
        className={`fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileChatOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="w-full h-full bg-white flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 text-indigo-600 font-bold px-2">
              <SparklesIcon className="w-5 h-5" />
              <span>AI Assistant</span>
            </div>
            <button onClick={() => setIsMobileChatOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200">
              <XIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-grow overflow-hidden p-2">
            <ChatWindow apiKey={apiKey} storyEncyclopedia={currentStory} key={`${currentStory.id}-mobile`} onRequestApiKey={onRequestApiKey} />
          </div>
        </div>
      </div>

      {/* --- MOBILE TOGGLE BUTTONS --- */}
      <div className="md:hidden fixed bottom-4 right-4 flex flex-col gap-3 z-30">
        <button onClick={() => setIsMobileSidebarOpen(true)} className="bg-indigo-600 text-white p-4 rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors">
          <BookOpenIcon className="w-6 h-6" />
        </button>
        <button onClick={() => setIsMobileChatOpen(true)} className="bg-indigo-600 text-white p-4 rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors">
          <SparklesIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default WritingStudio;
