import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Ratelimit } from "https://esm.sh/@upstash/ratelimit@0.4.0?target=deno"
import { Redis } from "https://esm.sh/@upstash/redis@1.22.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0?target=deno"

// 1. Setup Redis & Clients
// Best Practice: Use Deno.env.get() and set secrets via Supabase Dashboard or CLI
const redisUrl = Deno.env.get("UPSTASH_REDIS_REST_URL")
const redisToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN")

let ratelimit: Ratelimit | null = null
if (redisUrl && redisToken) {
  const redis = new Redis({ url: redisUrl, token: redisToken })
  ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
    prefix: "@upstash/ratelimit",
  })
}

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

/**
 * Verifies a Turnstile token with Cloudflare's siteverify endpoint.
 */
async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = Deno.env.get("TURNSTILE_SECRET_KEY")
  if (!secretKey) {
    // F4 hardening (remediation): verifyTurnstileToken is only invoked when a
    // captchaToken WAS presented on an auth route. If the secret is missing we
    // must NOT silently accept that token (this function returned true before,
    // i.e. fail-open). Fail closed instead — the client-visible 403 tells the
    // operator the gateway needs TURNSTILE_SECRET_KEY set.
    console.error('[security-gateway] TURNSTILE_SECRET_KEY not configured — refusing presented token (fail-closed)')
    return false
  }

  const formData = new URLSearchParams()
  formData.append('secret', secretKey)
  formData.append('response', token)

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })
    const data = await response.json()
    return data.success === true
  } catch (err) {
    console.error('[security-gateway] Turnstile verify error:', err)
    return false
  }
}

serve(async (req) => {
  const url = new URL(req.url)
  const pathname = url.pathname
  const ip = req.headers.get("x-forwarded-for")?.split(',')[0] || "127.0.0.1"
  const userAgent = req.headers.get("user-agent") || "unknown"

  const isAuthRoute = pathname.includes('/auth/') || pathname.includes('/login') || pathname.includes('/signup')

  // Parse request body for captchaToken
  let captchaToken: string | undefined
  try {
    const body = await req.clone().json()
    captchaToken = body.captchaToken
  } catch {
    // No JSON body or no captchaToken — proceed
  }

  try {
    // 0. Rate Limiting availability — FAIL-CLOSED (F-07).
    // If Upstash is unconfigured the gateway must REFUSE to bless traffic, never
    // silently drop protection. 503 → clients treat the request as rejected.
    if (!ratelimit) {
      await supabaseAdmin.rpc('log_security_event', {
        p_type: 'rate_limit_misconfigured',
        p_identifier: 'gateway',
        p_severity: 'high',
        p_metadata: { pathname }
      })
      return new Response(JSON.stringify({
        error: "RATE_LIMIT_UNAVAILABLE",
        message: "Security service is temporarily unavailable."
      }), {
        status: 503,
        headers: { "Content-Type": "application/json" }
      })
    }

    // 1. Rate Limiting
    const fingerprintInput = `${ip}-${userAgent}`
    const encoder = new TextEncoder()
    const data = encoder.encode(fingerprintInput)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const fingerprint = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("")

    const { success, reset } = await ratelimit.limit(fingerprint)

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

    // 2. Turnstile Verification (auth routes only — REQUIRED).
    // F-07 remediation: the captcha was previously verified ONLY when the client
    // sent captchaToken, so a client that omitted the field sailed through. Now
    // a MISSING token on an auth route is itself a failure (CAPTCHA_REQUIRED),
    // and a presented token is verified fail-closed (missing secret => rejected).
    if (isAuthRoute) {
      if (!captchaToken) {
        await supabaseAdmin.rpc('log_security_event', {
          p_type: 'captcha_missing',
          p_identifier: fingerprint,
          p_severity: 'medium',
          p_metadata: { ip, userAgent, pathname }
        })
        return new Response(JSON.stringify({
          error: "CAPTCHA_REQUIRED",
          message: "A security check must be completed."
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        })
      }
      const isValid = await verifyTurnstileToken(captchaToken)
      if (!isValid) {
        await supabaseAdmin.rpc('log_security_event', {
          p_type: 'captcha_failed',
          p_identifier: fingerprint,
          p_severity: 'medium',
          p_metadata: { ip, userAgent, pathname }
        })
        return new Response(JSON.stringify({ 
          error: "CAPTCHA_FAILED", 
          message: "Security check failed. Please try again."
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } })

  } catch (err: unknown) {
    console.error('[security-gateway] Error:', err)

    // F-07 remediation: the previous fail-open branch
    //   ({ success:true, warning:"Security check bypassed" })
    // let ANY edge error defeat the security pre-check. Remove it: unknown
    // errors fail closed on EVERY route. For auth routes this is critical; for
    // the exam-start pre-check the actual enforcement lives in the RPC layer
    // (create_attempt / RLS / check_availability), so a 503 is a safe,
    // retryable refusal rather than a security gap.
    return new Response(JSON.stringify({ error: "Security layer error" }), { status: 503 })
  }
})
