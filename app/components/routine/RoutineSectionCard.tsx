// app/components/routine/RoutineSectionCard.tsx
'use client';

import { ScheduledRoutineBase } from '@/types'; // Ensure correct import of ScheduledRoutineBase
import { differenceInMinutes, isPast, parse } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import { FiEdit } from 'react-icons/fi'; // Added FiEdit for a potential edit button
import {
  MdCheckCircle,
  MdDeleteForever,
  MdOutlineNotificationsActive,
  MdOutlineSettings,
} from 'react-icons/md';
import ScheduleEditModal from './ScheduleEditModal'; // Import the new modal
// NEW: Import useNotificationStore to use showToast

interface RoutineSectionCardProps {
  sectionTitle: string;
  summaryCount: string;
  summaryLabel: string;
  progressPercentage: number;

  listTitle: string;
  listEmptyMessage: string;
  schedules: ScheduledRoutineBase[];
  onToggleCompletion: (index: number) => void;
  onRemoveSchedule: (index: number) => void;
  // This new prop will handle both adding and updating schedules
  onSaveSchedule: (schedule: ScheduledRoutineBase, index: number | null) => Promise<void>;
  // REMOVED: showToast prop is no longer needed
  // showToast: (text: string, type: 'success' | 'error' | 'info') => void;

  newInputLabelPlaceholder: string;
  newIconOptions: string[];
  iconComponentsMap: { [key: string]: React.ElementType };
}

const RoutineSectionCard: React.FC<RoutineSectionCardProps> = ({
  sectionTitle,
  summaryCount,
  summaryLabel,
  progressPercentage,
  listTitle,
  listEmptyMessage,
  schedules,
  onToggleCompletion,
  onRemoveSchedule,
  onSaveSchedule,
  // REMOVED: showToast from destructuring (it's now accessed directly from store)
  newInputLabelPlaceholder,
  newIconOptions,
  iconComponentsMap,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<ScheduledRoutineBase | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Effect to update current time every second for real-time calculation of "time remaining" etc.
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer); // Cleanup timer on component unmount
  }, []);

  // --- REFACTORED LOGIC for sorting and annotating schedules ---

  // Sort schedules by their 'time' property (HH:mm format) once.
  // This memoization ensures sorting only re-runs if the `schedules` array itself changes.
  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => {
      // Parse 'HH:mm' strings into Date objects for comparison.
      // The `new Date()` argument provides a reference date (today), only time matters here.
      const timeA = parse(a.time, 'HH:mm', new Date()); // Use 'a.time'
      const timeB = parse(b.time, 'HH:mm', new Date()); // Use 'b.time'
      return timeA.getTime() - timeB.getTime();
    });
  }, [schedules]);

  // Find the next upcoming schedule based on the current time.
  // Memoized to re-run only when `sortedSchedules` or `currentTime` changes.
  const nextUpcomingSchedule = useMemo(() => {
    const now = currentTime;
    return sortedSchedules.find(schedule => {
      if (schedule.completed) return false; // Completed schedules are not "upcoming"
      // Combine today's date with the schedule's time for a comparable DateTime object.
      const targetDateTime = parse(schedule.time, 'HH:mm', now); // Use 'schedule.time'
      return !isPast(targetDateTime); // Check if the scheduled time is in the future or current
    });
  }, [sortedSchedules, currentTime]);

  // Annotate schedules with display information like 'timeLeftText' and 'isNext'.
  // This runs when `sortedSchedules`, `nextUpcomingSchedule`, or `currentTime` changes.
  const annotatedSchedules = useMemo(() => {
    const now = currentTime;
    return sortedSchedules.map(schedule => {
      const targetDateTime = parse(schedule.time, 'HH:mm', now); // Use 'schedule.time'
      let timeLeftText = '';

      if (schedule.completed) {
        timeLeftText = 'Completed Today';
      } else if (isPast(targetDateTime)) {
        // If scheduled time is in the past
        const minutesAgo = differenceInMinutes(now, targetDateTime);
        // Check if it's currently "in progress" based on its duration
        if (minutesAgo < schedule.duration) {
          // Use 'schedule.duration'
          timeLeftText = 'In Progress';
        } else {
          timeLeftText = 'Missed';
        }
      } else {
        // If scheduled time is in the future
        const minutesUntil = differenceInMinutes(targetDateTime, now);
        const hours = Math.floor(minutesUntil / 60);
        const minutes = minutesUntil % 60;
        timeLeftText = `${hours > 0 ? `${hours}h ` : ''}${minutes}m remaining`;
      }

      return {
        ...schedule,
        isNext: schedule.id === nextUpcomingSchedule?.id, // Compare by ID for robustness
        timeLeftText,
      };
    });
  }, [sortedSchedules, nextUpcomingSchedule, currentTime]);

  // --- End of Refactored Logic ---

  // Opens the modal for adding a new schedule (no existing schedule passed).
  const handleOpenModalForAdd = () => {
    setScheduleToEdit(null); // No schedule to edit means adding new
    setEditingIndex(null); // No specific index for a new item initially
    setIsEditModalOpen(true);
  };

  // Opens the modal for editing an existing schedule.
  // Sets the schedule object and its original index for `onSaveSchedule` to handle updates.
  const handleOpenModalForEdit = (schedule: ScheduledRoutineBase, index: number) => {
    setScheduleToEdit(schedule);
    setEditingIndex(index);
    setIsEditModalOpen(true);
  };

  // Determine the main icon for the section header. Uses the first icon option as default.
  const MainIconComponent = iconComponentsMap[newIconOptions[0]] || MdOutlineSettings;

  return (
    <>
      <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
        {/* Section Header */}
        <h2 className="flex gap-3 items-center mb-6 text-2xl font-bold text-white">
          <MainIconComponent size={28} />
          {sectionTitle}
        </h2>

        {/* Summary (e.g., "5/7 completed", "3000ml / 2000ml") */}
        <div className="mb-6 text-center">
          <div className="text-4xl font-bold text-white">{summaryCount}</div>
          <div className="text-sm opacity-75 text-white/70">{summaryLabel}</div>
        </div>
        {/* Progress Bar */}
        <div className="mb-8 h-3 rounded-full bg-white/20">
          <div
            className="h-3 bg-white rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }} // Dynamic width based on progress
          ></div>
        </div>

        {/* List Display Section */}
        <div className="mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-white">{listTitle}</h3>
            <button
              onClick={handleOpenModalForAdd}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors bg-white/10 hover:bg-white/20"
              aria-label={`Add new ${sectionTitle.toLowerCase()} routine`}
            >
              Add New
            </button>
          </div>
          {annotatedSchedules.length === 0 ? (
            <p className="py-8 text-center text-white/50">{listEmptyMessage}</p>
          ) : (
            <div className="space-y-3">
              {annotatedSchedules.map((schedule, index) => {
                const ScheduleIconComponent = iconComponentsMap[schedule.icon] || MdOutlineSettings;
                return (
                  <div
                    // Use schedule.id as the key for better list performance and stability
                    key={schedule.id}
                    className={`bg-white/5 rounded-xl p-4 shadow-lg border-2 transition-all border-white/10
                      ${schedule.isNext ? 'border-blue-400' : ''}
                      ${schedule.completed ? 'bg-green-500/10 border-green-500/30' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-1 gap-4 items-center">
                        <div
                          className={`flex items-center justify-center w-12 h-12 rounded-lg transition-colors cursor-pointer ${
                            schedule.completed
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}
                          onClick={() => onToggleCompletion(index)} // Toggle completion for this schedule
                          aria-label={
                            schedule.completed
                              ? `Mark ${schedule.label} as incomplete`
                              : `Mark ${schedule.label} as complete`
                          }
                        >
                          {schedule.completed ? (
                            <MdCheckCircle size={28} /> // Check icon if completed
                          ) : (
                            <ScheduleIconComponent size={28} /> // Custom icon if not completed
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{schedule.label}</h3>
                          <div className="text-sm text-white/70">
                            {schedule.time} for {schedule.duration} min{' '}
                            {/* Use schedule.time and schedule.duration */}
                          </div>
                          <div
                            className={`text-sm font-semibold ${schedule.isNext ? 'text-blue-300' : schedule.completed ? 'text-green-400' : 'text-white/50'}`}
                          >
                            {schedule.timeLeftText}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 items-center">
                        {schedule.isNext && !schedule.completed && (
                          <div className="animate-ping" aria-label="Upcoming notification">
                            <MdOutlineNotificationsActive size={20} className="text-orange-400" />
                          </div>
                        )}
                        <button
                          onClick={() => handleOpenModalForEdit(schedule, index)}
                          className="p-2 rounded-full transition-colors text-white/60 hover:bg-white/10"
                          aria-label={`Edit ${schedule.label}`}
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => onRemoveSchedule(index)}
                          className="p-2 rounded-full transition-colors text-red-400/70 hover:bg-red-500/10"
                          aria-label={`Delete ${schedule.label}`}
                        >
                          <MdDeleteForever size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Edit Modal */}
      <ScheduleEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        scheduleToEdit={scheduleToEdit}
        originalIndex={editingIndex}
        onSave={onSaveSchedule}
        // REMOVED: showToast prop is no longer needed, ScheduleEditModal gets it directly
        newInputLabelPlaceholder={newInputLabelPlaceholder}
        newIconOptions={newIconOptions}
        iconComponentsMap={iconComponentsMap}
        buttonLabel={scheduleToEdit ? 'Save Changes' : 'Add & Save Schedule'}
      />
    </>
  );
};

export default RoutineSectionCard;
