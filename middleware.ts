import createNextIntlMiddleware from 'next-intl/middleware';

export default createNextIntlMiddleware({
  locales: ['en', 'th'],
  defaultLocale: 'en',
});

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};