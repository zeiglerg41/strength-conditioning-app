// Enhanced User Profile Database Queries for V2
// Based on comprehensive user profiling requirements

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { UserProfile, ProfileUpdateRequest, ProfileCompletionResponse, OnboardingStep } from '../types/user-profile.ts'

export class UserProfileService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get complete user profile with all sections
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        id,
        email,
        profile,
        training_background,
        performance_goals,
        equipment_access,
        lifestyle,
        constraints,
        profile_completion_status,
        profile_completion_percentage,
        onboarding_completed_at,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .single()

    if (error) {
      // Return null if user not found instead of throwing
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  }

  /**
   * Update specific section of user profile
   */
  async updateProfileSection(
    userId: string, 
    request: ProfileUpdateRequest
  ): Promise<UserProfile> {
    const updateData = {
      [request.section]: request.data,
      updated_at: new Date().toISOString()
    }

    console.log('updateProfileSection - userId:', userId)
    console.log('updateProfileSection - section:', request.section)
    console.log('updateProfileSection - data:', JSON.stringify(request.data))

    const { data, error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Database update error:', error)
      throw error
    }

    // TODO: Fix update_profile_completion RPC function in database
    // Commented out until database function is fixed
    // await this.updateProfileCompletion(userId)

    return data
  }

  /**
   * Calculate and update profile completion percentage
   */
  async updateProfileCompletion(userId: string): Promise<number> {
    const { data: completionResult, error } = await this.supabase
      .rpc('update_profile_completion', { user_uuid: userId })

    if (error) throw error
    return completionResult
  }

  /**
   * Get profile completion status and next steps
   */
  async getProfileCompletion(userId: string): Promise<ProfileCompletionResponse> {
    const profile = await this.getUserProfile(userId)
    if (!profile) throw new Error('User profile not found')

    const completion = await this.updateProfileCompletion(userId)
    const nextSteps = this.calculateNextSteps(profile)
    const criticalMissing = this.identifyCriticalMissing(profile)

    return {
      completion_percentage: completion,
      completed_sections: this.getCompletedSections(profile),
      next_steps: nextSteps,
      critical_missing: criticalMissing
    }
  }

  /**
   * Mark specific onboarding step as complete
   */
  async completeOnboardingStep(userId: string, step: string): Promise<void> {
    const profile = await this.getUserProfile(userId)
    if (!profile) throw new Error('User profile not found')

    const completionStatus = { ...profile.profile_completion_status }
    
    // Map steps to completion status fields
    const stepMapping: Record<string, keyof typeof completionStatus> = {
      'basic_info': 'basic_info',
      'training_background': 'training_background', 
      'physical_assessment': 'physical_assessment',
      'goals_events': 'goals_events',
      'equipment_access': 'equipment_access',
      'lifestyle_constraints': 'lifestyle_constraints'
    }

    if (stepMapping[step]) {
      completionStatus[stepMapping[step]] = true

      await this.supabase
        .from('users')
        .update({
          profile_completion_status: completionStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      await this.updateProfileCompletion(userId)
    }
  }

  /**
   * Finalize onboarding process
   */
  async completeOnboarding(userId: string): Promise<UserProfile> {
    // First get the current profile to check completion
    const profile = await this.getUserProfile(userId)
    if (!profile) throw new Error('User profile not found')
    
    const completion = profile.profile_completion_percentage || 0
    
    if (completion < 60) {
      throw new Error(`Profile completion (${completion}%) too low for onboarding completion. Minimum 60% required.`)
    }

    const { data, error } = await this.supabase
      .from('users')
      .update({
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create initial user profile with defaults
   */
  async createInitialProfile(userId: string, email: string): Promise<UserProfile> {
    const defaultProfile = {
      id: userId,
      email: email,
      profile: {},
      training_background: {},
      physical_profile: {
        current_limitations: [],
        absolute_exercise_exclusions: [],
        movement_modifications: [],
        injury_history: []
      },
      performance_goals: {
        secondary_events: [],
        continuous_goals: [],
        training_motivations: [],
        preferred_training_style: 'general_strength',
        goal_flexibility: 'moderate'
      },
      equipment_access: {
        gym_access_network: [],
        home_gym: {
          has_home_gym: false,
          expansion_planned: false
        },
        travel_considerations: {
          travels_frequently: false,
          hotel_gym_experience: 'varies',
          bodyweight_preference: 'acceptable'
        }
      },
      lifestyle: {
        preferred_training_days: [],
        family_obligations: {
          level: 'minimal',
          caregiver_responsibilities: 'none',
          partner_support: 'neutral'
        }
      },
      constraints: {
        absolute_rest_days: [],
        blackout_dates: [],
        exercise_preferences: {
          strongly_prefer: [],
          strongly_avoid: [],
          variety_preference: 'moderate'
        }
      },
      profile_completion_status: {
        basic_info: false,
        training_background: false,
        physical_assessment: false,
        goals_events: false,
        equipment_access: false,
        lifestyle_constraints: false
      },
      profile_completion_percentage: 0
    }

    const { data, error } = await this.supabase
      .from('users')
      .insert(defaultProfile)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Private helper methods
   */
  private getCompletedSections(profile: UserProfile): string[] {
    const completed: string[] = []
    const status = profile.profile_completion_status

    Object.entries(status).forEach(([section, isComplete]) => {
      if (isComplete) completed.push(section)
    })

    return completed
  }

  private calculateNextSteps(profile: UserProfile): OnboardingStep[] {
    const steps: OnboardingStep[] = []
    const status = profile.profile_completion_status

    if (!status.basic_info) {
      steps.push({
        step: 'basic_info',
        title: 'Basic Information',
        description: 'Tell us about yourself - name, age, location',
        completed: false,
        required: true,
        fields: ['name', 'date_of_birth', 'gender', 'height', 'weight', 'address'],
        estimated_minutes: 2
      })
    }

    if (!status.training_background) {
      steps.push({
        step: 'training_background',
        title: 'Training Experience',
        description: 'Your movement competencies and training history',
        completed: false,
        required: true,
        fields: ['total_training_months', 'movement_competencies', 'previous_programs_used'],
        estimated_minutes: 4
      })
    }

    if (!status.goals_events) {
      steps.push({
        step: 'goals_events',
        title: 'Goals & Target Events',
        description: 'What are you training for?',
        completed: false,
        required: true,
        fields: ['primary_target_event', 'training_motivations', 'preferred_training_style'],
        estimated_minutes: 3
      })
    }

    if (!status.equipment_access) {
      steps.push({
        step: 'equipment_access',
        title: 'Equipment & Gym Access',
        description: 'Where and how do you train?',
        completed: false,
        required: true,
        fields: ['primary_gym_id', 'gym_access_network', 'home_gym', 'travel_considerations'],
        estimated_minutes: 3
      })
    }

    if (!status.physical_assessment) {
      steps.push({
        step: 'physical_assessment',
        title: 'Physical Assessment',
        description: 'Any injuries, limitations, or exercise exclusions',
        completed: false,
        required: false,
        fields: ['current_limitations', 'absolute_exercise_exclusions', 'injury_history'],
        estimated_minutes: 3
      })
    }

    if (!status.lifestyle_constraints) {
      steps.push({
        step: 'lifestyle_constraints',
        title: 'Lifestyle & Schedule',
        description: 'Your training schedule and life constraints',
        completed: false,
        required: false,
        fields: ['preferred_training_days', 'sessions_per_week', 'work_schedule_type'],
        estimated_minutes: 2
      })
    }

    return steps.sort((a, b) => {
      if (a.required && !b.required) return -1
      if (!a.required && b.required) return 1
      return 0
    })
  }

  private identifyCriticalMissing(profile: UserProfile): string[] {
    const critical: string[] = []

    if (!profile.profile?.name) {
      critical.push('name')
    }

    if (!profile.training_background?.total_training_months) {
      critical.push('training_experience')
    }

    if (!profile.performance_goals?.primary_target_event && 
        !profile.performance_goals?.continuous_goals?.length) {
      critical.push('goals_or_events')
    }

    if (!profile.equipment_access?.primary_gym_id && 
        !profile.equipment_access?.home_gym?.has_home_gym) {
      critical.push('training_location')
    }

    return critical
  }
}