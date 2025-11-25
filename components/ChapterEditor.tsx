
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { marked } from 'marked';
import { Chapter, StoryEncyclopedia, AnalysisResult, ChapterVersion } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { EyeIcon } from './icons/EyeIcon';
import { PencilIcon } from './icons/PencilIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { SaveIcon } from './icons/SaveIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { useStory } from '../contexts/StoryContext';
import EditorToolbar from './EditorToolbar';
import ChapterAnalysisModal from './ChapterAnalysisModal';
import AiPreviewModal from './AiPreviewModal';
import ChapterHistoryModal from './ChapterHistoryModal';
import { generateEditorAction, analyzeChapterContent, getFriendlyErrorMessage } from '../services/geminiService';

interface ChapterEditorProps {
  chapter: Chapter;
  language: 'en' | 'id';
  storyEncyclopedia: StoryEncyclopedia;
  apiKey: string | null;
  onUpdate: (chapterId: string, title: string, content: string) => void;
  onEncyclopediaUpdate?: (updatedStory: StoryEncyclopedia) => void;
  isLeftSidebarOpen?: boolean;
  isRightSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  onToggleRightSidebar?: () => void;
}

interface HistoryState {
    title: string;
    content: string;
}

const BoldIcon = () => <span className="font-bold serif">B</span>;
const ItalicIcon = () => <span className="italic serif">I</span>;
const H2Icon = () => <span className="font-bold text-xs">H2</span>;
const H3Icon = () => <span className="font-bold text-xs">H3</span>;

const ChapterEditor: React.FC<ChapterEditorProps> = ({ 
    chapter, language, storyEncyclopedia, apiKey, onUpdate, onEncyclopediaUpdate,
    isLeftSidebarOpen, isRightSidebarOpen, onToggleLeftSidebar, onToggleRightSidebar
}) => {
  const { createSnapshot } = useStory();
  const [title, setTitle] = useState(chapter.title);
  const [content, setContent] = useState(chapter.content);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // --- Custom History Stack ---
  const [history, setHistory] = useState<HistoryState[]>([{ title: chapter.title, content: chapter.content }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // --- AI Preview State ---
  const [previewData, setPreviewData] = useState<{
      isOpen: boolean;
      type: 'modification' | 'addition';
      originalText: string;
      generatedText: string;
      fullNewContent: string;
  }>({ isOpen: false, type: 'modification', originalText: '', generatedText: '', fullNewContent: '' });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  
  // Refs for immediate access during unmount
  const contentRef = useRef(content);
  const titleRef = useRef(title);
  const chapterIdRef = useRef(chapter.id);

  const { t } = useLanguage();

  useEffect(() => {
    setTitle(chapter.title);
    setContent(chapter.content);
    chapterIdRef.current = chapter.id;
    // Reset history when chapter changes
    setHistory([{ title: chapter.title, content: chapter.content }]);
    setHistoryIndex(0);
  }, [chapter.id]);

  // Update refs when state changes
  useEffect(() => {
      contentRef.current = content;
      titleRef.current = title;
  }, [content, title]);

  // Clean Auto-Save Effect & Force Save on Unmount
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = window.setTimeout(() => {
        if (title !== chapter.title || content !== chapter.content) {
            onUpdate(chapter.id, title, content);
        }
    }, 750);

    // Force Save on Unmount/Change
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (chapterIdRef.current === chapter.id) { 
         onUpdate(chapterIdRef.current, titleRef.current, contentRef.current);
      }
    };
  }, [title, content, chapter, onUpdate]);
  
  const wordCount = useMemo(() => {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  // --- History Management ---
  const addToHistory = (newTitle: string, newContent: string) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ title: newTitle, content: newContent });
      if (newHistory.length > 50) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
      if (historyIndex > 0) {
          const prev = history[historyIndex - 1];
          setTitle(prev.title);
          setContent(prev.content);
          setHistoryIndex(historyIndex - 1);
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          const next = history[historyIndex + 1];
          setTitle(next.title);
          setContent(next.content);
          setHistoryIndex(historyIndex + 1);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
          if (e.key === 'z') {
              e.preventDefault();
              if (e.shiftKey) {
                  handleRedo();
              } else {
                  handleUndo();
              }
          } else if (e.key === 'y') {
              e.preventDefault();
              handleRedo();
          } else if (e.key === 's') {
              e.preventDefault();
              handleSaveSnapshot();
          }
      }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setContent(newContent);
  };
  
  const typingTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => {
          if (content !== history[historyIndex]?.content || title !== history[historyIndex]?.title) {
              addToHistory(title, content);
          }
      }, 1000);
      return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
  }, [content, title]);


  const handleSelect = () => {
      if (textareaRef.current) {
          const start = textareaRef.current.selectionStart;
          const end = textareaRef.current.selectionEnd;
          setHasSelection(start !== end);
      }
  };

  const handleAiAction = async (action: 'rewrite' | 'expand' | 'fixGrammar' | 'beatToProse' | 'autoFormat') => {
      if (!apiKey || !textareaRef.current) return;
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start === end) return;

      const selectedText = content.substring(start, end);
      const precedingText = content.substring(0, start);
      const followingText = content.substring(end);

      setIsThinking(true);
      try {
          const result = await generateEditorAction(apiKey, action, selectedText, {
              precedingText,
              followingText,
              storyContext: storyEncyclopedia
          });
          
          if (result) {
              const newContent = precedingText + result + followingText;
              setPreviewData({
                  isOpen: true,
                  type: 'modification',
                  originalText: selectedText,
                  generatedText: result,
                  fullNewContent: newContent
              });
          }
      } catch (error) {
          console.error("AI Action Failed", error);
          alert(getFriendlyErrorMessage(error));
      } finally {
          setIsThinking(false);
      }
  };

  const handleContinue = async () => {
      if (!apiKey || !textareaRef.current) return;
      const end = textareaRef.current.selectionEnd;
      const precedingText = content.substring(0, end);
      const followingText = content.substring(end);

      setIsThinking(true);
      try {
          const result = await generateEditorAction(apiKey, 'continue', '', {
              precedingText,
              followingText,
              storyContext: storyEncyclopedia
          });

          if (result) {
              const spacer = precedingText.length > 0 && !precedingText.match(/\s$/) ? ' ' : '';
              const newContent = precedingText + spacer + result + followingText;
              setPreviewData({
                  isOpen: true,
                  type: 'addition',
                  originalText: '',
                  generatedText: result,
                  fullNewContent: newContent
              });
          }
      } catch (error) {
          console.error("Continue Failed", error);
          alert(getFriendlyErrorMessage(error));
      } finally {
          setIsThinking(false);
      }
  };

  const applyAiChanges = () => {
      if (previewData.fullNewContent) {
          addToHistory(title, previewData.fullNewContent);
          setContent(previewData.fullNewContent);
      }
      setPreviewData({ ...previewData, isOpen: false });
  };

  const handleAnalyze = async () => {
      if (!apiKey || !content.trim()) return;
      setIsThinking(true);
      try {
          const result = await analyzeChapterContent(apiKey, content, storyEncyclopedia);
          setAnalysisResult(result);
      } catch (error) {
           console.error("Analysis Failed", error);
           alert(getFriendlyErrorMessage(error));
      } finally {
          setIsThinking(false);
      }
  };

  const handleSyncEncyclopedia = (result: AnalysisResult, targetActIndex: number) => {
      if (!onEncyclopediaUpdate) return;
      const updatedStory = { ...storyEncyclopedia };
      const exists = (list: any[], name: string) => list.some(item => item.name.toLowerCase().trim() === name.toLowerCase().trim());

      if (result.newCharacters.length > 0) {
          const uniqueChars = result.newCharacters.filter(c => !exists(updatedStory.characters, c.name));
          updatedStory.characters = [...updatedStory.characters, ...uniqueChars];
      }
      if (result.newLocations.length > 0) {
          const uniqueLocs = result.newLocations.filter(l => !exists(updatedStory.locations, l.name));
          updatedStory.locations = [...updatedStory.locations, ...uniqueLocs];
      }
      if (result.newPlotPoints.length > 0) {
          if (updatedStory.storyArc[targetActIndex]) {
              const newPoints = result.newPlotPoints.map(p => ({ id: crypto.randomUUID(), summary: p }));
              updatedStory.storyArc[targetActIndex].plotPoints.push(...newPoints);
          } else {
              const lastActIndex = updatedStory.storyArc.length - 1;
              const newPoints = result.newPlotPoints.map(p => ({ id: crypto.randomUUID(), summary: p }));
              updatedStory.storyArc[lastActIndex].plotPoints.push(...newPoints);
          }
      }
      onEncyclopediaUpdate(updatedStory);
      setAnalysisResult(null);
      alert(t('analysis.success'));
  };

  const insertFormat = (startTag: string, endTag: string = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = content;
    const newText = text.substring(0, start) + startTag + text.substring(start, end) + endTag + text.substring(end);
    addToHistory(title, newText);
    setContent(newText);
    setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            const newCursorPos = start + startTag.length + (end - start) + endTag.length;
            textareaRef.current.setSelectionRange(start + startTag.length, start + startTag.length + (end - start));
        }
    }, 0);
  };

  // --- Snapshot Handlers ---
  const handleSaveSnapshot = async () => {
      const label = prompt(t('history.enterLabel'));
      if (label !== null) {
          await createSnapshot(chapter.id, label || undefined);
          alert(t('history.saved'));
      }
  };

  const handleRestoreSnapshot = (version: ChapterVersion) => {
      if (confirm(t('history.restoreConfirm'))) {
          setTitle(version.title);
          setContent(version.content);
          addToHistory(version.title, version.content);
          onUpdate(chapter.id, version.title, version.content); // Force save immediately
          setIsHistoryOpen(false);
      }
  };

  const parsedPreview = useMemo(() => {
      if (!isPreviewMode) return '';
      const normalized = content
        .replace(/\r\n|\r/g, '\n') 
        .replace(/\n{3,}/g, '\n\n'); 
      const webnovelContent = normalized.replace(/([^\n])\n([^\n])/g, '$1\n\n$2');
      return marked.parse(webnovelContent, { breaks: true, gfm: true });
  }, [content, isPreviewMode]);

  return (
    <div className="flex flex-col h-full max-h-full bg-slate-800 rounded-lg shadow-2xl overflow-hidden border border-slate-700">
      {analysisResult && (
          <ChapterAnalysisModal 
             result={analysisResult} 
             storyArc={storyEncyclopedia.storyArc}
             onSave={handleSyncEncyclopedia} 
             onClose={() => setAnalysisResult(null)} 
          />
      )}
      
      <AiPreviewModal 
          isOpen={previewData.isOpen}
          type={previewData.type}
          originalText={previewData.originalText}
          generatedText={previewData.generatedText}
          onApply={applyAiChanges}
          onDiscard={() => setPreviewData({ ...previewData, isOpen: false })}
      />

      {isHistoryOpen && (
          <ChapterHistoryModal 
              chapterId={chapter.id}
              onClose={() => setIsHistoryOpen(false)}
              onRestore={handleRestoreSnapshot}
          />
      )}

      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center gap-4">
        {onToggleLeftSidebar && (
            <button 
                onClick={onToggleLeftSidebar} 
                className={`hidden md:flex p-2 rounded-md transition-colors ${isLeftSidebarOpen ? 'text-indigo-400 bg-slate-800' : 'text-slate-400 hover:text-indigo-400'}`}
                title={t('studio.zenMode.toggleSidebar')}
            >
                <BookOpenIcon className="w-5 h-5" />
            </button>
        )}
        
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={language === 'id' ? 'Judul Bab' : 'Chapter Title'}
          className="flex-grow bg-transparent text-xl font-bold text-slate-100 placeholder-slate-500 focus:outline-none min-w-0"
        />
        
        <div className="flex items-center gap-2">
            {/* History Button */}
            <div className="flex items-center bg-slate-700 rounded-md mr-2">
                <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="p-2 text-slate-300 hover:text-white transition-colors"
                    title={t('history.tooltip')}
                >
                    <HistoryIcon className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-600"></div>
                <button
                    onClick={handleSaveSnapshot}
                    className="p-2 text-slate-300 hover:text-white transition-colors"
                    title={t('history.saveSnapshot')}
                >
                    <SaveIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Undo/Redo Buttons */}
            <div className="flex items-center bg-slate-700 rounded-md mr-2">
                <button 
                    onClick={handleUndo} 
                    disabled={historyIndex <= 0}
                    className="p-2 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={t('editor.undo')}
                >
                    <UndoIcon className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-600"></div>
                <button 
                    onClick={handleRedo} 
                    disabled={historyIndex >= history.length - 1}
                    className="p-2 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={t('editor.redo')}
                >
                    <RedoIcon className="w-4 h-4" />
                </button>
            </div>

            <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`p-2 rounded-md transition-colors ${isPreviewMode ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                title={isPreviewMode ? "Edit Mode" : "Preview Mode"}
            >
                {isPreviewMode ? <PencilIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
            </button>
            
             {onToggleRightSidebar && (
                <button 
                    onClick={onToggleRightSidebar} 
                    className={`hidden md:flex p-2 rounded-md transition-colors ${isRightSidebarOpen ? 'text-indigo-400 bg-slate-800' : 'text-slate-400 hover:text-indigo-400'}`}
                    title={t('studio.zenMode.toggleChat')}
                >
                    <SparklesIcon className="w-5 h-5" />
                </button>
            )}
        </div>
      </div>
      
      {/* AI Toolbar */}
      {!isPreviewMode && (
          <EditorToolbar 
             onAction={handleAiAction}
             onContinue={handleContinue}
             onAnalyze={handleAnalyze}
             isThinking={isThinking}
             hasSelection={hasSelection}
          />
      )}

      {/* Formatting Toolbar */}
      {!isPreviewMode && (
          <div className="px-2 py-1.5 bg-slate-700/30 border-b border-slate-700 flex gap-1 overflow-x-auto">
            <button onClick={() => insertFormat('**', '**')} className="p-1.5 rounded hover:bg-slate-600 text-slate-300 min-w-[32px]" title="Bold"><BoldIcon/></button>
            <button onClick={() => insertFormat('*', '*')} className="p-1.5 rounded hover:bg-slate-600 text-slate-300 min-w-[32px]" title="Italic"><ItalicIcon/></button>
            <div className="w-px bg-slate-600 mx-1"></div>
            <button onClick={() => insertFormat('## ', '')} className="p-1.5 rounded hover:bg-slate-600 text-slate-300 min-w-[32px]" title="Heading 2"><H2Icon/></button>
            <button onClick={() => insertFormat('### ', '')} className="p-1.5 rounded hover:bg-slate-600 text-slate-300 min-w-[32px]" title="Heading 3"><H3Icon/></button>
            <div className="w-px bg-slate-600 mx-1"></div>
            <button onClick={() => insertFormat('> ', '')} className="p-1.5 rounded hover:bg-slate-600 text-slate-300 text-sm font-mono" title="Quote">&ldquo;&rdquo;</button>
            <button onClick={() => insertFormat('---\n', '')} className="p-1.5 rounded hover:bg-slate-600 text-slate-300 text-xs font-mono" title="Divider">---</button>
          </div>
      )}

      {/* Editor Area */}
      <div className="flex-grow relative overflow-hidden">
        {isPreviewMode ? (
             <div className="w-full h-full overflow-y-auto bg-slate-950 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent flex justify-center py-8 md:py-12 pb-20">
                 <div className="max-w-3xl w-full h-fit bg-slate-900 border border-slate-800 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] px-8 py-12 md:px-16 md:py-20 relative">
                    {/* Page Decoration */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-900/20 via-indigo-500/20 to-indigo-900/20"></div>
                    
                    <h1 className="text-3xl md:text-5xl font-bold text-center text-slate-200 mb-4 font-serif tracking-tight">{title}</h1>
                    
                    <div className="flex items-center justify-center gap-4 mb-12 opacity-50">
                        <div className="h-px w-12 bg-indigo-400"></div>
                        <div className="w-2 h-2 rotate-45 bg-indigo-500"></div>
                        <div className="h-px w-12 bg-indigo-400"></div>
                    </div>
                    
                    <div 
                        className="prose prose-invert prose-lg md:prose-xl max-w-none font-serif text-slate-300 
                        leading-loose tracking-wide
                        text-justify hyphens-auto
                        prose-headings:font-serif prose-headings:text-indigo-200 prose-headings:font-bold prose-headings:mt-12 prose-headings:mb-6
                        prose-p:indent-0 prose-p:mb-8 prose-p:mt-0 prose-p:text-justify
                        prose-blockquote:border-l-4 prose-blockquote:border-indigo-500/50 prose-blockquote:bg-slate-800/50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:italic prose-blockquote:text-slate-400
                        prose-hr:border-indigo-900/50 prose-hr:my-16 prose-hr:w-1/2 prose-hr:mx-auto
                        prose-strong:text-indigo-200 prose-em:text-indigo-100/80"
                        dangerouslySetInnerHTML={{ __html: parsedPreview }}
                    />
                    
                    <div className="mt-24 flex flex-col items-center justify-center text-slate-600 space-y-2">
                        <div className="text-xl tracking-[0.5em]">***</div>
                    </div>
                 </div>
             </div>
        ) : (
            <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            onMouseUp={handleSelect}
            onKeyUp={handleSelect}
            onTouchEnd={handleSelect}
            placeholder={language === 'id' ? 'Mulai tulis bab Anda di sini... (Mendukung Markdown)' : 'Start writing your chapter here... (Markdown supported)'}
            className="w-full h-full bg-slate-800 text-slate-200 placeholder-slate-500 p-4 sm:p-6 resize-none focus:outline-none text-base leading-relaxed font-mono"
            />
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-2 px-4 border-t border-slate-700 bg-slate-900/50 text-xs text-slate-400 flex justify-between items-center">
        <span className="font-medium">{t('chapterEditor.wordCount')}: {wordCount}</span>
      </div>
    </div>
  );
};

export default ChapterEditor;
