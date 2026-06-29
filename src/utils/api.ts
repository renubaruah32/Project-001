/**
 * Helper to get the absolute API URL when running on external hosts (like Vercel)
 * that need to talk to the custom Cloud Run backend.
 */
export function getApiUrl(path: string): string {
  if (typeof window !== 'undefined') {
    return path; // Always use relative paths in browser context to avoid any CORS/DNS issues
  }
  if (path.startsWith('/api/')) {
    let apiUrl = '';
    try {
      // @ts-ignore
      const env = import.meta.env || {};
      apiUrl = env["VITE_API_URL"] || '';
    } catch (e) {
      const env = (import.meta as any).env || {};
      apiUrl = env["VITE_API_URL"] || '';
    }

    if (apiUrl) {
      const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      return `${cleanApiUrl}${path}`;
    }
  }
  return path;
}

/**
 * Standard fetch wrapper that automatically prefixes relative /api/ paths
 * with the external backend API URL if configured.
 * Implements a robust fallback mechanism to the local relative path if the external fetch fails.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let finalInput = input;
  let originalPath: string | null = null;

  if (typeof input === 'string') {
    if (input.startsWith('/api/')) {
      originalPath = input;
      finalInput = getApiUrl(input);
    }
  } else if (input instanceof URL) {
    const relativePath = input.pathname + input.search;
    if (relativePath.startsWith('/api/')) {
      originalPath = relativePath;
      finalInput = getApiUrl(relativePath);
    }
  }

  try {
    return await window.fetch(finalInput, init);
  } catch (err) {
    // If the fetch failed (e.g., due to CORS or network error on custom VITE_API_URL)
    // and we had a different custom URL prefix, fallback to the relative path on the current origin!
    if (originalPath && String(finalInput) !== originalPath) {
      console.warn(
        `[API Fetch] Failed to fetch from custom API endpoint ${String(finalInput)}. Retrying with local relative path ${originalPath}...`,
        err
      );
      try {
        return await window.fetch(originalPath, init);
      } catch (fallbackErr) {
        console.error(`[API Fetch] Local fallback also failed:`, fallbackErr);
        throw fallbackErr;
      }
    }
    throw err;
  }
}
