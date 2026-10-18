// POST /functions/v1/webauthn-register-verify
// Verifies the WebAuthn registration credential returned by the browser
// after navigator.credentials.create(). On success, stores ONLY the
// public key (not biometric data) in the device_bindings table and marks
// the student as webauthn_registered = true.
//
// Per the device-attendance-flow SKILL.md: the server NEVER receives or
// stores actual biometric data - only cryptographic proof. NEVER hardcode
// "fingerprint" or "face" anywhere.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyRegistrationResponse } from "https://esm.sh/@simplewebauthn/server@13";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  ?? (Deno.env.get("SUPABASE_SECRET_KEYS")
    ? (JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)).default
    : "");

const RP_ID = Deno.env.get("WEBAUTHN_RP_ID") ?? "coreegin.com";
const ORIGIN = (Deno.env.get("WEBAUTHN_ORIGIN") ?? "https://campus-os.coreegin.com").trim();

// Native Android apps (via Credential Manager) don't send an https:// origin.
// They send "android:apk-key-hash:<base64url of the SHA-256 signing cert hash>"
// instead. Add one entry per signing key you use (debug/dev-client/production),
// comma-separated, via the WEBAUTHN_ANDROID_ORIGINS secret - e.g.:
//   WEBAUTHN_ANDROID_ORIGINS=android:apk-key-hash:AAAA...,android:apk-key-hash:BBBB...
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

interface RegisterVerifyRequest {
  studentId: string;
  credential: {
    id: string;
    rawId: string;
    response: Record<string, unknown>;
    type: "public-key";
  };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const body: RegisterVerifyRequest = await req.json();
    const { studentId, credential } = body;

    if (!studentId || !credential) {
      return new Response(
        JSON.stringify({ status: "error", message: "studentId and credential are required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ status: "error", message: "Service role key not configured" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Retrieve the pending challenge that was stored by register-options.
    const { data: challengeRow, error: challengeErr } = await supabase
      .from("webauthn_challenges")
      .select("challenge, expires_at")
      .eq("student_id", studentId)
      .eq("purpose", "registration")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (challengeErr || !challengeRow) {
      return new Response(
        JSON.stringify({ status: "error", message: "No pending registration challenge found. The challenge may have expired or already been consumed." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const expectedChallenge = challengeRow.challenge;

    // Verify the credential against the stored challenge.
    // This is where SimpleWebAuthn cryptographically validates the
    // attestation - proving the device actually holds the private key.
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: EXPECTED_ORIGINS,
        expectedRPID: RP_ID,
      });
    } catch (verifyErr) {
      console.error("[register-verify] verification failed:", verifyErr instanceof Error ? verifyErr.message : verifyErr);
      return new Response(
        JSON.stringify({ status: "error", message: "Registration verification failed" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      return new Response(
        JSON.stringify({ status: "error", message: "Registration not verified" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const { credential: regCredential } = registrationInfo;

    // Convert Uint8Array public key to base64 for storage in the TEXT column.
    // device_bindings stores only the public key — NEVER biometric data.
    const publicKeyBase64 = btoa(
      String.fromCharCode(...regCredential.publicKey),
    );

    // Check for duplicate credential ID (same authenticator already registered).
    // Check for duplicate credential ID (same authenticator already registered).
    const { data: existing } = await supabase
      .from("device_bindings")
      .select("id")
      .eq("credential_id", regCredential.id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ status: "error", message: "This authenticator is already registered" }),
        { status: 409, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // Single-device-per-student model: registering a new device replaces
    // any previous binding(s) for this student, so old/stale credentials
    // (e.g. from before an RP_ID or origin fix) never linger and confuse
    // the auth-options allowCredentials list.
    const { error: cleanupErr } = await supabase
      .from("device_bindings")
      .delete()
      .eq("student_id", studentId);

    if (cleanupErr) {
      console.error("[register-verify] old binding cleanup error:", cleanupErr.message);
      return new Response(
        JSON.stringify({ status: "error", message: "Failed to clear previous device binding" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // Insert the device. Only stores public key — never biometric data.
    const { error: bindingErr } = await supabase
      .from("device_bindings")
      .insert({
        student_id: studentId,
        credential_id: regCredential.id,
        public_key: publicKeyBase64,
        sign_count: regCredential.counter,
      });

    if (bindingErr) {
      console.error("[register-verify] binding insert error:", bindingErr.message);
      return new Response(
        JSON.stringify({ status: "error", message: "Failed to store device credential" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // Mark the student as registered.
    // Mark the student as registered.
    const { data: flagUpdateData, error: flagUpdateErr } = await supabase
      .from("students")
      .update({ webauthn_registered: true })
      .eq("id", studentId)
      .select("id, webauthn_registered");

    console.log("[register-verify] flag update result:", { flagUpdateData, flagUpdateErr: flagUpdateErr?.message });

    if (flagUpdateErr) {
      console.error("[register-verify] FAILED to set webauthn_registered:", flagUpdateErr.message);
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

    return new Response(
      JSON.stringify({ status: "registered" }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (err) {
  console.error("REGISTER OPTIONS ERROR:", err);

  return new Response(
    JSON.stringify({
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    }),
    {
      status: 500,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    },
  );
}
});