// __tests__/services/quoteService.test.ts

import { db } from '@/services/config';
import * as quoteService from '@/services/quoteService';
import { ServiceError } from '@/utils/errors';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';

// Mock the config module to prevent real Firebase initialization.
jest.mock('@/services/config', () => ({
  db: { type: 'firestore-mock' },
}));

// A mock document reference object to be returned by the mocked doc function.
const mockDocRef = { type: 'document-reference-mock' };

// Mock the 'firebase/firestore' module to control its behavior during tests.
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => mockDocRef),
  updateDoc: jest.fn(),
  // FIX: Make arrayUnion and arrayRemove return a placeholder object to simulate
  // the behavior of the real Firebase functions.
  arrayUnion: jest.fn(() => ({ type: 'arrayUnion' })),
  arrayRemove: jest.fn(() => ({ type: 'arrayRemove' })),
}));

/**
 * @description Test suite for the Quote Service.
 * This suite validates the functionality for adding and removing starred quotes from a goal.
 */
describe('Quote Service', () => {
  let mockUserId: string;
  let mockGoalId: string;
  let mockQuoteId: number;

  // This block runs before each test to initialize fresh mock data.
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = 'test-user-id';
    mockGoalId = 'test-goal-id';
    mockQuoteId = 42;
  });

  // Test suite for the addStarredQuote function.
  describe('addStarredQuote', () => {
    it('should call updateDoc with arrayUnion to add a quote ID', async () => {
      // Simulate a successful update operation.
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await quoteService.addStarredQuote(mockUserId, mockGoalId, mockQuoteId);

      // Verify that doc was called with the correct path.
      expect(doc).toHaveBeenCalledWith(db, 'users', mockUserId);
      // Verify that arrayUnion was called with the quote ID.
      expect(arrayUnion).toHaveBeenCalledWith(mockQuoteId);
      // Verify that updateDoc was called to update the correct field in the document.
      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          [`goals.${mockGoalId}.starredQuotes`]: { type: 'arrayUnion' },
        })
      );
    });

    it('should throw a ServiceError if the update operation fails', async () => {
      const mockError = new Error('Permission denied');
      // Simulate a failed update operation.
      (updateDoc as jest.Mock).mockRejectedValue(mockError);

      // Expect the function to reject with a custom ServiceError.
      await expect(
        quoteService.addStarredQuote(mockUserId, mockGoalId, mockQuoteId)
      ).rejects.toThrow(new ServiceError('Failed to star quote.'));
    });
  });

  // Test suite for the removeStarredQuote function.
  describe('removeStarredQuote', () => {
    it('should call updateDoc with arrayRemove to remove a quote ID', async () => {
      // Simulate a successful update operation.
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await quoteService.removeStarredQuote(mockUserId, mockGoalId, mockQuoteId);

      // Verify that doc was called with the correct path.
      expect(doc).toHaveBeenCalledWith(db, 'users', mockUserId);
      // Verify that arrayRemove was called with the quote ID.
      expect(arrayRemove).toHaveBeenCalledWith(mockQuoteId);
      // Verify that updateDoc was called to update the correct field in the document.
      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          [`goals.${mockGoalId}.starredQuotes`]: { type: 'arrayRemove' },
        })
      );
    });

    it('should throw a ServiceError if the update operation fails', async () => {
      const mockError = new Error('Permission denied');
      // Simulate a failed update operation.
      (updateDoc as jest.Mock).mockRejectedValue(mockError);

      // Expect the function to reject with a custom ServiceError.
      await expect(
        quoteService.removeStarredQuote(mockUserId, mockGoalId, mockQuoteId)
      ).rejects.toThrow(new ServiceError('Failed to unstar quote.'));
    });
  });
});
