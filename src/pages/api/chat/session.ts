import type { APIRoute } from 'astro';
import { getServiceClient } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { visitorToken, visitorName, visitorEmail } = await request.json();

    if (!visitorToken) {
      return new Response(JSON.stringify({ error: 'Visitor token required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getServiceClient();

    // Check for existing active session
    const { data: existing } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('visitor_token', visitorToken)
      .in('status', ['waiting', 'active'])
      .single();

    if (existing) {
      return new Response(JSON.stringify({ sessionId: existing.id }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create new session
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        visitor_token: visitorToken,
        visitor_name: visitorName?.trim() || null,
        visitor_email: visitorEmail?.trim() || null,
        status: 'waiting',
      })
      .select('id')
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ sessionId: data.id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Chat session error:', e);
    return new Response(JSON.stringify({ error: 'Failed to create session.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};