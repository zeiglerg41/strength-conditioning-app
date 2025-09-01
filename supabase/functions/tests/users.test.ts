// Unit Tests for Enhanced Users Edge Function (V2)
// Tests comprehensive user profiling and onboarding functionality

import { assertEquals, assertExists, assertRejects } from 'https://deno.land/std@0.208.0/testing/asserts.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { UserProfileService } from '../_shared/database/user-queries.ts'
import { UserProfile, ProfileUpdateRequest } from '../_shared/types/user-profile.ts'

// Mock Supabase client for testing
class MockSupabaseClient {
  private mockData: Record<string, any> = {}
  private shouldFail = false

  // Mock the from() method chain
  from(table: string) {
    return {
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: () => this.shouldFail 
            ? { data: null, error: new Error('Mock error') }
            : { data: this.mockData[table]?.[value] || null, error: null }
        }),
        limit: (count: number) => ({
          data: this.shouldFail ? null : Object.values(this.mockData[table] || {}).slice(0, count),
          error: this.shouldFail ? new Error('Mock error') : null
        })
      }),
      insert: (data: any) => ({
        select: () => ({
          single: () => this.shouldFail 
            ? { data: null, error: new Error('Mock error') }
            : { data: data, error: null } // Use the provided data as-is
        })
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: () => this.shouldFail 
              ? { data: null, error: new Error('Mock error') }
              : { data: { ...this.mockData[table]?.[value], ...data }, error: null }
          })
        })
      })
    }
  }

  // Mock the rpc() method for database functions
  rpc(functionName: string, params: any) {
    if (this.shouldFail) {
      return { data: null, error: new Error('Mock error') }
    }
    
    switch (functionName) {
      case 'update_profile_completion':
        return { data: 75, error: null } // Mock 75% completion
      case 'check_deload_eligibility':
        return { 
          data: { 
            can_deload: true, 
            days_since_last_deload: 5, 
            deloads_in_recent_period: 0 
          }, 
          error: null 
        }
      default:
        return { data: null, error: new Error(`Unknown function: ${functionName}`) }
    }
  }

  // Helper methods for testing
  setMockData(table: string, id: string, data: any) {
    if (!this.mockData[table]) this.mockData[table] = {}
    this.mockData[table][id] = data
  }

  setShouldFail(fail: boolean) {
    this.shouldFail = fail
  }

  clearMockData() {
    this.mockData = {}
    this.shouldFail = false
  }
}

// Test data
const mockUserId = 'test-user-123'
const mockUserProfile: UserProfile = {
  id: mockUserId,
  email: 'test@example.com',
  profile: {
    name: 'Test User',
    date_of_birth: '1990-01-01',
    gender: 'male',
    height: 175,
    weight: 70,
    address: {
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      timezone: 'America/New_York'
    }
  },
  training_background: {
    total_training_months: 24,
    strength_training_months: 18,
    consistent_training_periods: [],
    movement_competencies: {
      squat_pattern: {
        experience_level: 'intermediate',
        variations_performed: ['back_squat', 'front_squat'],
        current_working_weight_kg: 100,
        form_confidence: 'high'
      },
      deadlift_pattern: {
        experience_level: 'intermediate',
        variations_performed: ['conventional'],
        current_working_weight_kg: 120,
        form_confidence: 'moderate'
      },
      press_patterns: {
        overhead_press: {
          experience_level: 'novice',
          variations_performed: ['military_press'],
          current_working_weight_kg: 50,
          form_confidence: 'moderate'
        },
        bench_press: {
          experience_level: 'intermediate',
          variations_performed: ['flat_bench'],
          current_working_weight_kg: 80,
          form_confidence: 'high'
        }
      },
      pull_patterns: {
        pullups_chinups: {
          experience_level: 'intermediate',
          variations_performed: ['pullup'],
          max_consecutive_reps: 8,
          form_confidence: 'high'
        },
        rows: {
          experience_level: 'intermediate',
          variations_performed: ['barbell_row'],
          current_working_weight_kg: 70,
          form_confidence: 'moderate'
        }
      },
      hinge_patterns: {
        hip_hinge: {
          experience_level: 'intermediate',
          variations_performed: ['romanian_deadlift'],
          form_confidence: 'high'
        },
        single_leg: {
          experience_level: 'novice',
          variations_performed: ['lunge'],
          form_confidence: 'low'
        }
      }
    },
    periodization_experience: true,
    previous_programs_used: ['Starting Strength', '5/3/1'],
    longest_consistent_program_months: 6,
    program_adherence_typical: 'high'
  },
  physical_profile: {
    current_limitations: [],
    absolute_exercise_exclusions: [],
    movement_modifications: [],
    injury_history: []
  },
  performance_goals: {
    primary_target_event: {
      event_name: 'Local Powerlifting Meet',
      target_date: '2024-12-01',
      event_type: 'powerlifting_meet',
      importance_level: 'high',
      specific_requirements: {
        competition_lifts: [
          {
            lift_name: 'Squat',
            current_max_kg: 120,
            target_max_kg: 140,
            priority: 'high'
          },
          {
            lift_name: 'Bench Press', 
            current_max_kg: 90,
            target_max_kg: 100,
            priority: 'medium'
          },
          {
            lift_name: 'Deadlift',
            current_max_kg: 140,
            target_max_kg: 160,
            priority: 'high'
          }
        ]
      },
      preparation_status: 'early_prep'
    },
    secondary_events: [],
    continuous_goals: [],
    training_motivations: ['competition', 'performance'],
    preferred_training_style: 'powerlifting',
    goal_flexibility: 'moderate'
  },
  equipment_access: {
    gym_access_network: [
      {
        gym_id: 'gym-123',
        gym_name: 'Test Gym',
        access_type: 'primary',
        frequency: 'daily',
        priority_rank: 1,
        cost: 'membership'
      }
    ],
    home_gym: {
      has_home_gym: false,
      expansion_planned: false
    },
    travel_considerations: {
      travels_frequently: false,
      hotel_gym_experience: 'good',
      bodyweight_preference: 'acceptable'
    }
  },
  lifestyle: {
    employment_status: 'full_time',
    work_schedule_type: 'standard',
    work_stress_level: 'moderate',
    commute_time_minutes: 30,
    commute_method: 'car',
    preferred_training_days: ['monday', 'wednesday', 'friday'],
    sessions_per_week: 3,
    session_duration_preference: 60,
    max_session_duration: 90,
    time_of_day_preference: 'evening',
    weekend_availability: 'full',
    family_obligations: {
      level: 'minimal',
      caregiver_responsibilities: 'none',
      partner_support: 'supportive'
    },
    sleep_patterns: {
      typical_bedtime: '23:00',
      typical_wake_time: '07:00',
      sleep_quality: 'good',
      sleep_duration_hours: 8,
      sleep_consistency: 'consistent'
    },
    stress_management: {
      overall_stress_level: 'moderate',
      stress_sources: ['work'],
      coping_strategies: ['exercise'],
      stress_impact_on_training: 'minimal'
    },
    nutrition_habits: {
      consistency: 'good',
      cooking_frequency: 'weekly',
      dietary_restrictions: [],
      supplement_use: 'occasional',
      hydration_habits: 'good'
    }
  },
  constraints: {
    weekly_training_days: 3,
    absolute_rest_days: ['sunday'],
    blackout_dates: [],
    fatigue_sensitivity: 'moderate',
    recovery_speed: 'average',
    injury_risk_tolerance: 'moderate',
    exercise_preferences: {
      strongly_prefer: ['compound_lifts'],
      strongly_avoid: ['machine_isolation'],
      variety_preference: 'moderate'
    },
    training_environment_preferences: {
      music: 'preferred',
      crowd_tolerance: 'indifferent',
      cleanliness_importance: 'important'
    }
  },
  profile_completion_status: {
    basic_info: true,
    training_background: true,
    physical_assessment: false,
    goals_events: true,
    equipment_access: true,
    lifestyle_constraints: true
  },
  profile_completion_percentage: 75,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

// Test suite
Deno.test('UserProfileService Tests', async (t) => {
  const mockClient = new MockSupabaseClient()
  const userService = new UserProfileService(mockClient as any)

  await t.step('should get user profile successfully', async () => {
    mockClient.setMockData('users', mockUserId, mockUserProfile)
    
    const profile = await userService.getUserProfile(mockUserId)
    
    assertExists(profile)
    assertEquals(profile.id, mockUserId)
    assertEquals(profile.email, 'test@example.com')
    assertEquals(profile.profile.name, 'Test User')
  })

  await t.step('should return null for non-existent user', async () => {
    mockClient.clearMockData()
    
    const profile = await userService.getUserProfile('non-existent-user')
    
    assertEquals(profile, null)
  })

  await t.step('should update profile section successfully', async () => {
    mockClient.setMockData('users', mockUserId, mockUserProfile)
    
    const updateRequest: ProfileUpdateRequest = {
      section: 'profile',
      data: {
        name: 'Updated Test User',
        height: 180
      }
    }
    
    const updatedProfile = await userService.updateProfileSection(mockUserId, updateRequest)
    
    assertExists(updatedProfile)
    // Note: In real implementation, this would actually update the data
  })

  await t.step('should calculate profile completion correctly', async () => {
    mockClient.setMockData('users', mockUserId, mockUserProfile)
    
    const completion = await userService.updateProfileCompletion(mockUserId)
    
    assertEquals(completion, 75)
  })

  await t.step('should get profile completion with next steps', async () => {
    mockClient.setMockData('users', mockUserId, mockUserProfile)
    
    const completionResponse = await userService.getProfileCompletion(mockUserId)
    
    assertExists(completionResponse)
    assertEquals(completionResponse.completion_percentage, 75)
    assertExists(completionResponse.next_steps)
    assertExists(completionResponse.critical_missing)
    
    // Should have physical_assessment as next step since it's false in mock data
    const hasPhysicalAssessment = completionResponse.next_steps.some(
      step => step.step === 'physical_assessment'
    )
    assertEquals(hasPhysicalAssessment, true)
  })

  await t.step('should complete onboarding step', async () => {
    mockClient.setMockData('users', mockUserId, mockUserProfile)
    
    await userService.completeOnboardingStep(mockUserId, 'physical_assessment')
    
    // Should not throw an error
  })

  await t.step('should complete onboarding when profile is sufficient', async () => {
    const completedProfile = { ...mockUserProfile, profile_completion_percentage: 80 }
    mockClient.setMockData('users', mockUserId, completedProfile)
    
    const result = await userService.completeOnboarding(mockUserId)
    
    assertExists(result)
  })

  await t.step('should reject onboarding completion if profile incomplete', async () => {
    const incompleteProfile = { ...mockUserProfile, profile_completion_percentage: 40 }
    mockClient.setMockData('users', mockUserId, incompleteProfile)
    
    await assertRejects(
      () => userService.completeOnboarding(mockUserId),
      Error,
      'Profile completion (40%) too low'
    )
  })

  await t.step('should handle database errors gracefully', async () => {
    mockClient.setShouldFail(true)
    
    await assertRejects(
      () => userService.getUserProfile(mockUserId),
      Error,
      'Mock error'
    )
  })

  await t.step('should create initial profile with defaults', async () => {
    mockClient.clearMockData() // Clear any previous data
    mockClient.setShouldFail(false) // Ensure we're not in fail mode
    const email = 'newuser@example.com'
    
    const profile = await userService.createInitialProfile(mockUserId, email)
    
    assertExists(profile)
    assertEquals(profile.id, mockUserId)
    assertEquals(profile.email, email)
  })
})

// Integration test helper
export async function createTestUserProfile(): Promise<UserProfile> {
  return { ...mockUserProfile, id: crypto.randomUUID() }
}

// Test data helpers
export { mockUserProfile, mockUserId }