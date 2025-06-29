// app/components/todo/TodoList.tsx
'use client';

import { TodoItem } from '@/types';
import { formatDate, formatRelativeTime, formatTime } from '@/utils/dateUtils';
import { Timestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { FiCalendar, FiCheck, FiClock, FiEdit, FiLoader, FiPlus, FiTrash2 } from 'react-icons/fi';

// --- REFACTOR: Import the global Zustand stores ---
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';

// --- REFACTOR: The props interface is simplified. ---
// It only needs a callback to open the edit modal, as that's a UI concern managed by the parent page.
interface TodoListProps {
  onEditTodo: (item: TodoItem) => void;
}

// --- SUB-COMPONENT FOR A SINGLE TODO ITEM ---
const TodoListItem: React.FC<{
  item: TodoItem;
  index: number;
  updatingTodoId: string | null;
  onToggleComplete: (id: string, completed: boolean) => void;
  onEditTodo: (item: TodoItem) => void;
  onDeleteTodo: (id: string) => void | Promise<void>;
  onDragStart: (e: React.DragEvent<HTMLLIElement>, index: number) => void;
  onDragEnter: (e: React.DragEvent<HTMLLIElement>, index: number) => void;
  onDragEnd: (e: React.DragEvent<HTMLLIElement>) => void;
  onDrop: () => void;
}> = ({
  item,
  index,
  updatingTodoId,
  onToggleComplete,
  onEditTodo,
  onDeleteTodo,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
}) => {
  const showConfirmation = useNotificationStore(state => state.showConfirmation);
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

  const handleDeleteClick = () => {
    showConfirmation({
      title: 'Delete Task?',
      message: `Are you sure you want to delete "${item.text}"? This action cannot be undone.`,
      action: () => onDeleteTodo(item.id),
      actionDelayMs: 3000,
    });
  };

  return (
    <li
      key={item.id}
      className={`relative flex flex-col p-4 rounded-lg border transition-all duration-300 ${item.completed ? 'bg-green-500/10 border-green-500/30' : 'bg-white/[0.03] border-white/10'} ${isUpdating ? '' : 'cursor-grab'}`}
      draggable={!isUpdating}
      onDragStart={e => onDragStart(e, index)}
      onDragEnter={e => onDragEnter(e, index)}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
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
              <span className={`flex gap-1 items-center`}>
                <FiCalendar size={12} /> Deadline: {formatDate(item.deadline)} at{' '}
                {formatTime(item.deadline)}
              </span>
              <span
                className={`flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 ${item.deadline.toDate() < now ? 'text-red-300' : 'text-green-300'}`}
              >
                <FiClock size={12} /> {formatRelativeTime(item.deadline)}
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
          <label className={`flex items-center group ${isUpdating ? '' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={e => onToggleComplete(item.id, e.target.checked)}
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
            className="p-2 rounded-full transition-colors text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Edit item details"
          >
            <FiEdit />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-2 rounded-full transition-colors text-red-400/70 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
            aria-label="Delete item"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
    </li>
  );
};

// --- MAIN TODO LIST COMPONENT ---
const TodoList: React.FC<TodoListProps> = ({ onEditTodo }) => {
  // --- REFACTOR: Get data and actions from stores ---
  // FIX: Select each piece of state or action individually to prevent infinite loops.
  const appState = useGoalStore(state => state.appState);
  const addTodo = useGoalStore(state => state.addTodo);
  const updateTodo = useGoalStore(state => state.updateTodo);
  const deleteTodo = useGoalStore(state => state.deleteTodo);
  const reorderTodos = useGoalStore(state => state.reorderTodos);
  const showToast = useNotificationStore(state => state.showToast);

  const activeGoal = appState?.goals[appState?.activeGoalId || ''];
  const toDoList = React.useMemo(
    () => (activeGoal?.toDoList || []).sort((a, b) => a.order - b.order),
    [activeGoal?.toDoList]
  );

  // --- Local UI State ---
  const [newTodoText, setNewTodoText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [updatingTodoId, setUpdatingTodoId] = useState<string | null>(null);
  const dragItem = React.useRef<number | null>(null);
  const dragOverItem = React.useRef<number | null>(null);

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
    )
      return;

    const newTodoList = [...toDoList];
    const [draggedItem] = newTodoList.splice(dragItem.current, 1);
    newTodoList.splice(dragOverItem.current, 0, draggedItem);

    const reorderedList = newTodoList.map((item, index) => ({ ...item, order: index }));
    await reorderTodos(reorderedList);

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleAddTodoLocal = async () => {
    if (!newTodoText.trim()) {
      showToast('Task cannot be empty.', 'error');
      return;
    }
    setIsAdding(true);
    await addTodo(newTodoText.trim());
    setNewTodoText('');
    setIsAdding(false);
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    setUpdatingTodoId(id);
    await updateTodo(id, { completed, completedAt: completed ? Timestamp.now() : null });
    setUpdatingTodoId(null);
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
          className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/90 disabled:opacity-60"
          disabled={isAdding}
        >
          {isAdding ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiPlus />}
          <span>{isAdding ? 'Adding...' : 'Add'}</span>
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
          toDoList.map((item, index) => (
            <TodoListItem
              key={item.id}
              item={item}
              index={index}
              updatingTodoId={updatingTodoId}
              onToggleComplete={handleToggleComplete}
              onEditTodo={onEditTodo}
              onDeleteTodo={deleteTodo}
              onDragStart={handleDragStart}
              onDragEnter={handleDragEnter}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
            />
          ))
        )}
      </ul>
    </div>
  );
};

export default TodoList;
