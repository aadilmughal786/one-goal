/* eslint-disable @typescript-eslint/no-explicit-any */
// __tests__/services/netWorthService.test.ts

import * as netWorthService from '@/services/netWorthService';
import {
  AppState,
  Asset,
  AssetType,
  FinanceData,
  Goal,
  GoalStatus,
  Liability,
  LiabilityType,
} from '@/types';
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
 * @description Test suite for the Net Worth Service.
 * This suite validates the CRUD operations for assets and liabilities.
 */
describe('Net Worth Service', () => {
  let mockUserId: string;
  let mockGoalId: string;
  let mockAsset: Asset;
  let mockLiability: Liability;
  let mockFinanceData: FinanceData;
  let mockAppState: AppState;

  // This block runs before each test to initialize a fresh set of mock data.
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserId = 'test-user-id';
    mockGoalId = 'test-goal-id';

    mockAsset = {
      id: 'asset-1',
      name: 'Savings Account',
      amount: 10000,
      type: AssetType.BANK_ACCOUNT,
      notes: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    mockLiability = {
      id: 'lia-1',
      name: 'Credit Card Debt',
      amount: 2500,
      type: LiabilityType.CREDIT_CARD,
      notes: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    mockFinanceData = {
      transactions: [],
      budgets: [],
      subscriptions: [],
      assets: [mockAsset],
      liabilities: [mockLiability],
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

  // Test suite for asset functions.
  describe('Assets', () => {
    it('should add a new asset', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });
      const newAssetData = {
        name: 'Investment Fund',
        amount: 5000,
        type: AssetType.INVESTMENT,
        notes: 'Index fund',
      };
      await netWorthService.addAsset(mockUserId, mockGoalId, newAssetData);
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedAssets = updateCall[1][`goals.${mockGoalId}.financeData.assets`];
      expect(updatedAssets).toHaveLength(2);
      expect(updatedAssets[1].name).toBe('Investment Fund');
    });

    it('should update an asset', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });
      const updates = { amount: 12000 };
      await netWorthService.updateAsset(mockUserId, mockGoalId, 'asset-1', updates);
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedAssets = updateCall[1][`goals.${mockGoalId}.financeData.assets`];
      expect(updatedAssets[0].amount).toBe(12000);
    });

    it('should delete an asset', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });
      await netWorthService.deleteAsset(mockUserId, mockGoalId, 'asset-1');
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedAssets = updateCall[1][`goals.${mockGoalId}.financeData.assets`];
      expect(updatedAssets).toHaveLength(0);
    });
  });

  // Test suite for liability functions.
  describe('Liabilities', () => {
    it('should add a new liability', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });
      const newLiabilityData = {
        name: 'Car Loan',
        amount: 8000,
        type: LiabilityType.LOAN,
        notes: null,
      };
      await netWorthService.addLiability(mockUserId, mockGoalId, newLiabilityData);
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedLiabilities = updateCall[1][`goals.${mockGoalId}.financeData.liabilities`];
      expect(updatedLiabilities).toHaveLength(2);
      expect(updatedLiabilities[1].name).toBe('Car Loan');
    });

    it('should update a liability', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });
      const updates = { amount: 2000 };
      await netWorthService.updateLiability(mockUserId, mockGoalId, 'lia-1', updates);
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedLiabilities = updateCall[1][`goals.${mockGoalId}.financeData.liabilities`];
      expect(updatedLiabilities[0].amount).toBe(2000);
    });

    it('should delete a liability', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });
      await netWorthService.deleteLiability(mockUserId, mockGoalId, 'lia-1');
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedLiabilities = updateCall[1][`goals.${mockGoalId}.financeData.liabilities`];
      expect(updatedLiabilities).toHaveLength(0);
    });
  });
});
