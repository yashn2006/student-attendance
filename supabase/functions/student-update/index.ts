// supabase/functions/student-update/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
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
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const enrollment_no = typeof body.enrollment_no === "string" ? body.enrollment_no.trim() : "";

    if (!student_id) return json({ status: "error", message: "student_id required" }, 400);
    if (!UUID_RE.test(student_id)) {
      return json({ status: "error", message: "student_id must be a valid UUID" }, 400);
    }
    if (!name && !email && !enrollment_no) {
      return json({ status: "error", message: "Nothing to update" }, 400);
    }
    if (name && name.length > 120) {
      return json({ status: "error", message: "name is too long" }, 400);
    }
    if (email && (email.length > 254 || !EMAIL_RE.test(email))) {
      return json({ status: "error", message: "Invalid email" }, 400);
    }
    if (enrollment_no && enrollment_no.length > 64) {
      return json({ status: "error", message: "enrollment_no is too long" }, 400);
    }

    if (!teacherRow.is_admin) {
      const { data: enrollment, error: enrollError } = await supabaseAdmin
        .from("class_enrollments")
        .select("class_id, classes!inner(teacher_id)")
        .eq("student_id", student_id)
        .eq("classes.teacher_id", teacherRow.id)
        .maybeSingle();

      if (enrollError) {
        console.error("[student-update] enrollment lookup failed:", enrollError.message);
        return json({ status: "error", message: "Failed to authorize request" }, 500);
      }
      if (!enrollment) {
        return json({ status: "error", message: "Student not found or not yours" }, 403);
      }
    }

    if (enrollment_no) {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from("students")
        .select("id")
        .eq("enrollment_no", enrollment_no)
        .neq("id", student_id)
        .maybeSingle();

      if (existingError) {
        console.error("[student-update] duplicate lookup failed:", existingError.message);
        return json({ status: "error", message: "Failed to check enrollment number" }, 500);
      }
      if (existing) {
        return json(
          { status: "error", message: "Another student already has this enrollment number" },
          409,
        );
      }
    }

    const updateFields: Record<string, string> = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (enrollment_no) updateFields.enrollment_no = enrollment_no;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("students")
      .update(updateFields)
      .eq("id", student_id)
      .select("id, name, email, enrollment_no")
      .single();

    if (updateError || !updated) {
      console.error("[student-update] update failed:", updateError?.message);
      return json({ status: "error", message: "Failed to update student" }, 500);
    }

    return json({ status: "ok", student: updated }, 200);
  } catch (err) {
    console.error("[student-update] unexpected:", err instanceof Error ? err.message : err);
    return json({ status: "error", message: "Internal server error" }, 500);
  }
});
