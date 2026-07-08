import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('MISSING SECRETS: URL or Service Role Key is not set.')
      return new Response(
        JSON.stringify({ 
          error: 'Internal Configuration Error: Supabase secrets not found.',
          details: { url: !!supabaseUrl, service_role: !!serviceRoleKey }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabaseClient = createClient(supabaseUrl, anonKey ?? '', {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user: caller }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: userError?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden', detail: 'Admin role required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const data = await req.json()
    const { email, full_name, coupon_code } = data

    if (!email || !full_name || !coupon_code) {
      return new Response(
        JSON.stringify({ 
          error: 'Bad Request', 
          message: 'Missing required fields',
          received: Object.keys(data)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    console.log('Attempting to invite educator: ' + email)
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: full_name,
        role: 'sub_admin',
        coupon_code: coupon_code.trim().toUpperCase(),
        created_by: caller.id
      }
    })

    if (createError) {
      const isRegistered = createError.message.includes('already been registered') || createError.status === 422
      
      if (isRegistered) {
        console.log('User already exists in Auth. Checking for profile...')
        
        const { data: { users }, error: _listError } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = users.find((u: { email?: string }) => u.email === email)

        if (existingUser) {
          console.log('Found existing user ID:', existingUser.id)
          
          const { data: subAdmin, error: _subError } = await supabaseAdmin
            .from('sub_admins')
            .select('id')
            .eq('user_id', existingUser.id)
            .single()

          if (!subAdmin) {
            console.log('Profile missing. Manually creating sub_admin record...')
            const { error: insertError } = await supabaseAdmin
              .from('sub_admins')
              .insert({
                user_id: existingUser.id,
                full_name: full_name,
                email: email,
                coupon_code: coupon_code.trim().toUpperCase(),
                created_by: caller.id,
                status: 'active'
              })

            if (insertError) {
              return new Response(
                JSON.stringify({ error: 'Partial Success', message: 'Auth user exists, but failed to create profile.', detail: insertError.message }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
              )
            }

            // ── Role Promotion ────────────────────────────────────────────────
            // Promote the existing user to sub_admin in public.users.
            // This is critical: without updating the role column, the user's
            // profile still reads 'user' and the frontend routes them to the
            // normal user dashboard instead of /sub-admin/dashboard.
            // The DB trigger (trg_user_role_change) will auto-clear stale
            // educator_id / sub_admin_id links as a side-effect.
            const { error: promoteError } = await supabaseAdmin
              .from('users')
              .update({ role: 'sub_admin' })
              .eq('id', existingUser.id)

            if (promoteError) {
              // Non-fatal: profile exists, only role update failed. Log and continue.
              console.error('[onboard-sub-admin] Role promotion failed:', promoteError.message)
            } else {
              console.log('[onboard-sub-admin] Role promoted to sub_admin for:', existingUser.id)
            }

            return new Response(
              JSON.stringify({ message: 'Educator profile repaired and onboarded successfully', user_id: existingUser.id }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
          } else {
            return new Response(
              JSON.stringify({ error: 'EMAIL_EXISTS', message: 'This email is already registered as an educator.' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
            )
          }
        }
      }

      console.error('Auth creation failed for ' + email + ': ' + createError.message)
      return new Response(
        JSON.stringify({ error: 'Auth Creation Failed', message: createError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    return new Response(
      JSON.stringify({ 
        message: 'Educator account created successfully', 
        user_id: authData.user.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    )

  } catch (error: unknown) {
    const err = error as Error
    console.error('UNEXPECTED ERROR:', err)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
