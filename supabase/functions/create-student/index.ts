// supabase/functions/create-student/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

console.log("Function boot - env check:", {
  hasUrl: !!SUPABASE_URL,
  hasServiceKey: !!SERVICE_ROLE_KEY,
});

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    console.log("Request received");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("No auth header");
      return jsonResponse({ status: "error", message: "Missing auth" }, 401);
    }

    const callerClient = createClient(
      SUPABASE_URL ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: authUser }, error: authError } = await callerClient.auth.getUser();
    console.log("Auth check:", { hasUser: !!authUser, authError: authError?.message });

    if (authError || !authUser) {
      return jsonResponse({ status: "error", message: "Invalid session" }, 401);
    }

    const { data: teacherRow, error: teacherError } = await supabaseAdmin
      .from("teachers")
      .select("id")
      .eq("supabase_user", authUser.id)
      .single();

    console.log("Teacher lookup:", { teacherRow, teacherError: teacherError?.message });

    if (teacherError || !teacherRow) {
      return jsonResponse({ status: "error", message: "Not a recognized teacher" }, 403);
    }

    const body = await req.json();
    console.log("Request body:", body);
    const { enrollment_no, name, class_id, email } = body;

    if (!enrollment_no || !name || !class_id) {
      return jsonResponse({ status: "error", message: "enrollment_no, name, class_id required" }, 400);
    }

    const { data: classRow, error: classError } = await supabaseAdmin
      .from("classes")
      .select("id")
      .eq("id", class_id)
      .eq("teacher_id", teacherRow.id)
      .single();

    console.log("Class check:", { classRow, classError: classError?.message });

    if (classError || !classRow) {
      return jsonResponse({ status: "error", message: "Class not found or not yours" }, 403);
    }

    const { data: existingStudent } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("enrollment_no", enrollment_no)
      .maybeSingle();

    if (existingStudent) {
      console.log("Duplicate enrollment_no");
      return jsonResponse({ status: "error", message: "A student with this enrollment number already exists" }, 409);
    }

    const syntheticEmail = `${enrollment_no}@students.internal`;
    const tempPassword = generateTempPassword();

    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: syntheticEmail,
      password: tempPassword,
      email_confirm: true,
    });

    console.log("Auth user creation:", { hasUser: !!authData?.user, createAuthError: createAuthError?.message });

    if (createAuthError || !authData.user) {
      return jsonResponse({ status: "error", message: createAuthError?.message ?? "Failed to create login" }, 500);
    }

    const { data: newStudent, error: insertError } = await supabaseAdmin
      .from("students")
      .insert({
        supabase_user: authData.user.id,
        name,
        email: email ?? null,
        enrollment_no,
        webauthn_registered: false,
      })
      .select("id")
      .single();

    console.log("Student insert:", { newStudent, insertError: insertError?.message });

    if (insertError || !newStudent) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return jsonResponse({ status: "error", message: insertError?.message ?? "Failed to create student row" }, 500);
    }

    const { error: enrollError } = await supabaseAdmin
      .from("class_enrollments")
      .insert({ class_id, student_id: newStudent.id });

    console.log("Enrollment insert:", { enrollError: enrollError?.message });

    if (enrollError) {
      return jsonResponse({ status: "error", message: `Student created but enrollment failed: ${enrollError.message}` }, 500);
    }

    console.log("Success");
    return jsonResponse({ status: "ok", enrollment_no, temp_password: tempPassword }, 200);
  } catch (err) {
    console.error("UNHANDLED ERROR:", err instanceof Error ? err.stack : err);
    return jsonResponse({ status: "error", message: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});