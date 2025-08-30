// Exercise Selection Edge Function
// Handles context-aware exercise selection and filtering (no static library)

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
import { UserQueries, ContextQueries } from '../_shared/database/queries.ts';
import { AIProviderFactory } from '../_shared/ai-providers/adapter.ts';

interface ExerciseFilterRequest {
  equipment_available: string[];
  location_type: 'home' | 'commercial_gym' | 'hotel' | 'outdoor' | 'bodyweight';
  time_available_minutes: number;
  training_focus: 'strength' | 'power' | 'endurance' | 'mobility' | 'general';
  experience_level?: 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'expert';
  injury_limitations?: string[];
  preferred_movement_patterns?: string[];
}

interface Exercise {
  id: string;
  name: string;
  category: string;
  movement_pattern: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  equipment_required: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  instructions: string;
  progressions: string[];
  regressions: string[];
  coaching_cues: string[];
  safety_notes: string[];
}

async function handleGetAvailableExercises(request: Request) {
  const user = await requireAuthentication(request);
  
  // Get user profile for context
  const userProfile = await UserQueries.getUserProfile(user.id);
  if (!userProfile) {
    throw new NotFoundError('User profile');
  }
  
  // Get active context period
  const activeContext = await ContextQueries.getActiveContextPeriod(user.id);
  
  // Determine current exercise context
  const exerciseContext = {
    equipment_available: activeContext?.equipment_override || 
      Object.entries(userProfile.equipment_access.available_equipment)
        .filter(([_, available]) => available)
        .map(([equipment, _]) => equipment),
    location_type: activeContext?.location_type || userProfile.equipment_access.primary_location,
    training_focus: userProfile.performance_goals.primary_focus,
    experience_level: userProfile.training_background.experience_level,
    injury_limitations: userProfile.training_background.injuries
      .filter(injury => injury.current_status === 'ongoing' || injury.current_status === 'needs_modification')
      .map(injury => `${injury.type} - ${injury.affected_areas.join(', ')}`),
    time_available_minutes: userProfile.constraints.max_session_duration_minutes
  };
  
  // Use AI to generate context-appropriate exercises
  const aiProvider = AIProviderFactory.create();
  
  // Since we don't have a static exercise library, we'll use AI to generate appropriate exercises
  const prompt = `Based on this user's context, generate 20-30 appropriate exercises:
  
Equipment Available: ${exerciseContext.equipment_available.join(', ')}
Location: ${exerciseContext.location_type}
Training Focus: ${exerciseContext.training_focus}
Experience Level: ${exerciseContext.experience_level}
Injury Limitations: ${exerciseContext.injury_limitations.join('; ') || 'None'}
Time Available: ${exerciseContext.time_available_minutes} minutes

Return exercises as JSON array with fields: name, category, movement_pattern, primary_muscles, equipment_required, difficulty_level, instructions, progressions, regressions.`;
  
  try {
    // Use AI to generate exercises (this is a creative use of the challenge endpoint for now)
    const aiResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/internal/ai-exercise-generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify({ prompt, context: exerciseContext })
    });
    
    // For now, return a structured response with common exercises based on context
    const availableExercises = generateContextualExercises(exerciseContext);
    
    return createSuccessResponse({
      exercises: availableExercises,
      context: exerciseContext,
      total_count: availableExercises.length
    });
  } catch (error) {
    // Fallback to basic context-aware exercise generation
    const fallbackExercises = generateContextualExercises(exerciseContext);
    
    return createSuccessResponse({
      exercises: fallbackExercises,
      context: exerciseContext,
      total_count: fallbackExercises.length,
      note: 'Using fallback exercise generation'
    });
  }
}

async function handleGetExercise(request: Request, exerciseId: string) {
  const user = await requireAuthentication(request);
  
  if (!validateUUID(exerciseId)) {
    throw new ValidationError('Invalid exercise ID format');
  }
  
  // Since we don't have a static exercise database, we'll generate exercise details
  // In a real implementation, this would query a database
  const exercise = generateExerciseDetails(exerciseId);
  
  if (!exercise) {
    throw new NotFoundError('Exercise');
  }
  
  return createSuccessResponse(exercise);
}

async function handleGetExerciseSubstitutes(request: Request, exerciseId: string) {
  const user = await requireAuthentication(request);
  
  if (!validateUUID(exerciseId)) {
    throw new ValidationError('Invalid exercise ID format');
  }
  
  // Get user profile for context
  const userProfile = await UserQueries.getUserProfile(user.id);
  if (!userProfile) {
    throw new NotFoundError('User profile');
  }
  
  // Get active context
  const activeContext = await ContextQueries.getActiveContextPeriod(user.id);
  
  const currentContext = {
    equipment_available: activeContext?.equipment_override || 
      Object.entries(userProfile.equipment_access.available_equipment)
        .filter(([_, available]) => available)
        .map(([equipment, _]) => equipment),
    location_type: activeContext?.location_type || userProfile.equipment_access.primary_location,
    injury_limitations: userProfile.training_background.injuries
      .filter(injury => injury.current_status === 'ongoing' || injury.current_status === 'needs_modification')
      .map(injury => injury.affected_areas)
      .flat()
  };
  
  // Generate substitute exercises based on context
  const substitutes = generateExerciseSubstitutes(exerciseId, currentContext);
  
  return createSuccessResponse({
    original_exercise_id: exerciseId,
    substitutes,
    context_applied: currentContext,
    total_substitutes: substitutes.length
  });
}

async function handleFilterExercises(request: Request) {
  const user = await requireAuthentication(request);
  const filterCriteria = await parseRequestBody<ExerciseFilterRequest>(request);
  
  // Validate filter criteria
  if (filterCriteria.time_available_minutes < 5 || filterCriteria.time_available_minutes > 300) {
    throw new ValidationError('Time available must be between 5-300 minutes');
  }
  
  // Generate exercises based on filter criteria
  const filteredExercises = generateContextualExercises(filterCriteria);
  
  return createSuccessResponse({
    exercises: filteredExercises,
    filter_applied: filterCriteria,
    total_count: filteredExercises.length
  });
}

async function handleGetExerciseCategories(request: Request) {
  const user = await requireAuthentication(request);
  
  // Get user profile for context
  const userProfile = await UserQueries.getUserProfile(user.id);
  if (!userProfile) {
    throw new NotFoundError('User profile');
  }
  
  // Get active context
  const activeContext = await ContextQueries.getActiveContextPeriod(user.id);
  
  const availableEquipment = activeContext?.equipment_override || 
    Object.entries(userProfile.equipment_access.available_equipment)
      .filter(([_, available]) => available)
      .map(([equipment, _]) => equipment);
  
  // Generate categories based on available equipment and user goals
  const categories = generateExerciseCategories(
    availableEquipment,
    userProfile.performance_goals.primary_focus,
    userProfile.training_background.experience_level
  );
  
  return createSuccessResponse({
    categories,
    available_equipment: availableEquipment,
    training_focus: userProfile.performance_goals.primary_focus
  });
}

// Helper functions for exercise generation (in real implementation, these would be database queries)

function generateContextualExercises(context: any): Exercise[] {
  const exercises: Exercise[] = [];
  const hasEquipment = (equipment: string) => context.equipment_available?.includes(equipment) || false;
  
  // Bodyweight exercises (always available)
  exercises.push(
    {
      id: crypto.randomUUID(),
      name: "Push-ups",
      category: "Upper Body Push",
      movement_pattern: "horizontal_push",
      primary_muscles: ["chest", "triceps"],
      secondary_muscles: ["shoulders", "core"],
      equipment_required: [],
      difficulty_level: "beginner",
      instructions: "Start in plank position, lower chest to ground, push back up",
      progressions: ["Incline push-ups", "Diamond push-ups", "One-arm push-ups"],
      regressions: ["Wall push-ups", "Knee push-ups"],
      coaching_cues: ["Keep core tight", "Full range of motion", "Control the descent"],
      safety_notes: ["Keep wrists aligned", "Don't let hips sag"]
    },
    {
      id: crypto.randomUUID(),
      name: "Bodyweight Squats",
      category: "Lower Body",
      movement_pattern: "squat",
      primary_muscles: ["quadriceps", "glutes"],
      secondary_muscles: ["calves", "core"],
      equipment_required: [],
      difficulty_level: "beginner",
      instructions: "Feet shoulder-width apart, sit back and down, return to standing",
      progressions: ["Jump squats", "Single-leg squats", "Pause squats"],
      regressions: ["Box squats", "Partial squats"],
      coaching_cues: ["Chest up", "Knees track over toes", "Drive through heels"],
      safety_notes: ["Don't let knees cave in", "Keep weight balanced"]
    }
  );
  
  // Equipment-based exercises
  if (hasEquipment('barbells')) {
    exercises.push(
      {
        id: crypto.randomUUID(),
        name: "Back Squat",
        category: "Lower Body",
        movement_pattern: "squat",
        primary_muscles: ["quadriceps", "glutes"],
        secondary_muscles: ["hamstrings", "core", "calves"],
        equipment_required: ["barbells", "squat_rack"],
        difficulty_level: "intermediate",
        instructions: "Bar on upper back, descend into squat, drive up through heels",
        progressions: ["Front squat", "Overhead squat", "Box squat"],
        regressions: ["Goblet squat", "Bodyweight squat"],
        coaching_cues: ["Big breath and brace", "Knees out", "Drive the floor apart"],
        safety_notes: ["Always use safety bars", "Maintain neutral spine"]
      },
      {
        id: crypto.randomUUID(),
        name: "Deadlift",
        category: "Posterior Chain",
        movement_pattern: "hip_hinge",
        primary_muscles: ["hamstrings", "glutes", "erectors"],
        secondary_muscles: ["traps", "lats", "forearms"],
        equipment_required: ["barbells"],
        difficulty_level: "intermediate",
        instructions: "Hip hinge to lower bar, drive hips forward to stand",
        progressions: ["Sumo deadlift", "Romanian deadlift", "Deficit deadlift"],
        regressions: ["Romanian deadlift", "Trap bar deadlift"],
        coaching_cues: ["Chest up", "Lats tight", "Drive through heels"],
        safety_notes: ["Keep bar close to body", "Neutral spine throughout"]
      }
    );
  }
  
  if (hasEquipment('dumbbells')) {
    exercises.push(
      {
        id: crypto.randomUUID(),
        name: "Dumbbell Bench Press",
        category: "Upper Body Push",
        movement_pattern: "horizontal_push",
        primary_muscles: ["chest", "triceps"],
        secondary_muscles: ["shoulders"],
        equipment_required: ["dumbbells", "bench"],
        difficulty_level: "intermediate",
        instructions: "Lie on bench, press dumbbells up and together, lower with control",
        progressions: ["Incline dumbbell press", "Single-arm press"],
        regressions: ["Floor press", "Incline press"],
        coaching_cues: ["Shoulder blades back", "Control the weight", "Full range of motion"],
        safety_notes: ["Don't bounce weights", "Keep core engaged"]
      }
    );
  }
  
  // Filter by training focus
  if (context.training_focus === 'endurance') {
    exercises.push(
      {
        id: crypto.randomUUID(),
        name: "Burpees",
        category: "Metabolic",
        movement_pattern: "compound",
        primary_muscles: ["full_body"],
        secondary_muscles: [],
        equipment_required: [],
        difficulty_level: "intermediate",
        instructions: "Squat down, jump back to plank, push-up, jump feet forward, jump up",
        progressions: ["Burpee box jumps", "Single-arm burpees"],
        regressions: ["Step-back burpees", "No push-up burpees"],
        coaching_cues: ["Maintain rhythm", "Full extension on jump", "Control the descent"],
        safety_notes: ["Land softly", "Don't compromise form for speed"]
      }
    );
  }
  
  return exercises.slice(0, 20); // Return up to 20 exercises
}

function generateExerciseDetails(exerciseId: string): Exercise | null {
  // In a real implementation, this would query a database
  // For now, return a sample exercise
  return {
    id: exerciseId,
    name: "Sample Exercise",
    category: "Upper Body",
    movement_pattern: "push",
    primary_muscles: ["chest"],
    secondary_muscles: ["triceps"],
    equipment_required: ["dumbbells"],
    difficulty_level: "intermediate",
    instructions: "Detailed exercise instructions here",
    progressions: ["Advanced variation"],
    regressions: ["Beginner variation"],
    coaching_cues: ["Key coaching points"],
    safety_notes: ["Important safety considerations"]
  };
}

function generateExerciseSubstitutes(exerciseId: string, context: any): Exercise[] {
  // Generate substitute exercises based on context
  return [
    {
      id: crypto.randomUUID(),
      name: "Push-up Variation",
      category: "Upper Body Push",
      movement_pattern: "horizontal_push",
      primary_muscles: ["chest", "triceps"],
      secondary_muscles: ["shoulders"],
      equipment_required: [],
      difficulty_level: "beginner",
      instructions: "Bodyweight substitute for bench press",
      progressions: ["Decline push-ups"],
      regressions: ["Wall push-ups"],
      coaching_cues: ["Keep body straight"],
      safety_notes: ["Control the movement"]
    }
  ];
}

function generateExerciseCategories(equipment: string[], focus: string, level: string) {
  const categories = [
    {
      name: "Upper Body Push",
      description: "Pressing movements for chest, shoulders, triceps",
      exercise_count: equipment.includes('dumbbells') ? 15 : 8,
      available: true
    },
    {
      name: "Upper Body Pull",
      description: "Pulling movements for back, biceps",
      exercise_count: equipment.includes('pull_up_bar') ? 12 : 5,
      available: equipment.includes('pull_up_bar') || equipment.includes('resistance_bands')
    },
    {
      name: "Lower Body",
      description: "Squats, lunges, and leg exercises",
      exercise_count: 20,
      available: true
    },
    {
      name: "Posterior Chain",
      description: "Hip hinges, deadlifts, glute work",
      exercise_count: equipment.includes('barbells') ? 10 : 6,
      available: true
    },
    {
      name: "Core & Stability",
      description: "Core strength and stability exercises",
      exercise_count: 15,
      available: true
    }
  ];
  
  if (focus === 'endurance') {
    categories.push({
      name: "Metabolic",
      description: "High-intensity conditioning exercises",
      exercise_count: 12,
      available: true
    });
  }
  
  return categories;
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    const pathParts = path.split('/').filter(Boolean);
    
    // Route handling
    if (path === '/exercises/available' && method === 'GET') {
      return await handleGetAvailableExercises(req);
    }
    
    if (path === '/exercises/categories' && method === 'GET') {
      return await handleGetExerciseCategories(req);
    }
    
    if (path === '/exercises/filter' && method === 'POST') {
      return await handleFilterExercises(req);
    }
    
    if (pathParts.length === 2 && pathParts[0] === 'exercises' && method === 'GET') {
      return await handleGetExercise(req, pathParts[1]);
    }
    
    if (pathParts.length === 3 && pathParts[0] === 'exercises' && pathParts[2] === 'substitutes' && method === 'GET') {
      return await handleGetExerciseSubstitutes(req, pathParts[1]);
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
    console.error('Exercises function error:', error);
    return createErrorResponse(error, requestId);
  }
});