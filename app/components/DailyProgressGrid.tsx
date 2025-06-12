// app/components/DailyProgressGrid.tsx
'use client';

import React from 'react';
import { AppState, DailyProgress, Goal } from '@/types';
import DayBlock from './DayBlock';
import { Timestamp } from 'firebase/firestore';

interface DailyProgressGridProps {
  goal: Goal | null;
  dailyProgress: DailyProgress[];
  onDayClick: (date: Date, initialProgress?: DailyProgress | null) => void;
}

const DailyProgressGrid: React.FC<DailyProgressGridProps> = ({
  goal,
  dailyProgress,
  onDayClick,
}) => {
  if (!goal) {
    return (
      <div className="py-10 text-center text-white/60">No goal set to display daily progress.</div>
    );
  }

  const startDate = goal.startDate.toDate();
  const endDate = goal.endDate.toDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to start of day

  const dayBlocks = [];
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0); // Normalize start date to start of day

  // Create a map for quick lookup of existing daily progress
  const progressMap = new Map<string, DailyProgress>();
  dailyProgress.forEach(item => {
    // Ensure date is a Date object for consistent key generation
    const itemDate = item.date instanceof Timestamp ? item.date.toDate() : item.date;
    progressMap.set(itemDate.toISOString().slice(0, 10), item);
  });

  const getDayKey = (date: Date) => date.toISOString().slice(0, 10);

  let currentMonth = -1; // To track month changes for UI separation

  while (currentDate <= endDate) {
    const dayOfMonth = currentDate.getDate();
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const isPastDay = currentDate < today;
    const isToday = currentDate.toDateString() === today.toDateString();
    const dayKey = getDayKey(currentDate);
    const existingProgress = progressMap.get(dayKey);

    // Add a month separator if the month changes or if it's the very first day block
    if (month !== currentMonth) {
      dayBlocks.push(
        <div key={`month-${month}-${year}`} className="col-span-full py-4 text-center">
          <h3 className="text-xl font-bold text-white">
            {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
        </div>
      );
      currentMonth = month;
    }

    const canInteract = isPastDay || isToday; // Only interact with past days or today

    dayBlocks.push(
      <DayBlock
        key={currentDate.toISOString()}
        date={new Date(currentDate)} // Pass a new Date object to prevent mutation issues
        progressData={existingProgress}
        isToday={isToday}
        canInteract={canInteract}
        onDayClick={onDayClick}
      />
    );

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return (
    <div className="grid grid-cols-4 gap-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-14 xl:grid-cols-10">
      {dayBlocks}
    </div>
  );
};

export default DailyProgressGrid;
