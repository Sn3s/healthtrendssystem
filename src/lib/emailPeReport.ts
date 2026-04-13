import { supabase, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';
import { edgeFunctionUrl } from '@/lib/supabaseEdgeUrl';

/** Base64 (no `data:` prefix) for Resend attachment `content`. */
export function blobToBase64Pdf(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      const comma = data.indexOf(',');
      resolve(comma >= 0 ? data.slice(comma + 1) : data);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read PDF'));
    reader.readAsDataURL(blob);
  });
}

type SendPeReportResponse = { ok?: boolean; error?: string; id?: string; sentTo?: string };

function gatewayErrorMessage(json: unknown, fallback: string): string {
  if (json && typeof json === 'object') {
    const o = json as Record<string, unknown>;
    if (typeof o.error === 'string') return o.error;
    if (typeof o.message === 'string') return o.message;
  }
  return fallback;
}

/** Edge `verify_jwt` rejects expired access tokens — refresh first, retry once on 401. */
async function getAccessTokenForEdge(): Promise<string> {
  const { data: refreshed, error: refErr } = await supabase.auth.refreshSession();
  const t1 = refreshed.session?.access_token;
  if (!refErr && t1) return t1;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const t2 = session?.access_token;
  if (t2) return t2;

  throw new Error('You must be signed in to email reports. Try signing out and back in if this keeps happening.');
}

/**
 * Calls the Edge Function with explicit fetch so errors show HTTP status/body.
 * (supabase.functions.invoke often surfaces only "Failed to send a request to the Edge Function".)
 */
export async function invokeSendPeReport(params: {
  examCode: string;
  pdfBase64: string;
  filename: string;
}): Promise<SendPeReportResponse> {
  const url = edgeFunctionUrl('send-pe-report');

  const post = (accessToken: string) =>
    fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(params),
    });

  let res: Response;
  try {
    let accessToken = await getAccessTokenForEdge();
    res = await post(accessToken);
    if (res.status === 401) {
      const { data: again } = await supabase.auth.refreshSession();
      const t = again.session?.access_token;
      if (t) {
        res = await post(t);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    throw new Error(
      `${msg} — Could not reach ${url}. Check deploy (supabase functions deploy send-pe-report), connection, and ad blockers.`,
    );
  }

  const text = await res.text();
  let json: SendPeReportResponse | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as SendPeReportResponse;
    } catch {
      /* non-JSON body */
    }
  }

  if (res.status === 404) {
    throw new Error(
      'Edge function "send-pe-report" was not found (HTTP 404). Deploy it: supabase functions deploy send-pe-report',
    );
  }

  if (!res.ok) {
    const msg = gatewayErrorMessage(json, '') || text.replace(/\s+/g, ' ').trim().slice(0, 280);
    if (res.status === 401) {
      throw new Error(
        msg ||
          'Invalid or expired session (401). Sign out, sign in again, then retry. If it persists, confirm VITE_SUPABASE_PUBLISHABLE_KEY matches this Supabase project.',
      );
    }
    throw new Error(
      msg || `Edge function error HTTP ${res.status}. Open Dashboard → Edge Functions → send-pe-report → Logs.`,
    );
  }

  if (json && typeof json.error === 'string' && json.error) {
    throw new Error(json.error);
  }

  return json ?? {};
}
