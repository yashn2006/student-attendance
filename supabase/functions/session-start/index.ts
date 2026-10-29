// POST /functions/v1/session-start
// Teacher starts an attendance session for a class.
// Creates a session row, generates the first rotating 6-digit code with
// expiry-at-generation-time (per device-attendance-flow SKILL.md), and
// validates that the class exists and belongs to the requesting teacher.
//
// Identity is derived ONLY from the verified JWT. Any teacherId supplied in
// the body is ignored, so a caller cannot start sessions as another teacher.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
?? (Deno.env.get("SUPABASE_SECRET_KEYS")
? (JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)).default
: "");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const CORS_HEADERS = {
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Headers": "Authorization, x-client-info, apikey, Content-Type",
"Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SESSION_WINDOW_MS = 5 * 60 * 1000;
const CODE_TTL_MS = 30 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function generateCode(): string {
return String(Math.floor(100000 + Math.random() * 900000));
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

interface SessionStartRequest {
  classId: string;
  teacherId?: string | null;
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
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json({ status: "error", message: "Internal server error" }, 500);
  }

  // 1. Verify the caller's JWT. Identity must come from the token only.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ status: "error", message: "Missing auth" }, 401);
  }

  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: authUser }, error: authError } = await callerClient.auth.getUser();
  if (authError || !authUser) {
    return json({ status: "error", message: "Invalid session" }, 401);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: teacherRow, error: teacherError } = await supabase
    .from("teachers")
    .select("id, is_admin")
    .eq("supabase_user", authUser.id)
    .maybeSingle();

  if (teacherError) {
    console.error("[session-start] teacher lookup failed:", teacherError.message);
    return json({ status: "error", message: "Failed to authorize request" }, 500);
  }
  if (!teacherRow) {
    return json({ status: "error", message: "Not a recognized teacher" }, 403);
  }

  // 2. Parse and validate the body.
  let body: SessionStartRequest;
  try {
    body = await req.json();
  } catch {
    return json({ status: "error", message: "Invalid JSON body" }, 400);
  }

  const classId = typeof body.classId === "string" ? body.classId.trim() : "";
  const subjectId = typeof body.subjectId === "string" ? body.subjectId.trim() : "";
  const teacherId = teacherRow.id;

  if (!classId) {
    return json({ status: "error", message: "Missing classId" }, 400);
  }
  if (!UUID_RE.test(classId)) {
    return json({ status: "error", message: "classId must be a valid UUID" }, 400);
  }
  if (subjectId && !UUID_RE.test(subjectId)) {
    return json({ status: "error", message: "subjectId must be a valid UUID" }, 400);
  }

  // 3. Class lookup.
  const { data: cls, error: clsErr } = await supabase
        .from("classes")
        .select("id, teacher_id, name, section")
        .eq("id", classId)
        .single();

  if (clsErr || !cls) {
    return json({ status: "error", message: "Class not found" }, 404);
  }

  // 4. Authorization: class teacher, or a teacher assigned to this class/subject.
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
      return json({ status: "error", message: "Failed to verify teacher assignment" }, 500);
    }
    if (!assignments || assignments.length === 0) {
      return json({ status: "error", message: "Teacher is not assigned to this class/subject" }, 403);
    }
  }

  // 5. Session insert.
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
        subject_id: subjectId || null,
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
      return json({ status: "error", message: "Failed to create session" }, 500);
    }

    console.log(`[session-start] code collision on attempt ${attempt + 1}, retrying`);
  }

  if (!session) {
    return json({ status: "error", message: "Failed to create session after retries" }, 500);
  }

  const classLabel = cls.section ? `${cls.name} ${cls.section}` : cls.name;
  notifyEnrolledStudents(supabase, classId, session.id, classLabel);

  return json({
    sessionId: session.id,
    windowStart: session.window_start,
    windowEnd: session.window_end,
    currentCode: session.current_code,
    codeExpiresAt: session.code_expires_at,
  }, 200);

} catch (err) {
  console.error("[session-start] unhandled:", err instanceof Error ? err.stack : err);
  return json({ status: "error", message: "Internal server error" }, 500);
}
});
