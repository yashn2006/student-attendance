// POST /functions/v1/webauthn-register-options
// Generates WebAuthn PublicKeyCredentialCreationOptions for a student to
// register their device as an anti-proxy authenticator.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateRegistrationOptions } from "https://esm.sh/@simplewebauthn/server@13";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

const SUPABASE_SERVICE_ROLE_KEY =
Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
(Deno.env.get("SUPABASE_SECRET_KEYS")
? JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!).default
: "");

const RP_NAME = "College Attendance";
const RP_ID = Deno.env.get("WEBAUTHN_RP_ID") ?? "coreegin.com";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

const CORS_HEADERS = {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Headers":
"Authorization, x-client-info, apikey, Content-Type",
"Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RegisterOptionsRequest {
studentId: string;
}

serve(async (req: Request): Promise<Response> => {
if (req.method === "OPTIONS") {
return new Response(null, {
headers: CORS_HEADERS,
});
}

try {
console.log("========== FUNCTION STARTED ==========");

const body: RegisterOptionsRequest = await req.json();

console.log("REQUEST BODY:");
console.log(body);

const { studentId } = body;

if (!studentId) {
  return new Response(
    JSON.stringify({
      status: "error",
      message: "studentId is required",
    }),
    {
      status: 400,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    },
  );
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is missing!");

  return new Response(
    JSON.stringify({
      status: "error",
      message: "Service role key not configured",
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

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

console.log("Supabase client created.");

const { data: student, error: studentErr } = await supabase
  .from("students")
  .select("id, name, email, webauthn_registered")
  .eq("id", studentId)
  .single();

console.log("Student:");
console.log(student);

console.log("Student Error:");
console.log(studentErr);

if (studentErr || !student) {
  return new Response(
    JSON.stringify({
      status: "error",
      message: "Student not found",
    }),
    {
      status: 404,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    },
  );
}

const { data: existingCredentials, error: credentialErr } =
  await supabase
    .from("device_bindings")
    .select("credential_id")
    .eq("student_id", studentId);

console.log("Existing credentials:");
console.log(existingCredentials);

if (credentialErr) {
  console.log("Existing credential error:");
  console.log(credentialErr);
}

const excludeCredentials = (existingCredentials ?? []).map((c) => ({
  id: c.credential_id,
}));

console.log("Generating WebAuthn registration options...");

const options = await generateRegistrationOptions({
  rpName: RP_NAME,
  rpID: RP_ID,
  userName: student.email,
  userDisplayName: student.name,
  attestationType: "none",
  excludeCredentials:
    excludeCredentials.length > 0
      ? excludeCredentials
      : undefined,
  authenticatorSelection: {
    authenticatorAttachment: "platform",
    residentKey: "required",
    userVerification: "required",
  },
});

console.log("Registration options generated:");
console.log(options);

const expiresAt = new Date(
  Date.now() + CHALLENGE_TTL_MS,
).toISOString();

const { error: insertErr } = await supabase
  .from("webauthn_challenges")
  .insert({
    student_id: studentId,
    challenge: options.challenge,
    expires_at: expiresAt,
    purpose: "registration",
  });

if (insertErr) {
  console.error("Challenge insert error:");
  console.error(insertErr);

  return new Response(
    JSON.stringify({
      status: "error",
      message: "Failed to persist challenge",
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

return new Response(
  JSON.stringify(options),
  {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  },
);

} catch (err) {
console.error("========== FUNCTION ERROR ==========");
console.error(err);
console.error(
err instanceof Error
? err.stack
: "No stack trace available",
);

return new Response(
  JSON.stringify({
    status: "error",
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : null,
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