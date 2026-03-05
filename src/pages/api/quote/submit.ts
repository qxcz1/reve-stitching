// src/pages/api/quote/submit.ts

import type { APIRoute } from 'astro';
import { getSupabase } from '../../../lib/supabase';
import { generateReferenceNumber } from '../../../lib/services/reference';
import { generateAISummary } from '../../../lib/services/ai-summary';
import { notifyNewQuote, sendQuoteCustomerConfirmation } from '../../../lib/notifications';
import { uploadFile, uploadMultipleFiles } from '../../../lib/services/storage';
import type { QuoteSubmitResponse, QuoteRequest } from '../../../lib/types/quote';

export const prerender = false;

// ─── Validation ───

interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

function validateFormData(data: Record<string, any>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.product_type?.trim()) errors.product_type = 'Product type is required.';
  if (!data.fabric_type?.trim()) errors.fabric_type = 'Fabric type is required.';

  const gsm = Number(data.gsm);
  if (!gsm || gsm < 100 || gsm > 500) errors.gsm = 'GSM must be between 100 and 500.';

  const quantity = Number(data.quantity);
  if (!quantity || quantity < 1) errors.quantity = 'Quantity is required.';

  if (!data.sizes || data.sizes.length === 0) errors.sizes = 'At least one size is required.';

  if (!data.target_date) errors.target_date = 'Target delivery date is required.';

  if (!data.destination?.trim()) errors.destination = 'Shipping destination is required.';

  if (!data.company_name?.trim()) errors.company_name = 'Company name is required.';

  if (!data.contact_person?.trim()) errors.contact_person = 'Contact person is required.';

  if (!data.email?.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email address.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ─── POST Handler ───

export const POST: APIRoute = async ({ request }) => {
  const json = (body: QuoteSubmitResponse, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    // ── 1. Parse form data ──

    const formData = await request.formData();

    const parseJsonField = (key: string, fallback: any = []) => {
      const raw = formData.get(key) as string | null;
      if (!raw) return fallback;
      try { return JSON.parse(raw); } catch { return fallback; }
    };

    const fields = {
      product_type:   (formData.get('selectedProduct') as string || '').trim(),
      fabric_type:    (formData.get('fabricType') as string || '').trim(),
      gsm:            Number(formData.get('gsmRange')) || 0,
      quantity:       Number(formData.get('quantity')) || 0,
      sizes:          parseJsonField('sizeRange', []),
      color_count:    Number(formData.get('colorQuantity')) || 1,
      customizations: parseJsonField('customizations', []),
      has_sample:     formData.get('sampleRequired') === 'true',
      is_rush:        formData.get('rushOrder') === 'true',
      target_date:    (formData.get('deliveryDate') as string || '').trim(),
      destination:    (formData.get('shippingDestination') as string || '').trim(),
      company_name:   (formData.get('companyName') as string || '').trim(),
      contact_person: (formData.get('contactPerson') as string || '').trim(),
      email:          (formData.get('email') as string || '').trim().toLowerCase(),
      phone:          (formData.get('phone') as string || '').trim() || null,
      notes:          (formData.get('additionalNotes') as string || '').trim() || null,
    };

    // ── 2. Validate ──

    const validation = validateFormData(fields);
    if (!validation.valid) {
      return json({ success: false, error: 'Validation failed.', errors: validation.errors }, 422);
    }

    // ── 3. Generate reference number ──

    const reference_number = await generateReferenceNumber();
    console.log(`[Quote] Processing ${reference_number} from ${fields.company_name}`);

    // ── 4. Upload files ──

    let tech_pack_url: string | null = null;
    let reference_images: string[] = [];

    const techPackFile = formData.get('techPack') as File | null;
    if (techPackFile && techPackFile.size > 0) {
      if (techPackFile.size > 10 * 1024 * 1024) {
        return json({ success: false, error: 'Tech pack file exceeds 10 MB limit.' }, 422);
      }
      tech_pack_url = await uploadFile(reference_number, 'techpack', techPackFile);
    }

    const refImageFiles = formData.getAll('referenceImages') as File[];
    const validImages = refImageFiles.filter((f) => f.size > 0 && f.size <= 10 * 1024 * 1024);
    if (validImages.length > 0) {
      reference_images = await uploadMultipleFiles(reference_number, 'images', validImages);
    }

    // ── 5. Generate AI summary (non-blocking failure) ──

    let aiResult = {
      ai_summary: null as string | null,
      estimated_price_range: null as string | null,
      suggested_moq: null as number | null,
      ai_flags: null as string | null,
    };

    try {
      aiResult = await generateAISummary(fields);
    } catch (err) {
      console.error('[Quote] AI summary failed, continuing without it:', err);
    }

    // ── 6. Insert into database ──

    const supabase = getSupabase();

    const insertPayload = {
      reference_number,
      status: 'new' as const,
      ...fields,
      tech_pack_url,
      reference_images,
      ...aiResult,
      admin_notes: null,
      assigned_to: null,
    };

    const { data: inserted, error: dbError } = await supabase
      .from('quote_requests')
      .insert(insertPayload)
      .select()
      .single();

    if (dbError || !inserted) {
      console.error('[Quote] Database insert failed:', dbError);
      return json({ success: false, error: 'Failed to save quote request. Please try again.' }, 500);
    }

    console.log(`[Quote] Saved ${reference_number} with id ${inserted.id}`);

    // ── 7. Send notifications (fire-and-settle) ──

    const quoteRecord = inserted as QuoteRequest;

    await Promise.allSettled([
        notifyNewQuote(quoteRecord),
        sendQuoteCustomerConfirmation(quoteRecord),
      ]);

    // ── 8. Return success ──

    return json({
      success: true,
      referenceNumber: reference_number,
    });

  } catch (err) {
    console.error('[Quote] Unexpected error:', err);
    return json({ success: false, error: 'An unexpected error occurred. Please try again.' }, 500);
  }
};

// ─── Reject other methods ───

export const ALL: APIRoute = async () => {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST' },
  });
};