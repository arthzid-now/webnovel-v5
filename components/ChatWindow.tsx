import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat } from '@google/genai';
import { Message, MessageAuthor, StoryEncyclopedia } from '../types';
import { createChatSession } from '../services/geminiService';
import { MessageComponent } from './Message';
import { SendIcon } from './icons/SendIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { TrashIcon } from './icons/TrashIcon'; // Import TrashIcon
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../db'; // Import IndexedDB

interface ChatWindowProps {
  apiKey: string | null;
  storyEncyclopedia: StoryEncyclopedia;
  onRequestApiKey: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ apiKey, storyEncyclopedia, onRequestApiKey }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  
  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Effect for setting up the chat session with Gemini
  useEffect(() => {
    if (apiKey) {
      chatRef.current = createChatSession(apiKey, isThinkingMode, storyEncyclopedia);
    } else {
      chatRef.current = null;
    }
  }, [apiKey, isThinkingMode, storyEncyclopedia.id]); 
  
  // Effect for loading messages from IndexedDB
  useEffect(() => {
    const loadChat = async () => {
        try {
            const session = await db.chats.get(storyEncyclopedia.id);
            if (session && session.messages.length > 0) {
                setMessages(session.messages);
            } else {
                // If chat is empty, show the initial greeting message
                const initialMessageText = storyEncyclopedia.language === 'id'
                  ? `Oke, aku sudah memuat Ensiklopedia Cerita untuk **"${storyEncyclopedia.title}"**. Panggung sudah siap! Bagian mana dari dunia ini yang akan kita jelajahi pertama?`
                  : `Okay, I've loaded the Story Encyclopedia for **"${storyEncyclopedia.title}"**. The stage is set! What part of this world should we explore first?`;
                setMessages([
                  {
                    id: 'initial-ai-message',
                    author: MessageAuthor.AI,
                    text: initialMessageText,
                    timestamp: Date.now(),
                  },
                ]);
            }
        } catch (error) {
            console.error("Error loading messages from DB:", error);
        } finally {
            setIsHistoryLoaded(true);
        }
    };
    loadChat();
  }, [storyEncyclopedia.id, storyEncyclopedia.language, storyEncyclopedia.title]);

  // Effect to save messages to IndexedDB whenever they change
  useEffect(() => {
    // Wait for history to load first to avoid overwriting with empty array
    if (isHistoryLoaded && messages.length > 0 && messages[0].id !== 'initial-ai-message') {
        // Fire and forget save
        db.chats.put({ storyId: storyEncyclopedia.id, messages }).catch(err => {
            console.error("Error saving chat to DB:", err);
        });
    }
  }, [messages, storyEncyclopedia.id, isHistoryLoaded]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleClearChat = async () => {
      if(window.confirm("Are you sure you want to clear the chat history? This will reset the AI context.")) {
          setMessages([]);
          try {
              await db.chats.delete(storyEncyclopedia.id);
          } catch (e) {
              console.error("Failed to clear chat db", e);
          }

          // Re-initialize chat to clear backend history/context if possible (creates new instance)
          if (apiKey) {
            chatRef.current = createChatSession(apiKey, isThinkingMode, storyEncyclopedia);
          }
          
          // Restore initial greeting
          const initialMessageText = storyEncyclopedia.language === 'id'
              ? `Oke, aku sudah memuat Ensiklopedia Cerita untuk **"${storyEncyclopedia.title}"**. Panggung sudah siap! Bagian mana dari dunia ini yang akan kita jelajahi pertama?`
              : `Okay, I've loaded the Story Encyclopedia for **"${storyEncyclopedia.title}"**. The stage is set! What part of this world should we explore first?`;
            setMessages([
              {
                id: 'initial-ai-message',
                author: MessageAuthor.AI,
                text: initialMessageText,
                timestamp: Date.now(),
              },
            ]);
      }
  };

  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim() || isLoading) return;

    if (!apiKey) {
        onRequestApiKey();
        return;
    }

    const userMessageText = userInput;
    setUserInput(''); // Clear input immediately

    const userMessage: Message = {
        id: `user-${Date.now()}`,
        author: MessageAuthor.USER,
        text: userMessageText,
        timestamp: Date.now()
    };

    const aiMessagePlaceholder: Message = {
      id: `ai-placeholder-${Date.now()}`,
      author: MessageAuthor.AI,
      text: '',
      timestamp: Date.now() + 1
    };

    setMessages(prev => [...prev.filter(m => m.id !== 'initial-ai-message'), userMessage, aiMessagePlaceholder]);
    setIsLoading(true);

    try {
        if (!chatRef.current) {
            chatRef.current = createChatSession(apiKey, isThinkingMode, storyEncyclopedia);
        }

        const stream = await chatRef.current.sendMessageStream({ message: userMessageText });

        let fullText = '';
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullText += chunkText;
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === aiMessagePlaceholder.id ? { ...msg, text: fullText } : msg
                    )
                );
            }
        }
        
        const finalAiMessage: Message = {
            id: `ai-${Date.now()}`,
            author: MessageAuthor.AI,
            text: fullText,
            timestamp: Date.now()
        };
        setMessages(prev => prev.map(msg => msg.id === aiMessagePlaceholder.id ? finalAiMessage : msg));

    } catch (error) {
        console.error("Error sending message:", error);
         const errorAiMessage: Message = {
            id: `ai-error-${Date.now()}`,
            author: MessageAuthor.AI,
            text: t('chat.errorMessage'),
            timestamp: Date.now()
        };
        setMessages(prev => prev.map(msg => msg.id === aiMessagePlaceholder.id ? errorAiMessage : msg));
    } finally {
        setIsLoading(false);
    }
  }, [userInput, isLoading, storyEncyclopedia, isThinkingMode, t, apiKey, onRequestApiKey]);

  return (
    <div className="flex flex-col flex-grow h-full max-h-full bg-slate-800 rounded-lg shadow-2xl overflow-hidden border border-slate-700">
      <div className="p-3 bg-slate-900/50 border-b border-slate-700 flex items-center justify-between">
         <button 
            onClick={handleClearChat}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
            title="Clear Chat History"
         >
             <TrashIcon className="w-4 h-4"/>
         </button>

         <div className="flex items-center gap-2" title={t('chat.thinkingModeTooltip')}>
            <BrainCircuitIcon className={`w-5 h-5 transition-colors ${isThinkingMode ? 'text-indigo-400' : 'text-slate-400'}`} />
            <label htmlFor="thinking-mode" className={`text-sm font-medium cursor-pointer transition-colors ${isThinkingMode ? 'text-slate-200' : 'text-slate-400'}`}>
                {t('chat.thinkingMode')}
            </label>
            <div className="relative">
                 <input
                    id="thinking-mode"
                    type="checkbox"
                    checked={isThinkingMode}
                    onChange={(e) => setIsThinkingMode(e.target.checked)}
                    className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </div>
         </div>
      </div>
      <div ref={chatContainerRef} className="flex-grow p-4 md:p-6 space-y-6 overflow-y-auto">
        {messages.map((msg) => (
          <MessageComponent key={msg.id} message={msg} isLoading={isLoading && msg.id.startsWith('ai-placeholder')} />
        ))}
      </div>
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="relative">
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={t('chat.placeholder')}
            className="w-full bg-slate-700 text-slate-200 placeholder-slate-400 rounded-lg p-3 pr-12 resize-none border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;