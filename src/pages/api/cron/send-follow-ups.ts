// src/pages/api/cron/send-follow-ups.ts

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { checkAndSendFollowUps } from '../../../lib/services/follow-up-emails';

export const prerender = false;

/**
 * Cron endpoint for automated follow-up emails.
 *
 * Security: Requires Bearer token matching CRON_SECRET.
 * Vercel Cron automatically includes this header.
 *
 * Schedule: Every 6 hours (configured in vercel.json)
 * Max duration: ~60s on Vercel Hobby, ~300s on Pro
 */
export const GET: APIRoute = async ({ request }) => {
  const startTime = Date.now();

  // ── 1. Authenticate ──
  // Support both header auth (Vercel cron) and query param (manual testing)
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron] ❌ CRON_SECRET not set');
    return new Response(
      JSON.stringify({ error: 'Server misconfiguration' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` ||
    querySecret === cronSecret;

  if (!isAuthorized) {
    console.warn('[Cron] ⚠️ Unauthorized attempt');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  console.log('[Cron] ✅ Authenticated via', authHeader ? 'header' : 'query param');
  
  // ── 2. Initialize Supabase with service role (bypasses RLS) ──
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Cron] ❌ Supabase credentials not configured');
    return new Response(
      JSON.stringify({ error: 'Database not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
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
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cron] ❌ Unhandled error:', message);

    // Send critical error to Discord
    const discordUrl = process.env.DISCORD_WEBHOOK_URL;
    if (discordUrl) {
      fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '🚨 **Follow-up cron failed!**',
          embeds: [
            {
              title: 'Cron Error',
              description: `\`\`\`\n${message}\n\`\`\``,
              color: 0xff0000,
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      }).catch(() => {});
    }

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};