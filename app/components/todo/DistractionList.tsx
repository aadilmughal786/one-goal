// app/components/todo/DistractionList.tsx
'use client';

import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { FiClock, FiEdit, FiLoader, FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { RiAlarmWarningLine } from 'react-icons/ri';

import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { DistractionItem } from '@/types';
import { FaAnglesRight } from 'react-icons/fa6';

interface DistractionListProps {
  onEditDistraction: (item: DistractionItem) => void;
}

const DistractionListComponent: React.FC<DistractionListProps> = ({ onEditDistraction }) => {
  const appState = useGoalStore(state => state.appState);
  const addDistraction = useGoalStore(state => state.addDistraction);
  const updateDistraction = useGoalStore(state => state.updateDistraction);
  const deleteDistraction = useGoalStore(state => state.deleteDistraction);
  const showToast = useNotificationStore(state => state.showToast);
  const showConfirmation = useNotificationStore(state => state.showConfirmation);

  const list = appState?.goals[appState.activeGoalId || '']?.notToDoList || [];

  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  const handleAddItem = useCallback(async () => {
    if (!inputValue.trim()) {
      showToast('Distraction title cannot be empty.', 'error');
      return;
    }
    setIsAdding(true);
    await addDistraction(inputValue.trim());
    setInputValue('');
    setIsAdding(false);
  }, [inputValue, addDistraction, showToast]);

  const formatDate = (timestamp: Timestamp | undefined): string => {
    if (!timestamp) return '...';
    return format(timestamp.toDate(), 'MMM d,yyyy');
  };

  const handleUpdateCount = async (id: string, currentCount: number, change: 1 | -1) => {
    const newCount = Math.max(0, currentCount + change);
    setIsUpdatingId(id);
    await updateDistraction(id, { count: newCount });
    setIsUpdatingId(null);
  };

  const handleDeleteConfirmation = (id: string, title: string) => {
    showConfirmation({
      title: 'Delete Distraction?',
      message: `Are you sure you want to permanently delete "${title}" from your "What Not To Do" list?`,
      action: async () => {
        setIsUpdatingId(id);
        await deleteDistraction(id);
        setIsUpdatingId(null);
      },
      actionDelayMs: 3000,
    });
  };

  const currentTheme = {
    bg: 'bg-red-500/10',
    border: 'border-red-400/20',
    hoverBg: 'hover:bg-red-500/20',
    icon: <RiAlarmWarningLine size={40} className="text-white/40" />,
    emptyText: 'No distractions defined yet.',
  };

  return (
    <>
      <div className="flex flex-col gap-2 mb-6 sm:flex-row">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleAddItem()}
          placeholder="Add a distraction to avoid..."
          className="flex-1 p-3 text-lg text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          disabled={isAdding}
          aria-label="Add new distraction"
        />
        <button
          onClick={handleAddItem}
          disabled={isAdding || !inputValue.trim()}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/90 disabled:opacity-60"
          aria-label="Add item"
        >
          {isAdding ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiPlus />}
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
          list.map(item => {
            const isUpdatingThis = isUpdatingId === item.id;
            return (
              <li
                key={item.id}
                className={`flex flex-col p-4 rounded-lg border transition-all duration-200 ${currentTheme.bg} ${currentTheme.border}`}
              >
                <div className="flex-grow">
                  <span
                    className="pr-4 text-lg font-medium break-words transition-colors cursor-pointer text-white/90 hover:text-blue-400"
                    onClick={() => !isUpdatingThis && onEditDistraction(item)}
                  >
                    {item.title}
                  </span>
                  {item.description && (
                    <p className="mt-1 text-sm text-white/60">{item.description}</p>
                  )}
                  {item.triggerPatterns &&
                    item.triggerPatterns.length > 0 &&
                    item.triggerPatterns.some(p => p.trim() !== '') && (
                      <div className="pt-3 mt-3 border-t border-white/10">
                        <h4 className="mb-2 text-xs font-semibold tracking-wider uppercase text-white/50">
                          Trigger Patterns
                        </h4>
                        <ul className="space-y-1">
                          {item.triggerPatterns.map((pattern, index) => (
                            <li
                              key={index}
                              className="flex  items-center gap-2.5 text-sm text-white/80"
                            >
                              <FaAnglesRight className="text-red-500" /> <span>{pattern}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-3 mt-3 border-t border-white/10">
                  <div className="flex gap-1 items-center text-xs text-white/50">
                    <FiClock size={12} />
                    <span>Created: {formatDate(item.createdAt)}</span>
                  </div>

                  <div className="flex gap-2 items-center">
                    <div className="flex gap-1 items-center p-1 rounded-full bg-black/20">
                      <button
                        onClick={() => handleUpdateCount(item.id, item.count, -1)}
                        className="p-1.5 rounded-full text-white/70 hover:bg-white/10 disabled:opacity-50 cursor-pointer"
                        disabled={isUpdatingThis}
                        aria-label="Decrease count"
                      >
                        <FiMinus size={16} />
                      </button>
                      <span className="w-8 font-mono text-lg font-semibold text-center text-red-400">
                        {isUpdatingThis ? (
                          <FiLoader className="inline-block animate-spin" />
                        ) : (
                          item.count
                        )}
                      </span>
                      <button
                        onClick={() => handleUpdateCount(item.id, item.count, 1)}
                        className="p-1.5 rounded-full text-white/70 hover:bg-white/10 disabled:opacity-50 cursor-pointer"
                        disabled={isUpdatingThis}
                        aria-label="Increase count"
                      >
                        <FiPlus size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => onEditDistraction(item)}
                      className="p-2 rounded-full transition-colors text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
                      aria-label="Edit item"
                      disabled={isUpdatingThis}
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteConfirmation(item.id, item.title)}
                      className="p-2 rounded-full transition-colors text-red-400/70 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                      aria-label="Delete item"
                      disabled={isUpdatingThis}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </>
  );
};

export default DistractionListComponent;
