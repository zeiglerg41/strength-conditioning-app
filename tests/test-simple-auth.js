#!/usr/bin/env node

// Simple test of auth endpoint
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Sign in
  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'TestPassword123!'
  });
  
  if (error) {
    console.log('❌ Sign in failed:', error.message);
    return;
  }
  
  console.log('✅ Signed in');
  console.log('Token:', session.access_token.substring(0, 50) + '...');
  
  // Test the endpoint
  const response = await fetch(`${supabaseUrl}/functions/v1/test-auth`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  console.log('\nResponse status:', response.status);
  console.log('Response data:', JSON.stringify(data, null, 2));
  
  await supabase.auth.signOut();
}

test().catch(console.error);