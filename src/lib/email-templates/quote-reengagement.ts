// src/lib/email-templates/quote-reengagement.ts

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
 * 7-day re-engagement: Check if buyer is still interested.
 *
 * Tone: Helpful, no-pressure, value-driven.
 * Goal: Reignite interest or learn why they went quiet.
 */
export async function generateReengagementEmail(
  quote: QuoteEmailData,
  contentOverride?: TemplateContent | null
): Promise<{ subject: string; html: string }> {
  // Get custom content from DB (or use override for preview)
  const saved = contentOverride !== undefined ? contentOverride : await getTemplateContent('7d');
  const defaults = TEMPLATE_DEFAULTS['7d'];
  const vars = buildVars(quote);

  // Apply custom or default content
  const subject = replaceVars(saved?.subject || defaults.subject, vars);
  const greeting = replaceVars(saved?.greeting || defaults.greeting, vars);
  const mainBody = replaceVars(saved?.main_body || defaults.main_body, vars);
  const ctaText = replaceVars(saved?.cta_text || defaults.cta_text, vars);
  const footerNote = replaceVars(saved?.footer_note || defaults.footer_note, vars);
  const firstName = vars.first_name;

  const body = `
    <!-- Greeting -->
    <h2 style="margin:0 0 8px;font-size:20px;color:#18181b;font-weight:bold;">
      Hi ${firstName},
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6;">
      ${greeting}
    </p>

    <!-- Original Quote Reference -->
    <p style="margin:0 0 12px;font-size:13px;font-weight:bold;color:#18181b;text-transform:uppercase;letter-spacing:0.5px;">
      Your Original Request
    </p>
    ${quoteDetailsBox([
      { label: 'Reference', value: quote.reference_number },
      { label: 'Product', value: quote.product_type },
      { label: 'Quantity', value: `${quote.quantity.toLocaleString()} pcs` },
      { label: 'Submitted', value: '7 days ago' },
    ])}

    <!-- Value Propositions -->
    <h3 style="margin:28px 0 16px;font-size:16px;color:#18181b;font-weight:bold;">
      Why Brands Choose Reve Stitching
    </h3>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 8px;">
      <tr>
        <td style="padding:12px 16px;background-color:#f9fafb;border-radius:8px;border:1px solid #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top;padding-right:12px;">
                <div style="width:28px;height:28px;background-color:#166534;border-radius:50%;text-align:center;line-height:28px;">
                  <span style="color:#fff;font-size:12px;font-weight:bold;">1</span>
                </div>
              </td>
              <td>
                <p style="margin:0 0 2px;font-size:14px;font-weight:bold;color:#18181b;">Vertically Integrated</p>
                <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">Knitting, dyeing, cutting, stitching, finishing — all under one roof. Full quality control.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 8px;">
      <tr>
        <td style="padding:12px 16px;background-color:#f9fafb;border-radius:8px;border:1px solid #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top;padding-right:12px;">
                <div style="width:28px;height:28px;background-color:#166534;border-radius:50%;text-align:center;line-height:28px;">
                  <span style="color:#fff;font-size:12px;font-weight:bold;">2</span>
                </div>
              </td>
              <td>
                <p style="margin:0 0 2px;font-size:14px;font-weight:bold;color:#18181b;">Low MOQ, Fast Turnaround</p>
                <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">Start from just 100 pieces. Production in 25–50 days depending on order size.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 8px;">
      <tr>
        <td style="padding:12px 16px;background-color:#f9fafb;border-radius:8px;border:1px solid #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top;padding-right:12px;">
                <div style="width:28px;height:28px;background-color:#166534;border-radius:50%;text-align:center;line-height:28px;">
                  <span style="color:#fff;font-size:12px;font-weight:bold;">3</span>
                </div>
              </td>
              <td>
                <p style="margin:0 0 2px;font-size:14px;font-weight:bold;color:#18181b;">Export to UK, EU &amp; Beyond</p>
                <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">Trusted by brands across Europe. FOB &amp; CIF shipping available.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Soft CTA -->
    <p style="margin:28px 0 0;font-size:15px;color:#52525b;line-height:1.6;">
      ${mainBody}
    </p>

    <!-- Primary CTA -->
    ${emailButton(ctaText, `https://revestitching.com/quote?ref=${encodeURIComponent(quote.reference_number)}`)}

    <!-- Secondary CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px auto 0;">
      <tr>
        <td align="center">
          <a href="https://wa.me/923329555786?text=Hi%2C%20I%20submitted%20quote%20${encodeURIComponent(quote.reference_number)}%20last%20week.%20I'd%20like%20to%20discuss%20further." target="_blank" style="display:inline-block;padding:12px 28px;background-color:#ffffff;color:#166534;font-size:14px;font-weight:bold;text-decoration:none;border-radius:8px;border:2px solid #166534;text-align:center;line-height:1;">
            Chat on WhatsApp Instead
          </a>
        </td>
      </tr>
    </table>

    <!-- Opt-out note -->
    ${footerNote ? `<p style="margin:28px 0 0;font-size:11px;color:#a1a1aa;text-align:center;line-height:1.6;">${footerNote}</p>` : ''}
  `;

  const html = await emailLayout(body, {
    previewText: `Hi ${firstName}, are you still looking for a manufacturer for ${quote.quantity.toLocaleString()} ${quote.product_type}? Your quote ${quote.reference_number} is ready for review.`,
  });

  return { subject, html };
}