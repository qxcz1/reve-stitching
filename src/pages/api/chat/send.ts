import type { APIRoute } from 'astro';
import { getServiceClient } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { sessionId, visitorToken, message } = await request.json();

    if (!sessionId || !visitorToken || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getServiceClient();

    // Verify session belongs to this visitor
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('id, status')
      .eq('id', sessionId)
      .eq('visitor_token', visitorToken)
      .single();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Invalid session.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (session.status === 'closed') {
      return new Response(JSON.stringify({ error: 'Chat session is closed.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Insert message
    const { error } = await supabase.from('chat_messages').insert({
      session_id: sessionId,
      sender: 'visitor',
      message: message.trim(),
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Chat send error:', e);
    return new Response(JSON.stringify({ error: 'Failed to send message.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};