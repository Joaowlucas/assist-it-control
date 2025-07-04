
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user's session using admin client
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      console.error('Profile error or not admin:', profileError, profile)
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { name, email, password, role, unit_id, unit_ids } = await req.json()

    console.log('Creating user with data:', { name, email, role, unit_id, unit_ids })

    // Validate required fields
    if (!name || !email || !password || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, password, role' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Email já está em uso' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create user using admin client
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name: name
      },
      email_confirm: true
    })

    if (authCreateError) {
      console.error('Error creating auth user:', authCreateError)
      return new Response(
        JSON.stringify({ error: authCreateError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Auth user created:', authData.user?.id)

    // Update profile with additional data
    if (authData.user) {
      const { data: profileData, error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({
          name: name,
          role: role,
          unit_id: role === 'technician' ? null : (unit_id === 'none' ? null : unit_id)
        })
        .eq('id', authData.user.id)
        .select()
        .single()

      if (profileUpdateError) {
        console.error('Error updating profile:', profileUpdateError)
        // Clean up: delete the auth user if profile update failed
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return new Response(
          JSON.stringify({ error: 'Failed to create user profile' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Se é técnico e tem unidades selecionadas, criar relacionamentos
      if (role === 'technician' && unit_ids && Array.isArray(unit_ids) && unit_ids.length > 0) {
        const technicianUnits = unit_ids.map(unitId => ({
          technician_id: authData.user.id,
          unit_id: unitId
        }))

        const { error: unitsError } = await supabaseAdmin
          .from('technician_units')
          .insert(technicianUnits)

        if (unitsError) {
          console.error('Error creating technician units:', unitsError)
          // Clean up: delete the auth user if technician units creation failed
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
          return new Response(
            JSON.stringify({ error: 'Failed to assign units to technician' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      }

      console.log('Profile updated successfully:', profileData)

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: authData.user,
          profile: profileData 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Failed to create user' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
