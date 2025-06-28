// app/utils/errors.ts

/**
 * @file app/utils/errors.ts
 * @description Defines custom error classes and predefined error codes for the application.
 *
 * This centralized error management system allows for consistent and predictable
 * error handling across different services and UI components.
 */

/**
 * Predefined error codes to be used throughout the application's services.
 * Using an enum for codes prevents magic strings and allows for easier error handling.
 */
export enum ServiceErrorCode {
  // Authentication Errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_SIGN_IN_FAILED = 'AUTH_SIGN_IN_FAILED',
  AUTH_SIGN_OUT_FAILED = 'AUTH_SIGN_OUT_FAILED',
  AUTH_PROFILE_UPDATE_FAILED = 'AUTH_PROFILE_UPDATE_FAILED',

  // Data Validation Errors
  VALIDATION_FAILED = 'VALIDATION_FAILED', // General validation error, e.g., from Zod
  INVALID_INPUT = 'INVALID_INPUT', // More specific for function arguments

  // Firestore/Data Errors
  NOT_FOUND = 'NOT_FOUND', // e.g., User document or specific goal not found
  OPERATION_FAILED = 'OPERATION_FAILED', // General failure for a DB operation

  // Generic fallback
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * A base custom error class for the application.
 * All specific application errors should extend this class to ensure consistency.
 */
export class AppBaseError extends Error {
  public readonly code: ServiceErrorCode;
  public readonly originalError?: unknown;

  /**
   * @param message A human-readable error message.
   * @param code A predefined error code from `ServiceErrorCode`.
   * @param originalError The original error object caught in the `catch` block, for debugging.
   */
  constructor(message: string, code: ServiceErrorCode, originalError?: unknown) {
    super(message);
    this.name = this.constructor.name; // Sets the name property to the class name
    this.code = code;
    this.originalError = originalError;

    // Capture stack trace, excluding the constructor call, for better debugging.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * A specific error class for issues encountered in the application's services (e.g., auth, goal services).
 * It extends `AppBaseError` and is the primary error type that should be thrown from service files.
 */
export class ServiceError extends AppBaseError {
  public readonly rawData?: unknown;

  constructor(
    message: string,
    code: ServiceErrorCode = ServiceErrorCode.UNKNOWN_ERROR,
    originalError?: unknown,
    rawData?: unknown
  ) {
    // The message passed to the super constructor is for logging and debugging.
    super(`Service Error: ${message}`, code, originalError);
    this.rawData = rawData;
  }
}
