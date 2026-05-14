import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

type DeleteSpec = {
  table: string;
  column: string;
};

type AuthorizedUser = {
  id: string;
  email?: string | null;
};

const DATA_DELETE_SPECS: DeleteSpec[] = [
  { table: 'adk_events', column: 'user_id' },
  { table: 'adk_sessions', column: 'user_id' },
  { table: 'adk_user_states', column: 'user_id' },
  { table: 'coach_messages', column: 'user_id' },
  { table: 'achievement_records', column: 'user_id' },
  { table: 'streaks', column: 'user_id' },
  { table: 'ruler_drafts', column: 'user_id' },
  { table: 'ruler_logs', column: 'user_id' },
  { table: 'coach_context', column: 'user_id' },
  { table: 'notification_log', column: 'user_id' },
  { table: 'line_user_bindings', column: 'app_user_id' },
  { table: 'agent_ruler_logs', column: 'app_user_id' },
  { table: 'profiles', column: 'id' },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isMissingRelation(error: { code?: string; message?: string }): boolean {
  return error.code === '42P01' || /does not exist|找不到/i.test(error.message ?? '');
}

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function getAuthorizedUser(req: Request, userId: string): Promise<AuthorizedUser | Response> {
  const authHeader = req.headers.get('Authorization');
  const userToken = authHeader ? authHeader.replace('Bearer ', '') : null;
  if (!userToken) return jsonResponse({ success: false, error: 'Unauthorized' }, 401);

  const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || Deno.env.get('INSFORGE_URL') || '';
  const authClient = createClient({ baseUrl, edgeFunctionToken: userToken });
  const { data, error } = await authClient.auth.getCurrentUser();
  const authUser = data?.user;

  if (error || !authUser?.id) return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  if (authUser.id !== userId) return jsonResponse({ success: false, error: 'Forbidden' }, 403);
  return { id: authUser.id, email: authUser.email ?? null };
}

async function deleteRows(client: ReturnType<typeof createClient>, spec: DeleteSpec, userId: string): Promise<string | null> {
  const { error } = await client.database.from(spec.table).delete().eq(spec.column, userId);
  if (!error) return null;
  if (isMissingRelation(error)) return `${spec.table}: table missing`;
  throw new Error(`${spec.table}: ${error.message}`);
}

async function recordAccountDeletion(client: ReturnType<typeof createClient>, user: AuthorizedUser): Promise<void> {
  const email = normalizeEmail(user.email);
  const emailHash = email ? await sha256Hex(email) : null;
  const { error } = await client.database
    .from('account_deletions')
    .upsert({
      user_id: user.id,
      email_hash: emailHash,
      reason: 'user_requested',
      deleted_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) throw new Error(`account_deletions: ${error.message}`);
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = typeof body.userId === 'string' ? body.userId : '';
    if (!userId) return jsonResponse({ success: false, error: 'Missing userId' }, 400);

    const authorizedUser = await getAuthorizedUser(req, userId);
    if (authorizedUser instanceof Response) return authorizedUser;

    const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || Deno.env.get('INSFORGE_URL') || '';
    const serverKey = Deno.env.get('API_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || '';
    if (!serverKey) return jsonResponse({ success: false, error: 'Server key missing' }, 500);

    const serviceClient = createClient({ baseUrl, anonKey: serverKey });
    await recordAccountDeletion(serviceClient, authorizedUser);

    const skipped: string[] = [];
    for (const spec of DATA_DELETE_SPECS) {
      const skippedReason = await deleteRows(serviceClient, spec, userId);
      if (skippedReason) skipped.push(skippedReason);
    }

    return jsonResponse({
      success: true,
      deletedTables: DATA_DELETE_SPECS.length - skipped.length,
      skipped,
    });
  } catch (err) {
    return jsonResponse(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      500
    );
  }
}
