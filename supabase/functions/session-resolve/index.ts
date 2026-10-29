// POST /functions/v1/session-resolve
// Resolves a typed 6-digit code or scanned sessionId for the authenticated
// student. Students must be enrolled in the session's class.

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE_RE = /^\d{6}$/;
const GRACE_MS = 15_000;

function codeStillValid(
  s: {
    current_code?: string | null;
    code_expires_at?: string | null;
    previous_code?: string | null;
    previous_code_valid_until?: string | null;
  },
  code: string,
  nowMs: number,
): boolean {
  const currentOk = s.current_code === code
    && !!s.code_expires_at
    && nowMs < new Date(s.code_expires_at).getTime() + GRACE_MS;
  const previousOk = !!s.previous_code
    && s.previous_code === code
    && !!s.previous_code_valid_until
    && nowMs < new Date(s.previous_code_valid_until).getTime();
  return currentOk || previousOk;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

interface ResolveRequest {
  code?: unknown;
  sessionId?: unknown;
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

    const { data: studentRow, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("supabase_user", authUser.id)
      .maybeSingle();

    if (studentError) {
      console.error("[session-resolve] student lookup failed:", studentError.message);
      return json({ status: "error", message: "Failed to authorize request" }, 500);
    }
    if (!studentRow) return json({ status: "error", message: "Not a recognized student" }, 403);

    let body: ResolveRequest;
    try {
      body = await req.json();
    } catch {
      return json({ status: "error", message: "Invalid JSON body" }, 400);
    }

    const code = typeof body.code === "string" ? body.code.trim() : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";

    if (!code && !sessionId) {
      return json({ status: "error", message: "Either code or sessionId is required" }, 400);
    }
    if (code && sessionId) {
      return json({ status: "error", message: "Provide either code or sessionId, not both" }, 400);
    }
    if (code && !CODE_RE.test(code)) {
      return json({ status: "error", message: "code must be 6 digits" }, 400);
    }
    if (sessionId && !UUID_RE.test(sessionId)) {
      return json({ status: "error", message: "sessionId must be a valid UUID" }, 400);
    }

    let session: {
      id: string;
      class_id: string;
      teacher_id: string;
      status: string;
      window_end: string | null;
      current_code?: string;
      code_expires_at?: string | null;
      previous_code?: string | null;
      previous_code_valid_until?: string | null;
    } | null = null;

    if (sessionId) {
      const { data, error } = await supabase
        .from("sessions")
        .select("id, class_id, teacher_id, status, window_end")
        .eq("id", sessionId)
        .maybeSingle();

      if (error) {
        console.error("[session-resolve] session lookup failed:", error.message);
        return json({ status: "error", message: "Failed to load session" }, 500);
      }
      session = data;
    } else {
      const { data, error } = await supabase
        .from("sessions")
        .select("id, class_id, teacher_id, status, window_end, current_code, code_expires_at, previous_code, previous_code_valid_until")
        .or(`current_code.eq.${code},previous_code.eq.${code}`)
        .eq("status", "active");

      if (error) {
        console.error("[session-resolve] code lookup failed:", error.message);
        return json({ status: "error", message: "Failed to load session" }, 500);
      }
      const nowMs = Date.now();
      session = (data ?? []).find((s) => codeStillValid(s, code, nowMs)) ?? null;
    }

    if (!session) {
      return json({ status: "error", message: "Invalid or expired code" }, 404);
    }

    const now = Date.now();
    const expired = session.status !== "active"
      || (session.window_end && new Date(session.window_end).getTime() < now);

    if (expired) {
      if (session.status === "active") {
        const { error: closeErr } = await supabase
          .from("sessions")
          .update({ status: "closed" })
          .eq("id", session.id);
        if (closeErr) console.error("[session-resolve] close error:", closeErr.message);
      }
      return json({ status: "error", message: "This session has ended" }, 410);
    }

    const { data: enrollment, error: enrollError } = await supabase
      .from("class_enrollments")
      .select("class_id")
      .eq("class_id", session.class_id)
      .eq("student_id", studentRow.id)
      .maybeSingle();

    if (enrollError) {
      console.error("[session-resolve] enrollment lookup failed:", enrollError.message);
      return json({ status: "error", message: "Failed to authorize request" }, 500);
    }
    if (!enrollment) {
      return json({ status: "error", message: "You are not enrolled in this session's class" }, 403);
    }

    return json({
      sessionId: session.id,
      classId: session.class_id,
      teacherId: session.teacher_id,
      windowEnd: session.window_end,
    }, 200);
  } catch (err) {
    console.error("[session-resolve] unexpected:", err instanceof Error ? err.message : err);
    return json({ status: "error", message: "Internal server error" }, 500);
  }
});
