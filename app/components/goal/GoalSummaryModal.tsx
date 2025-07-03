// app/components/goal/GoalSummaryModal.tsx
'use client';

import Charts from '@/components/dashboard/Charts';
import { DistractionItem, Goal, GoalStatus, StickyNote, TodoItem } from '@/types';
import { format } from 'date-fns';
import React from 'react';
import { FiBookOpen, FiCheckSquare, FiInfo, FiX } from 'react-icons/fi';
import { RiAlarmWarningLine } from 'react-icons/ri';

const ArchivedList = ({
  title,
  items,
  icon,
  emptyText,
}: {
  title: string;
  items: (TodoItem | DistractionItem | StickyNote)[];
  icon: React.ReactNode;
  emptyText: string;
}) => (
  <div className="p-4 rounded-lg bg-bg-tertiary">
    <h4 className="flex gap-2 items-center mb-3 font-semibold text-text-primary">
      {icon}
      {title}
    </h4>
    {items && items.length > 0 ? (
      <ul className="space-y-2 text-sm">
        {items.map((item, index) => {
          let itemText = 'Unknown Item';
          if ('text' in item) {
            itemText = item.text;
          } else if ('title' in item) {
            itemText = item.title;
            if ('content' in item && item.content) {
              itemText += `: ${item.content.substring(0, 50)}${item.content.length > 50 ? '...' : ''}`;
            }
          }

          const isCompleted = 'completed' in item && (item as TodoItem).completed;

          return (
            <li
              key={item.id || index}
              className={`flex items-start gap-2 ${isCompleted ? 'text-green-400' : 'text-text-secondary'}`}
            >
              {'completed' in item && (
                <span className="mt-1">
                  {isCompleted ? (
                    <FiCheckSquare className="text-green-500" />
                  ) : (
                    <FiCheckSquare className="text-text-muted" />
                  )}
                </span>
              )}
              <span>{itemText}</span>
            </li>
          );
        })}
      </ul>
    ) : (
      <p className="text-sm text-text-muted">{emptyText}</p>
    )}
  </div>
);

const GoalSummaryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
}> = ({ isOpen, onClose, goal }) => {
  if (!isOpen || !goal) return null;

  const sortedToDoList = [...goal.toDoList].sort((a, b) => a.order - b.order);

  return (
    <div
      className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-summary-modal-title"
    >
      <div
        className="bg-bg-secondary backdrop-blur-md border border-border-primary rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 justify-between items-center p-6 border-b border-border-primary">
          <div className="flex gap-3 items-center">
            <FiInfo className="w-6 h-6 text-blue-400" />
            <div>
              <h2 id="goal-summary-modal-title" className="text-xl font-bold text-text-primary">
                {goal.name}
              </h2>
              <p className="text-sm text-text-secondary">
                {goal.status === GoalStatus.COMPLETED
                  ? `Completed on ${format(goal.endDate.toDate(), 'd MMM, yyyy')}`
                  : `Target End: ${format(goal.endDate.toDate(), 'd MMM, yyyy')}`}
              </p>
            </div>
          </div>
          <button
            className="p-1.5 rounded-full text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary cursor-pointer"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-grow p-6 space-y-8">
          {goal.description && (
            <div className="p-4 rounded-lg bg-bg-tertiary">
              <h4 className="font-semibold text-text-primary">Goal Description</h4>
              <p className="mt-1 text-text-secondary">{goal.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ArchivedList
              title="To-Do List"
              items={sortedToDoList}
              icon={<FiCheckSquare className="text-blue-400" />}
              emptyText="No tasks were on this list."
            />
            <ArchivedList
              title="What Not To Do"
              items={goal.notToDoList}
              icon={<RiAlarmWarningLine className="text-red-400" />}
              emptyText="No distractions were listed."
            />
            <ArchivedList
              title="Sticky Notes"
              items={goal.stickyNotes}
              icon={<FiBookOpen className="text-yellow-400" />}
              emptyText="No sticky notes were saved."
            />
          </div>

          <Charts dailyProgress={Object.values(goal.dailyProgress)} goal={goal} />
        </div>
      </div>
    </div>
  );
};

export default GoalSummaryModal;
