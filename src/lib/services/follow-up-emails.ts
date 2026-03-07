// src/lib/services/follow-up-emails.ts

import type { SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateQuoteUnderReviewEmail } from '../email-templates/quote-under-review';
import {
  generateAdminReminderEmail,
  buildAdminReminderDiscordPayload,
} from '../email-templates/admin-reminder';
import { generateReengagementEmail } from '../email-templates/quote-reengagement';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface QuoteRow {
  id: string;
  reference_number: string;
  company_name: string;
  contact_person: string;
  email: string;
  product_type: string;
  quantity: number;
  estimated_price_range: string | null;
  status: string;
  follow_up_24h_sent: boolean;
  admin_reminder_sent: boolean;
  reengagement_sent: boolean;
  created_at: string;
}

interface FollowUpResult {
  quotesProcessed: number;
  emailsSent: number;
  errors: number;
  details: {
    reference: string;
    type: string;
    success: boolean;
    error?: string;
  }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = 'admin@revestitching.com';
const FROM_ADDRESS = 'Reve Stitching <notifications@revestitching.com>';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

// Timing thresholds (in hours)
const THRESHOLD_24H = 24;
const THRESHOLD_48H = 48;
const THRESHOLD_7D = 168; // 7 × 24

// Rate limiting: max emails per cron run (Resend free tier = 100/day)
const MAX_EMAILS_PER_RUN = 20;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function hoursSince(dateString: string): number {
  const created = new Date(dateString);
  const now = new Date();
  return (now.getTime() - created.getTime()) / (1000 * 60 * 60);
}

function timestamp(): string {
  return new Date().toISOString();
}

async function logEmail(
  supabase: SupabaseClient,
  quoteId: string,
  emailType: string,
  recipient: string,
  resendId: string | null,
  status: 'sent' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from('email_log').insert({
      quote_id: quoteId,
      email_type: emailType,
      recipient,
      resend_id: resendId,
      status,
      error_message: errorMessage || null,
    });
  } catch (err) {
    // Logging should never block the main flow
    console.error(`[FollowUp] Failed to write email_log:`, err);
  }
}

async function sendDiscordWebhook(payload: object): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn('[FollowUp] Discord webhook URL not configured, skipping');
    return;
  }

  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      console.error(`[FollowUp] Discord webhook failed: ${res.status}`);
    }
  } catch (err) {
    console.error('[FollowUp] Discord webhook error:', err);
  }
}

// Small delay between emails to respect rate limits
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual Send Functions
// ─────────────────────────────────────────────────────────────────────────────

async function send24HourFollowUp(
  quote: QuoteRow,
  resend: Resend,
  supabase: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  const tag = `[FollowUp][24h][${quote.reference_number}]`;
  console.log(`${tag} Sending to ${quote.email}...`);

  try {
    const { subject, html } = generateQuoteUnderReviewEmail(quote);

    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [quote.email],
      subject,
      html,
      tags: [
        { name: 'type', value: '24h_followup' },
        { name: 'quote_ref', value: quote.reference_number },
      ],
    });

    if (error) {
      console.error(`${tag} Resend error:`, error);
      await logEmail(supabase, quote.id, '24h_followup', quote.email, null, 'failed', error.message);
      return { success: false, error: error.message };
    }

    // Mark as sent in database
    await supabase
      .from('quote_requests')
      .update({
        follow_up_24h_sent: true,
        last_email_sent_at: timestamp(),
      })
      .eq('id', quote.id);

    await logEmail(supabase, quote.id, '24h_followup', quote.email, data?.id || null, 'sent');

    console.log(`${tag} ✅ Sent successfully (Resend ID: ${data?.id})`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`${tag} ❌ Exception:`, message);
    await logEmail(supabase, quote.id, '24h_followup', quote.email, null, 'failed', message);
    return { success: false, error: message };
  }
}

async function send48HourAdminReminder(
  quote: QuoteRow,
  resend: Resend,
  supabase: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  const tag = `[FollowUp][48h-admin][${quote.reference_number}]`;
  console.log(`${tag} Sending admin reminder...`);

  try {
    // 1. Send email to admin
    const { subject, html } = generateAdminReminderEmail(quote);

    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [ADMIN_EMAIL],
      subject,
      html,
      tags: [
        { name: 'type', value: '48h_admin_reminder' },
        { name: 'quote_ref', value: quote.reference_number },
      ],
    });

    if (error) {
      console.error(`${tag} Resend error:`, error);
      await logEmail(supabase, quote.id, '48h_admin', ADMIN_EMAIL, null, 'failed', error.message);
      return { success: false, error: error.message };
    }

    await logEmail(supabase, quote.id, '48h_admin', ADMIN_EMAIL, data?.id || null, 'sent');

    // 2. Send Discord notification (non-blocking)
    const discordPayload = buildAdminReminderDiscordPayload(quote);
    sendDiscordWebhook(discordPayload).catch(() => {}); // Fire and forget

    // 3. Mark as sent
    await supabase
      .from('quote_requests')
      .update({
        admin_reminder_sent: true,
        last_email_sent_at: timestamp(),
      })
      .eq('id', quote.id);

    console.log(`${tag} ✅ Admin reminder sent (Resend ID: ${data?.id})`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`${tag} ❌ Exception:`, message);
    await logEmail(supabase, quote.id, '48h_admin', ADMIN_EMAIL, null, 'failed', message);
    return { success: false, error: message };
  }
}

async function send7DayReengagement(
  quote: QuoteRow,
  resend: Resend,
  supabase: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  const tag = `[FollowUp][7d][${quote.reference_number}]`;
  console.log(`${tag} Sending re-engagement to ${quote.email}...`);

  try {
    const { subject, html } = generateReengagementEmail(quote);

    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [quote.email],
      subject,
      html,
      tags: [
        { name: 'type', value: '7d_reengagement' },
        { name: 'quote_ref', value: quote.reference_number },
      ],
    });

    if (error) {
      console.error(`${tag} Resend error:`, error);
      await logEmail(supabase, quote.id, '7d_reengagement', quote.email, null, 'failed', error.message);
      return { success: false, error: error.message };
    }

    // Mark as sent
    await supabase
      .from('quote_requests')
      .update({
        reengagement_sent: true,
        last_email_sent_at: timestamp(),
      })
      .eq('id', quote.id);

    await logEmail(supabase, quote.id, '7d_reengagement', quote.email, data?.id || null, 'sent');

    console.log(`${tag} ✅ Sent successfully (Resend ID: ${data?.id})`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`${tag} ❌ Exception:`, message);
    await logEmail(supabase, quote.id, '7d_reengagement', quote.email, null, 'failed', message);
    return { success: false, error: message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Entry Point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check all pending quotes and send follow-up emails as needed.
 *
 * Called by Vercel Cron every 6 hours.
 * Processes up to MAX_EMAILS_PER_RUN emails to stay within rate limits.
 */
export async function checkAndSendFollowUps(
  supabase: SupabaseClient
): Promise<FollowUpResult> {
  const startTime = Date.now();
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`[FollowUp] Starting follow-up check at ${timestamp()}`);
  console.log(`${'═'.repeat(60)}`);

  const result: FollowUpResult = {
    quotesProcessed: 0,
    emailsSent: 0,
    errors: 0,
    details: [],
  };

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('[FollowUp] ❌ RESEND_API_KEY not configured');
    return result;
  }

  const resend = new Resend(resendApiKey);

  // ── Fetch all quotes that might need a follow-up ──
  // We query for status = 'new' and at least one flag not yet set.
  const { data: quotes, error: queryError } = await supabase
    .from('quote_requests')
    .select('*')
    .eq('status', 'new')
    .or(
      'follow_up_24h_sent.eq.false,admin_reminder_sent.eq.false,reengagement_sent.eq.false'
    )
    .order('created_at', { ascending: true })
    .limit(50); // Safety limit

  if (queryError) {
    console.error('[FollowUp] ❌ Database query error:', queryError);
    return result;
  }

  if (!quotes || quotes.length === 0) {
    console.log('[FollowUp] No pending follow-ups found. All clear. ✨');
    return result;
  }

  console.log(`[FollowUp] Found ${quotes.length} quote(s) to check`);

  let emailCount = 0;

  for (const quote of quotes as QuoteRow[]) {
    if (emailCount >= MAX_EMAILS_PER_RUN) {
      console.log(`[FollowUp] Rate limit reached (${MAX_EMAILS_PER_RUN} emails). Stopping.`);
      break;
    }

    const hours = hoursSince(quote.created_at);
    result.quotesProcessed++;

    console.log(
      `\n[FollowUp] Processing ${quote.reference_number} ` +
      `(${hours.toFixed(1)}h old, status: ${quote.status})`
    );

    // ── 24-hour follow-up ──
    if (hours >= THRESHOLD_24H && !quote.follow_up_24h_sent) {
      const res = await send24HourFollowUp(quote, resend, supabase);
      result.details.push({
        reference: quote.reference_number,
        type: '24h_followup',
        success: res.success,
        error: res.error,
      });
      if (res.success) {
        result.emailsSent++;
        emailCount++;
      } else {
        result.errors++;
      }
      await delay(500); // Small pause between sends
    }

    // ── 48-hour admin reminder ──
    if (hours >= THRESHOLD_48H && !quote.admin_reminder_sent) {
      const res = await send48HourAdminReminder(quote, resend, supabase);
      result.details.push({
        reference: quote.reference_number,
        type: '48h_admin',
        success: res.success,
        error: res.error,
      });
      if (res.success) {
        result.emailsSent++;
        emailCount++;
      } else {
        result.errors++;
      }
      await delay(500);
    }

    // ── 7-day re-engagement ──
    if (hours >= THRESHOLD_7D && !quote.reengagement_sent) {
      const res = await send7DayReengagement(quote, resend, supabase);
      result.details.push({
        reference: quote.reference_number,
        type: '7d_reengagement',
        success: res.success,
        error: res.error,
      });
      if (res.success) {
        result.emailsSent++;
        emailCount++;
      } else {
        result.errors++;
      }
      await delay(500);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[FollowUp] Complete in ${elapsed}s`);
  console.log(`[FollowUp] Processed: ${result.quotesProcessed} quotes`);
  console.log(`[FollowUp] Sent: ${result.emailsSent} emails`);
  console.log(`[FollowUp] Errors: ${result.errors}`);
  console.log(`${'═'.repeat(60)}\n`);

  return result;
}