/**
 * Type-safe error handling utilities
 * Menggantikan penggunaan any dengan tipe yang lebih aman
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'DATABASE_ERROR', 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Type guard untuk mengecek apakah value adalah Error object
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard untuk mengecek apakah value adalah AppError
 */
export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

/**
 * Safely extract error code from unknown error
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isAppError(error)) {
    return error.code;
  }
  if (error && typeof error === 'object' && 'code' in error) {
    return String(error.code);
  }
  return undefined;
}

/**
 * Format error untuk logging
 */
export function formatErrorForLog(error: unknown): {
  message: string;
  code?: string;
  stack?: string;
  details?: unknown;
} {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);
  
  return {
    message,
    code,
    stack: isError(error) ? error.stack : undefined,
    details: isAppError(error) ? error.details : undefined,
  };
}

/**
 * Handle error dengan type safety
 * Menggantikan catch (e: any)
 */
export function handleError(error: unknown, context?: string): void {
  const formattedError = formatErrorForLog(error);
  
  if (context) {
    console.error(`[${context}]`, formattedError);
  } else {
    console.error(formattedError);
  }
}
