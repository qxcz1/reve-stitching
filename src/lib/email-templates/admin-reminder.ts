// src/lib/email-templates/admin-reminder.ts

import { emailLayout, emailButton, quoteDetailsBox } from './_layout';
import {
  getTemplateContent,
  TEMPLATE_DEFAULTS,
  replaceVars,
  buildVars,
  type TemplateContent,
} from './template-storage';
import type { QuoteEmailData } from './quote-under-review';

/**
 * 48-hour admin reminder: Nudge the sales team to respond.
 *
 * Tone: Direct, urgent, action-oriented.
 * Goal: Get admin to open the quote and send a response.
 */
export async function generateAdminReminderEmail(
  quote: QuoteEmailData,
  contentOverride?: TemplateContent | null
): Promise<{ subject: string; html: string }> {
  // Get custom content from DB (or use override for preview)
  const saved = contentOverride !== undefined ? contentOverride : await getTemplateContent('48h');
  const defaults = TEMPLATE_DEFAULTS['48h'];
  const vars = buildVars(quote);

  const hoursSince = 48; // Approximate — actual value computed in service
  const adminUrl = `https://revestitching.com/admin/quote/${quote.reference_number}`;

  // Apply custom or default content
  const subject = replaceVars(saved?.subject || defaults.subject, vars);
  const greeting = replaceVars(saved?.greeting || defaults.greeting, vars);
  const mainBody = replaceVars(saved?.main_body || defaults.main_body, vars);
  const ctaText = replaceVars(saved?.cta_text || defaults.cta_text, vars);

  // Parse mainBody into list items for the stats box
  const statsLines = mainBody.split(/[.\n]/).filter(s => s.trim().length > 5);

  const body = `
    <!-- Alert Banner -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;">
      <tr>
        <td style="padding:16px 20px;background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;padding-right:12px;">
                <div style="width:32px;height:32px;background-color:#dc2626;border-radius:50%;text-align:center;line-height:32px;">
                  <span style="color:#ffffff;font-size:18px;font-weight:bold;">!</span>
                </div>
              </td>
              <td style="vertical-align:middle;">
                <p style="margin:0;font-size:15px;font-weight:bold;color:#dc2626;">
                  Quote Pending for ${hoursSince}+ Hours
                </p>
                <p style="margin:4px 0 0;font-size:13px;color:#991b1b;">
                  ${greeting}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Quote Details -->
    ${quoteDetailsBox([
      { label: 'Reference', value: quote.reference_number },
      { label: 'Buyer', value: `${quote.contact_person} (${quote.company_name})` },
      { label: 'Email', value: quote.email },
      { label: 'Product', value: quote.product_type },
      { label: 'Quantity', value: `${quote.quantity.toLocaleString()} pcs` },
      ...(quote.estimated_price_range
        ? [{ label: 'Est. Value', value: quote.estimated_price_range }]
        : []),
    ])}

    <!-- Why This Matters -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;">
      <tr>
        <td style="padding:16px 20px;background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#92400e;">
            Why response time matters:
          </p>
          <ul style="margin:0;padding:0 0 0 20px;font-size:13px;color:#78350f;line-height:1.8;">
            ${statsLines.map(line => `<li>${line.trim()}</li>`).join('')}
          </ul>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    ${emailButton(ctaText, adminUrl)}

    <!-- Quick Actions -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0 0;">
      <tr>
        <td style="text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;">Quick actions:</p>
          <a href="mailto:${quote.email}?subject=Re: Quote ${quote.reference_number} — Reve Stitching&body=Hi ${encodeURIComponent(quote.contact_person.split(' ')[0])},%0A%0AThank you for your quote request (${quote.reference_number}).%0A%0A" style="font-size:13px;color:#166534;text-decoration:none;font-weight:600;">
            Reply to Buyer
          </a>
          <span style="color:#d4d4d8;margin:0 8px;">|</span>
          <a href="https://wa.me/923329555786?text=Reminder: Quote ${encodeURIComponent(quote.reference_number)} from ${encodeURIComponent(quote.company_name)} needs a response." style="font-size:13px;color:#166534;text-decoration:none;font-weight:600;">
            WhatsApp Team
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = await emailLayout(body, {
    previewText: `Quote ${quote.reference_number} from ${quote.company_name} has been pending for ${hoursSince}+ hours. ${quote.quantity.toLocaleString()} ${quote.product_type} — needs your attention.`,
  });

  return { subject, html };
}

/**
 * Discord embed for 48h admin reminder.
 * Sent alongside the email for maximum visibility.
 */
export function buildAdminReminderDiscordPayload(quote: QuoteEmailData): object {
  return {
    content: 'Quote pending for 48+ hours — needs attention!',
    embeds: [
      {
        title: `PENDING: ${quote.reference_number}`,
        description: `**${quote.contact_person}** from **${quote.company_name}** submitted a quote **48+ hours ago** and hasn't received a response.`,
        color: 0xdc2626, // Red
        fields: [
          {
            name: 'Product',
            value: quote.product_type,
            inline: true,
          },
          {
            name: 'Quantity',
            value: `${quote.quantity.toLocaleString()} pcs`,
            inline: true,
          },
          {
            name: 'Buyer Email',
            value: quote.email,
            inline: true,
          },
          ...(quote.estimated_price_range
            ? [
                {
                  name: 'Est. Value',
                  value: quote.estimated_price_range,
                  inline: true,
                },
              ]
            : []),
        ],
        url: `https://revestitching.com/admin/quote/${quote.reference_number}`,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Reve Stitching — Automated Follow-Up System',
        },
      },
    ],
  };
}