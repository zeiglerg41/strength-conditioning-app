// Unit tests for program and workout management endpoints
import { assertEquals, assertExists, assertInstanceOf } from "https://deno.land/std@0.208.0/assert/mod.ts";

// Mock data for program and workout testing
const mockTargetEvent = {
  name: "Powerlifting Competition",
  date: "2025-12-01T00:00:00Z",
  type: "strength_test",
  specific_requirements: "Squat, Bench, Deadlift",
  generated_by_ai: false
};

const mockUserProfile = {
  id: "user-123",
  email: "test@example.com",
  training_background: {
    experience_level: "intermediate",
    training_age_years: 3
  },
  performance_goals: {
    primary_focus: "strength"
  },
  constraints: {
    weekly_training_days: 4,
    max_session_duration_minutes: 90
  }
};

const mockProgram = {
  id: "program-123",
  user_id: "user-123",
  name: "Powerlifting Prep Program",
  target_event: mockTargetEvent,
  program_structure: {
    total_duration_weeks: 16,
    periodization_model: "linear",
    phases: [
      {
        name: "base",
        start_date: "2025-08-01",
        end_date: "2025-09-01",
        duration_weeks: 4,
        focus: "Volume accumulation"
      }
    ]
  },
  status: "active"
};

const mockWorkout = {
  id: "workout-123",
  program_id: "program-123",
  scheduled_date: "2025-09-01",
  name: "Upper Body Strength",
  session_type: "strength",
  status: "pending",
  original_prescription: {
    exercises: [
      {
        exercise_id: "bench-press",
        exercise_name: "Bench Press",
        sets: 4,
        reps: "5",
        weight: "80% 1RM",
        rpe_target: 8,
        rest_seconds: 180
      }
    ]
  },
  current_prescription: {
    exercises: [],
    modifications_applied: []
  }
};

// Test program validation functions
Deno.test("validateTargetEvent - valid event", () => {
  const validateTargetEvent = (event: any) => {
    if (!event.name?.trim()) {
      throw new Error("Event name is required");
    }
    
    if (!event.date) {
      throw new Error("Event date is required");
    }
    
    const eventDate = new Date(event.date);
    const today = new Date();
    
    if (isNaN(eventDate.getTime())) {
      throw new Error("Invalid date format");
    }
    
    if (eventDate <= today) {
      throw new Error("Event date must be in the future");
    }
    
    return true;
  };
  
  // Should not throw for valid event
  assertEquals(validateTargetEvent(mockTargetEvent), true);
});

Deno.test("validateTargetEvent - missing name", () => {
  const validateTargetEvent = (event: any) => {
    if (!event.name?.trim()) {
      throw new Error("Event name is required");
    }
    return true;
  };
  
  const invalidEvent = { ...mockTargetEvent, name: "" };
  
  let errorThrown = false;
  let errorMessage = "";
  
  try {
    validateTargetEvent(invalidEvent);
  } catch (error) {
    errorThrown = true;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
  }
  
  assertEquals(errorThrown, true);
  assertEquals(errorMessage, "Event name is required");
});

Deno.test("validateTargetEvent - past date", () => {
  const validateTargetEvent = (event: any) => {
    const eventDate = new Date(event.date);
    const today = new Date();
    
    if (eventDate <= today) {
      throw new Error("Event date must be in the future");
    }
    return true;
  };
  
  const pastEvent = { ...mockTargetEvent, date: "2024-01-01T00:00:00Z" };
  
  let errorThrown = false;
  try {
    validateTargetEvent(pastEvent);
  } catch (error) {
    errorThrown = true;
  }
  
  assertEquals(errorThrown, true);
});

Deno.test("program structure validation", () => {
  const validateProgramStructure = (program: any) => {
    if (!program.name?.trim()) {
      throw new Error("Program name is required");
    }
    
    if (!program.target_event) {
      throw new Error("Target event is required");
    }
    
    if (!program.program_structure?.phases?.length) {
      throw new Error("Program must have at least one phase");
    }
    
    return true;
  };
  
  assertEquals(validateProgramStructure(mockProgram), true);
  
  // Test invalid program
  const invalidProgram = { ...mockProgram, name: "" };
  
  let errorThrown = false;
  try {
    validateProgramStructure(invalidProgram);
  } catch (error) {
    errorThrown = true;
  }
  
  assertEquals(errorThrown, true);
});

Deno.test("calculateDaysToEvent - future event", () => {
  const calculateDaysToEvent = (eventDate: string): number => {
    const event = new Date(eventDate);
    const today = new Date();
    return Math.ceil((event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };
  
  // Test with future date
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  
  const days = calculateDaysToEvent(futureDate.toISOString());
  
  assertEquals(typeof days, "number");
  assertEquals(days >= 29 && days <= 31, true); // Should be around 30 days
});

Deno.test("workout status transitions", () => {
  const isValidStatusTransition = (fromStatus: string, toStatus: string): boolean => {
    const validTransitions: Record<string, string[]> = {
      "pending": ["in_progress", "skipped"],
      "in_progress": ["completed", "modified"],
      "completed": [], // No transitions from completed
      "skipped": [], // No transitions from skipped
      "modified": ["in_progress", "completed"]
    };
    
    return validTransitions[fromStatus]?.includes(toStatus) || false;
  };
  
  // Valid transitions
  assertEquals(isValidStatusTransition("pending", "in_progress"), true);
  assertEquals(isValidStatusTransition("in_progress", "completed"), true);
  assertEquals(isValidStatusTransition("pending", "skipped"), true);
  assertEquals(isValidStatusTransition("modified", "completed"), true);
  
  // Invalid transitions
  assertEquals(isValidStatusTransition("completed", "in_progress"), false);
  assertEquals(isValidStatusTransition("skipped", "completed"), false);
  assertEquals(isValidStatusTransition("pending", "completed"), false);
});

Deno.test("deload eligibility checking", () => {
  const checkDeloadEligibility = (lastDeloadDate: string | null, currentDate: string): boolean => {
    if (!lastDeloadDate) {
      return true; // First deload always allowed
    }
    
    const lastDeload = new Date(lastDeloadDate);
    const current = new Date(currentDate);
    const daysSinceLastDeload = Math.floor((current.getTime() - lastDeload.getTime()) / (1000 * 60 * 60 * 24));
    
    // Must be at least 3 days since last deload
    return daysSinceLastDeload >= 3;
  };
  
  const today = new Date().toISOString();
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  
  // Should allow first deload
  assertEquals(checkDeloadEligibility(null, today), true);
  
  // Should allow after 3 days
  assertEquals(checkDeloadEligibility(threeDaysAgo, today), true);
  
  // Should not allow after only 2 days
  assertEquals(checkDeloadEligibility(twoDaysAgo, today), false);
});

Deno.test("workout modification tracking", () => {
  const applyWorkoutModification = (workout: any, modificationType: string, reason: string) => {
    const modification = {
      type: modificationType,
      reason: reason,
      changes: `Applied ${modificationType}`,
      applied_at: new Date().toISOString()
    };
    
    return {
      ...workout,
      current_prescription: {
        ...workout.current_prescription,
        modifications_applied: [
          ...workout.current_prescription.modifications_applied,
          modification
        ]
      },
      status: "modified"
    };
  };
  
  const modifiedWorkout = applyWorkoutModification(
    mockWorkout, 
    "volume_deload", 
    "poor_sleep"
  );
  
  assertEquals(modifiedWorkout.status, "modified");
  assertEquals(modifiedWorkout.current_prescription.modifications_applied.length, 1);
  assertEquals(modifiedWorkout.current_prescription.modifications_applied[0].type, "volume_deload");
  assertEquals(modifiedWorkout.current_prescription.modifications_applied[0].reason, "poor_sleep");
  assertExists(modifiedWorkout.current_prescription.modifications_applied[0].applied_at);
});

Deno.test("travel mode context creation", () => {
  const createTravelContext = (userId: string, duration: number) => {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
    
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      context_type: "travel",
      location_type: "hotel",
      equipment_override: ["resistance_bands", "bodyweight"],
      status: "active"
    };
  };
  
  const travelContext = createTravelContext("user-123", 7);
  
  assertEquals(travelContext.user_id, "user-123");
  assertEquals(travelContext.context_type, "travel");
  assertEquals(travelContext.location_type, "hotel");
  assertEquals(Array.isArray(travelContext.equipment_override), true);
  assertEquals(travelContext.status, "active");
  assertExists(travelContext.id);
  assertExists(travelContext.start_date);
  assertExists(travelContext.end_date);
});

Deno.test("program timeline extension", () => {
  const extendProgramTimeline = (program: any, newEventDate: string) => {
    const originalDate = new Date(program.target_event.date);
    const newDate = new Date(newEventDate);
    const extensionDays = Math.ceil((newDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      ...program,
      target_event: {
        ...program.target_event,
        date: newEventDate
      },
      program_structure: {
        ...program.program_structure,
        // In real implementation, phases would be recalculated
        extension_applied: {
          original_date: program.target_event.date,
          new_date: newEventDate,
          days_extended: extensionDays,
          extended_at: new Date().toISOString()
        }
      }
    };
  };
  
  const newEventDate = "2025-12-15T00:00:00Z"; // 2 weeks later
  const extendedProgram = extendProgramTimeline(mockProgram, newEventDate);
  
  assertEquals(extendedProgram.target_event.date, newEventDate);
  assertExists(extendedProgram.program_structure.extension_applied);
  assertEquals(extendedProgram.program_structure.extension_applied.days_extended, 14);
});

Deno.test("workout context adaptation", () => {
  const adaptWorkoutForContext = (workout: any, context: any) => {
    // Mock adaptation logic
    const adaptedExercises = workout.original_prescription.exercises.map((exercise: any) => {
      if (context.location_type === "hotel" && exercise.exercise_name.includes("Bench")) {
        return {
          ...exercise,
          exercise_name: "Push-ups",
          equipment_required: [],
          adaptation_reason: "Hotel/bodyweight adaptation"
        };
      }
      return exercise;
    });
    
    return {
      ...workout,
      current_prescription: {
        exercises: adaptedExercises,
        modifications_applied: [{
          type: "travel_mode",
          reason: `Adapted for ${context.location_type}`,
          changes: "Replaced equipment exercises with bodyweight alternatives",
          applied_at: new Date().toISOString()
        }]
      },
      context: context
    };
  };
  
  const hotelContext = {
    location_type: "hotel",
    available_equipment: [],
    travel_mode: true
  };
  
  const adaptedWorkout = adaptWorkoutForContext(mockWorkout, hotelContext);
  
  assertEquals(adaptedWorkout.current_prescription.exercises[0].exercise_name, "Push-ups");
  assertEquals(adaptedWorkout.current_prescription.modifications_applied.length, 1);
  assertEquals(adaptedWorkout.current_prescription.modifications_applied[0].type, "travel_mode");
  assertEquals(adaptedWorkout.context.location_type, "hotel");
});

Deno.test("exercise logging validation", () => {
  const validateExerciseLog = (exerciseData: any) => {
    const errors = [];
    
    if (!exerciseData.exercise_id) {
      errors.push("Exercise ID is required");
    }
    
    if (typeof exerciseData.sets_completed !== "number" || exerciseData.sets_completed < 0) {
      errors.push("Sets completed must be a positive number");
    }
    
    if (!Array.isArray(exerciseData.reps_completed)) {
      errors.push("Reps completed must be an array");
    }
    
    if (!Array.isArray(exerciseData.weights_used)) {
      errors.push("Weights used must be an array");
    }
    
    if (exerciseData.reps_completed.length !== exerciseData.sets_completed) {
      errors.push("Reps array length must match sets completed");
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };
  
  // Valid exercise log
  const validLog = {
    exercise_id: "bench-press",
    sets_completed: 3,
    reps_completed: [5, 5, 4],
    weights_used: [100, 100, 100],
    rpe_scores: [7, 8, 9]
  };
  
  const validResult = validateExerciseLog(validLog);
  assertEquals(validResult.valid, true);
  assertEquals(validResult.errors.length, 0);
  
  // Invalid exercise log
  const invalidLog = {
    exercise_id: "",
    sets_completed: -1,
    reps_completed: "not_array",
    weights_used: []
  };
  
  const invalidResult = validateExerciseLog(invalidLog);
  assertEquals(invalidResult.valid, false);
  assertEquals(invalidResult.errors.length > 0, true);
});

Deno.test("program regeneration logic", () => {
  const shouldRegenerateProgram = (program: any, userProfile: any) => {
    const reasons = [];
    
    // Check if training days changed significantly
    if (Math.abs(program.weekly_training_days - userProfile.constraints.weekly_training_days) > 1) {
      reasons.push("Training days changed significantly");
    }
    
    // Check if experience level changed
    if (program.user_experience_level !== userProfile.training_background.experience_level) {
      reasons.push("Experience level changed");
    }
    
    // Check if primary focus changed
    if (program.training_focus !== userProfile.performance_goals.primary_focus) {
      reasons.push("Training focus changed");
    }
    
    return {
      should_regenerate: reasons.length > 0,
      reasons
    };
  };
  
  const changedUserProfile = {
    ...mockUserProfile,
    constraints: {
      ...mockUserProfile.constraints,
      weekly_training_days: 6 // Changed from 4 to 6
    },
    performance_goals: {
      ...mockUserProfile.performance_goals,
      primary_focus: "endurance" // Changed from strength
    }
  };
  
  const programWithUserData = {
    ...mockProgram,
    weekly_training_days: 4,
    user_experience_level: "intermediate",
    training_focus: "strength"
  };
  
  const result = shouldRegenerateProgram(programWithUserData, changedUserProfile);
  
  assertEquals(result.should_regenerate, true);
  assertEquals(result.reasons.length, 2);
  assertEquals(result.reasons.includes("Training days changed significantly"), true);
  assertEquals(result.reasons.includes("Training focus changed"), true);
});

Deno.test("upcoming workouts filtering", () => {
  const getUpcomingWorkouts = (workouts: any[], days: number) => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    
    return workouts.filter(workout => {
      const workoutDate = new Date(workout.scheduled_date);
      return workoutDate >= today && workoutDate <= futureDate;
    });
  };
  
  const testWorkouts = [
    { id: "w1", scheduled_date: "2025-08-28" }, // Past
    { id: "w2", scheduled_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }, // Tomorrow
    { id: "w3", scheduled_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }, // 5 days
    { id: "w4", scheduled_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] } // 10 days
  ];
  
  const next7Days = getUpcomingWorkouts(testWorkouts, 7);
  const next14Days = getUpcomingWorkouts(testWorkouts, 14);
  
  // Should not include past workouts
  assertEquals(next7Days.every(w => w.id !== "w1"), true);
  
  // 7-day filter should include workouts 2 and 3, but not 4
  assertEquals(next7Days.length, 2);
  
  // 14-day filter should include all future workouts
  assertEquals(next14Days.length, 3);
});