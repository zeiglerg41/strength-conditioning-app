#!/usr/bin/env node

// Comprehensive test for all user endpoints
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const testUserId = 'da334088-3d86-4e11-9f9c-d6b74494bc2c';
let authToken;

async function setup() {
  console.log('🔧 Setting up test session...\n');
  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'TestPassword123!'
  });
  
  if (error) {
    console.log('❌ Sign in failed:', error.message);
    process.exit(1);
  }
  
  authToken = session.access_token;
  console.log('✅ Signed in successfully\n');
}

async function testEndpoint(method, path, body = null, description = '') {
  console.log(`\n📝 Testing ${method} ${path}`);
  if (description) console.log(`   ${description}`);
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/users${path}`, options);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    
    if (response.status >= 200 && response.status < 300) {
      console.log('   ✅ Success');
      return { success: true, data, status: response.status };
    } else {
      console.log('   ❌ Failed:', data.error || 'Unknown error');
      return { success: false, error: data.error, status: response.status };
    }
  } catch (error) {
    console.log('   ❌ Request failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Comprehensive User Endpoints Test');
  console.log('=' .repeat(60));
  
  await setup();
  
  // Test GET /profile
  const profile = await testEndpoint('GET', '/profile', null, 'Get user profile');
  if (profile.success) {
    console.log(`   Profile has ${Object.keys(profile.data).length} sections`);
  }
  
  // Test GET /profile/completion
  await testEndpoint('GET', '/profile/completion', null, 'Get profile completion status');
  
  // Test PUT /profile - Update basic profile
  await testEndpoint('PUT', '/profile', {
    section: 'profile',
    data: {
      name: 'Test User ' + new Date().getTime(),
      age: 25,
      gender: 'male',
      location: 'Test City',
      weight: 75,
      height: 175
    }
  }, 'Update basic profile info');
  
  // Test PUT /profile - Update lifestyle
  await testEndpoint('PUT', '/profile', {
    section: 'lifestyle',
    data: {
      sessions_per_week: 4,
      stress_level: 'moderate',
      work_schedule: 'standard',
      sleep_quality: 'good'
    }
  }, 'Update lifestyle section');
  
  // Test PUT /profile - Update training background
  await testEndpoint('PUT', '/profile', {
    section: 'training_background',
    data: {
      total_training_months: 24,
      strength_training_months: 12,
      movement_competencies: {
        squat: {
          experience_level: 'intermediate',
          confidence_level: 'high',
          max_weight_lbs: 225
        }
      }
    }
  }, 'Update training background');
  
  // Test PUT /profile - Update performance goals
  await testEndpoint('PUT', '/profile', {
    section: 'performance_goals',
    data: {
      primary_goal: 'strength',
      specific_goals: ['Increase squat', 'Build muscle'],
      target_metrics: {
        squat_1rm: 300,
        bench_1rm: 225
      }
    }
  }, 'Update performance goals');
  
  // Test PUT /profile - Update equipment access
  await testEndpoint('PUT', '/profile', {
    section: 'equipment_access',
    data: {
      training_location: 'commercial_gym',
      equipment_available: ['barbell', 'dumbbells', 'cables', 'machines']
    }
  }, 'Update equipment access');
  
  // Test PUT /profile - Update constraints
  await testEndpoint('PUT', '/profile', {
    section: 'constraints',
    data: {
      injuries: [],
      limitations: [],
      time_availability: {
        session_duration_minutes: 60,
        weekly_sessions: 4
      }
    }
  }, 'Update constraints');
  
  // Test GET /training-background
  await testEndpoint('GET', '/training-background', null, 'Get training background');
  
  // Test PUT /training-background
  await testEndpoint('PUT', '/training-background', {
    total_training_months: 36,
    strength_training_months: 18
  }, 'Update training background directly');
  
  // Test GET /movement-competencies
  await testEndpoint('GET', '/movement-competencies', null, 'Get all movement competencies');
  
  // Test GET /movement-competencies/squat_pattern
  await testEndpoint('GET', '/movement-competencies/squat_pattern', null, 'Get squat competency');
  
  // Test PUT /movement-competencies/squat_pattern
  await testEndpoint('PUT', '/movement-competencies/squat_pattern', {
    experience_level: 'advanced',
    confidence_level: 'high',
    max_weight_lbs: 315,
    notes: 'Good depth and form'
  }, 'Update squat competency');
  
  // Test PUT /movement-competencies/bench_press
  await testEndpoint('PUT', '/movement-competencies/bench_press', {
    experience_level: 'intermediate',
    confidence_level: 'moderate',
    max_weight_lbs: 185
  }, 'Update bench competency');
  
  // Test GET /performance-goals
  await testEndpoint('GET', '/performance-goals', null, 'Get performance goals');
  
  // Test PUT /performance-goals
  await testEndpoint('PUT', '/performance-goals', {
    primary_goal: 'hypertrophy',
    specific_goals: ['Build mass', 'Improve aesthetics'],
    target_metrics: {
      bodyweight_lbs: 180,
      body_fat_percentage: 12
    }
  }, 'Update performance goals');
  
  // Test GET /equipment-access
  await testEndpoint('GET', '/equipment-access', null, 'Get equipment access');
  
  // Test PUT /equipment-access
  await testEndpoint('PUT', '/equipment-access', {
    training_location: 'home_gym',
    equipment_available: ['barbell', 'dumbbells', 'power_rack'],
    notes: 'Limited space but good basics'
  }, 'Update equipment access');
  
  // Test PUT /profile/step
  await testEndpoint('PUT', '/profile/step', {
    step: 'basic_info'
  }, 'Complete onboarding step');
  
  // Final profile check
  const finalProfile = await testEndpoint('GET', '/profile', null, 'Get final profile state');
  if (finalProfile.success) {
    console.log('\n📊 Final Profile Summary:');
    const p = finalProfile.data;
    if (p.profile) {
      console.log(`   Name: ${p.profile.name}`);
      console.log(`   Age: ${p.profile.age}`);
    }
    if (p.training_background) {
      console.log(`   Training Experience: ${p.training_background.total_training_months} months`);
    }
    if (p.performance_goals) {
      console.log(`   Primary Goal: ${p.performance_goals.primary_goal}`);
    }
    console.log(`   Profile Completion: ${p.profile_completion_percentage}%`);
  }
  
  await supabase.auth.signOut();
  console.log('\n✅ All tests complete');
}

runTests().catch(console.error);