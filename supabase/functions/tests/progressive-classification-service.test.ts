/**
 * Unit Tests for ProgressiveClassificationService
 * Tests progressive learning integration and workout data-only behavior analysis
 * NO user-AI interaction - only workout logging data analysis
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.208.0/testing/asserts.ts"
import { ProgressiveClassificationService, ProgressiveClassificationResult } from '../_shared/services/progressive-classification-service.ts'

// Mock Supabase client
const mockSupabase = {
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: string) => ({
        gte: (column: string, value: string) => ({
          order: (column: string, options: any) => ({
            limit: (n: number) => Promise.resolve({ data: mockWorkoutHistory }),
            single: () => Promise.resolve({ data: { id: 'test', training_background: {} } })
          })
        }),
        single: () => Promise.resolve({ data: { id: 'test', training_background: {} } })
      })
    }),
    insert: (data: any) => Promise.resolve({ error: null })
  })
}

const mockWorkoutHistory = [
  {
    exercises: [
      { name: 'Squat', weights: [135, 135, 135] },
      { name: 'Bench Press', weights: [115, 115, 115] }
    ],
    date: '2024-01-01'
  },
  {
    exercises: [
      { name: 'Squat', weights: [140, 140, 140] },
      { name: 'Bench Press', weights: [120, 120, 120] }
    ],
    date: '2024-01-08'
  },
  {
    exercises: [
      { name: 'Squat', weights: [145, 145, 145] },
      { name: 'Bench Press', weights: [125, 125, 125] }
    ],
    date: '2024-01-15'
  }
]

// Mock services
const mockTrainingAgeService = {
  getEffectiveTrainingAge: async () => 'intermediate'
}

const mockBehavioralTrackingService = {
  evaluateTrainingAgeConfidence: async () => ({
    currentClassification: 'intermediate',
    confidenceScore: 0.8,
    needsValidation: false,
    contradictorySignals: [],
    supportingSignals: []
  }),
  getTriggeredValidationQuestions: async () => [],
  recordBehavioralSignal: async () => {}
}

Deno.test("ProgressiveClassificationService - Progressive Training Age", async (t) => {
  
  await t.step("should return behavioral adjusted result when confidence high", async () => {
    // Override service imports
    const originalTrainingAge = ProgressiveClassificationService['TrainingAgeService']
    const originalBehavioral = ProgressiveClassificationService['BehavioralTrackingService']
    
    ProgressiveClassificationService['TrainingAgeService'] = mockTrainingAgeService
    ProgressiveClassificationService['BehavioralTrackingService'] = mockBehavioralTrackingService
    
    const result = await ProgressiveClassificationService.getProgressiveTrainingAge(
      mockSupabase as any,
      'test-user'
    )
    
    assertEquals(result.trainingAge, 'intermediate')
    assertEquals(result.confidence, 0.8)
    assertEquals(result.classificationType, 'behavioral_adjusted')
    assertEquals(result.nextValidationTrigger, undefined) // No validation needed
    
    // Restore originals
    ProgressiveClassificationService['TrainingAgeService'] = originalTrainingAge
    ProgressiveClassificationService['BehavioralTrackingService'] = originalBehavioral
  })
  
  await t.step("should return base classification with validation when confidence low", async () => {
    const lowConfidenceBehavioral = {
      ...mockBehavioralTrackingService,
      evaluateTrainingAgeConfidence: async () => ({
        currentClassification: 'intermediate',
        confidenceScore: 0.4, // Low confidence
        needsValidation: true,
        contradictorySignals: [{ signal_type: 'test' }],
        supportingSignals: []
      }),
      getTriggeredValidationQuestions: async () => [
        { id: 'validation1', question: 'Test question' }
      ]
    }
    
    const originalTrainingAge = ProgressiveClassificationService['TrainingAgeService']
    const originalBehavioral = ProgressiveClassificationService['BehavioralTrackingService']
    
    ProgressiveClassificationService['TrainingAgeService'] = mockTrainingAgeService
    ProgressiveClassificationService['BehavioralTrackingService'] = lowConfidenceBehavioral
    
    const result = await ProgressiveClassificationService.getProgressiveTrainingAge(
      mockSupabase as any,
      'test-user'  
    )
    
    assertEquals(result.trainingAge, 'intermediate') // Base classification
    assertEquals(result.confidence, 0.4)
    assertEquals(result.classificationType, 'initial')
    assertEquals(result.nextValidationTrigger, 'low_confidence')
    assertExists(result.recommendedQuestions)
    assertEquals(result.recommendedQuestions?.length, 1)
    
    // Restore originals
    ProgressiveClassificationService['TrainingAgeService'] = originalTrainingAge
    ProgressiveClassificationService['BehavioralTrackingService'] = originalBehavioral
  })
})

Deno.test("ProgressiveClassificationService - Workout Behavior Analysis", async (t) => {
  
  await t.step("should detect compound-focused exercise selection", async () => {
    const workoutData = {
      exercises: [
        {
          name: 'Squat',
          category: 'compound' as const,
          sets: 3,
          reps: [5, 5, 5],
          weights: [135, 135, 135]
        },
        {
          name: 'Bench Press', 
          category: 'compound' as const,
          sets: 3,
          reps: [5, 5, 5],
          weights: [115, 115, 115]
        },
        {
          name: 'Row',
          category: 'compound' as const,
          sets: 3,
          reps: [8, 8, 8],
          weights: [95, 95, 95]
        },
        {
          name: 'Tricep Extensions',
          category: 'isolation' as const,
          sets: 2,
          reps: [12, 12],
          weights: [25, 25]
        }
      ],
      sessionDuration: 45,
      difficultyRating: 7,
      completionRate: 1.0
    }
    
    // Mock the BehavioralTrackingService
    const mockRecordSignal = []
    const mockBehavioralService = {
      recordBehavioralSignal: async (supabase: any, signal: any) => {
        mockRecordSignal.push(signal)
      }
    }
    
    const original = ProgressiveClassificationService['BehavioralTrackingService']
    ProgressiveClassificationService['BehavioralTrackingService'] = mockBehavioralService
    
    await ProgressiveClassificationService.recordWorkoutBehavior(
      mockSupabase as any,
      'test-user',
      workoutData
    )
    
    // Should have recorded compound-focused signal (75% compound ratio)
    const exerciseSignal = mockRecordSignal.find(s => s.signalType === 'exercise_selection')
    assertExists(exerciseSignal)
    assertEquals(exerciseSignal.signalValue, 'compound_focused')
    assertEquals(exerciseSignal.trainingAgeIndicator, 'intermediate')
    
    // Should have recorded no RPE usage signal  
    const rpeSignal = mockRecordSignal.find(s => s.signalType === 'terminology_usage')
    assertExists(rpeSignal)
    assertEquals(rpeSignal.signalValue, 'no_rpe_usage')
    assertEquals(rpeSignal.trainingAgeIndicator, 'beginner')
    
    ProgressiveClassificationService['BehavioralTrackingService'] = original
  })
  
  await t.step("should detect isolation-focused exercise selection", async () => {
    const isolationWorkout = {
      exercises: [
        {
          name: 'Bicep Curls',
          category: 'isolation' as const,
          sets: 3,
          reps: [12, 12, 12],
          weights: [25, 25, 25]
        },
        {
          name: 'Tricep Extensions',
          category: 'isolation' as const, 
          sets: 3,
          reps: [12, 12, 12],
          weights: [30, 30, 30]
        },
        {
          name: 'Lateral Raises',
          category: 'isolation' as const,
          sets: 3,
          reps: [15, 15, 15], 
          weights: [15, 15, 15]
        },
        {
          name: 'Squat',
          category: 'compound' as const,
          sets: 2,
          reps: [8, 8],
          weights: [135, 135]
        }
      ],
      sessionDuration: 60,
      difficultyRating: 5,
      completionRate: 1.0
    }
    
    const mockRecordSignal = []
    const mockBehavioralService = {
      recordBehavioralSignal: async (supabase: any, signal: any) => {
        mockRecordSignal.push(signal)
      }
    }
    
    const original = ProgressiveClassificationService['BehavioralTrackingService']
    ProgressiveClassificationService['BehavioralTrackingService'] = mockBehavioralService
    
    await ProgressiveClassificationService.recordWorkoutBehavior(
      mockSupabase as any,
      'test-user',
      isolationWorkout
    )
    
    // Should detect isolation-focused pattern (25% compound ratio)
    const exerciseSignal = mockRecordSignal.find(s => s.signalType === 'exercise_selection')
    assertExists(exerciseSignal)
    assertEquals(exerciseSignal.signalValue, 'isolation_focused')
    assertEquals(exerciseSignal.trainingAgeIndicator, 'beginner')
    
    ProgressiveClassificationService['BehavioralTrackingService'] = original
  })
  
  await t.step("should detect consistent RPE usage", async () => {
    const rpeWorkout = {
      exercises: [
        {
          name: 'Squat',
          category: 'compound' as const,
          sets: 3,
          reps: [5, 5, 5],
          weights: [185, 185, 185],
          rpe: [7, 8, 9] // Consistent RPE tracking
        },
        {
          name: 'Bench Press',
          category: 'compound' as const,
          sets: 3,
          reps: [6, 6, 6],
          weights: [135, 135, 135],
          rpe: [6, 7, 8] // Consistent RPE tracking
        }
      ],
      sessionDuration: 50,
      difficultyRating: 8,
      completionRate: 1.0
    }
    
    const mockRecordSignal = []
    const mockBehavioralService = {
      recordBehavioralSignal: async (supabase: any, signal: any) => {
        mockRecordSignal.push(signal)
      }
    }
    
    const original = ProgressiveClassificationService['BehavioralTrackingService']
    ProgressiveClassificationService['BehavioralTrackingService'] = mockBehavioralService
    
    await ProgressiveClassificationService.recordWorkoutBehavior(
      mockSupabase as any,
      'test-user',
      rpeWorkout
    )
    
    // Should detect advanced RPE usage (100% usage)
    const rpeSignal = mockRecordSignal.find(s => s.signalValue === 'consistent_rpe_usage')
    assertExists(rpeSignal)
    assertEquals(rpeSignal.signalType, 'terminology_usage')
    assertEquals(rpeSignal.trainingAgeIndicator, 'advanced')
    assertEquals(rpeSignal.confidence, 0.8)
    
    ProgressiveClassificationService['BehavioralTrackingService'] = original
  })
})

Deno.test("ProgressiveClassificationService - Form Feedback", async (t) => {
  
  await t.step("should record form feedback signals", async () => {
    const mockRecordSignal = []
    const mockBehavioralService = {
      recordBehavioralSignal: async (supabase: any, signal: any) => {
        mockRecordSignal.push(signal)
      }
    }
    
    const original = ProgressiveClassificationService['BehavioralTrackingService']
    ProgressiveClassificationService['BehavioralTrackingService'] = mockBehavioralService
    
    // Test different feedback types
    await ProgressiveClassificationService.recordFormFeedback(
      mockSupabase as any,
      'test-user',
      'squat',
      'needs_help'
    )
    
    await ProgressiveClassificationService.recordFormFeedback(
      mockSupabase as any, 
      'test-user',
      'bench_press',
      'could_coach_others'
    )
    
    await ProgressiveClassificationService.recordFormFeedback(
      mockSupabase as any,
      'test-user',
      'deadlift', 
      'comfortable'
    )
    
    assertEquals(mockRecordSignal.length, 3)
    
    // Check beginner signal
    const beginnerSignal = mockRecordSignal.find(s => s.signalValue === 'squat_needs_help')
    assertExists(beginnerSignal)
    assertEquals(beginnerSignal.trainingAgeIndicator, 'beginner')
    assertEquals(beginnerSignal.confidence, 0.8)
    
    // Check advanced signal
    const advancedSignal = mockRecordSignal.find(s => s.signalValue === 'bench_press_could_coach_others')
    assertExists(advancedSignal)
    assertEquals(advancedSignal.trainingAgeIndicator, 'advanced')
    assertEquals(advancedSignal.confidence, 0.9)
    
    // Check intermediate signal
    const intermediateSignal = mockRecordSignal.find(s => s.signalValue === 'deadlift_comfortable')
    assertExists(intermediateSignal)
    assertEquals(intermediateSignal.trainingAgeIndicator, 'intermediate')
    assertEquals(intermediateSignal.confidence, 0.6)
    
    ProgressiveClassificationService['BehavioralTrackingService'] = original
  })
})

Deno.test("ProgressiveClassificationService - Terminology Usage", async (t) => {
  
  await t.step("should detect advanced terminology usage", async () => {
    const advancedText = "I'm looking to periodization my training with a mesocycle approach. Need help with autoregulation during my peak phase and managing fatigue with block training."
    
    const mockRecordSignal = []
    const mockBehavioralService = {
      recordBehavioralSignal: async (supabase: any, signal: any) => {
        mockRecordSignal.push(signal)
      }
    }
    
    const original = ProgressiveClassificationService['BehavioralTrackingService']
    ProgressiveClassificationService['BehavioralTrackingService'] = mockBehavioralService
    
    await ProgressiveClassificationService.recordTerminologyUsage(
      mockSupabase as any,
      'test-user',
      advancedText
    )
    
    const advancedSignal = mockRecordSignal.find(s => s.trainingAgeIndicator === 'advanced')
    assertExists(advancedSignal)
    assertEquals(advancedSignal.signalType, 'terminology_usage')
    assertStringIncludes(advancedSignal.signalValue, 'advanced_terms')
    assertEquals(advancedSignal.confidence, 0.8)
    
    ProgressiveClassificationService['BehavioralTrackingService'] = original
  })
  
  await t.step("should detect intermediate terminology usage", async () => {
    const intermediateText = "I understand progressive overload and deload weeks. My 1RM has improved with hypertrophy training and I track RPE for most exercises."
    
    const mockRecordSignal = []
    const mockBehavioralService = {
      recordBehavioralSignal: async (supabase: any, signal: any) => {
        mockRecordSignal.push(signal)
      }
    }
    
    const original = ProgressiveClassificationService['BehavioralTrackingService']
    ProgressiveClassificationService['BehavioralTrackingService'] = mockBehavioralService
    
    await ProgressiveClassificationService.recordTerminologyUsage(
      mockSupabase as any,
      'test-user',
      intermediateText
    )
    
    const intermediateSignal = mockRecordSignal.find(s => s.trainingAgeIndicator === 'intermediate')
    assertExists(intermediateSignal)
    assertStringIncludes(intermediateSignal.signalValue, 'intermediate_terms')
    assertEquals(intermediateSignal.confidence, 0.7)
    
    ProgressiveClassificationService['BehavioralTrackingService'] = original
  })
  
  await t.step("should detect beginner language patterns", async () => {
    const beginnerText = "What is progressive overload? I'm new to this and don't understand how to start. Just started training and confused about form."
    
    const mockRecordSignal = []
    const mockBehavioralService = {
      recordBehavioralSignal: async (supabase: any, signal: any) => {
        mockRecordSignal.push(signal)
      }
    }
    
    const original = ProgressiveClassificationService['BehavioralTrackingService']
    ProgressiveClassificationService['BehavioralTrackingService'] = mockBehavioralService
    
    await ProgressiveClassificationService.recordTerminologyUsage(
      mockSupabase as any,
      'test-user',
      beginnerText
    )
    
    const beginnerSignal = mockRecordSignal.find(s => s.trainingAgeIndicator === 'beginner')
    assertExists(beginnerSignal)
    assertStringIncludes(beginnerSignal.signalValue, 'beginner_language')
    assertEquals(beginnerSignal.confidence, 0.8)
    
    ProgressiveClassificationService['BehavioralTrackingService'] = original
  })
})

Deno.test("ProgressiveClassificationService - Progression Pattern Analysis", async (t) => {
  
  await t.step("should detect linear progression pattern", async () => {
    // Mock workout history showing consistent progression
    const mockSupabaseProgression = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            gte: () => ({
              order: () => Promise.resolve({ 
                data: [
                  {
                    exercises: [{ name: 'Squat', weights: [135, 135, 135] }],
                    date: '2024-01-01'
                  },
                  {
                    exercises: [{ name: 'Squat', weights: [140, 140, 140] }], 
                    date: '2024-01-08'
                  },
                  {
                    exercises: [{ name: 'Squat', weights: [145, 145, 145] }],
                    date: '2024-01-15'
                  },
                  {
                    exercises: [{ name: 'Squat', weights: [150, 150, 150] }],
                    date: '2024-01-22'
                  }
                ]
              })
            })
          })
        })
      })
    }
    
    const workoutData = {
      exercises: [
        {
          name: 'Squat',
          category: 'compound' as const,
          sets: 3,
          reps: [5, 5, 5],
          weights: [155, 155, 155] // Continuing progression
        }
      ],
      sessionDuration: 45,
      difficultyRating: 7,
      completionRate: 1.0
    }
    
    const mockRecordSignal = []
    const mockBehavioralService = {
      recordBehavioralSignal: async (supabase: any, signal: any) => {
        mockRecordSignal.push(signal)
      }
    }
    
    const original = ProgressiveClassificationService['BehavioralTrackingService']
    ProgressiveClassificationService['BehavioralTrackingService'] = mockBehavioralService
    
    await ProgressiveClassificationService.recordWorkoutBehavior(
      mockSupabaseProgression as any,
      'test-user',
      workoutData
    )
    
    // Should detect linear progression pattern
    const progressionSignal = mockRecordSignal.find(s => 
      s.signalType === 'progression_response' && 
      s.signalValue === 'consistent_linear_progression'
    )
    
    assertExists(progressionSignal)
    assertEquals(progressionSignal.trainingAgeIndicator, 'beginner')
    assertEquals(progressionSignal.confidence, 0.8)
    
    ProgressiveClassificationService['BehavioralTrackingService'] = original
  })
})

Deno.test("ProgressiveClassificationService - Classification History", async (t) => {
  
  await t.step("should retrieve classification history", async () => {
    const mockHistorySupabase = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => Promise.resolve({
                data: [
                  {
                    timestamp: '2024-01-15T00:00:00Z',
                    training_age: 'intermediate',
                    confidence: 0.8,
                    trigger: 'behavioral_signals'
                  },
                  {
                    timestamp: '2024-01-01T00:00:00Z', 
                    training_age: 'beginner',
                    confidence: 0.6,
                    trigger: 'initial_onboarding'
                  }
                ]
              })
            })
          })
        })
      })
    }
    
    const history = await ProgressiveClassificationService.getClassificationHistory(
      mockHistorySupabase as any,
      'test-user',
      5
    )
    
    assertEquals(history.length, 2)
    assertEquals(history[0].training_age, 'intermediate') // Most recent first
    assertEquals(history[0].trigger, 'behavioral_signals')
    assertEquals(history[1].training_age, 'beginner')
    assertEquals(history[1].trigger, 'initial_onboarding')
  })
  
  await t.step("should record classification changes", async () => {
    let insertedData: any = null
    const mockRecordSupabase = {
      from: (table: string) => ({
        insert: (data: any) => {
          insertedData = data
          return Promise.resolve({ error: null })
        }
      })
    }
    
    await ProgressiveClassificationService.recordClassificationChange(
      mockRecordSupabase as any,
      'test-user',
      'intermediate',
      'behavioral_signals',
      { confidence: 0.8, supportingSignals: 5 }
    )
    
    assertExists(insertedData)
    assertEquals(insertedData.user_id, 'test-user')
    assertEquals(insertedData.training_age, 'intermediate')
    assertEquals(insertedData.trigger, 'behavioral_signals')
    assertEquals(insertedData.confidence, 0.8)
    assertExists(insertedData.timestamp)
  })
})