// POST /functions/v1/session-close
// Teacher manually ends an active session before its window naturally
// expires. Validates the requesting teacher actually owns the session
// before closing it, so a student or another teacher can't end someone
// else's session early.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  ?? (Deno.env.get("SUPABASE_SECRET_KEYS")
    ? (JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)).default
    : "");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, x-client-info, apikey, Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SessionCloseRequest {
  sessionId: string;
  teacherId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const body: SessionCloseRequest = await req.json();
    const { sessionId, teacherId } = body;

    if (!sessionId || !teacherId) {
      return new Response(
        JSON.stringify({ status: "error", message: "sessionId and teacherId are required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ status: "error", message: "Service role key not configured" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: session, error: fetchErr } = await supabase
      .from("sessions")
      .select("id, teacher_id, status")
      .eq("id", sessionId)
      .single();

    if (fetchErr || !session) {
      return new Response(
        JSON.stringify({ status: "error", message: "Session not found" }),
        { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    if (session.teacher_id !== teacherId) {
      return new Response(
        JSON.stringify({ status: "error", message: "Teacher does not own this session" }),
        { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    if (session.status === "closed") {
      // Idempotent — closing an already-closed session isn't an error.
      return new Response(
        JSON.stringify({ status: "closed" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const { error: updateErr } = await supabase
      .from("sessions")
      .update({ status: "closed" })
      .eq("id", sessionId);

    if (updateErr) {
      console.error("[session-close] update error:", updateErr.message);
      return new Response(
        JSON.stringify({ status: "error", message: "Failed to close session" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ status: "closed" }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (_err) {
    return new Response(
      JSON.stringify({ status: "error", message: "Internal server error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});