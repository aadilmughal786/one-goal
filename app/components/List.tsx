// app/components/List.tsx
'use client';

import React, { useCallback, useState } from 'react';
import { FiPlus, FiTrash2, FiEdit, FiSave, FiBookOpen } from 'react-icons/fi';
import { RiAlarmWarningLine } from 'react-icons/ri';
import { ListItem } from '@/types';

interface ListComponentProps {
  list: ListItem[];
  addToList: (text: string) => void;
  removeFromList: (id: number) => void;
  updateItem: (id: number, text: string) => void;
  placeholder: string;
  themeColor: 'red' | 'blue';

  // Props for managing editing state, passed from parent
  editingItemId: number | null;
  setEditingItemId: (id: number | null) => void;
  editText: string;
  setEditText: (text: string) => void;
}

const ListComponent: React.FC<ListComponentProps> = ({
  list,
  addToList,
  removeFromList,
  updateItem,
  placeholder,
  themeColor,
  editingItemId,
  setEditingItemId,
  editText,
  setEditText,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddItem = useCallback(() => {
    addToList(inputValue); // Parent will handle validation
    if (inputValue.trim()) {
      setInputValue('');
    }
  }, [inputValue, addToList]);

  const handleStartEditing = (item: ListItem) => {
    setEditingItemId(item.id);
    setEditText(item.text);
  };

  const handleUpdateItem = (id: number) => {
    updateItem(id, editText); // Parent will handle validation and state update
  };

  const themeClasses = {
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-400/20',
      hoverBg: 'hover:bg-red-500/20',
      icon: <RiAlarmWarningLine size={40} className="text-white/40" />,
      emptyText: 'No distractions defined yet.',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-400/20',
      hoverBg: 'hover:bg-blue-500/20',
      icon: <FiBookOpen size={40} className="text-white/40" />,
      emptyText: 'No notes or learnings recorded.',
    },
  };

  const currentTheme = themeClasses[themeColor];

  return (
    <>
      <div className="flex flex-col gap-2 mb-6 sm:flex-row">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleAddItem()}
          placeholder={placeholder}
          className="flex-1 p-3 text-lg text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
        <button
          onClick={handleAddItem}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/90 hover:scale-105 active:scale-95"
        >
          <FiPlus />
          <span>Add</span>
        </button>
      </div>

      <ul className="space-y-3">
        {list.length === 0 ? (
          <li className="p-8 text-center rounded-md text-white/40">
            <div className="flex flex-col gap-3 justify-center items-center">
              {currentTheme.icon}
              <p className="text-lg">{currentTheme.emptyText}</p>
              <p>Add an item above to get started!</p>
            </div>
          </li>
        ) : (
          list.map((item: ListItem) => (
            <li
              key={item.id}
              className={`flex justify-between items-center p-3 rounded-lg border transition-all duration-200 ${currentTheme.bg} ${currentTheme.border}`}
            >
              {editingItemId === item.id ? (
                <input
                  type="text"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleUpdateItem(item.id)}
                  onBlur={() => setEditingItemId(null)}
                  autoFocus
                  className="flex-1 text-lg text-white bg-transparent border-b outline-none border-white/20"
                />
              ) : (
                <span className="text-lg text-white/90">{item.text}</span>
              )}

              <div className="flex gap-2 items-center">
                {editingItemId === item.id ? (
                  <button
                    onClick={() => handleUpdateItem(item.id)}
                    className="p-2 text-green-400 rounded-full transition-colors cursor-pointer hover:bg-green-500/10"
                    aria-label="Save changes"
                  >
                    <FiSave />
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartEditing(item)}
                    className="p-2 rounded-full transition-colors cursor-pointer text-white/60 hover:text-white hover:bg-white/10"
                    aria-label="Edit item"
                  >
                    <FiEdit />
                  </button>
                )}
                <button
                  onClick={() => removeFromList(item.id)}
                  className="p-2 rounded-full transition-colors cursor-pointer text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                  aria-label="Delete item"
                >
                  <FiTrash2 />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </>
  );
};

export default ListComponent;
