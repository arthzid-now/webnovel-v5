import React, { useState, useEffect, useRef, useMemo } from 'react';
import { marked } from 'marked';
import { Chapter, StoryEncyclopedia, AnalysisResult } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { EyeIcon } from './icons/EyeIcon';
import { PencilIcon } from './icons/PencilIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { useLanguage } from '../contexts/LanguageContext';
import EditorToolbar from './EditorToolbar';
import ChapterAnalysisModal from './ChapterAnalysisModal';
import { generateEditorAction, analyzeChapterContent } from '../services/geminiService';

interface ChapterEditorProps {
  chapter: Chapter;
  language: 'en' | 'id'; // Content language
  storyEncyclopedia: StoryEncyclopedia; // Added prop
  apiKey: string | null; // Added prop
  onUpdate: (chapterId: string, title: string, content: string) => void;
  onEncyclopediaUpdate?: (updatedStory: StoryEncyclopedia) => void; // Optional callback to update parent
  // Zen Mode Props
  isLeftSidebarOpen?: boolean;
  isRightSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  onToggleRightSidebar?: () => void;
}

type SaveStatus = 'idle' | 'editing' | 'saved';

// Simple toolbar icon components locally defined to avoid file spam
const BoldIcon = () => <span className="font-bold serif">B</span>;
const ItalicIcon = () => <span className="italic serif">I</span>;
const H2Icon = () => <span className="font-bold text-xs">H2</span>;
const H3Icon = () => <span className="font-bold text-xs">H3</span>;

const ChapterEditor: React.FC<ChapterEditorProps> = ({ 
    chapter, language, storyEncyclopedia, apiKey, onUpdate, onEncyclopediaUpdate,
    isLeftSidebarOpen, isRightSidebarOpen, onToggleLeftSidebar, onToggleRightSidebar
}) => {
  const [title, setTitle] = useState(chapter.title);
  const [content, setContent] = useState(chapter.content);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const statusTimeoutRef = useRef<number | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    setTitle(chapter.title);
    setContent(chapter.content);
    setSaveStatus('idle');
  }, [chapter]);

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);

    if (title !== chapter.title || content !== chapter.content) {
        setSaveStatus('editing');
    }

    saveTimeoutRef.current = window.setTimeout(() => {
        if (title !== chapter.title || content !== chapter.content) {
            onUpdate(chapter.id, title, content);
            setSaveStatus('saved');
            statusTimeoutRef.current = window.setTimeout(() => {
                setSaveStatus('idle');
            }, 2000);
        }
    }, 750);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, [title, content, chapter, onUpdate]);
  
  const wordCount = useMemo(() => {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  // Track selection for toolbar state
  const handleSelect = () => {
      if (textareaRef.current) {
          const start = textareaRef.current.selectionStart;
          const end = textareaRef.current.selectionEnd;
          setHasSelection(start !== end);
      }
  };

  // AI Tool Handlers
  const handleAiAction = async (action: 'rewrite' | 'expand' | 'fixGrammar' | 'beatToProse') => {
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
              setContent(newContent);
              // Restore focus logic could go here
          }
      } catch (error) {
          console.error("AI Action Failed", error);
          alert(t('chat.errorMessage'));
      } finally {
          setIsThinking(false);
      }
  };

  const handleContinue = async () => {
      if (!apiKey || !textareaRef.current) return;
      const end = textareaRef.current.selectionEnd; // Use cursor position
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
              // Insert result at cursor
              const newContent = precedingText + (precedingText.endsWith(' ') ? '' : ' ') + result + followingText;
              setContent(newContent);
          }
      } catch (error) {
          console.error("Continue Failed", error);
          alert(t('chat.errorMessage'));
      } finally {
          setIsThinking(false);
      }
  };

  const handleAnalyze = async () => {
      if (!apiKey || !content.trim()) return;
      setIsThinking(true);
      try {
          const result = await analyzeChapterContent(apiKey, content, storyEncyclopedia);
          setAnalysisResult(result);
      } catch (error) {
           console.error("Analysis Failed", error);
           alert(t('chat.errorMessage'));
      } finally {
          setIsThinking(false);
      }
  };

  const handleSyncEncyclopedia = (result: AnalysisResult, targetActIndex: number) => {
      if (!onEncyclopediaUpdate) return;
      
      const updatedStory = { ...storyEncyclopedia };
      
      // Add new data
      if (result.newCharacters.length > 0) {
          updatedStory.characters = [...updatedStory.characters, ...result.newCharacters];
      }
      if (result.newLocations.length > 0) {
          updatedStory.locations = [...updatedStory.locations, ...result.newLocations];
      }
      if (result.newPlotPoints.length > 0) {
          // Use the act selected by the user
          if (updatedStory.storyArc[targetActIndex]) {
              const newPoints = result.newPlotPoints.map(p => ({ id: crypto.randomUUID(), summary: p }));
              updatedStory.storyArc[targetActIndex].plotPoints.push(...newPoints);
          } else {
             // Fallback just in case index is out of bounds
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
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + startTag + selection + endTag + after;
    setContent(newText);
    
    // Need to defer focus/selection update to allow React render
    setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            const newCursorPos = start + startTag.length + selection.length + endTag.length;
            textareaRef.current.setSelectionRange(start + startTag.length, start + startTag.length + selection.length);
        }
    }, 0);
  };

  const renderStatus = () => {
    switch (saveStatus) {
      case 'editing': return <span className="text-amber-400 italic text-xs animate-pulse">{t('chapterEditor.statusEditing')}</span>;
      case 'saved': return <span className="text-emerald-400 flex items-center gap-1 text-xs"><CheckIcon className="w-3 h-3" /> {t('chapterEditor.statusSaved')}</span>;
      default: return null;
    }
  };

  const parsedPreview = useMemo(() => {
      return isPreviewMode ? marked.parse(content) : '';
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

      {/* Formatting Toolbar (Only in Edit Mode) */}
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
             <div 
                className="w-full h-full p-6 sm:p-8 overflow-y-auto prose prose-invert prose-lg max-w-none bg-slate-800"
                dangerouslySetInnerHTML={{ __html: parsedPreview }}
             />
        ) : (
            <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onSelect={handleSelect} // Track selection for toolbar
            placeholder={language === 'id' ? 'Mulai tulis bab Anda di sini... (Mendukung Markdown)' : 'Start writing your chapter here... (Markdown supported)'}
            className="w-full h-full bg-slate-800 text-slate-200 placeholder-slate-500 p-4 sm:p-6 resize-none focus:outline-none text-base leading-relaxed font-mono"
            />
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-2 px-4 border-t border-slate-700 bg-slate-900/50 text-xs text-slate-400 flex justify-between items-center">
        <span className="font-medium">{t('chapterEditor.wordCount')}: {wordCount}</span>
        <div className="h-4 flex items-center">
            {renderStatus()}
        </div>
      </div>
    </div>
  );
};

export default ChapterEditor;