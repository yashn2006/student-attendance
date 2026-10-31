// POST /functions/v1/student-device-reset
// Admin-only: clears a student's registered device so they can register again.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  ?? (Deno.env.get("SUPABASE_SECRET_KEYS")
    ? JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!).default
    : "");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

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

    const { data: teacherRow, error: teacherError } = await supabase
      .from("teachers")
      .select("id, is_admin")
      .eq("supabase_user", authUser.id)
      .maybeSingle();

    if (teacherError || !teacherRow || !teacherRow.is_admin) {
      return json({ status: "error", message: "Admin access required" }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ status: "error", message: "Invalid JSON body" }, 400);
    }

    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    if (!studentId || !UUID_RE.test(studentId)) {
      return json({ status: "error", message: "studentId must be a valid UUID" }, 400);
    }

    const { data: studentRow, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("id", studentId)
      .maybeSingle();

    if (studentError) {
      console.error("[student-device-reset] student lookup failed:", studentError.message);
      return json({ status: "error", message: "Failed to load student" }, 500);
    }
    if (!studentRow) {
      return json({ status: "error", message: "Student not found" }, 404);
    }

    const { error: bindingDeleteErr } = await supabase
      .from("device_bindings")
      .delete()
      .eq("student_id", studentId);

    if (bindingDeleteErr) {
      console.error("[student-device-reset] device binding delete failed:", bindingDeleteErr.message);
      return json({ status: "error", message: "Failed to reset device" }, 500);
    }

    const { error: flagUpdateErr } = await supabase
      .from("students")
      .update({ webauthn_registered: false })
      .eq("id", studentId);

    if (flagUpdateErr) {
      console.error("[student-device-reset] flag update failed:", flagUpdateErr.message);
      return json({ status: "error", message: "Failed to reset device" }, 500);
    }

    const { error: challengeDeleteErr } = await supabase
      .from("webauthn_challenges")
      .delete()
      .eq("student_id", studentId);

    if (challengeDeleteErr) {
      console.error("[student-device-reset] challenge delete failed:", challengeDeleteErr.message);
      return json({ status: "error", message: "Failed to reset device" }, 500);
    }

    const { error: logInsertErr } = await supabase
      .from("device_reset_log")
      .insert({ student_id: studentId, reset_by: teacherRow.id });

    if (logInsertErr) {
      console.error("[student-device-reset] reset log insert failed:", logInsertErr.message);
      return json({ status: "error", message: "Failed to reset device" }, 500);
    }

    return json({ status: "reset" }, 200);
  } catch (err) {
    console.error("[student-device-reset] unexpected:", err instanceof Error ? err.message : err);
    return json({ status: "error", message: "Internal server error" }, 500);
  }
});
