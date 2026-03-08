import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;

  // Skip middleware for API routes (they handle their own auth)
  if (path.startsWith('/api/')) {
    return next();
  }

  // Only protect /admin routes (except /admin/login)
  const isAdminRoute = path.startsWith('/admin') || path.startsWith('/admin/');
  const isLoginPage = path === '/admin/login' || path === '/admin/login/';

  if (isAdminRoute && !isLoginPage) {
    try {
      // Dynamic import to avoid top-level import issues
      const { verifyAdminToken, COOKIE_CONFIG } = await import('./lib/auth');

      const token = context.cookies.get(COOKIE_CONFIG.name)?.value;

      if (!token) {
        console.log('[Middleware] No admin token cookie found, redirecting to login');
        return context.redirect('/admin/login');
      }

      const admin = verifyAdminToken(token);

      if (!admin) {
        console.log('[Middleware] Token invalid or expired, clearing and redirecting');
        context.cookies.delete(COOKIE_CONFIG.name, { path: '/' });
        return context.redirect('/admin/login');
      }

      // Attach admin info for pages to use
      context.locals.admin = admin;
    } catch (err) {
      console.error('[Middleware] Auth error:', err);
      return context.redirect('/admin/login');
    }
  }

  return next();
});