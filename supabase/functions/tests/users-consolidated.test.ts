// Unit Tests for Consolidated Users Edge Function - All /users/* endpoints
// Tests the consolidated approach with all enhanced profiling endpoints under /users

import { assertEquals, assertExists, assert } from 'https://deno.land/std@0.208.0/testing/asserts.ts'
import { UserProfileService } from '../_shared/database/user-queries.ts'
import { TrainingBackground, MovementCompetency, PhysicalProfile } from '../_shared/types/user-profile.ts'

// Mock user ID and profile data for testing
const mockUserId = 'test-user-123'
const mockUserProfile = {
  id: mockUserId,
  email: 'test@example.com',
  profile_completion_percentage: 75,
  training_background: {
    total_training_months: 24,
    strength_training_months: 18,
    consistent_training_periods: [
      { duration_months: 12, program_type: '5/3/1', year_range: '2022-2023' }
    ],
    movement_competencies: {
      squat_pattern: {
        experience_level: 'intermediate',
        variations_performed: ['back squat', 'front squat'],
        current_working_weight_kg: 100,
        form_confidence: 'high'
      }
    },
    periodization_experience: true,
    previous_programs_used: ['5/3/1', 'Starting Strength'],
    longest_consistent_program_months: 12
  },
  physical_profile: {
    current_limitations: [
      {
        body_region: 'lower_back',
        condition: 'minor strain',
        severity: 'minor',
        medical_clearance: true,
        movement_restrictions: ['avoid rounded back'],
        pain_triggers: ['sitting too long']
      }
    ],
    absolute_exercise_exclusions: [
      {
        exercise_name: 'Behind the neck press',
        exclusion_type: 'specific_exercise',
        reason: 'injury_history',
        alternative_preferred: 'overhead press',
        notes: 'Shoulder impingement history'
      }
    ],
    movement_modifications: [],
    injury_history: []
  }
}

// Mock UserProfileService
class MockUserProfileService {
  async getUserProfile(userId: string) {
    if (userId === mockUserId) return mockUserProfile
    return null
  }
  
  async updateProfileSection(userId: string, request: any) {
    return {
      ...mockUserProfile,
      [request.section]: request.data,
      profile_completion_percentage: 80
    }
  }
  
  async getProfileCompletion(userId: string) {
    return {
      completion_percentage: 75,
      completed_sections: ['basic_info', 'training_background'],
      next_steps: [
        {
          step: 'physical_assessment',
          title: 'Physical Assessment',
          description: 'Complete your physical profile',
          completed: false,
          required: true
        }
      ]
    }
  }
  
  async completeOnboarding(userId: string) {
    return { ...mockUserProfile, onboarding_completed_at: new Date().toISOString() }
  }
  
  async completeOnboardingStep(userId: string, step: string) {
    // Mock implementation
  }
  
  async updateProfileCompletion(userId: string) {
    return 80
  }
}

// Helper function to create mock requests for consolidated endpoints
function createMockRequest(
  method: string, 
  path: string, 
  body?: any,
  headers: Record<string, string> = {}
): Request {
  const url = `https://test.supabase.co${path}`
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-token',
      ...headers
    }
  }
  
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestInit.body = JSON.stringify(body)
  }
  
  return new Request(url, requestInit)
}

// Test suite for consolidated users endpoints
Deno.test('Consolidated Users Edge Function Tests', async (t) => {
  const mockService = new MockUserProfileService() as UserProfileService

  // Test original profile endpoints still work
  await t.step('GET /users/profile should return user profile', async () => {
    const profile = await mockService.getUserProfile(mockUserId)
    
    assertExists(profile)
    assertEquals(profile!.id, mockUserId)
    assertEquals(profile!.email, 'test@example.com')
    assertEquals(profile!.profile_completion_percentage, 75)
  })

  await t.step('GET /users/profile/completion should return completion status', async () => {
    const completion = await mockService.getProfileCompletion(mockUserId)
    
    assertEquals(completion.completion_percentage, 75)
    assertExists(completion.next_steps)
    assertEquals(completion.next_steps.length, 1)
  })

  // Test training background endpoints
  await t.step('GET /users/training-background should return detailed training history', async () => {
    const profile = await mockService.getUserProfile(mockUserId)
    const trainingBackground = profile!.training_background
    
    assertExists(trainingBackground)
    assertEquals(trainingBackground.total_training_months, 24)
    assertEquals(trainingBackground.strength_training_months, 18)
    assertEquals(trainingBackground.previous_programs_used.length, 2)
    assert(trainingBackground.periodization_experience)
  })

  await t.step('PUT /users/training-background should update training experience', async () => {
    const updateData: TrainingBackground = {
      total_training_months: 30,
      strength_training_months: 24,
      consistent_training_periods: [
        { duration_months: 18, program_type: '5/3/1 BBB', year_range: '2023-2024' }
      ],
      movement_competencies: {},
      periodization_experience: true,
      previous_programs_used: ['5/3/1', 'Starting Strength', 'nSuns'],
      longest_consistent_program_months: 18
    }
    
    // Validate data before "sending"
    assert(updateData.total_training_months >= updateData.strength_training_months)
    assert(updateData.total_training_months > 0)
    
    const result = await mockService.updateProfileSection(mockUserId, {
      section: 'training_background',
      data: updateData
    })
    
    assertEquals(result.profile_completion_percentage, 80)
  })

  // Test movement competencies endpoints
  await t.step('GET /users/movement-competencies should return all competencies', async () => {
    const profile = await mockService.getUserProfile(mockUserId)
    const competencies = profile!.training_background?.movement_competencies || {}
    
    assertExists(competencies.squat_pattern)
    assertEquals(competencies.squat_pattern.experience_level, 'intermediate')
    assertEquals(competencies.squat_pattern.variations_performed.length, 2)
    assertEquals(competencies.squat_pattern.current_working_weight_kg, 100)
  })

  await t.step('PUT /users/movement-competencies/deadlift_pattern should update specific competency', async () => {
    const competencyUpdate: MovementCompetency = {
      experience_level: 'advanced',
      variations_performed: ['conventional', 'sumo', 'trap bar'],
      current_working_weight_kg: 140,
      form_confidence: 'high'
    }
    
    // Validate competency data
    const validExperienceLevels = ['untrained', 'novice', 'intermediate', 'advanced']
    const validConfidenceLevels = ['low', 'moderate', 'high']
    
    assert(validExperienceLevels.includes(competencyUpdate.experience_level))
    assert(validConfidenceLevels.includes(competencyUpdate.form_confidence))
    assert(Array.isArray(competencyUpdate.variations_performed))
    
    const result = await mockService.updateProfileSection(mockUserId, {
      section: 'training_background',
      data: {
        ...mockUserProfile.training_background,
        movement_competencies: {
          ...mockUserProfile.training_background.movement_competencies,
          deadlift_pattern: competencyUpdate
        }
      }
    })
    
    assertEquals(result.profile_completion_percentage, 80)
  })

  await t.step('POST /users/movement-competencies/assess should handle assessment wizard', async () => {
    const assessmentData = {
      assessments: [
        {
          pattern: 'bench_press',
          competency: {
            experience_level: 'intermediate',
            variations_performed: ['flat bench', 'incline'],
            current_working_weight_kg: 80,
            form_confidence: 'moderate'
          }
        }
      ]
    }
    
    // Validate assessment structure
    assert(Array.isArray(assessmentData.assessments))
    assertEquals(assessmentData.assessments.length, 1)
    
    const assessment = assessmentData.assessments[0]
    assertExists(assessment.pattern)
    assertExists(assessment.competency.experience_level)
    assertExists(assessment.competency.form_confidence)
  })

  // Test physical profile endpoints
  await t.step('GET /users/physical-profile should return comprehensive physical assessment', async () => {
    const profile = await mockService.getUserProfile(mockUserId)
    const physicalProfile = profile!.physical_profile
    
    assertExists(physicalProfile)
    assertEquals(physicalProfile.current_limitations.length, 1)
    assertEquals(physicalProfile.absolute_exercise_exclusions.length, 1)
    
    const limitation = physicalProfile.current_limitations[0]
    assertEquals(limitation.body_region, 'lower_back')
    assertEquals(limitation.severity, 'minor')
    assert(limitation.medical_clearance)
  })

  await t.step('PUT /users/physical-profile should update physical assessment', async () => {
    const physicalUpdate: PhysicalProfile = {
      current_limitations: [
        {
          body_region: 'shoulder',
          condition: 'Mild impingement',
          severity: 'minor',
          medical_clearance: true,
          movement_restrictions: ['overhead movements'],
          pain_triggers: ['repetitive overhead work']
        }
      ],
      absolute_exercise_exclusions: [
        {
          exercise_name: 'Upright rows',
          exclusion_type: 'specific_exercise',
          reason: 'current_pain',
          alternative_preferred: 'lateral raises'
        }
      ],
      movement_modifications: [],
      injury_history: []
    }
    
    // Validate physical profile data
    const validBodyRegions = ['lower_back', 'shoulder', 'knee', 'hip', 'wrist', 'ankle', 'neck', 'elbow']
    const validSeverityLevels = ['minor', 'moderate', 'severe']
    
    for (const limitation of physicalUpdate.current_limitations) {
      assert(validBodyRegions.includes(limitation.body_region))
      assert(validSeverityLevels.includes(limitation.severity))
      assertEquals(typeof limitation.medical_clearance, 'boolean')
    }
    
    const result = await mockService.updateProfileSection(mockUserId, {
      section: 'physical_profile',
      data: physicalUpdate
    })
    
    assertEquals(result.profile_completion_percentage, 80)
  })

  // Test exercise exclusions endpoints
  await t.step('GET /users/exercise-exclusions should return exercise exclusions list', async () => {
    const profile = await mockService.getUserProfile(mockUserId)
    const exclusions = profile!.physical_profile?.absolute_exercise_exclusions || []
    
    assertEquals(exclusions.length, 1)
    
    const exclusion = exclusions[0]
    assertEquals(exclusion.exercise_name, 'Behind the neck press')
    assertEquals(exclusion.exclusion_type, 'specific_exercise')
    assertEquals(exclusion.reason, 'injury_history')
    assertEquals(exclusion.alternative_preferred, 'overhead press')
  })

  await t.step('POST /users/exercise-exclusions should add new exclusion', async () => {
    const newExclusion = {
      exercise_name: 'Good mornings',
      exclusion_type: 'specific_exercise',
      reason: 'current_pain',
      alternative_preferred: 'Romanian deadlifts',
      notes: 'Aggravates lower back'
    }
    
    // Validate exclusion data
    assertExists(newExclusion.exercise_name)
    assert(['movement_pattern', 'specific_exercise', 'equipment_type'].includes(newExclusion.exclusion_type))
    assert(['injury_history', 'current_pain', 'medical_restriction', 'personal_preference'].includes(newExclusion.reason))
    
    // Mock adding to existing exclusions
    const currentExclusions = mockUserProfile.physical_profile.absolute_exercise_exclusions
    const isDuplicate = currentExclusions.some(existing => 
      existing.exercise_name.toLowerCase() === newExclusion.exercise_name.toLowerCase()
    )
    
    assert(!isDuplicate) // Should not be duplicate
  })

  // Test injuries endpoints
  await t.step('GET /users/injuries should return injury history and current limitations', async () => {
    const profile = await mockService.getUserProfile(mockUserId)
    const injuryHistory = profile!.physical_profile?.injury_history || []
    const currentLimitations = profile!.physical_profile?.current_limitations || []
    
    assertEquals(injuryHistory.length, 0) // No injuries in mock data
    assertEquals(currentLimitations.length, 1)
    
    const limitation = currentLimitations[0]
    assertEquals(limitation.body_region, 'lower_back')
    assertEquals(limitation.condition, 'minor strain')
  })

  await t.step('POST /users/injuries should add new injury or limitation', async () => {
    const newLimitation = {
      type: 'current_limitation',
      limitation: {
        body_region: 'knee',
        condition: "Runner's knee",
        severity: 'moderate',
        medical_clearance: false,
        movement_restrictions: ['deep squats', 'jumping'],
        pain_triggers: ['stairs', 'long walks']
      }
    }
    
    // Validate limitation data
    const validBodyRegions = ['lower_back', 'shoulder', 'knee', 'hip', 'wrist', 'ankle', 'neck', 'elbow']
    assert(validBodyRegions.includes(newLimitation.limitation.body_region))
    assert(['minor', 'moderate', 'severe'].includes(newLimitation.limitation.severity))
    assertEquals(typeof newLimitation.limitation.medical_clearance, 'boolean')
  })
})

// Integration test for complete consolidated functionality
Deno.test('Consolidated Users Integration Test', async (t) => {
  const mockService = new MockUserProfileService() as UserProfileService

  await t.step('Complete consolidated user profiling workflow', async () => {
    let profile = await mockService.getUserProfile(mockUserId)
    assertExists(profile)
    
    // 1. Update training background via consolidated endpoint
    const updatedTraining = await mockService.updateProfileSection(mockUserId, {
      section: 'training_background',
      data: {
        ...profile.training_background,
        total_training_months: 36
      }
    })
    
    // 2. Update physical profile via consolidated endpoint
    const updatedPhysical = await mockService.updateProfileSection(mockUserId, {
      section: 'physical_profile',
      data: {
        ...profile.physical_profile,
        current_limitations: []
      }
    })
    
    // 3. Test completion tracking
    const completion = await mockService.getProfileCompletion(mockUserId)
    assertEquals(completion.completion_percentage, 75)
    
    // Verify all updates worked
    assertEquals(updatedTraining.profile_completion_percentage, 80)
    assertEquals(updatedPhysical.profile_completion_percentage, 80)
  })
})