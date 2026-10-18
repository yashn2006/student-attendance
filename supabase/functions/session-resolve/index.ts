// POST /functions/v1/session-resolve
// Resolves a student-facing entry point (typed 6-digit code, or a scanned
// QR payload carrying the raw sessionId) into a validated session.
//
// This is the single funnel both the QR path and manual-code path go
// through before the client proceeds to WebAuthn verification. It never
// trusts client-side timers — every expiry check happens here, against
// server state, per the device-attendance-flow SKILL.md.

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

interface ResolveRequest {
  code?: string;
  sessionId?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const body: ResolveRequest = await req.json();
    const { code, sessionId } = body;

    if (!code && !sessionId) {
      return new Response(
        JSON.stringify({ status: "error", message: "Either code or sessionId is required" }),
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

    // ---- QR path: sessionId is already known, just validate it. ----
    if (sessionId) {
      const { data: session, error } = await supabase
        .from("sessions")
        .select("id, class_id, teacher_id, status, window_end")
        .eq("id", sessionId)
        .single();

      if (error || !session) {
        return new Response(
          JSON.stringify({ status: "error", message: "Session not found" }),
          { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );
      }

      const expired = session.status !== "active"
        || (session.window_end && new Date(session.window_end).getTime() < Date.now());

      if (expired) {
        if (session.status === "active") {
          await supabase.from("sessions").update({ status: "closed" }).eq("id", session.id);
        }
        return new Response(
          JSON.stringify({ status: "error", message: "This session has ended" }),
          { status: 410, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          sessionId: session.id,
          classId: session.class_id,
          teacherId: session.teacher_id,
          windowEnd: session.window_end,
        }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // ---- Code path: look up the currently-active session with this code. ----
    const normalizedCode = code!.trim();

    const { data: session, error } = await supabase
      .from("sessions")
      .select("id, class_id, teacher_id, status, window_end, current_code, code_expires_at")
      .eq("current_code", normalizedCode)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      return new Response(
        JSON.stringify({ status: "error", message: "Lookup failed" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    if (!session) {
      return new Response(
        JSON.stringify({ status: "error", message: "Invalid or expired code" }),
        { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const now = Date.now();
    const codeExpired = !session.code_expires_at || new Date(session.code_expires_at).getTime() < now;
    const windowExpired = session.window_end && new Date(session.window_end).getTime() < now;

    if (windowExpired) {
      await supabase.from("sessions").update({ status: "closed" }).eq("id", session.id);
      return new Response(
        JSON.stringify({ status: "error", message: "This session has ended" }),
        { status: 410, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    if (codeExpired) {
      // The code rotated since the student read/typed it — don't resolve.
      // The client should prompt them to re-check the current code.
      return new Response(
        JSON.stringify({ status: "error", message: "Code has expired, please check the current code" }),
        { status: 410, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        classId: session.class_id,
        teacherId: session.teacher_id,
        windowEnd: session.window_end,
      }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (_err) {
    return new Response(
      JSON.stringify({ status: "error", message: "Internal server error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});