import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Ratelimit } from "https://esm.sh/@upstash/ratelimit@0.4.0?target=deno"
import { Redis } from "https://esm.sh/@upstash/redis@1.22.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0?target=deno"

// 1. Setup Redis & Clients
// Best Practice: Use Deno.env.get() and set secrets via Supabase Dashboard or CLI
const redis = new Redis({
  url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
  token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!,
})

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

// 2. Setup Ratelimit
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
})

serve(async (req) => {
  const url = new URL(req.url)
  const pathname = url.pathname
  const ip = req.headers.get("x-forwarded-for")?.split(',')[0] || "127.0.0.1"
  const userAgent = req.headers.get("user-agent") || "unknown"

  const isAuthRoute = pathname.includes('/auth/') || pathname.includes('/login') || pathname.includes('/signup')

  try {
    const fingerprintInput = `${ip}-${userAgent}`
    const encoder = new TextEncoder()
    const data = encoder.encode(fingerprintInput)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const fingerprint = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("")

    const { success, limit, remaining, reset } = await ratelimit.limit(fingerprint)

    if (!success) {
      await supabaseAdmin.rpc('log_security_event', {
        p_type: 'rate_limit_block',
        p_identifier: fingerprint,
        p_severity: 'medium',
        p_metadata: { ip, userAgent, pathname }
      })

      return new Response(JSON.stringify({ 
        error: "Too Many Requests", 
        retryAfter: Math.floor((reset - Date.now()) / 1000) 
      }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": Math.floor((reset - Date.now()) / 1000).toString() }
      })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } })

  } catch (err: any) {
    console.error('[security-gateway] Error:', err)
    
    // Fail-Closed for Auth
    if (isAuthRoute) {
      return new Response(JSON.stringify({ error: "Security layer error" }), { status: 503 })
    }
    
    return new Response(JSON.stringify({ success: true, warning: "Security check bypassed" }), { status: 200 })
  }
})
