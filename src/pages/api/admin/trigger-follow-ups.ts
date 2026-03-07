// src/pages/api/admin/trigger-follow-ups.ts

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { checkAndSendFollowUps } from '../../../lib/services/follow-up-emails';

export const prerender = false;

/**
 * Manual trigger for follow-up emails.
 * Uses query param secret (same as cron) for simplicity.
 */
export const GET: APIRoute = async ({ request }) => {
  const startTime = Date.now();

  // ── 1. Authenticate via query param (same as cron) ──
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return new Response(
      JSON.stringify({ success: false, error: 'Server misconfiguration' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (querySecret !== cronSecret) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 2. Initialize Supabase ──
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'Database not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── 3. Run follow-up logic ──
  try {
    const result = await checkAndSendFollowUps(supabase);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    return new Response(
      JSON.stringify({
        success: true,
        duration: `${elapsed}s`,
        ...result,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Manual Trigger] Error:', message);

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};