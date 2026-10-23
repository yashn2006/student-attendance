// supabase/functions/create-student/index.ts
// Admin-only provisioning of a student auth user + students row + enrollment.

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

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ status: "error", message: "Invalid JSON body" }, 400);
    }

    const enrollment_no = typeof body.enrollment_no === "string" ? body.enrollment_no.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const class_id = typeof body.class_id === "string" ? body.class_id.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!enrollment_no || !name || !class_id) {
      return jsonResponse({ status: "error", message: "enrollment_no, name, class_id required" }, 400);
    }
    if (enrollment_no.length > 64) {
      return jsonResponse({ status: "error", message: "enrollment_no is too long" }, 400);
    }
    if (name.length > 120) {
      return jsonResponse({ status: "error", message: "name is too long" }, 400);
    }
    if (!UUID_RE.test(class_id)) {
      return jsonResponse({ status: "error", message: "class_id must be a valid UUID" }, 400);
    }
    if (email && (email.length > 254 || !EMAIL_RE.test(email))) {
      return jsonResponse({ status: "error", message: "Invalid email" }, 400);
    }

    const { data: classRow, error: classError } = await supabaseAdmin
      .from("classes")
      .select("id")
      .eq("id", class_id)
      .maybeSingle();

    if (classError || !classRow) {
      return jsonResponse({ status: "error", message: "Class not found" }, 404);
    }

    const { data: existingStudent, error: existingError } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("enrollment_no", enrollment_no)
      .maybeSingle();

    if (existingError) {
      console.error("[create-student] duplicate lookup failed:", existingError.message);
      return jsonResponse({ status: "error", message: "Failed to check enrollment number" }, 500);
    }
    if (existingStudent) {
      return jsonResponse({ status: "error", message: "A student with this enrollment number already exists" }, 409);
    }

    const syntheticEmail = `${enrollment_no}@students.internal`;
    const tempPassword = generateTempPassword();

    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: syntheticEmail,
      password: tempPassword,
      email_confirm: true,
    });

    if (createAuthError || !authData.user) {
      console.error("[create-student] auth user creation failed:", createAuthError?.message);
      return jsonResponse({ status: "error", message: "Failed to create student login" }, 500);
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
      console.error("[create-student] student insert failed:", insertError?.message);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return jsonResponse({ status: "error", message: "Failed to create student" }, 500);
    }

    const { error: enrollError } = await supabaseAdmin
      .from("class_enrollments")
      .insert({ class_id, student_id: newStudent.id });

    if (enrollError) {
      console.error("[create-student] enrollment insert failed:", enrollError.message);
      await supabaseAdmin.from("students").delete().eq("id", newStudent.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return jsonResponse({ status: "error", message: "Failed to enroll student" }, 500);
    }

    return jsonResponse({ status: "ok", enrollment_no, temp_password: tempPassword }, 200);
  } catch (err) {
    console.error("[create-student] unexpected:", err instanceof Error ? err.message : err);
    return jsonResponse({ status: "error", message: "Internal server error" }, 500);
  }
});
