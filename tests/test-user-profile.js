#!/usr/bin/env node

// Test user profile endpoint with real authentication
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserProfile() {
  console.log('🧪 Testing User Profile Endpoint\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Sign in with a test user
    console.log('\n📝 Step 1: Signing in...');
    
    // You can change these to your actual test credentials
    const email = 'test@example.com';
    const password = 'TestPassword123!';
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      // Try to create the user if sign in fails
      console.log('User not found, creating test user...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (signUpError) {
        console.log('❌ Could not create or sign in user:', signUpError.message);
        console.log('\n💡 To test with your existing user:');
        console.log('   1. Edit this file and change email/password');
        console.log('   2. Or use the mobile app to get an auth token');
        return;
      }
      
      // Sign in after creating
      const { data: newSignIn, error: newSignInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (newSignInError) {
        console.log('❌ Could not sign in after creation:', newSignInError.message);
        return;
      }
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('❌ No session available');
      return;
    }
    
    console.log('✅ Signed in successfully');
    console.log('   User ID:', session.user.id);
    console.log('   Email:', session.user.email);
    
    // Step 2: Test GET /users/profile
    console.log('\n📝 Step 2: Testing GET /users/profile...');
    
    const profileUrl = `${supabaseUrl}/functions/v1/users/profile`;
    const response = await fetch(profileUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });
    
    const responseData = await response.text();
    let parsedData;
    
    try {
      parsedData = JSON.parse(responseData);
    } catch {
      parsedData = responseData;
    }
    
    console.log('   Status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Profile retrieved successfully!');
      console.log('\n📊 Profile Data:');
      console.log(JSON.stringify(parsedData, null, 2));
    } else if (response.status === 404) {
      console.log('⚠️  Profile not found (user exists but no profile data)');
      console.log('   This is expected for a new user');
      
      // Step 3: Try to create/update profile
      console.log('\n📝 Step 3: Testing PUT /users/profile...');
      
      const profileData = {
        name: 'Test User',
        age: 30,
        gender: 'male',
        location: 'Test City',
        training_background: {
          total_training_months: 12,
          strength_training_months: 6
        }
      };
      
      const updateResponse = await fetch(profileUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      
      const updateData = await updateResponse.text();
      let parsedUpdate;
      
      try {
        parsedUpdate = JSON.parse(updateData);
      } catch {
        parsedUpdate = updateData;
      }
      
      console.log('   Status:', updateResponse.status);
      
      if (updateResponse.status === 200) {
        console.log('✅ Profile updated successfully!');
        console.log('\n📊 Updated Profile:');
        console.log(JSON.stringify(parsedUpdate, null, 2));
        
        // Step 4: Verify by getting profile again
        console.log('\n📝 Step 4: Verifying profile was saved...');
        
        const verifyResponse = await fetch(profileUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json'
          }
        });
        
        if (verifyResponse.status === 200) {
          const verifyData = await verifyResponse.json();
          console.log('✅ Profile verified!');
          console.log('   Name:', verifyData.name);
          console.log('   Age:', verifyData.age);
        }
      } else {
        console.log('❌ Profile update failed');
        console.log('   Response:', parsedUpdate);
      }
    } else {
      console.log('❌ Unexpected response');
      console.log('   Response:', parsedData);
    }
    
    // Sign out
    await supabase.auth.signOut();
    console.log('\n✅ Test complete, signed out');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log(error);
  }
  
  console.log('\n' + '=' .repeat(60));
}

// Run the test
testUserProfile();