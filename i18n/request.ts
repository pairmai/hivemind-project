import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

const locales = ['th', 'en'];

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  };
});

// import { getRequestConfig } from "next-intl/server";
// import { routing } from "./routing";

// export default getRequestConfig(async ({ requestLocale }) => {
//   let locale = await requestLocale;

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   if (!locale || !routing.locales.includes(locale as any)) {
//     locale = routing.defaultLocale;
//   }

//   return {
//     locale,
//     messages: (await import(`@/messages/${locale}.json`)).default,
//   };
// });