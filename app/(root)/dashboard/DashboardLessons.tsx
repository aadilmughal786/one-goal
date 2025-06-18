// app/(root)/dashboard/DashboardLessons.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { AppState, ListItem } from '@/types';
import { FiChevronLeft, FiChevronRight, FiBookOpen } from 'react-icons/fi';
import { RiAlarmWarningLine } from 'react-icons/ri';
import Link from 'next/link';

// Define a type for the combined list item for clarity
type LessonItem = ListItem & { type: 'learning' | 'avoid' };

interface DashboardLessonsProps {
  appState: AppState | null;
}

const DashboardLessons: React.FC<DashboardLessonsProps> = ({ appState }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine and memoize the two lists, sorting them by creation date
  const allLessons = useMemo(() => {
    const learnings: LessonItem[] = (appState?.contextList || []).map(item => ({
      ...item,
      type: 'learning',
    }));
    const avoids: LessonItem[] = (appState?.notToDoList || []).map(item => ({
      ...item,
      type: 'avoid',
    }));

    // Sort by creation date, most recent first
    return [...learnings, ...avoids].sort(
      (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
    );
  }, [appState?.contextList, appState?.notToDoList]);

  const handleNext = () => {
    if (allLessons.length > 0) {
      setCurrentIndex(prevIndex => (prevIndex + 1) % allLessons.length);
    }
  };

  const handlePrev = () => {
    if (allLessons.length > 0) {
      setCurrentIndex(prevIndex => (prevIndex - 1 + allLessons.length) % allLessons.length);
    }
  };

  // Display a message if there are no items in either list
  if (!allLessons || allLessons.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center p-10 h-full text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
        <FiBookOpen className="mx-auto mb-6 w-20 h-20 text-white/70" />
        <h2 className="mb-4 text-3xl font-bold text-white">No Lessons or Notes Found</h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
          Your insights and anti-goals will appear here once you add them on the Lists page.
        </p>
        <Link
          href="/list"
          className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105"
        >
          <FiBookOpen size={20} />
          Go to Lists to Add Items
        </Link>
      </div>
    );
  }

  const currentLesson = allLessons[currentIndex];

  // Define themes for the two types of cards
  const cardTheme = {
    learning: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-400/30',
      icon: <FiBookOpen size={24} className="text-blue-400" />,
      title: 'Learning / Note',
    },
    avoid: {
      bg: 'bg-red-500/10',
      border: 'border-red-400/30',
      icon: <RiAlarmWarningLine size={24} className="text-red-400" />,
      title: 'What to Avoid',
    },
  };
  const theme = cardTheme[currentLesson.type];

  return (
    <section>
      <div className="mb-8 text-center">
        <h3 className="mb-2 text-2xl font-bold">Review Your Learnings</h3>
        <p className="mx-auto max-w-2xl text-white/60">
          Cycle through your important notes and anti-goals to keep them top-of-mind.
        </p>
      </div>

      <div
        className={`rounded-2xl shadow-lg transition-all duration-300 ${theme.bg} ${theme.border}`}
      >
        {/* Card Header */}
        <div className="flex justify-between items-center p-6">
          <div className="flex gap-3 items-center">
            {theme.icon}
            <h4 className="text-lg font-semibold">{theme.title}</h4>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={handlePrev}
              className="p-2 rounded-full transition-colors cursor-pointer bg-white/5 hover:bg-white/10"
              aria-label="Previous lesson"
            >
              <FiChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-full transition-colors cursor-pointer bg-white/5 hover:bg-white/10"
              aria-label="Next lesson"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="min-h-[180px] flex flex-col justify-center items-center text-center p-4 border-t border-b border-white/5">
          <p className="text-2xl italic text-white/90">&quot;{currentLesson.text}&quot;</p>
        </div>

        {/* Card Footer / Position Indicator */}
        <div className="p-6 text-sm text-center text-white/60">
          {currentIndex + 1} / {allLessons.length}
        </div>
      </div>
    </section>
  );
};

export default DashboardLessons;
