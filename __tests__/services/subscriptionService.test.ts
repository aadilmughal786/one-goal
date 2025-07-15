/* eslint-disable @typescript-eslint/no-explicit-any */
// __tests__/services/subscriptionService.test.ts

import * as subscriptionService from '@/services/subscriptionService';
import { AppState, FinanceData, Goal, GoalStatus, Subscription } from '@/types';
import { Timestamp, getDoc, updateDoc } from 'firebase/firestore';

// Mock the config module to prevent real Firebase initialization.
jest.mock('@/services/config', () => ({
  db: { type: 'firestore-mock' },
}));

// A mock document reference object to be returned by the mocked doc function.
const mockDocRef = { type: 'document-reference-mock' };

// Mock the entire 'firebase/firestore' module to isolate the service from the actual database.
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  doc: jest.fn(() => mockDocRef),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

/**
 * @description Test suite for the Subscription Service.
 * This suite validates the core CRUD operations for managing subscriptions.
 */
describe('Subscription Service', () => {
  let mockUserId: string;
  let mockGoalId: string;
  let mockSubscription: Subscription;
  let mockFinanceData: FinanceData;
  let mockAppState: AppState;

  // This block runs before each test to initialize a fresh set of mock data.
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserId = 'test-user-id';
    mockGoalId = 'test-goal-id';

    mockSubscription = {
      id: 'sub-1',
      name: 'Streaming Service',
      amount: 15.99,
      billingCycle: 'monthly',
      nextBillingDate: Timestamp.now(),
      endDate: null,
      cancellationUrl: null,
      notes: null,
      budgetId: 'budget-1',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    mockFinanceData = {
      transactions: [],
      budgets: [],
      subscriptions: [mockSubscription],
      assets: [],
      liabilities: [],
      netWorthHistory: [],
    };

    const mockGoal: Goal = {
      id: mockGoalId,
      name: 'Financial Goal',
      description: 'A goal for testing finances',
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
      resources: [],
      routineSettings: {} as any,
      wellnessSettings: {} as any,
      starredQuotes: [],
      financeData: mockFinanceData,
    };

    mockAppState = {
      activeGoalId: mockGoalId,
      goals: { [mockGoalId]: mockGoal },
    };
  });

  // Test suite for the addSubscription function.
  describe('addSubscription', () => {
    it("should add a new subscription to the goal's finance data", async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      const newSubscriptionData = {
        name: 'Music Streaming',
        amount: 9.99,
        billingCycle: 'monthly' as const,
        nextBillingDate: Timestamp.now(),
        endDate: null,
        cancellationUrl: null,
        notes: null,
        budgetId: 'budget-2',
      };

      const newSubscription = await subscriptionService.addSubscription(
        mockUserId,
        mockGoalId,
        newSubscriptionData
      );

      expect(newSubscription.name).toBe('Music Streaming');
      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedSubscriptions = updateCall[1][`goals.${mockGoalId}.financeData.subscriptions`];
      expect(updatedSubscriptions).toHaveLength(2);
      expect(updatedSubscriptions[1].name).toBe('Music Streaming');
    });
  });

  // Test suite for the updateSubscription function.
  describe('updateSubscription', () => {
    it('should update the specified fields of a subscription', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });
      const updates = { name: 'Video Streaming', amount: 18.99 };

      await subscriptionService.updateSubscription(mockUserId, mockGoalId, 'sub-1', updates);

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedSubscriptions = updateCall[1][`goals.${mockGoalId}.financeData.subscriptions`];
      const updatedItem = updatedSubscriptions.find((s: Subscription) => s.id === 'sub-1');

      expect(updatedItem.name).toBe('Video Streaming');
      expect(updatedItem.amount).toBe(18.99);
      expect(updatedItem.updatedAt).toBeDefined();
    });
  });

  // Test suite for the deleteSubscription function.
  describe('deleteSubscription', () => {
    it('should remove the specified subscription from the list', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      await subscriptionService.deleteSubscription(mockUserId, mockGoalId, 'sub-1');

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedSubscriptions = updateCall[1][`goals.${mockGoalId}.financeData.subscriptions`];

      expect(updatedSubscriptions).toHaveLength(0);
    });
  });
});
