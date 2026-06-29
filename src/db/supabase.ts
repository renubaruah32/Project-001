import { createClient } from "@supabase/supabase-js";

let supabaseServerClient: any = null;

/**
 * Resets the server-side cached Supabase client instances.
 * Forcefully recreates the clients on the next access.
 */
export function resetSupabaseServerClient() {
  supabaseServerClient = null;
  console.log("[Supabase Server] Reset client instances cache. Ready for recreation with fresh env keys.");
}

/**
 * Gets a Supabase client instance in the Node.js server environment.
 * Automatically switches between service role key (for bypass row level security) 
 * and anon key based on what is configured in .env, falling back to VITE_ keys if needed.
 */
export function getSupabaseServerClient() {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseServerClient can only be called on the server side.");
  }

  if (!supabaseServerClient) {
    let supabaseUrl = process.env.VITE_SUPABASE_URL || process.env["SUPABASE_URL"] || "";
    if (supabaseUrl.includes("/rest/v1")) {
      supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "");
    }
    
    const supabaseKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] || 
                        process.env.VITE_SUPABASE_ANON_KEY || 
                        process.env["SUPABASE_ANON_KEY"];

    if (supabaseUrl && supabaseKey) {
      console.log("[Supabase] Server SDK Initializing with URL:", supabaseUrl);
      supabaseServerClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });
    } else {
      console.log("[Supabase] Server SDK not initialized: Neither VITE_SUPABASE_URL nor VITE_SUPABASE_ANON_KEY is configured.");
    }
  }
  return supabaseServerClient;
}

/**
 * Checks if the Supabase SDK is active/configured on the server.
 */
export function isSupabaseServerActive(): boolean {
  return !!getSupabaseServerClient();
}
