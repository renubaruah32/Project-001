import { createClient } from "@supabase/supabase-js";

// Retrieve environment variables with prioritization:
// 1. Dynamic window variables (set at runtime after fetching from backend configuration)
// 2. Vite build-time environment variables (standard VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
export const getSupabaseConfig = () => {
  const url = (window as any).SUPABASE_DYNAMIC_URL || 
              (import.meta as any).env?.VITE_SUPABASE_URL || 
              "";
              
  const key = (window as any).SUPABASE_DYNAMIC_ANON_KEY || 
              (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
              "";
              
  return { url, key };
};

// Check if the client is fully configured
export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return !!url && !!key && !url.includes("placeholder-project");
};

// Throw a highly descriptive error with explicit integration guides
const throwMissingConfigError = (actionName: string) => {
  const errMsg = `Supabase is not configured! Failed to execute '${actionName}'. ` +
    `To resolve this, please make sure the following environment variables are set in your deployment environment (e.g. Vercel, local .env file):\n\n` +
    `  - VITE_SUPABASE_URL\n` +
    `  - VITE_SUPABASE_ANON_KEY\n\n` +
    `You can retrieve these credentials from your Supabase Dashboard under Settings > API.`;
  console.error("[Supabase Configuration Error]", errMsg);
  throw new Error(errMsg);
};

let currentClient: any = null;
let lastUsedUrl = "";
let lastUsedKey = "";

export function getClient() {
  const { url, key } = getSupabaseConfig();
  
  if (!url || !key || url.includes("placeholder-project")) {
    // Return a Proxy that intercepts all method calls and throws a highly descriptive error
    return new Proxy({}, {
      get(target, prop) {
        if (prop === "then" || prop === "toJSON" || typeof prop === "symbol" || prop === "toString") {
          return undefined;
        }
        return throwMissingConfigError(String(prop));
      }
    });
  }
  
  if (!currentClient || url !== lastUsedUrl || key !== lastUsedKey || (window as any).SUPABASE_FORCE_RECREATE) {
    (window as any).SUPABASE_FORCE_RECREATE = false;
    let sanitizedUrl = url;
    if (sanitizedUrl.includes("/rest/v1")) {
      sanitizedUrl = sanitizedUrl.replace(/\/rest\/v1\/?$/, "");
    }
    console.log("[Supabase Client] Initializing singleton instance with URL:", sanitizedUrl);
    currentClient = createClient(sanitizedUrl, key);
    lastUsedUrl = url;
    lastUsedKey = key;
  }
  return currentClient;
}

// Export the supabase client as a Proxy that dynamically resolves properties on the active client instance
export const supabase = new Proxy({}, {
  get(target, prop) {
    const client = getClient();
    const val = client[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  }
}) as any;
