// supabase/functions/teacher-my-classes/index.ts
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

    // Primary source: class_subject_teachers (subject-aware).
    const { data: cst, error: cstError } = await supabaseAdmin
      .from("class_subject_teachers")
      .select(`
        class_id,
        classes ( id, name ),
        subject_id,
        subjects ( id, name, code )
      `)
      .eq("teacher_id", teacherRow.id);

    if (cstError) {
      return jsonResponse({ status: "error", message: cstError.message }, 500);
    }

    let classMap = new Map<string, { classId: string; className: string; subjects: any[] }>();

    for (const row of cst ?? []) {
      const cls = row.classes as unknown as { id: string; name: string } | null;
      const subj = row.subjects as unknown as { id: string; name: string; code: string } | null;
      if (!cls) continue;

      if (!classMap.has(cls.id)) {
        classMap.set(cls.id, { classId: cls.id, className: cls.name, subjects: [] });
      }
      if (subj) {
        classMap.get(cls.id)!.subjects.push({
          subjectId: subj.id,
          name: subj.name,
          code: subj.code,
        });
      }
    }

    // Fallback: if this teacher has no class_subject_teachers rows yet
    // (not seeded), fall back to the legacy classes.teacher_id model so
    // the dashboard still shows something real instead of nothing.
    if (classMap.size === 0) {
      const { data: legacyClasses, error: legacyError } = await supabaseAdmin
        .from("classes")
        .select("id, name")
        .eq("teacher_id", teacherRow.id);

      if (legacyError) {
        return jsonResponse({ status: "error", message: legacyError.message }, 500);
      }

      for (const c of legacyClasses ?? []) {
        classMap.set(c.id, { classId: c.id, className: c.name, subjects: [] });
      }
    }

    const classIds = Array.from(classMap.keys());

    // Attach live student counts per class.
    if (classIds.length > 0) {
      const { data: enrollments } = await supabaseAdmin
        .from("class_enrollments")
        .select("class_id")
        .in("class_id", classIds);

      const countByClass: Record<string, number> = {};
      for (const e of enrollments ?? []) {
        countByClass[e.class_id] = (countByClass[e.class_id] ?? 0) + 1;
      }

      for (const [id, val] of classMap) {
        (val as any).studentCount = countByClass[id] ?? 0;
      }
    }

    return jsonResponse(
      { status: "ok", classes: Array.from(classMap.values()) },
      200
    );
  } catch (err) {
    console.error("UNHANDLED ERROR:", err instanceof Error ? err.stack : err);
    return jsonResponse(
      { status: "error", message: err instanceof Error ? err.message : "Unknown error" },
      500
    );
  }
});