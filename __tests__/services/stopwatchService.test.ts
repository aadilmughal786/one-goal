// __tests__/services/stopwatchService.test.ts

import * as stopwatchService from '@/services/stopwatchService';
import {
  AppState,
  DailyProgress,
  Goal,
  GoalStatus,
  RoutineLogStatus,
  RoutineType,
  SatisfactionLevel,
  StopwatchSession,
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
  doc: jest.fn(() => mockDocRef),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn(date => ({ toDate: () => date })),
  },
}));

/**
 * @description Test suite for the Stopwatch Service.
 * This suite validates the core CRUD operations for managing stopwatch sessions within a goal's daily progress.
 */
describe('Stopwatch Service', () => {
  let mockUserId: string;
  let mockGoalId: string;
  let mockSession: StopwatchSession;
  let mockDailyProgress: DailyProgress;
  let mockAppState: AppState;
  const todayKey = new Date().toISOString().split('T')[0];

  // This block runs before each test to initialize a fresh set of mock data.
  beforeEach(() => {
    jest.clearAllMocks();

    mockUserId = 'test-user-id';
    mockGoalId = 'test-goal-id';

    // A standard mock stopwatch session.
    mockSession = {
      id: 'session-1',
      label: 'Initial work session',
      startTime: Timestamp.now(),
      duration: 1500000, // 25 minutes
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // A standard mock for daily progress containing one session.
    mockDailyProgress = {
      date: todayKey,
      satisfaction: SatisfactionLevel.SATISFIED,
      notes: 'Good focus today',
      sessions: [mockSession],
      routines: {
        [RoutineType.SLEEP]: RoutineLogStatus.DONE,
        [RoutineType.WATER]: RoutineLogStatus.DONE,
        [RoutineType.TEETH]: RoutineLogStatus.DONE,
        [RoutineType.MEAL]: RoutineLogStatus.DONE,
        [RoutineType.BATH]: RoutineLogStatus.DONE,
        [RoutineType.EXERCISE]: RoutineLogStatus.DONE,
      },
      totalSessionDuration: 1500000,
      weight: null,
    };

    // A standard mock AppState.
    const mockGoal: Goal = {
      id: mockGoalId,
      name: 'Test Goal',
      description: 'A goal for testing stopwatch sessions',
      startDate: Timestamp.now(),
      endDate: Timestamp.now(),
      status: GoalStatus.ACTIVE,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      dailyProgress: { [todayKey]: mockDailyProgress },
      toDoList: [],
      notToDoList: [],
      stickyNotes: [],
      timeBlocks: [],
      randomPickerItems: [],
      resources: [],
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

  // Test suite for the addStopwatchSession function.
  describe('addStopwatchSession', () => {
    it('should add a new session to an existing daily progress log', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      const newSessionData = {
        label: 'Afternoon focus',
        duration: 900000, // 15 minutes
        startTime: Timestamp.now(),
      };
      await stopwatchService.addStopwatchSession(mockUserId, mockGoalId, newSessionData);

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedProgress = updateCall[1][`goals.${mockGoalId}.dailyProgress.${todayKey}`];

      // Verify the new session was added and the total duration was updated.
      expect(updatedProgress.sessions).toHaveLength(2);
      expect(updatedProgress.totalSessionDuration).toBe(1500000 + 900000);
    });

    it("should create a new daily progress log if one doesn't exist for the day", async () => {
      // Simulate an app state with no progress for today.
      const appStateWithoutProgress = {
        ...mockAppState,
        goals: {
          ...mockAppState.goals,
          [mockGoalId]: {
            ...mockAppState.goals[mockGoalId],
            dailyProgress: {},
          },
        },
      };
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => appStateWithoutProgress,
      });

      const newSessionData = {
        label: 'First session of the day',
        duration: 3000000, // 50 minutes
        startTime: Timestamp.now(),
      };
      await stopwatchService.addStopwatchSession(mockUserId, mockGoalId, newSessionData);

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const newProgress = updateCall[1][`goals.${mockGoalId}.dailyProgress.${todayKey}`];

      // Verify a new daily progress object was created correctly.
      expect(newProgress).toBeDefined();
      expect(newProgress.sessions).toHaveLength(1);
      expect(newProgress.sessions[0].label).toBe('First session of the day');
      expect(newProgress.totalSessionDuration).toBe(3000000);
      expect(newProgress.satisfaction).toBe(SatisfactionLevel.NEUTRAL); // Check default value.
    });
  });

  // Test suite for the updateStopwatchSession function.
  describe('updateStopwatchSession', () => {
    it('should update the label of an existing session', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });
      const newLabel = 'Updated session label';

      await stopwatchService.updateStopwatchSession(
        mockUserId,
        mockGoalId,
        todayKey,
        'session-1',
        newLabel
      );

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedSessions =
        updateCall[1][`goals.${mockGoalId}.dailyProgress.${todayKey}.sessions`];
      const updatedSession = updatedSessions.find((s: StopwatchSession) => s.id === 'session-1');

      // Verify the label was updated.
      expect(updatedSession.label).toBe(newLabel);
    });

    it('should throw a ServiceError if progress for the date does not exist', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });
      const wrongDateKey = '2025-01-01';

      // Expect the function to reject because no progress exists for 'wrongDateKey'.
      await expect(
        stopwatchService.updateStopwatchSession(
          mockUserId,
          mockGoalId,
          wrongDateKey,
          'session-1',
          'new label'
        )
      ).rejects.toThrow(`No progress found for date ${wrongDateKey}.`);
    });
  });

  // Test suite for the deleteStopwatchSession function.
  describe('deleteStopwatchSession', () => {
    it('should remove a session and correctly recalculate total duration', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => mockAppState });

      await stopwatchService.deleteStopwatchSession(mockUserId, mockGoalId, todayKey, 'session-1');

      expect(updateDoc).toHaveBeenCalled();
      const updateCall = (updateDoc as jest.Mock).mock.calls[0];
      const updatedSessions =
        updateCall[1][`goals.${mockGoalId}.dailyProgress.${todayKey}.sessions`];
      const updatedDuration =
        updateCall[1][`goals.${mockGoalId}.dailyProgress.${todayKey}.totalSessionDuration`];

      // Verify the session was removed and duration is now 0.
      expect(updatedSessions).toHaveLength(0);
      expect(updatedDuration).toBe(0);
    });
  });
});
