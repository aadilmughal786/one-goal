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

type PickerMode = 'datetime' | 'date' | 'time';
type ActiveTab = 'date' | 'time';

interface DateTimePickerProps {
  isOpen: boolean;
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
  const [viewDate, setViewDate] = useState(new Date());
  const [internalDate, setInternalDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<ActiveTab>('date');
  const [isSaving, setIsSaving] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const initialDate = value || new Date();
      setInternalDate(initialDate);
      setViewDate(initialDate);
      setActiveTab(mode === 'time' ? 'time' : 'date');
      setIsSaving(false);
    }
  }, [isOpen, value, mode]);

  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [viewDate]);

  const firstDayOfMonth = useMemo(() => startOfMonth(viewDate).getDay(), [viewDate]);

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

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      onChange(internalDate);
      onClose();
    }, 300);
  };

  const renderDisplayHeader = () => (
    <div className="flex justify-around items-center p-3 text-center rounded-t-md bg-bg-tertiary">
      <div className="flex gap-2 items-center">
        <FiCalendar className="text-text-secondary" />
        <span className="font-semibold">{format(internalDate, 'MMM d,yyyy')}</span>
      </div>
      <div className="w-px h-8 bg-border-primary"></div>
      <div className="flex gap-2 items-center">
        <FiClock className="text-text-secondary" />
        <span className="font-semibold">{format(internalDate, 'HH:mm')}</span>
      </div>
    </div>
  );

  const renderDateSelector = () => (
    <div className="p-2">
      <div className="flex justify-between items-center px-2 py-1">
        <button
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          className="p-2 rounded-full cursor-pointer hover:bg-bg-tertiary"
        >
          <FiChevronLeft />
        </button>
        <span className="text-lg font-semibold">{format(viewDate, 'MMMM,yyyy')}</span>
        <button
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="p-2 rounded-full cursor-pointer hover:bg-bg-tertiary"
        >
          <FiChevronRight />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mt-2 text-xs text-center text-text-secondary">
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
              ${isSameDay(day, internalDate) ? 'text-bg-primary bg-text-primary hover:opacity-90' : isToday(day) ? 'border text-text-accent border-border-accent' : 'hover:bg-bg-tertiary'}`}
          >
            {format(day, 'd')}
          </button>
        ))}
      </div>
    </div>
  );

  const renderTimeSelector = () => (
    <div className="flex gap-4 justify-center items-center p-6">
      <div className="flex flex-col gap-2 items-center">
        <button
          onClick={() => handleTimeChange('hour', 'up')}
          className="p-2 rounded-full cursor-pointer hover:bg-bg-tertiary"
        >
          <FiChevronUp />
        </button>
        <span className="w-20 font-mono text-5xl text-center">{format(internalDate, 'HH')}</span>
        <button
          onClick={() => handleTimeChange('hour', 'down')}
          className="p-2 rounded-full cursor-pointer hover:bg-bg-tertiary"
        >
          <FiChevronDown />
        </button>
      </div>
      <span className="font-mono text-4xl text-text-muted">:</span>
      <div className="flex flex-col gap-2 items-center">
        <button
          onClick={() => handleTimeChange('minute', 'up')}
          className="p-2 rounded-full cursor-pointer hover:bg-bg-tertiary"
        >
          <FiChevronUp />
        </button>
        <span className="w-20 font-mono text-5xl text-center">{format(internalDate, 'mm')}</span>
        <button
          onClick={() => handleTimeChange('minute', 'down')}
          className="p-2 rounded-full cursor-pointer hover:bg-bg-tertiary"
        >
          <FiChevronDown />
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
        className="w-80 rounded-md border shadow-2xl backdrop-blur-md bg-bg-secondary border-border-primary text-text-primary animate-fade-in-down"
      >
        {mode === 'datetime' && renderDisplayHeader()}
        {mode === 'datetime' && (
          <div className="flex gap-2 p-2 bg-bg-primary">
            <button
              onClick={() => setActiveTab('date')}
              className={`flex-1 py-2 text-sm font-semibold rounded-sm transition-colors cursor-pointer ${activeTab === 'date' ? 'bg-bg-tertiary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
            >
              Date
            </button>
            <button
              onClick={() => setActiveTab('time')}
              className={`flex-1 py-2 text-sm font-semibold rounded-sm transition-colors cursor-pointer ${activeTab === 'time' ? 'bg-bg-tertiary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
            >
              Time
            </button>
          </div>
        )}
        {activeTab === 'date' && mode !== 'time' && renderDateSelector()}
        {activeTab === 'time' && mode !== 'date' && renderTimeSelector()}
        {mode !== 'date' && (
          <div className="p-2 border-t border-border-primary">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-bg-primary bg-text-primary rounded-md hover:opacity-90 transition-colors font-semibold cursor-pointer disabled:opacity-70"
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
