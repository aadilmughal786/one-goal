// __tests__/services/goalService.test.ts

import { db } from '@/services/config'; // Import the mocked db object
import * as goalService from '@/services/goalService';
import { AppState, Goal, GoalStatus, ReminderType } from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { appStateSchema } from '@/utils/schemas';
import { Timestamp, deleteField, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Mock the config module to provide a mock 'db' instance.
jest.mock('@/services/config', () => ({
  db: { type: 'firestore-mock' }, // A simple mock object is sufficient.
}));

// Mock the entire 'firebase/firestore' module
jest.mock('firebase/firestore', () => ({
  // REVISION: Import the actual module to access its exports inside the factory
  ...jest.requireActual('firebase/firestore'),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteField: jest.fn(() => 'DELETE_FIELD'),
}));

// Mock the schemas module to control validation results
jest.mock('@/utils/schemas', () => ({
  appStateSchema: {
    safeParse: jest.fn(),
  },
  goalSchema: {
    // Assume goal creation data is always valid for these tests
    safeParse: jest.fn(data => ({ success: true, data })),
  },
}));

/**
 * @description Test suite for the Goal Service.
 * This suite verifies the core logic for creating, reading, updating, and deleting goals
 * and managing the overall application state.
 */
describe('Goal Service', () => {
  let mockUserId: string;
  let mockGoalId: string;
  let mockGoal: Goal;
  let mockAppState: AppState;

  // This block runs before each test to set up fresh mock data.
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserId = 'test-user-id';
    mockGoalId = 'test-goal-id';

    // A standard mock goal object for use in tests.
    mockGoal = {
      id: mockGoalId,
      name: 'Test Goal',
      description: 'A goal for testing',
      startDate: Timestamp.fromDate(new Date('2025-01-01')),
      endDate: Timestamp.fromDate(new Date('2025-12-31')),
      status: GoalStatus.ACTIVE,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      dailyProgress: {},
      toDoList: [],
      notToDoList: [],
      stickyNotes: [],
      timeBlocks: [],
      randomPickerItems: [],
      resources: [],
      // REVISION: Provided a complete, valid routineSettings object to prevent test errors.
      routineSettings: {
        sleep: { wakeTime: '06:00', sleepTime: '22:00', naps: [] },
        water: { goal: 8, current: 0 },
        bath: [],
        exercise: [],
        meal: [],
        teeth: [],
        lastRoutineResetDate: null,
      },
      wellnessSettings: {
        [ReminderType.WATER]: { enabled: false, frequency: 60 },
        [ReminderType.EYE_CARE]: { enabled: false, frequency: 45 },
        [ReminderType.STRETCH]: { enabled: false, frequency: 90 },
        [ReminderType.BREAK]: { enabled: false, frequency: 60 },
        [ReminderType.POSTURE]: { enabled: false, frequency: 30 },
      },
      starredQuotes: [],
      financeData: null,
    };

    // A standard mock AppState object.
    mockAppState = {
      activeGoalId: mockGoalId,
      goals: { [mockGoalId]: mockGoal },
    };
  });

  // Test suite for the getUserData function.
  describe('getUserData', () => {
    it('should return existing user data if the document exists and is valid', async () => {
      // Simulate a successful validation.
      (appStateSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: mockAppState,
      });
      // Simulate that the document exists in Firestore.
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      const result = await goalService.getUserData(mockUserId);

      // Verify that doc was called with the correct db instance and user ID.
      expect(doc).toHaveBeenCalledWith(db, 'users', mockUserId);
      // Verify that the returned data matches our mock data.
      expect(result).toEqual(mockAppState);
    });

    it('should create and return default app state if the user document does not exist', async () => {
      // Simulate that the document does not exist in Firestore.
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

      const result = await goalService.getUserData(mockUserId);

      // Verify that a new document was created with default state.
      expect(setDoc).toHaveBeenCalledWith(doc(db, 'users', mockUserId), {
        activeGoalId: null,
        goals: {},
      });
      // Verify that the function returns the default state.
      expect(result).toEqual({ activeGoalId: null, goals: {} });
    });

    it('should throw a ServiceError if data validation fails', async () => {
      const invalidData = { ...mockAppState, activeGoalId: 123 }; // Invalid type for activeGoalId
      // Simulate a failed validation.
      (appStateSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: {
          flatten: () => ({ fieldErrors: { activeGoalId: ['Expected string, received number'] } }),
        },
      });
      // Simulate that the document with invalid data exists.
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => invalidData });

      // Expect the function to reject with a specific ServiceError.
      await expect(goalService.getUserData(mockUserId)).rejects.toThrow(ServiceError);
      await expect(goalService.getUserData(mockUserId)).rejects.toHaveProperty(
        'code',
        ServiceErrorCode.VALIDATION_FAILED
      );
    });
  });

  // Test suite for the createGoal function.
  describe('createGoal', () => {
    it('should create a new goal and add it to the user state', async () => {
      // Simulate an existing user with no goals.
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ activeGoalId: null, goals: {} }),
      });

      const newGoalData = {
        name: 'New Goal',
        description: 'A new goal',
        startDate: Timestamp.now(),
        endDate: Timestamp.fromDate(new Date('2025-12-31')),
        status: GoalStatus.ACTIVE,
      };

      const createdGoal = await goalService.createGoal(mockUserId, newGoalData);

      // Verify that the goal was created with a new ID and timestamps.
      expect(createdGoal.name).toBe('New Goal');
      expect(createdGoal.id).toBeDefined();
      expect(createdGoal.financeData).toBeDefined(); // Check that financeData is initialized
      // Verify that updateDoc was called to add the new goal to the goals map.
      expect(updateDoc).toHaveBeenCalledWith(
        doc(db, 'users', mockUserId),
        expect.objectContaining({
          [`goals.${createdGoal.id}`]: createdGoal,
        })
      );
    });
  });

  // Test suite for the updateGoal function.
  describe('updateGoal', () => {
    it('should correctly update fields of an existing goal', async () => {
      const updates = { name: 'Updated Goal Name', status: GoalStatus.PAUSED };
      await goalService.updateGoal(mockUserId, mockGoalId, updates);

      // Verify that updateDoc was called with a payload containing the correct updates
      // and a new 'updatedAt' timestamp.
      expect(updateDoc).toHaveBeenCalledWith(
        doc(db, 'users', mockUserId),
        expect.objectContaining({
          [`goals.${mockGoalId}.name`]: 'Updated Goal Name',
          [`goals.${mockGoalId}.status`]: GoalStatus.PAUSED,
          [`goals.${mockGoalId}.updatedAt`]: expect.any(Object),
        })
      );
    });
  });

  // Test suite for the deleteGoal function.
  describe('deleteGoal', () => {
    it('should delete a goal and unset activeGoalId if it was active', async () => {
      // Simulate the active goal being the one we are deleting.
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });
      await goalService.deleteGoal(mockUserId, mockGoalId);

      // Verify that updateDoc was called to delete the goal field and set activeGoalId to null.
      expect(updateDoc).toHaveBeenCalledWith(
        doc(db, 'users', mockUserId),
        expect.objectContaining({
          [`goals.${mockGoalId}`]: deleteField(),
          activeGoalId: null,
        })
      );
    });
  });

  // Test suite for the setActiveGoal function.
  describe('setActiveGoal', () => {
    it('should update the activeGoalId field', async () => {
      const newActiveId = 'new-active-goal-id';
      await goalService.setActiveGoal(mockUserId, newActiveId);

      // Verify that updateDoc was called with the new active goal ID.
      expect(updateDoc).toHaveBeenCalledWith(doc(db, 'users', mockUserId), {
        activeGoalId: newActiveId,
      });
    });
  });
});
