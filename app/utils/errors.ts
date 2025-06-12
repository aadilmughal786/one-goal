// src/utils/errors.ts

/**
 * Base custom error class for the application.
 * All specific application errors should extend this class.
 */
export class AppBaseError extends Error {
  public code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = this.constructor.name; // Sets the name property to the class name (e.g., 'FirebaseServiceError')
    this.code = code;

    // Capture stack trace, excluding the constructor call, for better debugging.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Specific error class for issues encountered in FirebaseService.
 */
export class FirebaseServiceError extends AppBaseError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super(`Firebase Service Error: ${message}`, 'FIREBASE_SERVICE_FAILED');
  }
}

/**
 * Specific error class for issues encountered in LocalStorageService.
 */
export class LocalStorageError extends AppBaseError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super(`Local Storage Error: ${message}`, 'LOCAL_STORAGE_FAILED');
  }
}
