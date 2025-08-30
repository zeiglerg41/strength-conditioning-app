// Workout Management Edge Function
// Handles daily workouts, deloads, adaptations, and logging

import { 
  createErrorResponse, 
  createSuccessResponse,
  ValidationError,
  NotFoundError 
} from '../_shared/utils/errors.ts';
import { 
  requireAuthentication,
  parseRequestBody 
} from '../_shared/utils/auth.ts';
import { 
  validateWorkoutContext,
  validateDeloadReason,
  validateUUID 
} from '../_shared/utils/validation.ts';
import { WorkoutQueries, DeloadQueries, ContextQueries } from '../_shared/database/queries.ts';
import { AIProviderFactory } from '../_shared/ai-providers/adapter.ts';
import { Workout, WorkoutAdaptationContext } from '../_shared/types/api.ts';

interface ApplyDeloadRequest {
  deload_type: 'volume_deload' | 'intensity_deload';
  reason: 'poor_sleep' | 'high_stress' | 'fatigue' | 'overreaching';
}

interface LogExerciseRequest {
  exercise_id: string;
  sets_completed: number;
  reps_completed: number[];
  weights_used: number[];
  rpe_scores: number[];
  notes?: string;
}

interface StartWorkoutRequest {
  context?: WorkoutAdaptationContext;
}

interface ModifyWorkoutRequest {
  modifications: Array<{
    exercise_id: string;
    new_sets?: number;
    new_reps?: string;
    new_weight?: number | string;
    reason: string;
  }>;
}

interface TravelModeRequest {
  enabled: boolean;
  location_type?: 'hotel' | 'bodyweight' | 'visiting_gym';
  available_equipment?: string[];
  duration_days?: number;
}

async function handleGetTodaysWorkout(request: Request) {
  const user = await requireAuthentication(request);
  
  const workout = await WorkoutQueries.getTodaysWorkout(user.id);
  
  if (!workout) {
    return createSuccessResponse({
      workout: null,
      message: 'No workout scheduled for today'
    });
  }
  
  // Get current context to adapt workout if needed
  const activeContext = await ContextQueries.getActiveContextPeriod(user.id);
  
  return createSuccessResponse({
    workout,
    active_context: activeContext,
    deload_eligible: await DeloadQueries.checkDeloadEligibility(user.id)
  });
}

async function handleGetWorkout(request: Request, workoutId: string) {
  const user = await requireAuthentication(request);
  
  if (!validateUUID(workoutId)) {
    throw new ValidationError('Invalid workout ID format');
  }
  
  const workout = await WorkoutQueries.getWorkoutById(workoutId, user.id);
  
  if (!workout) {
    throw new NotFoundError('Workout');
  }
  
  return createSuccessResponse(workout);
}

async function handleGetDeloadOptions(request: Request) {
  const user = await requireAuthentication(request);
  const { reason } = await parseRequestBody<{ reason: 'poor_sleep' | 'high_stress' | 'fatigue' | 'overreaching' }>(request);
  
  if (!validateDeloadReason(reason)) {
    throw new ValidationError('Invalid deload reason');
  }
  
  // Check if user is eligible for deload
  const canDeload = await DeloadQueries.checkDeloadEligibility(user.id);
  if (!canDeload) {
    throw new ValidationError('User is not eligible for deload at this time');
  }
  
  // Get today's workout
  const workout = await WorkoutQueries.getTodaysWorkout(user.id);
  if (!workout) {
    throw new NotFoundError('No workout scheduled for today');
  }
  
  // Generate deload options using AI
  const aiProvider = AIProviderFactory.create();
  const deloadOptions = await aiProvider.generateDeloadOptions(workout, reason);
  
  return createSuccessResponse({
    workout_id: workout.id,
    deload_options: deloadOptions,
    reason,
    message: 'Deload options generated'
  });
}

async function handleApplyDeload(request: Request) {
  const user = await requireAuthentication(request);
  const { deload_type, reason } = await parseRequestBody<ApplyDeloadRequest>(request);
  
  if (!validateDeloadReason(reason)) {
    throw new ValidationError('Invalid deload reason');
  }
  
  // Check eligibility
  const canDeload = await DeloadQueries.checkDeloadEligibility(user.id);
  if (!canDeload) {
    throw new ValidationError('User is not eligible for deload at this time');
  }
  
  // Get today's workout
  const workout = await WorkoutQueries.getTodaysWorkout(user.id);
  if (!workout) {
    throw new NotFoundError('No workout scheduled for today');
  }
  
  // Generate and apply deload
  const aiProvider = AIProviderFactory.create();
  const deloadOptions = await aiProvider.generateDeloadOptions(workout, reason);
  
  const selectedOption = deloadOptions.find(opt => opt.type === deload_type);
  if (!selectedOption) {
    throw new ValidationError(`No ${deload_type} option available`);
  }
  
  // Apply deload modifications to workout
  const modifiedWorkout = {
    ...workout,
    current_prescription: {
      ...workout.current_prescription,
      modifications_applied: [
        ...workout.current_prescription.modifications_applied,
        {
          type: deload_type,
          reason,
          changes: selectedOption.description,
          applied_at: new Date().toISOString()
        }
      ]
    }
  };
  
  // Update workout and record deload
  const updatedWorkout = await WorkoutQueries.updateWorkout(workout.id, modifiedWorkout);
  await DeloadQueries.recordDeload(user.id, workout.id, deload_type, reason);
  
  return createSuccessResponse({
    workout: updatedWorkout,
    deload_applied: {
      type: deload_type,
      reason,
      description: selectedOption.description
    },
    message: 'Deload applied successfully'
  });
}

async function handleGetDeloadEligibility(request: Request) {
  const user = await requireAuthentication(request);
  
  const eligibility = await DeloadQueries.getDeloadEligibility(user.id);
  
  return createSuccessResponse(eligibility);
}

async function handleStartWorkout(request: Request, workoutId: string) {
  const user = await requireAuthentication(request);
  const { context } = await parseRequestBody<StartWorkoutRequest>(request);
  
  if (!validateUUID(workoutId)) {
    throw new ValidationError('Invalid workout ID format');
  }
  
  const workout = await WorkoutQueries.getWorkoutById(workoutId, user.id);
  if (!workout) {
    throw new NotFoundError('Workout');
  }
  
  if (workout.status === 'completed') {
    throw new ValidationError('Workout already completed');
  }
  
  // Adapt workout if context is provided
  let adaptedWorkout = workout;
  if (context) {
    validateWorkoutContext(context);
    
    const aiProvider = AIProviderFactory.create();
    adaptedWorkout = await aiProvider.adaptWorkout(workout, context);
  }
  
  // Update workout status
  const updatedWorkout = await WorkoutQueries.updateWorkout(workoutId, {
    ...adaptedWorkout,
    status: 'in_progress'
  });
  
  return createSuccessResponse({
    workout: updatedWorkout,
    message: 'Workout started'
  });
}

async function handleLogExercise(request: Request, workoutId: string) {
  const user = await requireAuthentication(request);
  const exerciseData = await parseRequestBody<LogExerciseRequest>(request);
  
  if (!validateUUID(workoutId)) {
    throw new ValidationError('Invalid workout ID format');
  }
  
  const workout = await WorkoutQueries.getWorkoutById(workoutId, user.id);
  if (!workout) {
    throw new NotFoundError('Workout');
  }
  
  if (workout.status !== 'in_progress') {
    throw new ValidationError('Workout must be started before logging exercises');
  }
  
  // Log exercise performance (this would typically go to a separate exercise_logs table)
  await WorkoutQueries.logExercisePerformance(workoutId, exerciseData);
  
  return createSuccessResponse({
    message: 'Exercise logged successfully',
    exercise_id: exerciseData.exercise_id,
    sets_completed: exerciseData.sets_completed
  });
}

async function handleCompleteWorkout(request: Request, workoutId: string) {
  const user = await requireAuthentication(request);
  
  if (!validateUUID(workoutId)) {
    throw new ValidationError('Invalid workout ID format');
  }
  
  const workout = await WorkoutQueries.getWorkoutById(workoutId, user.id);
  if (!workout) {
    throw new NotFoundError('Workout');
  }
  
  if (workout.status === 'completed') {
    throw new ValidationError('Workout already completed');
  }
  
  const completedWorkout = await WorkoutQueries.updateWorkout(workoutId, {
    status: 'completed'
  });
  
  return createSuccessResponse({
    workout: completedWorkout,
    message: 'Workout completed successfully'
  });
}

async function handleModifyWorkout(request: Request, workoutId: string) {
  const user = await requireAuthentication(request);
  const { modifications } = await parseRequestBody<ModifyWorkoutRequest>(request);
  
  if (!validateUUID(workoutId)) {
    throw new ValidationError('Invalid workout ID format');
  }
  
  const workout = await WorkoutQueries.getWorkoutById(workoutId, user.id);
  if (!workout) {
    throw new NotFoundError('Workout');
  }
  
  // Apply modifications
  const modifiedWorkout = {
    ...workout,
    current_prescription: {
      ...workout.current_prescription,
      modifications_applied: [
        ...workout.current_prescription.modifications_applied,
        ...modifications.map(mod => ({
          type: 'manual_modification' as const,
          reason: mod.reason,
          changes: `Modified ${mod.exercise_id}: ${JSON.stringify(mod)}`,
          applied_at: new Date().toISOString()
        }))
      ]
    },
    status: 'modified' as const
  };
  
  const updatedWorkout = await WorkoutQueries.updateWorkout(workoutId, modifiedWorkout);
  
  return createSuccessResponse({
    workout: updatedWorkout,
    modifications_applied: modifications.length,
    message: 'Workout modified successfully'
  });
}

async function handleToggleTravelMode(request: Request) {
  const user = await requireAuthentication(request);
  const { enabled, location_type, available_equipment, duration_days } = await parseRequestBody<TravelModeRequest>(request);
  
  if (enabled) {
    // Create context period for travel
    const contextPeriod = {
      id: crypto.randomUUID(),
      user_id: user.id,
      start_date: new Date().toISOString(),
      end_date: duration_days ? 
        new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000).toISOString() :
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days
      context_type: 'travel',
      location_type: location_type || 'hotel',
      location_details: { travel_mode: true },
      equipment_override: available_equipment || [],
      schedule_constraints: {},
      status: 'active' as const
    };
    
    await ContextQueries.createContextPeriod(contextPeriod);
    
    return createSuccessResponse({
      travel_mode: true,
      context_period: contextPeriod,
      message: 'Travel mode activated'
    });
  } else {
    // Disable active travel context periods
    const activeContext = await ContextQueries.getActiveContextPeriod(user.id);
    if (activeContext && activeContext.context_type === 'travel') {
      await ContextQueries.endContextPeriod(activeContext.id);
    }
    
    return createSuccessResponse({
      travel_mode: false,
      message: 'Travel mode deactivated'
    });
  }
}

async function handleGetUpcomingWorkouts(request: Request) {
  const user = await requireAuthentication(request);
  
  const workouts = await WorkoutQueries.getUpcomingWorkouts(user.id, 7);
  
  return createSuccessResponse({
    workouts,
    count: workouts.length,
    period: 'next 7 days'
  });
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    const pathParts = path.split('/').filter(Boolean);
    
    // Route handling
    if (path === '/workouts/today' && method === 'GET') {
      return await handleGetTodaysWorkout(req);
    }
    
    if (path === '/workouts/today/deload-options' && method === 'POST') {
      return await handleGetDeloadOptions(req);
    }
    
    if (path === '/workouts/today/apply-deload' && method === 'PUT') {
      return await handleApplyDeload(req);
    }
    
    if (path === '/workouts/deload-eligibility' && method === 'GET') {
      return await handleGetDeloadEligibility(req);
    }
    
    if (path === '/workouts/travel-mode' && method === 'POST') {
      return await handleToggleTravelMode(req);
    }
    
    if (path === '/workouts/upcoming' && method === 'GET') {
      return await handleGetUpcomingWorkouts(req);
    }
    
    if (pathParts.length === 2 && pathParts[0] === 'workouts' && method === 'GET') {
      return await handleGetWorkout(req, pathParts[1]);
    }
    
    if (pathParts.length === 3 && pathParts[0] === 'workouts' && pathParts[2] === 'start' && method === 'POST') {
      return await handleStartWorkout(req, pathParts[1]);
    }
    
    if (pathParts.length === 3 && pathParts[0] === 'workouts' && pathParts[2] === 'log' && method === 'PUT') {
      return await handleLogExercise(req, pathParts[1]);
    }
    
    if (pathParts.length === 3 && pathParts[0] === 'workouts' && pathParts[2] === 'complete' && method === 'POST') {
      return await handleCompleteWorkout(req, pathParts[1]);
    }
    
    if (pathParts.length === 3 && pathParts[0] === 'workouts' && pathParts[2] === 'modify' && method === 'PUT') {
      return await handleModifyWorkout(req, pathParts[1]);
    }
    
    // Handle preflight OPTIONS requests
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }
    
    // Route not found
    throw new ValidationError(`Route ${method} ${path} not found`);
    
  } catch (error) {
    console.error('Workouts function error:', error);
    return createErrorResponse(error, requestId);
  }
});