// supabase/functions/attendance-history/index.ts
// GET ?session_id=xxx  OR  ?student_id=xxx  (exactly one required)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const supabaseAdmin = createClient(SUPABASE_URL ?? "", SERVICE_ROLE_KEY ?? "");

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ status: "error", message: "Missing auth" }), { status: 401 });
    }

    const callerClient = createClient(SUPABASE_URL ?? "", ANON_KEY ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !authUser) {
      return new Response(JSON.stringify({ status: "error", message: "Invalid session" }), { status: 401 });
    }

    const { data: teacherRow, error: teacherError } = await supabaseAdmin
      .from("teachers")
      .select("id")
      .eq("supabase_user", authUser.id)
      .single();

    if (teacherError || !teacherRow) {
      return new Response(JSON.stringify({ status: "error", message: "Not a recognized teacher" }), { status: 403 });
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");
    const studentId = url.searchParams.get("student_id");

    if (!sessionId && !studentId) {
      return new Response(JSON.stringify({ status: "error", message: "session_id or student_id required" }), { status: 400 });
    }
    if (sessionId && studentId) {
      return new Response(JSON.stringify({ status: "error", message: "Provide only one of session_id / student_id" }), { status: 400 });
    }

    if (sessionId) {
      const { data: sessionRow, error: sessionError } = await supabaseAdmin
        .from("sessions")
        .select("id")
        .eq("id", sessionId)
        .eq("teacher_id", teacherRow.id)
        .single();

      if (sessionError || !sessionRow) {
        return new Response(JSON.stringify({ status: "error", message: "Session not found or not yours" }), { status: 403 });
      }
    } else if (studentId) {
      const { data: enrollment, error: enrollError } = await supabaseAdmin
        .from("class_enrollments")
        .select("class_id, classes!inner(teacher_id)")
        .eq("student_id", studentId)
        .eq("classes.teacher_id", teacherRow.id)
        .maybeSingle();

      if (enrollError || !enrollment) {
        return new Response(JSON.stringify({ status: "error", message: "Student not found or not yours" }), { status: 403 });
      }
    }

    let recordsQuery = supabaseAdmin.from("attendance_records").select("*");
    let flagsQuery = supabaseAdmin.from("attendance_flags").select("*");

    if (sessionId) {
      recordsQuery = recordsQuery.eq("session_id", sessionId);
      flagsQuery = flagsQuery.eq("session_id", sessionId);
    } else {
      recordsQuery = recordsQuery.eq("student_id", studentId);
      flagsQuery = flagsQuery.or(`flagged_student_id.eq.${studentId},conflicting_student_id.eq.${studentId}`);
    }

    const { data: records, error: recordsError } = await recordsQuery;
    if (recordsError) {
      return new Response(JSON.stringify({ status: "error", message: recordsError.message }), { status: 500 });
    }

    const { data: flags, error: flagsError } = await flagsQuery;
    if (flagsError) {
      return new Response(JSON.stringify({ status: "error", message: flagsError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ status: "ok", records: records ?? [], flags: flags ?? [] }), { status: 200 });
  } catch (err) {
    console.error("UNHANDLED ERROR:", err instanceof Error ? err.stack : err);
    return new Response(
      JSON.stringify({ status: "error", message: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500 }
    );
  }
});