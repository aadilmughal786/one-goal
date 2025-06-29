// app/components/archive/GoalSummaryModal.tsx
'use client';

import Charts from '@/components/dashboard/Charts'; // Assuming Charts component is correct
import { DistractionItem, Goal, GoalStatus, StickyNote, TodoItem } from '@/types'; // Import GoalStatus
import { format } from 'date-fns';
import React from 'react';
import { FiBookOpen, FiCheckSquare, FiInfo, FiX } from 'react-icons/fi';
import { RiAlarmWarningLine } from 'react-icons/ri';

// Removed local definition of ArchivedGoal based on user instruction.

interface GoalSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  // The goal object to summarize. Removed 'archivedAt' from this type union.
  goal: Goal | null;
}

/**
 * A helper component to render a list of items within the modal,
 * handling different types (TodoItem, DistractionItem, StickyNote).
 */
const ArchivedList = ({
  title,
  items,
  icon,
  emptyText,
}: {
  title: string;
  // Items can be TodoItem, DistractionItem, or StickyNote
  items: (TodoItem | DistractionItem | StickyNote)[];
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
        {items.map((item, index) => {
          // Determine the text to display based on the item's type
          let itemText = 'Unknown Item';
          if ('text' in item) {
            // Likely a TodoItem
            itemText = item.text;
          } else if ('title' in item) {
            // Likely a DistractionItem or StickyNote
            itemText = item.title;
            // For StickyNote, you might also want to show content snippet
            if ('content' in item && item.content) {
              itemText += `: ${item.content.substring(0, 50)}${item.content.length > 50 ? '...' : ''}`;
            }
          }

          // Check for 'completed' property, typically found on TodoItem
          const isCompleted = 'completed' in item && (item as TodoItem).completed;

          return (
            <li
              key={item.id || index} // Use item.id if available, fallback to index
              className={`flex items-start gap-2 ${isCompleted ? 'text-green-400' : 'text-white/80'}`}
            >
              {'completed' in item && ( // Only render checkbox if 'completed' property exists
                <span className="mt-1">
                  {isCompleted ? (
                    <FiCheckSquare className="text-green-500" />
                  ) : (
                    <FiCheckSquare className="text-white/40" />
                  )}
                </span>
              )}
              <span>{itemText}</span>
            </li>
          );
        })}
      </ul>
    ) : (
      <p className="text-sm text-white/50">{emptyText}</p>
    )}
  </div>
);

/**
 * GoalSummaryModal Component
 *
 * This modal displays detailed summary information about a completed goal,
 * including its description, associated lists (To-Do, Distractions, Sticky Notes),
 * and performance charts.
 */
const GoalSummaryModal: React.FC<GoalSummaryModalProps> = ({ isOpen, onClose, goal }) => {
  // Only render if the modal is open and a valid goal is provided.
  if (!isOpen || !goal) return null;

  // Sort the To-Do list for consistent display order.
  const sortedToDoList = [...goal.toDoList].sort((a, b) => a.order - b.order);

  return (
    <div
      className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
      onClick={onClose} // Close modal on outside click
      role="dialog" // ARIA role for dialog
      aria-modal="true" // ARIA attribute to indicate it's a modal dialog
      aria-labelledby="goal-summary-modal-title" // Link to modal title for accessibility
    >
      <div
        className="bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()} // Prevent clicks inside content from closing modal
      >
        {/* Header Section */}
        <div className="flex flex-shrink-0 justify-between items-center p-6 border-b border-white/10">
          <div className="flex gap-3 items-center">
            <FiInfo className="w-6 h-6 text-blue-400" />
            <div>
              <h2 id="goal-summary-modal-title" className="text-xl font-bold text-white">
                {goal.name}
              </h2>
              <p className="text-sm text-white/60">
                {
                  goal.status === GoalStatus.COMPLETED
                    ? `Completed on ${format(goal.endDate.toDate(), 'd MMM, yyyy')}` // Show endDate if completed
                    : `Target End: ${format(goal.endDate.toDate(), 'd MMM, yyyy')}` // Show target end date otherwise
                }
              </p>
            </div>
          </div>
          <button
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-grow p-6 space-y-8">
          {goal.description && ( // Display description if available
            <div className="p-4 rounded-lg bg-black/20">
              <h4 className="font-semibold text-white">Goal Description</h4>
              <p className="mt-1 text-white/80">{goal.description}</p>
            </div>
          )}

          {/* Lists Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ArchivedList
              title="To-Do List"
              items={sortedToDoList} // Pass sorted To-Do list
              icon={<FiCheckSquare className="text-blue-400" />}
              emptyText="No tasks were on this list."
            />
            <ArchivedList
              title="What Not To Do"
              items={goal.notToDoList} // Use notToDoList from goal
              icon={<RiAlarmWarningLine className="text-red-400" />}
              emptyText="No distractions were listed."
            />
            <ArchivedList
              title="Sticky Notes" // Updated title for Sticky Notes
              items={goal.stickyNotes} // Use stickyNotes from goal
              icon={<FiBookOpen className="text-yellow-400" />}
              emptyText="No sticky notes were saved."
            />
          </div>

          {/* Charts Section */}
          {/* Ensure dailyProgress is passed correctly from the Goal structure */}
          <Charts
            dailyProgress={Object.values(goal.dailyProgress)} // Pass dailyProgress directly from goal
            goal={goal} // Pass the entire goal object
          />
        </div>
      </div>
    </div>
  );
};

export default GoalSummaryModal;
