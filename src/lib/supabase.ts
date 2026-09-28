import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[PrepareForU] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

// SESSION-ISOLATION GUARD (invitation onboarding):
//
// The DEDICATED invitation route (/auth/invite) carries the invitation's auth
// tokens in the URL hash. Those tokens are consumed by the ISOLATED invite
// client (`src/lib/inviteClient.ts`, non-persisted, storageKey 'p4u-invite') on
// that route — never by this shared client.
//
// If this shared client auto-detected the URL on /auth/invite (detectSessionInUrl),
// it would exchange the invite tokens into ITS OWN persisted localStorage
// namespace (the normal app session / the Admin's session). That is exactly the
// cross-identity session-collision bug: opening an invite in one tab would
// silently replace the Admin's session in another tab of the same origin.
//
// Therefore we disable URL-session detection for the shared client ONLY on the
// dedicated invitation route. Every other route (email verification, magic
// link, password recovery, normal login redirects) keeps detection enabled.
const isInviteRoute = typeof window !== 'undefined' && window.location.pathname === '/auth/invite'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: !isInviteRoute,
  },
})
