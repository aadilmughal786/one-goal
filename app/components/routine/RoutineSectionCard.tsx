// app/components/routine/RoutineSectionCard.tsx
'use client';

import { ScheduledRoutineBase } from '@/types';
import { differenceInMinutes, isPast, parse } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import { FiEdit, FiPlus } from 'react-icons/fi';
import { MdCheckCircle, MdDeleteForever, MdOutlineSettings } from 'react-icons/md';
import ScheduleEditModal from './ScheduleEditModal';

interface RoutineSectionCardProps {
  sectionTitle: string;
  summaryCount: string;
  summaryLabel: string;
  progressPercentage: number;
  listTitle: string;
  listEmptyMessage: string;
  schedules: ScheduledRoutineBase[];
  onToggleCompletion: (scheduleId: string) => void;
  onRemoveSchedule: (scheduleId: string) => void;
  onSaveSchedule: (schedule: ScheduledRoutineBase, scheduleId: string | null) => Promise<void>;
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => {
      const timeA = parse(a.time, 'HH:mm', new Date());
      const timeB = parse(b.time, 'HH:mm', new Date());
      return timeA.getTime() - timeB.getTime();
    });
  }, [schedules]);

  const annotatedSchedules = useMemo(() => {
    const now = currentTime;
    return sortedSchedules.map(schedule => {
      const targetDateTime = parse(schedule.time, 'HH:mm', now);
      let timeLeftText = '';
      let statusColorClass = 'text-text-tertiary'; // Default color for upcoming

      if (schedule.completed) {
        timeLeftText = 'Completed Today';
        statusColorClass = 'text-green-400';
      } else if (isPast(targetDateTime)) {
        const minutesAgo = differenceInMinutes(now, targetDateTime);
        if (minutesAgo < schedule.duration) {
          timeLeftText = 'In Progress';
          statusColorClass = 'text-blue-400'; // Color for In Progress
        } else {
          timeLeftText = 'Missed';
          statusColorClass = 'text-red-400'; // Color for Missed
        }
      } else {
        const minutesUntil = differenceInMinutes(targetDateTime, now);
        const hours = Math.floor(minutesUntil / 60);
        const minutes = minutesUntil % 60;
        timeLeftText = `${hours > 0 ? `${hours}h ` : ''}${minutes}m remaining`;
      }

      return {
        ...schedule,
        timeLeftText,
        statusColorClass,
      };
    });
  }, [sortedSchedules, currentTime]);

  const handleOpenModalForAdd = () => {
    setScheduleToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleOpenModalForEdit = (schedule: ScheduledRoutineBase) => {
    setScheduleToEdit(schedule);
    setIsEditModalOpen(true);
  };

  const MainIconComponent = iconComponentsMap[newIconOptions[0]] || MdOutlineSettings;

  return (
    <>
      <div className="rounded-3xl border shadow-2xl bg-bg-secondary border-border-primary">
        <div className="flex justify-between items-center p-6">
          <h2 className="flex gap-3 items-center text-xl font-bold text-text-primary">
            <MainIconComponent size={24} />
            {sectionTitle}
          </h2>
          <button
            onClick={handleOpenModalForAdd}
            className="flex justify-center items-center w-8 h-8 rounded-full transition-all duration-200 cursor-pointer text-bg-primary bg-text-primary hover:opacity-90"
            aria-label={`Add new ${sectionTitle.toLowerCase()} routine`}
            title={`Add new ${sectionTitle.toLowerCase()} routine`}
          >
            <FiPlus size={20} />
          </button>
        </div>

        <div className="border-t border-border-primary"></div>

        <div className="p-6">
          <div className="mb-6 text-center">
            <div className="text-4xl font-bold text-text-primary">{summaryCount}</div>
            <div className="text-sm text-text-secondary">{summaryLabel}</div>
          </div>
          <div className="mb-8 h-3 rounded-full bg-bg-tertiary">
            <div
              className="h-3 rounded-full transition-all duration-500 bg-text-primary"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-text-primary">{listTitle}</h3>
            </div>
            {annotatedSchedules.length === 0 ? (
              <p className="py-8 text-center text-text-muted">{listEmptyMessage}</p>
            ) : (
              <div className="space-y-3">
                {annotatedSchedules.map(schedule => {
                  const ScheduleIconComponent =
                    iconComponentsMap[schedule.icon] || MdOutlineSettings;
                  return (
                    <div
                      key={schedule.id}
                      className={`bg-bg-primary rounded-xl p-4 shadow-lg border-1 transition-all border-border-primary
                          ${schedule.completed ? 'bg-green-500/10 border-green-500/30' : ''}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex flex-1 gap-4 items-center">
                          <div
                            className={`flex items-center justify-center w-12 h-12 rounded-lg transition-colors
                                ${
                                  schedule.completed
                                    ? 'bg-green-400/70 text-white'
                                    : 'bg-purple-500/20 text-purple-300'
                                }`}
                          >
                            <ScheduleIconComponent size={28} />
                          </div>
                          <div className="flex-1">
                            <h3
                              className={`font-medium text-text-primary ${schedule.completed ? 'line-through text-text-muted' : ''}`}
                            >
                              {schedule.label}
                            </h3>
                            <div className="text-sm text-text-secondary">
                              {schedule.time} for {schedule.duration} min
                            </div>
                            <div className={`text-sm font-semibold ${schedule.statusColorClass}`}>
                              {schedule.timeLeftText}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 items-center">
                          <button
                            onClick={() => onToggleCompletion(schedule.id)}
                            className={`p-2 rounded-full transition-colors cursor-pointer ${
                              schedule.completed ? 'text-green-400' : 'text-text-tertiary'
                            }`}
                            aria-label={
                              schedule.completed
                                ? `Mark ${schedule.label} as incomplete`
                                : `Mark ${schedule.label} as complete`
                            }
                          >
                            {schedule.completed ? (
                              <MdCheckCircle size={20} />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-border-secondary"></div>
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenModalForEdit(schedule)}
                            className="p-2 rounded-full transition-colors cursor-pointer text-text-tertiary hover:bg-bg-tertiary"
                            aria-label={`Edit ${schedule.label}`}
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => onRemoveSchedule(schedule.id)}
                            className="p-2 rounded-full transition-colors cursor-pointer text-red-400/70 hover:bg-red-500/10"
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
      </div>

      <ScheduleEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        scheduleToEdit={scheduleToEdit}
        onSave={onSaveSchedule}
        newInputLabelPlaceholder={newInputLabelPlaceholder}
        newIconOptions={newIconOptions}
        iconComponentsMap={iconComponentsMap}
        buttonLabel={scheduleToEdit ? 'Update Schedule' : 'Add Schedule'}
      />
    </>
  );
};

export default RoutineSectionCard;
