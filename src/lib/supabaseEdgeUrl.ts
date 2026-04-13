import { SUPABASE_URL } from '@/integrations/supabase/client';

/**
 * URL for invoking Edge Functions.
 * On localhost (dev server or `vite preview`), use the Vite proxy path so the browser stays same-origin
 * and avoids CORS issues with apikey + Authorization to *.supabase.co.
 */
export function edgeFunctionUrl(functionName: string): string {
  const path = `/supabase-edge/functions/v1/${functionName}`;
  if (typeof window === "undefined") {
    return `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/${functionName}`;
  }
  if (import.meta.env.VITE_FORCE_EDGE_PROXY === "true") {
    return `${window.location.origin}${path}`;
  }
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") {
    return `${window.location.origin}${path}`;
  }
  return `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/${functionName}`;
}
