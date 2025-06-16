// app/components/common/RoutineSectionCard.tsx
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MdOutlineSettings,
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowUp,
  MdOutlineNotificationsActive, // The ping icon
  MdDeleteForever,
  MdCheckCircle,
  // Add any other core icons used as fallbacks or main section icons
} from 'react-icons/md';
import { ScheduledRoutineBase } from '@/types';
import { differenceInMinutes, isPast, isSameDay } from 'date-fns';
import { FiLoader } from 'react-icons/fi'; // For the loading spinner

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

  // getTimeUntilSchedule is now internally calculated based on "isNext" logic
  // and will not be passed as a prop from parent components for "time remaining" display

  newInputLabelPlaceholder: string;
  newInputValue: string;
  onNewInputChange: (value: string) => void;

  newTimeValue: string;
  onNewTimeChange: (value: string) => void;

  newDurationPlaceholder: string;
  newDurationValue: number | string;
  onNewDurationChange: (value: string) => void;
  onNewDurationWheel: (e: React.WheelEvent<HTMLInputElement>) => void;

  newCurrentIcon: string;
  newIconOptions: string[];
  onNewSelectIcon: (iconName: string) => void;
  iconComponentsMap: { [key: string]: React.ElementType };

  buttonLabel: string;
  onAddSchedule: () => Promise<void>; // Changed to Promise<void> for async operations
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
  newInputLabelPlaceholder,
  newInputValue,
  onNewInputChange,
  newTimeValue,
  onNewTimeChange,
  newDurationPlaceholder,
  newDurationValue,
  onNewDurationChange,
  onNewDurationWheel,
  newCurrentIcon,
  newIconOptions,
  onNewSelectIcon,
  iconComponentsMap,
  buttonLabel,
  onAddSchedule,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false); // State for loading spinner on add button
  const iconDropdownRef = useRef<HTMLDivElement>(null);

  // Effect to update current time every second for 'next' item calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconDropdownRef.current && !iconDropdownRef.current.contains(event.target as Node)) {
        setIsIconDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sort schedules by scheduledTime and identify the "next" item
  const sortedAndAnnotatedSchedules = useMemo(() => {
    const now = currentTime;
    let nextUpcomingSchedule: ScheduledRoutineBase | null = null;
    let minMinutesUntil = Infinity;

    // Sort the schedules by time
    const sorted = [...schedules].sort((a, b) => {
      const [ah, am] = a.scheduledTime.split(':').map(Number);
      const [bh, bm] = b.scheduledTime.split(':').map(Number);
      return ah * 60 + am - (bh * 60 + bm);
    });

    return sorted
      .map(schedule => {
        const [targetHour, targetMinute] = schedule.scheduledTime.split(':').map(Number);
        let targetDateTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          targetHour,
          targetMinute,
          0,
          0
        );

        // If scheduled time has already passed today, consider it for tomorrow
        if (isPast(targetDateTime) && !isSameDay(targetDateTime, now)) {
          targetDateTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
            targetHour,
            targetMinute,
            0,
            0
          );
        } else if (isPast(targetDateTime) && isSameDay(targetDateTime, now)) {
          // If it's passed TODAY, but we are still in today, it's 'past today'
          // We might not want to mark this as "next" unless it's just passed or is current
        }

        const minutesUntil = differenceInMinutes(targetDateTime, now);

        let timeLeftText = '';

        if (!schedule.completed) {
          if (minutesUntil > 0) {
            // Future event
            timeLeftText = `${Math.floor(minutesUntil / 60)}h ${minutesUntil % 60}m remaining`;
            if (minutesUntil < minMinutesUntil) {
              minMinutesUntil = minutesUntil;
              nextUpcomingSchedule = schedule;
            }
          } else if (minutesUntil <= 0 && minutesUntil >= -schedule.durationMinutes) {
            // Currently active or just passed
            timeLeftText = 'In progress / Just passed';
          } else {
            // Past event for today or earlier
            timeLeftText = 'Passed';
          }
        } else {
          // Completed schedule
          timeLeftText = 'Completed';
        }

        return {
          ...schedule,
          isNext: false, // Will be set to true for only one item after this loop
          timeLeftText,
        };
      })
      .map(schedule => {
        // Second pass to mark the single next upcoming schedule
        if (
          nextUpcomingSchedule &&
          schedule.label === nextUpcomingSchedule.label &&
          schedule.scheduledTime === nextUpcomingSchedule.scheduledTime
        ) {
          return { ...schedule, isNext: true };
        }
        return schedule;
      });
  }, [schedules, currentTime]);

  // Get the React component for the main section icon (e.g., first icon in newIconOptions)
  const MainIconComponent = iconComponentsMap[newIconOptions[0]] || MdOutlineSettings;
  // Get the React component for the currently selected icon in the ADD form
  const CurrentFormIconComponent =
    iconComponentsMap[newCurrentIcon] || iconComponentsMap[newIconOptions[0]] || MdOutlineSettings;

  const handleAddScheduleLocal = async () => {
    setIsAdding(true);
    try {
      await onAddSchedule();
      // Parent handles showMessage and state reset
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      {/* Inline style to make time picker icon white (for webkit browsers) */}
      <style>{`
        input[type="time"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
            cursor: pointer;
        }
      `}</style>
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
          <h3 className="mb-3 font-semibold text-white">{listTitle}</h3>
          {sortedAndAnnotatedSchedules.length === 0 ? (
            <p className="mb-4 text-sm text-white/50">{listEmptyMessage}</p>
          ) : (
            <div className="mb-4 space-y-3">
              {sortedAndAnnotatedSchedules.map((schedule, index) => {
                const ScheduleIconComponent = iconComponentsMap[schedule.icon] || MdOutlineSettings; // Fallback icon

                return (
                  <div
                    key={`${schedule.label}-${schedule.scheduledTime}-${index}`} // Unique key
                    className={`bg-white/5 rounded-xl p-4 shadow-lg border-2 transition-all border-white/10 cursor-pointer
                      ${schedule.isNext ? 'border-blue-400 ring-2 ring-blue-200' : ''}
                      ${schedule.completed ? 'bg-green-500/10 border-green-500/30' : ''}`}
                    onClick={() => onToggleCompletion(index)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4 items-center">
                        <div className="flex justify-center items-center w-10 h-10 text-xl text-white rounded-full bg-purple-500/20">
                          <ScheduleIconComponent size={24} />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{schedule.label}</h3>
                          <div className="text-sm text-white/70">
                            {schedule.scheduledTime} for {schedule.durationMinutes} min
                          </div>
                          {schedule.timeLeftText && ( // Display time left text
                            <div
                              className={`text-sm ${schedule.isNext ? 'text-blue-300' : 'text-white/50'}`}
                            >
                              {schedule.timeLeftText}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 items-center">
                        {schedule.isNext && !schedule.completed && (
                          <div className="animate-pulse">
                            <MdOutlineNotificationsActive size={20} className="text-orange-400" />
                          </div>
                        )}
                        {schedule.completed && (
                          <MdCheckCircle size={24} className="text-green-400" />
                        )}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onRemoveSchedule(index);
                          }}
                          className="p-1 text-red-400 rounded-full cursor-pointer hover:bg-red-500/10"
                          aria-label={`Remove ${schedule.label}`}
                        >
                          <MdDeleteForever size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add New Schedule Form Section */}
        <div className="bg-white/[0.02] rounded-xl p-6 shadow-lg border border-white/10">
          <h3 className="mb-4 font-semibold text-white">
            Add New{' '}
            {sectionTitle.replace(' Plan', '').replace(' Routine', '').replace(' Tracker', '')}{' '}
            Schedule
          </h3>

          {/* Combined input and button for Label & Icon Select */}
          <div
            className="flex relative justify-between items-center mb-4 rounded-lg border border-white/10 bg-black/20"
            ref={iconDropdownRef}
          >
            <input
              type="text"
              placeholder={newInputLabelPlaceholder}
              value={newInputValue}
              onChange={e => onNewInputChange(e.target.value)}
              className="p-3 pr-16 w-full text-white bg-transparent border-transparent"
            />
            <button
              type="button"
              onClick={() => setIsIconDropdownOpen(prev => !prev)}
              className="flex absolute right-1 justify-center items-center text-white rounded-md cursor-pointer focus:outline-none"
            >
              {React.createElement(CurrentFormIconComponent, { size: 24 })}
              {isIconDropdownOpen ? (
                <MdOutlineKeyboardArrowUp size={20} />
              ) : (
                <MdOutlineKeyboardArrowDown size={20} />
              )}
            </button>
            {isIconDropdownOpen && (
              <div className="overflow-y-auto absolute left-0 top-full z-50 p-2 mt-2 w-full max-h-60 rounded-lg border shadow-lg bg-neutral-900 border-white/10">
                <div className="flex flex-wrap gap-2 justify-center">
                  {newIconOptions.map(icon => (
                    <button
                      key={icon}
                      onClick={() => {
                        onNewSelectIcon(icon);
                        setIsIconDropdownOpen(false);
                      }}
                      className="flex flex-shrink-0 justify-center items-center p-3 text-white rounded-md transition-colors cursor-pointer hover:bg-white/10"
                    >
                      {React.createElement(iconComponentsMap[icon], { size: 24 })}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input Fields for time and duration */}
          <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
            <input
              type="time"
              value={newTimeValue}
              onChange={e => onNewTimeChange(e.target.value)}
              className="p-3 w-full text-white rounded-lg border cursor-pointer focus:ring-2 focus:ring-purple-500 bg-black/20 border-white/10"
            />
            <input
              type="text" // Keep as text to allow empty string easier, but force number on change
              placeholder={newDurationPlaceholder}
              value={newDurationValue}
              onChange={e => onNewDurationChange(e.target.value)}
              onWheel={onNewDurationWheel}
              className="p-3 w-full text-white rounded-lg border focus:ring-2 focus:ring-purple-500 bg-black/20 border-white/10"
            />
          </div>

          <button
            onClick={handleAddScheduleLocal}
            disabled={isAdding} // Disable when adding
            className="flex gap-2 justify-center items-center py-3 w-full font-medium text-white bg-black rounded-lg border transition-colors cursor-pointer border-white/20 hover:bg-white/10 disabled:opacity-60"
          >
            {isAdding ? (
              <>
                <FiLoader className="w-5 h-5 animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <MdOutlineSettings size={20} /> {buttonLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default RoutineSectionCard;
