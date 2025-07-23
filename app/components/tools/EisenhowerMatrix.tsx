// app/components/tools/EisenhowerMatrix.tsx
'use client';

import React, { JSX, useEffect, useRef, useState } from 'react';
import { FiChevronDown, FiLoader, FiPlus, FiTrash2 } from 'react-icons/fi';

interface Task {
  id: number;
  text: string;
}

type Quadrant =
  | 'important_urgent'
  | 'important_not_urgent'
  | 'not_important_urgent'
  | 'not_important_not_urgent';

const quadrantOptions: { id: Quadrant; label: string }[] = [
  { id: 'important_urgent', label: 'Important & Urgent' },
  { id: 'important_not_urgent', label: 'Important & Not Urgent' },
  { id: 'not_important_urgent', label: 'Not Important & Urgent' },
  { id: 'not_important_not_urgent', label: 'Not Important & Not Urgent' },
];

interface QuadrantBoxProps {
  title: string;
  quadrant: Quadrant;
  bgColor: string;
  tasks: Task[];
  selectedTaskForMove: { taskId: number; sourceQuadrant: Quadrant } | null;
  handleTaskClick: (taskId: number, sourceQuadrant: Quadrant) => void;
  handleQuadrantClick: (targetQuadrant: Quadrant) => void;
  deleteTask: (quadrant: Quadrant, taskId: number) => void;
}

const QuadrantBox: React.FC<QuadrantBoxProps> = ({
  title,
  quadrant,
  bgColor,
  tasks,
  selectedTaskForMove,
  handleTaskClick,
  handleQuadrantClick,
  deleteTask,
}): JSX.Element => {
  const isTargetQuadrant = selectedTaskForMove && selectedTaskForMove.sourceQuadrant !== quadrant;

  return (
    <div
      className={`p-4 rounded-lg ${bgColor} border ${isTargetQuadrant ? 'border-blue-500 ring-2 ring-blue-500 cursor-pointer' : 'border-border-primary'} min-h-[150px] transition-all duration-200`}
      onClick={() => handleQuadrantClick(quadrant)}
    >
      <h3 className="mb-2 text-lg font-bold text-text-primary">{title}</h3>
      <div className="space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`flex items-center justify-between bg-bg-primary p-2 rounded-md shadow-sm cursor-pointer ${selectedTaskForMove?.taskId === task.id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={e => {
              e.stopPropagation(); // Prevent quadrant click from firing
              handleTaskClick(task.id, quadrant);
            }}
          >
            <span className="text-text-secondary">{task.text}</span>
            <button
              onClick={() => deleteTask(quadrant, task.id)}
              className="text-red-500 cursor-pointer hover:text-red-700"
            >
              <FiTrash2 />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const EisenhowerMatrix: React.FC = (): JSX.Element => {
  const [tasks, setTasks] = useState<Record<Quadrant, Task[]>>({
    important_urgent: [],
    important_not_urgent: [],
    not_important_urgent: [],
    not_important_not_urgent: [],
  });
  const [newTask, setNewTask] = useState('');
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant>('important_urgent');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Click-to-move State
  const [selectedTaskForMove, setSelectedTaskForMove] = useState<{
    taskId: number;
    sourceQuadrant: Quadrant;
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTask = async () => {
    if (newTask.trim() === '') return;
    setIsAdding(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    const newId = Date.now();
    setTasks(prev => ({
      ...prev,
      [selectedQuadrant]: [...prev[selectedQuadrant], { id: newId, text: newTask }],
    }));
    setNewTask('');
    setIsAdding(false);
  };

  const deleteTask = (quadrant: Quadrant, taskId: number) => {
    setTasks(prev => ({
      ...prev,
      [quadrant]: prev[quadrant].filter(task => task.id !== taskId),
    }));
  };

  const handleTaskClick = (taskId: number, sourceQuadrant: Quadrant) => {
    if (selectedTaskForMove && selectedTaskForMove.taskId === taskId) {
      // Deselect if clicking the same task again
      setSelectedTaskForMove(null);
    } else {
      setSelectedTaskForMove({ taskId, sourceQuadrant });
    }
  };

  const handleQuadrantClick = (targetQuadrant: Quadrant) => {
    if (!selectedTaskForMove) return; // No task selected to move

    const { taskId, sourceQuadrant } = selectedTaskForMove;

    if (sourceQuadrant === targetQuadrant) {
      setSelectedTaskForMove(null); // Deselect if clicked on the same quadrant
      return;
    }

    setTasks(prevTasks => {
      const newTasks = { ...prevTasks };

      // Remove from source
      newTasks[sourceQuadrant] = newTasks[sourceQuadrant].filter(task => task.id !== taskId);

      // Add to target
      const taskToMove = prevTasks[sourceQuadrant].find(task => task.id === taskId);
      if (taskToMove) {
        newTasks[targetQuadrant] = [...newTasks[targetQuadrant], taskToMove];
      }
      return newTasks;
    });
    setSelectedTaskForMove(null); // Clear selection after move
  };

  return (
    <div className="p-4 rounded-lg bg-bg-primary text-text-primary">
      <h2 className="mb-2 text-2xl font-bold text-center">Eisenhower Matrix</h2>
      <p className="mb-6 text-center text-text-secondary">
        Prioritize your tasks based on urgency and importance.
      </p>

      <div className="flex flex-col gap-4 mb-6">
        <input
          type="text"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="Enter a new task"
          className="p-3 w-full rounded-md border text-text-primary border-border-primary bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-border-accent"
        />
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-grow" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex justify-between items-center px-4 py-3 w-full text-lg text-left rounded-md border cursor-pointer text-text-primary bg-bg-secondary border-border-primary focus:outline-none focus:ring-2 focus:ring-border-accent"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              <span>{quadrantOptions.find(q => q.id === selectedQuadrant)?.label}</span>
              <FiChevronDown
                className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isDropdownOpen && (
              <div
                className="absolute z-10 p-2 mt-2 w-full rounded-md border shadow-lg bg-bg-primary border-border-primary"
                role="listbox"
              >
                {quadrantOptions.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSelectedQuadrant(option.id);
                      setIsDropdownOpen(false);
                    }}
                    className="flex gap-3 items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                    role="option"
                    aria-selected={selectedQuadrant === option.id}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={addTask}
            className="inline-flex justify-center items-center px-6 py-3 font-semibold rounded-lg cursor-pointer text-bg-primary bg-text-primary hover:opacity-90 disabled:opacity-60"
            disabled={isAdding}
          >
            {isAdding ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiPlus />}
            <span>{isAdding ? 'Adding...' : 'Add'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <QuadrantBox
          title="Do"
          quadrant="important_urgent"
          bgColor="bg-red-500/10"
          tasks={tasks.important_urgent}
          selectedTaskForMove={selectedTaskForMove}
          handleTaskClick={handleTaskClick}
          handleQuadrantClick={handleQuadrantClick}
          deleteTask={deleteTask}
        />
        <QuadrantBox
          title="Schedule"
          quadrant="important_not_urgent"
          bgColor="bg-blue-500/10"
          tasks={tasks.important_not_urgent}
          selectedTaskForMove={selectedTaskForMove}
          handleTaskClick={handleTaskClick}
          handleQuadrantClick={handleQuadrantClick}
          deleteTask={deleteTask}
        />
        <QuadrantBox
          title="Delegate"
          quadrant="not_important_urgent"
          bgColor="bg-yellow-500/10"
          tasks={tasks.not_important_urgent}
          selectedTaskForMove={selectedTaskForMove}
          handleTaskClick={handleTaskClick}
          handleQuadrantClick={handleQuadrantClick}
          deleteTask={deleteTask}
        />
        <QuadrantBox
          title="Eliminate"
          quadrant="not_important_not_urgent"
          bgColor="bg-green-500/10"
          tasks={tasks.not_important_not_urgent}
          selectedTaskForMove={selectedTaskForMove}
          handleTaskClick={handleTaskClick}
          handleQuadrantClick={handleQuadrantClick}
          deleteTask={deleteTask}
        />
      </div>
    </div>
  );
};

export default EisenhowerMatrix;
