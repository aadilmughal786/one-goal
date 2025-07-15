/* eslint-disable @typescript-eslint/no-explicit-any */
// __tests__/services/stickyNoteService.test.ts

import * as stickyNoteService from '@/services/stickyNoteService';
import { AppState, Goal, GoalStatus, StickyNote, StickyNoteColor } from '@/types';
import { ServiceError } from '@/utils/errors';
import { Timestamp, getDoc, updateDoc } from 'firebase/firestore';

// Mock the config module to prevent real Firebase initialization.
jest.mock('@/services/config', () => ({
  db: { type: 'firestore-mock' },
}));

// A mock document reference object to be returned by the mocked doc function.
const mockDocRef = { type: 'document-reference-mock' };

// Mock the entire 'firebase/firestore' module to ensure tests are isolated and fast.
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
 * @description Test suite for the Sticky Note Service.
 * This suite validates the core CRUD operations for managing sticky notes within a goal.
 */
describe('Sticky Note Service', () => {
  let mockUserId: string;
  let mockGoalId: string;
  let mockStickyNote: StickyNote;
  let mockAppState: AppState;

  // This block runs before each test to initialize a fresh set of mock data.
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserId = 'test-user-id';
    mockGoalId = 'test-goal-id';

    // A standard mock sticky note for use in tests.
    mockStickyNote = {
      id: 'note-1',
      title: 'Important Idea',
      content: 'This is a key concept to remember.',
      color: StickyNoteColor.YELLOW,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // A standard mock AppState containing one goal with one sticky note.
    const mockGoal: Goal = {
      id: mockGoalId,
      name: 'Test Goal',
      description: 'A goal for testing sticky notes',
      startDate: Timestamp.now(),
      endDate: Timestamp.now(),
      status: GoalStatus.ACTIVE,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      dailyProgress: {},
      toDoList: [],
      notToDoList: [],
      stickyNotes: [mockStickyNote],
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

  // Test suite for the addStickyNote function.
  describe('addStickyNote', () => {
    it("should add a new sticky note to the goal's list", async () => {
      // Simulate that the user's document exists.
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      const newNote = await stickyNoteService.addStickyNote(
        mockUserId,
        mockGoalId,
        'New Note',
        'Some content',
        StickyNoteColor.BLUE
      );

      // Verify the new note has the correct properties.
      expect(newNote.title).toBe('New Note');
      expect(newNote.color).toBe(StickyNoteColor.BLUE);

      // Verify that updateDoc was called.
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedList = updateCall[1][`goals.${mockGoalId}.stickyNotes`];

      // Verify the new list contains both the original and the new note.
      expect(updatedList).toHaveLength(2);
      expect(updatedList.some((note: StickyNote) => note.title === 'New Note')).toBe(true);
    });

    it('should throw a ServiceError if the goal does not exist', async () => {
      // Simulate a state where the user exists but the goal does not.
      const appStateWithoutGoal = { activeGoalId: null, goals: {} };
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => appStateWithoutGoal,
      });

      // Expect the function to reject with a specific error.
      await expect(
        stickyNoteService.addStickyNote(
          mockUserId,
          mockGoalId,
          'title',
          'content',
          StickyNoteColor.GREEN
        )
      ).rejects.toThrow(new ServiceError(`Goal with ID ${mockGoalId} not found.`));
    });
  });

  // Test suite for the updateStickyNote function.
  describe('updateStickyNote', () => {
    it('should update the specified fields of a sticky note', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });
      const updates = { title: 'Updated Idea', color: StickyNoteColor.PINK };

      await stickyNoteService.updateStickyNote(mockUserId, mockGoalId, 'note-1', updates);

      // Verify that updateDoc was called.
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedList = updateCall[1][`goals.${mockGoalId}.stickyNotes`];
      const updatedItem = updatedList.find((note: StickyNote) => note.id === 'note-1');

      // Verify the item was updated correctly.
      expect(updatedItem.title).toBe('Updated Idea');
      expect(updatedItem.color).toBe(StickyNoteColor.PINK);
      expect(updatedItem.updatedAt).toBeDefined();
    });
  });

  // Test suite for the deleteStickyNote function.
  describe('deleteStickyNote', () => {
    it('should remove the specified sticky note from the list', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      await stickyNoteService.deleteStickyNote(mockUserId, mockGoalId, 'note-1');

      // Verify that updateDoc was called.
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedList = updateCall[1][`goals.${mockGoalId}.stickyNotes`];

      // Verify the list is now empty.
      expect(updatedList).toHaveLength(0);
    });
  });
});
