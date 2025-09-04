// Test auth endpoint to verify JWT works
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get JWT from header
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Verify the JWT and get user
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token', details: error?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Now fetch user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError && profileError.code !== 'PGRST116') {
      return new Response(
        JSON.stringify({ error: 'Database error', details: profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found', userId: user.id }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(
      JSON.stringify(profile),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})