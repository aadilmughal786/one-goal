// app/components/common/DateTimePicker.tsx
'use client';

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getHours,
  getMinutes,
  isSameDay,
  isToday,
  setHours,
  setMinutes,
  startOfMonth,
  subMonths,
} from 'date-fns';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiClock,
  FiLoader,
} from 'react-icons/fi';

// =================================================================//
//
// ENUMS & TYPES
//
// =================================================================//

/** Defines the available modes for the picker, allowing it to function as a full datetime, date-only, or time-only selector. */
type PickerMode = 'datetime' | 'date' | 'time';

/** Defines the currently active tab within the picker UI when in `datetime` mode. */
type ActiveTab = 'date' | 'time';

/**
 * Defines the props accepted by the DateTimePicker component.
 */
interface DateTimePickerProps {
  /** Controls whether the modal is visible to the user. */
  isOpen: boolean;
  /** The initial Date object to display when the picker opens. Can be `null` for new entries. */
  value: Date | null;
  /** A callback function that returns the selected `Date` object when the user confirms their choice. */
  onChange: (date: Date | null) => void;
  /** A callback function invoked when the user closes the modal without saving. */
  onClose: () => void;
  /** The operational mode of the picker. Defaults to `datetime`. */
  mode?: PickerMode;
}

// =================================================================//
//
// COMPONENT IMPLEMENTATION
//
// =================================================================//

/**
 * A highly reusable and robust modal component for selecting a date, a time, or both.
 * It operates in a 24-hour format and is designed to be self-contained and easy to integrate.
 */
export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  isOpen,
  value,
  onChange,
  onClose,
  mode = 'datetime',
}) => {
  // =================================================================//
  //
  // STATE MANAGEMENT
  //
  // =================================================================//

  /** The month currently being displayed in the calendar view. */
  const [viewDate, setViewDate] = useState(new Date());

  /** The internal "draft" state for the date and time. It's initialized from props but then managed
   * independently until the user confirms, preventing unwanted state resets during interaction. */
  const [internalDate, setInternalDate] = useState(new Date());

  /** The currently active UI tab ('date' or 'time'). */
  const [activeTab, setActiveTab] = useState<ActiveTab>('date');

  /** A loading state for the save button to provide user feedback. */
  const [isSaving, setIsSaving] = useState(false);

  /** A ref to the main modal element for detecting outside clicks. */
  const pickerRef = useRef<HTMLDivElement>(null);

  // =================================================================//
  //
  // LIFECYCLE & SYNCHRONIZATION
  //
  // =================================================================//

  /**
   * This effect is the core of the component's state management. It synchronizes the
   * internal state with the external `value` prop ONLY when the modal is first opened (`isOpen` becomes true).
   * This ensures the picker starts with the correct date but doesn't reset while the user is making changes.
   */
  useEffect(() => {
    if (isOpen) {
      const initialDate = value || new Date();
      setInternalDate(initialDate);
      setViewDate(initialDate);
      setActiveTab(mode === 'time' ? 'time' : 'date');
      setIsSaving(false); // Ensure saving state is reset on open
    }
  }, [isOpen, value, mode]);

  // =================================================================//
  //
  // MEMOIZED CALCULATIONS
  //
  // =================================================================//

  /** Memoizes the array of days for the current calendar month view to avoid recalculation. */
  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [viewDate]);

  /** Memoizes the starting day of the week for the current month to correctly pad the calendar grid. */
  const firstDayOfMonth = useMemo(() => startOfMonth(viewDate).getDay(), [viewDate]);

  // =================================================================//
  //
  // EVENT HANDLERS
  //
  // =================================================================//

  /**
   * Handles the selection of a day from the calendar grid.
   * @param day The `Date` object for the selected day.
   */
  const handleDateSelect = (day: Date) => {
    const newDate = setMinutes(setHours(day, getHours(internalDate)), getMinutes(internalDate));
    setInternalDate(newDate);

    if (mode === 'date') {
      onChange(newDate);
      onClose();
    } else {
      setActiveTab('time');
    }
  };

  /**
   * Handles incrementing or decrementing the hour or minute.
   * @param type Specifies whether to modify the 'hour' or 'minute'.
   * @param direction Specifies 'up' for increment or 'down' for decrement.
   */
  const handleTimeChange = (type: 'hour' | 'minute', direction: 'up' | 'down') => {
    setInternalDate(currentDate => {
      let newDate = new Date(currentDate);
      if (type === 'hour') {
        let currentHour = getHours(newDate);
        currentHour = direction === 'up' ? (currentHour + 1) % 24 : (currentHour + 23) % 24;
        newDate = setHours(newDate, currentHour);
      } else {
        let currentMinute = getMinutes(newDate);
        currentMinute = direction === 'up' ? (currentMinute + 1) % 60 : (currentMinute + 59) % 60;
        newDate = setMinutes(newDate, currentMinute);
      }
      return newDate;
    });
  };

  /**
   * Finalizes the selection, shows a brief loader for UX, and sends the result to the parent.
   */
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      onChange(internalDate);
      onClose();
    }, 300); // A 300ms fake delay feels responsive yet noticeable.
  };

  // =================================================================//
  //
  // RENDER HELPERS
  //
  // =================================================================//

  /** Renders the top display header showing the selected date and time. */
  const renderDisplayHeader = () => (
    <div className="flex justify-around items-center p-3 text-center rounded-t-md bg-white/5">
      <div className="flex gap-2 items-center">
        <FiCalendar className="text-white/60" />
        <span className="font-semibold">{format(internalDate, 'MMM d, yyyy')}</span>
      </div>
      <div className="w-px h-8 bg-white/10"></div>
      <div className="flex gap-2 items-center">
        <FiClock className="text-white/60" />
        <span className="font-semibold">{format(internalDate, 'HH:mm')}</span>
      </div>
    </div>
  );

  /** Renders the calendar grid for date selection. */
  const renderDateSelector = () => (
    <div className="p-2">
      <div className="flex justify-between items-center px-2 py-1">
        <button
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          className="p-2 rounded-full cursor-pointer hover:bg-white/10"
        >
          <FiChevronLeft />
        </button>
        <span className="text-lg font-semibold">{format(viewDate, 'MMMM, yyyy')}</span>
        <button
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="p-2 rounded-full cursor-pointer hover:bg-white/10"
        >
          <FiChevronRight />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mt-2 text-xs text-center text-white/60">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={`${day}-${index}`} className="flex justify-center items-center w-9 h-9">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 p-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="w-9 h-9" />
        ))}
        {daysInMonth.map(day => (
          <button
            key={day.toString()}
            onClick={() => handleDateSelect(day)}
            className={`w-9 h-9 rounded-md transition-colors flex items-center justify-center font-medium cursor-pointer
              ${isSameDay(day, internalDate) ? 'text-black bg-white hover:bg-white/90' : isToday(day) ? 'text-blue-300 border border-blue-400' : 'hover:bg-white/10'}`}
          >
            {format(day, 'd')}
          </button>
        ))}
      </div>
    </div>
  );

  /** Renders the interactive time selector. */
  const renderTimeSelector = () => (
    <div className="flex gap-4 justify-center items-center p-6">
      <div className="flex flex-col gap-2 items-center">
        <button
          onClick={() => handleTimeChange('hour', 'up')}
          className="p-2 rounded-full cursor-pointer hover:bg-white/10"
        >
          <FiChevronUp />
        </button>
        <span className="w-20 font-mono text-5xl text-center">{format(internalDate, 'HH')}</span>
        <button
          onClick={() => handleTimeChange('hour', 'down')}
          className="p-2 rounded-full cursor-pointer hover:bg-white/10"
        >
          <FiChevronDown />
        </button>
      </div>
      <span className="font-mono text-4xl text-white/50">:</span>
      <div className="flex flex-col gap-2 items-center">
        <button
          onClick={() => handleTimeChange('minute', 'up')}
          className="p-2 rounded-full cursor-pointer hover:bg-white/10"
        >
          <FiChevronUp />
        </button>
        <span className="w-20 font-mono text-5xl text-center">{format(internalDate, 'mm')}</span>
        <button
          onClick={() => handleTimeChange('minute', 'down')}
          className="p-2 rounded-full cursor-pointer hover:bg-white/10"
        >
          <FiChevronDown />
        </button>
      </div>
    </div>
  );

  // =================================================================//
  //
  // MAIN RENDER
  //
  // =================================================================//

  if (!isOpen) return null;

  return (
    <div
      className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
      onClick={onClose}
    >
      <div
        ref={pickerRef}
        onClick={e => e.stopPropagation()}
        className="w-80 bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-md shadow-2xl text-white animate-fade-in-down"
      >
        {mode === 'datetime' && renderDisplayHeader()}
        {mode === 'datetime' && (
          <div className="flex gap-2 p-2 bg-black/20">
            <button
              onClick={() => setActiveTab('date')}
              className={`flex-1 py-2 text-sm font-semibold rounded-sm transition-colors cursor-pointer ${activeTab === 'date' ? 'bg-white/10' : 'text-white/60 hover:bg-white/5'}`}
            >
              Date
            </button>
            <button
              onClick={() => setActiveTab('time')}
              className={`flex-1 py-2 text-sm font-semibold rounded-sm transition-colors cursor-pointer ${activeTab === 'time' ? 'bg-white/10' : 'text-white/60 hover:bg-white/5'}`}
            >
              Time
            </button>
          </div>
        )}
        {activeTab === 'date' && mode !== 'time' && renderDateSelector()}
        {activeTab === 'time' && mode !== 'date' && renderTimeSelector()}
        {mode !== 'date' && (
          <div className="p-2 border-t border-white/10">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-black bg-white rounded-md hover:bg-white/90 transition-colors font-semibold cursor-pointer disabled:opacity-70"
            >
              {isSaving ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiCheck />}
              <span>{isSaving ? 'Saving...' : mode === 'time' ? 'Set Time' : 'Confirm'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
