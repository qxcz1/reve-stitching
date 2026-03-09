// src/pages/api/admin/samples/[id]/status.ts

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { getAdminFromCookies } from '../../../../../lib/auth';
import { Resend } from 'resend';
import { sampleApprovedEmail } from '../../../../../lib/email-templates/sample-approved';
import { sampleShippedEmail } from '../../../../../lib/email-templates/sample-shipped';
import { sampleStatusUpdateEmail } from '../../../../../lib/email-templates/sample-status-update';
import type { SampleRequest } from '../../../../../lib/types/sample';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const admin = await getAdminFromCookies(cookies);
  if (!admin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { id } = params;
    const body = await request.json();

    const { status, shipping_carrier, tracking_number, shipped_at, delivered_at,
            sample_fee, actual_cost, shipping_cost, is_free_sample,
            admin_notes, rejection_reason } = body;

    // Fetch current record
    const { data: current, error: fetchError } = await supabase
      .from('sample_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      return new Response(JSON.stringify({ error: 'Sample request not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sample = current as SampleRequest;

    const updateData: Record<string, unknown> = {};

    if (status !== undefined) updateData.status = status;
    if (shipping_carrier !== undefined) updateData.shipping_carrier = shipping_carrier;
    if (tracking_number !== undefined) updateData.tracking_number = tracking_number;
    if (shipped_at !== undefined) updateData.shipped_at = shipped_at;
    if (delivered_at !== undefined) updateData.delivered_at = delivered_at;
    if (sample_fee !== undefined) updateData.sample_fee = sample_fee;
    if (actual_cost !== undefined) updateData.actual_cost = actual_cost;
    if (shipping_cost !== undefined) updateData.shipping_cost = shipping_cost;
    if (is_free_sample !== undefined) updateData.is_free_sample = is_free_sample;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    if (rejection_reason !== undefined) updateData.rejection_reason = rejection_reason;

    const { data: updated, error: updateError } = await supabase
      .from('sample_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update sample request' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send status notification emails
    if (status && status !== sample.status) {
      try {
        let emailContent: { subject: string; html: string } | null = null;

        if (status === 'approved') {
          emailContent = await sampleApprovedEmail({
            reference_number: sample.reference_number,
            contact_person: sample.contact_person,
            company_name: sample.company_name,
            product_type: sample.product_type,
            sample_fee: sample_fee ?? sample.sample_fee ?? 0,
            is_free_sample: is_free_sample ?? sample.is_free_sample,
          });
        } else if (status === 'shipped' && (tracking_number || sample.tracking_number)) {
          emailContent = await sampleShippedEmail({
            reference_number: sample.reference_number,
            contact_person: sample.contact_person,
            company_name: sample.company_name,
            product_type: sample.product_type,
            shipping_carrier: shipping_carrier || sample.shipping_carrier || 'Courier',
            tracking_number: tracking_number || sample.tracking_number || '',
          });
        } else if (['production', 'delivered', 'rejected'].includes(status)) {
          emailContent = await sampleStatusUpdateEmail({
            reference_number: sample.reference_number,
            contact_person: sample.contact_person,
            company_name: sample.company_name,
            product_type: sample.product_type,
            status,
            rejection_reason: rejection_reason || undefined,
          });
        }

        if (emailContent) {
          await resend.emails.send({
            from: 'Reve Stitching <notifications@revestitching.com>',
            to: sample.email,
            subject: emailContent.subject,
            html: emailContent.html,
          });
        }
      } catch (emailErr) {
        console.error('Status email error:', emailErr);
      }
    }

    return new Response(JSON.stringify({ success: true, data: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Status update error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};