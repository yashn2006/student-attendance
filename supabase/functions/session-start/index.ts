// POST /functions/v1/session-start
// Teacher starts an attendance session for a class.
// Creates a session row, generates the first rotating 6-digit code with
// expiry-at-generation-time (per device-attendance-flow SKILL.md), and
// validates that the class exists and belongs to the requesting teacher.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
?? (Deno.env.get("SUPABASE_SECRET_KEYS")
? (JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)).default
: "");

const CORS_HEADERS = {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Headers": "Authorization, x-client-info, apikey, Content-Type",
"Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SESSION_WINDOW_MS = 5 * 60 * 1000;
const CODE_TTL_MS = 15 * 1000;
const MAX_CODE_ATTEMPTS = 5;

function generateCode(): string {
return String(Math.floor(100000 + Math.random() * 900000));
}

interface SessionStartRequest {
  classId: string;
  teacherId: string;
  subjectId?: string | null;
}

async function notifyEnrolledStudents(
supabase: ReturnType<typeof createClient>,
classId: string,
sessionId: string,
className: string | null,
): Promise<void> {
try {
const { data: enrollments, error } = await supabase
.from("class_enrollments")
.select("students(expo_push_token)")
.eq("class_id", classId);

if (error) {
  console.error("[session-start] enrollment lookup failed:", error.message);
  return;
}

const tokens = (enrollments ?? [])
  .map((e: { students: { expo_push_token: string | null } | null }) => e.students?.expo_push_token)
  .filter((t): t is string => !!t && t.startsWith("ExponentPushToken["));

if (tokens.length === 0) {
  console.log("[session-start] no push tokens to notify for class", classId);
  return;
}

const messages = tokens.map((to) => ({
  to,
  sound: "default",
  title: "Attendance session started",
  body: className ? `${className} attendance is now open` : "Attendance is now open",
  data: { sessionId, classId },
}));

const chunkSize = 100;
for (let i = 0; i < messages.length; i += chunkSize) {
  const chunk = messages.slice(i, i + chunkSize);
  const resp = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify(chunk),
  });

  const respBody = await resp.text();
      console.log("[session-start] Expo push response:", resp.status, respBody);

      if (!resp.ok) {
        console.error("[session-start] Expo push request failed:", resp.status, respBody);
      }
    }

console.log(`[session-start] notified ${tokens.length} student(s) for class ${classId}`);

} catch (err) {
// Notifications are best-effort — never let a push failure affect
// session creation, which has already succeeded by this point.
console.error("[session-start] notifyEnrolledStudents failed:", err instanceof Error ? err.message : err);
}
}

serve(async (req: Request): Promise<Response> => {
if (req.method === "OPTIONS") {
return new Response(null, { headers: CORS_HEADERS });
}

try {
// 1. request body logging
const body: SessionStartRequest = await req.json();
const { classId, teacherId, subjectId } = body;
console.log("[session-start] request body =", JSON.stringify({ classId, teacherId }));
console.log("[session-start] classId type:", typeof classId, "| teacherId type:", typeof teacherId);

// 2. validation
if (!classId || !teacherId) {
  return new Response(
    JSON.stringify({ status: "error", message: "Missing classId or teacherId" }),
    { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
  );
}

// 3. key logging and supabase client
const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const keysJson = Deno.env.get("SUPABASE_SECRET_KEYS");
console.log("[session-start] legacy SUPABASE_SERVICE_ROLE_KEY present:", legacyKey ? `yes (len=${legacyKey.length})` : "NO");
console.log("[session-start] SUPABASE_SECRET_KEYS present:", keysJson ? "yes" : "NO");
console.log("[session-start] resolved key length =", (SUPABASE_SERVICE_ROLE_KEY || "").length);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

if (!SUPABASE_SERVICE_ROLE_KEY) {
  return new Response(
    JSON.stringify({ status: "error", message: "Service role key not configured" }),
    { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
  );
}

// 4. class lookup
console.log("[session-start] querying classes table with filters:", JSON.stringify({ id: classId }));
const { data: cls, error: clsErr } = await supabase
      .from("classes")
      .select("id, teacher_id, name, section")
      .eq("id", classId)
      .single();

console.log("[session-start] query result:", JSON.stringify({
  hasData: !!cls,
  dataPartial: cls ? { id: cls.id, teacher_id: cls.teacher_id } : null,
  errorCode: clsErr?.code ?? null,
  errorMessage: clsErr?.message ?? null,
  errorDetails: clsErr?.details ?? null,
  errorHint: clsErr?.hint ?? null,
}));

if (clsErr || !cls) {
  return new Response(
    JSON.stringify({ status: "error", message: "Class not found" }),
    { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
  );
}

// 5. authorization block
const isClassTeacher = cls.teacher_id === teacherId;
if (!isClassTeacher) {
  let assignmentQuery = supabase
    .from("class_subject_teachers")
    .select("id")
    .eq("class_id", classId)
    .eq("teacher_id", teacherId);
  if (subjectId) assignmentQuery = assignmentQuery.eq("subject_id", subjectId);

  const { data: assignments, error: assignErr } = await assignmentQuery.limit(1);
  if (assignErr) {
    console.error("[session-start] assignment lookup failed:", assignErr.message);
    return new Response(
      JSON.stringify({ status: "error", message: "Failed to verify teacher assignment" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
  if (!assignments || assignments.length === 0) {
    return new Response(
      JSON.stringify({ status: "error", message: "Teacher is not assigned to this class/subject" }),
      { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
}

// 6. DELETE old check - DONE (moved/replaced by block above)

// 7. session insert
const now = new Date();
const windowStart = now.toISOString();
const windowEnd = new Date(now.getTime() + SESSION_WINDOW_MS).toISOString();
const codeExpiresAt = new Date(now.getTime() + CODE_TTL_MS).toISOString();

let session: { id: string; window_start: string; window_end: string; current_code: string; code_expires_at: string } | null = null;

for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
  const code = generateCode();

  const { data, error: insertErr } = await supabase
    .from("sessions")
    .insert({
      class_id: classId,
      teacher_id: teacherId,
      subject_id: subjectId ?? null,
      window_start: windowStart,
      window_end: windowEnd,
      status: "active",
      current_code: code,
      code_expires_at: codeExpiresAt,
    })
    .select("id, window_start, window_end, current_code, code_expires_at")
    .single();

  if (!insertErr && data) {
    session = data;
    break;
  }

  // 23505 = unique_violation. Only retry on a genuine code collision;
  // any other error should fail loudly instead of looping.
  if (insertErr && insertErr.code !== "23505") {
    console.error("[session-start] insert error:", insertErr.message);
    return new Response(
      JSON.stringify({ status: "error", message: "Failed to create session" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  console.log(`[session-start] code collision on attempt ${attempt + 1}, retrying`);
}

if (!session) {
  return new Response(
    JSON.stringify({ status: "error", message: "Failed to create session after retries" }),
    { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
  );
}

// 8. notifyEnrolledStudents
const classLabel = cls.section ? `${cls.name} ${cls.section}` : cls.name;
notifyEnrolledStudents(supabase, classId, session.id, classLabel);

return new Response(
  JSON.stringify({
    sessionId: session.id,
    windowStart: session.window_start,
    windowEnd: session.window_end,
    currentCode: session.current_code,
    codeExpiresAt: session.code_expires_at,
  }),
  { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
);

} catch (err) {
  // 9. catch block
  console.error("[session-start] unhandled:", err instanceof Error ? err.stack : err);
  return new Response(
    JSON.stringify({ status: "error", message: "Internal server error" }),
    { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
  );
}
});
