// src/components/ContextList.tsx
'use client';

import React, { useCallback, useState } from 'react'; // Added useState for input management
import { FiBookOpen, FiPlus, FiTrash2 } from 'react-icons/fi'; // Changed FiAward to FiBookOpen, FiRotateCcw to FiTrash2
import { ListItem } from '@/types'; // Import ListItem type
import { PiGraphFill } from 'react-icons/pi';

interface ContextListProps {
  // Renamed from PastAchievementsListProps
  list: ListItem[];
  addToList: (text: string) => void;
  removeFromList: (id: number) => void;
}

const ContextList: React.FC<ContextListProps> = ({
  // Renamed from PastAchievementsList
  list,
  addToList,
  removeFromList,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddContext = useCallback(() => {
    if (inputValue.trim()) {
      addToList(inputValue.trim());
      setInputValue(''); // Clear input after adding
    }
  }, [inputValue, addToList]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleAddContext();
      }
    },
    [handleAddContext]
  );

  return (
    <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300">
      <div className="flex gap-2 justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Contextual Notes & Learnings</h3>{' '}
        <PiGraphFill size={22} className="text-blue-400" /> {/* Changed icon and adjusted color */}
        {/* Updated title */}
      </div>
      <ul id="contextList" className="mb-4 space-y-3">
        {' '}
        {/* Increased space-y, changed id */}
        {list.length === 0 ? (
          <li className="p-4 text-center rounded-md text-white/70 bg-white/5">
            No contextual notes yet.
          </li>
        ) : (
          list.map((item: ListItem) => (
            <li
              key={item.id}
              className="flex justify-between items-center p-3 rounded-md border transition-all duration-200 bg-blue-500/10 border-blue-400/20 hover:bg-blue-500/20"
            >
              <span className="text-white/90">{item.text}</span>
              <button
                onClick={() => removeFromList(item.id)}
                className="p-2 rounded-full transition-all duration-200 cursor-pointer hover:bg-red-500/20"
                title="Remove note"
              >
                <FiTrash2 className="w-4 h-4" /> {/* Updated icon */}
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="flex flex-col gap-2 mb-4 sm:flex-row">
        <input
          id="contextInput" // Changed id
          type="text"
          placeholder="Add a note or learning..."
          className="flex-1 p-3 text-white rounded-lg border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          id="addContextBtn" // Changed id
          className="flex justify-center items-center px-6 py-3 text-white rounded-md transition-all duration-200 cursor-pointer bg-white/5 border-white/10 hover:bg-white/10"
          title="Add Note"
          onClick={handleAddContext}
        >
          <FiPlus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ContextList;
