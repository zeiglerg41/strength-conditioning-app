// Standardized error handling for Edge Functions
// Provides consistent error response format across all endpoints

import { ApiResponse } from '../types/api.ts';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, any>,
    public suggestions?: string[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_REQUIRED', 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'INSUFFICIENT_PERMISSIONS', 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400, field ? { field } : undefined);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number = 60) {
    super('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429, { retry_after: retryAfter });
  }
}

export class AIProviderError extends AppError {
  constructor(provider: string, originalError: string) {
    super(
      `AI provider (${provider}) error: ${originalError}`,
      'AI_PROVIDER_ERROR',
      503,
      { provider, original_error: originalError },
      ['Check your API keys', 'Try again in a few moments', 'Contact support if problem persists']
    );
  }
}

export class DatabaseError extends AppError {
  constructor(operation: string, originalError?: string) {
    super(
      `Database ${operation} failed${originalError ? `: ${originalError}` : ''}`,
      'DATABASE_ERROR',
      500,
      originalError ? { original_error: originalError } : undefined,
      ['Try again in a few moments', 'Contact support if problem persists']
    );
  }
}

export function createErrorResponse(error: Error, requestId?: string): Response {
  let appError: AppError;
  
  if (error instanceof AppError) {
    appError = error;
  } else {
    // Convert unknown errors to AppError
    appError = new AppError(
      error.message || 'Internal server error',
      'INTERNAL_ERROR',
      500
    );
  }
  
  const errorResponse: ApiResponse = {
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details,
      suggestions: appError.suggestions,
    },
    meta: {
      timestamp: new Date().toISOString(),
      request_id: requestId || crypto.randomUUID(),
      version: '1.0.0'
    }
  };
  
  return new Response(
    JSON.stringify(errorResponse),
    {
      status: appError.statusCode,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
  requestId?: string
): Response {
  const successResponse: ApiResponse<T> = {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      request_id: requestId || crypto.randomUUID(),
      version: '1.0.0'
    }
  };
  
  return new Response(
    JSON.stringify(successResponse),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export function handleAsync<T>(
  fn: () => Promise<T>
): Promise<[T | null, Error | null]> {
  return fn()
    .then((data: T) => [data, null] as [T, null])
    .catch((error: Error) => [null, error] as [null, Error]);
}