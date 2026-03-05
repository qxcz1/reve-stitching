import type { APIRoute } from 'astro';
import { getServiceClient } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { sessionId, visitorToken } = await request.json();

    if (!sessionId || !visitorToken) {
      return new Response(JSON.stringify({ error: 'Missing fields.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getServiceClient();

    // Verify ownership and update timestamp
    const { error } = await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('visitor_token', visitorToken)
      .in('status', ['waiting', 'active']);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};