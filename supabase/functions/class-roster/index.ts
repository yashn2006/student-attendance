// supabase/functions/class-roster/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const supabaseAdmin = createClient(SUPABASE_URL ?? "", SERVICE_ROLE_KEY ?? "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ status: "error", message: "Missing auth" }, 401);
    }

    const callerClient = createClient(SUPABASE_URL ?? "", ANON_KEY ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !authUser) {
      return jsonResponse({ status: "error", message: "Invalid session" }, 401);
    }

    const { data: teacherRow, error: teacherError } = await supabaseAdmin
      .from("teachers")
      .select("id")
      .eq("supabase_user", authUser.id)
      .single();

    if (teacherError || !teacherRow) {
      return jsonResponse({ status: "error", message: "Not a recognized teacher" }, 403);
    }

    const url = new URL(req.url);
    const classId = url.searchParams.get("class_id");
    if (!classId) {
      return jsonResponse({ status: "error", message: "class_id required" }, 400);
    }

    const { data: classRow, error: classError } = await supabaseAdmin
      .from("classes")
      .select("id, name")
      .eq("id", classId)
      .eq("teacher_id", teacherRow.id)
      .single();

    if (classError || !classRow) {
      return jsonResponse({ status: "error", message: "Class not found or not yours" }, 403);
    }

    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from("class_enrollments")
      .select("student_id")
      .eq("class_id", classId);

    if (enrollError) {
      return jsonResponse({ status: "error", message: enrollError.message }, 500);
    }

    const studentIds = (enrollments ?? []).map((e) => e.student_id);
    if (studentIds.length === 0) {
      return jsonResponse({ status: "ok", className: classRow.name, students: [] }, 200);
    }

    const { data: students, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id, enrollment_no, name, email")
      .in("id", studentIds);

    if (studentError) {
      return jsonResponse({ status: "error", message: studentError.message }, 500);
    }

    const { data: records } = await supabaseAdmin
      .from("attendance_records")
      .select("student_id, status, created_at")
      .in("student_id", studentIds);

    const recordsByStudent: Record<string, typeof records> = {};
    for (const r of records ?? []) {
      (recordsByStudent[r.student_id] ??= []).push(r);
    }

    const result = (students ?? []).map((s) => {
      const studentRecords = recordsByStudent[s.id] ?? [];
      const total = studentRecords.length;
      const present = studentRecords.filter((r) => r.status === "verified" || r.status === "present").length;
      const pct = total > 0 ? Math.round((present / total) * 100) : 100;

      return {
        id: s.id,
        rollNo: s.enrollment_no,
        name: s.name,
        className: classRow.name,
        overallAttendance: pct,
        contactEmail: s.email,
      };
    });

    return jsonResponse({ status: "ok", className: classRow.name, students: result }, 200);
  } catch (err) {
    console.error("UNHANDLED ERROR:", err instanceof Error ? err.stack : err);
    return jsonResponse(
      { status: "error", message: err instanceof Error ? err.message : "Unknown error" },
      500
    );
  }
});