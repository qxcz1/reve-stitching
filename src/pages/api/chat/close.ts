import type { APIRoute } from 'astro';
import { getServiceClient } from '../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const text = await request.text();
    const { sessionId, visitorToken } = JSON.parse(text);

    if (!sessionId || !visitorToken) {
      return new Response('Missing fields', { status: 400 });
    }

    const supabase = getServiceClient();

    // Verify ownership
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('id, status')
      .eq('id', sessionId)
      .eq('visitor_token', visitorToken)
      .single();

    if (!session || session.status === 'closed') {
      return new Response('OK', { status: 200 });
    }

    // Close the session
    await supabase
      .from('chat_sessions')
      .update({ status: 'closed' })
      .eq('id', sessionId);

    // Add system message
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      sender: 'visitor',
      message: '(Visitor left the chat)',
    });

    return new Response('OK', { status: 200 });
  } catch (e) {
    return new Response('Error', { status: 500 });
  }
};