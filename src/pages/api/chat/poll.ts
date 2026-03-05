import type { APIRoute } from 'astro';
import { getServiceClient } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const sessionId = url.searchParams.get('session');
    const visitorToken = url.searchParams.get('token');
    const after = url.searchParams.get('after') || '1970-01-01T00:00:00Z';

    if (!sessionId || !visitorToken) {
      return new Response(JSON.stringify({ error: 'Missing parameters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getServiceClient();

    // Verify session ownership
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

    // Fetch new messages (only admin messages — visitor already has their own)
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('id, sender, message, created_at')
      .eq('session_id', sessionId)
      .eq('sender', 'admin')
      .gt('created_at', after)
      .order('created_at', { ascending: true });

    return new Response(JSON.stringify({
      messages: messages || [],
      sessionStatus: session.status,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Chat poll error:', e);
    return new Response(JSON.stringify({ error: 'Poll failed.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};