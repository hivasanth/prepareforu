import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Ratelimit } from "https://esm.sh/@upstash/ratelimit@0.4.0?target=deno"
import { Redis } from "https://esm.sh/@upstash/redis@1.22.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0?target=deno"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

// Service-role client — bypasses RLS; ONLY used after the admin check below.
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ── Invitation redirect (allowlisted, env-driven) ───────────────────────────
// The invite email must land back on an APP route so Supabase can complete the
// confirmation and route the (not-yet-password-set) educator to password setup.
// The redirect target comes ONLY from environment configuration — it is NEVER
// derived from the client payload, a URL parameter, localStorage, or JWT
// metadata (an open redirect / invitation-hijack vector otherwise).
//
//   INVITE_REDIRECT_URL        full callback URL, e.g.
//                              http://localhost:5173/auth/callback   (dev)
//                              https://app.example.com/auth/callback (prod)
//   INVITE_REDIRECT_ALLOWLIST  OPTIONAL comma-separated ORIGINS that are
//                              allowed to receive the invite redirect, e.g.
//                              "http://localhost:5173,https://app.example.com"
//                              When set, the redirect URL's origin MUST be in
//                              the list or the invite FAILS CLOSED (no email).
//
// Default (UNAUTHENTICATED local dev) is the Vite dev origin. Production MUST
// set INVITE_REDIRECT_URL (and SHOULD set INVITE_REDIRECT_ALLOWLIST) as edge
// function secrets at deploy time. Nothing here is client-controllable.
//
// Points to the DEDICATED invitation-onboarding route (/auth/invite), which is
// served by the isolated, non-persisted invite client. This keeps invitation
// acceptance entirely separate from normal login sessions so it can never
// replace an Admin's session in another tab of the same browser origin.
const INVITE_REDIRECT_DEFAULT = "http://localhost:5173/auth/invite"
const invitesEnvRedirect = Deno.env.get("INVITE_REDIRECT_URL")
if (!invitesEnvRedirect) {
  // The dev default must never silently become a production redirect target.
  // Production MUST set INVITE_REDIRECT_URL to the real HTTPS callback URL.
  console.warn(
    "[onboard-sub-admin] INVITE_REDIRECT_URL not configured — invitations will redirect to the development default " +
    INVITE_REDIRECT_DEFAULT + ". Set INVITE_REDIRECT_URL (and INVITE_REDIRECT_ALLOWLIST) in production secrets.",
  )
}
const inviteRedirectUrl = invitesEnvRedirect ?? INVITE_REDIRECT_DEFAULT

function isAllowedInviteRedirect(url: string): boolean {
  const allowlist = (Deno.env.get("INVITE_REDIRECT_ALLOWLIST") ?? "").split(",").map(s => s.trim()).filter(Boolean)
  if (allowlist.length === 0) return true // allowlist not configured → single env-driven URL
  let origin: string
  try {
    origin = new URL(url).origin
  } catch {
    return false
  }
  return allowlist.includes(origin)
}
const invokeRedirectAllowed = isAllowedInviteRedirect(inviteRedirectUrl)

// ── Rate limiting (Upstash) ─────────────────────────────────────────────────
// Audit finding F4 remediation: a missing/misconfigured rate limiter must NOT
// silently degrade to "unthrottled". If the secrets are absent this endpoint
// refuses to onboard (fail-closed) and audits the misconfiguration instead of
// proceeding without throttling. The local environment must supply
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN for onboarding to work.
let ratelimit: Ratelimit | null = null
const rateLimitDisabled = !Deno.env.get("UPSTASH_REDIS_REST_URL") || !Deno.env.get("UPSTASH_REDIS_REST_TOKEN")
if (!rateLimitDisabled) {
  ratelimit = new Ratelimit({
    redis: new Redis({
      url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
      token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!,
    }),
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
    prefix: "@upstash/ratelimit",
  })
} else {
  console.warn("[onboard-sub-admin] UPSTASH_REDIS_* not configured — onboarding refuses to proceed (fail-closed)")
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  })
}

/** Structured audit with a correlation key so compensation failures are
 *  deterministically recoverable, never silently swallowed. */
async function logSecurityEvent(
  type: string,
  identifier: string,
  severity: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  try {
    await supabaseAdmin.rpc("log_security_event", {
      p_type: type,
      p_identifier: identifier,
      p_severity: severity,
      p_metadata: metadata,
    })
  } catch (err) {
    // Last-resort record: the DB table may be unavailable. Never throw.
    console.error(`[onboard-sub-admin] log_security_event failed (${type}):`, err)
  }
}

interface OnboardPayload {
  email?: unknown
  full_name?: unknown
  coupon_code?: unknown
  request_id?: unknown
  commission_percentage?: unknown
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function validatePayload(body: OnboardPayload):
  { email: string; fullName: string; couponCode: string; requestId: string; commissionPercentage: number | null } | string {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : ""
  const couponCode = typeof body.coupon_code === "string" ? body.coupon_code.trim().toUpperCase() : ""
  const requestId = typeof body.request_id === "string" ? body.request_id.trim() : ""
  let commissionPercentage: number | null = null

  if (fullName.length < 2) return "Display name must be at least 2 characters."
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "A valid email address is required."
  // Coupon is OPTIONAL: an empty string means "auto-generate a unique coupon
  // server-side in the atomic RPC". When a coupon IS supplied it must be a
  // plausible code (>= 3 chars); generation/uniqueness is the DB's job, never
  // the client's. No Math.random / id / email-derived codes ever here.
  if (couponCode.length > 0 && couponCode.length < 3) return "Coupon code must be at least 3 characters."
  if (couponCode.length > 0 && !/^[A-Z0-9]+$/.test(couponCode)) return "Coupon code may only contain uppercase letters and numbers."
  if (!UUID_RE.test(requestId)) return "A valid request_id is required for provisioning."

  // commission_percentage is OPTIONAL. When provided it must be a finite number
  // in [0, 100] inclusive — rejected (never clamped), matching the DB CHECK.
  if (body.commission_percentage !== undefined && body.commission_percentage !== null && body.commission_percentage !== "") {
    if (typeof body.commission_percentage !== "number" || Number.isNaN(body.commission_percentage) || !Number.isFinite(body.commission_percentage)) {
      return "Commission must be a number between 0 and 100."
    }
    commissionPercentage = body.commission_percentage
    if (commissionPercentage < 0 || commissionPercentage > 100) {
      return "Commission must be between 0 and 100."
    }
  }

  return { email, fullName, couponCode, requestId, commissionPercentage }
}

/** GoTrue's `inviteUserByEmail` may create the auth user (stamping `invited_at`)
 *  yet return an empty user payload to the caller when the email-send completes
 *  asynchronously (the SMTP hook resolves after the HTTP response is formed).
 *  When that happens — no user AND no error — the invite has actually succeeded
 *  server-side, so we reconcile by re-reading the freshly-created user for the
 *  exact invited email and confirm `invited_at` is set before proceeding. This
 *  recovers the already-created user id WITHOUT weakening any control: the same
 *  caller+admin gate that authorized the invite still gates provisioning, and
 *  the "already registered" / real-error branches remain authoritative below.
 */
async function reconcileInvitedUserByEmail(
  email: string,
  callerId: string,
  requestId: string,
): Promise<{ userId: string } | null> {
  // GoTrue admin list endpoint orders newest first; the just-invited user is on
  // the leading page. Bounded to a small window so a pathological page never
  // stalls the request. The response shape varies by auth-js version: 2.x may
  // expose the users either as `{ users: [...] }` or as a bare array whose
  // elements are spread onto the returned object (numeric-index keys). We
  // normalize both below so reconciliation is version-agnostic.
  const maxPages = 5
  const perPage = 200
  for (let page = 1; page <= maxPages; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    })
    if (error) break
    const raw: Record<string, unknown> = (data ?? {}) as Record<string, unknown>
    const users: Array<{ id?: string; email?: string; invited_at?: unknown }> = Array.isArray(raw)
      ? (raw as Array<{ id?: string; email?: string; invited_at?: unknown }>)
      : Array.isArray(raw.users)
        ? (raw.users as Array<{ id?: string; email?: string; invited_at?: unknown }>)
        : Object.keys(raw)
            .filter((k) => /^\d+$/.test(k))
            .map((k) => raw[k] as { id?: string; email?: string; invited_at?: unknown })
    const hit = users.find(
      (u) =>
        u?.email?.toLowerCase() === email &&
        typeof u.invited_at === "string" &&
        u.invited_at.length > 0,
    )
    if (hit?.id) return { userId: hit.id }
    if (users.length < perPage) break
  }
  await logSecurityEvent("onboard_reconcile_failed", callerId, "high", {
    email,
    request_id: requestId,
    reason: "freshly-invited user not found in auth.users",
  })
  return null
}

/** Best-effort compensation: remove the auth user created by a failed invite so
 *  no orphan account survives a provisioning failure. A compensation failure is
 *  ALWAYS audited with the correlation key (never silently swallowed). */
async function compensateOrphanAuthUser(userId: string, callerId: string, requestId: string): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId, true)
  await logSecurityEvent(
    error ? "onboard_compensation_failed" : "onboard_compensated",
    callerId,
    "high",
    { orphanUserId: userId, request_id: requestId, deleteError: error?.message ?? null },
  )
}

/** Provision the invited user's profile + role ATOMICALLY (F1), read back any
 *  server-generated coupon, audit, and return the client response. Shared by the
 *  normal invite path and the reconciled (user-dropped-from-response) path so
 *  both flows behave identically. */
async function provisionSubAdmin(
  newUserId: string,
  email: string,
  fullName: string,
  couponCode: string,
  callerId: string,
  requestId: string,
  commissionPercentage: number | null,
  invitedUserId: string | null,
): Promise<Response> {
  // admin_create_sub_admin_profile inserts the sub_admins row and grants
  // role='sub_admin' (+ links sub_admin_id) in ONE database transaction.
  // The RPC is service_role-EXECUTE only, so nothing the caller controls can
  // escalate: the admin gate above remains the sole entry authority.
  const { data: saRow, error: rpcErr } = await supabaseAdmin.rpc(
    "admin_create_sub_admin_profile",
    {
      p_user_id: newUserId,
      p_full_name: fullName,
      p_email: email,
      p_coupon_code: couponCode,
      p_created_by: callerId,
      p_request_id: requestId,
      p_commission_percentage: commissionPercentage ?? 0,
    },
  )

  if (rpcErr) {
    const rpcMessage = (rpcErr.message ?? "").toLowerCase()
    console.error("[onboard-sub-admin] atomic provisioning failed:", rpcErr)
    await logSecurityEvent("onboard_provision_failed", callerId, "high", {
      email,
      newUserId,
      request_id: requestId,
      message: rpcErr.message,
    })

    if (rpcMessage.includes("already_provisioned")) {
      // Same request_id raced a second path that already provisioned a DIFFERENT
      // auth user. Compensate OUR invite, resolve to the canonical profile.
      await compensateOrphanAuthUser(newUserId, callerId, requestId)
      const { data: canonical } = await supabaseAdmin
        .from("sub_admins")
        .select("id")
        .eq("provision_request_id", requestId)
        .maybeSingle()
      return json(200, { success: true, sub_admin_id: canonical?.id, replayed: true })
    }

    // The invitation already created the auth user — remove it so a failed
    // provisioning leaves NO orphan account behind (F1 + §3/§4). Only reconcile
    // against the user we actually operated on: invitedUserId (from the invite
    // response) when available, else the reconciled id we provisioned.
    const orphanId = invitedUserId ?? newUserId
    await compensateOrphanAuthUser(orphanId, callerId, requestId)

    if (rpcMessage.includes("coupon_taken") || rpcErr.code === "23505") {
      return json(409, { error: "COUPON_TAKEN", message: "This coupon code is already assigned to an active educator." })
    }
    if (rpcMessage.includes("coupon_generation_exhausted")) {
      // Extremely rare: 8 auto-generated candidates all collided concurrently.
      // Retryable — a fresh attempt will draw new codes. No partial state.
      return json(503, { error: "COUPON_GENERATION_EXHAUSTED", message: "Could not mint a unique coupon. Please try again." })
    }
    if (rpcMessage.includes("invalid_commission")) {
      return json(400, { error: "INVALID_COMMISSION", message: "Commission must be between 0 and 100." })
    }
    if (rpcMessage.includes("educator_exists") || rpcMessage.includes("user_not_found")) {
      return json(409, { error: "EDUCATOR_EXISTS", message: "An account with this email already exists." })
    }
    return json(500, {
      error: "PROVISION_FAILED",
      message: "Educator was invited but provisioning failed. The invitation has been revoked — no partial account remains. Try again.",
    })
  }

  const subAdminId = saRow as string

  // Fetch the (possibly server-GENERATED) coupon so the Admin UI can display
  // it in the success state — the admin must be able to share it with the
  // new educator. This is a read AFTER the committed provisioning, so it can
  // never race the generation. A read failure does not fail the operation
  // (the coupon is already persisted + visible in the sub-admins table).
  let generatedCoupon: string | null = null
  try {
    const { data: couponRow } = await supabaseAdmin
      .from("sub_admins")
      .select("coupon_code")
      .eq("id", subAdminId)
      .maybeSingle()
    generatedCoupon = (couponRow?.coupon_code as string | undefined) ?? null
  } catch (couponReadErr) {
    console.error("[onboard-sub-admin] coupon read failed:", couponReadErr)
  }

  await logSecurityEvent("sub_admin_onboarded", callerId, "info", {
    newUserId,
    subAdminId,
    request_id: requestId,
    commission_percentage: commissionPercentage ?? 0,
  })

  return json(200, { success: true, sub_admin_id: subAdminId, coupon_code: generatedCoupon })
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS })
  }

  // Correlation keys hoisted ABOVE the try so the unhandled-error audit in the
  // outer catch can reference them without a scoping ReferenceError (no silent
  // swallow — the fault is never lost even if an unhandled error fires).
  let callerId: string | undefined
  let requestId: string | undefined

  try {

    // ── 1. Authenticate the CALLER (JWT from the Authorization header) ──────
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { error: "UNAUTHENTICATED", message: "Missing bearer token." })
    }
    const jwt = authHeader.replace("Bearer ", "").trim()

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt)
    if (userErr || !userData?.user) {
      await logSecurityEvent("onboard_bad_token", "unknown", "medium", {})
      return json(401, { error: "UNAUTHENTICATED", message: "Invalid or expired session." })
    }
    callerId = userData.user.id

    // ── 2. Authorize: caller must be an admin (server-side truth) ──────────
    const { data: callerProfile, error: profileErr } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", callerId)
      .single()

    if (profileErr || !callerProfile) {
      await logSecurityEvent("onboard_profile_lookup_failed", callerId, "high", {})
      return json(403, { error: "FORBIDDEN", message: "Unable to verify permissions." })
    }
    if (callerProfile.role !== "admin") {
      await logSecurityEvent("onboard_unauthorized", callerId, "high", {})
      return json(403, { error: "FORBIDDEN", message: "You do not have permission to onboard educators." })
    }

    // ── 2b. Invitation redirect must be allowlisted (fail-closed) ───────────
    // If the configured INVITE_REDIRECT_URL is not on the allowlist, refuse to
    // send invitations rather than issuing an email that could open-redirect.
    // This is a server config error surfaced to the (already-verified) admin.
    if (!invokeRedirectAllowed) {
      await logSecurityEvent("invite_redirect_misconfigured", callerId, "high", { fn: "onboard-sub-admin" })
      return json(503, {
        error: "INVITE_REDIRECT_MISCONFIGURED",
        message: "Invitation redirect is misconfigured. Contact support.",
      })
    }

    // ── 3. Rate limit per admin — FAIL-CLOSED if unconfigured (F4) ─────────
    if (rateLimitDisabled) {
      await logSecurityEvent("rate_limit_misconfigured", callerId, "high", { fn: "onboard-sub-admin" })
      return json(503, {
        error: "RATE_LIMIT_UNAVAILABLE",
        message: "Security layer unavailable. Try again later.",
      })
    }
    const { success, reset } = await ratelimit!.limit(callerId)
    if (!success) {
      await logSecurityEvent("rate_limit_block", callerId, "medium", { fn: "onboard-sub-admin" })
      const retryAfter = Math.max(1, Math.floor((reset - Date.now()) / 1000))
      return json(429, { error: "TOO_MANY_REQUESTS", message: "Too many requests. Try again shortly.", retryAfter })
    }

    // ── 4. Validate payload ────────────────────────────────────────────────
    let body: OnboardPayload
    try {
      body = await req.json()
    } catch {
      return json(400, { error: "BAD_REQUEST", message: "Invalid JSON body." })
    }
    const validated = validatePayload(body)
    if (typeof validated === "string") {
      return json(400, { error: "VALIDATION_FAILED", message: validated })
    }
    const { email, fullName, couponCode, requestId: validatedRequestId, commissionPercentage } = validated
    requestId = validatedRequestId

    // ── 5. Idempotent replay (master-task §5): a retry that already produced a
    //    sub-admins row resolves to that profile WITHOUT a second invite.
    const { data: existingProvision } = await supabaseAdmin
      .from("sub_admins")
      .select("id")
      .eq("provision_request_id", requestId)
      .maybeSingle()
    if (existingProvision) {
      return json(200, { success: true, sub_admin_id: existingProvision.id, replayed: true })
    }

    // ── 6. Fast duplicate guards (fail early, before creating an auth user) ─
    const { data: existingProfile } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()
    if (existingProfile) {
      await logSecurityEvent("onboard_duplicate_email", callerId!, "medium", {
        email,
        request_id: requestId,
        reason: "existing_profile",
        code: "EDUCATOR_EXISTS",
      })
      return json(409, { error: "EDUCATOR_EXISTS", message: "An account with this email already exists." })
    }

    // Coupon duplicate guard only applies to an ADMIN-SUPPLIED code. When the
    // admin left the coupon blank (auto-generate), uniqueness is the DB's
    // atomic job inside the RPC — there is no code to pre-check here.
    if (couponCode.length > 0) {
      const { data: activeCoupon } = await supabaseAdmin
        .from("sub_admins")
        .select("id")
        .eq("coupon_code", couponCode)
        .eq("status", "active")
        .maybeSingle()
      if (activeCoupon) {
        await logSecurityEvent("onboard_coupon_taken", callerId!, "medium", {
          coupon_code: couponCode,
          request_id: requestId,
          code: "COUPON_TAKEN",
        })
        return json(409, { error: "COUPON_TAKEN", message: "This coupon code is already assigned to an active educator." })
      }
    }

    // ── 7. Invite the educator (creates the auth user) ─────────────────────
    // A thrown (not merely `{ error }`) failure here — e.g. a GoTrue / email
    // provider outage during the SMTP hook — must be caught, audited with the
    // correlation key, and mapped to a categorized response instead of being
    // silently swallowed by the outer catch (fail-closed, recoverable).
    let invited: { user?: { id: string } | null; error?: { message?: string } | null }
    try {
      invited = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          data: { full_name: fullName },
          // redirectTo is the allowlisted app callback (env-driven, never
          // client-supplied). It is parsed into a session-bearing link that
          // lands on /auth/callback with type=invite, where the educator sets
          // their password. The email template's {{ .RedirectTo }} is bound to
          // this value.
          redirectTo: inviteRedirectUrl,
        },
      )
    } catch (inviteThrow) {
      console.error("[onboard-sub-admin] invite threw:", inviteThrow)
      await logSecurityEvent("onboard_invite_failed", callerId!, "high", {
        email,
        request_id: requestId,
        message: inviteThrow instanceof Error ? inviteThrow.message : "unknown invite error",
      })
      return json(502, { error: "INVITE_FAILED", message: "Failed to send the invitation email." })
    }
    const inviteErr = invited.error
    if (inviteErr || !invited?.user) {
      const inviteMsg = (inviteErr?.message ?? "").toLowerCase()
      if (inviteMsg.includes("already registered") || inviteMsg.includes("user_exists")) {
        await logSecurityEvent("onboard_invite_failed", callerId!, "medium", {
          email,
          request_id: requestId,
          reason: "user_exists",
          message: inviteErr?.message ?? "user already registered",
        })
        return json(409, { error: "EDUCATOR_EXISTS", message: "An account with this email already exists." })
      }

      // A real, non-empty error means GoTrue failed the request — report it.
      if (inviteErr?.message) {
        console.error("[onboard-sub-admin] invite failed:", inviteErr)
        // Capture the exact GoTrue/email-provider error message in the audit log so
        // the send failure is diagnosable from security_logs (note: an auth.users
        // row is created with invited_at BEFORE the SMTP send, so a send failure
        // still leaves that row — recorded here as a `user_created` flag). This is
        // server-side audit data only; never surfaced to the client.
        await logSecurityEvent("onboard_invite_failed", callerId!, "medium", {
          email,
          request_id: requestId,
          user_created: !!invited?.user?.id,
          message: inviteErr.message,
        })
        return json(502, { error: "INVITE_FAILED", message: "Failed to send the invitation email." })
      }

      // No user AND no error: the invite was issued server-side but the user
      // payload was dropped from the response (async SMTP completion). Reconcile
      // against auth.users for the freshly-invited email before giving up.
      const reconciled = await reconcileInvitedUserByEmail(email, callerId!, requestId)
      if (!reconciled) {
        return json(502, { error: "INVITE_FAILED", message: "Failed to send the invitation email." })
      }
      await logSecurityEvent("onboard_invite_reconciled", callerId!, "info", {
        email,
        request_id: requestId,
        user_id: reconciled.userId,
      })
      // Fall through with the reconciled user id (provisioning continues below).
      return await provisionSubAdmin(
        reconciled.userId,
        email,
        fullName,
        couponCode,
        callerId!,
        requestId,
        commissionPercentage,
        invited.user?.id ?? null,
      )
    }
    const newUserId = invited.user.id
    return await provisionSubAdmin(
      newUserId,
      email,
      fullName,
      couponCode,
      callerId!,
      requestId,
      commissionPercentage,
      invited.user.id,
    )
  } catch (err) {
    console.error("[onboard-sub-admin] Unhandled error:", err)
    // Fail closed — never leak internals, never open on unknown errors. But the
    // cause MUST be recorded server-side (correlation-keyed) so a failure is
    // never silently swallowed: this is what previously reduced every backend
    // failure to a bare "non-2xx" with no diagnostic trail.
    await logSecurityEvent("onboard_unhandled_error", callerId ?? "unknown", "high", {
      message: err instanceof Error ? err.message : "unknown unhandled error",
      request_id: requestId ?? null,
    })
    return json(500, { error: "INTERNAL_ERROR", message: "Unexpected server error." })
  }
})