// app/components/common/RoutineSectionCard.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MdOutlineSettings,
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowUp,
  MdOutlineRestaurant,
  MdOutlineNotificationsActive,
  MdDeleteForever,
  MdCheckCircle,
  // Also ensure main section icons are imported here
} from 'react-icons/md';
import { ScheduledRoutineBase } from '@/types';

interface RoutineSectionCardProps {
  // Section Header Props (for the whole card)
  sectionTitle: string; // e.g., "Daily Meal Plan", "Sleep Schedule"

  // Summary Props (for the whole card)
  summaryCount: string; // e.g., "X/Y Meals Completed", "X Glasses Consumed"
  summaryLabel: string; // e.g., "Meals Completed Today", "Glasses Consumed Today"
  progressPercentage: number; // For the summary progress bar

  // List of Schedules Props
  listTitle: string; // e.g., "Your Meal Schedules", "Your Nap Schedules"
  listEmptyMessage: string; // e.g., "No meals scheduled."
  schedules: ScheduledRoutineBase[]; // The actual list of schedules to display
  onToggleCompletion: (index: number) => void; // Callback to toggle completion for a schedule
  onRemoveSchedule: (index: number) => void; // Callback to remove a schedule
  // Optional: For calculating "time until" and "isNext" in the list items
  getTimeUntilSchedule?: (scheduledTime: string) => {
    hours: number;
    minutes: number;
    total: number;
    isPast: boolean;
  };

  // Add New Schedule Form Props
  newInputLabelPlaceholder: string;
  newInputValue: string;
  onNewInputChange: (value: string) => void;

  newTimeValue: string;
  onNewTimeChange: (value: string) => void;

  newDurationPlaceholder: string;
  newDurationValue: number | string;
  onNewDurationChange: (value: string) => void; // value from event target
  onNewDurationWheel: (e: React.WheelEvent<HTMLInputElement>) => void;

  // Icon selection for the new schedule form
  newCurrentIcon: string;
  newIconOptions: string[]; // Array of { name: string, icon: string } for the dropdown
  onNewSelectIcon: (iconName: string) => void; // Callback when an icon is selected
  iconComponentsMap: { [key: string]: React.ElementType }; // PASSED FROM PARENT
  // ^ This map MUST include all icons used both in the list and in the form.

  buttonLabel: string; // e.g., "Add & Save Meal", "Add Nap"
  onAddSchedule: () => void; // Callback for the Add button
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
  getTimeUntilSchedule,
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
  iconComponentsMap, // Destructured here, this is the definitive source for icon components
  buttonLabel,
  onAddSchedule,
}) => {
  const [, setCurrentTime] = useState(new Date());
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const iconDropdownRef = useRef<HTMLDivElement>(null);

  // Effect to update current time every second for header display
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

  // Get the React component for the main section icon
  // This now *must* come from the passed iconComponentsMap
  const MainIconComponent = iconComponentsMap[newIconOptions[0]];
  // Get the React component for the currently selected icon in the ADD form
  // This now *must* come from the passed iconComponentsMap
  const CurrentFormIconComponent =
    iconComponentsMap[newCurrentIcon] || iconComponentsMap[newIconOptions[0]];

  return (
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
        {schedules.length === 0 ? (
          <p className="mb-4 text-sm text-white/50">{listEmptyMessage}</p>
        ) : (
          <div className="mb-4 space-y-3">
            {schedules.map((schedule, index) => {
              const ScheduleIconComponent = iconComponentsMap[schedule.icon] || MdOutlineRestaurant;
              const timeLeft = getTimeUntilSchedule
                ? getTimeUntilSchedule(schedule.scheduledTime)
                : null;
              const isNext = timeLeft ? !schedule.completed && !timeLeft.isPast : false;

              return (
                <div
                  key={index}
                  className={`bg-white/5 rounded-xl p-4 shadow-lg border-2 transition-all border-white/10 cursor-pointer
                    ${isNext ? 'border-blue-400 ring-2 ring-blue-200' : ''}
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
                        {timeLeft && !schedule.completed && !timeLeft.isPast && (
                          <div className="text-sm text-white/50">
                            {timeLeft.hours > 0 ? `${timeLeft.hours}h ` : ''}
                            {timeLeft.minutes}m remaining
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 items-center">
                      {isNext && (
                        <div className="animate-pulse">
                          <MdOutlineNotificationsActive size={20} className="text-orange-400" />
                        </div>
                      )}
                      {schedule.completed && <MdCheckCircle size={24} className="text-green-400" />}
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
            type="text"
            placeholder={newDurationPlaceholder}
            value={newDurationValue}
            onChange={e => onNewDurationChange(e.target.value)}
            onWheel={onNewDurationWheel}
            className="p-3 w-full text-white rounded-lg border focus:ring-2 focus:ring-purple-500 bg-black/20 border-white/10"
          />
        </div>

        <button
          onClick={onAddSchedule}
          className="flex gap-2 justify-center items-center py-3 w-full font-medium text-white bg-black rounded-lg border transition-colors cursor-pointer border-white/20 hover:bg-white/10"
        >
          <MdOutlineSettings size={20} /> {buttonLabel}
        </button>
      </div>
    </div>
  );
};

export default RoutineSectionCard;
