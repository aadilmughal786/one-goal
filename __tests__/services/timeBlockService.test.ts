/* eslint-disable @typescript-eslint/no-explicit-any */
// __tests__/services/timeBlockService.test.ts

import * as timeBlockService from '@/services/timeBlockService';
import { AppState, Goal, GoalStatus, TimeBlock } from '@/types';
import { ServiceError } from '@/utils/errors';
import { Timestamp, getDoc, updateDoc } from 'firebase/firestore';

// Mock the config module to prevent real Firebase initialization.
jest.mock('@/services/config', () => ({
  db: { type: 'firestore-mock' },
}));

// A mock document reference object to be returned by the mocked doc function.
const mockDocRef = { type: 'document-reference-mock' };

// Mock the entire 'firebase/firestore' module to prevent actual database calls.
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
 * @description Test suite for the Time Block Service.
 * This suite validates the core CRUD operations for managing time blocks associated with a user's goal.
 */
describe('Time Block Service', () => {
  let mockUserId: string;
  let mockGoalId: string;
  let mockTimeBlock: TimeBlock;
  let mockAppState: AppState;

  // This block runs before each test to set up a clean and consistent state.
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserId = 'test-user-id';
    mockGoalId = 'test-goal-id';

    // A standard mock time block for use in tests.
    mockTimeBlock = {
      id: 'block-1',
      label: 'Deep Work Session',
      startTime: '09:00',
      endTime: '11:00',
      color: '#38bdf8',
      completed: false,
      completedAt: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // A standard mock AppState containing one goal with one time block.
    const mockGoal: Goal = {
      id: mockGoalId,
      name: 'Test Goal',
      description: 'A goal for testing time blocks',
      startDate: Timestamp.now(),
      endDate: Timestamp.now(),
      status: GoalStatus.ACTIVE,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      dailyProgress: {},
      toDoList: [],
      notToDoList: [],
      stickyNotes: [],
      timeBlocks: [mockTimeBlock],
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

  // Test suite for the addTimeBlock function.
  describe('addTimeBlock', () => {
    it("should add a new time block to the goal's list", async () => {
      // Simulate that the user's document exists.
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      const newBlock = await timeBlockService.addTimeBlock(
        mockUserId,
        mockGoalId,
        'Review Meeting',
        '14:00',
        '15:00',
        '#f97316'
      );

      // Verify the new block has the correct properties.
      expect(newBlock.label).toBe('Review Meeting');
      expect(newBlock.color).toBe('#f97316');

      // Verify that updateDoc was called.
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedList = updateCall[1][`goals.${mockGoalId}.timeBlocks`];

      // Verify the new list contains both the original and the new block.
      expect(updatedList).toHaveLength(2);
      expect(updatedList.some((block: TimeBlock) => block.label === 'Review Meeting')).toBe(true);
    });

    it('should throw a ServiceError if the user document does not exist', async () => {
      // Simulate that the document does not exist.
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

      // Expect the function to reject with a specific error.
      await expect(
        timeBlockService.addTimeBlock(mockUserId, mockGoalId, 'label', '09:00', '10:00', '#ffffff')
      ).rejects.toThrow(new ServiceError('User data not found.'));
    });
  });

  // Test suite for the updateTimeBlock function.
  describe('updateTimeBlock', () => {
    it('should update the specified fields of a time block', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });
      const updates = { label: 'Focused Work', completed: true };

      await timeBlockService.updateTimeBlock(mockUserId, mockGoalId, 'block-1', updates);

      // Verify that updateDoc was called.
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedList = updateCall[1][`goals.${mockGoalId}.timeBlocks`];
      const updatedItem = updatedList.find((block: TimeBlock) => block.id === 'block-1');

      // Verify the item was updated correctly.
      expect(updatedItem.label).toBe('Focused Work');
      expect(updatedItem.completed).toBe(true);
      expect(updatedItem.updatedAt).toBeDefined();
    });
  });

  // Test suite for the deleteTimeBlock function.
  describe('deleteTimeBlock', () => {
    it('should remove the specified time block from the list', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      await timeBlockService.deleteTimeBlock(mockUserId, mockGoalId, 'block-1');

      // Verify that updateDoc was called.
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedList = updateCall[1][`goals.${mockGoalId}.timeBlocks`];

      // Verify the list is now empty.
      expect(updatedList).toHaveLength(0);
    });
  });
});
