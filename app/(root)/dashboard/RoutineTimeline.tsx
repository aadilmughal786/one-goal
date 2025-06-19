// app/components/dashboard/RoutineTimeline.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppState, ScheduledRoutineBase, RoutineType } from '@/types';
import { parse, differenceInMinutes, addMinutes, isWithinInterval } from 'date-fns';
import { FiClock, FiZap } from 'react-icons/fi';
import {
  MdOutlineNightlight,
  MdOutlineWaterDrop,
  MdOutlineDirectionsRun,
  MdOutlineRestaurant,
  MdOutlineCleaningServices,
  MdOutlineShower,
  MdBedtime,
} from 'react-icons/md';
import { IconType } from 'react-icons';
import Link from 'next/link';

// Mapping routine types to icons for display
const routineIcons: Record<string, IconType> = {
  [RoutineType.SLEEP]: MdBedtime,
  [RoutineType.BATH]: MdOutlineShower,
  [RoutineType.EXERCISE]: MdOutlineDirectionsRun,
  [RoutineType.MEALS]: MdOutlineRestaurant,
  [RoutineType.TEETH]: MdOutlineCleaningServices,
  // Water is not scheduled, so it won't appear here, but we can keep it for completeness
  [RoutineType.WATER]: MdOutlineWaterDrop,
};

interface RoutineTimelineProps {
  appState: AppState | null;
}

// A type for the flattened schedule items for easier processing
type TimelineItem = ScheduledRoutineBase & {
  type: RoutineType;
  minutesUntil?: number;
  isCurrent?: boolean;
};

const RoutineTimeline: React.FC<RoutineTimelineProps> = ({ appState }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update the current time every minute to refresh the component's view
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const allEvents = useMemo(() => {
    if (!appState?.routineSettings) {
      return [];
    }

    const now = currentTime;
    const allSchedules: TimelineItem[] = [];
    const { routineSettings } = appState;

    // Flatten all schedules into a single array with their types
    (routineSettings.bath || []).forEach(item =>
      allSchedules.push({ ...item, type: RoutineType.BATH })
    );
    (routineSettings.exercise || []).forEach(item =>
      allSchedules.push({ ...item, type: RoutineType.EXERCISE })
    );
    (routineSettings.meals || []).forEach(item =>
      allSchedules.push({ ...item, type: RoutineType.MEALS })
    );
    (routineSettings.teeth || []).forEach(item =>
      allSchedules.push({ ...item, type: RoutineType.TEETH })
    );
    // Add naps to the timeline
    (routineSettings.sleep?.napSchedule || []).forEach(item =>
      allSchedules.push({ ...item, type: RoutineType.SLEEP })
    );

    const relevantEvents: TimelineItem[] = [];

    allSchedules.forEach(item => {
      if (item.completed) return; // Skip completed items

      const startTime = parse(item.scheduledTime, 'HH:mm', now);
      const endTime = addMinutes(startTime, item.durationMinutes);

      // Check for currently active events
      if (isWithinInterval(now, { start: startTime, end: endTime })) {
        relevantEvents.push({ ...item, isCurrent: true });
        return; // Don't add it again as upcoming
      }

      // Check for upcoming events within the next 60 minutes
      const minutesUntilStart = differenceInMinutes(startTime, now);
      if (minutesUntilStart > 0 && minutesUntilStart <= 60) {
        relevantEvents.push({ ...item, minutesUntil: minutesUntilStart, isCurrent: false });
      }
    });

    // Sort all relevant events chronologically
    relevantEvents.sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return (a.minutesUntil || 0) - (b.minutesUntil || 0);
    });

    return relevantEvents;
  }, [appState, currentTime]);

  const renderEventItem = (item: TimelineItem) => {
    const Icon = routineIcons[item.type] || MdOutlineNightlight;
    const timeLeft = item.minutesUntil ? `in ${item.minutesUntil}m` : '';
    const statusColor = item.isCurrent ? 'text-green-400' : 'text-amber-400';
    const statusIcon = item.isCurrent ? <FiZap /> : <FiClock />;

    return (
      <div
        key={`${item.type}-${item.label}-${item.scheduledTime}`}
        className="flex gap-4 items-center p-3 rounded-lg bg-white/5"
      >
        <div
          className={`flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-full bg-white/10 ${statusColor}`}
        >
          <Icon size={22} />
        </div>
        <div className="flex-grow">
          <p className="font-semibold text-white">{item.label}</p>
          <p className="text-sm text-white/70">
            {item.scheduledTime} for {item.durationMinutes} min
          </p>
        </div>
        <div
          className={`flex-shrink-0 flex items-center gap-1.5 text-sm font-medium ${statusColor}`}
        >
          {statusIcon}
          <span>{item.isCurrent ? 'Now' : timeLeft}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 sm:p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
      <div className="mb-6 text-center">
        <h3 className="mb-2 text-2xl font-bold">Today&apos;s Routine Timeline</h3>
        <p className="mx-auto max-w-2xl text-white/60">
          A unified view of what&apos;s happening now and what&apos;s coming up next in your
          schedule.
        </p>
      </div>

      <div className="space-y-3">
        {allEvents.length > 0 ? (
          allEvents.map(item => renderEventItem(item))
        ) : (
          <div className="py-8 text-center text-white/50">
            <p className="text-lg">All clear for now!</p>
            <p className="mt-1 text-sm">No routines are active or scheduled for the next hour.</p>
            <Link
              href="/routine"
              className="inline-block mt-4 text-sm text-blue-400 hover:underline"
            >
              Plan your day
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutineTimeline;
