import type { APIRoute } from 'astro';
import { getSupabase } from '../../../lib/supabase';
import { generateReferenceNumber } from '../../../lib/services/reference';
import { generateAISummary } from '../../../lib/services/ai-summary';
import { notifyNewQuote, sendQuoteCustomerConfirmation } from '../../../lib/notifications';
import type { QuoteRequest } from '../../../lib/types/quote';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const parseJsonField = (val: any, fallback: any = []) => {
      if (!val) return fallback;
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return fallback; }
      }
      return fallback;
    };

    const product_type = (body.selectedProduct || '').trim();
    const fabric_type = (body.fabricType || '').trim();
    const gsm = Number(body.gsmRange) || 0;
    const quantity = Number(body.quantity) || 0;
    const sizes = parseJsonField(body.sizeRange, []);
    const color_count = Number(body.colorQuantity) || 1;
    const customizations = parseJsonField(body.customizations, []);
    const has_sample = body.sampleRequired === 'true';
    const is_rush = body.rushOrder === 'true';
    const target_date = (body.deliveryDate || '').trim();
    const destination = (body.shippingDestination || '').trim();
    const company_name = (body.companyName || '').trim();
    const contact_person = (body.contactPerson || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const phone = (body.phone || '').trim() || null;
    const notes = (body.additionalNotes || '').trim() || null;

    // Validate
    const errors: string[] = [];
    if (!product_type) errors.push('Product type is required.');
    if (!fabric_type) errors.push('Fabric type is required.');
    if (!gsm || gsm < 100 || gsm > 500) errors.push('GSM must be between 100 and 500.');
    if (!quantity || quantity < 1) errors.push('Quantity is required.');
    if (!sizes || sizes.length === 0) errors.push('At least one size is required.');
    if (!target_date) errors.push('Target delivery date is required.');
    if (!destination) errors.push('Shipping destination is required.');
    if (!company_name) errors.push('Company name is required.');
    if (!contact_person) errors.push('Contact person is required.');
    if (!email) errors.push('Email is required.');

    if (errors.length > 0) {
      return new Response(JSON.stringify({ success: false, error: errors.join(' ') }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate reference number
    const reference_number = await generateReferenceNumber();
    console.log(`[Quote] Processing ${reference_number} from ${company_name}`);

        // ── Upload files from Base64 ──
        const supabase = getSupabase();
        let tech_pack_url: string | null = null;
        const reference_images: string[] = [];
    
        // Upload tech pack if provided
        if (body.techPackBase64 && body.techPackName) {
          try {
            const buffer = Buffer.from(body.techPackBase64, 'base64');
            const safeName = (body.techPackName as string).replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_');
            const path = `${reference_number}/techpack/${Date.now()}_${safeName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('quote-uploads')
              .upload(path, buffer, {
                contentType: 'application/pdf',
                upsert: false,
              });
            
            if (!uploadError) {
              tech_pack_url = path;
              console.log(`[Quote] Tech pack uploaded: ${path}`);
            } else {
              console.error('[Quote] Tech pack upload failed:', uploadError.message);
            }
          } catch (err) {
            console.error('[Quote] Tech pack upload error:', err);
          }
        }
    
        // Upload reference images if provided
        if (body.referenceImagesBase64 && Array.isArray(body.referenceImagesBase64)) {
          for (let i = 0; i < body.referenceImagesBase64.length; i++) {
            try {
              const buffer = Buffer.from(body.referenceImagesBase64[i], 'base64');
              const safeName = (body.referenceImageNames[i] as string).replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_');
              const path = `${reference_number}/images/${Date.now()}_${i}_${safeName}`;
              
              const { error: uploadError } = await supabase.storage
                .from('quote-uploads')
                .upload(path, buffer, {
                  contentType: 'image/jpeg',
                  upsert: false,
                });
              
              if (!uploadError) {
                reference_images.push(path);
                console.log(`[Quote] Image ${i + 1} uploaded: ${path}`);
              } else {
                console.error(`[Quote] Image ${i + 1} upload failed:`, uploadError.message);
              }
            } catch (err) {
              console.error(`[Quote] Image ${i + 1} upload error:`, err);
            }
          }
        }

    // AI summary
    let ai_summary: string | null = null;
    let estimated_price_range: string | null = null;
    let suggested_moq: number | null = null;
    let ai_flags: string | null = null;

    try {
      const aiResult = await generateAISummary({
        product_type, fabric_type, gsm, quantity, sizes,
        color_count, customizations, has_sample, is_rush,
        target_date, destination, notes,
      });
      ai_summary = aiResult.ai_summary;
      estimated_price_range = aiResult.estimated_price_range;
      suggested_moq = aiResult.suggested_moq;
      ai_flags = aiResult.ai_flags;
    } catch (err) {
      console.error('[Quote] AI summary failed:', err);
    }

    const { data: inserted, error: dbError } = await supabase
      .from('quote_requests')
      .insert({
        reference_number,
        status: 'new',
        product_type,
        fabric_type,
        gsm,
        quantity,
        sizes,
        color_count,
        customizations,
        has_sample,
        is_rush,
        target_date,
        destination,
        company_name,
        contact_person,
        email,
        phone,
        notes,
        tech_pack_url,
        reference_images,
        ai_summary,
        estimated_price_range,
        suggested_moq,
        ai_flags,
        admin_notes: null,
        assigned_to: null,
      })
      .select()
      .single();

    if (dbError || !inserted) {
      console.error('[Quote] Database insert failed:', dbError);
      return new Response(JSON.stringify({ success: false, error: 'Failed to save. Please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Quote] Saved ${reference_number} with id ${(inserted as any).id}`);

    // Send notifications
    const quoteRecord = inserted as unknown as QuoteRequest;

    await Promise.allSettled([
      notifyNewQuote(quoteRecord),
      sendQuoteCustomerConfirmation(quoteRecord),
    ]);

    return new Response(JSON.stringify({
      success: true,
      referenceNumber: reference_number,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[Quote] Unexpected error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Something went wrong. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};