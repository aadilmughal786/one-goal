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
