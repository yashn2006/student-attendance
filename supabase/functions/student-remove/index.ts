// supabase/functions/student-remove/index.ts
// Soft removal: deletes the class_enrollments row only. Does NOT delete
// the students row, auth user, or attendance_records.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ status: "error", message: "Missing auth" }, 401);

    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !authUser) return json({ status: "error", message: "Invalid session" }, 401);

    const { data: teacherRow, error: teacherError } = await supabaseAdmin
      .from("teachers")
      .select("id, is_admin")
      .eq("supabase_user", authUser.id)
      .maybeSingle();

    if (teacherError || !teacherRow) {
      return json({ status: "error", message: "Not a recognized teacher" }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ status: "error", message: "Invalid JSON body" }, 400);
    }

    const student_id = typeof body.student_id === "string" ? body.student_id.trim() : "";
    const class_id = typeof body.class_id === "string" ? body.class_id.trim() : "";

    if (!student_id || !class_id) {
      return json({ status: "error", message: "student_id and class_id required" }, 400);
    }
    if (!UUID_RE.test(student_id) || !UUID_RE.test(class_id)) {
      return json({ status: "error", message: "student_id and class_id must be valid UUIDs" }, 400);
    }

    let classQuery = supabaseAdmin
      .from("classes")
      .select("id")
      .eq("id", class_id);
    if (!teacherRow.is_admin) classQuery = classQuery.eq("teacher_id", teacherRow.id);

    const { data: classRow, error: classError } = await classQuery.maybeSingle();
    if (classError) {
      console.error("[student-remove] class lookup failed:", classError.message);
      return json({ status: "error", message: "Failed to load class" }, 500);
    }
    if (!classRow) {
      return json({ status: "error", message: "Class not found or not yours" }, 403);
    }

    const { error: deleteError } = await supabaseAdmin
      .from("class_enrollments")
      .delete()
      .eq("student_id", student_id)
      .eq("class_id", class_id);

    if (deleteError) {
      console.error("[student-remove] delete failed:", deleteError.message);
      return json({ status: "error", message: "Failed to remove student from class" }, 500);
    }

    return json({ status: "ok", message: "Student removed from class" }, 200);
  } catch (err) {
    console.error("[student-remove] unexpected:", err instanceof Error ? err.message : err);
    return json({ status: "error", message: "Internal server error" }, 500);
  }
});
