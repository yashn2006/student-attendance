// GET /functions/v1/session-current-code?sessionId=uuid
// Returns the current rotating code and its generation-time expiry for the
// teacher's Active Session Control screen. Polled every 10-15s.
//
// Rejects if the session window has expired (status becomes closed) or the
// session doesn't exist. Per the device-attendance-flow SKILL.md, the
// codeExpiresAt returned here is the code's generation-time expiry — the
// attendance-mark endpoint MUST validate against this value, never against
// request-received time.

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
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const CODE_TTL_MS = 30_000;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return new Response(
        JSON.stringify({ status: "error", message: "sessionId query param is required" }),
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

    const { data: session, error: sessionErr } = await supabase
      .from("sessions")
      .select("id, current_code, code_expires_at, window_end, status")
      .eq("id", sessionId)
      .single();

    if (sessionErr || !session) {
      return new Response(
        JSON.stringify({ status: "error", message: "Session not found" }),
        { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // Already closed → return without re-closing (still report it closed).
    if (session.status === "closed") {
      return new Response(
        JSON.stringify({
          currentCode: session.current_code ?? "",
          codeExpiresAt: session.code_expires_at ?? new Date().toISOString(),
          sessionStatus: "closed",
        }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // If the session's window has passed, close it server-side.
    const now = new Date();
    const windowEndMs = new Date(session.window_end).getTime();

    if (!session.window_end || now.getTime() > windowEndMs) {
      await supabase
        .from("sessions")
        .update({ status: "closed" })
        .eq("id", sessionId);

      return new Response(
        JSON.stringify({
          currentCode: session.current_code ?? "",
          codeExpiresAt: session.code_expires_at ?? new Date().toISOString(),
          sessionStatus: "closed",
        }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // ---- Rotation logic ----
    // Check whether the current code has expired (generation-time expiry
    // per device-attendance-flow SKILL.md). If so, rotate to a fresh code
    // and persist it so future calls see the new code. If still valid,
    // return as-is — this keeps codes consistent within their 10-15s TTL.
    const nowMs = Date.now();
    const codeExpiresMs = session.code_expires_at
      ? new Date(session.code_expires_at).getTime()
      : 0;

    if (nowMs >= codeExpiresMs) {
      const newExpiresAt = new Date(nowMs + CODE_TTL_MS).toISOString();
      let rotatedCode: string | null = null;

      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateCode();

        const { error: updateErr } = await supabase
          .from("sessions")
          .update({
            current_code: candidate,
            code_expires_at: newExpiresAt,
          })
          .eq("id", sessionId);

        if (!updateErr) {
          rotatedCode = candidate;
          break;
        }

        if (updateErr.code !== "23505") {
          console.error("[session-current-code] update error:", updateErr.message);
          return new Response(
            JSON.stringify({ status: "error", message: "Failed to rotate code" }),
            { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
          );
        }

        console.log(`[session-current-code] code collision on attempt ${attempt + 1}, retrying`);
      }

      if (!rotatedCode) {
        return new Response(
          JSON.stringify({ status: "error", message: "Failed to rotate code after retries" }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );
      }

      console.log("[session-current-code] rotated code, new expiry =", newExpiresAt);

      return new Response(
        JSON.stringify({
          currentCode: rotatedCode,
          codeExpiresAt: newExpiresAt,
          sessionStatus: "active",
        }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    // Code still within its generation-time TTL — return unchanged.
    return new Response(
      JSON.stringify({
        currentCode: session.current_code ?? "",
        codeExpiresAt: session.code_expires_at ?? new Date().toISOString(),
        sessionStatus: "active",
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