// __tests__/services/routineService.test.ts

import * as routineService from '@/services/routineService';
import {
  DailyProgress,
  RoutineLogStatus,
  RoutineType,
  SatisfactionLevel,
  UserRoutineSettings,
} from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { updateDoc } from 'firebase/firestore';

// Mock the config module to prevent real Firebase initialization.
jest.mock('@/services/config', () => ({
  db: { type: 'firestore-mock' },
}));

// A mock document reference object to be returned by the mocked doc function.
const mockDocRef = { type: 'document-reference-mock' };

// Mock the entire 'firebase/firestore' module to prevent actual database interactions.
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => mockDocRef),
  updateDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn(date => ({ toDate: () => date })),
  },
}));

/**
 * @description Test suite for the Routine Service.
 * This suite validates the functions responsible for managing routine settings and logging daily progress.
 */
describe('Routine Service', () => {
  let mockUserId: string;
  let mockGoalId: string;
  let mockRoutineSettings: UserRoutineSettings;
  let mockDailyProgress: DailyProgress;

  // This block runs before each test to reset mocks and set up fresh data.
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserId = 'test-user-id';
    mockGoalId = 'test-goal-id';

    // A standard mock for user routine settings.
    mockRoutineSettings = {
      sleep: { wakeTime: '06:00', sleepTime: '22:00', naps: [] },
      water: { goal: 8, current: 0 },
      bath: [],
      exercise: [],
      meal: [],
      teeth: [],
      lastRoutineResetDate: null,
    };

    // A standard mock for a daily progress log.
    mockDailyProgress = {
      date: '2025-07-03',
      satisfaction: SatisfactionLevel.NEUTRAL,
      notes: 'A typical day.',
      sessions: [],
      routines: {
        [RoutineType.SLEEP]: RoutineLogStatus.NOT_LOGGED,
        [RoutineType.WATER]: RoutineLogStatus.NOT_LOGGED,
        [RoutineType.TEETH]: RoutineLogStatus.NOT_LOGGED,
        [RoutineType.MEAL]: RoutineLogStatus.NOT_LOGGED,
        [RoutineType.BATH]: RoutineLogStatus.NOT_LOGGED,
        [RoutineType.EXERCISE]: RoutineLogStatus.NOT_LOGGED,
      },
      totalSessionDuration: 0,
      weight: null,
    };
  });

  // Test suite for the updateRoutineSettings function.
  describe('updateRoutineSettings', () => {
    it('should correctly update the entire routine settings object for a goal', async () => {
      // Simulate a successful database update.
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      const newSettings = { ...mockRoutineSettings, water: { goal: 10, current: 2 } };

      await routineService.updateRoutineSettings(mockUserId, mockGoalId, newSettings);

      // Verify that updateDoc was called with the correct payload.
      // The payload should contain the new settings object and an updated timestamp for the goal.
      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          [`goals.${mockGoalId}.routineSettings`]: newSettings,
          [`goals.${mockGoalId}.updatedAt`]: expect.any(Object),
        })
      );
    });

    it('should throw a ServiceError if the update operation fails', async () => {
      const mockError = new Error('Firestore permission denied.');
      // Simulate a failed database update.
      (updateDoc as jest.Mock).mockRejectedValue(mockError);

      // Expect the function to reject with a custom ServiceError.
      await expect(
        routineService.updateRoutineSettings(mockUserId, mockGoalId, mockRoutineSettings)
      ).rejects.toThrow('Failed to update routine settings.');
    });
  });

  // Test suite for the saveDailyProgress function.
  describe('saveDailyProgress', () => {
    it('should save or update a daily progress log for a specific date', async () => {
      // Simulate a successful database update.
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await routineService.saveDailyProgress(mockUserId, mockGoalId, mockDailyProgress);

      // Verify that updateDoc was called with the correct payload.
      // The payload should target the specific date key within the dailyProgress map.
      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          [`goals.${mockGoalId}.dailyProgress.${mockDailyProgress.date}`]: mockDailyProgress,
          [`goals.${mockGoalId}.updatedAt`]: expect.any(Object),
        })
      );
    });

    it('should throw a ServiceError if the progress data is missing a date', async () => {
      // Create progress data without the required 'date' field.
      const progressWithoutDate = { ...mockDailyProgress, date: '' };

      // Expect the function to reject with an INVALID_INPUT error.
      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        routineService.saveDailyProgress(mockUserId, mockGoalId, progressWithoutDate as any)
      ).rejects.toThrow(
        new ServiceError('Progress data must include a date.', ServiceErrorCode.INVALID_INPUT)
      );
    });

    it('should throw a ServiceError if the save operation fails', async () => {
      const mockError = new Error('Firestore network error.');
      // Simulate a failed database update.
      (updateDoc as jest.Mock).mockRejectedValue(mockError);

      // Expect the function to reject with a custom ServiceError.
      await expect(
        routineService.saveDailyProgress(mockUserId, mockGoalId, mockDailyProgress)
      ).rejects.toThrow(`Failed to save daily progress for goal ${mockGoalId}.`);
    });
  });
});
