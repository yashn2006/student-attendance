// supabase/functions/students-list/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const supabaseAdmin = createClient(SUPABASE_URL ?? "", SERVICE_ROLE_KEY ?? "");

const AT_RISK_THRESHOLD = 75;
const CRITICAL_THRESHOLD = 60;

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

function statusTagFor(pct: number): string {
  if (pct >= 90) return "Excellent";
  if (pct >= AT_RISK_THRESHOLD) return "Regular";
  if (pct >= CRITICAL_THRESHOLD) return "At Risk";
  return "Critical Defaulter";
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
    const classIdFilter = url.searchParams.get("class_id");

    let classQuery = supabaseAdmin.from("classes").select("id, name").eq("teacher_id", teacherRow.id);
    if (classIdFilter) classQuery = classQuery.eq("id", classIdFilter);
    const { data: classes, error: classError } = await classQuery;

    if (classError) {
      return jsonResponse({ status: "error", message: classError.message }, 500);
    }
    if (!classes || classes.length === 0) {
      return jsonResponse({ status: "ok", students: [] }, 200);
    }

    const classIds = classes.map((c) => c.id);
    const classNameById = Object.fromEntries(classes.map((c) => [c.id, c.name]));

    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from("class_enrollments")
      .select("class_id, student_id")
      .in("class_id", classIds);

    if (enrollError) {
      return jsonResponse({ status: "error", message: enrollError.message }, 500);
    }
    if (!enrollments || enrollments.length === 0) {
      return jsonResponse({ status: "ok", students: [] }, 200);
    }

    const studentIds = [...new Set(enrollments.map((e) => e.student_id))];
    const classIdByStudentId = Object.fromEntries(enrollments.map((e) => [e.student_id, e.class_id]));

    const { data: students, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id, enrollment_no, name, email")
      .in("id", studentIds);

    if (studentError) {
      return jsonResponse({ status: "error", message: studentError.message }, 500);
    }

    const { data: records, error: recordsError } = await supabaseAdmin
      .from("attendance_records")
      .select("student_id, status, created_at")
      .in("student_id", studentIds);

    if (recordsError) {
      return jsonResponse({ status: "error", message: recordsError.message }, 500);
    }

    const recordsByStudent: Record<string, typeof records> = {};
    for (const r of records ?? []) {
      (recordsByStudent[r.student_id] ??= []).push(r);
    }

    const result = (students ?? []).map((s) => {
      const studentRecords = recordsByStudent[s.id] ?? [];
      const total = studentRecords.length;
      const present = studentRecords.filter((r) => r.status === "verified" || r.status === "present").length;
      const pct = total > 0 ? Math.round((present / total) * 100) : 100;
      const lastPresent = studentRecords
        .filter((r) => r.status === "verified" || r.status === "present")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    return {
        id: s.id,
        classId: classIdByStudentId[s.id] ?? null,
        rollNo: s.enrollment_no,
        name: s.name,
        className: classNameById[classIdByStudentId[s.id]] ?? null,
        overallAttendance: pct,
        isDefaulter: pct < AT_RISK_THRESHOLD,
        statusTag: statusTagFor(pct),
        contactEmail: s.email,
        lastPresentTime: lastPresent?.created_at ?? null,
      };
    });

    return jsonResponse({ status: "ok", students: result }, 200);
  } catch (err) {
    console.error("UNHANDLED ERROR:", err instanceof Error ? err.stack : err);
    return jsonResponse(
      { status: "error", message: err instanceof Error ? err.message : "Unknown error" },
      500
    );
  }
});