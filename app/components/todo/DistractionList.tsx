// app/components/todo/DistractionList.tsx
'use client';

import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { FiClock, FiEdit, FiLoader, FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { RiAlarmWarningLine } from 'react-icons/ri';

import { useDistractionStore } from '@/store/useDistractionStore';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { DistractionItem } from '@/types';
import { FaAngleRight, FaAnglesRight, FaCircle } from 'react-icons/fa6';

interface DistractionListProps {
  onEditDistraction: (item: DistractionItem) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const DistractionListComponent: React.FC<DistractionListProps> = ({
  onEditDistraction,
  inputRef,
}) => {
  const { appState } = useGoalStore();
  const { addDistraction, updateDistraction, deleteDistraction } = useDistractionStore();
  const { showToast, showConfirmation } = useNotificationStore();

  const list = appState?.goals[appState.activeGoalId || '']?.notToDoList || [];

  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [expandedPatterns, setExpandedPatterns] = useState<Record<string, boolean>>({});

  const getDistractionStatus = (count: number) => {
    if (count === 0) {
      return {
        text: 'Excellent',
        textColor: 'text-green-400',
        bgColor: 'bg-green-500/10',
        tooltip: "Great job! You've successfully avoided this distraction.",
      };
    }
    if (count <= 10) {
      return {
        text: 'Good',
        textColor: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        tooltip: "You're doing well. Keep up the effort to reduce this further.",
      };
    }
    if (count <= 20) {
      return {
        text: 'Moderate',
        textColor: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        tooltip: "This is a frequent distraction. Let's focus on identifying the triggers.",
      };
    }
    return {
      text: 'High',
      textColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
      tooltip:
        'This is a significant challenge. Consider breaking it down or seeking new strategies to manage it.',
    };
  };

  const togglePatterns = (id: string) => {
    setExpandedPatterns(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
    icon: <RiAlarmWarningLine size={40} className="text-text-muted" />,
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
          className="flex-1 p-3 text-lg rounded-md border text-text-primary border-border-primary bg-bg-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-border-accent"
          disabled={isAdding}
          aria-label="Add new distraction"
          ref={inputRef}
        />
        <button
          onClick={handleAddItem}
          disabled={isAdding || !inputValue.trim()}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold rounded-lg transition-all duration-200 cursor-pointer text-bg-primary bg-text-primary hover:opacity-90 disabled:opacity-60"
          aria-label="Add item"
        >
          {isAdding ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiPlus />}
          <span>Add</span>
        </button>
      </div>

      <ul className="space-y-3">
        {list.length === 0 ? (
          <li className="p-8 text-center rounded-md text-text-muted">
            <div className="flex flex-col gap-3 justify-center items-center">
              {currentTheme.icon}
              <p className="text-lg">{currentTheme.emptyText}</p>
              <p>Add an item above to get started!</p>
            </div>
          </li>
        ) : (
          list.map(item => {
            const isUpdatingThis = isUpdatingId === item.id;
            const status = getDistractionStatus(item.count);

            return (
              <li
                key={item.id}
                className={`flex flex-col p-4 rounded-lg border transition-all duration-200 bg-bg-secondary border-border-primary`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`flex-grow pr-4 text-lg font-medium break-words transition-colors cursor-pointer text-text-primary hover:text-blue-400`}
                    onClick={() => !isUpdatingThis && onEditDistraction(item)}
                  >
                    {item.title}
                  </span>
                  <div className="flex flex-shrink-0 gap-1 items-center">
                    {/* Status Chip with Tooltip */}
                    <div className="inline-block relative group">
                      <div
                        className={`flex items-center gap-2 px-2 py-1 rounded-full ${status.bgColor} cursor-pointer`}
                      >
                        <FaCircle className={`w-2 h-2 ${status.textColor}`} />
                        <span className={`text-xs font-semibold ${status.textColor}`}>
                          {status.text}
                        </span>
                      </div>
                      <div className="absolute bottom-full left-1/2 z-10 px-3 py-2 mb-2 w-max max-w-xs text-sm font-medium rounded-lg border shadow-sm opacity-0 transition-opacity duration-300 -translate-x-1/2 group-hover:opacity-100 bg-bg-primary border-border-primary text-text-primary">
                        {status.tooltip}
                        <div className="absolute bottom-0 left-1/2 w-3 h-3 border-r border-b rotate-45 -translate-x-1/2 translate-y-1/2 bg-bg-primary border-border-primary"></div>
                      </div>
                    </div>
                    <button
                      onClick={() => onEditDistraction(item)}
                      className="p-2 rounded-full transition-colors cursor-pointer text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary"
                      aria-label="Edit item"
                      disabled={isUpdatingThis}
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteConfirmation(item.id, item.title)}
                      className="p-2 rounded-full transition-colors cursor-pointer text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                      aria-label="Delete item"
                      disabled={isUpdatingThis}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                {item.description && (
                  <p className="mt-3 mb-2 text-sm text-text-secondary">{item.description}</p>
                )}
                {item.triggerPatterns &&
                  item.triggerPatterns.length > 0 &&
                  item.triggerPatterns.some(p => p.trim() !== '') && (
                    <div className="mt-3">
                      <button
                        onClick={() => togglePatterns(item.id)}
                        className="flex items-center py-2 w-full text-xs font-semibold tracking-wider uppercase cursor-pointer text-text-muted"
                      >
                        <span>Trigger Patterns</span>
                        <span
                          className={`transition-transform duration-300 ml-2 ${expandedPatterns[item.id] ? 'rotate-90' : ''}`}
                        >
                          <FaAngleRight />
                        </span>
                      </button>
                      {expandedPatterns[item.id] && (
                        <div className="pb-2 pl-1">
                          <ul className="space-y-1">
                            {item.triggerPatterns.map((pattern, index) => (
                              <li
                                key={index}
                                className="flex items-center gap-2.5 text-sm text-text-secondary animate-fade-in-down"
                              >
                                <FaAnglesRight className="text-red-500" /> <span>{pattern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                <div className="flex justify-between items-center px-4 pt-3 -mx-4 mt-3 border-t border-border-secondary">
                  <div className="flex gap-1 items-center text-xs text-text-tertiary">
                    <FiClock size={12} />
                    <span>Created: {formatDate(item.createdAt)}</span>
                  </div>

                  <div className="flex gap-2 items-center">
                    <div className="flex gap-1 items-center p-1 rounded-full bg-bg-tertiary">
                      <button
                        onClick={() => handleUpdateCount(item.id, item.count, -1)}
                        className="p-1.5 rounded-full text-text-secondary hover:bg-border-primary disabled:opacity-50 cursor-pointer"
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
                        className="p-1.5 rounded-full text-text-secondary hover:bg-border-primary disabled:opacity-50 cursor-pointer"
                        disabled={isUpdatingThis}
                        aria-label="Increase count"
                      >
                        <FiPlus size={16} />
                      </button>
                    </div>
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
