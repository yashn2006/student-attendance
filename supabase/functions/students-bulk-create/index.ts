// supabase/functions/students-bulk-create/index.ts
// Admin-only bulk provisioning of students.

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
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generateTempPassword(): string {
  return crypto.randomUUID().slice(0, 12);
}

interface IncomingRow {
  name?: unknown;
  enrollment_no?: unknown;
  email?: unknown;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ status: "error", message: "Missing auth" }, 401);

    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !authUser) return jsonResponse({ status: "error", message: "Invalid session" }, 401);

    const { data: caller, error: callerError } = await supabaseAdmin
      .from("teachers")
      .select("id, is_admin")
      .eq("supabase_user", authUser.id)
      .maybeSingle();

    if (callerError || !caller || !caller.is_admin) {
      return jsonResponse({ status: "error", message: "Admin access required" }, 403);
    }

    let body: { class_id?: unknown; rows?: unknown };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ status: "error", message: "Invalid JSON body" }, 400);
    }

    const class_id = typeof body.class_id === "string" ? body.class_id.trim() : "";
    const rows = body.rows;

    if (!class_id || !Array.isArray(rows) || rows.length === 0) {
      return jsonResponse(
        { status: "error", message: "class_id and a non-empty rows array are required" },
        400,
      );
    }
    if (!UUID_RE.test(class_id)) {
      return jsonResponse({ status: "error", message: "class_id must be a valid UUID" }, 400);
    }
    if (rows.length > 500) {
      return jsonResponse({ status: "error", message: "Max 500 rows per import" }, 400);
    }

    const { data: classRow, error: classError } = await supabaseAdmin
      .from("classes")
      .select("id")
      .eq("id", class_id)
      .maybeSingle();

    if (classError) {
      console.error("[students-bulk-create] class lookup failed:", classError.message);
      return jsonResponse({ status: "error", message: "Failed to load class" }, 500);
    }
    if (!classRow) {
      return jsonResponse({ status: "error", message: "Class not found" }, 404);
    }

    const created: { enrollment_no: string; name: string; temp_password: string }[] = [];
    const errors: { row: number; enrollment_no: string | null; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 1;
      const raw = (rows[i] ?? {}) as IncomingRow;
      const name = typeof raw.name === "string" ? raw.name.trim() : "";
      const enrollment_no = typeof raw.enrollment_no === "string" ? raw.enrollment_no.trim() : "";
      const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";

      if (!name || !enrollment_no) {
        errors.push({
          row: rowNum,
          enrollment_no: enrollment_no || null,
          reason: "Missing name or enrollment_no",
        });
        continue;
      }
      if (name.length > 120 || enrollment_no.length > 64) {
        errors.push({ row: rowNum, enrollment_no, reason: "Field too long" });
        continue;
      }
      if (email && (email.length > 254 || !EMAIL_RE.test(email))) {
        errors.push({ row: rowNum, enrollment_no, reason: "Invalid email" });
        continue;
      }

      try {
        const { data: existingStudent, error: existingError } = await supabaseAdmin
          .from("students")
          .select("id")
          .eq("enrollment_no", enrollment_no)
          .maybeSingle();

        if (existingError) {
          console.error("[students-bulk-create] duplicate lookup failed:", existingError.message);
          errors.push({ row: rowNum, enrollment_no, reason: "Failed to validate enrollment number" });
          continue;
        }
        if (existingStudent) {
          errors.push({ row: rowNum, enrollment_no, reason: "Enrollment number already exists" });
          continue;
        }

        const syntheticEmail = `${enrollment_no}@students.internal`;
        const tempPassword = generateTempPassword();

        const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
          email: syntheticEmail,
          password: tempPassword,
          email_confirm: true,
        });

        if (createAuthError || !authData.user) {
          console.error("[students-bulk-create] auth creation failed:", createAuthError?.message);
          errors.push({ row: rowNum, enrollment_no, reason: "Failed to create student login" });
          continue;
        }

        const { data: newStudent, error: insertError } = await supabaseAdmin
          .from("students")
          .insert({
            supabase_user: authData.user.id,
            name,
            email: email || null,
            enrollment_no,
            webauthn_registered: false,
          })
          .select("id")
          .single();

        if (insertError || !newStudent) {
          console.error("[students-bulk-create] student insert failed:", insertError?.message);
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          errors.push({ row: rowNum, enrollment_no, reason: "Failed to create student" });
          continue;
        }

        const { error: enrollError } = await supabaseAdmin
          .from("class_enrollments")
          .insert({ class_id, student_id: newStudent.id });

        if (enrollError) {
          console.error("[students-bulk-create] enrollment failed:", enrollError.message);
          await supabaseAdmin.from("students").delete().eq("id", newStudent.id);
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          errors.push({ row: rowNum, enrollment_no, reason: "Failed to enroll student" });
          continue;
        }

        created.push({ enrollment_no, name, temp_password: tempPassword });
      } catch (rowErr) {
        console.error("[students-bulk-create] row error:", rowErr instanceof Error ? rowErr.message : rowErr);
        errors.push({ row: rowNum, enrollment_no: enrollment_no || null, reason: "Failed to create student" });
      }
    }

    return jsonResponse({ status: "ok", created, errors }, 200);
  } catch (err) {
    console.error("[students-bulk-create] unexpected:", err instanceof Error ? err.message : err);
    return jsonResponse({ status: "error", message: "Internal server error" }, 500);
  }
});
