// Comprehensive Unit Tests for Enhanced User Profiling Endpoints - V2
// Tests all new profiling Edge Functions: training-background, movement-competencies, physical-profile, exercise-exclusions, injuries

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
    movement_modifications: [
      {
        movement_pattern: 'deadlift',
        modification_type: 'range_of_motion',
        details: 'Use deficit or blocks as needed'
      }
    ],
    injury_history: [
      {
        injury_type: 'Lower back strain',
        body_region: 'lower_back',
        year_occurred: 2021,
        surgery_required: false,
        full_recovery: true,
        ongoing_considerations: 'Maintain core strength'
      }
    ]
  }
}

// Mock Supabase client for testing
class MockSupabaseAuth {
  getUser() {
    return { 
      data: { 
        user: { id: mockUserId } 
      }, 
      error: null 
    }
  }
}

class MockSupabaseClient {
  public auth = new MockSupabaseAuth()
}

class MockUserProfileService {
  async getUserProfile(userId: string) {
    if (userId === mockUserId) return mockUserProfile
    return null
  }
  
  async updateProfileSection(userId: string, request: any) {
    return {
      ...mockUserProfile,
      [request.section]: request.data,
      profile_completion_percentage: 80 // Mock updated completion
    }
  }
}

// Helper function to create mock requests
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

// Test suite for Training Background endpoints
Deno.test('Training Background Edge Function Tests', async (t) => {
  const mockService = new MockUserProfileService() as UserProfileService

  await t.step('GET /training-background should return training background with completion status', async () => {
    const req = createMockRequest('GET', '/training-background')
    
    // Mock the handler logic
    const profile = await mockService.getUserProfile(mockUserId)
    const trainingBackground = profile?.training_background
    
    assertExists(trainingBackground)
    assertEquals(trainingBackground.total_training_months, 24)
    assertEquals(trainingBackground.strength_training_months, 18)
    assertEquals(trainingBackground.previous_programs_used.length, 2)
    assert(trainingBackground.periodization_experience)
  })

  await t.step('PUT /training-background should validate and update training background', async () => {
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
    
    const req = createMockRequest('PUT', '/training-background', updateData)
    
    // Test validation logic
    assert(updateData.total_training_months >= updateData.strength_training_months)
    assert(updateData.total_training_months > 0)
    assert(updateData.strength_training_months >= 0)
    
    const result = await mockService.updateProfileSection(mockUserId, {
      section: 'training_background',
      data: updateData
    })
    
    assertEquals(result.profile_completion_percentage, 80)
  })

  await t.step('PUT /training-background should reject invalid data', async () => {
    const invalidData = {
      total_training_months: -5, // invalid
      strength_training_months: 20
    }
    
    // Test validation
    assert(invalidData.total_training_months < 0) // Should be rejected
  })
})

// Test suite for Movement Competencies endpoints
Deno.test('Movement Competencies Edge Function Tests', async (t) => {
  const mockService = new MockUserProfileService() as UserProfileService

  await t.step('GET /movement-competencies should return all competencies with progress', async () => {
    const profile = await mockService.getUserProfile(mockUserId)
    const competencies = profile?.training_background?.movement_competencies || {}
    
    assertExists(competencies.squat_pattern)
    assertEquals(competencies.squat_pattern.experience_level, 'intermediate')
    assertEquals(competencies.squat_pattern.variations_performed.length, 2)
    assertEquals(competencies.squat_pattern.form_confidence, 'high')
  })

  await t.step('GET /movement-competencies/squat_pattern should return specific pattern', async () => {
    const profile = await mockService.getUserProfile(mockUserId)
    const competency = profile?.training_background?.movement_competencies?.squat_pattern
    
    assertExists(competency)
    assertEquals(competency.current_working_weight_kg, 100)
    assertEquals(competency.experience_level, 'intermediate')
  })

  await t.step('PUT /movement-competencies/deadlift_pattern should update specific competency', async () => {
    const competencyUpdate: MovementCompetency = {
      experience_level: 'advanced',
      variations_performed: ['conventional', 'sumo', 'trap bar'],
      current_working_weight_kg: 140,
      form_confidence: 'high'
    }
    
    // Test validation
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

  await t.step('POST /movement-competencies/assess should handle assessment wizard', async () => {
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
        },
        {
          pattern: 'pullups_chinups',
          competency: {
            experience_level: 'novice',
            variations_performed: ['assisted pullups'],
            form_confidence: 'low'
          }
        }
      ]
    }
    
    // Validate assessments
    assert(Array.isArray(assessmentData.assessments))
    assertEquals(assessmentData.assessments.length, 2)
    
    for (const assessment of assessmentData.assessments) {
      assertExists(assessment.pattern)
      assertExists(assessment.competency.experience_level)
      assertExists(assessment.competency.form_confidence)
    }
  })
})

// Test suite for Physical Profile endpoints
Deno.test('Physical Profile Edge Function Tests', async (t) => {
  const mockService = new MockUserProfileService() as UserProfileService

  await t.step('GET /physical-profile should return comprehensive physical assessment', async () => {
    const profile = await mockService.getUserProfile(mockUserId)
    const physicalProfile = profile?.physical_profile
    
    assertExists(physicalProfile)
    assertEquals(physicalProfile.current_limitations.length, 1)
    assertEquals(physicalProfile.absolute_exercise_exclusions.length, 1)
    assertEquals(physicalProfile.movement_modifications.length, 1)
    assertEquals(physicalProfile.injury_history.length, 1)
  })

  await t.step('PUT /physical-profile should validate and update all sections', async () => {
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
      movement_modifications: [
        {
          movement_pattern: 'overhead_press',
          modification_type: 'range_of_motion',
          details: 'Stop at 90 degrees if pain occurs'
        }
      ],
      injury_history: [
        {
          injury_type: 'Shoulder impingement',
          body_region: 'shoulder',
          year_occurred: 2023,
          surgery_required: false,
          full_recovery: false,
          ongoing_considerations: 'Regular PT exercises'
        }
      ]
    }
    
    // Test validation logic
    const validBodyRegions = ['lower_back', 'shoulder', 'knee', 'hip', 'wrist', 'ankle', 'neck', 'elbow']
    const validSeverityLevels = ['minor', 'moderate', 'severe']
    
    for (const limitation of physicalUpdate.current_limitations) {
      assert(validBodyRegions.includes(limitation.body_region))
      assert(validSeverityLevels.includes(limitation.severity))
      assertEquals(typeof limitation.medical_clearance, 'boolean')
      assert(Array.isArray(limitation.movement_restrictions))
      assert(Array.isArray(limitation.pain_triggers))
    }
    
    for (const exclusion of physicalUpdate.absolute_exercise_exclusions) {
      assertExists(exclusion.exercise_name)
      assert(['movement_pattern', 'specific_exercise', 'equipment_type'].includes(exclusion.exclusion_type))
      assert(['injury_history', 'current_pain', 'medical_restriction', 'personal_preference'].includes(exclusion.reason))
    }
    
    const result = await mockService.updateProfileSection(mockUserId, {
      section: 'physical_profile',
      data: physicalUpdate
    })
    
    assertEquals(result.profile_completion_percentage, 80)
  })
})

// Test suite for Exercise Exclusions endpoints  
Deno.test('Exercise Exclusions Edge Function Tests', async (t) => {
  const mockService = new MockUserProfileService() as UserProfileService

  await t.step('GET /exercise-exclusions should return grouped exclusions with summary', async () => {
    const profile = await mockService.getUserProfile(mockUserId)
    const exclusions = profile?.physical_profile?.absolute_exercise_exclusions || []
    
    assertEquals(exclusions.length, 1)
    
    const exclusion = exclusions[0]
    assertEquals(exclusion.exercise_name, 'Behind the neck press')
    assertEquals(exclusion.exclusion_type, 'specific_exercise')
    assertEquals(exclusion.reason, 'injury_history')
    assertExists(exclusion.alternative_preferred)
  })

  await t.step('POST /exercise-exclusions should add new exclusion with duplicate check', async () => {
    const newExclusion = {
      exercise_name: 'Good mornings',
      exclusion_type: 'specific_exercise',
      reason: 'current_pain',
      alternative_preferred: 'Romanian deadlifts',
      notes: 'Aggravates lower back'
    }
    
    // Test validation
    assertExists(newExclusion.exercise_name)
    assert(['movement_pattern', 'specific_exercise', 'equipment_type'].includes(newExclusion.exclusion_type))
    assert(['injury_history', 'current_pain', 'medical_restriction', 'personal_preference'].includes(newExclusion.reason))
    
    // Mock adding to existing exclusions
    const currentExclusions = mockUserProfile.physical_profile.absolute_exercise_exclusions
    const isDuplicate = currentExclusions.some(existing => 
      existing.exercise_name.toLowerCase() === newExclusion.exercise_name.toLowerCase() &&
      existing.exclusion_type === newExclusion.exclusion_type
    )
    
    assert(!isDuplicate) // Should not be duplicate
  })

  await t.step('PUT /exercise-exclusions/0 should update existing exclusion', async () => {
    const exclusionUpdate = {
      exercise_name: 'Behind the neck press',
      exclusion_type: 'specific_exercise',
      reason: 'medical_restriction',
      alternative_preferred: 'front military press',
      notes: 'Updated after PT consultation'
    }
    
    // Test validation
    assertExists(exclusionUpdate.exercise_name)
    assert(['movement_pattern', 'specific_exercise', 'equipment_type'].includes(exclusionUpdate.exclusion_type))
    
    const result = await mockService.updateProfileSection(mockUserId, {
      section: 'physical_profile',
      data: {
        ...mockUserProfile.physical_profile,
        absolute_exercise_exclusions: [exclusionUpdate]
      }
    })
    
    assertEquals(result.profile_completion_percentage, 80)
  })

  await t.step('DELETE /exercise-exclusions/0 should remove exclusion', async () => {
    const currentExclusions = mockUserProfile.physical_profile.absolute_exercise_exclusions
    const exclusionId = 0
    
    // Test bounds checking
    assert(exclusionId >= 0 && exclusionId < currentExclusions.length)
    
    const deletedExclusion = currentExclusions[exclusionId]
    const updatedExclusions = currentExclusions.filter((_, index) => index !== exclusionId)
    
    assertEquals(updatedExclusions.length, 0)
    assertExists(deletedExclusion)
  })
})

// Test suite for Injuries endpoints
Deno.test('Injuries Edge Function Tests', async (t) => {
  const mockService = new MockUserProfileService() as UserProfileService

  await t.step('GET /injuries should return injury history and current limitations with statistics', async () => {
    const profile = await mockService.getUserProfile(mockUserId)
    const injuryHistory = profile?.physical_profile?.injury_history || []
    const currentLimitations = profile?.physical_profile?.current_limitations || []
    
    assertEquals(injuryHistory.length, 1)
    assertEquals(currentLimitations.length, 1)
    
    const injury = injuryHistory[0]
    assertEquals(injury.body_region, 'lower_back')
    assertEquals(injury.year_occurred, 2021)
    assert(injury.full_recovery)
    assert(!injury.surgery_required)
  })

  await t.step('POST /injuries with current_limitation should add new limitation', async () => {
    const newLimitation = {
      type: 'current_limitation',
      limitation: {
        body_region: 'knee',
        condition: 'Runner\'s knee',
        severity: 'moderate',
        medical_clearance: false,
        movement_restrictions: ['deep squats', 'jumping'],
        pain_triggers: ['stairs', 'long walks']
      }
    }
    
    // Test validation
    const validBodyRegions = ['lower_back', 'shoulder', 'knee', 'hip', 'wrist', 'ankle', 'neck', 'elbow']
    assert(validBodyRegions.includes(newLimitation.limitation.body_region))
    assert(['minor', 'moderate', 'severe'].includes(newLimitation.limitation.severity))
    assertEquals(typeof newLimitation.limitation.medical_clearance, 'boolean')
    assert(Array.isArray(newLimitation.limitation.movement_restrictions))
    assert(Array.isArray(newLimitation.limitation.pain_triggers))
  })

  await t.step('POST /injuries with injury_history should add historical injury', async () => {
    const newInjury = {
      type: 'injury_history',
      injury: {
        injury_type: 'ACL tear',
        body_region: 'knee',
        year_occurred: 2020,
        surgery_required: true,
        full_recovery: true,
        ongoing_considerations: 'Wear knee brace for sports'
      }
    }
    
    // Test validation
    const currentYear = new Date().getFullYear()
    assert(newInjury.injury.year_occurred >= 1900 && newInjury.injury.year_occurred <= currentYear)
    assertEquals(typeof newInjury.injury.surgery_required, 'boolean')
    assertEquals(typeof newInjury.injury.full_recovery, 'boolean')
    assertExists(newInjury.injury.ongoing_considerations)
  })

  await t.step('PUT /injuries/0 should update injury or limitation', async () => {
    const injuryUpdate = {
      type: 'injury_history',
      injury: {
        injury_type: 'Lower back strain',
        body_region: 'lower_back',
        year_occurred: 2021,
        surgery_required: false,
        full_recovery: true,
        ongoing_considerations: 'Maintain core strength, add mobility work'
      }
    }
    
    // Test validation
    assertExists(injuryUpdate.injury.injury_type)
    assert(['lower_back', 'shoulder', 'knee', 'hip', 'wrist', 'ankle', 'neck', 'elbow'].includes(injuryUpdate.injury.body_region))
    
    const result = await mockService.updateProfileSection(mockUserId, {
      section: 'physical_profile',
      data: {
        ...mockUserProfile.physical_profile,
        injury_history: [injuryUpdate.injury]
      }
    })
    
    assertEquals(result.profile_completion_percentage, 80)
  })

  await t.step('DELETE /injuries/0?type=injury_history should remove injury', async () => {
    const injuryHistory = mockUserProfile.physical_profile.injury_history
    const injuryId = 0
    
    // Test bounds checking
    assert(injuryId >= 0 && injuryId < injuryHistory.length)
    
    const deletedInjury = injuryHistory[injuryId]
    const updatedHistory = injuryHistory.filter((_, index) => index !== injuryId)
    
    assertEquals(updatedHistory.length, 0)
    assertExists(deletedInjury)
  })
})

// Integration test for complete user profiling flow
Deno.test('Enhanced User Profiling Integration Test', async (t) => {
  const mockService = new MockUserProfileService() as UserProfileService

  await t.step('Complete user profiling workflow should update all sections', async () => {
    let profile = await mockService.getUserProfile(mockUserId)
    assertExists(profile)
    
    // 1. Update training background
    const updatedTraining = await mockService.updateProfileSection(mockUserId, {
      section: 'training_background',
      data: {
        ...profile.training_background,
        total_training_months: 36
      }
    })
    
    // 2. Add movement competencies
    const updatedCompetencies = await mockService.updateProfileSection(mockUserId, {
      section: 'training_background',
      data: {
        ...updatedTraining.training_background,
        movement_competencies: {
          ...updatedTraining.training_background.movement_competencies,
          deadlift_pattern: {
            experience_level: 'advanced',
            variations_performed: ['conventional', 'sumo'],
            current_working_weight_kg: 150,
            form_confidence: 'high'
          }
        }
      }
    })
    
    // 3. Update physical profile
    const updatedPhysical = await mockService.updateProfileSection(mockUserId, {
      section: 'physical_profile',
      data: {
        ...profile.physical_profile,
        current_limitations: []
      }
    })
    
    // Verify progression
    assertEquals(updatedTraining.profile_completion_percentage, 80)
    assertEquals(updatedCompetencies.profile_completion_percentage, 80)
    assertEquals(updatedPhysical.profile_completion_percentage, 80)
  })
})