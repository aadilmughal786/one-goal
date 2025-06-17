// app/components/routine/RoutineSectionCard.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  MdOutlineSettings,
  MdOutlineNotificationsActive,
  MdDeleteForever,
  MdCheckCircle,
} from 'react-icons/md';
import { ScheduledRoutineBase } from '@/types';
import { differenceInMinutes, isPast, parse } from 'date-fns';
import { FiEdit } from 'react-icons/fi'; // Added FiEdit for a potential edit button
import ScheduleEditModal from './ScheduleEditModal'; // Import the new modal

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
  newInputLabelPlaceholder,
  newIconOptions,
  iconComponentsMap,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<ScheduledRoutineBase | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Effect to update current time every second for real-time updates
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- REFACTORED LOGIC for sorting and annotating schedules ---

  // Sort schedules by time once. This is memoized for efficiency.
  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => {
      const timeA = parse(a.scheduledTime, 'HH:mm', new Date());
      const timeB = parse(b.scheduledTime, 'HH:mm', new Date());
      return timeA.getTime() - timeB.getTime();
    });
  }, [schedules]);

  // Find the next upcoming schedule. This is also memoized.
  const nextUpcomingSchedule = useMemo(() => {
    const now = currentTime;
    return sortedSchedules.find(schedule => {
      if (schedule.completed) return false;
      const targetDateTime = parse(schedule.scheduledTime, 'HH:mm', now);
      return !isPast(targetDateTime);
    });
  }, [sortedSchedules, currentTime]);

  // Annotate schedules with display information (timeLeftText, isNext).
  // This logic is now cleaner and runs only when its dependencies change.
  const annotatedSchedules = useMemo(() => {
    const now = currentTime;
    return sortedSchedules.map(schedule => {
      const targetDateTime = parse(schedule.scheduledTime, 'HH:mm', now);
      let timeLeftText = '';

      if (schedule.completed) {
        timeLeftText = 'Completed Today';
      } else if (isPast(targetDateTime)) {
        const minutesAgo = differenceInMinutes(now, targetDateTime);
        if (minutesAgo < schedule.durationMinutes) {
          timeLeftText = 'In Progress';
        } else {
          timeLeftText = 'Missed';
        }
      } else {
        const minutesUntil = differenceInMinutes(targetDateTime, now);
        const hours = Math.floor(minutesUntil / 60);
        const minutes = minutesUntil % 60;
        timeLeftText = `${hours > 0 ? `${hours}h ` : ''}${minutes}m remaining`;
      }

      return {
        ...schedule,
        isNext: schedule === nextUpcomingSchedule,
        timeLeftText,
      };
    });
  }, [sortedSchedules, nextUpcomingSchedule, currentTime]);

  // --- End of Refactored Logic ---

  const handleOpenModalForAdd = () => {
    setScheduleToEdit(null);
    setEditingIndex(null);
    setIsEditModalOpen(true);
  };

  const handleOpenModalForEdit = (schedule: ScheduledRoutineBase, index: number) => {
    setScheduleToEdit(schedule);
    setEditingIndex(index);
    setIsEditModalOpen(true);
  };

  const MainIconComponent = iconComponentsMap[newIconOptions[0]] || MdOutlineSettings;

  return (
    <>
      <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
        {/* Section Header */}
        <h2 className="flex gap-3 items-center mb-6 text-2xl font-bold text-white">
          <MainIconComponent size={28} />
          {sectionTitle}
        </h2>

        {/* Summary */}
        <div className="mb-6 text-center">
          <div className="text-4xl font-bold text-white">{summaryCount}</div>
          <div className="text-sm opacity-75 text-white/70">{summaryLabel}</div>
        </div>
        <div className="mb-8 h-3 rounded-full bg-white/20">
          <div
            className="h-3 bg-white rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {/* List Display Section */}
        <div className="mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-white">{listTitle}</h3>
            <button
              onClick={handleOpenModalForAdd}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors bg-white/10 hover:bg-white/20"
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
                    key={`${schedule.scheduledTime}-${index}`}
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
                          onClick={() => onToggleCompletion(index)}
                        >
                          {schedule.completed ? (
                            <MdCheckCircle size={28} />
                          ) : (
                            <ScheduleIconComponent size={28} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{schedule.label}</h3>
                          <div className="text-sm text-white/70">
                            {schedule.scheduledTime} for {schedule.durationMinutes} min
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
                          <div className="animate-ping">
                            <MdOutlineNotificationsActive size={20} className="text-orange-400" />
                          </div>
                        )}
                        <button
                          onClick={() => handleOpenModalForEdit(schedule, index)}
                          className="p-2 rounded-full transition-colors text-white/60 hover:bg-white/10"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => onRemoveSchedule(index)}
                          className="p-2 rounded-full transition-colors text-red-400/70 hover:bg-red-500/10"
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

      <ScheduleEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        scheduleToEdit={scheduleToEdit}
        originalIndex={editingIndex}
        onSave={onSaveSchedule}
        showMessage={() => {}} // Pass a dummy function or handle toast messages here
        newInputLabelPlaceholder={newInputLabelPlaceholder}
        newIconOptions={newIconOptions}
        iconComponentsMap={iconComponentsMap}
        buttonLabel={scheduleToEdit ? 'Save Changes' : 'Add & Save Schedule'}
      />
    </>
  );
};

export default RoutineSectionCard;
