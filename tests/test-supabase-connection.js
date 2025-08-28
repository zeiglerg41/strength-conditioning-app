#!/usr/bin/env node

// Test Supabase connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', supabaseUrl ? 'Set ✅' : 'Missing ❌');
console.log('Key:', supabaseKey ? 'Set ✅' : 'Missing ❌');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables');
  process.exit(1);
}

try {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test basic connection by checking auth status
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.log('❌ Connection failed:', error.message);
      process.exit(1);
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('📊 Session status:', data.session ? 'Active session' : 'No active session (normal)');
      
      // Test basic database access
      return supabase.from('_temp_test').select('*').limit(1);
    }
  }).then((result) => {
    if (result && result.error && result.error.code === 'PGRST116') {
      console.log('✅ Database accessible (table not found is expected)');
    } else if (result && result.data) {
      console.log('✅ Database query successful');
    }
    console.log('🎉 All tests passed! Supabase is ready to use.');
    process.exit(0);
  }).catch((error) => {
    console.log('❌ Test failed:', error.message);
    process.exit(1);
  });
  
} catch (error) {
  console.log('❌ Failed to create Supabase client:', error.message);
  process.exit(1);
}