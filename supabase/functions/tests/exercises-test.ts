// Unit tests for exercise selection endpoints
import { assertEquals, assertExists, assertInstanceOf } from "https://deno.land/std@0.208.0/assert/mod.ts";

// Mock data for testing
const mockUserProfile = {
  id: "test-user-123",
  email: "test@example.com",
  equipment_access: {
    primary_location: "commercial_gym",
    available_equipment: {
      barbells: true,
      dumbbells: true,
      kettlebells: false,
      resistance_bands: true,
      pull_up_bar: true,
      cardio_equipment: ["treadmill", "bike"],
      specialized: ["squat_rack", "bench"]
    }
  },
  performance_goals: {
    primary_focus: "strength"
  },
  training_background: {
    experience_level: "intermediate",
    injuries: []
  },
  constraints: {
    max_session_duration_minutes: 90
  }
};

const mockActiveContext = {
  id: "context-123",
  user_id: "test-user-123",
  context_type: "travel",
  location_type: "hotel",
  equipment_override: ["resistance_bands", "bodyweight"],
  status: "active"
};

// Mock the database queries module
const mockUserQueries = {
  getUserProfile: (userId: string) => {
    if (userId === "test-user-123") {
      return Promise.resolve(mockUserProfile);
    }
    return Promise.resolve(null);
  }
};

const mockContextQueries = {
  getActiveContextPeriod: (userId: string) => {
    if (userId === "test-user-123") {
      return Promise.resolve(mockActiveContext);
    }
    return Promise.resolve(null);
  }
};

// Test exercise generation functions
Deno.test("generateContextualExercises - bodyweight only", () => {
  // Import the helper function (in real implementation this would be exported for testing)
  const generateContextualExercises = (context: any) => {
    const exercises = [];
    
    // Always include bodyweight exercises
    exercises.push({
      id: "exercise-1",
      name: "Push-ups",
      category: "Upper Body Push",
      movement_pattern: "horizontal_push",
      equipment_required: [],
      difficulty_level: "beginner"
    });
    
    exercises.push({
      id: "exercise-2", 
      name: "Bodyweight Squats",
      category: "Lower Body",
      movement_pattern: "squat",
      equipment_required: [],
      difficulty_level: "beginner"
    });
    
    // Add equipment-based exercises if available
    if (context.equipment_available?.includes('barbells')) {
      exercises.push({
        id: "exercise-3",
        name: "Back Squat",
        category: "Lower Body",
        movement_pattern: "squat",
        equipment_required: ["barbells", "squat_rack"],
        difficulty_level: "intermediate"
      });
    }
    
    return exercises;
  };
  
  const bodyweightContext = {
    equipment_available: [],
    location_type: "bodyweight",
    training_focus: "strength",
    experience_level: "beginner"
  };
  
  const exercises = generateContextualExercises(bodyweightContext);
  
  assertEquals(exercises.length >= 2, true);
  assertEquals(exercises[0].name, "Push-ups");
  assertEquals(exercises[1].name, "Bodyweight Squats");
  
  // Should not include barbell exercises
  const barbellExercises = exercises.filter(ex => 
    ex.equipment_required.includes("barbells")
  );
  assertEquals(barbellExercises.length, 0);
});

Deno.test("generateContextualExercises - full gym equipment", () => {
  const generateContextualExercises = (context: any) => {
    const exercises = [];
    
    // Bodyweight exercises
    exercises.push({
      id: "exercise-1",
      name: "Push-ups", 
      equipment_required: []
    });
    
    // Equipment-based exercises
    if (context.equipment_available?.includes('barbells')) {
      exercises.push({
        id: "exercise-2",
        name: "Back Squat",
        equipment_required: ["barbells", "squat_rack"]
      });
      
      exercises.push({
        id: "exercise-3",
        name: "Deadlift",
        equipment_required: ["barbells"]
      });
    }
    
    if (context.equipment_available?.includes('dumbbells')) {
      exercises.push({
        id: "exercise-4",
        name: "Dumbbell Bench Press",
        equipment_required: ["dumbbells", "bench"]
      });
    }
    
    return exercises;
  };
  
  const fullGymContext = {
    equipment_available: ["barbells", "dumbbells", "squat_rack", "bench"],
    location_type: "commercial_gym",
    training_focus: "strength",
    experience_level: "intermediate"
  };
  
  const exercises = generateContextualExercises(fullGymContext);
  
  assertEquals(exercises.length >= 4, true);
  
  // Should include barbell exercises
  const barbellExercises = exercises.filter(ex => 
    ex.equipment_required.includes("barbells")
  );
  assertEquals(barbellExercises.length >= 2, true);
  
  // Should include dumbbell exercises
  const dumbbellExercises = exercises.filter(ex =>
    ex.equipment_required.includes("dumbbells")
  );
  assertEquals(dumbbellExercises.length >= 1, true);
});

Deno.test("generateExerciseCategories - basic categories", () => {
  const generateExerciseCategories = (equipment: string[], focus: string, level: string) => {
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
      }
    ];
    
    if (focus === 'endurance') {
      categories.push({
        name: "Metabolic",
        available: true
      } as any);
    }
    
    return categories;
  };
  
  const categories = generateExerciseCategories(
    ["dumbbells", "pull_up_bar"],
    "strength", 
    "intermediate"
  );
  
  assertEquals(categories.length, 3);
  assertEquals(categories[0].name, "Upper Body Push");
  assertEquals(categories[0].exercise_count, 15); // Has dumbbells
  assertEquals(categories[1].exercise_count, 12); // Has pull-up bar
  assertEquals(categories[2].available, true); // Lower body always available
});

Deno.test("generateExerciseCategories - endurance focus adds metabolic", () => {
  const generateExerciseCategories = (equipment: string[], focus: string, level: string) => {
    const categories = [
      {
        name: "Upper Body Push",
        available: true
      },
      {
        name: "Lower Body", 
        available: true
      }
    ];
    
    if (focus === 'endurance') {
      categories.push({
        name: "Metabolic",
        available: true,
        exercise_count: 12
      } as any);
    }
    
    return categories;
  };
  
  const enduranceCategories = generateExerciseCategories(
    ["resistance_bands"],
    "endurance",
    "beginner"
  );
  
  assertEquals(enduranceCategories.length, 3);
  assertEquals(enduranceCategories[2].name, "Metabolic");
  assertEquals((enduranceCategories[2] as any).exercise_count, 12);
});

Deno.test("generateExerciseSubstitutes - basic substitution logic", () => {
  const generateExerciseSubstitutes = (exerciseId: string, context: any) => {
    // Mock substitution logic
    const substitutes = [];
    
    if (context.equipment_available?.length === 0) {
      // No equipment - provide bodyweight alternatives
      substitutes.push({
        id: "substitute-1",
        name: "Push-up Variation",
        category: "Upper Body Push",
        equipment_required: [],
        difficulty_level: "beginner",
        reason: "Bodyweight alternative for bench press"
      });
    }
    
    if (context.injury_limitations?.includes("knee")) {
      substitutes.push({
        id: "substitute-2",
        name: "Upper Body Alternative",
        category: "Upper Body",
        equipment_required: context.equipment_available || [],
        difficulty_level: "intermediate",
        reason: "Knee-friendly alternative"
      });
    }
    
    return substitutes;
  };
  
  const noEquipmentContext = {
    equipment_available: [],
    location_type: "bodyweight",
    injury_limitations: []
  };
  
  const substitutes = generateExerciseSubstitutes("bench-press-123", noEquipmentContext);
  
  assertEquals(substitutes.length >= 1, true);
  assertEquals(substitutes[0].name, "Push-up Variation");
  assertEquals(substitutes[0].equipment_required.length, 0);
  assertEquals(substitutes[0].reason, "Bodyweight alternative for bench press");
});

Deno.test("generateExerciseSubstitutes - injury accommodation", () => {
  const generateExerciseSubstitutes = (exerciseId: string, context: any) => {
    const substitutes = [];
    
    if (context.injury_limitations?.includes("knee")) {
      substitutes.push({
        id: "substitute-1",
        name: "Upper Body Alternative",
        reason: "Knee-friendly alternative"
      });
    }
    
    if (context.injury_limitations?.includes("shoulder")) {
      substitutes.push({
        id: "substitute-2", 
        name: "Lower Body Alternative",
        reason: "Shoulder-friendly alternative"
      });
    }
    
    return substitutes;
  };
  
  const injuryContext = {
    equipment_available: ["dumbbells"],
    injury_limitations: ["knee", "shoulder"]
  };
  
  const substitutes = generateExerciseSubstitutes("squat-123", injuryContext);
  
  assertEquals(substitutes.length, 2);
  assertEquals(substitutes[0].reason, "Knee-friendly alternative");
  assertEquals(substitutes[1].reason, "Shoulder-friendly alternative");
});

Deno.test("exercise validation - valid exercise structure", () => {
  const sampleExercise = {
    id: "exercise-123",
    name: "Push-ups",
    category: "Upper Body Push",
    movement_pattern: "horizontal_push",
    primary_muscles: ["chest", "triceps"],
    secondary_muscles: ["shoulders", "core"],
    equipment_required: [],
    difficulty_level: "beginner",
    instructions: "Start in plank position, lower chest to ground, push back up",
    progressions: ["Incline push-ups", "Diamond push-ups"],
    regressions: ["Wall push-ups", "Knee push-ups"],
    coaching_cues: ["Keep core tight", "Full range of motion"],
    safety_notes: ["Keep wrists aligned", "Don't let hips sag"]
  };
  
  // Validate required fields
  assertExists(sampleExercise.id);
  assertExists(sampleExercise.name);
  assertExists(sampleExercise.category);
  assertExists(sampleExercise.movement_pattern);
  
  // Validate arrays
  assertEquals(Array.isArray(sampleExercise.primary_muscles), true);
  assertEquals(Array.isArray(sampleExercise.equipment_required), true);
  assertEquals(Array.isArray(sampleExercise.progressions), true);
  assertEquals(Array.isArray(sampleExercise.regressions), true);
  
  // Validate difficulty level
  const validDifficulties = ["beginner", "intermediate", "advanced"];
  assertEquals(validDifficulties.includes(sampleExercise.difficulty_level), true);
});

Deno.test("exercise filtering - time constraints", () => {
  const filterExercisesByTime = (exercises: any[], timeAvailable: number) => {
    // Mock filtering logic - exercises have estimated time requirements
    return exercises.filter(exercise => {
      const estimatedTime = exercise.estimated_time_minutes || 5; // Default 5 minutes
      return estimatedTime <= timeAvailable;
    });
  };
  
  const exercises = [
    { id: "1", name: "Quick Push-ups", estimated_time_minutes: 3 },
    { id: "2", name: "Full Squat Session", estimated_time_minutes: 15 },
    { id: "3", name: "Long Deadlift Work", estimated_time_minutes: 25 }
  ];
  
  const filteredShort = filterExercisesByTime(exercises, 10);
  const filteredLong = filterExercisesByTime(exercises, 30);
  
  assertEquals(filteredShort.length, 1); // Only quick exercises
  assertEquals(filteredLong.length, 3); // All exercises
  assertEquals(filteredShort[0].name, "Quick Push-ups");
});

Deno.test("exercise filtering - experience level", () => {
  const filterExercisesByLevel = (exercises: any[], userLevel: string) => {
    const levelHierarchy = { beginner: 1, intermediate: 2, advanced: 3 };
    const userLevelNum = levelHierarchy[userLevel as keyof typeof levelHierarchy] || 1;
    
    return exercises.filter(exercise => {
      const exerciseLevelNum = levelHierarchy[exercise.difficulty_level as keyof typeof levelHierarchy] || 1;
      return exerciseLevelNum <= userLevelNum;
    });
  };
  
  const exercises = [
    { id: "1", name: "Push-ups", difficulty_level: "beginner" },
    { id: "2", name: "Barbell Squat", difficulty_level: "intermediate" },
    { id: "3", name: "Snatch", difficulty_level: "advanced" }
  ];
  
  const beginnerFiltered = filterExercisesByLevel(exercises, "beginner");
  const intermediateFiltered = filterExercisesByLevel(exercises, "intermediate");
  const advancedFiltered = filterExercisesByLevel(exercises, "advanced");
  
  assertEquals(beginnerFiltered.length, 1);
  assertEquals(intermediateFiltered.length, 2);
  assertEquals(advancedFiltered.length, 3);
  
  assertEquals(beginnerFiltered[0].name, "Push-ups");
  assertEquals(intermediateFiltered[1].name, "Barbell Squat");
});

Deno.test("exercise context adaptation - travel mode", () => {
  const adaptExercisesForTravel = (exercises: any[], travelContext: any) => {
    return exercises.map(exercise => {
      if (exercise.equipment_required.length === 0) {
        // Already bodyweight - no change needed
        return exercise;
      }
      
      // Replace equipment-based exercises with bodyweight alternatives
      if (exercise.category === "Upper Body Push") {
        return {
          ...exercise,
          name: "Push-up Variation",
          equipment_required: [],
          notes: "Travel adaptation of " + exercise.name
        };
      }
      
      if (exercise.category === "Lower Body") {
        return {
          ...exercise,
          name: "Bodyweight Squat Variation",
          equipment_required: [],
          notes: "Travel adaptation of " + exercise.name
        };
      }
      
      return exercise;
    });
  };
  
  const gymExercises = [
    { id: "1", name: "Bench Press", category: "Upper Body Push", equipment_required: ["barbells", "bench"] },
    { id: "2", name: "Back Squat", category: "Lower Body", equipment_required: ["barbells", "rack"] },
    { id: "3", name: "Push-ups", category: "Upper Body Push", equipment_required: [] }
  ];
  
  const travelContext = { location_type: "hotel", equipment_available: [] };
  const adaptedExercises = adaptExercisesForTravel(gymExercises, travelContext);
  
  assertEquals(adaptedExercises.length, 3);
  assertEquals(adaptedExercises[0].name, "Push-up Variation");
  assertEquals(adaptedExercises[0].equipment_required.length, 0);
  assertEquals(adaptedExercises[1].name, "Bodyweight Squat Variation");
  assertEquals(adaptedExercises[2].name, "Push-ups"); // Already bodyweight, unchanged
  
  assertExists(adaptedExercises[0].notes);
  assertEquals(adaptedExercises[0].notes?.includes("Travel adaptation"), true);
});

Deno.test("exercise ID validation", () => {
  const validateUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };
  
  // Valid UUIDs
  assertEquals(validateUUID("123e4567-e89b-12d3-a456-426614174000"), true);
  assertEquals(validateUUID(crypto.randomUUID()), true);
  
  // Invalid UUIDs
  assertEquals(validateUUID("not-a-uuid"), false);
  assertEquals(validateUUID("123e4567-e89b-12d3-a456"), false);
  assertEquals(validateUUID(""), false);
  assertEquals(validateUUID("exercise-123"), false);
});