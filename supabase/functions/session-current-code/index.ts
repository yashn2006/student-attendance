// GET /functions/v1/session-current-code?sessionId=uuid
// Returns the current rotating code for the session owner (or an admin).

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
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE_TTL_MS = 15_000;
const GRACE_MS = 15_000;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ status: "error", message: "Missing auth" }, 401);

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !authUser) return json({ status: "error", message: "Invalid session" }, 401);

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return json({ status: "error", message: "sessionId query param is required" }, 400);
    }
    if (!UUID_RE.test(sessionId)) {
      return json({ status: "error", message: "sessionId must be a valid UUID" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: teacherRow, error: teacherError } = await supabase
      .from("teachers")
      .select("id, is_admin")
      .eq("supabase_user", authUser.id)
      .maybeSingle();

    if (teacherError || !teacherRow) {
      return json({ status: "error", message: "Not a recognized teacher" }, 403);
    }

    const { data: session, error: sessionErr } = await supabase
      .from("sessions")
      .select("id, teacher_id, current_code, code_expires_at, window_end, status")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionErr || !session) {
      return json({ status: "error", message: "Session not found" }, 404);
    }

    if (!teacherRow.is_admin && session.teacher_id !== teacherRow.id) {
      return json({ status: "error", message: "You do not own this session" }, 403);
    }

    if (session.status === "closed") {
      return json({
        currentCode: session.current_code ?? "",
        codeExpiresAt: session.code_expires_at ?? new Date().toISOString(),
        serverNow: new Date().toISOString(),
        sessionStatus: "closed",
      }, 200);
    }

    const now = new Date();
    const windowEndMs = new Date(session.window_end).getTime();

    if (!session.window_end || now.getTime() > windowEndMs) {
      const { error: closeErr } = await supabase
        .from("sessions")
        .update({ status: "closed" })
        .eq("id", sessionId);
      if (closeErr) console.error("[session-current-code] close error:", closeErr.message);

      return json({
        currentCode: session.current_code ?? "",
        codeExpiresAt: session.code_expires_at ?? new Date().toISOString(),
        serverNow: new Date().toISOString(),
        sessionStatus: "closed",
      }, 200);
    }

    const nowMs = Date.now();
    const codeExpiresMs = session.code_expires_at
      ? new Date(session.code_expires_at).getTime()
      : 0;

    if (nowMs >= codeExpiresMs) {
      const newExpiresAt = new Date(nowMs + CODE_TTL_MS).toISOString();
      const oldCode = session.current_code ?? "";
      const oldExpiresMs = session.code_expires_at
        ? new Date(session.code_expires_at).getTime()
        : 0;
      const previousCodeValidUntil = oldExpiresMs
        ? new Date(oldExpiresMs + GRACE_MS).toISOString()
        : null;
      let rotatedCode: string | null = null;

      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateCode();
        const { error: updateErr } = await supabase
          .from("sessions")
          .update({
            current_code: candidate,
            code_expires_at: newExpiresAt,
            previous_code: oldCode,
            previous_code_valid_until: previousCodeValidUntil,
          })
          .eq("id", sessionId);

        if (!updateErr) {
          rotatedCode = candidate;
          break;
        }
        if (updateErr.code !== "23505") {
          console.error("[session-current-code] update error:", updateErr.message);
          return json({ status: "error", message: "Failed to rotate code" }, 500);
        }
      }

      if (!rotatedCode) {
        return json({ status: "error", message: "Failed to rotate code after retries" }, 500);
      }

      return json({
        currentCode: rotatedCode,
        codeExpiresAt: newExpiresAt,
        serverNow: new Date().toISOString(),
        sessionStatus: "active",
      }, 200);
    }

    return json({
      currentCode: session.current_code ?? "",
      codeExpiresAt: session.code_expires_at ?? new Date().toISOString(),
      serverNow: new Date().toISOString(),
      sessionStatus: "active",
    }, 200);
  } catch (err) {
    console.error("[session-current-code] unexpected:", err instanceof Error ? err.message : err);
    return json({ status: "error", message: "Internal server error" }, 500);
  }
});
