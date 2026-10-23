// POST /functions/v1/webauthn-register-verify
// Verifies the registration credential for the authenticated student and
// stores only the device public key.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyRegistrationResponse } from "https://esm.sh/@simplewebauthn/server@13";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  ?? (Deno.env.get("SUPABASE_SECRET_KEYS")
    ? (JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)).default
    : "");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const RP_ID = Deno.env.get("WEBAUTHN_RP_ID") ?? "coreegin.com";
const ORIGIN = (Deno.env.get("WEBAUTHN_ORIGIN") ?? "https://campus-os.coreegin.com").trim();
const ANDROID_ORIGINS = (Deno.env.get("WEBAUTHN_ANDROID_ORIGINS") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const EXPECTED_ORIGINS = [ORIGIN, ...ANDROID_ORIGINS];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, x-client-info, apikey, Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return json({ status: "error", message: "Internal server error" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ status: "error", message: "Missing auth" }, 401);

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !authUser) return json({ status: "error", message: "Invalid session" }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: studentRow, error: studentLookupError } = await supabase
      .from("students")
      .select("id")
      .eq("supabase_user", authUser.id)
      .maybeSingle();

    if (studentLookupError) {
      console.error("[webauthn-register-verify] student lookup failed:", studentLookupError.message);
      return json({ status: "error", message: "Failed to authorize request" }, 500);
    }
    if (!studentRow) return json({ status: "error", message: "Not a recognized student" }, 403);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ status: "error", message: "Invalid JSON body" }, 400);
    }

    const bodyStudentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    const credential = body.credential;

    if (bodyStudentId && !UUID_RE.test(bodyStudentId)) {
      return json({ status: "error", message: "studentId must be a valid UUID" }, 400);
    }
    if (bodyStudentId && bodyStudentId !== studentRow.id) {
      return json({ status: "error", message: "You can only register your own device" }, 403);
    }
    if (!credential || typeof credential !== "object") {
      return json({ status: "error", message: "credential is required" }, 400);
    }

    const studentId = studentRow.id;

    const { data: challengeRow, error: challengeErr } = await supabase
      .from("webauthn_challenges")
      .select("challenge, expires_at")
      .eq("student_id", studentId)
      .eq("purpose", "registration")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (challengeErr) {
      console.error("[webauthn-register-verify] challenge lookup failed:", challengeErr.message);
      return json({ status: "error", message: "Failed to load registration challenge" }, 500);
    }
    if (!challengeRow) {
      return json(
        { status: "error", message: "No pending registration challenge found. The challenge may have expired or already been consumed." },
        400,
      );
    }

    const expectedChallenge = challengeRow.challenge;

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: credential as any,
        expectedChallenge,
        expectedOrigin: EXPECTED_ORIGINS,
        expectedRPID: RP_ID,
      });
    } catch (verifyErr) {
      console.error(
        "[webauthn-register-verify] verification failed:",
        verifyErr instanceof Error ? verifyErr.message : verifyErr,
      );
      return json({ status: "error", message: "Registration verification failed" }, 400);
    }

    const { verified, registrationInfo } = verification;
    if (!verified || !registrationInfo) {
      return json({ status: "error", message: "Registration not verified" }, 400);
    }

    const { credential: regCredential } = registrationInfo;

    const publicKeyBase64 = btoa(String.fromCharCode(...regCredential.publicKey));

    const { data: existing, error: existingError } = await supabase
      .from("device_bindings")
      .select("id")
      .eq("credential_id", regCredential.id)
      .maybeSingle();

    if (existingError) {
      console.error("[webauthn-register-verify] duplicate lookup failed:", existingError.message);
      return json({ status: "error", message: "Failed to store device credential" }, 500);
    }
    if (existing) {
      return json({ status: "error", message: "This authenticator is already registered" }, 409);
    }

    const { error: cleanupErr } = await supabase
      .from("device_bindings")
      .delete()
      .eq("student_id", studentId);

    if (cleanupErr) {
      console.error("[webauthn-register-verify] old binding cleanup failed:", cleanupErr.message);
      return json({ status: "error", message: "Failed to clear previous device binding" }, 500);
    }

    const { error: bindingErr } = await supabase
      .from("device_bindings")
      .insert({
        student_id: studentId,
        credential_id: regCredential.id,
        public_key: publicKeyBase64,
        sign_count: regCredential.counter,
      });

    if (bindingErr) {
      console.error("[webauthn-register-verify] binding insert failed:", bindingErr.message);
      return json({ status: "error", message: "Failed to store device credential" }, 500);
    }

    const { error: flagUpdateErr } = await supabase
      .from("students")
      .update({ webauthn_registered: true })
      .eq("id", studentId);

    if (flagUpdateErr) {
      console.error("[webauthn-register-verify] flag update failed:", flagUpdateErr.message);
    }

    const { error: challengeDeleteErr } = await supabase
      .from("webauthn_challenges")
      .delete()
      .eq("student_id", studentId)
      .eq("challenge", expectedChallenge);
    if (challengeDeleteErr) {
      console.error("[webauthn-register-verify] challenge delete failed:", challengeDeleteErr.message);
    }

    const { error: expiredDeleteErr } = await supabase
      .from("webauthn_challenges")
      .delete()
      .eq("student_id", studentId)
      .lt("expires_at", new Date().toISOString());
    if (expiredDeleteErr) {
      console.error("[webauthn-register-verify] expired challenge cleanup failed:", expiredDeleteErr.message);
    }

    return json({ status: "registered" }, 200);
  } catch (err) {
    console.error("[webauthn-register-verify] unexpected:", err instanceof Error ? err.message : err);
    return json({ status: "error", message: "Internal server error" }, 500);
  }
});
