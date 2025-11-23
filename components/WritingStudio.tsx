import React, { useState, useEffect } from 'react';
import { StoryEncyclopedia, Chapter } from '../types';
import StoryEncyclopediaSidebar from './StoryEncyclopediaSidebar';
import ChapterEditor from './ChapterEditor';
import ChatWindow from './ChatWindow';
import { useLanguage } from '../contexts/LanguageContext';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { XIcon } from './icons/XIcon';

interface WritingStudioProps {
  apiKey: string | null;
  story: StoryEncyclopedia;
  onUpdateStory: (updatedStory: StoryEncyclopedia) => void;
  onGoToDashboard: () => void;
  onEditRequest: () => void;
  onExportStory: (storyId: string) => void;
  onRequestApiKey: () => void;
}

const WritingStudio: React.FC<WritingStudioProps> = ({ apiKey, story, onUpdateStory, onGoToDashboard, onEditRequest, onExportStory, onRequestApiKey }) => {
  const [activeChapterId, setActiveChapterId] = useState<string>(story.chapters[0]?.id || '');
  const { t } = useLanguage();
  
  // Mobile Sidebar States
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Desktop Zen Mode States
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);


  // Ensure activeChapterId is always valid
  useEffect(() => {
    if (!story.chapters.some(c => c.id === activeChapterId)) {
      setActiveChapterId(story.chapters[0]?.id || '');
    }
  }, [story.chapters, activeChapterId]);

  const handleUpdateChapter = (chapterId: string, title: string, content: string) => {
    const updatedChapters = story.chapters.map(chap => 
      chap.id === chapterId ? { ...chap, title, content } : chap
    );
    onUpdateStory({ ...story, chapters: updatedChapters });
  };
  
  const handleAddChapter = () => {
      const newChapter: Chapter = {
          id: crypto.randomUUID(),
          title: `${story.language === 'id' ? 'Bab' : 'Chapter'} ${story.chapters.length + 1}`,
          content: ''
      };
      const updatedStory = { ...story, chapters: [...story.chapters, newChapter] };
      onUpdateStory(updatedStory);
      setActiveChapterId(newChapter.id);
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (story.chapters.length <= 1) {
      alert(t('studio.deleteLastError'));
      return;
    }

    const chapterToDelete = story.chapters.find(c => c.id === chapterId);
    const confirmMessage = t('studio.deleteConfirm', { title: chapterToDelete?.title || ''});

    if (window.confirm(confirmMessage)) {
      const updatedChapters = story.chapters.filter(chap => chap.id !== chapterId);
      onUpdateStory({ ...story, chapters: updatedChapters });
      
      if (activeChapterId === chapterId) {
        setActiveChapterId(updatedChapters[0]?.id || '');
      }
    }
  };
  
  const activeChapter = story.chapters.find(c => c.id === activeChapterId);

  return (
    <div className="relative flex flex-grow w-full h-[calc(100vh-73px)] overflow-hidden">
      {/* --- DESKTOP LEFT SIDEBAR --- */}
      <div className={`hidden md:block flex-shrink-0 transition-all duration-300 ease-in-out border-r border-slate-700 bg-slate-800 ${isLeftSidebarOpen ? 'w-80 lg:w-96' : 'w-0 overflow-hidden'}`}>
        <StoryEncyclopediaSidebar
          storyEncyclopedia={story}
          onEdit={onEditRequest}
          onGoToDashboard={onGoToDashboard}
          activeChapterId={activeChapterId}
          onSelectChapter={setActiveChapterId}
          onAddChapter={handleAddChapter}
          onDeleteChapter={handleDeleteChapter}
          onExportStory={onExportStory}
        />
      </div>

      {/* --- MOBILE LEFT SIDEBAR (OVERLAY) --- */}
      <div 
        className={`fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="absolute inset-0 bg-slate-900/60" onClick={() => setIsMobileSidebarOpen(false)}></div>
        <div className="relative w-full max-w-sm h-full bg-slate-800 shadow-xl">
          <StoryEncyclopediaSidebar
            storyEncyclopedia={story}
            onEdit={onEditRequest}
            onGoToDashboard={onGoToDashboard}
            activeChapterId={activeChapterId}
            onSelectChapter={(id) => { setActiveChapterId(id); setIsMobileSidebarOpen(false); }}
            onAddChapter={handleAddChapter}
            onDeleteChapter={handleDeleteChapter}
            onExportStory={onExportStory}
          />
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="absolute top-3 right-3 p-2 bg-slate-700/50 rounded-full text-slate-200"
            aria-label={t('studio.mobile.closeEncyclopedia')}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* --- CENTER EDITOR AREA --- */}
      <div className="flex-grow h-full p-1 sm:p-4 overflow-y-auto min-w-0">
        {activeChapter ? (
          <ChapterEditor 
            key={activeChapter.id}
            chapter={activeChapter} 
            language={story.language}
            storyEncyclopedia={story}
            apiKey={apiKey}
            onUpdate={handleUpdateChapter}
            onEncyclopediaUpdate={onUpdateStory}
            isLeftSidebarOpen={isLeftSidebarOpen}
            isRightSidebarOpen={isRightSidebarOpen}
            onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>{t('studio.noChapterSelected')}</p>
          </div>
        )}
      </div>

      {/* --- DESKTOP RIGHT CHAT --- */}
      <div className={`hidden md:block flex-shrink-0 transition-all duration-300 ease-in-out border-l border-slate-700 bg-slate-800 h-full ${isRightSidebarOpen ? 'w-[400px] xl:w-[500px]' : 'w-0 overflow-hidden'}`}>
          <div className="h-full w-full p-4">
             <ChatWindow apiKey={apiKey} storyEncyclopedia={story} key={story.id} onRequestApiKey={onRequestApiKey} />
          </div>
      </div>

      {/* --- MOBILE RIGHT CHAT (OVERLAY) --- */}
       <div 
        className={`fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileChatOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="w-full h-full bg-slate-800">
          <ChatWindow apiKey={apiKey} storyEncyclopedia={story} key={`${story.id}-mobile`} onRequestApiKey={onRequestApiKey} />
          <button 
            onClick={() => setIsMobileChatOpen(false)}
            className="absolute top-4 left-4 p-2 bg-slate-700/50 rounded-full text-slate-200"
            aria-label={t('studio.mobile.closeChat')}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* --- MOBILE TOGGLE BUTTONS --- */}
      <div className="md:hidden fixed bottom-4 right-4 flex flex-col gap-3 z-30">
        <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="bg-indigo-600 text-white p-4 rounded-full shadow-lg flex items-center justify-center"
            aria-label={t('studio.mobile.openEncyclopedia')}
        >
            <BookOpenIcon className="w-6 h-6" />
        </button>
         <button 
            onClick={() => setIsMobileChatOpen(true)}
            className="bg-indigo-600 text-white p-4 rounded-full shadow-lg flex items-center justify-center"
            aria-label={t('studio.mobile.openChat')}
        >
            <SparklesIcon className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
};

export default WritingStudio;