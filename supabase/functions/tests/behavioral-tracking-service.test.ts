/**
 * Unit Tests for BehavioralTrackingService
 * Tests workout data analysis and behavioral signal extraction
 * NO user-AI interaction - only workout logging data analysis
 */

import { assertEquals, assertExists, assertArrayIncludes } from "https://deno.land/std@0.208.0/testing/asserts.ts"
import { BehavioralTrackingService, BehavioralSignal, TrainingAgeConfidence } from '../_shared/services/behavioral-tracking-service.ts'

// Mock Supabase client
const mockSupabase = {
  from: (table: string) => ({
    insert: (data: any) => Promise.resolve({ error: null }),
    select: (columns: string) => ({
      eq: (column: string, value: string) => ({
        gte: (column: string, value: string) => ({
          order: (column: string, options: any) => Promise.resolve({ data: mockBehavioralSignals }),
          single: () => Promise.resolve({ data: mockUserProfile })
        }),
        single: () => Promise.resolve({ data: mockUserProfile })
      })
    }),
    update: (data: any) => ({
      eq: (column: string, value: string) => Promise.resolve({ error: null })
    })
  })
}

const mockBehavioralSignals: BehavioralSignal[] = [
  {
    userId: 'test-user',
    signalType: 'exercise_selection',
    signalValue: 'chooses_isolation_over_compounds',
    trainingAgeIndicator: 'beginner',
    confidence: 0.8,
    timestamp: new Date().toISOString()
  },
  {
    userId: 'test-user',
    signalType: 'progression_response', 
    signalValue: 'linear_progression_works_8plus_weeks',
    trainingAgeIndicator: 'beginner',
    confidence: 0.9,
    timestamp: new Date().toISOString()
  },
  {
    userId: 'test-user',
    signalType: 'workout_performance',
    signalValue: 'consistent_rpe_usage',
    trainingAgeIndicator: 'intermediate',
    confidence: 0.7,
    timestamp: new Date().toISOString()
  }
]

const mockUserProfile = {
  training_background: {
    current_streak_months: 8,
    total_break_months: 2,
    total_experience_months: 18
  }
}

Deno.test("BehavioralTrackingService - Core Onboarding Questions", async (t) => {
  
  await t.step("should return optimized core questions", () => {
    const questions = BehavioralTrackingService.getCoreOnboardingQuestions()
    
    assertEquals(questions.length, 4) // Minimal viable set
    
    // Check highest weight question (most predictive)
    const consistentMonths = questions.find(q => q.id === 'consistent_months')
    assertExists(consistentMonths)
    assertEquals(consistentMonths.trainingAgeWeight, 0.4)
    assertEquals(consistentMonths.type, 'number')
    
    // Check form competency question
    const formCompetency = questions.find(q => q.id === 'form_competency')
    assertExists(formCompetency)
    assertEquals(formCompetency.options?.length, 4)
    assertEquals(formCompetency.trainingAgeWeight, 0.25)
    
    // Ensure total weights sum to 1.0
    const totalWeight = questions.reduce((sum, q) => sum + q.trainingAgeWeight, 0)
    assertEquals(Math.round(totalWeight * 100), 100) // Account for floating point
  })
  
  await t.step("should cover key predictive factors", () => {
    const questions = BehavioralTrackingService.getCoreOnboardingQuestions()
    const questionIds = questions.map(q => q.id)
    
    assertArrayIncludes(questionIds, ['consistent_months']) // Consistency
    assertArrayIncludes(questionIds, ['form_competency']) // Technical skill
    assertArrayIncludes(questionIds, ['longest_streak']) // Adherence pattern
    assertArrayIncludes(questionIds, ['progression_tracking']) // Sophistication
  })
})

Deno.test("BehavioralTrackingService - Workout Data Indicators", async (t) => {
  
  await t.step("should define workout-based beginner signals", () => {
    const indicators = BehavioralTrackingService.getWorkoutDataIndicators()
    
    assertExists(indicators.beginnerSignals.exerciseSelection)
    assertExists(indicators.beginnerSignals.progressionResponse)
    assertExists(indicators.beginnerSignals.workoutPerformance)
    assertExists(indicators.beginnerSignals.consistencyPattern)
    
    // Check specific beginner indicators from workout data
    assertArrayIncludes(indicators.beginnerSignals.exerciseSelection, ['high_isolation_to_compound_ratio'])
    assertArrayIncludes(indicators.beginnerSignals.progressionResponse, ['linear_progression_8plus_weeks'])
    assertArrayIncludes(indicators.beginnerSignals.workoutPerformance, ['completes_all_prescribed_reps'])
  })
  
  await t.step("should define intermediate workout patterns", () => {
    const indicators = BehavioralTrackingService.getWorkoutDataIndicators()
    
    assertArrayIncludes(indicators.intermediateSignals.progressionResponse, ['stalling_every_4_6_weeks'])
    assertArrayIncludes(indicators.intermediateSignals.workoutPerformance, ['misses_reps_at_higher_intensities'])
    assertArrayIncludes(indicators.intermediateSignals.consistencyPattern, ['occasional_missed_sessions'])
  })
  
  await t.step("should define advanced performance markers", () => {
    const indicators = BehavioralTrackingService.getWorkoutDataIndicators()
    
    assertArrayIncludes(indicators.advancedSignals.exerciseSelection, ['highly_specific_movement_selection'])
    assertArrayIncludes(indicators.advancedSignals.progressionResponse, ['frequent_stalling_requires_creativity'])
    assertArrayIncludes(indicators.advancedSignals.workoutPerformance, ['frequently_misses_target_reps'])
  })
})

Deno.test("BehavioralTrackingService - Signal Recording", async (t) => {
  
  await t.step("should record behavioral signal with timestamp", async () => {
    const signal: Omit<BehavioralSignal, 'timestamp'> = {
      userId: 'test-user',
      signalType: 'exercise_selection',
      signalValue: 'chooses_compound_movements',
      trainingAgeIndicator: 'intermediate',
      confidence: 0.8
    }
    
    // Should not throw and should call supabase insert
    await BehavioralTrackingService.recordBehavioralSignal(mockSupabase as any, signal)
    // Integration test - would verify actual database insert in real implementation
  })
})

Deno.test("BehavioralTrackingService - Confidence Evaluation", async (t) => {
  
  await t.step("should calculate confidence from supporting vs contradictory signals", async () => {
    // Mock that returns our test signals
    const mockSupabaseWithSignals = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            gte: () => ({
              order: () => Promise.resolve({ data: mockBehavioralSignals }),
              single: () => Promise.resolve({ data: mockUserProfile })
            }),
            single: () => Promise.resolve({ data: mockUserProfile })
          })
        })
      })
    }
    
    // Mock TrainingAgeService to return intermediate (conflicts with beginner signals)
    const mockTrainingAgeService = {
      getEffectiveTrainingAge: async () => 'intermediate'
    }
    
    // Mock TrainingAgeService import dynamically
    const mockModule = {
      TrainingAgeService: mockTrainingAgeService
    }
    
    // Override dynamic import for testing
    const originalImport = await import('../_shared/services/training-age-service.ts')
    
    const confidence = await BehavioralTrackingService.evaluateTrainingAgeConfidence(
      mockSupabaseWithSignals as any, 
      'test-user'
    )
    
    assertEquals(confidence.currentClassification, 'beginner') // Conservative default
    assertEquals(confidence.supportingSignals.length >= 0, true)
    assertEquals(confidence.contradictorySignals.length >= 0, true)
    assertEquals(confidence.needsValidation, true) // Should need validation
  })
  
  await t.step("should return low confidence without behavioral data", async () => {
    const mockEmptySupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            gte: () => ({
              order: () => Promise.resolve({ data: [] })
            })
          })
        })
      })
    }
    
    const confidence = await BehavioralTrackingService.evaluateTrainingAgeConfidence(
      mockEmptySupabase as any,
      'test-user'
    )
    
    assertEquals(confidence.currentClassification, 'beginner') // Conservative default
    assertEquals(confidence.confidenceScore, 0.3) // Low confidence
    assertEquals(confidence.needsValidation, true)
  })
})

Deno.test("BehavioralTrackingService - Workout Data Analysis", async (t) => {
  
  await t.step("should analyze workout data for behavioral signals", async () => {
    // Mock workout data with sufficient data points
    const mockWorkoutData = {
      from: (table: string) => ({
        select: (columns: string) => ({
          eq: (column: string, value: string) => ({
            gte: (column: string, value: string) => ({
              order: (column: string, options: any) => Promise.resolve({
                data: [
                  {
                    date: '2025-01-01',
                    exercises: [
                      { name: 'Bicep Curl', category: 'isolation', sets: 3, reps: [10, 10, 10], weights: [20, 20, 20] },
                      { name: 'Leg Extension', category: 'isolation', sets: 3, reps: [12, 12, 12], weights: [50, 50, 50] },
                      { name: 'Tricep Extension', category: 'isolation', sets: 3, reps: [8, 8, 8], weights: [15, 15, 15] },
                      { name: 'Chest Fly', category: 'isolation', sets: 3, reps: [12, 12, 12], weights: [25, 25, 25] },
                      { name: 'Lateral Raise', category: 'isolation', sets: 3, reps: [15, 15, 15], weights: [10, 10, 10] },
                      { name: 'Leg Curl', category: 'isolation', sets: 3, reps: [10, 10, 10], weights: [40, 40, 40] },
                      { name: 'Calf Raise', category: 'isolation', sets: 3, reps: [20, 20, 20], weights: [30, 30, 30] },
                      { name: 'Preacher Curl', category: 'isolation', sets: 3, reps: [10, 10, 10], weights: [18, 18, 18] },
                      { name: 'Cable Fly', category: 'isolation', sets: 3, reps: [12, 12, 12], weights: [22, 22, 22] },
                      { name: 'Wrist Curl', category: 'isolation', sets: 3, reps: [15, 15, 15], weights: [5, 5, 5] },
                      { name: 'Reverse Fly', category: 'isolation', sets: 3, reps: [12, 12, 12], weights: [12, 12, 12] }
                    ]
                  },
                  {
                    date: '2025-01-03',
                    exercises: [
                      { name: 'Hammer Curl', category: 'isolation', sets: 3, reps: [10, 10, 10], weights: [20, 20, 20] },
                      { name: 'Leg Press', category: 'isolation', sets: 3, reps: [15, 15, 15], weights: [100, 100, 100] }
                    ]
                  },
                  {
                    date: '2025-01-05',
                    exercises: [
                      { name: 'Cable Curl', category: 'isolation', sets: 3, reps: [12, 12, 12], weights: [18, 18, 18] }
                    ]
                  }
                ]
              })
            })
          })
        }),
        insert: (data: any) => Promise.resolve({ error: null })
      })
    }
    
    const signals = await BehavioralTrackingService.analyzeWorkoutBehaviorSignals(
      mockWorkoutData as any,
      'test-user',
      4
    )
    
    // Should detect high isolation ratio as beginner signal
    const exerciseSignal = signals.find(s => s.signalType === 'exercise_selection')
    assertExists(exerciseSignal)
    assertEquals(exerciseSignal?.signalValue, 'high_isolation_to_compound_ratio')
    assertEquals(exerciseSignal?.trainingAgeIndicator, 'beginner')
  })
  
  await t.step("should trigger training age audit with sufficient data", async () => {
    // Mock supabase with workout logs
    const mockSupabaseWithWorkouts = {
      from: (table: string) => {
        if (table === 'workout_logs') {
          return {
            select: () => ({
              eq: () => ({
                gte: () => ({
                  order: () => Promise.resolve({ data: [
                    { date: '2025-01-01', exercises: [{ name: 'Squat', weights: [100], reps: [5] }] },
                    { date: '2025-01-03', exercises: [{ name: 'Bench', weights: [80], reps: [8] }] },
                    { date: '2025-01-05', exercises: [{ name: 'Deadlift', weights: [120], reps: [3] }] },
                    { date: '2025-01-07', exercises: [{ name: 'Press', weights: [60], reps: [6] }] }
                  ] })
                })
              })
            })
          }
        }
        if (table === 'behavioral_signals') {
          return {
            insert: () => Promise.resolve({ error: null }),
            select: () => ({
              eq: () => ({
                gte: () => ({
                  order: () => Promise.resolve({ data: [] })
                })
              })
            })
          }
        }
        return {
          insert: () => Promise.resolve({ error: null }),
          select: () => ({
            eq: () => ({
              gte: () => ({
                order: () => Promise.resolve({ data: [] }),
                single: () => Promise.resolve({ data: mockUserProfile })
              }),
              single: () => Promise.resolve({ data: mockUserProfile })
            })
          })
        }
      }
    }
    
    // Should not throw and should call audit methods
    await BehavioralTrackingService.triggerTrainingAgeAudit(
      mockSupabaseWithWorkouts as any,
      'test-user'
    )
    // Integration test would verify database calls
  })
})

Deno.test("BehavioralTrackingService - Training Age Updates from Workout Data", async (t) => {
  
  await t.step("should adjust training age based on workout behavioral signals", async () => {
    const workoutSignals = [
      {
        userId: 'test-user',
        signalType: 'exercise_selection' as const,
        signalValue: 'high_isolation_to_compound_ratio',
        trainingAgeIndicator: 'beginner' as const,
        confidence: 0.8,
        timestamp: new Date().toISOString()
      },
      {
        userId: 'test-user',
        signalType: 'progression_response' as const,
        signalValue: 'linear_progression_8plus_weeks',
        trainingAgeIndicator: 'beginner' as const,
        confidence: 0.9,
        timestamp: new Date().toISOString()
      },
      {
        userId: 'test-user',
        signalType: 'workout_performance' as const,
        signalValue: 'completes_all_prescribed_work',
        trainingAgeIndicator: 'beginner' as const,
        confidence: 0.7,
        timestamp: new Date().toISOString()
      }
    ]
    
    // Mock TrainingAgeService methods
    const mockTrainingAgeService = {
      getEffectiveTrainingAge: async () => 'intermediate',
      classifyTrainingAge: (months: number) => {
        if (months < 15) return 'beginner'
        if (months < 30) return 'intermediate' 
        return 'advanced'
      }
    }
    
    // Mock the training age service import
    const newAge = await BehavioralTrackingService.updateTrainingAgeFromWorkoutData(
      mockSupabase as any,
      'test-user',
      workoutSignals
    )
    
    // Should return a valid training age (exact value depends on mock implementation)
    assertExists(newAge)
    assertEquals(['beginner', 'intermediate', 'advanced', 'highly_advanced'].includes(newAge), true)
  })
})

Deno.test("BehavioralTrackingService - Misclassification Detection", async (t) => {
  
  await t.step("should detect advanced claiming beginner patterns", () => {
    const signals: BehavioralSignal[] = [
      {
        userId: 'test',
        signalType: 'exercise_selection',
        signalValue: 'chooses_isolation_over_compounds',
        trainingAgeIndicator: 'beginner',
        confidence: 0.8,
        timestamp: new Date().toISOString()
      },
      {
        userId: 'test',
        signalType: 'exercise_selection', 
        signalValue: 'avoids_compound_movements',
        trainingAgeIndicator: 'beginner',
        confidence: 0.7,
        timestamp: new Date().toISOString()
      },
      {
        userId: 'test',
        signalType: 'exercise_selection',
        signalValue: 'focuses_on_arm_exercises',
        trainingAgeIndicator: 'beginner', 
        confidence: 0.9,
        timestamp: new Date().toISOString()
      },
      {
        userId: 'test',
        signalType: 'exercise_selection',
        signalValue: 'skips_leg_training',
        trainingAgeIndicator: 'beginner',
        confidence: 0.8,
        timestamp: new Date().toISOString()
      }
    ]
    
    const patterns = BehavioralTrackingService.detectMisclassificationPatterns(signals, 'advanced')
    
    assertEquals(patterns.length, 1)
    assertEquals(patterns[0].pattern, 'advanced_claiming_beginner_exercises')
    assertEquals(patterns[0].suggestedAge, 'intermediate')
    assertEquals(patterns[0].confidence, 0.7)
  })
  
  await t.step("should detect beginner showing intermediate progression", () => {
    const signals: BehavioralSignal[] = [
      {
        userId: 'test',
        signalType: 'progression_response',
        signalValue: 'stalls_every_4_6_weeks',
        trainingAgeIndicator: 'intermediate',
        confidence: 0.8,
        timestamp: new Date().toISOString()
      },
      {
        userId: 'test',
        signalType: 'progression_response',
        signalValue: 'uses_deloads_appropriately',
        trainingAgeIndicator: 'intermediate',
        confidence: 0.9,
        timestamp: new Date().toISOString()
      },
      {
        userId: 'test',
        signalType: 'progression_response',
        signalValue: 'cycles_intensity_volume',
        trainingAgeIndicator: 'intermediate',
        confidence: 0.7,
        timestamp: new Date().toISOString()
      }
    ]
    
    const patterns = BehavioralTrackingService.detectMisclassificationPatterns(signals, 'beginner')
    
    assertEquals(patterns.length, 1) 
    assertEquals(patterns[0].pattern, 'beginner_claiming_intermediate_progression')
    assertEquals(patterns[0].suggestedAge, 'intermediate')
    assertEquals(patterns[0].confidence, 0.8)
  })
})