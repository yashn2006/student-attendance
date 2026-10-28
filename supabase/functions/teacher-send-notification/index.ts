// POST /functions/v1/teacher-send-notification
// Teacher sends one notification message to all students of a class.
//
// Identity is derived ONLY from the verified JWT. Any teacher id supplied in
// the body is ignored, so a caller cannot send messages as another teacher.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  ?? (Deno.env.get("SUPABASE_SECRET_KEYS")
    ? (JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)).default
    : "");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, x-client-info, apikey, Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TITLE_MAX = 120;
const BODY_MAX = 1000;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

interface SendNotificationRequest {
  classId: string;
  title: string;
  body: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ status: "error", message: "Method not allowed" }, 405);
  }

  try {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return json({ status: "error", message: "Internal server error" }, 500);
    }

    // 1. Verify the caller's JWT. Identity must come from the token only.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ status: "error", message: "Missing auth" }, 401);
    }

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !authUser) {
      return json({ status: "error", message: "Invalid session" }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Resolve the caller's teacher row from the auth user id.
    const { data: teacherRow, error: teacherError } = await supabase
      .from("teachers")
      .select("id, is_admin")
      .eq("supabase_user", authUser.id)
      .maybeSingle();

    if (teacherError) {
      console.error("[teacher-send-notification] teacher lookup failed:", teacherError.message);
      return json({ status: "error", message: "Failed to authorize request" }, 500);
    }
    if (!teacherRow) {
      return json({ status: "error", message: "Not a recognized teacher" }, 403);
    }

    // 3. Parse and validate the body.
    let payload: Partial<SendNotificationRequest>;
    try {
      const parsed = await req.json();
      if (!parsed || typeof parsed !== "object") throw new Error("not an object");
      payload = parsed as Partial<SendNotificationRequest>;
    } catch {
      return json({ status: "error", message: "Invalid JSON body" }, 400);
    }

    const classId = typeof payload.classId === "string" ? payload.classId.trim() : "";
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const messageBody = typeof payload.body === "string" ? payload.body.trim() : "";

    if (!classId) {
      return json({ status: "error", message: "Missing classId" }, 400);
    }
    if (!UUID_RE.test(classId)) {
      return json({ status: "error", message: "classId must be a valid UUID" }, 400);
    }
    if (title.length < 1 || title.length > TITLE_MAX) {
      return json({ status: "error", message: `title must be 1-${TITLE_MAX} characters` }, 400);
    }
    if (messageBody.length < 1 || messageBody.length > BODY_MAX) {
      return json({ status: "error", message: `body must be 1-${BODY_MAX} characters` }, 400);
    }

    // 4. Class lookup. 404 when the class does not exist at all.
    const { data: cls, error: clsErr } = await supabase
      .from("classes")
      .select("id, teacher_id")
      .eq("id", classId)
      .maybeSingle();

    if (clsErr) {
      console.error("[teacher-send-notification] class lookup failed:", clsErr.message);
      return json({ status: "error", message: "Failed to load class" }, 500);
    }
    if (!cls) {
      return json({ status: "error", message: "Class not found" }, 404);
    }

    // 5. Authorization: class owner, unless the caller is an admin.
    if (!teacherRow.is_admin && cls.teacher_id !== teacherRow.id) {
      return json({ status: "error", message: "Class not found or not yours" }, 403);
    }

    // 6. Insert the class notification. sent_by is teachers.id, never auth id.
    const { data: inserted, error: insertErr } = await supabase
      .from("notifications")
      .insert({
        class_id: classId,
        student_id: null,
        title,
        body: messageBody,
        sent_by: teacherRow.id,
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      console.error("[teacher-send-notification] insert failed:", insertErr?.message);
      return json({ status: "error", message: "Failed to send notification" }, 500);
    }

    return json({ status: "ok", notificationId: inserted.id }, 200);
  } catch (err) {
    console.error(
      "[teacher-send-notification] unhandled:",
      err instanceof Error ? err.stack : err,
    );
    return json({ status: "error", message: "Internal server error" }, 500);
  }
});
