"use client";

import { NextIntlClientProvider } from "next-intl";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function Provider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const locale = pathname?.split("/")?.[1] || "en";

  let messages;
  try {
    messages = require(`../../public/locales/${locale}/common.json`);
  } catch (error) {
    messages = require("../../public/locales/en/common.json");
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
