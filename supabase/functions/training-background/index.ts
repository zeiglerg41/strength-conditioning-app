// Training Background Edge Function - V2 Enhanced User Profiling
// Handles detailed training history and experience tracking

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { UserProfileService } from '../_shared/database/user-queries.ts'
import { TrainingBackground } from '../_shared/types/user-profile.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

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
    console.error('Training background function error:', error)
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
  
  // Extract just the training background section
  const trainingBackground = profile.training_background || {
    total_training_months: 0,
    strength_training_months: 0,
    consistent_training_periods: [],
    movement_competencies: {},
    periodization_experience: false,
    previous_programs_used: [],
    longest_consistent_program_months: 0
  }
  
  return new Response(JSON.stringify({
    training_background: trainingBackground,
    completion_status: {
      has_basic_experience: trainingBackground.total_training_months > 0,
      has_strength_experience: trainingBackground.strength_training_months > 0,
      has_movement_competencies: Object.keys(trainingBackground.movement_competencies || {}).length > 0,
      has_program_history: trainingBackground.previous_programs_used?.length > 0
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handlePut(service: UserProfileService, userId: string, req: Request) {
  const trainingBackgroundUpdate: TrainingBackground = await req.json()
  
  // Validate required fields
  if (typeof trainingBackgroundUpdate.total_training_months !== 'number' || 
      trainingBackgroundUpdate.total_training_months < 0) {
    return new Response(
      JSON.stringify({ error: 'Valid total_training_months is required' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  if (typeof trainingBackgroundUpdate.strength_training_months !== 'number' || 
      trainingBackgroundUpdate.strength_training_months < 0) {
    return new Response(
      JSON.stringify({ error: 'Valid strength_training_months is required' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Validate strength training months doesn't exceed total
  if (trainingBackgroundUpdate.strength_training_months > trainingBackgroundUpdate.total_training_months) {
    return new Response(
      JSON.stringify({ error: 'Strength training months cannot exceed total training months' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Update the profile section
  const updatedProfile = await service.updateProfileSection(userId, {
    section: 'training_background',
    data: trainingBackgroundUpdate
  })
  
  return new Response(JSON.stringify({
    training_background: updatedProfile.training_background,
    updated_completion_percentage: updatedProfile.profile_completion_percentage,
    message: 'Training background updated successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}