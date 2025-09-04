// Simple test to verify auth works
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
    // Method 1: Use the built-in JWT verification
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!jwt) {
      return new Response(
        JSON.stringify({ error: 'No JWT provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Decode JWT without verification (for testing)
    const parts = jwt.split('.')
    const payload = JSON.parse(atob(parts[1]))
    
    return new Response(
      JSON.stringify({ 
        success: true,
        userId: payload.sub,
        email: payload.email,
        message: 'JWT decoded successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})