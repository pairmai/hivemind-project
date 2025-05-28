import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Inter, Kanit } from "next/font/google";
import AppLayout from './AppLayout';
import "../globals.css";

import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
config.autoAddCss = false;

// 👇 import UserProvider ที่เราสร้างไว้
import { UsersProvider } from "../context/UserContext";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const kanit = Kanit({
  subsets: ["thai"],
  weight: ["400", "500", "700"],
});

export const metadata = {
  title: "Hivemind",
  description: "Web Tool for Task and Collaboration Management",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: { locale: string } }>) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  if (!messages) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body className={`${inter.className} ${locale === "th" ? kanit.className : ""}`}> {/* ใช้ Kanit ถ้าเป็นภาษาไทย */}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <UsersProvider> {/* ✅ ห่อไว้ตรงนี้ */}
            <AppLayout>{children}</AppLayout>
          </UsersProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

// import { NextIntlClientProvider } from 'next-intl';
// import { getMessages } from "next-intl/server";
// import { notFound } from "next/navigation";
// import { Inter, Kanit } from "next/font/google";
// import AppLayout from './AppLayout';
// import "../globals.css";

// import "@fortawesome/fontawesome-svg-core/styles.css";
// import { config } from "@fortawesome/fontawesome-svg-core";
// config.autoAddCss = false;

// import { UsersProvider } from "../context/UserContext";

// const inter = Inter({
//   subsets: ["latin"],
//   weight: ["400", "500", "700"],
// });

// const kanit = Kanit({
//   subsets: ["thai"],
//   weight: ["400", "500", "700"],
// });

// export const metadata = {
//   title: "Hivemind",
//   description: "Web Tool for Task and Collaboration Management",
// };

// export default async function RootLayout({
//   children,
//   params,
// }: Readonly<{ children: React.ReactNode; params: { locale: string } }>) {
//   const { locale } = params; // <-- แก้ตรงนี้

//   const messages = await getMessages({ locale });

//   if (!messages) {
//     notFound();
//   }

//   return (
//     <html lang={locale}>
//       <body className={`${inter.className} ${locale === "th" ? kanit.className : ""}`}>
//         <NextIntlClientProvider locale={locale} messages={messages}>
//           <UsersProvider>
//             <AppLayout>{children}</AppLayout>
//           </UsersProvider>
//         </NextIntlClientProvider>
//       </body>
//     </html>
//   );
// }