// __tests__/services/resourceService.test.ts

import * as resourceService from '@/services/resourceService';
import { AppState, Goal, GoalStatus, Resource, ResourceType } from '@/types';
import { ServiceError } from '@/utils/errors';
import { Timestamp, getDoc, updateDoc } from 'firebase/firestore';

// Mock the config module to prevent real Firebase initialization.
jest.mock('@/services/config', () => ({
  db: { type: 'firestore-mock' },
}));

// A mock document reference object to be returned by the mocked doc function.
const mockDocRef = { type: 'document-reference-mock' };

// Mock the entire 'firebase/firestore' module to isolate the service from the actual database.
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
 * @description Test suite for the Resource Service.
 * This suite validates the functionality for adding, updating, and deleting resource items
 * linked to a user's goal.
 */
describe('Resource Service', () => {
  let mockUserId: string;
  let mockGoalId: string;
  let mockResource: Resource;
  let mockAppState: AppState;

  // This block runs before each test to set up a clean and consistent state.
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserId = 'test-user-id';
    mockGoalId = 'test-goal-id';

    // A standard mock resource item for use in tests.
    mockResource = {
      id: 'resource-1',
      title: 'Official Documentation',
      url: 'https://example.com/docs',
      type: ResourceType.ARTICLE,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // A standard mock AppState containing one goal with one resource item.
    const mockGoal: Goal = {
      id: mockGoalId,
      name: 'Test Goal',
      description: 'A goal for testing resources',
      startDate: Timestamp.now(),
      endDate: Timestamp.now(),
      status: GoalStatus.ACTIVE,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      dailyProgress: {},
      toDoList: [],
      notToDoList: [],
      stickyNotes: [],
      timeBlocks: [],
      randomPickerItems: [],
      resources: [mockResource],
      routineSettings: {
        sleep: null,
        water: null,
        bath: [],
        exercise: [],
        meal: [],
        teeth: [],
        lastRoutineResetDate: null,
      },
      wellnessSettings: {
        water: { enabled: false, frequency: 60 },
        eyeCare: { enabled: false, frequency: 45 },
        stretch: { enabled: false, frequency: 90 },
        break: { enabled: false, frequency: 60 },
        posture: { enabled: false, frequency: 30 },
      },
      starredQuotes: [],
    };

    mockAppState = {
      activeGoalId: mockGoalId,
      goals: { [mockGoalId]: mockGoal },
    };
  });

  // Test suite for the addResource function.
  describe('addResource', () => {
    it("should add a new resource to the goal's resource list", async () => {
      // Simulate that the user's document exists.
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      const newResource = await resourceService.addResource(
        mockUserId,
        mockGoalId,
        'https://new-resource.com',
        'New Awesome Resource',
        ResourceType.VIDEO
      );

      // Verify the new resource has the correct properties.
      expect(newResource.title).toBe('New Awesome Resource');
      expect(newResource.type).toBe(ResourceType.VIDEO);

      // Verify that updateDoc was called.
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedList = updateCall[1][`goals.${mockGoalId}.resources`];

      // Verify the new list contains both the old and new resources.
      expect(updatedList).toHaveLength(2);
      expect(updatedList.some((item: Resource) => item.title === 'New Awesome Resource')).toBe(
        true
      );
    });

    it('should throw a ServiceError if the user document does not exist', async () => {
      // Simulate that the document does not exist.
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

      // Expect the function to reject with a specific error.
      await expect(
        resourceService.addResource(
          mockUserId,
          mockGoalId,
          'https://url.com',
          'title',
          ResourceType.OTHER
        )
      ).rejects.toThrow(new ServiceError('User data not found.'));
    });
  });

  // Test suite for the updateResource function.
  describe('updateResource', () => {
    it('should update the specified fields of a resource item', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });
      const updates = { title: 'Updated Docs', type: ResourceType.DOC };

      await resourceService.updateResource(mockUserId, mockGoalId, 'resource-1', updates);

      // Verify that updateDoc was called.
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedList = updateCall[1][`goals.${mockGoalId}.resources`];
      const updatedItem = updatedList.find((item: Resource) => item.id === 'resource-1');

      // Verify the item was updated correctly.
      expect(updatedItem.title).toBe('Updated Docs');
      expect(updatedItem.type).toBe(ResourceType.DOC);
      expect(updatedItem.updatedAt).toBeDefined();
    });
  });

  // Test suite for the deleteResource function.
  describe('deleteResource', () => {
    it('should remove the specified resource from the list', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      await resourceService.deleteResource(mockUserId, mockGoalId, 'resource-1');

      // Verify that updateDoc was called.
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedList = updateCall[1][`goals.${mockGoalId}.resources`];

      // Verify the list is now empty.
      expect(updatedList).toHaveLength(0);
    });
  });
});
