// User Gym & Equipment Management Handlers
// These will be imported into the main users/index.ts file

import { corsHeaders } from '../_shared/cors.ts'
import { UserProfileService } from '../_shared/database/user-queries.ts'

// Equipment Access Handler
export async function handleEquipmentAccess(service: UserProfileService, userId: string, method: string, req: Request) {
  const supabase = (service as any).supabase
  
  switch (method) {
    case 'GET':
      // Get user's complete gym access network
      const { data: gymAccess, error: gymAccessError } = await supabase
        .from('user_gym_access')
        .select(`
          *,
          gym:gyms(*)
        `)
        .eq('user_id', userId)
        .order('priority_rank')
      
      if (gymAccessError) {
        return new Response(
          JSON.stringify({ error: gymAccessError.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(JSON.stringify({
        gym_access: gymAccess,
        total_gyms: gymAccess.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    case 'PUT':
      // Update equipment preferences - for now just return placeholder
      return new Response(JSON.stringify({
        message: 'Equipment preferences updated',
        // TODO: Implement equipment preferences logic
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
  }
  
  return new Response(
    JSON.stringify({ error: 'Method not allowed for equipment-access' }), 
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// User Gyms Handler  
export async function handleUserGyms(service: UserProfileService, userId: string, method: string, req: Request, pathSegments: string[]) {
  const supabase = (service as any).supabase
  
  switch (method) {
    case 'GET':
      // GET /users/gyms - Get user's gym network with equipment details
      const { data: userGyms, error: userGymsError } = await supabase
        .from('user_gym_access')
        .select(`
          *,
          gym:gyms(*)
        `)
        .eq('user_id', userId)
        .order('priority_rank')
      
      if (userGymsError) {
        return new Response(
          JSON.stringify({ error: userGymsError.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(JSON.stringify(userGyms), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    case 'POST':
      // POST /users/gyms - Add gym to user's network
      const gymData = await req.json()
      
      if (!gymData.gym_id) {
        return new Response(
          JSON.stringify({ error: 'gym_id is required' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const { data: newGymAccess, error: addGymError } = await supabase
        .from('user_gym_access')
        .insert([{
          user_id: userId,
          gym_id: gymData.gym_id,
          access_type: gymData.access_type || 'secondary',
          frequency: gymData.frequency || 'weekly',
          priority_rank: gymData.priority_rank || 2
        }])
        .select()
        .single()
      
      if (addGymError) {
        return new Response(
          JSON.stringify({ error: addGymError.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(JSON.stringify(newGymAccess), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    case 'PUT':
      // PUT /users/gyms/{id} - Update gym access details
      if (pathSegments.length < 3) {
        return new Response(
          JSON.stringify({ error: 'Gym access ID required' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const gymAccessId = pathSegments[2]
      const updateData = await req.json()
      
      const { data: updatedGymAccess, error: updateError } = await supabase
        .from('user_gym_access')
        .update({
          access_type: updateData.access_type,
          frequency: updateData.frequency,
          priority_rank: updateData.priority_rank
        })
        .eq('id', gymAccessId)
        .eq('user_id', userId) // Ensure user can only update their own
        .select()
        .single()
      
      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(JSON.stringify(updatedGymAccess), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    case 'DELETE':
      // DELETE /users/gyms/{id} - Remove gym from network
      if (pathSegments.length < 3) {
        return new Response(
          JSON.stringify({ error: 'Gym access ID required' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const deleteGymAccessId = pathSegments[2]
      
      const { error: deleteError } = await supabase
        .from('user_gym_access')
        .delete()
        .eq('id', deleteGymAccessId)
        .eq('user_id', userId) // Ensure user can only delete their own
      
      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(JSON.stringify({
        message: 'Gym removed from network successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
  }
  
  return new Response(
    JSON.stringify({ error: 'Method not allowed for gyms' }), 
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Available Movements Handler
export async function handleAvailableMovements(service: UserProfileService, userId: string, method: string, req: Request) {
  const supabase = (service as any).supabase
  
  if (method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Only GET method allowed for available-movements' }), 
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Get movement patterns available across all user's gyms
  const { data: userGyms, error: userGymsError } = await supabase
    .from('user_gym_access')
    .select(`
      gym:gyms(equipment_available)
    `)
    .eq('user_id', userId)
  
  if (userGymsError) {
    return new Response(
      JSON.stringify({ error: userGymsError.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Get all equipment categories to map movement patterns
  const { data: equipmentCategories, error: equipmentError } = await supabase
    .from('equipment_categories')
    .select('*')
  
  if (equipmentError) {
    return new Response(
      JSON.stringify({ error: equipmentError.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Calculate available movement patterns
  const availableMovements = new Set()
  
  for (const gymAccess of userGyms) {
    const gym = gymAccess.gym
    if (gym && gym.equipment_available) {
      // For each available equipment at this gym
      for (const [equipmentId, isAvailable] of Object.entries(gym.equipment_available)) {
        if (isAvailable) {
          // Find the equipment category and add its movement patterns
          const equipment = equipmentCategories.find(eq => eq.id === equipmentId)
          if (equipment && equipment.movement_patterns) {
            equipment.movement_patterns.forEach((pattern: string) => availableMovements.add(pattern))
          }
        }
      }
    }
  }
  
  return new Response(JSON.stringify({
    available_movements: Array.from(availableMovements),
    total_gyms_checked: userGyms.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Goal Events Handler
export async function handleGoalEvents(service: UserProfileService, userId: string, method: string, req: Request, pathSegments: string[]) {
  // For now, return placeholder - this would integrate with user profile goals
  return new Response(JSON.stringify({
    message: 'Goal events endpoints not yet implemented',
    note: 'These will integrate with user profile performance goals'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}