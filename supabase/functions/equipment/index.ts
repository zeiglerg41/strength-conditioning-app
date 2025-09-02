// Equipment & Gym Database Management Edge Function
// Consolidated approach for all equipment and gym endpoints

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

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

    const url = new URL(req.url)
    const method = req.method
    const pathSegments = url.pathname.split('/').filter(Boolean)
    
    // Extract user ID from auth for user-specific operations
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    // Route handlers based on path
    const endpoint = pathSegments[1] // After /equipment/

    switch (method) {
      case 'GET':
        return await handleGet(supabase, endpoint, pathSegments, url)
      case 'POST':
        return await handlePost(supabase, endpoint, req, userId)
      case 'PUT':
        return await handlePut(supabase, endpoint, pathSegments, req, userId)
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }), 
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Equipment function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleGet(supabase: any, endpoint: string, pathSegments: string[], url: URL) {
  switch (endpoint) {
    case 'equipment-categories':
      if (pathSegments.length === 3) {
        // GET /equipment/equipment-categories/{id}
        const categoryId = pathSegments[2]
        const { data, error } = await supabase
          .from('equipment_categories')
          .select('*')
          .eq('id', categoryId)
          .single()
        
        if (error) {
          return new Response(
            JSON.stringify({ error: 'Equipment category not found' }), 
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } else {
        // GET /equipment/equipment-categories
        const { data, error } = await supabase
          .from('equipment_categories')
          .select('*')
          .order('name')
        
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }), 
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
    case 'gyms':
      if (pathSegments.length >= 3) {
        const gymId = pathSegments[2]
        
        if (pathSegments.length === 4 && pathSegments[3] === 'users') {
          // GET /equipment/gyms/{id}/users
          // Privacy-respecting: just return count and general activity
          const { data: gymData, error: gymError } = await supabase
            .from('gyms')
            .select('name')
            .eq('id', gymId)
            .single()
          
          if (gymError) {
            return new Response(
              JSON.stringify({ error: 'Gym not found' }), 
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          const { count, error: countError } = await supabase
            .from('user_gym_access')
            .select('*', { count: 'exact', head: true })
            .eq('gym_id', gymId)
          
          if (countError) {
            return new Response(
              JSON.stringify({ error: countError.message }), 
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          return new Response(JSON.stringify({
            gym_name: gymData.name,
            user_count: count,
            privacy_note: 'Individual user details are not shared for privacy'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else {
          // GET /equipment/gyms/{id}
          const { data, error } = await supabase
            .from('gyms')
            .select(`
              *,
              equipment_categories:equipment_categories(id, name, category_type, movement_patterns)
            `)
            .eq('id', gymId)
            .single()
          
          if (error) {
            return new Response(
              JSON.stringify({ error: 'Gym not found' }), 
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } else {
        // GET /equipment/gyms/search
        const searchQuery = url.searchParams.get('q')
        const location = url.searchParams.get('location')
        
        let query = supabase
          .from('gyms')
          .select('*')
        
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`)
        }
        
        if (location) {
          query = query.ilike('location', `%${location}%`)
        }
        
        const { data, error } = await query.order('name')
        
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }), 
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
    default:
      return new Response(
        JSON.stringify({ error: 'Invalid GET endpoint' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
  }
}

async function handlePost(supabase: any, endpoint: string, req: Request, userId?: string) {
  if (endpoint === 'gyms') {
    // POST /equipment/gyms - Create new gym
    const gymData = await req.json()
    
    if (!gymData.name) {
      return new Response(
        JSON.stringify({ error: 'Gym name is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const { data, error } = await supabase
      .from('gyms')
      .insert([{
        name: gymData.name,
        location: gymData.location || null,
        gym_type: gymData.gym_type || 'commercial',
        equipment_available: gymData.equipment_available || {},
        notes: gymData.notes || null
      }])
      .select()
      .single()
    
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  
  return new Response(
    JSON.stringify({ error: 'Invalid POST endpoint' }), 
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handlePut(supabase: any, endpoint: string, pathSegments: string[], req: Request, userId?: string) {
  if (endpoint === 'gyms' && pathSegments.length === 4 && pathSegments[3] === 'equipment') {
    // PUT /equipment/gyms/{id}/equipment
    const gymId = pathSegments[2]
    const equipmentData = await req.json()
    
    if (!equipmentData.equipment_available) {
      return new Response(
        JSON.stringify({ error: 'Equipment availability data required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const { data, error } = await supabase
      .from('gyms')
      .update({ equipment_available: equipmentData.equipment_available })
      .eq('id', gymId)
      .select()
      .single()
    
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  
  return new Response(
    JSON.stringify({ error: 'Invalid PUT endpoint' }), 
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}