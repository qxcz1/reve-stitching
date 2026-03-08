// src/lib/email-templates/quote-under-review.ts

import { emailLayout, emailButton, quoteDetailsBox } from './_layout';
import {
  getTemplateContent,
  TEMPLATE_DEFAULTS,
  replaceVars,
  buildVars,
  type TemplateContent,
} from './template-storage';

export interface QuoteEmailData {
  contact_person: string;
  company_name: string;
  reference_number: string;
  product_type: string;
  quantity: number;
  estimated_price_range?: string | null;
  email: string;
}

/**
 * 24-hour follow-up: Reassure the buyer their quote is being reviewed.
 *
 * Tone: Professional, warm, proactive.
 * Goal: Keep buyer engaged, reduce anxiety about response time.
 */
export async function generateQuoteUnderReviewEmail(
  quote: QuoteEmailData,
  contentOverride?: TemplateContent | null
): Promise<{ subject: string; html: string }> {
  // Get custom content from DB (or use override for preview)
  const saved = contentOverride !== undefined ? contentOverride : await getTemplateContent('24h');
  const defaults = TEMPLATE_DEFAULTS['24h'];
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

    <!-- Status Indicator -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;">
      <tr>
        <td style="padding:16px 20px;background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;padding-right:12px;">
                <div style="width:32px;height:32px;background-color:#166534;border-radius:50%;text-align:center;line-height:32px;">
                  <span style="color:#ffffff;font-size:16px;">&#10003;</span>
                </div>
              </td>
              <td style="vertical-align:middle;">
                <p style="margin:0;font-size:14px;font-weight:bold;color:#166534;">Quote Under Review</p>
                <p style="margin:2px 0 0;font-size:12px;color:#15803d;">
                  Our team is evaluating your requirements
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Quote Details -->
    <p style="margin:0 0 12px;font-size:13px;font-weight:bold;color:#18181b;text-transform:uppercase;letter-spacing:0.5px;">
      Your Quote Summary
    </p>
    ${quoteDetailsBox([
      { label: 'Reference', value: quote.reference_number },
      { label: 'Company', value: quote.company_name },
      { label: 'Product', value: quote.product_type },
      { label: 'Quantity', value: `${quote.quantity.toLocaleString()} pcs` },
      ...(quote.estimated_price_range
        ? [{ label: 'Est. Range', value: quote.estimated_price_range }]
        : []),
    ])}

    <!-- What happens next -->
    <h3 style="margin:28px 0 12px;font-size:16px;color:#18181b;font-weight:bold;">
      What Happens Next?
    </h3>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:28px;">
          <span style="display:inline-block;width:22px;height:22px;background-color:#166534;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:bold;">1</span>
        </td>
        <td style="padding:8px 0 8px 8px;font-size:14px;color:#52525b;line-height:1.5;">
          <strong style="color:#18181b;">Technical Review</strong> — Our team assesses fabric, construction, and production feasibility.
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:28px;">
          <span style="display:inline-block;width:22px;height:22px;background-color:#166534;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:bold;">2</span>
        </td>
        <td style="padding:8px 0 8px 8px;font-size:14px;color:#52525b;line-height:1.5;">
          <strong style="color:#18181b;">Pricing Calculation</strong> — We prepare a detailed cost breakdown based on your specifications.
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:28px;">
          <span style="display:inline-block;width:22px;height:22px;background-color:#166534;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:bold;">3</span>
        </td>
        <td style="padding:8px 0 8px 8px;font-size:14px;color:#52525b;line-height:1.5;">
          <strong style="color:#18181b;">Formal Quotation</strong> — You receive a complete quote with pricing, lead times, and payment terms.
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:14px;color:#52525b;line-height:1.6;">
      ${mainBody}
    </p>

    <!-- WhatsApp CTA -->
    ${emailButton(ctaText, 'https://wa.me/923329555786?text=Hi%2C%20I%20submitted%20quote%20' + encodeURIComponent(quote.reference_number) + '%20and%20wanted%20to%20follow%20up.')}

    ${footerNote ? `<p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;text-align:center;">${footerNote}</p>` : ''}
  `;

  const html = await emailLayout(body, {
    previewText: `We're reviewing your quote ${quote.reference_number} for ${quote.quantity.toLocaleString()} ${quote.product_type}. You'll hear back within 48 hours.`,
  });

  return { subject, html };
}