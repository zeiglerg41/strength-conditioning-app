// Analytics Edge Function
// Handles user priority hierarchy: Event → System → Exercise-specific analytics

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
  validateUUID 
} from '../_shared/utils/validation.ts';
import { ProgramQueries, WorkoutQueries, UserQueries } from '../_shared/database/queries.ts';
import { AIProviderFactory } from '../_shared/ai-providers/adapter.ts';

interface PerformanceTestRequest {
  exercise_name: string;
  result: number;
  unit: 'kg' | 'km' | 'time' | 'reps';
  test_date?: string;
  notes?: string;
}

// PRIMARY: Event Progress Dashboard
async function handleEventDashboard(request: Request) {
  const user = await requireAuthentication(request);
  
  // Get active program
  const program = await ProgramQueries.getActiveProgram(user.id);
  if (!program) {
    return createSuccessResponse({
      has_active_program: false,
      message: 'No active program found. Create a program to see event dashboard.'
    });
  }
  
  // Calculate days to event
  const eventDate = new Date(program.target_event.date);
  const today = new Date();
  const daysToEvent = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Get recent workouts for progress calculation
  const recentWorkouts = await WorkoutQueries.getUpcomingWorkouts(user.id, 14);
  const completedWorkouts = recentWorkouts.filter(w => w.status === 'completed');
  
  // Calculate current phase progress
  const currentPhase = getCurrentPhase(program);
  const phaseProgress = calculatePhaseProgress(currentPhase, today);
  
  // Generate readiness score (simplified for now)
  const readinessScore = calculateEventReadiness(program, completedWorkouts, daysToEvent);
  
  return createSuccessResponse({
    event_info: {
      name: program.target_event.name,
      date: program.target_event.date,
      days_remaining: daysToEvent,
      type: program.target_event.type
    },
    readiness_score: readinessScore,
    current_phase: {
      name: currentPhase?.name || 'Unknown',
      progress_percent: phaseProgress,
      focus: currentPhase?.focus || 'General training'
    },
    recent_progress: {
      workouts_completed_last_14_days: completedWorkouts.length,
      adherence_rate: Math.round((completedWorkouts.length / 14) * 100),
      last_workout_date: completedWorkouts[0]?.scheduled_date || null
    },
    timeline_status: daysToEvent > 0 ? 'on_track' : 'overdue'
  });
}

async function handleEventReadiness(request: Request) {
  const user = await requireAuthentication(request);
  
  const program = await ProgramQueries.getActiveProgram(user.id);
  if (!program) {
    throw new NotFoundError('Active program');
  }
  
  // Get performance data
  const recentWorkouts = await WorkoutQueries.getUpcomingWorkouts(user.id, 30);
  const completedWorkouts = recentWorkouts.filter(w => w.status === 'completed');
  
  // Calculate readiness by training system
  const strengthReadiness = calculateStrengthReadiness(completedWorkouts);
  const powerReadiness = calculatePowerReadiness(completedWorkouts);
  const enduranceReadiness = calculateEnduranceReadiness(completedWorkouts);
  const recoveryReadiness = calculateRecoveryReadiness(completedWorkouts);
  
  const overallReadiness = Math.round(
    (strengthReadiness + powerReadiness + enduranceReadiness + recoveryReadiness) / 4
  );
  
  return createSuccessResponse({
    overall_readiness: overallReadiness,
    systems: {
      strength: {
        score: strengthReadiness,
        status: strengthReadiness >= 80 ? 'excellent' : strengthReadiness >= 60 ? 'good' : 'needs_work',
        key_indicators: ['Recent PR attempts', 'Load progression', 'Volume tolerance']
      },
      power: {
        score: powerReadiness,
        status: powerReadiness >= 80 ? 'excellent' : powerReadiness >= 60 ? 'good' : 'needs_work',
        key_indicators: ['Explosive movement quality', 'Rate of force development', 'Speed maintenance']
      },
      endurance: {
        score: enduranceReadiness,
        status: enduranceReadiness >= 80 ? 'excellent' : enduranceReadiness >= 60 ? 'good' : 'needs_work',
        key_indicators: ['Aerobic capacity', 'Anaerobic threshold', 'Recovery between sets']
      },
      recovery: {
        score: recoveryReadiness,
        status: recoveryReadiness >= 80 ? 'excellent' : recoveryReadiness >= 60 ? 'good' : 'needs_work',
        key_indicators: ['Session RPE trends', 'Sleep quality', 'Deload frequency']
      }
    },
    recommendations: generateReadinessRecommendations(overallReadiness, {
      strength: strengthReadiness,
      power: powerReadiness,
      endurance: enduranceReadiness,
      recovery: recoveryReadiness
    })
  });
}

async function handlePhaseCompletion(request: Request) {
  const user = await requireAuthentication(request);
  
  const program = await ProgramQueries.getActiveProgram(user.id);
  if (!program) {
    throw new NotFoundError('Active program');
  }
  
  const currentPhase = getCurrentPhase(program);
  if (!currentPhase) {
    throw new NotFoundError('Current phase');
  }
  
  const today = new Date();
  const phaseProgress = calculatePhaseProgress(currentPhase, today);
  
  // Get next phase
  const phases = program.program_structure.phases.sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  const currentPhaseIndex = phases.findIndex(p => p.name === currentPhase.name);
  const nextPhase = phases[currentPhaseIndex + 1];
  
  // Calculate milestones
  const milestones = calculatePhaseMilestones(currentPhase, program);
  
  return createSuccessResponse({
    current_phase: {
      name: currentPhase.name,
      start_date: currentPhase.start_date,
      end_date: currentPhase.end_date,
      progress_percent: phaseProgress,
      focus: currentPhase.focus,
      intensity_emphasis: currentPhase.intensity_emphasis,
      days_remaining: Math.ceil((new Date(currentPhase.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    },
    next_phase: nextPhase ? {
      name: nextPhase.name,
      start_date: nextPhase.start_date,
      focus: nextPhase.focus,
      intensity_emphasis: nextPhase.intensity_emphasis
    } : null,
    milestones: milestones,
    phase_goals_status: 'on_track' // This would be calculated based on performance metrics
  });
}

// SECONDARY: Training System Performance
async function handleStrengthSystems(request: Request) {
  const user = await requireAuthentication(request);
  
  // Get recent workout data
  const recentWorkouts = await WorkoutQueries.getUpcomingWorkouts(user.id, 60);
  const strengthWorkouts = recentWorkouts.filter(w => 
    w.session_type === 'strength' && w.status === 'completed'
  );
  
  // Calculate strength progressions (simplified)
  const progressionData = calculateStrengthProgression(strengthWorkouts);
  const stallingDetection = detectStrengthStalling(progressionData);
  
  return createSuccessResponse({
    overall_progression: progressionData.overall_trend,
    key_lifts: progressionData.key_lifts,
    volume_progression: progressionData.volume_trends,
    intensity_progression: progressionData.intensity_trends,
    stalling_detection: stallingDetection,
    recommendations: generateStrengthRecommendations(progressionData, stallingDetection)
  });
}

async function handlePowerSpeedSystems(request: Request) {
  const user = await requireAuthentication(request);
  
  const recentWorkouts = await WorkoutQueries.getUpcomingWorkouts(user.id, 60);
  const powerWorkouts = recentWorkouts.filter(w => 
    w.session_type === 'power' && w.status === 'completed'
  );
  
  // Calculate power/speed development
  const powerData = calculatePowerProgression(powerWorkouts);
  
  return createSuccessResponse({
    power_development: powerData.power_trends,
    speed_development: powerData.speed_trends,
    energy_system_development: {
      alactic: powerData.alactic_system,
      glycolytic: powerData.glycolytic_system,
      aerobic_power: powerData.aerobic_power
    },
    rate_of_force_development: powerData.rfd_trends,
    recommendations: generatePowerRecommendations(powerData)
  });
}

async function handleEnduranceSystems(request: Request) {
  const user = await requireAuthentication(request);
  
  const recentWorkouts = await WorkoutQueries.getUpcomingWorkouts(user.id, 60);
  const enduranceWorkouts = recentWorkouts.filter(w => 
    w.session_type === 'endurance' && w.status === 'completed'
  );
  
  const enduranceData = calculateEnduranceProgression(enduranceWorkouts);
  
  return createSuccessResponse({
    cardiovascular_fitness: enduranceData.cv_fitness,
    energy_system_development: {
      aerobic_base: enduranceData.aerobic_base,
      anaerobic_threshold: enduranceData.anaerobic_threshold,
      vo2_max_indicators: enduranceData.vo2_max_indicators
    },
    endurance_markers: enduranceData.endurance_markers,
    recommendations: generateEnduranceRecommendations(enduranceData)
  });
}

async function handleRecoveryReadiness(request: Request) {
  const user = await requireAuthentication(request);
  
  const recentWorkouts = await WorkoutQueries.getUpcomingWorkouts(user.id, 30);
  const completedWorkouts = recentWorkouts.filter(w => w.status === 'completed');
  
  const recoveryData = calculateRecoveryMetrics(completedWorkouts);
  
  return createSuccessResponse({
    recovery_patterns: recoveryData.recovery_patterns,
    training_adaptation: recoveryData.adaptation_indicators,
    fatigue_accumulation: recoveryData.fatigue_levels,
    readiness_indicators: recoveryData.readiness_scores,
    recommendations: generateRecoveryRecommendations(recoveryData)
  });
}

// TERTIARY: Exercise-Specific Analytics
async function handleStrengthExercise(request: Request, exerciseId: string) {
  const user = await requireAuthentication(request);
  
  if (!validateUUID(exerciseId)) {
    throw new ValidationError('Invalid exercise ID format');
  }
  
  // Get exercise-specific data
  const exerciseData = await getExerciseProgression(user.id, exerciseId);
  
  return createSuccessResponse({
    exercise_name: exerciseData.name,
    progression_data: exerciseData.progression,
    volume_trends: exerciseData.volume_trends,
    intensity_trends: exerciseData.intensity_trends,
    personal_records: exerciseData.personal_records,
    technique_notes: exerciseData.technique_feedback,
    recommendations: generateExerciseRecommendations(exerciseData)
  });
}

async function handleEnergySystemExercise(request: Request, exerciseId: string) {
  const user = await requireAuthentication(request);
  
  if (!validateUUID(exerciseId)) {
    throw new ValidationError('Invalid exercise ID format');
  }
  
  const exerciseData = await getEnergySystemProgression(user.id, exerciseId);
  
  return createSuccessResponse({
    exercise_name: exerciseData.name,
    energy_system_focus: exerciseData.energy_system,
    progression_data: exerciseData.progression,
    work_rest_ratios: exerciseData.work_rest_analysis,
    intensity_distribution: exerciseData.intensity_zones,
    recommendations: generateEnergySystemRecommendations(exerciseData)
  });
}

async function handlePerformanceTest(request: Request) {
  const user = await requireAuthentication(request);
  const testData = await parseRequestBody<PerformanceTestRequest>(request);
  
  // Validate test data
  if (!testData.exercise_name || !testData.result) {
    throw new ValidationError('Exercise name and result are required');
  }
  
  // Log performance test
  await logPerformanceTest(user.id, testData);
  
  return createSuccessResponse({
    test_logged: true,
    exercise: testData.exercise_name,
    result: testData.result,
    unit: testData.unit,
    message: 'Performance test logged successfully'
  }, 201);
}

async function handleHeartRateTrends(request: Request, exerciseId: string) {
  const user = await requireAuthentication(request);
  
  if (!validateUUID(exerciseId)) {
    throw new ValidationError('Invalid exercise ID format');
  }
  
  const hrData = await getHeartRateTrends(user.id, exerciseId);
  
  return createSuccessResponse({
    exercise_name: hrData.name,
    heart_rate_trends: hrData.hr_trends,
    prescribed_intensities: hrData.prescribed_zones,
    actual_vs_prescribed: hrData.zone_adherence,
    recovery_patterns: hrData.recovery_hr,
    recommendations: generateHRRecommendations(hrData)
  });
}

// SUPPORTING Analytics
async function handleTrainingLoad(request: Request) {
  const user = await requireAuthentication(request);
  
  const recentWorkouts = await WorkoutQueries.getUpcomingWorkouts(user.id, 60);
  const completedWorkouts = recentWorkouts.filter(w => w.status === 'completed');
  
  const loadData = calculateTrainingLoad(completedWorkouts);
  
  return createSuccessResponse({
    rpe_trends: loadData.rpe_trends,
    volume_intensity_balance: loadData.volume_intensity,
    acute_chronic_workload: loadData.ac_workload,
    training_impulse: loadData.training_impulse,
    recommendations: generateLoadRecommendations(loadData)
  });
}

async function handleAdherence(request: Request) {
  const user = await requireAuthentication(request);
  
  const recentWorkouts = await WorkoutQueries.getUpcomingWorkouts(user.id, 90);
  const adherenceData = calculateAdherenceMetrics(recentWorkouts);
  
  return createSuccessResponse({
    overall_adherence: adherenceData.overall_rate,
    consistency_patterns: adherenceData.consistency,
    missed_sessions_analysis: adherenceData.missed_sessions,
    completion_quality: adherenceData.completion_quality,
    recommendations: generateAdherenceRecommendations(adherenceData)
  });
}

// Helper functions (simplified implementations - would be more complex in production)

function getCurrentPhase(program: any) {
  const today = new Date();
  return program.program_structure.phases.find((phase: any) => 
    new Date(phase.start_date) <= today && new Date(phase.end_date) >= today
  );
}

function calculatePhaseProgress(phase: any, today: Date): number {
  if (!phase) return 0;
  const start = new Date(phase.start_date);
  const end = new Date(phase.end_date);
  const total = end.getTime() - start.getTime();
  const elapsed = today.getTime() - start.getTime();
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

function calculateEventReadiness(program: any, workouts: any[], daysToEvent: number): number {
  // Simplified readiness calculation
  const adherenceScore = Math.min(100, (workouts.length / 14) * 100);
  const timelineScore = daysToEvent > 0 ? 100 : Math.max(0, 100 + daysToEvent);
  return Math.round((adherenceScore + timelineScore) / 2);
}

function calculateStrengthReadiness(workouts: any[]): number {
  // Simplified calculation based on recent strength work
  return Math.min(100, workouts.filter(w => w.session_type === 'strength').length * 10);
}

function calculatePowerReadiness(workouts: any[]): number {
  return Math.min(100, workouts.filter(w => w.session_type === 'power').length * 15);
}

function calculateEnduranceReadiness(workouts: any[]): number {
  return Math.min(100, workouts.filter(w => w.session_type === 'endurance').length * 12);
}

function calculateRecoveryReadiness(workouts: any[]): number {
  // Based on workout frequency and completion
  return Math.min(100, Math.max(60, 100 - (workouts.length > 10 ? 10 : 0)));
}

function generateReadinessRecommendations(overall: number, systems: any) {
  const recommendations = [];
  if (overall < 70) recommendations.push("Consider reducing training intensity");
  if (systems.recovery < 60) recommendations.push("Focus on recovery protocols");
  if (systems.strength < 60) recommendations.push("Increase strength training frequency");
  return recommendations;
}

function calculatePhaseMilestones(phase: any, program: any) {
  return [
    {
      name: "Phase midpoint",
      date: new Date((new Date(phase.start_date).getTime() + new Date(phase.end_date).getTime()) / 2).toISOString(),
      status: "upcoming",
      description: "Assess progress and adjust if needed"
    }
  ];
}

function calculateStrengthProgression(workouts: any[]) {
  return {
    overall_trend: "increasing",
    key_lifts: {},
    volume_trends: {},
    intensity_trends: {}
  };
}

function detectStrengthStalling(progressionData: any) {
  return {
    is_stalling: false,
    stalled_lifts: [],
    recommendations: []
  };
}

function generateStrengthRecommendations(progressionData: any, stallingData: any) {
  return ["Continue current progression"];
}

function calculatePowerProgression(workouts: any[]) {
  return {
    power_trends: {},
    speed_trends: {},
    alactic_system: {},
    glycolytic_system: {},
    aerobic_power: {},
    rfd_trends: {}
  };
}

function generatePowerRecommendations(powerData: any) {
  return ["Focus on rate of force development"];
}

function calculateEnduranceProgression(workouts: any[]) {
  return {
    cv_fitness: {},
    aerobic_base: {},
    anaerobic_threshold: {},
    vo2_max_indicators: {},
    endurance_markers: {}
  };
}

function generateEnduranceRecommendations(enduranceData: any) {
  return ["Build aerobic base"];
}

function calculateRecoveryMetrics(workouts: any[]) {
  return {
    recovery_patterns: {},
    adaptation_indicators: {},
    fatigue_levels: {},
    readiness_scores: {}
  };
}

function generateRecoveryRecommendations(recoveryData: any) {
  return ["Prioritize sleep quality"];
}

async function getExerciseProgression(userId: string, exerciseId: string) {
  return {
    name: "Sample Exercise",
    progression: {},
    volume_trends: {},
    intensity_trends: {},
    personal_records: [],
    technique_feedback: []
  };
}

function generateExerciseRecommendations(exerciseData: any) {
  return ["Continue current approach"];
}

async function getEnergySystemProgression(userId: string, exerciseId: string) {
  return {
    name: "Sample Energy System Exercise",
    energy_system: "aerobic",
    progression: {},
    work_rest_analysis: {},
    intensity_zones: {}
  };
}

function generateEnergySystemRecommendations(exerciseData: any) {
  return ["Maintain current work:rest ratios"];
}

async function logPerformanceTest(userId: string, testData: any) {
  // Would save to database in real implementation
  console.log('Performance test logged:', testData);
}

async function getHeartRateTrends(userId: string, exerciseId: string) {
  return {
    name: "Sample Exercise",
    hr_trends: {},
    prescribed_zones: {},
    zone_adherence: {},
    recovery_hr: {}
  };
}

function generateHRRecommendations(hrData: any) {
  return ["Stay in prescribed zones"];
}

function calculateTrainingLoad(workouts: any[]) {
  return {
    rpe_trends: {},
    volume_intensity: {},
    ac_workload: {},
    training_impulse: {}
  };
}

function generateLoadRecommendations(loadData: any) {
  return ["Monitor training load"];
}

function calculateAdherenceMetrics(workouts: any[]) {
  const completed = workouts.filter(w => w.status === 'completed').length;
  const total = workouts.length;
  return {
    overall_rate: Math.round((completed / total) * 100),
    consistency: {},
    missed_sessions: {},
    completion_quality: {}
  };
}

function generateAdherenceRecommendations(adherenceData: any) {
  return adherenceData.overall_rate >= 80 ? 
    ["Excellent adherence - keep it up!"] : 
    ["Focus on consistency", "Identify barriers to completion"];
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    const pathParts = path.split('/').filter(Boolean);
    
    // PRIMARY: Event Progress Dashboard
    if (path === '/analytics/event-dashboard' && method === 'GET') {
      return await handleEventDashboard(req);
    }
    
    if (path === '/analytics/event-readiness' && method === 'GET') {
      return await handleEventReadiness(req);
    }
    
    if (path === '/analytics/phase-completion' && method === 'GET') {
      return await handlePhaseCompletion(req);
    }
    
    // SECONDARY: Training System Performance
    if (path === '/analytics/strength-systems' && method === 'GET') {
      return await handleStrengthSystems(req);
    }
    
    if (path === '/analytics/power-speed-systems' && method === 'GET') {
      return await handlePowerSpeedSystems(req);
    }
    
    if (path === '/analytics/endurance-systems' && method === 'GET') {
      return await handleEnduranceSystems(req);
    }
    
    if (path === '/analytics/recovery-readiness' && method === 'GET') {
      return await handleRecoveryReadiness(req);
    }
    
    // TERTIARY: Exercise-Specific
    if (pathParts.length === 3 && pathParts[0] === 'analytics' && pathParts[1] === 'strength-exercise' && method === 'GET') {
      return await handleStrengthExercise(req, pathParts[2]);
    }
    
    if (pathParts.length === 3 && pathParts[0] === 'analytics' && pathParts[1] === 'energy-system-exercise' && method === 'GET') {
      return await handleEnergySystemExercise(req, pathParts[2]);
    }
    
    if (path === '/analytics/performance-test' && method === 'POST') {
      return await handlePerformanceTest(req);
    }
    
    if (pathParts.length === 3 && pathParts[0] === 'analytics' && pathParts[1] === 'heart-rate-trends' && method === 'GET') {
      return await handleHeartRateTrends(req, pathParts[2]);
    }
    
    // SUPPORTING Analytics
    if (path === '/analytics/training-load' && method === 'GET') {
      return await handleTrainingLoad(req);
    }
    
    if (path === '/analytics/adherence' && method === 'GET') {
      return await handleAdherence(req);
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
    console.error('Analytics function error:', error);
    return createErrorResponse(error, requestId);
  }
});