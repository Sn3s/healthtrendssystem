// @ts-nocheck — Deno + https URL imports; workspace TypeScript is for Vite/Node only.
/**
 * Secrets (Supabase Dashboard → Edge Functions → Secrets, or `supabase secrets set`):
 *   RESEND_API_KEY          — required
 *   RESEND_FROM             — optional, default "HealthTrends <onboarding@resend.dev>" (Resend test sender)
 *   RESEND_TEST_RECIPIENT   — optional; when set (e.g. your Gmail), all PE PDFs are sent there instead of
 *                             the employee row’s email (for testing without a verified domain).
 * Never commit RESEND_API_KEY to git.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXAM_CODE_RE = /^\d{3}-\d{3}$/;
const MAX_PDF_BASE64_CHARS = 18_000_000; // ~13.5MB binary

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const resendKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('RESEND_FROM') ?? 'HealthTrends <onboarding@resend.dev>';
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!resendKey) {
    return jsonResponse({ error: 'Server is not configured for email (RESEND_API_KEY).' }, 503);
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: 'Missing Supabase configuration.' }, 503);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing Authorization bearer token' }, 401);
  }

  const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!accessToken) {
    return jsonResponse({ error: 'Missing access token' }, 401);
  }

  let body: { examCode?: string; pdfBase64?: string; filename?: string };
  try {
    const raw = await req.text();
    body = raw ? (JSON.parse(raw) as typeof body) : {};
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const examCode = typeof body.examCode === 'string' ? body.examCode.trim() : '';
  const pdfBase64 = typeof body.pdfBase64 === 'string' ? body.pdfBase64.trim() : '';
  const filename =
    typeof body.filename === 'string' && body.filename.trim().length > 0
      ? body.filename.trim().replace(/[/\\]/g, '_').slice(0, 200)
      : 'APE-report.pdf';

  if (!examCode || !EXAM_CODE_RE.test(examCode)) {
    return jsonResponse({ error: 'Invalid exam code' }, 400);
  }
  if (!pdfBase64 || pdfBase64.length > MAX_PDF_BASE64_CHARS) {
    return jsonResponse({ error: 'Invalid or oversized PDF payload' }, 400);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser(accessToken);
  if (userErr || !user) {
    return jsonResponse(
      { error: userErr?.message ?? 'Invalid or expired session. Sign in again.' },
      401,
    );
  }

  const supabaseRls = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const [{ data: isEncoder }, { data: isAdmin }] = await Promise.all([
    supabaseRls.rpc('has_role', { _user_id: user.id, _role: 'encoder' }),
    supabaseRls.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
  ]);

  if (!isEncoder && !isAdmin) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const { data: emp, error: empErr } = await supabaseRls
    .from('ape_employees')
    .select('exam_code, name, email')
    .eq('exam_code', examCode)
    .maybeSingle();

  if (empErr) {
    return jsonResponse({ error: empErr.message }, 500);
  }
  if (!emp) {
    return jsonResponse({ error: 'Employee not found' }, 404);
  }

  const onFileEmail = typeof emp.email === 'string' ? emp.email.trim() : '';
  const onFileOk = onFileEmail.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(onFileEmail);

  const testRecipient = Deno.env.get('RESEND_TEST_RECIPIENT')?.trim() ?? '';
  const testOk = testRecipient.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testRecipient);

  let toEmail: string;
  let html: string;
  if (testOk) {
    toEmail = testRecipient;
    const intended = onFileOk ? onFileEmail : '(none on file)';
    html = `<p><strong>Test delivery</strong> — Resend is not using your own domain yet, so this message was sent to your test inbox only.</p>
<p>Employee: ${escapeHtml(emp.name)} (${escapeHtml(emp.exam_code)})<br/>
On-file email: ${escapeHtml(intended)}</p>
<p>The combined physical examination and laboratory report is attached (PDF).</p>
<p>— HealthTrends Medical Clinics</p>`;
  } else {
    if (!onFileOk) {
      return jsonResponse(
        { error: 'Employee has no valid email on file. Set RESEND_TEST_RECIPIENT for test sends.' },
        400,
      );
    }
    toEmail = onFileEmail;
    html = `<p>Hello ${escapeHtml(emp.name)},</p><p>Your combined physical examination and laboratory report is attached (PDF).</p><p>— HealthTrends Medical Clinics</p>`;
  }

  const subject = `APE examination report · ${emp.exam_code}`;

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [toEmail],
      subject,
      html,
      attachments: [{ filename, content: pdfBase64 }],
    }),
  });

  const resendJson = (await resendRes.json().catch(() => ({}))) as { message?: string; id?: string };

  if (!resendRes.ok) {
    const msg = resendJson.message ?? `Resend error (${resendRes.status})`;
    return jsonResponse({ error: msg }, 502);
  }

  return jsonResponse({ ok: true, id: resendJson.id, sentTo: toEmail });
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
