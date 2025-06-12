// src/types/index.ts

import { Timestamp } from 'firebase/firestore';

/** Goal data structure. */
export interface Goal {
  name: string;
  description?: string;
  startDate: Timestamp; // Now exclusively Timestamp
  endDate: Timestamp; // Now exclusively Timestamp
}

/** Generic list item. */
export interface ListItem {
  text: string;
  id: number; // Unique ID
}

/** To-Do list item. */
export interface TodoItem extends ListItem {
  completed: boolean;
}

/** Overall application state. */
export interface AppState {
  goal: Goal | null;
  notToDoList: ListItem[];
  contextItems: ListItem[];
  toDoList: TodoItem[];
}

/** Developer information. */
export interface DeveloperInfo {
  name: string;
  title: string;
  email: string;
  linkedin: string;
  github: string;
  description: string;
}

/** Application operating mode. */
export type AppMode = 'guest' | 'google' | 'none';
