import type { APIRoute } from 'astro';
import { getSupabase } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';
    const ref = (formData.get('ref') as string) || 'temp';

    if (!file || file.size === 0) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File exceeds 10MB limit' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate MIME type
    const allowedTypes = [
      'application/pdf',
      'application/postscript',
      'application/illustrator',
      'image/png',
      'image/jpeg',
      'image/webp',
    ];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: `File type "${file.type}" is not allowed` }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sanitize filename
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_');

    const timestamp = Date.now();
    const path = `${ref}/${folder}/${timestamp}_${safeName}`;

    const supabase = getSupabase();
    const buffer = await file.arrayBuffer();

    const { data, error } = await supabase.storage
      .from('quote-uploads')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('[Upload] Failed:', error.message);
      return new Response(JSON.stringify({ error: 'Upload failed: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[Upload] Success:', data.path);

    return new Response(JSON.stringify({
      success: true,
      path: data.path,
      name: file.name,
      size: file.size,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[Upload] Error:', err);
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};