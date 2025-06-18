// app/components/shared/DateTimePicker.tsx
'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
  startOfDay,
} from 'date-fns';
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiClock,
  FiCheck,
  FiChevronUp,
  FiChevronDown,
} from 'react-icons/fi';

type PickerMode = 'datetime' | 'date' | 'time';
type ActiveTab = 'date' | 'time';

interface DateTimePickerProps {
  isOpen: boolean; // Renamed from value to isOpen for clarity
  value: Date | null;
  onChange: (date: Date | null) => void;
  onClose: () => void;
  mode?: PickerMode;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  isOpen,
  value,
  onChange,
  onClose,
  mode = 'datetime',
}) => {
  // Date state
  const [viewDate, setViewDate] = useState(value || new Date());
  const [selectedDate, setSelectedDate] = useState(
    value ? startOfDay(value) : startOfDay(new Date())
  );

  // Time state
  const [hour, setHour] = useState(value ? getHours(value) % 12 || 12 : 12);
  const [minute, setMinute] = useState(value ? getMinutes(value) : 0);
  const [period, setPeriod] = useState(value ? (getHours(value) >= 12 ? 'PM' : 'AM') : 'PM');

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>(mode === 'time' ? 'time' : 'date');
  const pickerRef = useRef<HTMLDivElement>(null);

  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [viewDate]);

  const firstDayOfMonth = useMemo(() => startOfMonth(viewDate).getDay(), [viewDate]);

  const handleDateSelect = (day: Date) => {
    setSelectedDate(day);
    if (mode === 'date') {
      onChange(day);
      onClose();
    } else {
      setActiveTab('time');
    }
  };

  const handleTimeChange = (type: 'hour' | 'minute', direction: 'up' | 'down') => {
    if (type === 'hour') {
      setHour(prev => {
        if (direction === 'up') return prev === 12 ? 1 : prev + 1;
        return prev === 1 ? 12 : prev - 1;
      });
    } else {
      setMinute(prev => {
        if (direction === 'up') return prev === 59 ? 0 : prev + 1;
        return prev === 0 ? 59 : prev - 1;
      });
    }
  };

  const handleSave = () => {
    let finalDate = selectedDate || new Date();
    let finalHour = hour;

    if (period === 'PM' && finalHour < 12) finalHour += 12;
    if (period === 'AM' && finalHour === 12) finalHour = 0;

    finalDate = setHours(finalDate, finalHour);
    finalDate = setMinutes(finalDate, minute);

    onChange(finalDate);
    onClose();
  };

  // Renders the main display header
  const renderDisplayHeader = () => (
    <div className="flex justify-around items-center p-3 text-center rounded-t-xl bg-white/5">
      <div className="flex gap-2 items-center">
        <FiCalendar className="text-white/60" />
        <span className="font-semibold">{format(selectedDate, 'MMM d,yyyy')}</span>
      </div>
      <div className="w-px h-8 bg-white/10"></div>
      <div className="flex gap-2 items-center">
        <FiClock className="text-white/60" />
        <span className="font-semibold">
          {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')} {period}
        </span>
      </div>
    </div>
  );

  // Renders the date selection (calendar) view
  const renderDateSelector = () => (
    <div className="p-2">
      <div className="flex justify-between items-center px-2 py-1">
        <button
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          className="p-2 rounded-full hover:bg-white/10"
        >
          <FiChevronLeft />
        </button>
        <span className="text-lg font-semibold">{format(viewDate, 'MMMM, yyyy')}</span>
        <button
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="p-2 rounded-full hover:bg-white/10"
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
            className={`w-9 h-9 rounded-full transition-colors flex items-center justify-center font-medium
              ${
                isSameDay(day, selectedDate)
                  ? 'text-white bg-blue-500'
                  : isToday(day)
                    ? 'text-blue-300 border border-blue-400'
                    : 'hover:bg-white/10'
              }`}
          >
            {format(day, 'd')}
          </button>
        ))}
      </div>
    </div>
  );

  // Renders the time selection view
  const renderTimeSelector = () => (
    <div className="flex gap-4 justify-center items-center p-6">
      <div className="flex flex-col gap-2 items-center">
        <button
          onClick={() => handleTimeChange('hour', 'up')}
          className="p-2 rounded-full hover:bg-white/10"
        >
          <FiChevronUp />
        </button>
        <span className="w-20 font-mono text-5xl text-center">
          {hour.toString().padStart(2, '0')}
        </span>
        <button
          onClick={() => handleTimeChange('hour', 'down')}
          className="p-2 rounded-full hover:bg-white/10"
        >
          <FiChevronDown />
        </button>
      </div>
      <span className="font-mono text-4xl text-white/50">:</span>
      <div className="flex flex-col gap-2 items-center">
        <button
          onClick={() => handleTimeChange('minute', 'up')}
          className="p-2 rounded-full hover:bg-white/10"
        >
          <FiChevronUp />
        </button>
        <span className="w-20 font-mono text-5xl text-center">
          {minute.toString().padStart(2, '0')}
        </span>
        <button
          onClick={() => handleTimeChange('minute', 'down')}
          className="p-2 rounded-full hover:bg-white/10"
        >
          <FiChevronDown />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setPeriod('AM')}
          className={`px-4 py-2 text-sm font-semibold rounded-md ${period === 'AM' ? 'bg-blue-500' : 'bg-white/10'}`}
        >
          AM
        </button>
        <button
          onClick={() => setPeriod('PM')}
          className={`px-4 py-2 text-sm font-semibold rounded-md ${period === 'PM' ? 'bg-blue-500' : 'bg-white/10'}`}
        >
          PM
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div
      className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
      onClick={onClose}
    >
      <div
        ref={pickerRef}
        onClick={e => e.stopPropagation()}
        className="w-80 bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl text-white animate-fade-in-down"
      >
        {mode === 'datetime' && renderDisplayHeader()}

        {mode === 'datetime' && (
          <div className="flex p-1 bg-black/20">
            <button
              onClick={() => setActiveTab('date')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'date' ? 'bg-white/10' : 'text-white/60 hover:bg-white/5'}`}
            >
              Date
            </button>
            <button
              onClick={() => setActiveTab('time')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'time' ? 'bg-white/10' : 'text-white/60 hover:bg-white/5'}`}
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
              className="w-full flex items-center justify-center gap-2 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors font-semibold"
            >
              <FiCheck />
              {mode === 'time' ? 'Set Time' : 'Confirm'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
