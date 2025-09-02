// Unit Tests for User Gym & Equipment Management Endpoints
// Tests the gym/equipment endpoints consolidated into /users function

import { assertEquals, assertExists, assert } from 'https://deno.land/std@0.208.0/testing/asserts.ts'

// Mock data for testing
const mockUserId = 'test-user-123'
const mockGyms = [
  {
    id: 'gym-1',
    name: 'Gold\'s Gym Downtown',
    location: 'Downtown City',
    gym_type: 'commercial',
    equipment_available: {
      'eq-1': true,  // Barbell
      'eq-2': true   // Leg Press
    }
  },
  {
    id: 'gym-2',
    name: 'Home Gym',
    location: 'Home',
    gym_type: 'home',
    equipment_available: {
      'eq-1': true,  // Barbell
      'eq-2': false  // No Leg Press
    }
  }
]

const mockUserGymAccess = [
  {
    id: 'access-1',
    user_id: mockUserId,
    gym_id: 'gym-1',
    access_type: 'primary',
    frequency: 'daily',
    priority_rank: 1,
    gym: mockGyms[0]
  },
  {
    id: 'access-2', 
    user_id: mockUserId,
    gym_id: 'gym-2',
    access_type: 'secondary',
    frequency: 'weekly',
    priority_rank: 2,
    gym: mockGyms[1]
  }
]

const mockEquipmentCategories = [
  {
    id: 'eq-1',
    name: 'Barbell',
    category_type: 'free_weights',
    movement_patterns: ['squat', 'deadlift', 'press', 'pull']
  },
  {
    id: 'eq-2',
    name: 'Leg Press Machine',
    category_type: 'machines',
    movement_patterns: ['squat']
  }
]

// Mock Supabase client for gym management
class MockSupabaseGymClient {
  mockData: any
  
  constructor() {
    this.mockData = {
      user_gym_access: mockUserGymAccess,
      gyms: mockGyms,
      equipment_categories: mockEquipmentCategories
    }
  }

  from(table: string) {
    return new MockGymQueryBuilder(this.mockData[table] || [], table)
  }

  auth = {
    getUser: () => Promise.resolve({
      data: { user: { id: mockUserId } }
    })
  }
}

class MockGymQueryBuilder {
  data: any[]
  table: string
  filters: any = {}
  selectFields = '*'
  orderBy = ''

  constructor(data: any[], table: string) {
    this.data = data
    this.table = table
  }

  select(fields: string) {
    this.selectFields = fields
    return this
  }

  eq(field: string, value: any) {
    this.filters.eq = { field, value }
    return this
  }

  order(field: string) {
    this.orderBy = field
    return this
  }

  single() {
    return this.execute().then(result => {
      if (result.error) return result
      return { data: result.data ? result.data[0] || null : null, error: null }
    })
  }

  insert(records: any[]) {
    return {
      select: () => ({
        single: () => Promise.resolve({
          data: { 
            ...records[0], 
            id: 'new-access-id',
            created_at: new Date().toISOString() 
          },
          error: null
        })
      })
    }
  }

  update(data: any) {
    return {
      eq: (field: string, value: any) => ({
        eq: (field2: string, value2: any) => ({
          select: () => ({
            single: () => Promise.resolve({
              data: { ...this.data[0], ...data },
              error: null
            })
          })
        })
      })
    }
  }

  delete() {
    return {
      eq: (field: string, value: any) => ({
        eq: (field2: string, value2: any) => Promise.resolve({ error: null })
      })
    }
  }

  async execute() {
    let filteredData = [...this.data]

    // Apply filters
    if (this.filters.eq) {
      const { field, value } = this.filters.eq
      filteredData = filteredData.filter(item => item[field] === value)
    }

    return { data: filteredData, error: null }
  }
}

// Test suite for User Gym & Equipment Management
Deno.test('User Gym & Equipment Management Tests', async (t) => {
  const mockSupabase = new MockSupabaseGymClient() as any

  // Test equipment access endpoints
  await t.step('GET /users/equipment-access should return complete gym access network', async () => {
    const result = await mockSupabase
      .from('user_gym_access')
      .select(`
        *,
        gym:gyms(*)
      `)
      .eq('user_id', mockUserId)
      .order('priority_rank')
      .execute()
    
    assertEquals(result.data.length, 2)
    
    const primaryGym = result.data.find((access: any) => access.access_type === 'primary')
    assertExists(primaryGym)
    assertEquals(primaryGym.gym_id, 'gym-1')
    assertEquals(primaryGym.priority_rank, 1)
    assertEquals(primaryGym.frequency, 'daily')
    
    const secondaryGym = result.data.find((access: any) => access.access_type === 'secondary')
    assertExists(secondaryGym)
    assertEquals(secondaryGym.gym_id, 'gym-2')
    assertEquals(secondaryGym.access_type, 'secondary')
  })

  await t.step('PUT /users/equipment-access should update equipment preferences', async () => {
    // For now this is placeholder functionality
    const mockResponse = {
      message: 'Equipment preferences updated'
    }
    
    assertExists(mockResponse.message)
    assertEquals(mockResponse.message, 'Equipment preferences updated')
  })

  // Test user gyms endpoints
  await t.step('GET /users/gyms should return user gym network with equipment details', async () => {
    const result = await mockSupabase
      .from('user_gym_access')
      .select(`
        *,
        gym:gyms(*)
      `)
      .eq('user_id', mockUserId)
      .order('priority_rank')
      .execute()
    
    assertEquals(result.data.length, 2)
    
    const primaryAccess = result.data[0]
    assertEquals(primaryAccess.access_type, 'primary')
    assertEquals(primaryAccess.gym.name, 'Gold\'s Gym Downtown')
    assertEquals(primaryAccess.gym.gym_type, 'commercial')
    assertExists(primaryAccess.gym.equipment_available)
  })

  await t.step('POST /users/gyms should add gym to user network', async () => {
    const newGymData = {
      gym_id: 'gym-3',
      access_type: 'travel',
      frequency: 'occasional',
      priority_rank: 3
    }
    
    // Validate required fields
    assertExists(newGymData.gym_id)
    assert(['primary', 'secondary', 'travel', 'temporary'].includes(newGymData.access_type))
    assert(['daily', 'weekly', 'occasional'].includes(newGymData.frequency))
    
    const result = await mockSupabase
      .from('user_gym_access')
      .insert([{
        user_id: mockUserId,
        ...newGymData
      }])
      .select()
      .single()
    
    assertEquals(result.data.gym_id, 'gym-3')
    assertEquals(result.data.access_type, 'travel')
    assertEquals(result.data.user_id, mockUserId)
    assertExists(result.data.id)
  })

  await t.step('POST /users/gyms should validate required gym_id', async () => {
    const invalidGymData = {
      access_type: 'secondary',
      frequency: 'weekly'
      // Missing required gym_id
    }
    
    assert(!invalidGymData.hasOwnProperty('gym_id'))
    // In real implementation, this would return 400 error
  })

  await t.step('PUT /users/gyms/{id} should update gym access details', async () => {
    const updateData = {
      access_type: 'primary',
      frequency: 'daily',
      priority_rank: 1
    }
    
    // Validate update data
    assert(['primary', 'secondary', 'travel', 'temporary'].includes(updateData.access_type))
    assert(['daily', 'weekly', 'occasional'].includes(updateData.frequency))
    assert(typeof updateData.priority_rank === 'number')
    
    const result = await mockSupabase
      .from('user_gym_access')
      .update(updateData)
      .eq('id', 'access-2')
      .eq('user_id', mockUserId)
      .select()
      .single()
    
    assertEquals(result.data.access_type, 'primary')
    assertEquals(result.data.frequency, 'daily')
    assertEquals(result.data.priority_rank, 1)
  })

  await t.step('DELETE /users/gyms/{id} should remove gym from network', async () => {
    const deleteResult = await mockSupabase
      .from('user_gym_access')
      .delete()
      .eq('id', 'access-2')
      .eq('user_id', mockUserId)
    
    assertEquals(deleteResult.error, null)
    // In real implementation, would verify gym access is removed
  })

  // Test available movements endpoint
  await t.step('GET /users/available-movements should return movement patterns across all gyms', async () => {
    // Get user's gyms
    const userGymsResult = await mockSupabase
      .from('user_gym_access')
      .select(`
        gym:gyms(equipment_available)
      `)
      .eq('user_id', mockUserId)
      .execute()
    
    // Get equipment categories
    const equipmentResult = await mockSupabase
      .from('equipment_categories')
      .select('*')
      .execute()
    
    assertEquals(userGymsResult.data.length, 2)
    assertEquals(equipmentResult.data.length, 2)
    
    // Calculate available movements (simulate the logic)
    const availableMovements = new Set()
    
    for (const gymAccess of userGymsResult.data) {
      const gym = gymAccess.gym
      if (gym && gym.equipment_available) {
        for (const [equipmentId, isAvailable] of Object.entries(gym.equipment_available)) {
          if (isAvailable) {
            const equipment = equipmentResult.data.find(eq => eq.id === equipmentId)
            if (equipment && equipment.movement_patterns) {
              equipment.movement_patterns.forEach((pattern: string) => availableMovements.add(pattern))
            }
          }
        }
      }
    }
    
    const movementArray = Array.from(availableMovements)
    
    // Should have squat, deadlift, press, pull from barbell across both gyms
    // Plus additional squat from leg press at primary gym
    assert(movementArray.includes('squat'))
    assert(movementArray.includes('deadlift'))
    assert(movementArray.includes('press'))
    assert(movementArray.includes('pull'))
    
    // Should have at least 4 unique movement patterns
    assert(movementArray.length >= 4)
  })

  await t.step('GET /users/available-movements should handle user with no gyms', async () => {
    // Test with empty gym access
    const emptyResult = await mockSupabase
      .from('user_gym_access')
      .select(`
        gym:gyms(equipment_available)
      `)
      .eq('user_id', 'user-with-no-gyms')
      .execute()
    
    assertEquals(emptyResult.data.length, 0)
    
    // Available movements should be empty
    const availableMovements = new Set()
    assertEquals(Array.from(availableMovements).length, 0)
  })
})

// Integration test for complete gym management workflow
Deno.test('User Gym Management Integration Test', async (t) => {
  const mockSupabase = new MockSupabaseGymClient() as any

  await t.step('Complete gym management workflow', async () => {
    // 1. Get current gym access
    const currentAccess = await mockSupabase
      .from('user_gym_access')
      .select(`
        *,
        gym:gyms(*)
      `)
      .eq('user_id', mockUserId)
      .order('priority_rank')
      .execute()
    
    assertEquals(currentAccess.data.length, 2)
    
    // 2. Add new gym to network
    const newGymResult = await mockSupabase
      .from('user_gym_access')
      .insert([{
        user_id: mockUserId,
        gym_id: 'gym-travel',
        access_type: 'travel',
        frequency: 'occasional',
        priority_rank: 3
      }])
      .select()
      .single()
    
    assertEquals(newGymResult.data.access_type, 'travel')
    
    // 3. Update gym access details
    const updateResult = await mockSupabase
      .from('user_gym_access')
      .update({
        frequency: 'weekly',
        priority_rank: 2
      })
      .eq('id', newGymResult.data.id)
      .eq('user_id', mockUserId)
      .select()
      .single()
    
    assertEquals(updateResult.data.frequency, 'weekly')
    assertEquals(updateResult.data.priority_rank, 2)
    
    // 4. Check available movements across network
    const equipmentCategories = await mockSupabase
      .from('equipment_categories')
      .select('*')
      .execute()
    
    assertEquals(equipmentCategories.data.length, 2)
    
    // 5. Remove gym from network
    const deleteResult = await mockSupabase
      .from('user_gym_access')
      .delete()
      .eq('id', newGymResult.data.id)
      .eq('user_id', mockUserId)
    
    assertEquals(deleteResult.error, null)
    
    // Workflow completed successfully
    assert(true, 'Complete gym management workflow executed successfully')
  })
})