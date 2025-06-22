/* eslint-disable @typescript-eslint/no-explicit-any */
// app/services/dataService.ts
import { AppState, Goal } from '@/types';
import { Timestamp } from 'firebase/firestore';

/**
 * @file app/services/dataService.ts
 * @description Data Serialization and Deserialization Service.
 *
 * This module is responsible for the complex logic of converting the application's
 * state to a JSON-compatible format for export, and deserializing it back into
 * Firebase-compatible objects (with Timestamps) upon import. This separation of
 * concerns keeps the main data services cleaner.
 */

/**
 * Recursively traverses an object or array and converts all Firebase Timestamp
 * instances into ISO 8601 date strings.
 * @param data The object or array to process.
 * @returns A new object or array with Timestamps converted to strings.
 */
const _serializeTimestamps = (data: any): any => {
  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }
  if (Array.isArray(data)) {
    return data.map(_serializeTimestamps);
  }
  // Check for a plain object to avoid trying to iterate over other classes
  if (data !== null && typeof data === 'object' && data.constructor === Object) {
    const newObj: { [key: string]: any } = {};
    for (const key in data) {
      newObj[key] = _serializeTimestamps(data[key]);
    }
    return newObj;
  }
  return data;
};

/**
 * Recursively traverses an object or array and converts all valid ISO 8601
 * date strings back into Firebase Timestamp instances.
 * @param data The object or array to process, typically from a parsed JSON file.
 * @returns A new object or array with ISO strings converted to Timestamps.
 */
const _deserializeTimestamps = (data: any): any => {
  // Regex to check for a valid ISO 8601 format (e.g., "2023-10-27T10:00:00.000Z")
  if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(data)) {
    const date = new Date(data);
    if (!isNaN(date.getTime())) {
      return Timestamp.fromDate(date);
    }
  }
  if (Array.isArray(data)) {
    return data.map(_deserializeTimestamps);
  }
  if (data !== null && typeof data === 'object' && data.constructor === Object) {
    const newObj: { [key: string]: any } = {};
    for (const key in data) {
      newObj[key] = _deserializeTimestamps(data[key]);
    }
    return newObj;
  }
  return data;
};

/**
 * Serializes the entire AppState object into a JSON-friendly format.
 * @param appState The AppState object to serialize.
 * @returns A plain JavaScript object suitable for `JSON.stringify`.
 */
export const serializeAppStateForExport = (appState: AppState): object => {
  return _serializeTimestamps(appState);
};

/**
 * Serializes a single Goal object into a JSON-friendly format.
 * @param goal The Goal object to serialize.
 * @returns A plain JavaScript object suitable for `JSON.stringify`.
 */
export const serializeGoalForExport = (goal: Goal): object => {
  return _serializeTimestamps(goal);
};

/**
 * Deserializes a plain JavaScript object (from an imported JSON file) back
 * into a valid AppState object.
 * @param importedData The raw data parsed from a JSON file.
 * @returns An AppState object ready to be saved to Firestore.
 */
export const deserializeAppStateForImport = (importedData: object): AppState => {
  return _deserializeTimestamps(importedData);
};

/**
 * Deserializes a plain JavaScript object (from an imported JSON file) back
 * into a valid Goal object.
 * @param importedData The raw data parsed from a JSON file.
 * @returns A Goal object ready to be saved to Firestore.
 */
export const deserializeGoalForImport = (importedData: object): Goal => {
  return _deserializeTimestamps(importedData);
};
