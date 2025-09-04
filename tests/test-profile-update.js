#!/usr/bin/env node

// Test profile update endpoint
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileUpdate() {
  console.log('🧪 Testing Profile Update\n');
  console.log('=' .repeat(60));
  
  // Sign in
  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'TestPassword123!'
  });
  
  if (error) {
    console.log('❌ Sign in failed:', error.message);
    return;
  }
  
  console.log('✅ Signed in as:', session.user.email);
  
  // Test updating profile
  console.log('\n📝 Testing PUT /users/profile...');
  
  const updateData = {
    section: 'profile',
    data: {
      name: 'Updated Test User',
      age: 31,
      gender: 'male',
      location: 'Updated City',
      weight: 80,
      height: 180
    }
  };
  
  const response = await fetch(`${supabaseUrl}/functions/v1/users/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });
  
  const data = await response.json();
  
  console.log('Response status:', response.status);
  
  if (response.status === 200) {
    console.log('✅ Profile updated successfully!');
    console.log('Updated data:', JSON.stringify(data.profile, null, 2));
    
    // Verify the update worked
    console.log('\n📝 Verifying update...');
    const verifyResponse = await fetch(`${supabaseUrl}/functions/v1/users/profile`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    const verifyData = await verifyResponse.json();
    console.log('Verified profile name:', verifyData.profile.name);
    console.log('Verified profile age:', verifyData.profile.age);
    
    if (verifyData.profile.name === 'Updated Test User' && verifyData.profile.age === 31) {
      console.log('✅ Update verified!');
    } else {
      console.log('❌ Update verification failed');
    }
  } else {
    console.log('❌ Update failed:', data);
  }
  
  await supabase.auth.signOut();
  console.log('\n✅ Test complete');
}

testProfileUpdate().catch(console.error);