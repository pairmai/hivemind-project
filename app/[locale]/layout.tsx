import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Inter, Prompt } from "next/font/google";
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

const prompt = Prompt({
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
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <UsersProvider> {/* ✅ ห่อไว้ตรงนี้ */}
            <AppLayout>{children}</AppLayout>
          </UsersProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
