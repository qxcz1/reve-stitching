// src/pages/api/admin/trigger-follow-ups.ts

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { checkAndSendFollowUps } from '../../../lib/services/follow-up-emails';

export const prerender = false;

/**
 * Manual trigger for follow-up emails.
 * Used from admin dashboard for testing or immediate processing.
 *
 * POST /api/admin/trigger-follow-ups
 * Requires admin session (validated via Supabase auth).
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  // ── Validate admin session ──
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: 'Not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check auth via access token cookie
  const accessToken = cookies.get('sb-access-token')?.value;
  if (!accessToken) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Verify the token is valid
  const anonClient = createClient(supabaseUrl, supabaseAnonKey || '');
  const { data: { user }, error: authError } = await anonClient.auth.getUser(accessToken);

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid session' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── Run with service role client ──
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const result = await checkAndSendFollowUps(serviceClient);

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};