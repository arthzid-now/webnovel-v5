import React, { useState } from 'react';
import { marked } from 'marked';
import { Message, MessageAuthor } from '../types';
import { UserIcon } from './icons/UserIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';

interface MessageProps {
  message: Message;
  isLoading: boolean;
}

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
    </div>
);

export const MessageComponent: React.FC<MessageProps> = ({ message, isLoading }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.author === MessageAuthor.USER;
  const isAi = !isUser;

  const handleCopy = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const parsedHtml = message.text ? marked.parse(message.text) : '';

  const containerClasses = isUser ? 'flex items-start justify-end gap-3' : 'flex items-start gap-3';
  const bubbleClasses = isUser
    ? 'bg-indigo-600 text-white rounded-l-lg rounded-br-lg'
    : 'bg-slate-700 text-slate-200 rounded-r-lg rounded-bl-lg';
  const icon = isUser ? (
    <div className="w-8 h-8 flex-shrink-0 bg-slate-600 rounded-full flex items-center justify-center">
        <UserIcon className="w-5 h-5 text-slate-300" />
    </div>
  ) : (
     <div className="w-8 h-8 flex-shrink-0 bg-slate-600 rounded-full flex items-center justify-center">
        <SparklesIcon className="w-5 h-5 text-indigo-400" />
    </div>
  );
  
  return (
    <div className={containerClasses}>
      {!isUser && icon}
      <div className={`group relative p-4 max-w-lg md:max-w-xl lg:max-w-2xl ${bubbleClasses}`}>
        {isAi && !isLoading && message.text && (
            <button 
                onClick={handleCopy} 
                className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-800/50 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 hover:text-white"
                aria-label="Copy message"
                title="Copy message"
            >
                {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
            </button>
        )}
        {isLoading && !message.text ? (
          <TypingIndicator />
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-2" dangerouslySetInnerHTML={{ __html: parsedHtml }} />
        )}
      </div>
      {isUser && icon}
    </div>
  );
};