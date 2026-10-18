// supabase/functions/students-bulk-create/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const supabaseAdmin = createClient(SUPABASE_URL ?? "", SERVICE_ROLE_KEY ?? "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
  name?: string;
  enrollment_no?: string;
  email?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
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

    const body = await req.json();
    const { class_id, rows } = body as { class_id?: string; rows?: IncomingRow[] };

    if (!class_id || !Array.isArray(rows) || rows.length === 0) {
      return jsonResponse({ status: "error", message: "class_id and a non-empty rows array are required" }, 400);
    }

    if (rows.length > 500) {
      return jsonResponse({ status: "error", message: "Max 500 rows per import" }, 400);
    }

    // Verify class ownership once, up front.
    const { data: classRow, error: classError } = await supabaseAdmin
      .from("classes")
      .select("id")
      .eq("id", class_id)
      .eq("teacher_id", teacherRow.id)
      .single();

    if (classError || !classRow) {
      return jsonResponse({ status: "error", message: "Class not found or not yours" }, 403);
    }

    const created: { enrollment_no: string; name: string; temp_password: string }[] = [];
    const errors: { row: number; enrollment_no: string | null; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 1; // 1-indexed for human-facing error messages
      const raw = rows[i] ?? {};
      const name = (raw.name ?? "").trim();
      const enrollment_no = (raw.enrollment_no ?? "").trim();
      const email = (raw.email ?? "").trim();

      if (!name || !enrollment_no) {
        errors.push({ row: rowNum, enrollment_no: enrollment_no || null, reason: "Missing name or enrollment_no" });
        continue;
      }

      try {
        const { data: existingStudent } = await supabaseAdmin
          .from("students")
          .select("id")
          .eq("enrollment_no", enrollment_no)
          .maybeSingle();

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
          errors.push({ row: rowNum, enrollment_no, reason: createAuthError?.message ?? "Failed to create login" });
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
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          errors.push({ row: rowNum, enrollment_no, reason: insertError?.message ?? "Failed to create student row" });
          continue;
        }

        const { error: enrollError } = await supabaseAdmin
          .from("class_enrollments")
          .insert({ class_id, student_id: newStudent.id });

        if (enrollError) {
          errors.push({ row: rowNum, enrollment_no, reason: `Created but enrollment failed: ${enrollError.message}` });
          continue;
        }

        created.push({ enrollment_no, name, temp_password: tempPassword });
      } catch (rowErr) {
        errors.push({
          row: rowNum,
          enrollment_no: enrollment_no || null,
          reason: rowErr instanceof Error ? rowErr.message : "Unknown error",
        });
      }
    }

    return jsonResponse({ status: "ok", created, errors }, 200);
  } catch (err) {
    console.error("UNHANDLED ERROR:", err instanceof Error ? err.stack : err);
    return jsonResponse({ status: "error", message: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});