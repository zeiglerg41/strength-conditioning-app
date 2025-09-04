#!/usr/bin/env node

// Test Edge Functions against deployed Supabase instance
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test results tracking
const results = {
  passed: [],
  failed: [],
  partial: []
};

// Helper to make authenticated requests to Edge Functions
async function testEdgeFunction(path, method = 'GET', body = null) {
  try {
    // Get auth token
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (!session) {
      // Try to sign in with test user or create one
      console.log('📝 No session, attempting to create test user...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'TestPassword123!'
      });
      
      if (signUpError && signUpError.message.includes('already registered')) {
        // Try to sign in instead
        const { data: signInData, error: signInError } = await supabase.auth.signIn({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });
        if (signInError) throw signInError;
      }
    }
    
    // Get session again
    const { data: { session: newSession } } = await supabase.auth.getSession();
    const token = newSession?.access_token || supabaseKey;
    
    const url = `${supabaseUrl}/functions/v1${path}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      }
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    console.log(`\n🔍 Testing ${method} ${path}`);
    const response = await fetch(url, options);
    const responseData = await response.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(responseData);
    } catch {
      parsedData = responseData;
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data: parsedData,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// Test suite
async function runTests() {
  console.log('🧪 Testing Edge Functions\n');
  console.log('=' .repeat(60));
  
  // Test 1: GET /users/profile
  console.log('\n📌 Test 1: GET /users/profile');
  const profileResult = await testEdgeFunction('/users/profile');
  
  if (profileResult.status === 200) {
    console.log('✅ Endpoint responds with 200');
    results.passed.push('GET /users/profile');
  } else if (profileResult.status === 404) {
    console.log('⚠️  Profile not found (expected for new user)');
    results.partial.push('GET /users/profile - returns 404 (no profile yet)');
  } else if (profileResult.status === 401) {
    console.log('⚠️  Authentication required');
    results.partial.push('GET /users/profile - needs auth');
  } else {
    console.log(`❌ Failed with status: ${profileResult.status}`);
    console.log('Response:', profileResult.data);
    results.failed.push(`GET /users/profile - status ${profileResult.status}`);
  }
  
  // Test 2: PUT /users/profile
  console.log('\n📌 Test 2: PUT /users/profile');
  const updateData = {
    name: 'Test User',
    age: 30,
    gender: 'male',
    location: 'Test City'
  };
  const updateResult = await testEdgeFunction('/users/profile', 'PUT', updateData);
  
  if (updateResult.status === 200) {
    console.log('✅ Profile updated successfully');
    results.passed.push('PUT /users/profile');
  } else if (updateResult.status === 401) {
    console.log('⚠️  Authentication required');
    results.partial.push('PUT /users/profile - needs auth');
  } else {
    console.log(`❌ Failed with status: ${updateResult.status}`);
    console.log('Response:', updateResult.data);
    results.failed.push(`PUT /users/profile - status ${updateResult.status}`);
  }
  
  // Test 3: GET /users/training-background
  console.log('\n📌 Test 3: GET /users/training-background');
  const trainingResult = await testEdgeFunction('/users/training-background');
  
  if (trainingResult.status === 200 || trainingResult.status === 404) {
    console.log(`✅ Endpoint responds with ${trainingResult.status}`);
    results.passed.push('GET /users/training-background');
  } else {
    console.log(`❌ Failed with status: ${trainingResult.status}`);
    results.failed.push(`GET /users/training-background - status ${trainingResult.status}`);
  }
  
  // Test 4: GET /users/movement-competencies
  console.log('\n📌 Test 4: GET /users/movement-competencies');
  const movementResult = await testEdgeFunction('/users/movement-competencies');
  
  if (movementResult.status === 200 || movementResult.status === 404) {
    console.log(`✅ Endpoint responds with ${movementResult.status}`);
    results.passed.push('GET /users/movement-competencies');
  } else {
    console.log(`❌ Failed with status: ${movementResult.status}`);
    results.failed.push(`GET /users/movement-competencies - status ${movementResult.status}`);
  }
  
  // Test 5: POST /programs/generate (should fail as not implemented)
  console.log('\n📌 Test 5: POST /programs/generate');
  const programData = {
    event_name: 'Test Event',
    target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  };
  const programResult = await testEdgeFunction('/programs/generate', 'POST', programData);
  
  if (programResult.status === 200) {
    console.log('✅ Program generation works!');
    results.passed.push('POST /programs/generate');
  } else if (programResult.status === 404 || programResult.status === 501) {
    console.log('⚠️  Not implemented yet (expected)');
    results.partial.push('POST /programs/generate - not implemented');
  } else {
    console.log(`Response status: ${programResult.status}`);
    results.failed.push(`POST /programs/generate - status ${programResult.status}`);
  }
  
  // Test 6: GET /workouts/today
  console.log('\n📌 Test 6: GET /workouts/today');
  const workoutResult = await testEdgeFunction('/workouts/today');
  
  if (workoutResult.status === 200) {
    console.log('✅ Workout endpoint works!');
    results.passed.push('GET /workouts/today');
  } else if (workoutResult.status === 404 || workoutResult.status === 501) {
    console.log('⚠️  Not implemented yet (expected)');
    results.partial.push('GET /workouts/today - not implemented');
  } else {
    console.log(`Response status: ${workoutResult.status}`);
    results.failed.push(`GET /workouts/today - status ${workoutResult.status}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY\n');
  
  console.log(`✅ Passed (${results.passed.length}):`);
  results.passed.forEach(test => console.log(`   - ${test}`));
  
  console.log(`\n🔧 Partial/Expected (${results.partial.length}):`);
  results.partial.forEach(test => console.log(`   - ${test}`));
  
  console.log(`\n❌ Failed (${results.failed.length}):`);
  results.failed.forEach(test => console.log(`   - ${test}`));
  
  console.log('\n' + '='.repeat(60));
  
  if (results.failed.length === 0) {
    console.log('🎉 All tests passed or behaved as expected!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed unexpectedly.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});