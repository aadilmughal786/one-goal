// src/components/NotToDoList.tsx
'use client';

import React, { useCallback, useState } from 'react'; // Added useState for input management
import { FiXCircle, FiPlus, FiTrash2 } from 'react-icons/fi'; // Changed FiRotateCcw to FiTrash2
import { ListItem } from '@/types'; // Import ListItem type

interface NotToDoListProps {
  list: ListItem[];
  addToList: (text: string) => void;
  removeFromList: (id: number) => void;
}

const NotToDoList: React.FC<NotToDoListProps> = ({ list, addToList, removeFromList }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddNotToDo = useCallback(() => {
    if (inputValue.trim()) {
      addToList(inputValue.trim());
      setInputValue(''); // Clear input after adding
    }
  }, [inputValue, addToList]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleAddNotToDo();
      }
    },
    [handleAddNotToDo]
  );

  return (
    <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300">
      <div className="flex gap-2 items-center mb-4">
        <FiXCircle className="w-6 h-6 text-red-400" /> {/* Adjusted color for dark theme */}
        <h3 className="text-xl font-bold text-white">What Not To Do</h3>
      </div>
      <ul id="notToDoList" className="mb-4 space-y-3">
        {' '}
        {/* Increased space-y */}
        {list.length === 0 ? (
          <li className="p-4 text-center rounded-md text-white/70 bg-white/5">
            No "What Not To Do" items yet.
          </li>
        ) : (
          list.map((item: ListItem) => (
            <li
              key={item.id}
              className="flex justify-between items-center p-3 rounded-md border transition-all duration-200 bg-red-500/10 border-red-400/20 hover:bg-red-500/20"
            >
              <span className="text-white/90">{item.text}</span>
              <button
                onClick={() => removeFromList(item.id)}
                className="p-1 text-red-400 rounded-full transition-all duration-200 hover:bg-red-500/20"
                title="Remove item"
              >
                <FiTrash2 className="w-4 h-4" /> {/* Updated icon */}
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="flex gap-2">
        <input
          id="notToDoInput"
          type="text"
          placeholder="Add item to avoid..."
          className="flex-1 p-3 text-white rounded-lg border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          id="addNotToDoBtn"
          className="px-4 py-3 text-white bg-blue-600 rounded-lg transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Add Item"
          onClick={handleAddNotToDo}
        >
          <FiPlus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default NotToDoList;
