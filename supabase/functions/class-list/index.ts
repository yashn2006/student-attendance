// supabase/functions/class-list/index.ts
// GET — classes the authenticated teacher can run sessions for.
// Admins receive all classes; everyone else receives only their own.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface SubjectInfo {
  id: string;
  name: string;
  code: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ status: "error", message: "Missing auth" }, 401);

    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !authUser) return jsonResponse({ status: "error", message: "Invalid session" }, 401);

    const { data: teacherRow, error: teacherError } = await supabaseAdmin
      .from("teachers")
      .select("id, is_admin")
      .eq("supabase_user", authUser.id)
      .maybeSingle();

    if (teacherError || !teacherRow) {
      return jsonResponse({ status: "error", message: "Not a recognized teacher" }, 403);
    }

    const { data: owned, error: ownedError } = await supabaseAdmin
      .from("classes")
      .select("id")
      .eq("teacher_id", teacherRow.id);
    if (ownedError) {
      console.error("[class-list] owned classes lookup failed:", ownedError.message);
      return jsonResponse({ status: "error", message: "Failed to load classes" }, 500);
    }

    let assignmentsQuery = supabaseAdmin
      .from("class_subject_teachers")
      .select("class_id, subjects(id, name, code)");
    if (!teacherRow.is_admin) assignmentsQuery = assignmentsQuery.eq("teacher_id", teacherRow.id);

    const { data: assignments, error: assignError } = await assignmentsQuery;
    if (assignError) {
      console.error("[class-list] assignments lookup failed:", assignError.message);
      return jsonResponse({ status: "error", message: "Failed to load classes" }, 500);
    }

    const subjectsByClass: Record<string, SubjectInfo[]> = {};
    for (const a of assignments ?? []) {
      const subj = Array.isArray(a.subjects) ? a.subjects[0] : a.subjects;
      if (!subj) continue;
      if (!subjectsByClass[a.class_id]) subjectsByClass[a.class_id] = [];
      if (!subjectsByClass[a.class_id].some((item) => item.id === subj.id)) {
        subjectsByClass[a.class_id].push({
          id: subj.id,
          name: subj.name,
          code: subj.code ?? null,
        });
      }
    }

    const ownedIds = new Set((owned ?? []).map((c) => c.id));
    const teacherClassIds = [...new Set([...ownedIds, ...Object.keys(subjectsByClass)])];

    if (!teacherRow.is_admin && teacherClassIds.length === 0) {
      return jsonResponse({ status: "ok", teacherId: teacherRow.id, classes: [] }, 200);
    }

    let classesQuery = supabaseAdmin
      .from("classes")
      .select("id, name, section, teacher_id");
    if (!teacherRow.is_admin) classesQuery = classesQuery.in("id", teacherClassIds);

    const { data: classes, error: classError } = await classesQuery;
    if (classError) {
      console.error("[class-list] classes lookup failed:", classError.message);
      return jsonResponse({ status: "error", message: "Failed to load classes" }, 500);
    }

    const classIds = (classes ?? []).map((c) => c.id);
    if (classIds.length === 0) {
      return jsonResponse({ status: "ok", teacherId: teacherRow.id, classes: [] }, 200);
    }

    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from("class_enrollments")
      .select("class_id")
      .in("class_id", classIds);
    if (enrollError) {
      console.error("[class-list] enrollment lookup failed:", enrollError.message);
      return jsonResponse({ status: "error", message: "Failed to load classes" }, 500);
    }

    const countByClass: Record<string, number> = {};
    for (const e of enrollments ?? []) {
      countByClass[e.class_id] = (countByClass[e.class_id] ?? 0) + 1;
    }

    const result = (classes ?? [])
      .map((c) => ({
        id: c.id,
        name: c.name,
        section: c.section ?? null,
        studentCount: countByClass[c.id] ?? 0,
        isClassTeacher: c.teacher_id === teacherRow.id,
        subjects: subjectsByClass[c.id] ?? [],
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name) || (a.section ?? "").localeCompare(b.section ?? "")
      );

    return jsonResponse({ status: "ok", teacherId: teacherRow.id, classes: result }, 200);
  } catch (err) {
    console.error("[class-list] unexpected:", err instanceof Error ? err.message : err);
    return jsonResponse({ status: "error", message: "Internal server error" }, 500);
  }
});
