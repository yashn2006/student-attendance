// supabase/functions/student-update/index.ts
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

    const body = await req.json();
    const { student_id, name, email, enrollment_no } = body;

    if (!student_id) {
      return new Response(JSON.stringify({ status: "error", message: "student_id required" }), { status: 400 });
    }
    if (!name && !email && !enrollment_no) {
      return new Response(JSON.stringify({ status: "error", message: "Nothing to update" }), { status: 400 });
    }

    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from("class_enrollments")
      .select("class_id, classes!inner(teacher_id)")
      .eq("student_id", student_id)
      .eq("classes.teacher_id", teacherRow.id)
      .maybeSingle();

    if (enrollError || !enrollment) {
      return new Response(JSON.stringify({ status: "error", message: "Student not found or not yours" }), { status: 403 });
    }

    if (enrollment_no) {
      const { data: existing } = await supabaseAdmin
        .from("students")
        .select("id")
        .eq("enrollment_no", enrollment_no)
        .neq("id", student_id)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ status: "error", message: "Another student already has this enrollment number" }),
          { status: 409 }
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
      return new Response(
        JSON.stringify({ status: "error", message: updateError?.message ?? "Update failed" }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ status: "ok", student: updated }), { status: 200 });
  } catch (err) {
    console.error("UNHANDLED ERROR:", err instanceof Error ? err.stack : err);
    return new Response(
      JSON.stringify({ status: "error", message: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500 }
    );
  }
});