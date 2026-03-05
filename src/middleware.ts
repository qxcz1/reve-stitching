import { defineMiddleware } from 'astro:middleware';
import { getServiceClient } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;

  // Only protect /admin routes (except login)
  if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    const token = context.cookies.get('admin-token')?.value;

    if (!token) {
      return context.redirect('/admin/login');
    }

    // Verify token with Supabase
    const supabase = getServiceClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      context.cookies.delete('admin-token', { path: '/' });
      return context.redirect('/admin/login');
    }

    // Attach user to locals for use in pages
    context.locals.adminUser = data.user;
    context.locals.adminToken = token;
  }

  return next();
});