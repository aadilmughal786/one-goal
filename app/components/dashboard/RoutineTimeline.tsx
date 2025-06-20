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
  MdOutlineRestaurant, // Changed from MdOutlineRestaurantMenu to MdOutlineRestaurant as per types
  MdOutlineCleaningServices,
  MdOutlineShower,
  MdBedtime,
} from 'react-icons/md';
import { IconType } from 'react-icons';
import Link from 'next/link';

// Mapping routine types to icons for display.
// Note: RoutineType.MEAL is singular as per your types.
const routineIcons: Record<RoutineType, IconType> = {
  [RoutineType.SLEEP]: MdBedtime,
  [RoutineType.BATH]: MdOutlineShower,
  [RoutineType.EXERCISE]: MdOutlineDirectionsRun,
  [RoutineType.MEAL]: MdOutlineRestaurant, // Corrected to RoutineType.MEAL
  [RoutineType.TEETH]: MdOutlineCleaningServices,
  [RoutineType.WATER]: MdOutlineWaterDrop, // Water is not scheduled, but kept for completeness
};

interface RoutineTimelineProps {
  appState: AppState | null;
}

// A type for the flattened schedule items for easier processing in the timeline.
// Extends ScheduledRoutineBase and adds runtime calculation properties.
type TimelineItem = ScheduledRoutineBase & {
  type: RoutineType;
  minutesUntil?: number; // Minutes until the routine starts
  isCurrent?: boolean; // True if the routine is currently active
  isPast?: boolean; // True if the routine's time has passed
};

/**
 * RoutineTimeline Component
 *
 * Displays a chronological timeline of today's scheduled routines,
 * highlighting currently active and upcoming events.
 */
const RoutineTimeline: React.FC<RoutineTimelineProps> = ({ appState }) => {
  // State to hold the current time, updated every minute to refresh the timeline view.
  const [currentTime, setCurrentTime] = useState(new Date());

  // Effect to set up an interval to update `currentTime` every minute.
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every 60 seconds (1 minute)
    return () => clearInterval(timer); // Cleanup interval on component unmount
  }, []); // Empty dependency array means this effect runs once on mount.

  /**
   * Memoized computation of all relevant routine events for the timeline.
   * Flattens all scheduled routines, filters for active/upcoming events, and sorts them.
   */
  const allEvents = useMemo(() => {
    // Get the currently active goal from appState
    const activeGoal = appState?.activeGoalId ? appState.goals[appState.activeGoalId] : null;

    // Return empty array if no active goal or its routine settings are available.
    if (!activeGoal?.routineSettings) {
      return [];
    }

    const now = currentTime; // Current time for calculations
    const allSchedules: TimelineItem[] = []; // Temporary array to hold all flattened schedules
    const { routineSettings } = activeGoal; // Access routineSettings from the active goal

    // Flatten all types of scheduled routines into a single array, adding their RoutineType.
    (routineSettings.bath || []).forEach(item =>
      allSchedules.push({ ...item, type: RoutineType.BATH })
    );
    (routineSettings.exercise || []).forEach(item =>
      allSchedules.push({ ...item, type: RoutineType.EXERCISE })
    );
    (routineSettings.meal || []).forEach(
      (
        item // Corrected to routineSettings.meal
      ) => allSchedules.push({ ...item, type: RoutineType.MEAL }) // Corrected to RoutineType.MEAL
    );
    (routineSettings.teeth || []).forEach(item =>
      allSchedules.push({ ...item, type: RoutineType.TEETH })
    );
    // Add naps (part of sleep routine) to the timeline
    (routineSettings.sleep?.naps || []).forEach(
      (
        item // Corrected from napSchedule to naps
      ) => allSchedules.push({ ...item, type: RoutineType.SLEEP })
    );

    const relevantEvents: TimelineItem[] = []; // Array to store events relevant for the timeline display

    allSchedules.forEach(item => {
      // Skip schedules that are marked as completed for today.
      if (item.completed) return;

      // Parse scheduled time (HH:mm) into a Date object for today.
      const startTime = parse(item.time, 'HH:mm', now); // Use item.time
      const endTime = addMinutes(startTime, item.duration); // Use item.duration

      // Determine if the event is currently active (in progress).
      if (isWithinInterval(now, { start: startTime, end: endTime })) {
        relevantEvents.push({ ...item, isCurrent: true, isPast: false });
        return; // If current, don't also add it as upcoming
      }

      // Determine if the event is in the past (missed).
      if (now > endTime) {
        // If it's already past its end time, and not completed, it's missed for the timeline.
        // We might choose to display these, or just filter them out. For this timeline, we'll include it with isPast.
        relevantEvents.push({ ...item, isCurrent: false, isPast: true });
        return;
      }

      // Check for upcoming events within the next 60 minutes.
      const minutesUntilStart = differenceInMinutes(startTime, now);
      if (minutesUntilStart > 0 && minutesUntilStart <= 60) {
        relevantEvents.push({
          ...item,
          minutesUntil: minutesUntilStart,
          isCurrent: false,
          isPast: false,
        });
      }
    });

    // Sort relevant events: current events first, then by earliest upcoming.
    relevantEvents.sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1; // Current events come first
      if (!a.isCurrent && b.isCurrent) return 1; // Current events come first
      if (a.isPast && !b.isPast) return 1; // Past events come last
      if (!a.isPast && b.isPast) return -1; // Past events come last
      // For current/upcoming events, sort by time until start
      return (a.minutesUntil || 0) - (b.minutesUntil || 0);
    });

    return relevantEvents;
  }, [appState, currentTime]); // Dependencies: re-run if appState or currentTime changes.

  /**
   * Renders a single event item in the timeline.
   * @param item The TimelineItem to render.
   * @returns ReactNode representing the event in the timeline.
   */
  const renderEventItem = (item: TimelineItem) => {
    const Icon = routineIcons[item.type] || MdOutlineNightlight; // Get icon based on routine type
    const timeLeft = item.minutesUntil ? `in ${item.minutesUntil}m` : '';
    // Determine status color and icon based on whether it's current, upcoming, or past.
    let statusColor = '';
    let statusIcon: React.ReactNode = null;
    let statusText = '';

    if (item.isCurrent) {
      statusColor = 'text-green-400';
      statusIcon = <FiZap />;
      statusText = 'Now';
    } else if (item.isPast) {
      statusColor = 'text-red-400';
      statusIcon = <FiClock />; // Could use a "missed" icon too
      statusText = 'Missed';
    } else {
      // Upcoming
      statusColor = 'text-amber-400';
      statusIcon = <FiClock />;
      statusText = timeLeft;
    }

    return (
      <div
        key={`${item.type}-${item.label}-${item.time}`} // Use item.time for key
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
            {item.time} for {item.duration} min {/* Use item.time and item.duration */}
          </p>
        </div>
        <div
          className={`flex-shrink-0 flex items-center gap-1.5 text-sm font-medium ${statusColor}`}
        >
          {statusIcon}
          <span>{statusText}</span>
        </div>
      </div>
    );
  };

  // Display a message if no active goal is selected, guiding the user.
  if (!appState?.activeGoalId || !appState.goals[appState.activeGoalId]) {
    return (
      <div className="p-6 sm:p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl text-center text-white/60">
        <FiClock className="mx-auto mb-4 text-4xl" />
        <h3 className="mb-2 text-2xl font-bold">No Active Goal</h3>
        <p className="mx-auto max-w-2xl">
          Please select an active goal from your Dashboard to see your routine timeline.
        </p>
        <Link href="/dashboard" className="inline-block mt-4 text-sm text-blue-400 hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

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
            <p className="mt-1 text-sm">No routines are active, upcoming, or missed today.</p>
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
