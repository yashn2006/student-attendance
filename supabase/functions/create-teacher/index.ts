import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !authUser) return json({ error: "Invalid session" }, 401);

    const { data: caller, error: callerError } = await supabaseAdmin
      .from("teachers")
      .select("id, is_admin")
      .eq("supabase_user", authUser.id)
      .maybeSingle();

    if (callerError || !caller || !caller.is_admin) {
      return json({ error: "Admin access required" }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (name.length < 1 || name.length > 120) {
      return json({ error: "name must be between 1 and 120 characters" }, 400);
    }
    if (email.length > 254 || !EMAIL_RE.test(email)) {
      return json({ error: "A valid email is required" }, 400);
    }
    if (password.length < 8 || password.length > 128) {
      return json({ error: "password must be between 8 and 128 characters" }, 400);
    }

    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (createError || !authData.user) {
      console.error("[create-teacher] auth user creation failed:", createError?.message);
      return json({ error: "Failed to create teacher login" }, 500);
    }

    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from("teachers")
      .insert({
        name,
        email,
        supabase_user: authData.user.id,
        is_admin: false,
      })
      .select()
      .single();

    if (teacherError || !teacher) {
      console.error("[create-teacher] teacher insert failed:", teacherError?.message);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return json({ error: "Failed to create teacher" }, 500);
    }

    return json({ success: true, teacher }, 200);
  } catch (error) {
    console.error("[create-teacher] unexpected:", error instanceof Error ? error.message : error);
    return json({ error: "Internal server error" }, 500);
  }
});
