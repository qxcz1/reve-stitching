import type { APIRoute } from 'astro';
import { getServiceClient } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const supabase = getServiceClient();

    const { count: totalContacts } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true });

    const { count: newContacts } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new');

    const { count: waitingChats } = await supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'waiting');

    const { count: activeChats } = await supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    return new Response(JSON.stringify({
      totalContacts: totalContacts || 0,
      newContacts: newContacts || 0,
      waitingChats: waitingChats || 0,
      activeChats: activeChats || 0,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};