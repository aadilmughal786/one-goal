// app/services/authService.ts
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './config'; // Import the shared auth instance

/**
 * @file app/services/authService.ts
 * @description Authentication Service Module.
 *
 * This module encapsulates all logic related to user authentication and profile
 * management. By separating these concerns, we create a clean, testable, and
 * maintainable service for handling user identity. It consumes the shared `auth`
 * instance from `config.ts`.
 */

/**
 * Sets up a real-time listener for changes in the user's authentication state.
 * This is the primary mechanism for determining if a user is logged in or out
 * throughout the application.
 * @param callback A function to be executed with the current User object (or null).
 * @returns An unsubscribe function to detach the listener, preventing memory leaks.
 */
export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Initiates the Google Sign-In flow using a pop-up window.
 * @returns A promise that resolves to the authenticated User object.
 * @throws {ServiceError} If the sign-in process fails (e.g., user closes the popup).
 */
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    throw new ServiceError(
      'Failed to sign in with Google.',
      ServiceErrorCode.AUTH_SIGN_IN_FAILED,
      error
    );
  }
};

/**
 * Signs out the currently authenticated user from the application.
 * @throws {ServiceError} If the sign-out process fails.
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new ServiceError('Failed to sign out.', ServiceErrorCode.AUTH_SIGN_OUT_FAILED, error);
  }
};

/**
 * Updates the profile information (displayName, photoURL) of the currently logged-in user.
 * @param updates An object containing the new displayName and/or photoURL.
 * @throws {ServiceError} If no user is authenticated or the update fails.
 */
export const updateUserProfile = async (updates: {
  displayName?: string;
  photoURL?: string;
}): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new ServiceError(
      'No authenticated user found to update profile.',
      ServiceErrorCode.AUTH_REQUIRED
    );
  }
  try {
    await updateProfile(user, updates);
  } catch (error) {
    throw new ServiceError(
      'Failed to update user profile.',
      ServiceErrorCode.AUTH_PROFILE_UPDATE_FAILED,
      error
    );
  }
};
