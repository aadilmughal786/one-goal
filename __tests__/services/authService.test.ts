/* eslint-disable @typescript-eslint/no-explicit-any */
// __tests__/services/authService.test.ts

import {
  onAuthChange,
  signInWithGoogle,
  signOutUser,
  updateUserProfile,
} from '@/services/authService';
import { auth } from '@/services/config'; // Import the auth object to modify its mock
import { ServiceError } from '@/utils/errors';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';

// Mock the config module. This allows us to control the 'auth' object that the authService uses,
// making it possible to simulate different authentication states (e.g., user logged in or out).
jest.mock('@/services/config', () => ({
  auth: {
    currentUser: null, // Default to no user being logged in.
  },
}));

// Mock the 'firebase/auth' module. We are replacing the actual Firebase functions with mock
// implementations to prevent real API calls during tests and to control their return values.
jest.mock('firebase/auth', () => ({
  __esModule: true, // This is needed for mocking ES modules.
  ...jest.requireActual('firebase/auth'), // Keep the original module's other exports.
  onAuthStateChanged: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
}));

/**
 * @description Test suite for the Authentication Service.
 * This suite verifies that each function in authService.ts behaves correctly
 * under both successful and failed conditions.
 */
describe('Authentication Service', () => {
  // This block runs before each test, ensuring a clean slate by clearing all mock function call histories
  // and resetting the mocked currentUser to null.
  beforeEach(() => {
    jest.clearAllMocks();
    // We use 'as any' here as a practical exception for testing. The 'currentUser' property on the
    // real Auth object is read-only, but we need to set it directly for our mock to simulate
    // different user authentication states.
    (auth as any).currentUser = null;
  });

  // Test suite for the onAuthChange function.
  describe('onAuthChange', () => {
    it('should correctly set up the onAuthStateChanged listener', () => {
      const mockCallback = jest.fn();
      onAuthChange(mockCallback);

      // It should call the original Firebase onAuthStateChanged function, passing it the
      // mocked auth instance and the provided callback.
      expect(onAuthStateChanged).toHaveBeenCalledWith(auth, mockCallback);
    });
  });

  // Test suite for the signInWithGoogle function.
  describe('signInWithGoogle', () => {
    it('should successfully sign in and return a user object', async () => {
      const mockUser = { uid: 'test-uid-123', email: 'test@example.com' };
      // Simulate a successful sign-in popup.
      (signInWithPopup as jest.Mock).mockResolvedValue({ user: mockUser });

      const user = await signInWithGoogle();

      // Verify that the sign-in process was initiated with the correct auth object.
      expect(signInWithPopup).toHaveBeenCalledWith(auth, expect.any(Object));
      // Verify that the function returns the expected user object.
      expect(user).toEqual(mockUser);
      // Verify that the GoogleAuthProvider was instantiated.
      expect(GoogleAuthProvider).toHaveBeenCalled();
    });

    it('should throw a ServiceError if the sign-in process fails', async () => {
      const mockError = new Error('Popup closed by user.');
      // Simulate a failed sign-in (e.g., user closes the popup).
      (signInWithPopup as jest.Mock).mockRejectedValue(mockError);

      // Expect the function to reject with a custom ServiceError.
      await expect(signInWithGoogle()).rejects.toThrow(ServiceError);
      await expect(signInWithGoogle()).rejects.toThrow('Failed to sign in with Google.');
    });
  });

  // Test suite for the signOutUser function.
  describe('signOutUser', () => {
    it('should successfully call the signOut method', async () => {
      // Simulate a successful sign-out.
      (signOut as jest.Mock).mockResolvedValue(undefined);
      await signOutUser();

      // Verify that the signOut function was called with our mocked auth object.
      expect(signOut).toHaveBeenCalledWith(auth);
    });

    it('should throw a ServiceError if the sign-out process fails', async () => {
      const mockError = new Error('Network connection error.');
      // Simulate a failed sign-out.
      (signOut as jest.Mock).mockRejectedValue(mockError);

      // Expect the function to reject with a custom ServiceError.
      await expect(signOutUser()).rejects.toThrow(ServiceError);
    });
  });

  // Test suite for the updateUserProfile function.
  describe('updateUserProfile', () => {
    it('should successfully update the user profile when a user is authenticated', async () => {
      // Simulate an authenticated user.
      (auth as any).currentUser = { uid: 'test-uid-123' };
      // Simulate a successful profile update.
      (updateProfile as jest.Mock).mockResolvedValue(undefined);
      const updates = { displayName: 'New Test User' };

      await updateUserProfile(updates);

      // Verify that updateProfile was called with the correct user object and updates.
      expect(updateProfile).toHaveBeenCalledWith(auth.currentUser, updates);
    });

    it('should throw a ServiceError if no user is authenticated', async () => {
      // No user is authenticated by default in our test setup.
      const updates = { displayName: 'New Test User' };

      // Expect the function to reject with a specific error message.
      await expect(updateUserProfile(updates)).rejects.toThrow(
        'No authenticated user found to update profile.'
      );
    });

    it('should throw a ServiceError if the profile update API call fails', async () => {
      // Simulate an authenticated user.
      (auth as any).currentUser = { uid: 'test-uid-123' };
      const mockError = new Error('Permission denied.');
      // Simulate a failed profile update.
      (updateProfile as jest.Mock).mockRejectedValue(mockError);
      const updates = { displayName: 'New Test User' };

      // Expect the function to reject with a custom ServiceError.
      await expect(updateUserProfile(updates)).rejects.toThrow('Failed to update user profile.');
    });
  });
});
