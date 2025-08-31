import { queryClient, queryKeys, getErrorMessage } from '../queryClient';

describe('QueryClient Configuration', () => {
  it('should have correct default options', () => {
    const defaultOptions = queryClient.getDefaultOptions();
    
    expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000); // 5 minutes
    expect(defaultOptions.queries?.gcTime).toBe(10 * 60 * 1000); // 10 minutes
    expect(defaultOptions.queries?.retry).toBe(2);
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(true);
    expect(defaultOptions.queries?.refetchOnReconnect).toBe(true);
    expect(defaultOptions.queries?.refetchOnMount).toBe(false);
  });

  it('should have correct mutation options', () => {
    const defaultOptions = queryClient.getDefaultOptions();
    
    expect(defaultOptions.mutations?.retry).toBe(1);
    expect(defaultOptions.mutations?.retryDelay).toBe(1000);
  });
});

describe('Query Keys Factory', () => {
  it('should generate correct user query keys', () => {
    expect(queryKeys.user).toEqual(['user']);
    expect(queryKeys.userProfile('123')).toEqual(['user', 'profile', '123']);
  });

  it('should generate correct program query keys', () => {
    expect(queryKeys.programs).toEqual(['programs']);
    expect(queryKeys.program('prog-123')).toEqual(['programs', 'prog-123']);
    expect(queryKeys.userPrograms('user-123')).toEqual(['programs', 'user', 'user-123']);
  });

  it('should generate correct workout query keys', () => {
    expect(queryKeys.workouts).toEqual(['workouts']);
    expect(queryKeys.workout('workout-123')).toEqual(['workouts', 'workout-123']);
    expect(queryKeys.programWorkouts('prog-123')).toEqual(['workouts', 'program', 'prog-123']);
  });

  it('should generate correct exercise query keys', () => {
    expect(queryKeys.exercises).toEqual(['exercises']);
    expect(queryKeys.exerciseCategories).toEqual(['exercises', 'categories']);
    expect(queryKeys.contextualExercises('home')).toEqual(['exercises', 'contextual', 'home']);
  });

  it('should generate correct analytics query keys', () => {
    expect(queryKeys.analytics).toEqual(['analytics']);
    expect(queryKeys.eventReadiness('user-123')).toEqual(['analytics', 'event', 'readiness', 'user-123']);
    expect(queryKeys.strengthProgress('user-123')).toEqual(['analytics', 'strength', 'progress', 'user-123']);
  });

  it('should generate correct context period query keys', () => {
    expect(queryKeys.contextPeriods).toEqual(['context-periods']);
    expect(queryKeys.activeContext('user-123')).toEqual(['context-periods', 'active', 'user-123']);
  });
});

describe('Error Handling Utility', () => {
  it('should extract message from Error object', () => {
    const error = new Error('Test error message');
    expect(getErrorMessage(error)).toBe('Test error message');
  });

  it('should return string error as is', () => {
    const error = 'String error message';
    expect(getErrorMessage(error)).toBe('String error message');
  });

  it('should handle unknown error types', () => {
    const error = { someProperty: 'value' };
    expect(getErrorMessage(error)).toBe('An unexpected error occurred');
  });

  it('should handle null/undefined errors', () => {
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
  });

  it('should handle number errors', () => {
    expect(getErrorMessage(404)).toBe('An unexpected error occurred');
  });
});