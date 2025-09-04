#!/usr/bin/env node

// Check what's actually in the database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🗄️ Checking Database Contents\n');
  console.log('=' .repeat(60));
  
  // Sign in first
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'TestPassword123!'
  });
  
  if (signInError) {
    console.log('❌ Could not sign in:', signInError.message);
    return;
  }
  
  const { data: { session } } = await supabase.auth.getSession();
  console.log('✅ Signed in as:', session.user.email);
  console.log('   User ID:', session.user.id);
  
  // Check users table
  console.log('\n📊 Checking users table...');
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id);
    
  if (userError) {
    console.log('❌ Error querying users table:', userError.message);
  } else {
    console.log('   Records found:', userData.length);
    if (userData.length > 0) {
      console.log('   User record exists!');
      console.log('   Profile data:', JSON.stringify(userData[0].profile, null, 2));
    } else {
      console.log('   ⚠️ No user record in database');
      console.log('   This explains why GET /users/profile returns 404');
      
      // Try to create a user record
      console.log('\n📝 Creating user record...');
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert({
          id: session.user.id,
          email: session.user.email,
          profile: {
            name: 'Test User',
            age: 30,
            gender: 'male',
            location: 'Test City'
          },
          training_background: {
            total_training_months: 12,
            strength_training_months: 6
          },
          performance_goals: {
            primary_goal: 'strength'
          },
          equipment_access: {},
          lifestyle: {
            sessions_per_week: 3
          },
          constraints: {}
        })
        .select();
        
      if (insertError) {
        console.log('❌ Could not create user record:', insertError.message);
      } else {
        console.log('✅ User record created!');
        console.log(JSON.stringify(insertData[0], null, 2));
      }
    }
  }
  
  // Check equipment_categories
  console.log('\n📊 Checking equipment_categories table...');
  const { data: equipmentData, error: equipmentError } = await supabase
    .from('equipment_categories')
    .select('name')
    .limit(5);
    
  if (equipmentError) {
    console.log('❌ Error:', equipmentError.message);
  } else {
    console.log('   Equipment categories found:', equipmentData.length);
    equipmentData.forEach(e => console.log(`   - ${e.name}`));
  }
  
  // Sign out
  await supabase.auth.signOut();
  console.log('\n✅ Done');
}

checkDatabase().catch(console.error);