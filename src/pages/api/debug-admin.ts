import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const start = Date.now();
  
  const checks: Record<string, string> = {};
  
  // Check env vars
  checks.SUPABASE_URL = process.env.SUPABASE_URL ? 'SET' : 'MISSING';
  checks.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING';
  checks.ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET ? 'SET' : 'MISSING';
  checks.ADMIN_EMAIL = process.env.ADMIN_EMAIL ? 'SET' : 'MISSING';
  checks.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ? 'SET' : 'MISSING';
  
  // Check crypto
  try {
    const { createHmac } = await import('node:crypto');
    createHmac('sha256', 'test').update('test').digest('hex');
    checks.crypto = 'OK';
  } catch (e: any) {
    checks.crypto = `FAILED: ${e.message}`;
  }

  // Check auth module
  try {
    const { createAdminToken, verifyAdminToken } = await import('../../lib/auth');
    const token = createAdminToken('test@test.com');
    const verified = verifyAdminToken(token);
    checks.auth_create = token ? 'OK' : 'FAILED';
    checks.auth_verify = verified?.sub === 'test@test.com' ? 'OK' : 'FAILED';
  } catch (e: any) {
    checks.auth = `FAILED: ${e.message}`;
  }

  // Check supabase query
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { count, error } = await supabase
      .from('quote_requests')
      .select('*', { count: 'exact', head: true });
    checks.supabase = error ? `ERROR: ${error.message}` : `OK (${count} quotes)`;
  } catch (e: any) {
    checks.supabase = `FAILED: ${e.message}`;
  }

  checks.duration = `${Date.now() - start}ms`;

  return new Response(JSON.stringify(checks, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};