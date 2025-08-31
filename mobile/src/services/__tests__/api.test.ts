// Mock Supabase first
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

// Mock fetch
global.fetch = jest.fn();

import { apiClient, programsApi, workoutsApi, exercisesApi, analyticsApi } from '../api';
import { supabase } from '../supabase';

describe('API Client', () => {
  const mockSession = {
    access_token: 'mock-access-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} }),
    });
  });

  describe('Basic HTTP Methods', () => {
    it('should make GET request with correct headers', async () => {
      await apiClient.get('/test');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-access-token',
          }),
        })
      );
    });

    it('should make POST request with data', async () => {
      const testData = { name: 'test' };
      await apiClient.post('/test', testData);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-access-token',
          }),
          body: JSON.stringify(testData),
        })
      );
    });

    it('should make PUT request with data', async () => {
      const testData = { id: '123', name: 'updated' };
      await apiClient.put('/test/123', testData);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/123'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(testData),
        })
      );
    });

    it('should make DELETE request', async () => {
      await apiClient.delete('/test/123');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should make PATCH request with data', async () => {
      const testData = { name: 'patched' };
      await apiClient.patch('/test/123', testData);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/123'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(testData),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      });
      
      await expect(apiClient.get('/test')).rejects.toThrow('Not found');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });

    it('should handle malformed error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });
      
      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });
  });

  describe('Authentication', () => {
    it('should handle requests without session', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      
      await apiClient.get('/test');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': '',
          }),
        })
      );
    });
  });

  describe('Programs API', () => {
    it('should get user programs', async () => {
      await programsApi.getUserPrograms();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs/user'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should generate program', async () => {
      const programData = { name: 'Test Program' };
      await programsApi.generateProgram(programData);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs/generate'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(programData),
        })
      );
    });

    it('should get specific program', async () => {
      const programId = 'program-123';
      await programsApi.getProgram(programId);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/programs/${programId}`),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should update program', async () => {
      const programId = 'program-123';
      const updateData = { name: 'Updated Program' };
      await programsApi.updateProgram(programId, updateData);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/programs/${programId}`),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });
  });

  describe('Workouts API', () => {
    it('should get program workouts', async () => {
      const programId = 'program-123';
      await workoutsApi.getProgramWorkouts(programId);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/workouts/program/${programId}`),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should get today workout', async () => {
      await workoutsApi.getTodayWorkout();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/workouts/today'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should start workout', async () => {
      const workoutId = 'workout-123';
      await workoutsApi.startWorkout(workoutId);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/workouts/${workoutId}/start`),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should complete workout', async () => {
      const workoutId = 'workout-123';
      const completionData = { rpe: 8, notes: 'Great workout' };
      await workoutsApi.completeWorkout(workoutId, completionData);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/workouts/${workoutId}/complete`),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(completionData),
        })
      );
    });

    it('should log exercise performance', async () => {
      const workoutId = 'workout-123';
      const exerciseId = 'exercise-456';
      const logData = { sets: 3, reps: 10, weight: 100 };
      
      await workoutsApi.logExercise(workoutId, exerciseId, logData);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/workouts/${workoutId}/exercises/${exerciseId}/log`),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(logData),
        })
      );
    });
  });

  describe('Exercises API', () => {
    it('should get available exercises', async () => {
      await exercisesApi.getAvailableExercises();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/exercises/available'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should get exercise categories', async () => {
      await exercisesApi.getCategories();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/exercises/categories'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should filter exercises', async () => {
      const filters = { equipment_available: ['dumbbells'], training_focus: 'strength' };
      await exercisesApi.filterExercises(filters);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/exercises/filter'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(filters),
        })
      );
    });

    it('should get exercise substitutes', async () => {
      const exerciseId = 'exercise-123';
      await exercisesApi.getSubstitutes(exerciseId);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/exercises/${exerciseId}/substitutes`),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('Analytics API', () => {
    it('should get event dashboard', async () => {
      await analyticsApi.getEventDashboard();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/event/dashboard'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should get strength progress', async () => {
      await analyticsApi.getStrengthProgress();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/strength/progress'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should get readiness score', async () => {
      await analyticsApi.getReadiness();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/readiness'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });
});