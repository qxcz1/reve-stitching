// src/pages/api/admin/send-test-email.ts

import type { APIRoute } from 'astro';
import { getAdminFromCookies } from '../../../lib/auth';
import { generateQuoteUnderReviewEmail } from '../../../lib/email-templates/quote-under-review';
import { generateAdminReminderEmail } from '../../../lib/email-templates/admin-reminder';
import { generateReengagementEmail } from '../../../lib/email-templates/quote-reengagement';

export const prerender = false;

const sampleQuote = {
  reference_number: 'RQ-TEST-PREVIEW',
  company_name: 'Example Fashion Ltd',
  contact_person: 'John Smith',
  email: 'test@example.com',
  phone: '+44 7700 900123',
  product_type: 'hoodies',
  quantity: 2500,
  estimated_price_range: '$12,000 - $18,500',
  created_at: new Date().toISOString(),
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = getAdminFromCookies(cookies);
  if (!admin) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { templateId, email } = await request.json();

    if (!templateId || !email) {
      return json({ error: 'Missing templateId or email' }, 400);
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Invalid email address' }, 400);
    }

    let result: { subject: string; html: string };

    // All generators are now async, so we await them
    if (templateId === '24h') {
      result = await generateQuoteUnderReviewEmail(sampleQuote as any);
    } else if (templateId === '48h') {
      result = await generateAdminReminderEmail(sampleQuote as any);
    } else if (templateId === '7d') {
      result = await generateReengagementEmail(sampleQuote as any);
    } else {
      return json({ error: 'Invalid template ID' }, 400);
    }

    // Send via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return json({ error: 'Email service not configured' }, 500);
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Reve Stitching <notifications@revestitching.com>',
        to: [email],
        subject: `[TEST] ${result.subject}`,
        html: result.html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Test Email] Resend error:', err);
      return json({ error: 'Failed to send email' }, 500);
    }

    console.log(`[Test Email] Sent ${templateId} template to ${email} by ${admin.sub}`);
    return json({ success: true });

  } catch (err) {
    console.error('[Test Email] Error:', err);
    return json({ error: 'Server error' }, 500);
  }
};

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}