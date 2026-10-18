// supabase/functions/class-list/index.ts
// GET — classes the authenticated teacher can run sessions for:
//   (a) classes where they are the class teacher (classes.teacher_id)
//   (b) classes where they are assigned a subject (class_subject_teachers)
// Each class includes section, student count, and the subjects THIS teacher
// teaches in it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const supabaseAdmin = createClient(SUPABASE_URL ?? "", SERVICE_ROLE_KEY ?? "");

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

    // (a) classes this teacher is the class teacher of
    const { data: owned, error: ownedError } = await supabaseAdmin
      .from("classes")
      .select("id")
      .eq("teacher_id", teacherRow.id);
    if (ownedError) {
      return jsonResponse({ status: "error", message: ownedError.message }, 500);
    }

    // (b) subjects this teacher is assigned to teach, per class
    const { data: assignments, error: assignError } = await supabaseAdmin
      .from("class_subject_teachers")
      .select("class_id, subjects(id, name, code)")
      .eq("teacher_id", teacherRow.id);
    if (assignError) {
      return jsonResponse({ status: "error", message: assignError.message }, 500);
    }

    const subjectsByClass: Record<string, SubjectInfo[]> = {};
    for (const a of assignments ?? []) {
      const subj = Array.isArray(a.subjects) ? a.subjects[0] : a.subjects;
      if (!subj) continue;
      if (!subjectsByClass[a.class_id]) subjectsByClass[a.class_id] = [];
      subjectsByClass[a.class_id].push({
        id: subj.id,
        name: subj.name,
        code: subj.code ?? null,
      });
    }

    const ownedIds = new Set((owned ?? []).map((c) => c.id));
    const classIds = [...new Set([...ownedIds, ...Object.keys(subjectsByClass)])];

    if (classIds.length === 0) {
      return jsonResponse({ status: "ok", teacherId: teacherRow.id, classes: [] }, 200);
    }

    const { data: classes, error: classError } = await supabaseAdmin
      .from("classes")
      .select("id, name, section")
      .in("id", classIds);
    if (classError) {
      return jsonResponse({ status: "error", message: classError.message }, 500);
    }

    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from("class_enrollments")
      .select("class_id")
      .in("class_id", classIds);
    if (enrollError) {
      return jsonResponse({ status: "error", message: enrollError.message }, 500);
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
        isClassTeacher: ownedIds.has(c.id),
        subjects: subjectsByClass[c.id] ?? [],
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name) || (a.section ?? "").localeCompare(b.section ?? "")
      );

    return jsonResponse({ status: "ok", teacherId: teacherRow.id, classes: result }, 200);
  } catch (err) {
    console.error("UNHANDLED ERROR:", err instanceof Error ? err.stack : err);
    return jsonResponse(
      { status: "error", message: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});