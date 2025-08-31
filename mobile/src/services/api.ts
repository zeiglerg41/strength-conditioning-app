import { supabase } from './supabase';
import { ApiResponse, PaginatedResponse } from '../types';

// Base API configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;

// API client class for making requests to Edge Functions
class ApiClient {
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      // Get the current session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      
      const url = `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session ? `Bearer ${session.access_token}` : '',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  // POST request
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // PATCH request
  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Create and export API client instance
export const apiClient = new ApiClient();

// Specific API methods for our app

// Programs API
export const programsApi = {
  // Get user's programs
  getUserPrograms: () => 
    apiClient.get<ApiResponse>('/programs/user'),
  
  // Generate new program
  generateProgram: (data: any) =>
    apiClient.post<ApiResponse>('/programs/generate', data),
  
  // Get specific program
  getProgram: (programId: string) =>
    apiClient.get<ApiResponse>(`/programs/${programId}`),
  
  // Update program
  updateProgram: (programId: string, data: any) =>
    apiClient.put<ApiResponse>(`/programs/${programId}`, data),
};

// Workouts API
export const workoutsApi = {
  // Get program workouts
  getProgramWorkouts: (programId: string) =>
    apiClient.get<PaginatedResponse>(`/workouts/program/${programId}`),
  
  // Get today's workout
  getTodayWorkout: () =>
    apiClient.get<ApiResponse>('/workouts/today'),
  
  // Start workout
  startWorkout: (workoutId: string) =>
    apiClient.post<ApiResponse>(`/workouts/${workoutId}/start`),
  
  // Complete workout
  completeWorkout: (workoutId: string, data: any) =>
    apiClient.post<ApiResponse>(`/workouts/${workoutId}/complete`, data),
  
  // Log exercise performance
  logExercise: (workoutId: string, exerciseId: string, data: any) =>
    apiClient.post<ApiResponse>(`/workouts/${workoutId}/exercises/${exerciseId}/log`, data),
};

// Exercises API
export const exercisesApi = {
  // Get available exercises
  getAvailableExercises: () =>
    apiClient.get<ApiResponse>('/exercises/available'),
  
  // Get exercise categories
  getCategories: () =>
    apiClient.get<ApiResponse>('/exercises/categories'),
  
  // Filter exercises
  filterExercises: (filters: any) =>
    apiClient.post<ApiResponse>('/exercises/filter', filters),
  
  // Get exercise substitutes
  getSubstitutes: (exerciseId: string) =>
    apiClient.get<ApiResponse>(`/exercises/${exerciseId}/substitutes`),
};

// Analytics API
export const analyticsApi = {
  // Get event dashboard
  getEventDashboard: () =>
    apiClient.get<ApiResponse>('/analytics/event/dashboard'),
  
  // Get strength progress
  getStrengthProgress: () =>
    apiClient.get<ApiResponse>('/analytics/strength/progress'),
  
  // Get readiness score
  getReadiness: () =>
    apiClient.get<ApiResponse>('/analytics/readiness'),
};