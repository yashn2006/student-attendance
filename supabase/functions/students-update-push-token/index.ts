// POST /functions/v1/students-update-push-token
// Stores/updates a student's Expo push token so session-start can notify
// them when their class's attendance window opens.

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

interface UpdateTokenRequest {
  studentId: string;
  expoPushToken: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const body: UpdateTokenRequest = await req.json();
    const { studentId, expoPushToken } = body;

    if (!studentId || !expoPushToken) {
      return new Response(
        JSON.stringify({ status: "error", message: "studentId and expoPushToken are required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // Basic sanity check on token shape — real Expo tokens look like
    // "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]".
    if (!expoPushToken.startsWith("ExponentPushToken[")) {
      return new Response(
        JSON.stringify({ status: "error", message: "Invalid push token format" }),
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

    const { error: updateErr } = await supabase
      .from("students")
      .update({ expo_push_token: expoPushToken })
      .eq("id", studentId);

    if (updateErr) {
      console.error("[students-update-push-token] update error:", updateErr.message);
      return new Response(
        JSON.stringify({ status: "error", message: "Failed to store push token" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ status: "ok" }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (_err) {
    return new Response(
      JSON.stringify({ status: "error", message: "Internal server error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});