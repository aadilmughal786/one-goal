import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import { useGoalActionsStore } from '@/store/useGoalActionsStore';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { CatchingTheFrogTask } from '@/types';
import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiEdit, FiCheck, FiLoader } from 'react-icons/fi';
import { GiFrogPrince } from 'react-icons/gi';

const MAX_FROG_TASKS = 3;

const CatchingTheFrogSection: React.FC = () => {
  const { appState } = useGoalStore();
  const { addCatchingTheFrogTask, updateCatchingTheFrogTask, deleteCatchingTheFrogTask } =
    useGoalActionsStore();
  const { showToast } = useNotificationStore();

  const activeGoal = appState?.goals[appState.activeGoalId || ''];
  const frogTasks = activeGoal?.catchingTheFrogTasks || [];

  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleAddTask = async () => {
    if (!newTaskText.trim()) {
      showToast('Task cannot be empty.', 'error');
      return;
    }
    if (frogTasks.length >= MAX_FROG_TASKS) {
      showToast(`You can only have up to ${MAX_FROG_TASKS} tasks in this section.`, 'info');
      return;
    }
    setIsAdding(true);
    try {
      await addCatchingTheFrogTask(newTaskText.trim());
      setNewTaskText('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (task: CatchingTheFrogTask) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  };

  const handleSaveEdit = async (taskId: string) => {
    if (!editingText.trim()) {
      showToast('Task cannot be empty.', 'error');
      return;
    }
    setIsUpdating(taskId);
    try {
      await updateCatchingTheFrogTask(taskId, { text: editingText.trim() });
      setEditingTaskId(null);
      setEditingText('');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setIsUpdating(taskId);
    try {
      await deleteCatchingTheFrogTask(taskId);
    } finally {
      setIsUpdating(null);
    }
  };

  if (!activeGoal) {
    return <NoActiveGoalMessage />;
  }

  return (
    <div className="card">
      <h2 className="flex items-center gap-3 mb-6 text-2xl font-bold text-text-primary">
        <GiFrogPrince className="text-green-500" />
        Catching the Frog Section
      </h2>
      <p className="mb-4 text-text-secondary">
        List your 3 most important tasks for the day. Tackle them first!
      </p>

      <div className="flex flex-col gap-2 mb-6 sm:flex-row">
        <input
          type="text"
          value={newTaskText}
          onChange={e => setNewTaskText(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleAddTask()}
          placeholder="Add a frog task... (max 3)"
          className="flex-1 p-3 text-lg rounded-md border text-text-primary border-border-primary bg-bg-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-border-accent"
          disabled={isAdding || frogTasks.length >= MAX_FROG_TASKS}
        />
        <button
          onClick={handleAddTask}
          disabled={isAdding || !newTaskText.trim() || frogTasks.length >= MAX_FROG_TASKS}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold rounded-lg transition-all duration-200 cursor-pointer text-bg-primary bg-text-primary hover:opacity-90 disabled:opacity-60"
        >
          {isAdding ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiPlus />}
          <span>Add Task</span>
        </button>
      </div>

      <ul className="space-y-3">
        {frogTasks.length === 0 ? (
          <li className="p-8 text-center rounded-md text-text-muted">
            <GiFrogPrince className="mx-auto mb-4 text-4xl" />
            <p>No frog tasks for today. Add your most important tasks!</p>
          </li>
        ) : (
          frogTasks.map(task => (
            <li
              key={task.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-bg-secondary border-border-primary"
            >
              {editingTaskId === task.id ? (
                <input
                  type="text"
                  value={editingText}
                  onChange={e => setEditingText(e.target.value)}
                  onBlur={() => handleSaveEdit(task.id)}
                  onKeyPress={e => e.key === 'Enter' && handleSaveEdit(task.id)}
                  className="flex-1 p-2 text-lg bg-transparent border-b border-border-primary focus:outline-none focus:ring-0"
                  autoFocus
                  disabled={isUpdating === task.id}
                />
              ) : (
                <span className="flex-1 text-lg text-text-primary">{task.text}</span>
              )}

              <div className="flex gap-2 items-center">
                {editingTaskId === task.id ? (
                  <button
                    onClick={() => handleSaveEdit(task.id)}
                    disabled={isUpdating === task.id || !editingText.trim()}
                    className="p-2 rounded-full transition-colors cursor-pointer text-green-500 hover:bg-green-500/20 disabled:opacity-50"
                  >
                    {isUpdating === task.id ? (
                      <FiLoader className="w-5 h-5 animate-spin" />
                    ) : (
                      <FiCheck />
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartEdit(task)}
                    className="p-2 rounded-full transition-colors cursor-pointer text-text-secondary hover:bg-bg-tertiary"
                  >
                    <FiEdit />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  disabled={isUpdating === task.id}
                  className="p-2 rounded-full transition-colors cursor-pointer text-red-500 hover:bg-red-500/20 disabled:opacity-50"
                >
                  {isUpdating === task.id ? (
                    <FiLoader className="w-5 h-5 animate-spin" />
                  ) : (
                    <FiTrash2 />
                  )}
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default CatchingTheFrogSection;
