/**
 * Unit Tests for ProgramContextService  
 * Tests AI context injection with S&C guardrails
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.208.0/testing/asserts.ts"
import { ProgramContextService } from '../_shared/services/program-context-service.ts'

// Mock Supabase client
const mockSupabase = {
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: string) => ({
        single: () => Promise.resolve({ data: mockUserProfile })
      })
    })
  })
}

const mockUserProfile = {
  training_background: {
    current_streak_months: 8,
    total_break_months: 6,
    total_experience_months: 18,
    average_sessions_per_week: 3,
    has_used_programs: true,
    understands_rpe: false
  },
  movement_competencies: {
    squat: { experience_level: 3 },
    deadlift: { experience_level: 3 },
    bench_press: { experience_level: 3 },
    overhead_press: { experience_level: 2 }
  },
  physical_profile: {
    injuries: [
      { name: 'Lower back strain', status: 'current', exercises_to_avoid: ['deadlift', 'barbell_row'] }
    ]
  },
  equipment_access: [
    { name: 'Barbell', available: true },
    { name: 'Dumbbells', available: true },
    { name: 'Pull-up bar', available: false }
  ],
  schedule_constraints: {
    max_session_duration: 60,
    available_days: ['monday', 'wednesday', 'friday'],
    preferred_times: ['evening']
  },
  goals: {
    primary: 'strength',
    target_event: 'powerlifting meet'
  },
  preferences: {
    exercise_style: 'compound_focused',
    intensity_preference: 'moderate'
  }
}

// Mock TrainingAgeService
const mockTrainingAgeService = {
  getEffectiveTrainingAge: async () => 'beginner',
  loadBlueprintForUser: async () => 'BEGINNER_BLUEPRINT'
}

// Patch the import
Object.defineProperty(ProgramContextService, 'TrainingAgeService', {
  value: mockTrainingAgeService,
  writable: true
})

Deno.test("ProgramContextService - buildSystemContext", async (t) => {
  
  await t.step("should build complete system context", async () => {
    const systemContext = await ProgramContextService.buildSystemContext(mockSupabase as any, 'test-user')
    
    assertExists(systemContext)
    assertStringIncludes(systemContext, 'expert Strength & Conditioning coach')
    assertStringIncludes(systemContext, 'TRAINING BLUEPRINT')
    assertStringIncludes(systemContext, 'USER CONTEXT')
    assertStringIncludes(systemContext, 'MANDATORY REQUIREMENTS')
  })
  
  await t.step("should include training blueprint", async () => {
    const systemContext = await ProgramContextService.buildSystemContext(mockSupabase as any, 'test-user')
    
    // The blueprint identifier isn't shown in the output, only the content
    assertStringIncludes(systemContext, 'BEGINNER PRINCIPLES')
    assertStringIncludes(systemContext, 'technique mastery over load progression')
    assertStringIncludes(systemContext, 'Full-body workouts')
  })
  
  await t.step("should include user context constraints", async () => {
    const systemContext = await ProgramContextService.buildSystemContext(mockSupabase as any, 'test-user')
    
    assertStringIncludes(systemContext, 'Training Level: beginner')
    assertStringIncludes(systemContext, 'Available Equipment')
    assertStringIncludes(systemContext, 'Barbell')
    assertStringIncludes(systemContext, 'Injuries/Limitations')
    assertStringIncludes(systemContext, 'Lower back strain')
    assertStringIncludes(systemContext, 'Schedule Constraints')
    assertStringIncludes(systemContext, 'max_session_duration')
  })
  
  await t.step("should include mandatory requirements", async () => {
    const systemContext = await ProgramContextService.buildSystemContext(mockSupabase as any, 'test-user')
    
    assertStringIncludes(systemContext, 'ONLY suggest exercises compatible with available equipment')
    assertStringIncludes(systemContext, 'NEVER include exercises that conflict with injuries')
    assertStringIncludes(systemContext, 'RESPECT schedule constraints')
    assertStringIncludes(systemContext, 'FOLLOW the training blueprint principles')
    assertStringIncludes(systemContext, 'Generate PERIODIZED PROGRAMS, not random workouts')
  })
})

Deno.test("ProgramContextService - getUserContext", async (t) => {
  
  await t.step("should extract user context from database profile", async () => {
    // Test private method using reflection
    const userContext = await (ProgramContextService as any).getUserContext(mockSupabase, 'test-user')
    
    assertEquals(userContext.trainingAge, 'beginner')
    assertEquals(userContext.equipment.length, 3)
    assertEquals(userContext.injuries.length, 1)
    assertEquals(userContext.schedule.max_session_duration, 60)
    assertEquals(userContext.goals.primary, 'strength')
    assertEquals(userContext.preferences.exercise_style, 'compound_focused')
  })
  
  await t.step("should handle missing profile data gracefully", async () => {
    const emptyProfile = {
      training_background: {},
      physical_profile: {},
      equipment_access: null,
      schedule_constraints: null,
      goals: null,
      preferences: null
    }
    
    const mockEmptySupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: emptyProfile })
          })
        })
      })
    }
    
    const userContext = await (ProgramContextService as any).getUserContext(mockEmptySupabase, 'test-user')
    
    assertEquals(userContext.equipment, [])
    assertEquals(userContext.injuries, [])
    assertEquals(userContext.schedule, {})
    assertEquals(userContext.goals, {})
    assertEquals(userContext.preferences, {})
  })
})

Deno.test("ProgramContextService - composeSystemPrompt", async (t) => {
  
  await t.step("should compose prompt with beginner blueprint", () => {
    const userContext = {
      trainingAge: 'beginner',
      equipment: [{ name: 'Dumbbells', available: true }],
      injuries: [],
      schedule: { max_session_duration: 45 },
      goals: { primary: 'general_fitness' },
      preferences: { intensity_preference: 'low' }
    }
    
    const prompt = (ProgramContextService as any).composeSystemPrompt('BEGINNER_BLUEPRINT', userContext)
    
    assertStringIncludes(prompt, 'BEGINNER PRINCIPLES')
    assertStringIncludes(prompt, 'Focus on technique mastery')
    assertStringIncludes(prompt, 'Full-body workouts 2-3x per week')
    assertStringIncludes(prompt, 'Training Level: beginner')
  })
  
  await t.step("should compose prompt with intermediate blueprint", () => {
    const userContext = {
      trainingAge: 'intermediate',
      equipment: [{ name: 'Barbell', available: true }],
      injuries: [],
      schedule: { max_session_duration: 75 },
      goals: { primary: 'strength' },
      preferences: { intensity_preference: 'high' }
    }
    
    const prompt = (ProgramContextService as any).composeSystemPrompt('INTERMEDIATE_BLUEPRINT', userContext)
    
    assertStringIncludes(prompt, 'INTERMEDIATE PRINCIPLES')
    assertStringIncludes(prompt, 'Systematic progressive overload')
    assertStringIncludes(prompt, 'Undulating periodization')
    assertStringIncludes(prompt, 'Training Level: intermediate')
  })
  
  await t.step("should compose prompt with advanced blueprint", () => {
    const userContext = {
      trainingAge: 'advanced',
      equipment: [{ name: 'Full gym', available: true }],
      injuries: [],
      schedule: { max_session_duration: 90 },
      goals: { primary: 'competition' },
      preferences: { intensity_preference: 'variable' }
    }
    
    const prompt = (ProgramContextService as any).composeSystemPrompt('ADVANCED_BLUEPRINT', userContext)
    
    assertStringIncludes(prompt, 'ADVANCED PRINCIPLES')
    assertStringIncludes(prompt, 'Block periodization')
    assertStringIncludes(prompt, 'Highly individualized programming')
    assertStringIncludes(prompt, 'Training Level: advanced')
  })
})

Deno.test("ProgramContextService - getBlueprintContent", async (t) => {
  
  await t.step("should return beginner blueprint content", () => {
    const content = (ProgramContextService as any).getBlueprintContent('BEGINNER_BLUEPRINT')
    
    assertStringIncludes(content, 'BEGINNER PRINCIPLES (0-15 effective months)')
    assertStringIncludes(content, 'technique mastery over load progression')
    assertStringIncludes(content, 'Full-body workouts 2-3x per week')
    assertStringIncludes(content, '2-4 sets of 8-12 reps')
    assertStringIncludes(content, 'LISS cardio 20-40min')
  })
  
  await t.step("should return intermediate blueprint content", () => {
    const content = (ProgramContextService as any).getBlueprintContent('INTERMEDIATE_BLUEPRINT')
    
    assertStringIncludes(content, 'INTERMEDIATE PRINCIPLES (15-30 effective months)')
    assertStringIncludes(content, 'Systematic progressive overload')
    assertStringIncludes(content, '3-4 sessions per week, split routines')
    assertStringIncludes(content, 'Undulating periodization')
    assertStringIncludes(content, 'Strength days: 3-5 sets of 3-6 reps at 80-90% 1RM')
    assertStringIncludes(content, '4-6 week mesocycles with deload weeks')
  })
  
  await t.step("should return advanced blueprint content", () => {
    const content = (ProgramContextService as any).getBlueprintContent('ADVANCED_BLUEPRINT')
    
    assertStringIncludes(content, 'ADVANCED PRINCIPLES (30+ effective months)')
    assertStringIncludes(content, 'Block periodization')
    assertStringIncludes(content, 'Highly individualized programming')
    assertStringIncludes(content, '4-6 sessions per week')
    assertStringIncludes(content, 'Concurrent training management')
    assertStringIncludes(content, 'Advanced techniques: cluster sets, PAP')
  })
  
  await t.step("should default to beginner for unknown blueprint", () => {
    const content = (ProgramContextService as any).getBlueprintContent('UNKNOWN_BLUEPRINT')
    
    assertStringIncludes(content, 'BEGINNER PRINCIPLES')
  })
})

Deno.test("ProgramContextService - S&C Guardrails Constants", async (t) => {
  
  await t.step("should include periodization constants", async () => {
    const { SC_GUARDRAILS } = await import('../_shared/services/program-context-service.ts')
    
    assertExists(SC_GUARDRAILS.PERIODIZATION.LINEAR)
    assertExists(SC_GUARDRAILS.PERIODIZATION.UNDULATING)
    assertExists(SC_GUARDRAILS.PERIODIZATION.BLOCK)
    
    assertStringIncludes(SC_GUARDRAILS.PERIODIZATION.LINEAR, 'Progressive increase in intensity')
    assertStringIncludes(SC_GUARDRAILS.PERIODIZATION.UNDULATING, 'Daily or weekly variations')
    assertStringIncludes(SC_GUARDRAILS.PERIODIZATION.BLOCK, 'accumulation, intensification, realization')
  })
  
  await t.step("should include energy systems constants", async () => {
    const { SC_GUARDRAILS } = await import('../_shared/services/program-context-service.ts')
    
    assertExists(SC_GUARDRAILS.ENERGY_SYSTEMS.PHOSPHAGEN)
    assertExists(SC_GUARDRAILS.ENERGY_SYSTEMS.GLYCOLYTIC)
    assertExists(SC_GUARDRAILS.ENERGY_SYSTEMS.OXIDATIVE)
    
    assertStringIncludes(SC_GUARDRAILS.ENERGY_SYSTEMS.PHOSPHAGEN, '5-10 seconds max effort')
    assertStringIncludes(SC_GUARDRAILS.ENERGY_SYSTEMS.GLYCOLYTIC, '30-90 seconds high intensity')
    assertStringIncludes(SC_GUARDRAILS.ENERGY_SYSTEMS.OXIDATIVE, 'Continuous or long intervals')
  })
  
  await t.step("should include recovery constants", async () => {
    const { SC_GUARDRAILS } = await import('../_shared/services/program-context-service.ts')
    
    assertExists(SC_GUARDRAILS.RECOVERY.DELOAD_FREQUENCY)
    assertExists(SC_GUARDRAILS.RECOVERY.STRENGTH_RETENTION)
    assertExists(SC_GUARDRAILS.RECOVERY.MUSCLE_MEMORY)
    
    assertStringIncludes(SC_GUARDRAILS.RECOVERY.DELOAD_FREQUENCY, 'Every 4-6 weeks')
    assertStringIncludes(SC_GUARDRAILS.RECOVERY.STRENGTH_RETENTION, 'Minimal loss up to 4 weeks')
    assertStringIncludes(SC_GUARDRAILS.RECOVERY.MUSCLE_MEMORY, 'Rapid regain')
  })
})

// Integration test scenarios
Deno.test("ProgramContextService - Integration Scenarios", async (t) => {
  
  await t.step("Scenario: Injured intermediate trainee", async () => {
    const injuredProfile = {
      ...mockUserProfile,
      physical_profile: {
        injuries: [
          { name: 'Shoulder impingement', status: 'current', exercises_to_avoid: ['overhead_press', 'lateral_raises'] },
          { name: 'Knee tendonitis', status: 'recovering', exercises_to_avoid: ['jump_squats'] }
        ]
      }
    }
    
    const mockInjuredSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: injuredProfile })
          })
        })
      })
    }
    
    const systemContext = await ProgramContextService.buildSystemContext(mockInjuredSupabase as any, 'injured-user')
    
    assertStringIncludes(systemContext, 'Shoulder impingement')
    assertStringIncludes(systemContext, 'overhead_press')
    assertStringIncludes(systemContext, 'Knee tendonitis')
    assertStringIncludes(systemContext, 'NEVER include exercises that conflict with injuries')
  })
  
  await t.step("Scenario: Equipment-limited home trainer", async () => {
    const homeProfile = {
      ...mockUserProfile,
      equipment_access: [
        { name: 'Dumbbells', available: true, weight_range: '5-50lbs' },
        { name: 'Resistance bands', available: true },
        { name: 'Yoga mat', available: true }
      ],
      schedule_constraints: {
        max_session_duration: 30, // Short sessions
        available_days: ['monday', 'tuesday', 'thursday', 'saturday'],
        preferred_times: ['early_morning']
      }
    }
    
    const mockHomeSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: homeProfile })
          })
        })
      })
    }
    
    const systemContext = await ProgramContextService.buildSystemContext(mockHomeSupabase as any, 'home-user')
    
    assertStringIncludes(systemContext, 'Dumbbells')
    assertStringIncludes(systemContext, 'Resistance bands')
    assertStringIncludes(systemContext, 'max_session_duration": 30')
    assertStringIncludes(systemContext, 'ONLY suggest exercises compatible with available equipment')
  })
})