// app/components/List.tsx
'use client';

import React, { useCallback, useState } from 'react';
import {
  FiPlus,
  FiTrash2,
  FiEdit,
  FiSave,
  FiBookOpen,
  FiClock,
  FiLoader,
  FiMinus,
} from 'react-icons/fi';
import { RiAlarmWarningLine } from 'react-icons/ri';
import { ListItem, DistractionItem } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

interface ListComponentProps {
  list: (ListItem | DistractionItem)[];
  addToList: (text: string) => void;
  removeFromList: (id: string) => void;
  updateItem: (id: string, updates: Partial<DistractionItem>) => void;
  placeholder: string;
  themeColor: 'red' | 'blue';
  editingItemId: string | null;
  setEditingItemId: (id: string | null) => void;
  editText: string;
  setEditText: (text: string) => void;
  isAdding: boolean;
  isUpdatingId: string | null;
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
  isAdding,
  isUpdatingId,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddItem = useCallback(() => {
    if (isAdding) return;
    addToList(inputValue);
    if (inputValue.trim()) {
      setInputValue('');
    }
  }, [inputValue, addToList, isAdding]);

  const formatDate = (timestamp: Timestamp): string => {
    if (!timestamp) return '...';
    return format(timestamp.toDate(), 'MMM d,yyyy');
  };

  const handleStartEditing = (item: ListItem) => {
    setEditingItemId(item.id);
    setEditText(item.text);
  };

  const handleUpdateItem = (id: string) => {
    updateItem(id, { text: editText });
  };

  const handleUpdateCount = (id: string, currentCount: number, change: 1 | -1) => {
    const newCount = Math.max(0, currentCount + change);
    updateItem(id, { count: newCount });
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
          disabled={isAdding}
        />
        <button
          onClick={handleAddItem}
          disabled={isAdding}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/90 hover:scale-105 active:scale-95 disabled:opacity-60"
        >
          {isAdding ? (
            <>
              <FiLoader className="w-5 h-5 animate-spin" />
              <span>Adding...</span>
            </>
          ) : (
            <>
              <FiPlus />
              <span>Add</span>
            </>
          )}
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
          list.map(item => {
            const isUpdating = isUpdatingId === item.id;
            const isThisItemBeingCounted = isUpdating && 'count' in (item as DistractionItem);

            return (
              <li
                key={item.id}
                className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg border transition-all duration-200 ${currentTheme.bg} ${currentTheme.border}`}
              >
                <div className="flex-grow mb-3 sm:mb-0">
                  {editingItemId === item.id ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleUpdateItem(item.id)}
                      autoFocus
                      disabled={isUpdating}
                      className="w-full text-lg text-white bg-transparent border-b-2 outline-none border-white/20 focus:border-blue-400 disabled:opacity-50"
                    />
                  ) : (
                    <>
                      <span className="text-lg text-white/90">{item.text}</span>
                      <div className="flex gap-1 items-center mt-1 text-xs text-white/50">
                        <FiClock size={12} />
                        <span>Created: {formatDate(item.createdAt)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2 items-center self-end sm:self-center">
                  {/* Counter UI for Distractions */}
                  {themeColor === 'red' && 'count' in item && (
                    <div className="flex gap-1 items-center p-1 rounded-full bg-black/20">
                      <button
                        onClick={() =>
                          handleUpdateCount(item.id, (item as DistractionItem).count, -1)
                        }
                        className="p-1.5 rounded-full text-white/70 hover:bg-white/10 disabled:opacity-50"
                        disabled={isUpdating}
                      >
                        <FiMinus size={16} />
                      </button>
                      <span className="w-8 font-mono text-lg font-semibold text-center text-red-400">
                        {isThisItemBeingCounted ? (
                          <FiLoader className="inline-block animate-spin" />
                        ) : (
                          (item as DistractionItem).count
                        )}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateCount(item.id, (item as DistractionItem).count, 1)
                        }
                        className="p-1.5 rounded-full text-white/70 hover:bg-white/10 disabled:opacity-50"
                        disabled={isUpdating}
                      >
                        <FiPlus size={16} />
                      </button>
                    </div>
                  )}

                  {editingItemId === item.id ? (
                    <button
                      onClick={() => handleUpdateItem(item.id)}
                      disabled={isUpdating}
                      className="p-2 text-green-400 rounded-full transition-colors cursor-pointer hover:bg-green-500/10 disabled:opacity-50"
                      aria-label="Save changes"
                    >
                      {isUpdating && !isThisItemBeingCounted ? (
                        <FiLoader className="animate-spin" />
                      ) : (
                        <FiSave />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartEditing(item)}
                      className="p-2 rounded-full transition-colors cursor-pointer text-white/60 hover:text-white hover:bg-white/10"
                      aria-label="Edit item"
                      disabled={isUpdating}
                    >
                      <FiEdit />
                    </button>
                  )}
                  <button
                    onClick={() => removeFromList(item.id)}
                    className="p-2 rounded-full transition-colors cursor-pointer text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                    aria-label="Delete item"
                    disabled={isUpdating}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </>
  );
};

export default ListComponent;
