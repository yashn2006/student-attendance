// POST /functions/v1/session-close
// Teacher ends their own active session (admins may close any session).

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

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return json({ status: "error", message: "Internal server error" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ status: "error", message: "Missing auth" }, 401);

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !authUser) return json({ status: "error", message: "Invalid session" }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: teacherRow, error: teacherError } = await supabase
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

    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    if (!sessionId) return json({ status: "error", message: "sessionId is required" }, 400);
    if (!UUID_RE.test(sessionId)) {
      return json({ status: "error", message: "sessionId must be a valid UUID" }, 400);
    }

    const { data: session, error: fetchErr } = await supabase
      .from("sessions")
      .select("id, teacher_id, status")
      .eq("id", sessionId)
      .maybeSingle();

    if (fetchErr) {
      console.error("[session-close] session lookup failed:", fetchErr.message);
      return json({ status: "error", message: "Failed to load session" }, 500);
    }
    if (!session) return json({ status: "error", message: "Session not found" }, 404);

    if (!teacherRow.is_admin && session.teacher_id !== teacherRow.id) {
      return json({ status: "error", message: "You do not own this session" }, 403);
    }

    if (session.status === "closed") {
      return json({ status: "closed" }, 200);
    }

    const { error: updateErr } = await supabase
      .from("sessions")
      .update({ status: "closed" })
      .eq("id", sessionId);

    if (updateErr) {
      console.error("[session-close] update failed:", updateErr.message);
      return json({ status: "error", message: "Failed to close session" }, 500);
    }

    return json({ status: "closed" }, 200);
  } catch (err) {
    console.error("[session-close] unexpected:", err instanceof Error ? err.message : err);
    return json({ status: "error", message: "Internal server error" }, 500);
  }
});
