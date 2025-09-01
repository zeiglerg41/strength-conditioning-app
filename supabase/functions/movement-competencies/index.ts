// Movement Competencies Edge Function - V2 Enhanced User Profiling
// Handles movement pattern skill assessment and tracking

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { UserProfileService } from '../_shared/database/user-queries.ts'
import { MovementCompetency } from '../_shared/types/user-profile.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

const VALID_MOVEMENT_PATTERNS = [
  'squat_pattern', 'deadlift_pattern', 'overhead_press', 'bench_press', 
  'pullups_chinups', 'rows', 'hip_hinge', 'single_leg'
]

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
        if (pathSegments.length === 2 && VALID_MOVEMENT_PATTERNS.includes(pathSegments[1])) {
          return await handleGetPattern(userService, userId, pathSegments[1])
        }
        return await handleGet(userService, userId)
      case 'PUT':
        if (pathSegments.length === 2 && VALID_MOVEMENT_PATTERNS.includes(pathSegments[1])) {
          return await handlePutPattern(userService, userId, pathSegments[1], req)
        }
        return new Response(
          JSON.stringify({ error: 'Invalid movement pattern specified' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      case 'POST':
        if (url.pathname.endsWith('/assess')) {
          return await handleAssess(userService, userId, req)
        }
        return new Response(
          JSON.stringify({ error: 'Invalid POST endpoint' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }), 
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Movement competencies function error:', error)
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
  
  const movementCompetencies = profile.training_background?.movement_competencies || {}
  
  return new Response(JSON.stringify({
    movement_competencies: movementCompetencies,
    assessment_progress: {
      patterns_assessed: Object.keys(movementCompetencies).length,
      total_patterns: VALID_MOVEMENT_PATTERNS.length,
      completion_percentage: Math.round((Object.keys(movementCompetencies).length / VALID_MOVEMENT_PATTERNS.length) * 100)
    },
    available_patterns: VALID_MOVEMENT_PATTERNS
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleGetPattern(service: UserProfileService, userId: string, pattern: string) {
  const profile = await service.getUserProfile(userId)
  
  if (!profile) {
    return new Response(
      JSON.stringify({ error: 'User profile not found' }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  const competency = profile.training_background?.movement_competencies?.[pattern] || null
  
  if (!competency) {
    return new Response(
      JSON.stringify({ error: `No assessment found for ${pattern}` }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  return new Response(JSON.stringify({
    pattern,
    competency,
    last_updated: profile.updated_at
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handlePutPattern(service: UserProfileService, userId: string, pattern: string, req: Request) {
  const competencyUpdate: MovementCompetency = await req.json()
  
  // Validate competency data
  const validExperienceLevels = ['untrained', 'novice', 'intermediate', 'advanced']
  const validConfidenceLevels = ['low', 'moderate', 'high']
  
  if (!validExperienceLevels.includes(competencyUpdate.experience_level)) {
    return new Response(
      JSON.stringify({ error: 'Invalid experience level. Must be: untrained, novice, intermediate, or advanced' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  if (!validConfidenceLevels.includes(competencyUpdate.form_confidence)) {
    return new Response(
      JSON.stringify({ error: 'Invalid form confidence. Must be: low, moderate, or high' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  if (!Array.isArray(competencyUpdate.variations_performed)) {
    return new Response(
      JSON.stringify({ error: 'variations_performed must be an array of strings' }), 
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
  
  // Update the specific movement competency
  const currentCompetencies = profile.training_background?.movement_competencies || {}
  const updatedCompetencies = {
    ...currentCompetencies,
    [pattern]: competencyUpdate
  }
  
  const updatedProfile = await service.updateProfileSection(userId, {
    section: 'training_background',
    data: {
      ...profile.training_background,
      movement_competencies: updatedCompetencies
    }
  })
  
  return new Response(JSON.stringify({
    pattern,
    competency: competencyUpdate,
    updated_completion_percentage: updatedProfile.profile_completion_percentage,
    message: `${pattern} competency updated successfully`
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleAssess(service: UserProfileService, userId: string, req: Request) {
  const assessmentData = await req.json()
  
  // Validate assessment wizard data
  if (!assessmentData.assessments || !Array.isArray(assessmentData.assessments)) {
    return new Response(
      JSON.stringify({ error: 'assessments array is required' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Validate each assessment
  for (const assessment of assessmentData.assessments) {
    if (!VALID_MOVEMENT_PATTERNS.includes(assessment.pattern)) {
      return new Response(
        JSON.stringify({ error: `Invalid movement pattern: ${assessment.pattern}` }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }
  
  // Get current profile
  const profile = await service.getUserProfile(userId)
  if (!profile) {
    return new Response(
      JSON.stringify({ error: 'User profile not found' }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Build updated competencies from assessments
  const currentCompetencies = profile.training_background?.movement_competencies || {}
  const updatedCompetencies = { ...currentCompetencies }
  
  for (const assessment of assessmentData.assessments) {
    updatedCompetencies[assessment.pattern] = {
      experience_level: assessment.competency.experience_level,
      variations_performed: assessment.competency.variations_performed || [],
      current_working_weight_kg: assessment.competency.current_working_weight_kg || null,
      form_confidence: assessment.competency.form_confidence
    }
  }
  
  const updatedProfile = await service.updateProfileSection(userId, {
    section: 'training_background',
    data: {
      ...profile.training_background,
      movement_competencies: updatedCompetencies
    }
  })
  
  return new Response(JSON.stringify({
    assessments_completed: assessmentData.assessments.length,
    movement_competencies: updatedCompetencies,
    updated_completion_percentage: updatedProfile.profile_completion_percentage,
    message: 'Movement assessment completed successfully'
  }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}