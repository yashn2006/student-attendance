// POST /functions/v1/webauthn-register-options
// Generates WebAuthn registration options for the authenticated student.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateRegistrationOptions } from "https://esm.sh/@simplewebauthn/server@13";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  ?? (Deno.env.get("SUPABASE_SECRET_KEYS")
    ? JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!).default
    : "");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const RP_NAME = "College Attendance";
const RP_ID = Deno.env.get("WEBAUTHN_RP_ID") ?? "coreegin.com";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
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
      .select("id, name, email")
      .eq("supabase_user", authUser.id)
      .maybeSingle();

    if (studentLookupError) {
      console.error("[webauthn-register-options] student lookup failed:", studentLookupError.message);
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
    if (bodyStudentId && !UUID_RE.test(bodyStudentId)) {
      return json({ status: "error", message: "studentId must be a valid UUID" }, 400);
    }
    if (bodyStudentId && bodyStudentId !== studentRow.id) {
      return json({ status: "error", message: "You can only register your own device" }, 403);
    }

    const studentId = studentRow.id;

    const { data: existingCredentials, error: credentialErr } = await supabase
      .from("device_bindings")
      .select("credential_id")
      .eq("student_id", studentId);

    if (credentialErr) {
      console.error("[webauthn-register-options] credential lookup failed:", credentialErr.message);
      return json({ status: "error", message: "Failed to load device credentials" }, 500);
    }

    const excludeCredentials = (existingCredentials ?? []).map((c) => ({ id: c.credential_id }));

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: studentRow.email,
      userDisplayName: studentRow.name,
      attestationType: "none",
      excludeCredentials: excludeCredentials.length > 0 ? excludeCredentials : undefined,
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "required",
        userVerification: "required",
      },
    });

    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
    const { error: insertErr } = await supabase
      .from("webauthn_challenges")
      .insert({
        student_id: studentId,
        challenge: options.challenge,
        expires_at: expiresAt,
        purpose: "registration",
      });

    if (insertErr) {
      console.error("[webauthn-register-options] challenge insert failed:", insertErr.message);
      return json({ status: "error", message: "Failed to persist challenge" }, 500);
    }

    return json(options, 200);
  } catch (err) {
    console.error("[webauthn-register-options] unexpected:", err instanceof Error ? err.message : err);
    return json({ status: "error", message: "Internal server error" }, 500);
  }
});
