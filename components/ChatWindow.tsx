
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat } from '@google/genai';
import { Message, MessageAuthor, StoryEncyclopedia, Persona } from '../types';
import { DEFAULT_PERSONAS } from '../constants';
import { createChatSession, getFriendlyErrorMessage, summarizeChatSession } from '../services/geminiService';
import { MessageComponent } from './Message';
import { SendIcon } from './icons/SendIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { TrashIcon } from './icons/TrashIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../db';
import { PencilIcon } from './icons/PencilIcon';
import { CheckIcon } from './icons/CheckIcon';
import { CoffeeIcon } from './icons/CoffeeIcon';
import { RobotIcon } from './icons/RobotIcon';
import { GlassesIcon } from './icons/GlassesIcon';

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

  // Persona State
  const [activePersonaId, setActivePersonaId] = useState<string>('bimo');
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState('');
  const [customPersonaNames, setCustomPersonaNames] = useState<Record<string, string>>({});

  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load Custom Names
  useEffect(() => {
    try {
      const storedNames = localStorage.getItem('persona_custom_names');
      if (storedNames) {
        setCustomPersonaNames(JSON.parse(storedNames));
      }
    } catch (e) { }
  }, []);

  // Auto-update Thinking Mode based on Persona Defaults
  useEffect(() => {
    const persona = DEFAULT_PERSONAS.find(p => p.id === activePersonaId);
    if (persona) {
      setIsThinkingMode(persona.defaultThinking);
    }
  }, [activePersonaId]);

  const saveCustomName = () => {
    if (tempName.trim()) {
      const newNames = { ...customPersonaNames, [activePersonaId]: tempName.trim() };
      setCustomPersonaNames(newNames);
      localStorage.setItem('persona_custom_names', JSON.stringify(newNames));
    }
    setIsRenaming(false);
  };

  const activePersona = DEFAULT_PERSONAS.find(p => p.id === activePersonaId) || DEFAULT_PERSONAS[0];
  const displayName = customPersonaNames[activePersona.id] || activePersona.defaultName;

  // Effect for loading messages from IndexedDB
  useEffect(() => {
    const loadChat = async () => {
      try {
        const session = await db.chats.get(storyEncyclopedia.id);
        if (session && session.messages.length > 0) {
          setMessages(session.messages);
        } else {
          // If chat is empty, show the initial greeting message based on persona
          const initialMessageText = storyEncyclopedia.language === 'id'
            ? `Hai! Aku **${displayName}**. Siap bantu bikin cerita '${storyEncyclopedia.title}' jadi keren. Mau mulai dari mana?`
            : `Hi! I'm **${displayName}**. Ready to make '${storyEncyclopedia.title}' awesome. Where should we start?`;

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
  }, [storyEncyclopedia.id, storyEncyclopedia.language, storyEncyclopedia.title, activePersona.id]);

  // Effect for setting up the chat session with Gemini
  useEffect(() => {
    if (apiKey && isHistoryLoaded) {
      chatRef.current = createChatSession(apiKey, isThinkingMode, storyEncyclopedia, messages, activePersona);
    } else {
      chatRef.current = null;
    }
  }, [apiKey, isThinkingMode, storyEncyclopedia.id, isHistoryLoaded, messages.length > 0, activePersona]);

  // Effect to save messages to IndexedDB
  useEffect(() => {
    if (isHistoryLoaded && messages.length > 0 && messages[0].id !== 'initial-ai-message') {
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
    if (window.confirm("Are you sure you want to clear the chat history? This will reset the AI context.")) {
      setMessages([]);
      try {
        await db.chats.delete(storyEncyclopedia.id);
      } catch (e) {
        console.error("Failed to clear chat db", e);
      }

      if (apiKey) {
        chatRef.current = createChatSession(apiKey, isThinkingMode, storyEncyclopedia, [], activePersona);
      }

      const initialMessageText = storyEncyclopedia.language === 'id'
        ? `Chat dibersihkan. **${displayName}** siap mulai lembaran baru!`
        : `Chat cleared. **${displayName}** is ready for a fresh start!`;
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

    // if (!apiKey) {
    //   onRequestApiKey();
    //   return;
    // }

    const userMessageText = userInput;
    setUserInput('');

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
        chatRef.current = createChatSession(apiKey, isThinkingMode, storyEncyclopedia, messages, activePersona);
      }

      const streamResult = await chatRef.current.sendMessageStream({ role: 'user', parts: [{ text: userMessageText }] });

      let fullText = '';
      for await (const chunk of streamResult.stream) {
        const chunkText = chunk.text();

        // Safety Check in Stream
        const finishReason = chunk.candidates?.[0]?.finishReason;
        if (finishReason === 'SAFETY') {
          throw new Error("SAFETY_BLOCK");
        }

        if (chunkText) {
          fullText += chunkText;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessagePlaceholder.id ? { ...msg, text: fullText } : msg
            )
          );
        }
      }

      // If nothing came back and no error threw, check if it was empty
      if (!fullText) {
        throw new Error("Empty response from AI. Possibly filtered.");
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
      const niceError = getFriendlyErrorMessage(error);

      const errorAiMessage: Message = {
        id: `ai-error-${Date.now()}`,
        author: MessageAuthor.AI,
        text: `**Error:** ${niceError}`,
        timestamp: Date.now()
      };
      setMessages(prev => prev.map(msg => msg.id === aiMessagePlaceholder.id ? errorAiMessage : msg));
    } finally {
      setIsLoading(false);

      // Check for Auto-Summarization (Every 20 messages)
      const currentCount = messages.length + 2; // + user msg + ai msg
      if (currentCount >= 20 && apiKey) {
        // Run in background, don't block UI
        summarizeChatSession(apiKey, [...messages, userMessage, { ...aiMessagePlaceholder, text: '...' }], storyEncyclopedia.aiMemory || '')
          .then(async (newMemory) => {
            console.log("Chat Summarized:", newMemory);

            // Update Story with new Memory
            const updatedStory = { ...storyEncyclopedia, aiMemory: newMemory, updatedAt: Date.now() };
            await db.stories.put(updatedStory);

            // Keep last 4 messages for continuity
            const keptMessages = messages.slice(-4);
            setMessages(keptMessages);

            // Update DB Chat
            await db.chats.put({ storyId: storyEncyclopedia.id, messages: keptMessages });

            // Force reload chat session with new memory
            chatRef.current = createChatSession(apiKey, isThinkingMode, updatedStory, keptMessages, activePersona);
          })
          .catch(err => console.error("Auto-summary failed:", err));
      }
    }
  }, [userInput, isLoading, storyEncyclopedia, isThinkingMode, t, apiKey, onRequestApiKey, messages, activePersona]);

  const getPersonaIcon = (iconType: string) => {
    switch (iconType) {
      case 'coffee': return <CoffeeIcon className="w-5 h-5" />;
      case 'robot': return <RobotIcon className="w-5 h-5" />;
      case 'glasses': return <GlassesIcon className="w-5 h-5" />;
      default: return <BrainCircuitIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className={`flex flex-col flex-grow h-full max-h-full bg-white rounded-lg shadow-2xl overflow-hidden border border-${activePersona.color}-500/30 transition-colors duration-500`}>
      {/* Header Area */}
      <div className={`p-3 bg-white/50 border-b border-${activePersona.color}-500/30 flex flex-col gap-3`}>

        {/* Top Row: Persona Selector + Thinking Mode (Flex Wrap for Mobile) */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200">
            {DEFAULT_PERSONAS.map(persona => (
              <button
                key={persona.id}
                onClick={() => setActivePersonaId(persona.id)}
                className={`p-2 rounded-lg transition-all ${activePersonaId === persona.id ? `bg-${persona.color}-500/20 text-${persona.color}-400 shadow-sm` : 'text-gray-500 hover:text-gray-700'}`}
                title={persona.role}
              >
                {getPersonaIcon(persona.icon)}
              </button>
            ))}
          </div>

          {/* Compact Thinking Mode Button */}
          <button
            onClick={() => setIsThinkingMode(!isThinkingMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${isThinkingMode
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-white border-amber-200/50 text-gray-600 hover:border-gray-300'
              }`}
            title={t('chat.thinkingModeTooltip')}
          >
            <BrainCircuitIcon className={`w-4 h-4 ${isThinkingMode ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{t('chat.thinkingMode')}</span>
            <span className="sm:hidden">{isThinkingMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Active Persona Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${activePersona.color}-500/10 border border-${activePersona.color}-500/30`}>
              <div className={`text-${activePersona.color}-400`}>
                {getPersonaIcon(activePersona.icon)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isRenaming ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="bg-gray-100 text-gray-900 text-sm rounded px-1 py-0.5 w-24 sm:w-32 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && saveCustomName()}
                    />
                    <button onClick={saveCustomName} className="text-emerald-400 hover:text-emerald-300"><CheckIcon className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <h3 className={`font-bold text-${activePersona.color}-200 truncate max-w-[150px] sm:max-w-none`}>{displayName}</h3>
                    <button onClick={() => { setTempName(displayName); setIsRenaming(true); }} className="text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      <PencilIcon className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-600 truncate max-w-[200px] sm:max-w-none">{activePersona.role}</p>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="p-2 text-gray-500 hover:text-rose-400 rounded-lg transition-colors"
            title="Clear Chat History"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={chatContainerRef} className="flex-grow p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar bg-white">
        {messages.map((msg) => (
          <MessageComponent key={msg.id} message={msg} isLoading={isLoading && msg.id.startsWith('ai-placeholder')} />
        ))}
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
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
            placeholder={`${t('chat.placeholder')} (${displayName})...`}
            className={`w-full bg-gray-100 text-gray-900 placeholder-gray-400 rounded-lg p-3 pr-12 resize-none border border-amber-200/50 focus:ring-2 focus:ring-${activePersona.color}-500 focus:outline-none transition duration-200`}
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim()}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-white bg-${activePersona.color}-600 hover:bg-${activePersona.color}-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors`}
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
