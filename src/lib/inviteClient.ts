import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[PrepareForU] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

// Isolated invitation/onboarding Supabase client.
//
// WHY an ISOLATED client with a SEPARATE storage key and NO persistence:
//   The Admin and an invited Educator may be in DIFFERENT tabs OF THE SAME
//   browser origin. The normal app client (`src/lib/supabase.ts`) persists its
//   session to localStorage under the project scoped key
//   (`sb-<project-ref>-auth-token`). If the invitation were processed by that
//   SAME client/namespace, Supabase's `detectSessionInUrl` would overwrite the
//   shared localStorage session on token exchange — silently converting the
//   Admin tab's session into the invited Educator's session and logging the
//   Admin out/cross-contaminating identities.
//
//   Instead, invitation acceptance runs on a THROWAWAY client that:
//     • persistSession:false      → never writes the invite session to storage
//     • autoRefreshToken:false   → no background token refresh to leak state
//     • storageKey:'p4u-invite'  → an isolated namespace (defensive; nothing
//                                   is persisted anyway)
//     • detectSessionInUrl:true  → still allow the URL hash tokens to be parsed
//
//   Because nothing is persisted, the invite session lives only in memory for
//   the duration of the onboarding tab. The Admin's persisted session in the
//   other tab is never touched. After the password is set, the invite client is
//   signed out (`signOut({ scope: 'local' })`) and the user is sent to /login
//   to sign in fresh — never auto-logged into a dashboard, and never mutating
//   the Admin session.
export const inviteClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession:   false,
    detectSessionInUrl: true,
    storageKey:       'p4u-invite',
  },
})