// app/components/todo/DistractionList.tsx
'use client';

import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { FiClock, FiEdit, FiLoader, FiMinus, FiPlus, FiSave, FiTrash2 } from 'react-icons/fi';
import { RiAlarmWarningLine } from 'react-icons/ri';

// --- REFACTOR: Import types and stores ---
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { DistractionItem } from '@/types';

// --- REFACTOR: The props interface is removed as it's no longer needed. ---

/**
 * DistractionListComponent: A component specifically for displaying and managing a list of Distraction Items.
 * It is now self-sufficient, getting all its data and actions from the global Zustand stores.
 */
const DistractionListComponent: React.FC = () => {
  // --- REFACTOR: Get data and actions from stores ---
  // FIX: Select each piece of state or action individually to prevent infinite loops.
  const appState = useGoalStore(state => state.appState);
  const addDistraction = useGoalStore(state => state.addDistraction);
  const updateDistraction = useGoalStore(state => state.updateDistraction);
  const deleteDistraction = useGoalStore(state => state.deleteDistraction);
  const showToast = useNotificationStore(state => state.showToast);
  const showConfirmation = useNotificationStore(state => state.showConfirmation);

  const list = appState?.goals[appState.activeGoalId || '']?.notToDoList || [];

  // --- Local UI State ---
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
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

  const handleStartEditing = (item: DistractionItem) => {
    setEditingItemId(item.id);
    setEditText(item.title);
  };

  const handleUpdateItem = async (id: string) => {
    if (!editText.trim()) {
      showToast('Distraction title cannot be empty.', 'error');
      return;
    }
    setIsUpdatingId(id);
    await updateDistraction(id, { title: editText.trim() });
    setEditingItemId(null);
    setEditText('');
    setIsUpdatingId(null);
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
            const isEditingThis = editingItemId === item.id;
            const isUpdatingThis = isUpdatingId === item.id;

            return (
              <li
                key={item.id}
                className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg border transition-all duration-200 ${currentTheme.bg} ${currentTheme.border}`}
              >
                <div className="flex-grow mb-3 sm:mb-0">
                  {isEditingThis ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleUpdateItem(item.id)}
                      autoFocus
                      disabled={isUpdatingThis}
                      className="w-full text-lg text-white bg-transparent border-b-2 outline-none border-white/20 focus:border-blue-400 disabled:opacity-50"
                      aria-label="Edit item text"
                    />
                  ) : (
                    <>
                      <span className="text-lg text-white/90">{item.title}</span>
                      <div className="flex gap-1 items-center mt-1 text-xs text-white/50">
                        <FiClock size={12} />
                        <span>Created: {formatDate(item.createdAt)}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-2 items-center self-end sm:self-center">
                  <div className="flex gap-1 items-center p-1 rounded-full bg-black/20">
                    <button
                      onClick={() => handleUpdateCount(item.id, item.count, -1)}
                      className="p-1.5 rounded-full text-white/70 hover:bg-white/10 disabled:opacity-50"
                      disabled={isUpdatingThis}
                      aria-label="Decrease count"
                    >
                      <FiMinus size={16} />
                    </button>
                    <span className="w-8 font-mono text-lg font-semibold text-center text-red-400">
                      {isUpdatingThis && 'count' in (item || {}) ? (
                        <FiLoader className="inline-block animate-spin" />
                      ) : (
                        item.count
                      )}
                    </span>
                    <button
                      onClick={() => handleUpdateCount(item.id, item.count, 1)}
                      className="p-1.5 rounded-full text-white/70 hover:bg-white/10 disabled:opacity-50"
                      disabled={isUpdatingThis}
                      aria-label="Increase count"
                    >
                      <FiPlus size={16} />
                    </button>
                  </div>
                  {isEditingThis ? (
                    <button
                      onClick={() => handleUpdateItem(item.id)}
                      disabled={isUpdatingThis || !editText.trim()}
                      className="p-2 text-green-400 rounded-full transition-colors cursor-pointer hover:bg-green-500/10 disabled:opacity-50"
                      aria-label="Save changes"
                    >
                      {isUpdatingThis ? <FiLoader className="animate-spin" /> : <FiSave />}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartEditing(item)}
                      className="p-2 rounded-full transition-colors cursor-pointer text-white/60 hover:text-white hover:bg-white/10"
                      aria-label="Edit item"
                      disabled={isUpdatingThis}
                    >
                      <FiEdit />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteConfirmation(item.id, item.title)}
                    className="p-2 rounded-full transition-colors cursor-pointer text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                    aria-label="Delete item"
                    disabled={isUpdatingThis}
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

export default DistractionListComponent;
