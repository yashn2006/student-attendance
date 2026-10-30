// POST /functions/v1/attendance-mark
// Student marks attendance for a live session. The flow:
//   1. Validate the session exists, is active, and hasn't passed window_end.
//   2. Validate the codeEntered matches the session's current_code AND the
//      code hasn't passed its generation-time expiry (code_expires_at) –
//      the generation-time rule from device-attendance-flow SKILL.md.
//   3. Verify the webauthnAssertion against the student's stored public key
//      in device_bindings using SimpleWebAuthn's verifyAuthenticationResponse
//      (assertion, NOT registration – this proves the student still holds
//      the device they registered).
//   4. Check the UNIQUE (session_id, student_id) constraint – if already
//      marked, return 'already_marked'.
//   5. On success: insert into attendance_records with status 'verified',
//      return verified + timestamp + attendanceId.
//   6. On any failure: return 'rejected' with the appropriate reason code.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyAuthenticationResponse } from "https://esm.sh/@simplewebauthn/server@13";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  ?? (Deno.env.get("SUPABASE_SECRET_KEYS")
    ? (JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)).default
    : "");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE_RE = /^\d{6}$/;
const CODE_TTL_MS = 15_000;
const GRACE_MS = 15_000;

const RP_ID = Deno.env.get("WEBAUTHN_RP_ID") ?? "coreegin.com";
const ORIGIN = (Deno.env.get("WEBAUTHN_ORIGIN") ?? "https://campus-os.coreegin.com").trim();

// Native Android apps (via Credential Manager) don't send an https:// origin.
// They send "android:apk-key-hash:<base64url of the SHA-256 signing cert hash>"
// instead. Add one entry per signing key you use (debug/dev-client/production),
// comma-separated, via the WEBAUTHN_ANDROID_ORIGINS secret. Keep this in sync
// with the same secret used by webauthn-register-verify.
const ANDROID_ORIGINS = (Deno.env.get("WEBAUTHN_ANDROID_ORIGINS") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const EXPECTED_ORIGINS = [ORIGIN, ...ANDROID_ORIGINS];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, x-client-info, apikey, Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AttendanceMarkRequest {
  sessionId: string;
  studentId: string;
  codeEntered: string;
  webauthnAssertion: {
    id: string;
    rawId: string;
    response: Record<string, unknown>;
    type: "public-key";
  };
  deviceFingerprint?: string;
}

function base64StringToUint8Array(value: unknown): Uint8Array {
  const s = typeof value === "string" ? value : "";
  const standard = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = standard.padEnd(
    standard.length + ((4 - (standard.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ status: "rejected", reason: "Internal server error" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ status: "rejected", reason: "unauthorized" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ status: "rejected", reason: "unauthorized" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: studentRow, error: studentLookupError } = await supabase
      .from("students")
      .select("id")
      .eq("supabase_user", authUser.id)
      .maybeSingle();

    if (studentLookupError) {
      console.error("[attendance-mark] student lookup failed:", studentLookupError.message);
      return new Response(
        JSON.stringify({ status: "rejected", reason: "Internal server error" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    if (!studentRow) {
      return new Response(
        JSON.stringify({ status: "rejected", reason: "forbidden" }),
        { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    let body: AttendanceMarkRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ status: "rejected", reason: "Invalid JSON body" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const { sessionId, studentId: bodyStudentId, codeEntered, webauthnAssertion } = body;
    const deviceFingerprint = typeof body.deviceFingerprint === "string"
      ? body.deviceFingerprint.trim()
      : "";
    const studentId = studentRow.id;

    if (!sessionId || !bodyStudentId || !codeEntered || !webauthnAssertion) {
      return new Response(
        JSON.stringify({
          status: "rejected",
          reason: "Invalid request: sessionId, studentId, codeEntered, and webauthnAssertion are required",
        }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    if (
      typeof webauthnAssertion !== "object" ||
      typeof webauthnAssertion.id !== "string" ||
      webauthnAssertion.id.length < 1 ||
      webauthnAssertion.id.length > 1024 ||
      typeof webauthnAssertion.response !== "object" ||
      webauthnAssertion.response === null ||
      webauthnAssertion.type !== "public-key"
    ) {
      return new Response(
        JSON.stringify({ status: "rejected", reason: "Invalid request: malformed webauthnAssertion" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    if (bodyStudentId !== studentId) {
      return new Response(
        JSON.stringify({ status: "rejected", reason: "forbidden" }),
        { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    if (typeof sessionId !== "string" || !UUID_RE.test(sessionId)) {
      return new Response(
        JSON.stringify({ status: "rejected", reason: "Invalid request: sessionId must be a UUID" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    if (typeof codeEntered !== "string" || !CODE_RE.test(codeEntered)) {
      return new Response(
        JSON.stringify({ status: "rejected", reason: "Invalid request: codeEntered must be 6 digits" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    if (deviceFingerprint.length < 1 || deviceFingerprint.length > 512) {
      return new Response(
        JSON.stringify({ status: "rejected", reason: "Invalid request: deviceFingerprint is required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // ------------------------------------------------------------------
    // 1. Fetch the session
    // ------------------------------------------------------------------
    const { data: session, error: sessionErr } = await supabase
      .from("sessions")
      .select("id, class_id, current_code, code_expires_at, previous_code, previous_code_valid_until, window_end, status")
      .eq("id", sessionId)
      .single();

    if (sessionErr || !session) {
      return new Response(
        JSON.stringify({ status: "rejected", reason: "session_closed" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const { data: enrollment, error: enrollErr } = await supabase
      .from("class_enrollments")
      .select("class_id")
      .eq("class_id", session.class_id)
      .eq("student_id", studentId)
      .maybeSingle();

    if (enrollErr) {
      console.error("[attendance-mark] enrollment lookup failed:", enrollErr.message);
      return new Response(
        JSON.stringify({ status: "rejected", reason: "Internal server error" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    if (!enrollment) {
      return new Response(
        JSON.stringify({ status: "rejected", reason: "forbidden" }),
        { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }


    // 2. Session closed / window-end server-side enforcement.
    const nowMs = Date.now();
    const windowEndMs = session.window_end ? new Date(session.window_end).getTime() : 0;

    if (session.status === "closed" || nowMs > windowEndMs) {
      if (session.status !== "closed") {
        await supabase
          .from("sessions")
          .update({ status: "closed" })
          .eq("id", sessionId);
      }
      return new Response(
        JSON.stringify({ status: "rejected", reason: "session_closed" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // 3. Code validation: accept the current code within its expiry plus the
    // grace window, or the previous code until its grace window ends.
    //
    // Per device-attendance-flow SKILL.md the expiry check MUST use the
    // code's original generation-time expiry (code_expires_at), never
    // request-received time.
    const codeExpiresMs = session.code_expires_at
      ? new Date(session.code_expires_at).getTime()
      : 0;
    const previousCodeValidUntilMs = session.previous_code_valid_until
      ? new Date(session.previous_code_valid_until).getTime()
      : 0;

    const matchesCurrentCode = codeEntered === session.current_code
      && nowMs < codeExpiresMs + GRACE_MS;
    const matchesPreviousCode = session.previous_code !== null
      && codeEntered === session.previous_code
      && nowMs < previousCodeValidUntilMs;

    if (!matchesCurrentCode && !matchesPreviousCode) {
      return new Response(
        JSON.stringify({ status: "rejected", reason: "code_expired" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // ------------------------------------------------------------------
    // 4. Already-marked check (session, student) is UNIQUE in the schema.
    // ------------------------------------------------------------------
    const { data: existingRecord } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("session_id", sessionId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (existingRecord) {
      return new Response(
        JSON.stringify({ status: "rejected", reason: "already_marked" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // ------------------------------------------------------------------
    // 5. WebAuthn assertion verification
    // ------------------------------------------------------------------
    const credentialId = webauthnAssertion.id ?? "";

    const { data: bindings, error: bindingErr } = await supabase
      .from("device_bindings")
      .select("id, credential_id, public_key, sign_count")
      .eq("student_id", studentId)
      .eq("credential_id", credentialId);

    if (bindingErr || !bindings || bindings.length === 0) {
      return new Response(
        JSON.stringify({ status: "rejected", reason: "webauthn_failed" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const binding = bindings[0];

    // The public_key stored in device_bindings was encoded as standard
    // base64 when the user registered (see webauthn-register-verify which
    // uses btoa from the Uint8Array bytes). Decode it back to Uint8Array.
    const credentialPublicKey = base64StringToUint8Array(binding.public_key);

    // Retrieve the server-generated challenge that webauthn-auth-options
    // stored for this student. This replaces the broken pattern of deriving
    // expectedChallenge from the client's own clientDataJSON (which makes
    // the challenge check a no-op — the client controls what it claims).
    // Decode the challenge the browser actually signed, from clientDataJSON
let signedChallenge = "";
try {
  const clientDataJSON = JSON.parse(
    new TextDecoder().decode(base64StringToUint8Array(webauthnAssertion.response.clientDataJSON)),
  );
  signedChallenge = String(clientDataJSON.challenge ?? "");
} catch {
  signedChallenge = "";
}
if (!signedChallenge) {
  return new Response(
    JSON.stringify({ status: "rejected", reason: "webauthn_failed" }),
    { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
  );
}
const { data: challengeRow, error: challengeErr } = await supabase
  .from("webauthn_challenges")
  .select("challenge, expires_at")
  .eq("student_id", studentId)
  .eq("purpose", "authentication")
  .eq("challenge", signedChallenge)   // exact match, not "latest"
  .gte("expires_at", new Date().toISOString())
  .single();

    if (challengeErr || !challengeRow) {
      return new Response(
        JSON.stringify({ status: "rejected", reason: "webauthn_failed" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const expectedChallenge = challengeRow.challenge;

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: webauthnAssertion,
        expectedChallenge,
        expectedOrigin: EXPECTED_ORIGINS,
        expectedRPID: RP_ID,
        credential: {
          id: binding.credential_id,
          publicKey: credentialPublicKey,
          counter: binding.sign_count,
        },
        requireUserVerification: true,
      });
    } catch (verifyErr) {
      console.error(
        "[attendance-mark] webauthn verification error:",
        verifyErr instanceof Error ? verifyErr.message : verifyErr,
      );
      return new Response(
        JSON.stringify({ status: "rejected", reason: "webauthn_failed" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    if (!verification.verified) {
      return new Response(
        JSON.stringify({ status: "rejected", reason: "webauthn_failed" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // Update the signature counter to prevent replay attacks.
    const { authenticationInfo } = verification;
    if (
      authenticationInfo &&
      typeof authenticationInfo.newCounter === "number" &&
      authenticationInfo.newCounter > binding.sign_count
    ) {
      await supabase
        .from("device_bindings")
        .update({ sign_count: authenticationInfo.newCounter })
        .eq("id", binding.id);
    }

    // Delete the used challenge so it can't be replayed.
    await supabase
      .from("webauthn_challenges")
      .delete()
      .eq("student_id", studentId)
      .eq("challenge", expectedChallenge);

    // Clean up any other expired challenges for this student.
    await supabase
      .from("webauthn_challenges")
      .delete()
      .eq("student_id", studentId)
      .lt("expires_at", new Date().toISOString());
      // ------------------------------------------------------------------
    // 5b. Device fingerprint cross-check (flag, don't block).
    // ------------------------------------------------------------------
    const { data: conflictingRecords } = await supabase
      .from("attendance_records")
      .select("student_id")
      .eq("session_id", sessionId)
      .eq("device_fingerprint", deviceFingerprint)
      .neq("student_id", studentId);

    if (conflictingRecords && conflictingRecords.length > 0) {
      const conflictingStudentId = conflictingRecords[0].student_id;
      const { error: flagErr } = await supabase.from("attendance_flags").insert({
        session_id: sessionId,
        device_fingerprint: deviceFingerprint,
        flagged_student_id: studentId,
        conflicting_student_id: conflictingStudentId,
        reason: "same_device_multiple_students",
      });
      if (flagErr) {
        console.error("[attendance-mark] failed to write attendance_flags:", flagErr.message);
      }
    }

    // ------------------------------------------------------------------
    // 6. Insert the attendance record as verified.
    // ------------------------------------------------------------------

    const now = new Date().toISOString();
    const { data: record, error: insertErr } = await supabase
      .from("attendance_records")
      .insert({
        session_id: sessionId,
        student_id: studentId,
        code_entered: codeEntered,
        status: "verified",
        webauthn_verified: true,
        device_fingerprint: deviceFingerprint,
  
      })
      .select("id")
      .single();
      
      if (insertErr?.code === "23505") {
  return new Response(
    JSON.stringify({ status: "rejected", reason: "already_marked" }),
    { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
  );
}

    if (insertErr || !record) {
      console.error(
        "[attendance-mark] insert error:",
        insertErr?.message ?? "null record",
      );
      return new Response(
        JSON.stringify({
          status: "rejected",
          reason: "webauthn_failed",
        }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        status: "verified",
        timestamp: now,
        attendanceId: record.id,
      }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (_err) {
    console.error(
      "[attendance-mark] unexpected:",
      _err instanceof Error ? _err.message : _err,
    );
    return new Response(
      JSON.stringify({ status: "rejected", reason: "Internal server error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});