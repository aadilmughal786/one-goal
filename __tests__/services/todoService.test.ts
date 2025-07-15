/* eslint-disable @typescript-eslint/no-explicit-any */
// __tests__/services/todoService.test.ts

import * as todoService from '@/services/todoService';
import { AppState, Goal, GoalStatus, TodoItem } from '@/types';
import { ServiceError } from '@/utils/errors';
import { Timestamp, getDoc, updateDoc } from 'firebase/firestore';

// Mock the config module to prevent real Firebase initialization.
jest.mock('@/services/config', () => ({
  db: { type: 'firestore-mock' },
}));

// A mock document reference object to be returned by the mocked doc function.
const mockDocRef = { type: 'document-reference-mock' };

// Mock the entire 'firebase/firestore' module to control its behavior during tests.
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => mockDocRef),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn(date => ({ toDate: () => date })),
  },
}));

/**
 * @description Test suite for the To-Do Service.
 * This suite validates the functionality for adding, updating, deleting, and reordering to-do items
 * within a user's goal.
 */
describe('To-Do Service', () => {
  let mockUserId: string;
  let mockGoalId: string;
  let mockTodoItem: TodoItem;
  let mockAppState: AppState;

  // This block runs before each test to initialize fresh mock data, ensuring test isolation.
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserId = 'test-user-id';
    mockGoalId = 'test-goal-id';

    // A standard mock to-do item for use in tests.
    mockTodoItem = {
      id: 'todo-1',
      text: 'Initial to-do',
      description: null,
      order: 0,
      completed: false,
      completedAt: null,
      deadline: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // A standard mock AppState containing one goal with one to-do item.
    const mockGoal: Goal = {
      id: mockGoalId,
      name: 'Test Goal',
      description: 'A goal for testing',
      startDate: Timestamp.now(),
      endDate: Timestamp.now(),
      status: GoalStatus.ACTIVE,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      dailyProgress: {},
      toDoList: [mockTodoItem],
      notToDoList: [],
      stickyNotes: [],
      timeBlocks: [],
      randomPickerItems: [],
      resources: [],
      routineSettings: {} as any,
      wellnessSettings: {} as any,
      starredQuotes: [],
      financeData: null,
    };

    mockAppState = {
      activeGoalId: mockGoalId,
      goals: { [mockGoalId]: mockGoal },
    };
  });

  // Test suite for the addTodoItem function.
  describe('addTodoItem', () => {
    it('should add a new to-do item to the beginning of the list and reorder existing items', async () => {
      // Simulate that the user's document exists.
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      const newItemText = 'A new task';
      const newItem = await todoService.addTodoItem(mockUserId, mockGoalId, newItemText);

      // Verify the new item has the correct properties.
      expect(newItem.text).toBe(newItemText);
      expect(newItem.order).toBe(0);

      // Verify that updateDoc was called.
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedList = updateCall[1][`goals.${mockGoalId}.toDoList`];

      // Verify the new list structure is correct.
      expect(updatedList).toHaveLength(2);
      expect(updatedList[0].text).toBe(newItemText); // New item is at the top.
      expect(updatedList[1].text).toBe('Initial to-do');
      expect(updatedList[1].order).toBe(1); // Original item's order is incremented.
    });

    it('should throw a ServiceError if the user document does not exist', async () => {
      // Simulate that the document does not exist.
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

      // Expect the function to reject with a specific error.
      await expect(todoService.addTodoItem(mockUserId, mockGoalId, 'text')).rejects.toThrow(
        new ServiceError('User data not found.')
      );
    });
  });

  // Test suite for the updateTodoItem function.
  describe('updateTodoItem', () => {
    it('should update the specified fields of a to-do item', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });
      const updates = { text: 'Updated text', completed: true };

      await todoService.updateTodoItem(mockUserId, mockGoalId, 'todo-1', updates);

      // Verify that updateDoc was called.
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedList = updateCall[1][`goals.${mockGoalId}.toDoList`];
      const updatedItem = updatedList.find((item: TodoItem) => item.id === 'todo-1');

      // Verify the item was updated correctly.
      expect(updatedItem.text).toBe('Updated text');
      expect(updatedItem.completed).toBe(true);
      expect(updatedItem.completedAt).toBeDefined(); // completedAt should be set.
    });
  });

  // Test suite for the deleteTodoItem function.
  describe('deleteTodoItem', () => {
    it('should remove the specified to-do item from the list', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      await todoService.deleteTodoItem(mockUserId, mockGoalId, 'todo-1');

      // Verify that updateDoc was called.
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedList = updateCall[1][`goals.${mockGoalId}.toDoList`];

      // Verify the list is now empty.
      expect(updatedList).toHaveLength(0);
    });
  });

  // Test suite for the updateTodoListOrder function.
  describe('updateTodoListOrder', () => {
    it('should replace the entire list with the reordered list', async () => {
      const reorderedList: TodoItem[] = [
        { ...mockTodoItem, id: 'todo-2', order: 0, text: 'Second Item' },
        { ...mockTodoItem, id: 'todo-1', order: 1, text: 'First Item' },
      ];

      await todoService.updateTodoListOrder(mockUserId, mockGoalId, reorderedList);

      // Verify that updateDoc was called.
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedListPayload = updateCall[1][`goals.${mockGoalId}.toDoList`];

      // Verify the payload matches the reordered list exactly.
      expect(updatedListPayload).toHaveLength(2);
      expect(updatedListPayload[0].id).toBe('todo-2');
      expect(updatedListPayload[1].id).toBe('todo-1');
      // Verify that updatedAt was added to each item.
      expect(updatedListPayload[0].updatedAt).toBeDefined();
    });
  });
});
