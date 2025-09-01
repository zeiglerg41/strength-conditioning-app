// Exercise Exclusions Edge Function - V2 Enhanced User Profiling
// Handles "will never do" exercise list with full CRUD operations

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { UserProfileService } from '../_shared/database/user-queries.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

const VALID_EXCLUSION_TYPES = ['movement_pattern', 'specific_exercise', 'equipment_type']
const VALID_EXCLUSION_REASONS = ['injury_history', 'current_pain', 'medical_restriction', 'personal_preference']

interface ExerciseExclusion {
  exercise_name: string
  exclusion_type: 'movement_pattern' | 'specific_exercise' | 'equipment_type'
  reason: 'injury_history' | 'current_pain' | 'medical_restriction' | 'personal_preference'
  alternative_preferred?: string
  notes?: string
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    })

    const userService = new UserProfileService(supabase)
    const url = new URL(req.url)
    const method = req.method
    const pathSegments = url.pathname.split('/').filter(Boolean)
    
    // Extract user ID from auth
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route handlers
    switch (method) {
      case 'GET':
        return await handleGet(userService, userId)
      case 'POST':
        return await handlePost(userService, userId, req)
      case 'PUT':
        if (pathSegments.length >= 2) {
          const exclusionId = parseInt(pathSegments[1])
          return await handlePut(userService, userId, exclusionId, req)
        }
        return new Response(
          JSON.stringify({ error: 'Exclusion ID required for update' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      case 'DELETE':
        if (pathSegments.length >= 2) {
          const exclusionId = parseInt(pathSegments[1])
          return await handleDelete(userService, userId, exclusionId)
        }
        return new Response(
          JSON.stringify({ error: 'Exclusion ID required for deletion' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }), 
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Exercise exclusions function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleGet(service: UserProfileService, userId: string) {
  const profile = await service.getUserProfile(userId)
  
  if (!profile) {
    return new Response(
      JSON.stringify({ error: 'User profile not found' }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  const exclusions = profile.physical_profile?.absolute_exercise_exclusions || []
  
  // Add index to each exclusion for reference in updates/deletes
  const indexedExclusions = exclusions.map((exclusion, index) => ({
    id: index,
    ...exclusion
  }))
  
  // Group by exclusion type for easier frontend handling
  const groupedExclusions = {
    movement_pattern: indexedExclusions.filter(e => e.exclusion_type === 'movement_pattern'),
    specific_exercise: indexedExclusions.filter(e => e.exclusion_type === 'specific_exercise'),
    equipment_type: indexedExclusions.filter(e => e.exclusion_type === 'equipment_type')
  }
  
  return new Response(JSON.stringify({
    exclusions: indexedExclusions,
    grouped_exclusions: groupedExclusions,
    summary: {
      total_exclusions: exclusions.length,
      by_type: {
        movement_patterns: groupedExclusions.movement_pattern.length,
        specific_exercises: groupedExclusions.specific_exercise.length,
        equipment_types: groupedExclusions.equipment_type.length
      },
      by_reason: {
        injury_history: exclusions.filter(e => e.reason === 'injury_history').length,
        current_pain: exclusions.filter(e => e.reason === 'current_pain').length,
        medical_restriction: exclusions.filter(e => e.reason === 'medical_restriction').length,
        personal_preference: exclusions.filter(e => e.reason === 'personal_preference').length
      }
    },
    valid_options: {
      exclusion_types: VALID_EXCLUSION_TYPES,
      exclusion_reasons: VALID_EXCLUSION_REASONS
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handlePost(service: UserProfileService, userId: string, req: Request) {
  const newExclusion: ExerciseExclusion = await req.json()
  
  // Validate exclusion data
  const validationError = validateExclusion(newExclusion)
  if (validationError) {
    return new Response(
      JSON.stringify({ error: validationError }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Get current profile
  const profile = await service.getUserProfile(userId)
  if (!profile) {
    return new Response(
      JSON.stringify({ error: 'User profile not found' }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  const currentExclusions = profile.physical_profile?.absolute_exercise_exclusions || []
  
  // Check for duplicates
  const isDuplicate = currentExclusions.some(existing => 
    existing.exercise_name.toLowerCase() === newExclusion.exercise_name.toLowerCase() &&
    existing.exclusion_type === newExclusion.exclusion_type
  )
  
  if (isDuplicate) {
    return new Response(
      JSON.stringify({ error: 'This exercise exclusion already exists' }), 
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Add the new exclusion
  const updatedExclusions = [...currentExclusions, newExclusion]
  
  const updatedProfile = await service.updateProfileSection(userId, {
    section: 'physical_profile',
    data: {
      ...profile.physical_profile,
      absolute_exercise_exclusions: updatedExclusions
    }
  })
  
  return new Response(JSON.stringify({
    exclusion: {
      id: updatedExclusions.length - 1, // New exclusion is at the end
      ...newExclusion
    },
    total_exclusions: updatedExclusions.length,
    updated_completion_percentage: updatedProfile.profile_completion_percentage,
    message: 'Exercise exclusion added successfully'
  }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handlePut(service: UserProfileService, userId: string, exclusionId: number, req: Request) {
  const exclusionUpdate: ExerciseExclusion = await req.json()
  
  // Validate exclusion data
  const validationError = validateExclusion(exclusionUpdate)
  if (validationError) {
    return new Response(
      JSON.stringify({ error: validationError }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  if (isNaN(exclusionId)) {
    return new Response(
      JSON.stringify({ error: 'Invalid exclusion ID' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Get current profile
  const profile = await service.getUserProfile(userId)
  if (!profile) {
    return new Response(
      JSON.stringify({ error: 'User profile not found' }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  const currentExclusions = profile.physical_profile?.absolute_exercise_exclusions || []
  
  if (exclusionId < 0 || exclusionId >= currentExclusions.length) {
    return new Response(
      JSON.stringify({ error: 'Exclusion not found' }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Update the exclusion
  const updatedExclusions = [...currentExclusions]
  updatedExclusions[exclusionId] = exclusionUpdate
  
  const updatedProfile = await service.updateProfileSection(userId, {
    section: 'physical_profile',
    data: {
      ...profile.physical_profile,
      absolute_exercise_exclusions: updatedExclusions
    }
  })
  
  return new Response(JSON.stringify({
    exclusion: {
      id: exclusionId,
      ...exclusionUpdate
    },
    updated_completion_percentage: updatedProfile.profile_completion_percentage,
    message: 'Exercise exclusion updated successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleDelete(service: UserProfileService, userId: string, exclusionId: number) {
  if (isNaN(exclusionId)) {
    return new Response(
      JSON.stringify({ error: 'Invalid exclusion ID' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Get current profile
  const profile = await service.getUserProfile(userId)
  if (!profile) {
    return new Response(
      JSON.stringify({ error: 'User profile not found' }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  const currentExclusions = profile.physical_profile?.absolute_exercise_exclusions || []
  
  if (exclusionId < 0 || exclusionId >= currentExclusions.length) {
    return new Response(
      JSON.stringify({ error: 'Exclusion not found' }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Remove the exclusion
  const deletedExclusion = currentExclusions[exclusionId]
  const updatedExclusions = currentExclusions.filter((_, index) => index !== exclusionId)
  
  const updatedProfile = await service.updateProfileSection(userId, {
    section: 'physical_profile',
    data: {
      ...profile.physical_profile,
      absolute_exercise_exclusions: updatedExclusions
    }
  })
  
  return new Response(JSON.stringify({
    deleted_exclusion: {
      id: exclusionId,
      ...deletedExclusion
    },
    remaining_exclusions: updatedExclusions.length,
    updated_completion_percentage: updatedProfile.profile_completion_percentage,
    message: 'Exercise exclusion removed successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

function validateExclusion(exclusion: ExerciseExclusion): string | null {
  if (!exclusion.exercise_name || typeof exclusion.exercise_name !== 'string' || exclusion.exercise_name.trim() === '') {
    return 'exercise_name is required and must be a non-empty string'
  }
  
  if (!VALID_EXCLUSION_TYPES.includes(exclusion.exclusion_type)) {
    return `Invalid exclusion_type. Valid types: ${VALID_EXCLUSION_TYPES.join(', ')}`
  }
  
  if (!VALID_EXCLUSION_REASONS.includes(exclusion.reason)) {
    return `Invalid reason. Valid reasons: ${VALID_EXCLUSION_REASONS.join(', ')}`
  }
  
  if (exclusion.alternative_preferred !== undefined && typeof exclusion.alternative_preferred !== 'string') {
    return 'alternative_preferred must be a string if provided'
  }
  
  if (exclusion.notes !== undefined && typeof exclusion.notes !== 'string') {
    return 'notes must be a string if provided'
  }
  
  return null
}