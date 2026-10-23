// supabase/functions/attendance-history/index.ts
// GET ?session_id=uuid OR ?student_id=uuid (exactly one required)
// Students may read only their own history. Teachers may read their own
// sessions / their class roster. Admins may read anything.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
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
    if (teacherError) {
      console.error("[attendance-history] teacher lookup failed:", teacherError.message);
      return json({ status: "error", message: "Failed to authorize request" }, 500);
    }

    const { data: studentRow, error: studentError } = teacherRow
      ? { data: null, error: null }
      : await supabaseAdmin
        .from("students")
        .select("id")
        .eq("supabase_user", authUser.id)
        .maybeSingle();

    if (studentError) {
      console.error("[attendance-history] student lookup failed:", studentError.message);
      return json({ status: "error", message: "Failed to authorize request" }, 500);
    }
    if (!teacherRow && !studentRow) {
      return json({ status: "error", message: "Not a recognized user" }, 403);
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");
    const requestedStudentId = url.searchParams.get("student_id");

    if (!sessionId && !requestedStudentId) {
      return json({ status: "error", message: "session_id or student_id required" }, 400);
    }
    if (sessionId && requestedStudentId) {
      return json({ status: "error", message: "Provide only one of session_id / student_id" }, 400);
    }
    if (sessionId && !UUID_RE.test(sessionId)) {
      return json({ status: "error", message: "session_id must be a valid UUID" }, 400);
    }
    if (requestedStudentId && !UUID_RE.test(requestedStudentId)) {
      return json({ status: "error", message: "student_id must be a valid UUID" }, 400);
    }

    let recordsQuery = supabaseAdmin.from("attendance_records").select("*");
    let flagsQuery = supabaseAdmin.from("attendance_flags").select("*");

    if (teacherRow) {
      const isAdmin = Boolean(teacherRow.is_admin);

      if (sessionId) {
        const { data: session, error: sessionError } = await supabaseAdmin
          .from("sessions")
          .select("id, teacher_id, classes(teacher_id)")
          .eq("id", sessionId)
          .maybeSingle();

        if (sessionError) {
          console.error("[attendance-history] session lookup failed:", sessionError.message);
          return json({ status: "error", message: "Failed to load session" }, 500);
        }
        if (!session) return json({ status: "error", message: "Session not found" }, 404);

        const cls = Array.isArray((session as any).classes)
          ? (session as any).classes[0]
          : (session as any).classes;
        const ownsSession =
          session.teacher_id === teacherRow.id || cls?.teacher_id === teacherRow.id;

        if (!isAdmin && !ownsSession) {
          return json({ status: "error", message: "You do not have access to this session" }, 403);
        }

        recordsQuery = recordsQuery.eq("session_id", sessionId);
        flagsQuery = flagsQuery.eq("session_id", sessionId);
      } else {
        const targetStudentId = requestedStudentId!;

        if (!isAdmin) {
          const { data: enrollment, error: enrollError } = await supabaseAdmin
            .from("class_enrollments")
            .select("class_id, classes!inner(teacher_id)")
            .eq("student_id", targetStudentId)
            .eq("classes.teacher_id", teacherRow.id)
            .maybeSingle();

          if (enrollError) {
            console.error("[attendance-history] enrollment lookup failed:", enrollError.message);
            return json({ status: "error", message: "Failed to authorize request" }, 500);
          }
          if (!enrollment) {
            return json({ status: "error", message: "Student not found in your classes" }, 403);
          }
        }

        recordsQuery = recordsQuery.eq("student_id", targetStudentId);
        flagsQuery = flagsQuery.or(
          `flagged_student_id.eq.${targetStudentId},conflicting_student_id.eq.${targetStudentId}`,
        );
      }
    } else {
      const ownStudentId = studentRow!.id;

      if (requestedStudentId && requestedStudentId !== ownStudentId) {
        return json({ status: "error", message: "You can only view your own attendance" }, 403);
      }

      if (sessionId) {
        const { data: session, error: sessionError } = await supabaseAdmin
          .from("sessions")
          .select("id, class_id")
          .eq("id", sessionId)
          .maybeSingle();

        if (sessionError) {
          console.error("[attendance-history] session lookup failed:", sessionError.message);
          return json({ status: "error", message: "Failed to load session" }, 500);
        }
        if (!session) return json({ status: "error", message: "Session not found" }, 404);

        const { data: enrollment, error: enrollError } = await supabaseAdmin
          .from("class_enrollments")
          .select("class_id")
          .eq("class_id", session.class_id)
          .eq("student_id", ownStudentId)
          .maybeSingle();

        if (enrollError) {
          console.error("[attendance-history] enrollment lookup failed:", enrollError.message);
          return json({ status: "error", message: "Failed to authorize request" }, 500);
        }
        if (!enrollment) {
          return json({ status: "error", message: "You are not enrolled in this session's class" }, 403);
        }

        recordsQuery = recordsQuery.eq("session_id", sessionId).eq("student_id", ownStudentId);
        flagsQuery = flagsQuery
          .eq("session_id", sessionId)
          .or(`flagged_student_id.eq.${ownStudentId},conflicting_student_id.eq.${ownStudentId}`);
      } else {
        recordsQuery = recordsQuery.eq("student_id", ownStudentId);
        flagsQuery = flagsQuery.or(
          `flagged_student_id.eq.${ownStudentId},conflicting_student_id.eq.${ownStudentId}`,
        );
      }
    }

    const { data: records, error: recordsError } = await recordsQuery;
    if (recordsError) {
      console.error("[attendance-history] records lookup failed:", recordsError.message);
      return json({ status: "error", message: "Failed to load attendance history" }, 500);
    }

    const { data: flags, error: flagsError } = await flagsQuery;
    if (flagsError) {
      console.error("[attendance-history] flags lookup failed:", flagsError.message);
      return json({ status: "error", message: "Failed to load attendance history" }, 500);
    }

    return json({ status: "ok", records: records ?? [], flags: flags ?? [] }, 200);
  } catch (err) {
    console.error("[attendance-history] unexpected:", err instanceof Error ? err.message : err);
    return json({ status: "error", message: "Internal server error" }, 500);
  }
});
