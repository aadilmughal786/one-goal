/* eslint-disable @typescript-eslint/no-explicit-any */
// __tests__/services/dataService.test.ts

import { deserializeGoalsForImport, serializeGoalsForExport } from '@/services/dataService';
import { Goal, GoalStatus } from '@/types';
import { Timestamp } from 'firebase/firestore';

/**
 * @description Test suite for the Data Service.
 * This suite validates the serialization and deserialization logic used for
 * exporting and importing user goal data.
 */
describe('Data Service', () => {
  let mockGoal: Goal;
  const testDate = new Date('2025-01-01T12:00:00.000Z');
  const testTimestamp = Timestamp.fromDate(testDate);

  // This block runs before each test to set up a consistent mock goal object.
  beforeEach(() => {
    mockGoal = {
      id: 'original-id-1',
      name: 'Test Goal for Serialization',
      description: 'A test goal',
      startDate: testTimestamp,
      endDate: testTimestamp,
      status: GoalStatus.ACTIVE,
      createdAt: testTimestamp,
      updatedAt: testTimestamp,
      dailyProgress: {
        '2025-01-01': {
          date: '2025-01-01',
          satisfaction: 4,
          notes: 'A good day',
          sessions: [],
          totalSessionDuration: 0,
          routines: {} as any,
          weight: null,
        },
      },
      toDoList: [
        {
          id: 'todo-1',
          text: 'A test to-do',
          completed: true,
          completedAt: testTimestamp,
          createdAt: testTimestamp,
          updatedAt: testTimestamp,
          order: 0,
          description: null,
          deadline: null,
        },
      ],
      notToDoList: [],
      stickyNotes: [],
      timeBlocks: [],
      randomPickerItems: [],
      resources: [],
      routineSettings: {
        lastRoutineResetDate: testTimestamp,
      } as any,
      wellnessSettings: {} as any,
      starredQuotes: [],
      financeData: {
        transactions: [
          {
            id: 'txn-1',
            date: testTimestamp,
            amount: 100,
            description: 'Test',
            budgetId: 'budget-1',
            type: 'expense',
            createdAt: testTimestamp,
            updatedAt: testTimestamp,
          },
        ],
        budgets: [],
        subscriptions: [],
        assets: [],
        liabilities: [],
        netWorthHistory: [],
      },
      catchingTheFrogTasks: [],
    };
  });

  // Test suite for the serializeGoalsForExport function.
  describe('serializeGoalsForExport', () => {
    it('should correctly convert all Firestore Timestamps to ISO date strings', () => {
      const goalsToSerialize = [mockGoal];
      const serializedGoals = serializeGoalsForExport(goalsToSerialize);
      const serializedGoal = serializedGoals[0] as any;

      // Verify that all Timestamp fields have been converted to strings.
      expect(typeof serializedGoal.startDate).toBe('string');
      expect(serializedGoal.startDate).toBe(testDate.toISOString());
      expect(typeof serializedGoal.toDoList[0].completedAt).toBe('string');
      expect(serializedGoal.toDoList[0].completedAt).toBe(testDate.toISOString());
      expect(typeof serializedGoal.routineSettings.lastRoutineResetDate).toBe('string');
      expect(serializedGoal.routineSettings.lastRoutineResetDate).toBe(testDate.toISOString());
      expect(typeof serializedGoal.financeData.transactions[0].date).toBe('string');
    });

    it('should not alter non-Timestamp properties', () => {
      const goalsToSerialize = [mockGoal];
      const serializedGoals = serializeGoalsForExport(goalsToSerialize);
      const serializedGoal = serializedGoals[0] as any;

      // Verify that other properties remain unchanged.
      expect(serializedGoal.name).toBe('Test Goal for Serialization');
      expect(serializedGoal.status).toBe(GoalStatus.ACTIVE);
      expect(serializedGoal.toDoList[0].text).toBe('A test to-do');
      expect(serializedGoal.financeData.transactions[0].amount).toBe(100);
    });
  });

  // Test suite for the deserializeGoalsForImport function.
  describe('deserializeGoalsForImport', () => {
    let serializedData: object[];

    // Set up serialized data before running tests in this suite.
    beforeEach(() => {
      serializedData = [
        {
          id: 'original-id-1',
          name: 'Imported Goal',
          startDate: testDate.toISOString(),
          endDate: testDate.toISOString(),
          createdAt: testDate.toISOString(),
          updatedAt: testDate.toISOString(),
          status: GoalStatus.ACTIVE,
          toDoList: [
            {
              id: 'todo-1',
              text: 'A test to-do',
              completed: true,
              completedAt: testDate.toISOString(),
              createdAt: testDate.toISOString(),
              updatedAt: testDate.toISOString(),
            },
          ],
          financeData: {
            transactions: [
              {
                id: 'txn-1',
                date: testDate.toISOString(),
                amount: 100,
                description: 'Test',
                budgetId: 'budget-1',
                type: 'expense',
                createdAt: testDate.toISOString(),
                updatedAt: testDate.toISOString(),
              },
            ],
          },
        },
      ];
    });

    it('should correctly convert all ISO date strings back to Firestore Timestamps', () => {
      const deserializedGoals = deserializeGoalsForImport(serializedData);
      const deserializedGoal = deserializedGoals[0];

      // Verify that all string dates have been converted back to Timestamp objects.
      expect(deserializedGoal.startDate).toBeInstanceOf(Timestamp);
      expect(deserializedGoal.toDoList[0].completedAt).toBeInstanceOf(Timestamp);
      expect(deserializedGoal.financeData?.transactions[0].date).toBeInstanceOf(Timestamp);
      // Compare the time value to ensure the conversion was accurate.
      expect((deserializedGoal.startDate as Timestamp).toDate().getTime()).toBe(testDate.getTime());
    });

    it('should regenerate the top-level goal ID to prevent conflicts', () => {
      const deserializedGoals = deserializeGoalsForImport(serializedData);
      const deserializedGoal = deserializedGoals[0];

      // Verify that the original ID was replaced with our mocked UUID.
      expect(deserializedGoal.id).not.toBe('original-id-1');
      expect(deserializedGoal.id).toBe('mock-uuid-for-testing');
    });

    it('should not change the IDs of nested items like to-dos or transactions', () => {
      const deserializedGoals = deserializeGoalsForImport(serializedData);
      const deserializedGoal = deserializedGoals[0];

      // Verify that the ID of the nested to-do item was preserved.
      expect(deserializedGoal.toDoList[0].id).toBe('todo-1');
      expect(deserializedGoal.financeData?.transactions[0].id).toBe('txn-1');
    });
  });
});
