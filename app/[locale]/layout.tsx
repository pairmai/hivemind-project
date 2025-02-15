// app/[locale]/layout.tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { notFound } from "next/navigation";
import { Inter, Prompt } from "next/font/google";
import "../globals.css";

import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
config.autoAddCss = false;

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
        <LanguageSwitcher />
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}