// POST /functions/v1/students-update-push-token
// Stores/updates the authenticated student's Expo push token.

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
const EXPO_TOKEN_RE = /^ExponentPushToken\[[A-Za-z0-9_\-]+\]$/;

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

    const { data: studentRow, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("supabase_user", authUser.id)
      .maybeSingle();

    if (studentError) {
      console.error("[students-update-push-token] student lookup failed:", studentError.message);
      return json({ status: "error", message: "Failed to store push token" }, 500);
    }
    if (!studentRow) {
      return json({ status: "error", message: "Not a recognized student" }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ status: "error", message: "Invalid JSON body" }, 400);
    }

    const bodyStudentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    const expoPushToken = typeof body.expoPushToken === "string" ? body.expoPushToken.trim() : "";

    if (bodyStudentId && !UUID_RE.test(bodyStudentId)) {
      return json({ status: "error", message: "studentId must be a valid UUID" }, 400);
    }
    if (bodyStudentId && bodyStudentId !== studentRow.id) {
      return json({ status: "error", message: "You can only update your own push token" }, 403);
    }
    if (!expoPushToken || !EXPO_TOKEN_RE.test(expoPushToken) || expoPushToken.length > 256) {
      return json({ status: "error", message: "Invalid push token format" }, 400);
    }

    const { error: updateErr } = await supabase
      .from("students")
      .update({ expo_push_token: expoPushToken })
      .eq("id", studentRow.id);

    if (updateErr) {
      console.error("[students-update-push-token] update failed:", updateErr.message);
      return json({ status: "error", message: "Failed to store push token" }, 500);
    }

    return json({ status: "ok" }, 200);
  } catch (err) {
    console.error("[students-update-push-token] unexpected:", err instanceof Error ? err.message : err);
    return json({ status: "error", message: "Internal server error" }, 500);
  }
});
