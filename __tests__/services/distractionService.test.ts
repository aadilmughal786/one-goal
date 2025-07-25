/* eslint-disable @typescript-eslint/no-explicit-any */
// __tests__/services/distractionService.test.ts

import * as distractionService from '@/services/distractionService';
import { AppState, DistractionItem, Goal, GoalStatus } from '@/types';
import { ServiceError } from '@/utils/errors';
import { Timestamp, getDoc, updateDoc } from 'firebase/firestore';

// Mock the config module to prevent real Firebase initialization.
jest.mock('@/services/config', () => ({
  db: { type: 'firestore-mock' },
}));

// A mock document reference object to be returned by the mocked doc function.
const mockDocRef = { type: 'document-reference-mock' };

// Mock the entire 'firebase/firestore' module to isolate the service from actual database calls.
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
 * @description Test suite for the Distraction Service.
 * This suite ensures that all CRUD (Create, Read, Update, Delete) operations for distraction items
 * function correctly and handle edge cases gracefully.
 */
describe('Distraction Service', () => {
  let mockUserId: string;
  let mockGoalId: string;
  let mockDistractionItem: DistractionItem;
  let mockAppState: AppState;

  // This block runs before each test, setting up a consistent state and mock data.
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserId = 'test-user-id';
    mockGoalId = 'test-goal-id';

    // A standard mock distraction item for use in tests.
    mockDistractionItem = {
      id: 'distraction-1',
      title: 'Scrolling social media',
      description: 'Mindless scrolling on phone',
      triggerPatterns: ['boredom', 'procrastination'],
      count: 5,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // A standard mock AppState containing one goal with one distraction item.
    const mockGoal: Goal = {
      id: mockGoalId,
      name: 'Test Goal',
      description: 'A goal for testing distractions',
      startDate: Timestamp.now(),
      endDate: Timestamp.now(),
      status: GoalStatus.ACTIVE,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      dailyProgress: {},
      toDoList: [],
      notToDoList: [mockDistractionItem],
      stickyNotes: [],
      timeBlocks: [],
      randomPickerItems: [],
      resources: [],
      routineSettings: {} as any,
      wellnessSettings: {} as any,
      starredQuotes: [],
      financeData: null,
      catchingTheFrogTasks: [],
    };

    mockAppState = {
      activeGoalId: mockGoalId,
      goals: { [mockGoalId]: mockGoal },
    };
  });

  // Test suite for the addDistractionItem function.
  describe('addDistractionItem', () => {
    it('should add a new distraction item to the list', async () => {
      // Simulate that the user's document exists.
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      const newItemTitle = 'Watching too much TV';
      const newItem = await distractionService.addDistractionItem(
        mockUserId,
        mockGoalId,
        newItemTitle
      );

      // Verify the new item has the correct default properties.
      expect(newItem.title).toBe(newItemTitle);
      expect(newItem.count).toBe(0);
      expect(newItem.triggerPatterns).toEqual([]);

      // Verify that updateDoc was called.
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedList = updateCall[1][`goals.${mockGoalId}.notToDoList`];

      // Verify the new list contains the added item.
      expect(updatedList).toHaveLength(2);
      expect(updatedList.some((item: DistractionItem) => item.title === newItemTitle)).toBe(true);
    });

    it('should throw a ServiceError if the goal does not exist', async () => {
      // Simulate a state where the specified goalId is not in the user's data.
      const appStateWithoutGoal = { activeGoalId: null, goals: {} };
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => appStateWithoutGoal,
      });

      // Expect the function to reject with a specific error.
      await expect(
        distractionService.addDistractionItem(mockUserId, mockGoalId, 'title')
      ).rejects.toThrow(new ServiceError(`Goal with ID ${mockGoalId} not found.`));
    });
  });

  // Test suite for the updateDistractionItem function.
  describe('updateDistractionItem', () => {
    it('should update the specified fields of a distraction item', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });
      const updates = { title: 'Updated Title', count: 10 };

      await distractionService.updateDistractionItem(
        mockUserId,
        mockGoalId,
        'distraction-1',
        updates
      );

      // Verify that updateDoc was called.
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedList = updateCall[1][`goals.${mockGoalId}.notToDoList`];
      const updatedItem = updatedList.find((item: DistractionItem) => item.id === 'distraction-1');

      // Verify the item was updated correctly.
      expect(updatedItem.title).toBe('Updated Title');
      expect(updatedItem.count).toBe(10);
      expect(updatedItem.updatedAt).toBeDefined();
    });
  });

  // Test suite for the deleteDistractionItem function.
  describe('deleteDistractionItem', () => {
    it('should remove the specified distraction item from the list', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      await distractionService.deleteDistractionItem(mockUserId, mockGoalId, 'distraction-1');

      // Verify that updateDoc was called.
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedList = updateCall[1][`goals.${mockGoalId}.notToDoList`];

      // Verify the list is now empty.
      expect(updatedList).toHaveLength(0);
    });
  });
});
