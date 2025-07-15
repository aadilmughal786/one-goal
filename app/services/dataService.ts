// app/services/dataService.ts
import { Goal } from '@/types';
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

const generateUUID = () => crypto.randomUUID();

/**
 * Recursively traverses an object or array and converts all Firebase Timestamp
 * instances into ISO 8601 date strings.
 * @param data The object or array to process.
 * @returns A new object or array with Timestamps converted to strings.
 */
const _serializeTimestamps = (data: unknown): unknown => {
  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }
  if (Array.isArray(data)) {
    return data.map(_serializeTimestamps);
  }
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    const newObj: { [key: string]: unknown } = {};
    for (const key in data as { [key: string]: unknown }) {
      newObj[key] = _serializeTimestamps((data as { [key: string]: unknown })[key]);
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
const _deserializeTimestamps = (data: unknown): unknown => {
  if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(data)) {
    const date = new Date(data);
    if (!isNaN(date.getTime())) {
      return Timestamp.fromDate(date);
    }
  }
  if (Array.isArray(data)) {
    return data.map(_deserializeTimestamps);
  }
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    const newObj: { [key: string]: unknown } = {};
    for (const key in data as { [key: string]: unknown }) {
      newObj[key] = _deserializeTimestamps((data as { [key: string]: unknown })[key]);
    }
    return newObj;
  }
  return data;
};

/**
 * Serializes an array of Goal objects into a JSON-friendly format.
 * This function ensures the output is always an array of goals.
 * @param goals The array of Goal objects to serialize.
 * @returns An array of plain JavaScript objects suitable for `JSON.stringify`.
 */
export const serializeGoalsForExport = (goals: Goal[]): object[] => {
  // This line is key: It takes an array of Goal objects as input
  // and processes it, ensuring the output is always an array.
  return _serializeTimestamps(goals) as object[];
};

/**
 * Deserializes an array of plain JavaScript objects (from an imported JSON file) back
 * into a valid array of Goal objects, regenerating their top-level IDs to prevent conflicts.
 * @param importedData The raw data array parsed from a JSON file.
 * @returns An array of Goal objects ready to be saved to Firestore.
 */
export const deserializeGoalsForImport = (importedData: object[]): Goal[] => {
  const deserialized = _deserializeTimestamps(importedData) as Goal[];
  // Regenerate IDs for each goal to avoid conflicts on re-import.
  return deserialized.map(goal => ({
    ...goal,
    id: generateUUID(),
  }));
};
