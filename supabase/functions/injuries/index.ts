// Injuries Edge Function - V2 Enhanced User Profiling
// Handles injury logging, status updates, and resolution tracking

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { UserProfileService } from '../_shared/database/user-queries.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

const VALID_BODY_REGIONS = [
  'lower_back', 'shoulder', 'knee', 'hip', 'wrist', 'ankle', 'neck', 'elbow'
]

interface InjuryHistoryItem {
  injury_type: string
  body_region: string
  year_occurred: number
  surgery_required: boolean
  full_recovery: boolean
  ongoing_considerations: string
}

interface CurrentLimitation {
  body_region: string
  condition: string
  severity: 'minor' | 'moderate' | 'severe'
  medical_clearance: boolean
  movement_restrictions: string[]
  pain_triggers: string[]
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
          const injuryId = parseInt(pathSegments[1])
          return await handlePut(userService, userId, injuryId, req)
        }
        return new Response(
          JSON.stringify({ error: 'Injury ID required for update' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      case 'DELETE':
        if (pathSegments.length >= 2) {
          const injuryId = parseInt(pathSegments[1])
          return await handleDelete(userService, userId, injuryId, req)
        }
        return new Response(
          JSON.stringify({ error: 'Injury ID required for deletion' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }), 
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Injuries function error:', error)
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
  
  const injuryHistory = profile.physical_profile?.injury_history || []
  const currentLimitations = profile.physical_profile?.current_limitations || []
  
  // Add index to each injury for reference in updates/deletes
  const indexedInjuries = injuryHistory.map((injury, index) => ({
    id: index,
    ...injury
  }))
  
  const indexedLimitations = currentLimitations.map((limitation, index) => ({
    id: index,
    ...limitation
  }))
  
  // Calculate injury statistics
  const currentYear = new Date().getFullYear()
  const recentInjuries = injuryHistory.filter(injury => currentYear - injury.year_occurred <= 2)
  const unresolvedInjuries = injuryHistory.filter(injury => !injury.full_recovery)
  const surgicalInjuries = injuryHistory.filter(injury => injury.surgery_required)
  
  return new Response(JSON.stringify({
    injury_history: indexedInjuries,
    current_limitations: indexedLimitations,
    statistics: {
      total_injuries: injuryHistory.length,
      recent_injuries: recentInjuries.length,
      unresolved_injuries: unresolvedInjuries.length,
      surgical_injuries: surgicalInjuries.length,
      current_limitations: currentLimitations.length,
      areas_with_restrictions: [...new Set(currentLimitations.map(l => l.body_region))].length
    },
    body_regions_affected: {
      historical: [...new Set(injuryHistory.map(i => i.body_region))],
      current: [...new Set(currentLimitations.map(l => l.body_region))]
    },
    valid_options: {
      body_regions: VALID_BODY_REGIONS,
      severity_levels: ['minor', 'moderate', 'severe']
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handlePost(service: UserProfileService, userId: string, req: Request) {
  const requestData = await req.json()
  
  // Determine if this is a new injury or current limitation
  if (requestData.type === 'current_limitation') {
    return await addCurrentLimitation(service, userId, requestData.limitation)
  } else if (requestData.type === 'injury_history') {
    return await addInjuryHistory(service, userId, requestData.injury)
  } else {
    return new Response(
      JSON.stringify({ error: 'Type must be either "current_limitation" or "injury_history"' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function addCurrentLimitation(service: UserProfileService, userId: string, limitation: CurrentLimitation) {
  // Validate limitation data
  const validationError = validateCurrentLimitation(limitation)
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
  
  const currentLimitations = profile.physical_profile?.current_limitations || []
  
  // Check for duplicates
  const isDuplicate = currentLimitations.some(existing => 
    existing.body_region === limitation.body_region &&
    existing.condition.toLowerCase() === limitation.condition.toLowerCase()
  )
  
  if (isDuplicate) {
    return new Response(
      JSON.stringify({ error: 'A limitation for this body region and condition already exists' }), 
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Add the new limitation
  const updatedLimitations = [...currentLimitations, limitation]
  
  const updatedProfile = await service.updateProfileSection(userId, {
    section: 'physical_profile',
    data: {
      ...profile.physical_profile,
      current_limitations: updatedLimitations
    }
  })
  
  return new Response(JSON.stringify({
    limitation: {
      id: updatedLimitations.length - 1,
      ...limitation
    },
    total_limitations: updatedLimitations.length,
    updated_completion_percentage: updatedProfile.profile_completion_percentage,
    message: 'Current limitation added successfully'
  }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function addInjuryHistory(service: UserProfileService, userId: string, injury: InjuryHistoryItem) {
  // Validate injury data
  const validationError = validateInjuryHistory(injury)
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
  
  const injuryHistory = profile.physical_profile?.injury_history || []
  
  // Add the new injury
  const updatedHistory = [...injuryHistory, injury]
  
  const updatedProfile = await service.updateProfileSection(userId, {
    section: 'physical_profile',
    data: {
      ...profile.physical_profile,
      injury_history: updatedHistory
    }
  })
  
  return new Response(JSON.stringify({
    injury: {
      id: updatedHistory.length - 1,
      ...injury
    },
    total_injuries: updatedHistory.length,
    updated_completion_percentage: updatedProfile.profile_completion_percentage,
    message: 'Injury history added successfully'
  }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handlePut(service: UserProfileService, userId: string, injuryId: number, req: Request) {
  const updateData = await req.json()
  
  if (isNaN(injuryId)) {
    return new Response(
      JSON.stringify({ error: 'Invalid injury ID' }), 
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
  
  if (updateData.type === 'current_limitation') {
    return await updateCurrentLimitation(service, userId, profile, injuryId, updateData.limitation)
  } else if (updateData.type === 'injury_history') {
    return await updateInjuryHistory(service, userId, profile, injuryId, updateData.injury)
  } else {
    return new Response(
      JSON.stringify({ error: 'Type must be either "current_limitation" or "injury_history"' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function updateCurrentLimitation(service: UserProfileService, userId: string, profile: any, limitationId: number, limitation: CurrentLimitation) {
  const validationError = validateCurrentLimitation(limitation)
  if (validationError) {
    return new Response(
      JSON.stringify({ error: validationError }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  const currentLimitations = profile.physical_profile?.current_limitations || []
  
  if (limitationId < 0 || limitationId >= currentLimitations.length) {
    return new Response(
      JSON.stringify({ error: 'Limitation not found' }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  const updatedLimitations = [...currentLimitations]
  updatedLimitations[limitationId] = limitation
  
  const updatedProfile = await service.updateProfileSection(userId, {
    section: 'physical_profile',
    data: {
      ...profile.physical_profile,
      current_limitations: updatedLimitations
    }
  })
  
  return new Response(JSON.stringify({
    limitation: {
      id: limitationId,
      ...limitation
    },
    updated_completion_percentage: updatedProfile.profile_completion_percentage,
    message: 'Current limitation updated successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function updateInjuryHistory(service: UserProfileService, userId: string, profile: any, injuryId: number, injury: InjuryHistoryItem) {
  const validationError = validateInjuryHistory(injury)
  if (validationError) {
    return new Response(
      JSON.stringify({ error: validationError }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  const injuryHistory = profile.physical_profile?.injury_history || []
  
  if (injuryId < 0 || injuryId >= injuryHistory.length) {
    return new Response(
      JSON.stringify({ error: 'Injury not found' }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  const updatedHistory = [...injuryHistory]
  updatedHistory[injuryId] = injury
  
  const updatedProfile = await service.updateProfileSection(userId, {
    section: 'physical_profile',
    data: {
      ...profile.physical_profile,
      injury_history: updatedHistory
    }
  })
  
  return new Response(JSON.stringify({
    injury: {
      id: injuryId,
      ...injury
    },
    updated_completion_percentage: updatedProfile.profile_completion_percentage,
    message: 'Injury history updated successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleDelete(service: UserProfileService, userId: string, injuryId: number, req: Request) {
  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'injury_history' // default to injury history
  
  if (isNaN(injuryId)) {
    return new Response(
      JSON.stringify({ error: 'Invalid injury ID' }), 
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
  
  if (type === 'current_limitation') {
    return await deleteCurrentLimitation(service, userId, profile, injuryId)
  } else {
    return await deleteInjuryHistory(service, userId, profile, injuryId)
  }
}

async function deleteCurrentLimitation(service: UserProfileService, userId: string, profile: any, limitationId: number) {
  const currentLimitations = profile.physical_profile?.current_limitations || []
  
  if (limitationId < 0 || limitationId >= currentLimitations.length) {
    return new Response(
      JSON.stringify({ error: 'Limitation not found' }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  const deletedLimitation = currentLimitations[limitationId]
  const updatedLimitations = currentLimitations.filter((_, index) => index !== limitationId)
  
  const updatedProfile = await service.updateProfileSection(userId, {
    section: 'physical_profile',
    data: {
      ...profile.physical_profile,
      current_limitations: updatedLimitations
    }
  })
  
  return new Response(JSON.stringify({
    deleted_limitation: {
      id: limitationId,
      ...deletedLimitation
    },
    remaining_limitations: updatedLimitations.length,
    updated_completion_percentage: updatedProfile.profile_completion_percentage,
    message: 'Current limitation removed successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function deleteInjuryHistory(service: UserProfileService, userId: string, profile: any, injuryId: number) {
  const injuryHistory = profile.physical_profile?.injury_history || []
  
  if (injuryId < 0 || injuryId >= injuryHistory.length) {
    return new Response(
      JSON.stringify({ error: 'Injury not found' }), 
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  const deletedInjury = injuryHistory[injuryId]
  const updatedHistory = injuryHistory.filter((_, index) => index !== injuryId)
  
  const updatedProfile = await service.updateProfileSection(userId, {
    section: 'physical_profile',
    data: {
      ...profile.physical_profile,
      injury_history: updatedHistory
    }
  })
  
  return new Response(JSON.stringify({
    deleted_injury: {
      id: injuryId,
      ...deletedInjury
    },
    remaining_injuries: updatedHistory.length,
    updated_completion_percentage: updatedProfile.profile_completion_percentage,
    message: 'Injury history removed successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

function validateCurrentLimitation(limitation: CurrentLimitation): string | null {
  if (!limitation.body_region || !VALID_BODY_REGIONS.includes(limitation.body_region)) {
    return `Invalid body region. Valid regions: ${VALID_BODY_REGIONS.join(', ')}`
  }
  
  if (!limitation.condition || typeof limitation.condition !== 'string' || limitation.condition.trim() === '') {
    return 'condition is required and must be a non-empty string'
  }
  
  if (!['minor', 'moderate', 'severe'].includes(limitation.severity)) {
    return 'severity must be: minor, moderate, or severe'
  }
  
  if (typeof limitation.medical_clearance !== 'boolean') {
    return 'medical_clearance must be a boolean value'
  }
  
  if (!Array.isArray(limitation.movement_restrictions)) {
    return 'movement_restrictions must be an array'
  }
  
  if (!Array.isArray(limitation.pain_triggers)) {
    return 'pain_triggers must be an array'
  }
  
  return null
}

function validateInjuryHistory(injury: InjuryHistoryItem): string | null {
  if (!injury.injury_type || typeof injury.injury_type !== 'string' || injury.injury_type.trim() === '') {
    return 'injury_type is required and must be a non-empty string'
  }
  
  if (!injury.body_region || !VALID_BODY_REGIONS.includes(injury.body_region)) {
    return `Invalid body region. Valid regions: ${VALID_BODY_REGIONS.join(', ')}`
  }
  
  const currentYear = new Date().getFullYear()
  if (typeof injury.year_occurred !== 'number' || injury.year_occurred < 1900 || injury.year_occurred > currentYear) {
    return `year_occurred must be a valid year between 1900 and ${currentYear}`
  }
  
  if (typeof injury.surgery_required !== 'boolean') {
    return 'surgery_required must be a boolean value'
  }
  
  if (typeof injury.full_recovery !== 'boolean') {
    return 'full_recovery must be a boolean value'
  }
  
  if (!injury.ongoing_considerations || typeof injury.ongoing_considerations !== 'string') {
    return 'ongoing_considerations is required and must be a string'
  }
  
  return null
}