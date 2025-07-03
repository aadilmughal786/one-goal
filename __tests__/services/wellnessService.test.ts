// __tests__/services/wellnessService.test.ts

import { db } from '@/services/config';
import * as wellnessService from '@/services/wellnessService';
import { ReminderType, WellnessSettings } from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { doc, updateDoc } from 'firebase/firestore';

// Mock the config module to prevent real Firebase initialization.
jest.mock('@/services/config', () => ({
  db: { type: 'firestore-mock' },
}));

// A mock document reference object to be returned by the mocked doc function.
const mockDocRef = { type: 'document-reference-mock' };

// Mock the entire 'firebase/firestore' module to prevent actual database interactions.
jest.mock('firebase/firestore', () => ({
  // Make the mocked doc function return our mock document reference.
  doc: jest.fn(() => mockDocRef),
  updateDoc: jest.fn(),
}));

/**
 * @description Test suite for the Wellness Service.
 * This suite validates the function responsible for updating wellness reminder settings.
 */
describe('Wellness Service', () => {
  let mockUserId: string;
  let mockGoalId: string;
  let mockWellnessSettings: WellnessSettings;

  // This block runs before each test to reset mocks and set up fresh data.
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserId = 'test-user-id';
    mockGoalId = 'test-goal-id';

    // A standard mock for user wellness settings.
    mockWellnessSettings = {
      [ReminderType.WATER]: { enabled: true, frequency: 60 },
      [ReminderType.EYE_CARE]: { enabled: false, frequency: 45 },
      [ReminderType.STRETCH]: { enabled: true, frequency: 90 },
      [ReminderType.BREAK]: { enabled: false, frequency: 60 },
      [ReminderType.POSTURE]: { enabled: true, frequency: 30 },
    };
  });

  // Test suite for the updateWellnessSettings function.
  describe('updateWellnessSettings', () => {
    it('should correctly update the wellness settings object for a goal', async () => {
      // Simulate a successful database update.
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await wellnessService.updateWellnessSettings(mockUserId, mockGoalId, mockWellnessSettings);

      // Verify that doc was called with the correct db instance and user ID path.
      expect(doc).toHaveBeenCalledWith(db, 'users', mockUserId);

      // Verify that updateDoc was called with the correct payload.
      // The payload should target the wellnessSettings field within the specific goal.
      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef, // Check that updateDoc received our mock document reference.
        expect.objectContaining({
          [`goals.${mockGoalId}.wellnessSettings`]: mockWellnessSettings,
        })
      );
    });

    it('should throw a ServiceError if the user ID is missing', async () => {
      // Expect the function to reject with an INVALID_INPUT error when userId is empty.
      await expect(
        wellnessService.updateWellnessSettings('', mockGoalId, mockWellnessSettings)
      ).rejects.toThrow(
        new ServiceError(
          'User ID and Goal ID are required to update wellness settings.',
          ServiceErrorCode.INVALID_INPUT
        )
      );
    });

    it('should throw a ServiceError if the goal ID is missing', async () => {
      // Expect the function to reject with an INVALID_INPUT error when goalId is empty.
      await expect(
        wellnessService.updateWellnessSettings(mockUserId, '', mockWellnessSettings)
      ).rejects.toThrow(
        new ServiceError(
          'User ID and Goal ID are required to update wellness settings.',
          ServiceErrorCode.INVALID_INPUT
        )
      );
    });

    it('should throw a ServiceError if the Firestore update operation fails', async () => {
      const mockError = new Error('Firestore permission denied.');
      // Simulate a failed database update.
      (updateDoc as jest.Mock).mockRejectedValue(mockError);

      // Expect the function to reject with a specific ServiceError.
      await expect(
        wellnessService.updateWellnessSettings(mockUserId, mockGoalId, mockWellnessSettings)
      ).rejects.toThrow('Failed to update wellness settings in Firestore.');
    });
  });
});
