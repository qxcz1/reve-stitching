import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { generateSampleReference } from '../../../lib/services/sample-reference';
import { Resend } from 'resend';

export const prerender = false;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const { 
      company_name, contact_person, email, phone, country, shipping_address,
      product_type, fabric_type, gsm, color, size, quantity,
      special_requirements, linked_quote_id 
    } = body;

    // Validation
    const errors: string[] = [];
    if (!company_name?.trim()) errors.push('Company name is required');
    if (!contact_person?.trim()) errors.push('Contact person is required');
    if (!email?.trim()) errors.push('Email is required');
    if (!country?.trim()) errors.push('Country is required');
    if (!shipping_address?.trim()) errors.push('Shipping address is required');
    if (!product_type?.trim()) errors.push('Product type is required');
    if (!quantity || quantity < 1 || quantity > 5) errors.push('Quantity must be between 1 and 5');

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Invalid email address');
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: errors.join(', ') }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const reference_number = generateSampleReference();

    const insertData: Record<string, unknown> = {
      reference_number,
      company_name: company_name.trim(),
      contact_person: contact_person.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      country: country.trim(),
      shipping_address: shipping_address.trim(),
      product_type,
      fabric_type: fabric_type || null,
      gsm: gsm ? parseInt(gsm, 10) : null,
      color: color?.trim() || null,
      size: size || null,
      quantity: parseInt(quantity, 10),
      special_requirements: special_requirements?.trim() || null,
      linked_quote_id: linked_quote_id?.trim() || null,
      status: 'new',
    };

    const { data, error } = await supabase
      .from('sample_requests')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return new Response(JSON.stringify({ error: 'Failed to submit sample request' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send confirmation email
    try {
      await resend.emails.send({
        from: 'Reve Stitching <notifications@revestitching.com>',
        to: email.trim().toLowerCase(),
        subject: `Sample Request Received - ${reference_number}`,
        html: `
          <h2>Sample Request Received</h2>
          <p>Dear ${contact_person.trim()},</p>
          <p>Thank you for your sample request. Your reference number is: <strong>${reference_number}</strong></p>
          <p>We will review your request and get back to you within 1-2 business days.</p>
          <p>Best regards,<br>Reve Stitching Team</p>
        `,
      });
    } catch (emailErr) {
      console.error('Email send error:', emailErr);
    }

    // Send admin notification email
    try {
        const adminEmail = process.env.NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
        if (adminEmail) {
          await resend.emails.send({
            from: 'Reve Stitching <notifications@revestitching.com>',
            to: adminEmail,
            subject: `New Sample Request: ${reference_number} - ${company_name.trim()}`,
            html: `
              <h2>New Sample Request Received</h2>
              <table style="border-collapse:collapse;width:100%;max-width:500px;">
                <tr><td style="padding:8px;color:#666;">Reference</td><td style="padding:8px;font-weight:bold;">${reference_number}</td></tr>
                <tr><td style="padding:8px;color:#666;">Company</td><td style="padding:8px;">${company_name.trim()}</td></tr>
                <tr><td style="padding:8px;color:#666;">Contact</td><td style="padding:8px;">${contact_person.trim()}</td></tr>
                <tr><td style="padding:8px;color:#666;">Email</td><td style="padding:8px;">${email.trim()}</td></tr>
                <tr><td style="padding:8px;color:#666;">Product</td><td style="padding:8px;">${product_type}</td></tr>
                <tr><td style="padding:8px;color:#666;">Quantity</td><td style="padding:8px;">${quantity}</td></tr>
                <tr><td style="padding:8px;color:#666;">Country</td><td style="padding:8px;">${country.trim()}</td></tr>
                ${fabric_type ? `<tr><td style="padding:8px;color:#666;">Fabric</td><td style="padding:8px;">${fabric_type}</td></tr>` : ''}
                ${color ? `<tr><td style="padding:8px;color:#666;">Color</td><td style="padding:8px;">${color}</td></tr>` : ''}
                ${special_requirements ? `<tr><td style="padding:8px;color:#666;">Notes</td><td style="padding:8px;">${special_requirements.trim()}</td></tr>` : ''}
              </table>
              <p style="margin-top:20px;"><a href="https://www.revestitching.com/admin/samples" style="background:#166534;color:#fff;padding:10px 20px;text-decoration:none;border-radius:8px;">View in Admin Panel</a></p>
            `,
          });
        }
      } catch (adminEmailErr) {
        console.error('Admin email error:', adminEmailErr);
      }

    // Discord notification
    if (process.env.DISCORD_WEBHOOK_URL) {
      try {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: `New Sample Request: ${reference_number}`,
              color: 0x166534,
              fields: [
                { name: 'Company', value: company_name, inline: true },
                { name: 'Contact', value: contact_person, inline: true },
                { name: 'Product', value: product_type, inline: true },
                { name: 'Country', value: country, inline: true },
                { name: 'Quantity', value: String(quantity), inline: true },
                { name: 'Email', value: email, inline: true },
              ],
              timestamp: new Date().toISOString(),
            }],
          }),
        });
      } catch (discordErr) {
        console.error('Discord notification error:', discordErr);
      }
    }

    return new Response(JSON.stringify({ success: true, data: { reference_number, id: data.id } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Sample submit error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};