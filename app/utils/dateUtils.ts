// app/utils/dateUtils.ts
import { format, formatDistanceToNowStrict, isPast, isToday, isTomorrow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

/**
 * @file app/utils/dateUtils.ts
 * @description Centralized utility functions for date and time formatting.
 *
 * This module provides a single, consistent place for all date-related logic,
 * ensuring that timestamps are formatted uniformly across the entire application.
 */

/**
 * Formats a Firebase Timestamp into a simple date string (e.g., "Jun 23, 2025").
 * @param timestamp The Firebase Timestamp to format.
 * @returns A formatted date string or 'N/A' if the timestamp is null.
 */
export const formatDate = (timestamp: Timestamp | null): string => {
  if (!timestamp) return 'N/A';
  return format(timestamp.toDate(), 'MMM d, yyyy');
};

/**
 * Formats a Firebase Timestamp into a simple time string (e.g., "4:01 PM").
 * @param timestamp The Firebase Timestamp to format.
 * @returns A formatted time string or an empty string if the timestamp is null.
 */
export const formatTime = (timestamp: Timestamp | null): string => {
  if (!timestamp) return '';
  return format(timestamp.toDate(), 'h:mm a');
};

/**
 * Calculates and formats the relative time to a deadline.
 * @param deadline The Firebase Timestamp of the deadline.
 * @returns A human-readable string like "Due Today", "Ended 2 days ago", or "Due in 3 weeks".
 */
export const formatRelativeTime = (deadline: Timestamp | null): string => {
  if (!deadline) return '';
  const date = deadline.toDate();

  if (isToday(date)) return 'Due Today';
  if (isTomorrow(date)) return 'Due Tomorrow';
  if (isPast(date)) return `Ended ${formatDistanceToNowStrict(date, { addSuffix: true })}`;

  return `Due in ${formatDistanceToNowStrict(date)}`;
};

/**
 * Formats milliseconds into a stopwatch display object.
 * @param ms The time in milliseconds.
 * @returns An object with minutes, seconds, and centiseconds.
 */
export const formatStopwatchTime = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const centiseconds = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
  return { minutes, seconds, centiseconds };
};

/**
 * Formats a duration in milliseconds into a human-readable string (e.g., "1h 30m 15s").
 * @param ms The duration in milliseconds.
 * @returns A formatted string representing the total time.
 */
export const formatTotalTime = (ms: number): string => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  // Always show seconds if there are no hours or minutes, or if seconds > 0
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}s`);
  }

  return parts.join(' ');
};
