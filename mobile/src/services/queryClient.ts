import { QueryClient } from '@tanstack/react-query';

// Create a client with configuration optimized for mobile and offline usage
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Don't retry immediately
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for better UX
      refetchOnWindowFocus: true,
      // Refetch when network reconnects (important for mobile)
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Retry after 1 second
      retryDelay: 1000,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth related
  user: ['user'] as const,
  userProfile: (userId: string) => ['user', 'profile', userId] as const,

  // Programs
  programs: ['programs'] as const,
  program: (programId: string) => ['programs', programId] as const,
  userPrograms: (userId: string) => ['programs', 'user', userId] as const,

  // Workouts
  workouts: ['workouts'] as const,
  workout: (workoutId: string) => ['workouts', workoutId] as const,
  programWorkouts: (programId: string) => ['workouts', 'program', programId] as const,
  
  // Exercises
  exercises: ['exercises'] as const,
  exerciseCategories: ['exercises', 'categories'] as const,
  contextualExercises: (context: string) => ['exercises', 'contextual', context] as const,

  // Analytics
  analytics: ['analytics'] as const,
  eventReadiness: (userId: string) => ['analytics', 'event', 'readiness', userId] as const,
  strengthProgress: (userId: string) => ['analytics', 'strength', 'progress', userId] as const,
  
  // Context periods
  contextPeriods: ['context-periods'] as const,
  activeContext: (userId: string) => ['context-periods', 'active', userId] as const,
} as const;

// Error handling utility
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};