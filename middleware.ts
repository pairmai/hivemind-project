import createNextIntlMiddleware from 'next-intl/middleware';

export default createNextIntlMiddleware({
  locales: ['en', 'th'],
  defaultLocale: 'th',
});

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};



// import createMiddleware from "next-intl/middleware";
// import { routing } from "./i18n/routing";

// export default createMiddleware(routing);

// export const config = {
//   matcher: ["/", "/(en|th)/:path*"], 
// };