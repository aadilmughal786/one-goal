// app/components/DayBlock.tsx
'use client';

import React from 'react';
import { DailyProgress } from '@/types';

interface DayBlockProps {
  date: Date; // The date for this block
  progressData?: DailyProgress | null; // Optional existing progress for this day
  isToday: boolean;
  canInteract: boolean; // True if the day is today or in the past
  onDayClick: (date: Date, initialProgress?: DailyProgress | null) => void;
}

// Satisfaction options for color coding
const satisfactionOptions = [
  { level: 1, color: 'bg-red-500' },
  { level: 2, color: 'bg-orange-500' },
  { level: 3, color: 'bg-yellow-500' },
  { level: 4, color: 'bg-lime-500' },
  { level: 5, color: 'bg-green-500' },
];

const DayBlock: React.FC<DayBlockProps> = ({
  date,
  progressData,
  isToday,
  canInteract,
  onDayClick,
}) => {
  const dayOfMonth = date.getDate();
  const dayOfWeek = date.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();

  // Determine background color based on satisfaction level
  const bgColor = progressData
    ? satisfactionOptions.find(opt => opt.level === progressData.satisfactionLevel)?.color ||
      'bg-gray-700' // Fallback if level not found
    : 'bg-white/[0.05]'; // Default for no progress

  const textColor = progressData ? 'text-black' : 'text-white/70'; // Black text for colored blocks, white for others

  return (
    <button
      onClick={() => onDayClick(date, progressData)}
      disabled={!canInteract}
      className={`
        relative p-4 rounded-xl text-center flex flex-col justify-between items-center transition-all duration-200
        ${bgColor} ${textColor}
        ${isToday ? 'border-2 border-blue-500' : 'border border-white/10'}
        ${canInteract ? 'cursor-pointer hover:scale-105 hover:border-white/20' : 'opacity-50 cursor-not-allowed'}
        min-h-[100px] sm:min-h-[120px] // Ensure consistent size
      `}
    >
      <div className="absolute top-2 right-2 text-xs font-semibold">
        {date.toLocaleString('en-US', { month: 'short' }).toUpperCase()}
      </div>
      <span className="text-4xl font-bold">{dayOfMonth}</span>
      <span className="text-sm font-medium">{isToday ? 'TODAY' : dayOfWeek}</span>
    </button>
  );
};

export default DayBlock;
