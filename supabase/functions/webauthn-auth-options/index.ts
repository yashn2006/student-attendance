// POST /functions/v1/webauthn-auth-options
// Generates WebAuthn PublicKeyCredentialRequestOptions for a student to
// authenticate their already-registered device before marking attendance.
// The challenge is stored server-side in webauthn_challenges so the
// attendance-mark endpoint can verify the client is returning a challenge
// that was actually generated here — not a client-crafted fake challenge.
// This closes the gap where attendance-mark was deriving expectedChallenge
// from the client's own clientDataJSON, making the challenge check a no-op.
//
// Per the device-attendance-flow SKILL.md: the server never sees or stores
// actual biometric data. NEVER hardcode "fingerprint" or "face" in code,
// copy, or UI — WebAuthn lets the device pick the method.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateAuthenticationOptions } from "https://esm.sh/@simplewebauthn/server@13";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  ?? (Deno.env.get("SUPABASE_SECRET_KEYS")
    ? (JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)).default
    : "");

const RP_ID = Deno.env.get("WEBAUTHN_RP_ID") ?? "coreegin.com";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, x-client-info, apikey, Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AuthOptionsRequest {
  studentId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const body: AuthOptionsRequest = await req.json();
    const { studentId } = body;

    if (!studentId) {
      return new Response(
        JSON.stringify({ status: "error", message: "studentId is required" }),
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

    const { data: student, error: studentErr } = await supabase
      .from("students")
      .select("id")
      .eq("id", studentId)
      .single();

    if (studentErr || !student) {
      return new Response(
        JSON.stringify({ status: "error", message: "Student not found" }),
        { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // Fetch the student's registered credentials so we can build
    // allowCredentials — the browser needs to know WHICH credential to
    // prompt for during the authentication ceremony.
    // Fetch the student's registered credentials so we can build
// allowCredentials — the browser needs to know WHICH credential to
// prompt for during the authentication ceremony.
const { data: credentials } = await supabase
  .from("device_bindings")
  .select("credential_id")
  .eq("student_id", studentId)
  .order("created_at", { ascending: false })
  .limit(1);

    const allowCredentials = (credentials ?? []).map((c) => ({
      id: c.credential_id,
    }));

    if (allowCredentials.length === 0) {
      return new Response(
        JSON.stringify({ status: "error", message: "No registered device found for this student" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials,
      userVerification: "required",
    });

    // Persist the challenge so a real verify endpoint can confirm the
    // client is returning what was generated server-side.
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
    const { error: insertErr } = await supabase
      .from("webauthn_challenges")
      .insert({
        student_id: studentId,
        challenge: options.challenge,
        expires_at: expiresAt,
        purpose: "authentication",
      });

    if (insertErr) {
      console.error("[auth-options] challenge insert error:", insertErr.message);
      return new Response(
        JSON.stringify({ status: "error", message: "Failed to persist challenge" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        challenge: options.challenge,
        rpId: RP_ID,
        allowCredentials: options.allowCredentials,
        userVerification: options.userVerification,
        timeout: options.timeout,
      }),
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