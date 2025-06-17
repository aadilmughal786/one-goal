// app/components/todo/TodoList.tsx
'use client';

import React, { useState, useRef } from 'react';
import { TodoItem } from '@/types';
import { FiCheck, FiTrash2, FiEdit, FiPlus, FiCalendar, FiClock, FiLoader } from 'react-icons/fi';
import { Timestamp } from 'firebase/firestore';
import { format, formatDistanceToNowStrict, isPast, isToday, isTomorrow } from 'date-fns';

interface TodoListProps {
  toDoList: TodoItem[];
  onAddTodo: (text: string) => Promise<void>;
  onUpdateTodo: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  onDeleteTodo: (id: string) => Promise<void>;
  onReorderTodos: (reorderedList: TodoItem[]) => Promise<void>;
  onEditTodo: (item: TodoItem) => void;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  isAdding: boolean;
}

const TodoList: React.FC<TodoListProps> = ({
  toDoList,
  onAddTodo,
  onUpdateTodo,
  onDeleteTodo,
  onReorderTodos,
  onEditTodo,
  showMessage,
  isAdding,
}) => {
  const [newTodoText, setNewTodoText] = useState('');
  const [updatingTodoId, setUpdatingTodoId] = useState<string | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const formatDate = (timestamp: Timestamp | null): string => {
    if (!timestamp) return 'N/A';
    return format(timestamp.toDate(), 'MMM d,yyyy');
  };

  const formatTime = (timestamp: Timestamp | null): string => {
    if (!timestamp) return '';
    return format(timestamp.toDate(), 'h:mm a');
  };

  const getTimeLeft = (deadline: Timestamp | null): string => {
    if (!deadline) return '';
    const date = deadline.toDate();
    if (isPast(date) && !isToday(date))
      return `Ended ${formatDistanceToNowStrict(date, { addSuffix: true })}`;
    if (isToday(date)) return 'Due Today';
    if (isTomorrow(date)) return 'Due Tomorrow';
    return `Due in ${formatDistanceToNowStrict(date)}`;
  };

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    dragItem.current = index;
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnter = (_e: React.DragEvent<HTMLLIElement>, index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDrop = async () => {
    if (
      dragItem.current === null ||
      dragOverItem.current === null ||
      dragItem.current === dragOverItem.current
    ) {
      return;
    }
    const newTodoList = [...toDoList];
    const [draggedItem] = newTodoList.splice(dragItem.current, 1);
    newTodoList.splice(dragOverItem.current, 0, draggedItem);
    const reorderedList = newTodoList.map((item, index) => ({ ...item, order: index }));
    await onReorderTodos(reorderedList);
    showMessage('Task order updated.', 'info');
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleAddTodoLocal = async () => {
    if (!newTodoText.trim()) {
      showMessage('Task cannot be empty.', 'error');
      return;
    }
    await onAddTodo(newTodoText.trim());
    setNewTodoText('');
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    setUpdatingTodoId(id);
    try {
      await onUpdateTodo(id, { completed, completedAt: completed ? Timestamp.now() : null });
    } finally {
      setUpdatingTodoId(null);
    }
  };

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
          disabled={isAdding}
        />
        <button
          onClick={handleAddTodoLocal}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/90 5 disabled:opacity-60"
          disabled={isAdding}
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
        {toDoList.length === 0 ? (
          <div className="flex flex-col gap-3 items-center p-8 text-center text-white/40">
            <FiCheck size={40} />
            <p className="text-lg">Your task list is empty.</p>
            <p>Add a task above to get started!</p>
          </div>
        ) : (
          toDoList.map((item, index) => {
            const now = new Date();
            const createdAtDate = item.createdAt.toDate();
            const deadlineDate = item.deadline?.toDate();
            let progressPercent = 0;
            const isUpdating = updatingTodoId === item.id;

            if (deadlineDate) {
              const totalDuration = deadlineDate.getTime() - createdAtDate.getTime();
              if (totalDuration > 0) {
                const elapsedDuration = now.getTime() - createdAtDate.getTime();
                progressPercent = Math.min(100, (elapsedDuration / totalDuration) * 100);
              } else {
                progressPercent = 100;
              }
            }

            return (
              <li
                key={item.id}
                className={`relative flex flex-col p-4 rounded-lg border transition-all duration-300 ${item.completed ? 'bg-green-500/10 border-green-500/30' : 'bg-white/[0.03] border-white/10'} ${isUpdating ? '' : 'cursor-grab'}`}
                draggable={!isUpdating}
                onDragStart={e => handleDragStart(e, index)}
                onDragEnter={e => handleDragEnter(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
              >
                <div className="flex flex-col flex-grow">
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className={`text-lg font-medium break-words pr-4 cursor-pointer hover:text-blue-400 transition-colors ${item.completed ? 'line-through text-white/50' : 'text-white'}`}
                      onClick={() => !isUpdating && onEditTodo(item)}
                    >
                      {item.text}
                    </span>
                    <span className="flex flex-shrink-0 gap-1 items-center text-xs text-white/50">
                      <FiClock size={10} /> Created: {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {item.description && item.description.trim() !== '' && (
                    <p className="mb-2 text-sm italic text-white/80">{item.description}</p>
                  )}

                  {item.deadline && !item.completed && (
                    <>
                      <div className="flex justify-between items-center mb-2 text-sm text-white/70">
                        <span
                          className={`flex items-center gap-1 ${isPast(item.deadline.toDate()) ? 'text-red-300' : 'text-blue-300'}`}
                        >
                          <FiCalendar size={12} /> Deadline: {formatDate(item.deadline)}
                          {' at '}
                          {formatTime(item.deadline)}
                        </span>
                        <span
                          className={`flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 ${isPast(item.deadline.toDate()) ? 'text-red-300' : 'text-green-300'}`}
                        >
                          <FiClock size={12} /> {getTimeLeft(item.deadline)}
                        </span>
                      </div>

                      <div className="w-full bg-white/10 rounded-full h-1.5 mt-3 mb-1 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full bg-blue-400 transition-all duration-500 ease-out"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center px-4 pt-3 -mx-4 mt-3 border-t border-white/10">
                  <div className="flex items-center">
                    <label
                      className={`flex items-center group ${isUpdating ? '' : 'cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={e => handleToggleComplete(item.id, e.target.checked)}
                        className="sr-only"
                        disabled={isUpdating}
                      />
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all duration-300 ${item.completed && !isUpdating ? 'bg-green-500 border-green-500' : 'border-white/30 bg-black/20 group-hover:border-white/50'}`}
                      >
                        {isUpdating ? (
                          <FiLoader className="w-4 h-4 text-white animate-spin" />
                        ) : item.completed ? (
                          <FiCheck className="w-4 h-4 text-white" />
                        ) : null}
                      </span>
                      <span className="ml-2 text-sm text-white/70">
                        Mark as {item.completed ? 'Undone' : 'Done'}
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-1 items-center">
                    <button
                      onClick={() => onEditTodo(item)}
                      className="p-2 rounded-full transition-colors cursor-pointer text-white/60 hover:text-white hover:bg-white/10"
                      aria-label="Edit item details"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => onDeleteTodo(item.id)}
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
