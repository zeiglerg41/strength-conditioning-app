// Enhanced Users Edge Function - V2 API Implementation
// Comprehensive user profile management with onboarding tracking

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { UserProfileService } from '../_shared/database/user-queries.ts'
import { ProfileUpdateRequest } from '../_shared/types/user-profile.ts'

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
    const url = new URL(req.url)
    const method = req.method
    const pathSegments = url.pathname.split('/').filter(Boolean)
    
    // Extract user ID from auth
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route handlers
    switch (method) {
      case 'GET':
        return await handleGet(userService, userId, url)
      case 'POST':
        return await handlePost(userService, userId, req, url)
      case 'PUT':
        return await handlePut(userService, userId, req, url)
      case 'PATCH':
        return await handlePatch(userService, userId, req, url)
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }), 
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleGet(service: UserProfileService, userId: string, url: URL) {
  const endpoint = url.pathname.split('/').pop()
  
  switch (endpoint) {
    case 'profile':
      const profile = await service.getUserProfile(userId)
      if (!profile) {
        return new Response(
          JSON.stringify({ error: 'Profile not found' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(JSON.stringify(profile), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    case 'completion':
      const completion = await service.getProfileCompletion(userId)
      return new Response(JSON.stringify(completion), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    case 'onboarding-status':
      const profileData = await service.getUserProfile(userId)
      if (!profileData) {
        return new Response(
          JSON.stringify({ error: 'Profile not found' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const onboardingStatus = {
        completion_percentage: profileData.profile_completion_percentage,
        completion_status: profileData.profile_completion_status,
        onboarding_completed: !!profileData.onboarding_completed_at,
        onboarding_completed_at: profileData.onboarding_completed_at
      }
      
      return new Response(JSON.stringify(onboardingStatus), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    default:
      // Default to full profile
      const defaultProfile = await service.getUserProfile(userId)
      if (!defaultProfile) {
        return new Response(
          JSON.stringify({ error: 'Profile not found' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(JSON.stringify(defaultProfile), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
  }
}

async function handlePost(service: UserProfileService, userId: string, req: Request, url: URL) {
  const endpoint = url.pathname.split('/').pop()
  
  switch (endpoint) {
    case 'create':
      const { email } = await req.json()
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email required for profile creation' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const newProfile = await service.createInitialProfile(userId, email)
      return new Response(JSON.stringify(newProfile), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    case 'complete-onboarding':
      const completedProfile = await service.completeOnboarding(userId)
      return new Response(JSON.stringify(completedProfile), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    case 'complete-step':
      const { step } = await req.json()
      if (!step) {
        return new Response(
          JSON.stringify({ error: 'Onboarding step required' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      await service.completeOnboardingStep(userId, step)
      const updatedCompletion = await service.updateProfileCompletion(userId)
      
      return new Response(JSON.stringify({ 
        message: 'Onboarding step completed',
        step,
        updated_completion_percentage: updatedCompletion
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    default:
      return new Response(
        JSON.stringify({ error: 'Invalid POST endpoint' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
  }
}

async function handlePut(service: UserProfileService, userId: string, req: Request, url: URL) {
  const updateRequest: ProfileUpdateRequest = await req.json()
  
  if (!updateRequest.section || !updateRequest.data) {
    return new Response(
      JSON.stringify({ error: 'Section and data required for profile update' }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  const updatedProfile = await service.updateProfileSection(userId, updateRequest)
  return new Response(JSON.stringify(updatedProfile), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handlePatch(service: UserProfileService, userId: string, req: Request, url: URL) {
  const endpoint = url.pathname.split('/').pop()
  
  if (endpoint === 'refresh-completion') {
    const updatedCompletion = await service.updateProfileCompletion(userId)
    return new Response(JSON.stringify({ 
      completion_percentage: updatedCompletion,
      message: 'Profile completion refreshed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  
  return new Response(
    JSON.stringify({ error: 'Invalid PATCH endpoint' }), 
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

