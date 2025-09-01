// Physical Profile Edge Function - V2 Enhanced User Profiling
// Handles injuries, limitations, and physical assessment data

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { UserProfileService } from '../_shared/database/user-queries.ts'
import { PhysicalProfile } from '../_shared/types/user-profile.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

const VALID_BODY_REGIONS = [
  'lower_back', 'shoulder', 'knee', 'hip', 'wrist', 'ankle', 'neck', 'elbow'
]

const VALID_SEVERITY_LEVELS = ['minor', 'moderate', 'severe']

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
    const method = req.method
    
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
      case 'PUT':
        return await handlePut(userService, userId, req)
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }), 
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Physical profile function error:', error)
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
  
  const physicalProfile = profile.physical_profile || {
    current_limitations: [],
    absolute_exercise_exclusions: [],
    movement_modifications: [],
    injury_history: []
  }
  
  // Calculate assessment summary
  const assessmentSummary = {
    current_limitations_count: physicalProfile.current_limitations?.length || 0,
    exercise_exclusions_count: physicalProfile.absolute_exercise_exclusions?.length || 0,
    movement_modifications_count: physicalProfile.movement_modifications?.length || 0,
    injury_history_count: physicalProfile.injury_history?.length || 0,
    has_active_limitations: (physicalProfile.current_limitations?.length || 0) > 0,
    has_medical_clearance: physicalProfile.current_limitations?.every(l => l.medical_clearance) || true
  }
  
  return new Response(JSON.stringify({
    physical_profile: physicalProfile,
    assessment_summary: assessmentSummary,
    valid_options: {
      body_regions: VALID_BODY_REGIONS,
      severity_levels: VALID_SEVERITY_LEVELS
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handlePut(service: UserProfileService, userId: string, req: Request) {
  const physicalProfileUpdate: PhysicalProfile = await req.json()
  
  // Validate current limitations
  if (physicalProfileUpdate.current_limitations) {
    for (const limitation of physicalProfileUpdate.current_limitations) {
      if (!VALID_BODY_REGIONS.includes(limitation.body_region)) {
        return new Response(
          JSON.stringify({ 
            error: `Invalid body region: ${limitation.body_region}. Valid regions: ${VALID_BODY_REGIONS.join(', ')}` 
          }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (!VALID_SEVERITY_LEVELS.includes(limitation.severity)) {
        return new Response(
          JSON.stringify({ 
            error: `Invalid severity level: ${limitation.severity}. Valid levels: ${VALID_SEVERITY_LEVELS.join(', ')}` 
          }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (typeof limitation.medical_clearance !== 'boolean') {
        return new Response(
          JSON.stringify({ error: 'medical_clearance must be a boolean value' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (!Array.isArray(limitation.movement_restrictions)) {
        return new Response(
          JSON.stringify({ error: 'movement_restrictions must be an array' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (!Array.isArray(limitation.pain_triggers)) {
        return new Response(
          JSON.stringify({ error: 'pain_triggers must be an array' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
  }
  
  // Validate exercise exclusions
  if (physicalProfileUpdate.absolute_exercise_exclusions) {
    const validExclusionTypes = ['movement_pattern', 'specific_exercise', 'equipment_type']
    const validReasons = ['injury_history', 'current_pain', 'medical_restriction', 'personal_preference']
    
    for (const exclusion of physicalProfileUpdate.absolute_exercise_exclusions) {
      if (!exclusion.exercise_name || typeof exclusion.exercise_name !== 'string') {
        return new Response(
          JSON.stringify({ error: 'exercise_name is required for each exclusion' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (!validExclusionTypes.includes(exclusion.exclusion_type)) {
        return new Response(
          JSON.stringify({ 
            error: `Invalid exclusion type: ${exclusion.exclusion_type}. Valid types: ${validExclusionTypes.join(', ')}` 
          }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (!validReasons.includes(exclusion.reason)) {
        return new Response(
          JSON.stringify({ 
            error: `Invalid exclusion reason: ${exclusion.reason}. Valid reasons: ${validReasons.join(', ')}` 
          }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
  }
  
  // Validate movement modifications
  if (physicalProfileUpdate.movement_modifications) {
    const validModificationTypes = ['range_of_motion', 'load_limitation', 'tempo_restriction']
    
    for (const modification of physicalProfileUpdate.movement_modifications) {
      if (!modification.movement_pattern || typeof modification.movement_pattern !== 'string') {
        return new Response(
          JSON.stringify({ error: 'movement_pattern is required for each modification' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (!validModificationTypes.includes(modification.modification_type)) {
        return new Response(
          JSON.stringify({ 
            error: `Invalid modification type: ${modification.modification_type}. Valid types: ${validModificationTypes.join(', ')}` 
          }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (!modification.details || typeof modification.details !== 'string') {
        return new Response(
          JSON.stringify({ error: 'details are required for each modification' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
  }
  
  // Validate injury history
  if (physicalProfileUpdate.injury_history) {
    for (const injury of physicalProfileUpdate.injury_history) {
      if (!injury.injury_type || typeof injury.injury_type !== 'string') {
        return new Response(
          JSON.stringify({ error: 'injury_type is required for each injury' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (!VALID_BODY_REGIONS.includes(injury.body_region)) {
        return new Response(
          JSON.stringify({ 
            error: `Invalid body region in injury history: ${injury.body_region}. Valid regions: ${VALID_BODY_REGIONS.join(', ')}` 
          }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (typeof injury.year_occurred !== 'number' || injury.year_occurred < 1900 || injury.year_occurred > new Date().getFullYear()) {
        return new Response(
          JSON.stringify({ error: 'Valid year_occurred is required for each injury' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (typeof injury.surgery_required !== 'boolean') {
        return new Response(
          JSON.stringify({ error: 'surgery_required must be a boolean value' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (typeof injury.full_recovery !== 'boolean') {
        return new Response(
          JSON.stringify({ error: 'full_recovery must be a boolean value' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
  }
  
  // Update the profile section
  const updatedProfile = await service.updateProfileSection(userId, {
    section: 'physical_profile',
    data: physicalProfileUpdate
  })
  
  return new Response(JSON.stringify({
    physical_profile: updatedProfile.physical_profile,
    updated_completion_percentage: updatedProfile.profile_completion_percentage,
    assessment_summary: {
      current_limitations_count: physicalProfileUpdate.current_limitations?.length || 0,
      exercise_exclusions_count: physicalProfileUpdate.absolute_exercise_exclusions?.length || 0,
      movement_modifications_count: physicalProfileUpdate.movement_modifications?.length || 0,
      injury_history_count: physicalProfileUpdate.injury_history?.length || 0
    },
    message: 'Physical profile updated successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}