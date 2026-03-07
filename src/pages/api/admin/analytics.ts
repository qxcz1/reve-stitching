import type { APIRoute } from 'astro';
import { getAuthClient } from '../../../lib/supabase';
import { getQuoteAnalytics } from '../../../lib/analytics';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const token = cookies.get('admin_token')?.value;

    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getAuthClient(token);
    const analytics = await getQuoteAnalytics(supabase);

    return new Response(JSON.stringify(analytics), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error('❌ Analytics API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch analytics' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};