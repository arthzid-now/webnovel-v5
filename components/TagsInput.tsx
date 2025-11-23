import React, { useState, KeyboardEvent } from 'react';
import { XIcon } from './icons/XIcon';

interface TagsInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
}

const TagsInput: React.FC<TagsInputProps> = ({ tags, onTagsChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        onTagsChange([...tags, newTag]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const removeTag = (indexToRemove: number) => {
    onTagsChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="w-full flex flex-wrap items-center gap-2 bg-slate-700 text-slate-200 rounded-md p-2 border border-slate-600 focus-within:ring-2 focus-within:ring-indigo-500 transition duration-200">
      {tags.map((tag, index) => (
        <div key={index} className="flex items-center gap-1 bg-indigo-500/50 text-indigo-200 text-sm font-medium px-2 py-1 rounded">
          <span>{tag}</span>
          <button onClick={() => removeTag(index)} className="text-indigo-200 hover:text-white">
            <XIcon className="w-3 h-3" />
          </button>
        </div>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-grow bg-transparent focus:outline-none text-sm placeholder-slate-400"
      />
    </div>
  );
};

export default TagsInput;
