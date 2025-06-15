// app/components/todo/TodoList.tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { TodoItem } from '@/types';
import { FiCheck, FiTrash2, FiEdit, FiPlus, FiCalendar, FiClock } from 'react-icons/fi'; // FiMenu removed
import { Timestamp } from 'firebase/firestore';
import { format, formatDistanceToNowStrict, isPast, isToday, isTomorrow } from 'date-fns';

interface TodoListProps {
  toDoList: TodoItem[];
  onAddTodo: (text: string) => Promise<void>;
  onToggleComplete: (id: string, completed: boolean) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onUpdateTodoListOrder: (newOrder: TodoItem[]) => Promise<void>;
  onEditTodoItem: (item: TodoItem) => void; // Prop to open the modal
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

const TodoList: React.FC<TodoListProps> = ({
  toDoList,
  onAddTodo,
  onToggleComplete,
  onDeleteItem,
  onUpdateTodoListOrder,
  onEditTodoItem,
  showMessage,
}) => {
  const [newTodoText, setNewTodoText] = useState('');

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Helper to format Timestamp to a readable date string
  const formatDate = useCallback((timestamp: Timestamp | undefined): string => {
    if (!timestamp) return 'N/A';
    return format(timestamp.toDate(), 'MMM d, yyyy'); // Corrected format string for year
  }, []);

  // Helper to format Timestamp to a readable time string
  const formatTime = useCallback((timestamp: Timestamp | undefined): string => {
    if (!timestamp) return '';
    return format(timestamp.toDate(), 'h:mm a');
  }, []);

  // Helper to calculate time left until deadline
  const getTimeLeft = useCallback((deadline: Timestamp | undefined): string => {
    if (!deadline) return ''; // Should not be called if no deadline
    const date = deadline.toDate();
    if (isPast(date) && !isToday(date)) {
      return `Ended ${formatDistanceToNowStrict(date, { addSuffix: true })}`;
    }
    if (isToday(date)) return 'Due Today';
    if (isTomorrow(date)) return 'Due Tomorrow';
    return `Due in ${formatDistanceToNowStrict(date)}`;
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    dragItem.current = index;
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    dragOverItem.current = index;
    const target = e.currentTarget;
    if (target) {
      target.classList.add('border-blue-400');
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLIElement>) => {
    const target = e.currentTarget;
    if (target) {
      target.classList.remove('border-blue-400');
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    const listItems = document.querySelectorAll('.todo-item-draggable');
    listItems.forEach(item => {
      item.classList.remove('opacity-50', 'border-blue-400');
    });
  };

  const handleDrop = async (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    if (dragItem.current === null || dragOverItem.current === null) return;

    const draggedIndex = dragItem.current;
    const droppedAtIndex = dragOverItem.current;

    if (
      draggedIndex === droppedAtIndex ||
      droppedAtIndex < 0 ||
      droppedAtIndex >= toDoList.length
    ) {
      return;
    }

    const newTodoList = [...toDoList];
    const [draggedItem] = newTodoList.splice(draggedIndex, 1);
    newTodoList.splice(droppedAtIndex, 0, draggedItem);

    const reorderedListWithUpdatedOrders = newTodoList.map((item, index) => ({
      ...item,
      order: index,
      updatedAt: Timestamp.now(), // Update timestamp for all moved items
    }));

    await onUpdateTodoListOrder(reorderedListWithUpdatedOrders);
    showMessage('Task order updated.', 'info');

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
  };

  const handleAddTodoLocal = useCallback(async () => {
    if (!newTodoText.trim()) {
      showMessage('Task cannot be empty.', 'error');
      return;
    }
    await onAddTodo(newTodoText.trim());
    setNewTodoText('');
  }, [newTodoText, onAddTodo, showMessage]);

  return (
    <div className="p-8 mb-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300">
      <div className="flex flex-col gap-2 mb-6 sm:flex-row">
        <input
          type="text"
          value={newTodoText}
          onChange={e => setNewTodoText(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleAddTodoLocal()}
          placeholder="Add a new task..."
          className="flex-1 p-3 text-lg text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
        <button
          onClick={handleAddTodoLocal}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/90 hover:scale-105 active:scale-95"
        >
          <FiPlus />
          <span>Add</span>
        </button>
      </div>

      <ul className="space-y-3">
        {toDoList.length === 0 ? (
          <div className="flex flex-col gap-3 items-center p-8 text-center text-white/40">
            <FiCheck size={40} />
            <p className="text-lg">Your task list is empty.</p>
            <p>Add a task above to get started!</p>
          </div>
        ) : (
          toDoList.map((item, index) => {
            // Calculate progress for the bar
            const now = new Date();
            const createdAtDate = item.createdAt.toDate();
            const deadlineDate = item.deadline?.toDate();

            let progressPercent = 0;
            let showProgressBar = false;

            if (deadlineDate && createdAtDate) {
              // Ensure createdAtDate is also valid for duration calculation
              const totalDuration = deadlineDate.getTime() - createdAtDate.getTime();
              const elapsedDuration = now.getTime() - createdAtDate.getTime();

              if (totalDuration > 0) {
                progressPercent = (elapsedDuration / totalDuration) * 100;
              } else if (totalDuration <= 0 && isPast(deadlineDate)) {
                progressPercent = 100; // If deadline is past or invalid duration, show 100%
              }

              progressPercent = Math.max(0, Math.min(100, progressPercent)); // Clamp between 0 and 100
              showProgressBar = true;
            }

            return (
              <li
                key={item.id}
                className={`relative flex flex-col p-4 rounded-lg border transition-all duration-300 cursor-grab ${item.completed ? 'bg-green-500/10 border-green-500/30' : 'bg-white/[0.03] border-white/10'} todo-item-draggable`}
                draggable
                onDragStart={e => handleDragStart(e, index)}
                onDragEnter={e => handleDragEnter(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {/* Main Content Area */}
                <div className="flex flex-col flex-grow">
                  {/* Top Row: Title (Left) and Created Date (Right) */}
                  <div className="flex justify-between items-center mb-2">
                    {/* Removed drag handle from here */}
                    <span
                      className={`text-lg font-medium flex-grow break-words pr-4 ${item.completed ? 'line-through text-white/50' : 'text-white'}`}
                    >
                      {item.text}
                    </span>
                    <span className="flex flex-shrink-0 gap-1 items-center text-xs text-white/50">
                      <FiClock size={10} /> Created: {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {/* Optional Description */}
                  {item.description && item.description.trim() !== '' && (
                    <p className="mb-2 text-sm italic text-white/80">{item.description}</p>
                  )}

                  {/* Deadline & Time Left on one line, justified-between */}
                  {item.deadline && (
                    <div className="flex justify-between items-center mb-2 text-sm text-white/70">
                      {/* Deadline Display (normal text) */}
                      <span
                        className={`flex items-center gap-1 ${isPast(item.deadline.toDate()) && !isToday(item.deadline.toDate()) ? 'text-red-300' : 'text-blue-300'}`}
                      >
                        <FiCalendar size={12} /> Deadline: {formatDate(item.deadline)}{' '}
                        {formatTime(item.deadline)}
                      </span>

                      {/* Time Left (chip style) */}
                      <span
                        className={`flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 ${isPast(item.deadline.toDate()) && !isToday(item.deadline.toDate()) ? 'text-red-300' : 'text-green-300'}`}
                      >
                        <FiClock size={12} /> {getTimeLeft(item.deadline)}
                      </span>
                    </div>
                  )}

                  {/* Progress Bar (only if deadline exists) */}
                  {item.deadline && showProgressBar && (
                    <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-blue-400 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Footer Section with Checkbox, Drag Handle, and Action Buttons */}
                <div className="flex justify-between items-center px-4 pt-3 -mx-4 mt-3 border-t border-white/10">
                  {/* Left: Checkbox and Drag Handle */}
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={e => onToggleComplete(item.id, e.target.checked)}
                        className="sr-only"
                      />
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all duration-300 ${item.completed ? 'bg-green-500 border-green-500' : 'border-white/30 group-hover:border-white/50'}`}
                      >
                        {item.completed && <FiCheck className="w-4 h-4 text-white" />}
                      </span>
                      <span className="ml-2 text-sm text-white/70">
                        Mark as {item.completed ? 'Undone' : 'Done'}
                      </span>
                    </label>
                    {/* Drag handle button is removed, but the li is still draggable. */}
                  </div>

                  {/* Right: Edit and Delete Buttons */}
                  <div className="flex gap-1 items-center">
                    <button
                      onClick={() => onEditTodoItem(item)}
                      className="p-2 rounded-full transition-colors cursor-pointer text-white/60 hover:text-white hover:bg-white/10"
                      aria-label="Edit item details"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-2 rounded-full transition-colors cursor-pointer text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                      aria-label="Delete item"
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
    </div>
  );
};

export default TodoList;
