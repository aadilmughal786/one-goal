// app/components/archive/ArchivedGoalModal.tsx
'use client';

import React from 'react';
import { ArchivedGoal, ListItem, TodoItem } from '@/types';
import { FiX, FiInfo, FiCheckSquare, FiBookOpen } from 'react-icons/fi';
import { RiAlarmWarningLine } from 'react-icons/ri';
import { format } from 'date-fns';
import Charts from '@/components/dashboard/Charts';

interface ArchivedGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  archivedGoal: ArchivedGoal | null;
}

// A helper component to render a list of items within the modal
const ArchivedList = ({
  title,
  items,
  icon,
  emptyText,
}: {
  title: string;
  items: (ListItem | TodoItem)[];
  icon: React.ReactNode;
  emptyText: string;
}) => (
  <div className="p-4 rounded-lg bg-black/20">
    <h4 className="flex gap-2 items-center mb-3 font-semibold text-white">
      {icon}
      {title}
    </h4>
    {items && items.length > 0 ? (
      <ul className="space-y-2 text-sm">
        {items.map((item, index) => (
          <li
            key={index}
            className={`flex items-start gap-2 ${'completed' in item && (item as TodoItem).completed ? 'text-green-400' : 'text-white/80'}`}
          >
            {'completed' in item && (
              <span className="mt-1">
                {(item as TodoItem).completed ? (
                  <FiCheckSquare className="text-green-500" />
                ) : (
                  <FiCheckSquare className="text-white/40" />
                )}
              </span>
            )}
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-white/50">{emptyText}</p>
    )}
  </div>
);

const ArchivedGoalModal: React.FC<ArchivedGoalModalProps> = ({ isOpen, onClose, archivedGoal }) => {
  if (!isOpen || !archivedGoal || !archivedGoal.goal) return null;

  const sortedToDoList = [...archivedGoal.toDoList].sort((a, b) => a.order - b.order);

  return (
    <div
      className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 justify-between items-center p-6 border-b border-white/10">
          <div className="flex gap-3 items-center">
            <FiInfo className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">{archivedGoal.goal.name}</h2>
              <p className="text-sm text-white/60">
                Archived on {format(archivedGoal.archivedAt.toDate(), 'd MMM, yyyy')}
              </p>
            </div>
          </div>
          <button
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-grow p-6 space-y-8">
          {archivedGoal.goal.description && (
            <div className="p-4 rounded-lg bg-black/20">
              <h4 className="font-semibold text-white">Goal Description</h4>
              <p className="mt-1 text-white/80">{archivedGoal.goal.description}</p>
            </div>
          )}

          {/* Lists Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ArchivedList
              title="To-Do List"
              items={sortedToDoList}
              icon={<FiCheckSquare className="text-blue-400" />}
              emptyText="No tasks were on this list."
            />
            <ArchivedList
              title="What Not To Do"
              items={archivedGoal.notToDoList}
              icon={<RiAlarmWarningLine className="text-red-400" />}
              emptyText="No distractions were listed."
            />
            <ArchivedList
              title="Contextual Notes"
              items={archivedGoal.contextList}
              icon={<FiBookOpen className="text-yellow-400" />}
              emptyText="No notes were saved."
            />
          </div>

          {/* Charts Section */}
          <Charts
            dailyProgress={Object.values(archivedGoal.dailyProgress)}
            goal={archivedGoal.goal}
          />
        </div>
      </div>
    </div>
  );
};

export default ArchivedGoalModal;
