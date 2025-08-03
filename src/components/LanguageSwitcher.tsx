"use client";
import { Button } from "@/components/ui/button";
import { Locale, locales } from "@/i18n/config";
import { useEffect, useState, useTransition } from "react";
import { getUserLocale, setUserLocale } from "@/services/locale";
import clsx from "clsx";

const languageNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

export function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<string>("en");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const fetchLocale = async () => {
      try {
        const locale = await getUserLocale();
        setCurrentLocale(locale);
      } catch (error) {
        console.error("Failed to fetch locale:", error);
      }
    };
    fetchLocale();
  }, []);

  const changeLocale = (newLocale: Locale) => {
    if (currentLocale === newLocale || isPending) return;

    startTransition(async () => {
      try {
        await setUserLocale(newLocale);
        setCurrentLocale(newLocale);
      } catch (error) {
        console.error("Failed to set locale:", error);
      }
    });
  };

  return (
    <div className='absolute top-4 left-4 z-50'>
      <div className='flex gap-1 bg-white rounded-full p-1 shadow-lg'>
        {locales.map(locale => {
          const isActive = currentLocale === locale;

          return (
            <Button
              key={locale}
              variant='ghost'
              size='sm'
              onClick={() => changeLocale(locale)}
              disabled={isPending}
              aria-label={`Switch to ${languageNames[locale]}`}
              data-active={isActive ? "true" : "false"}
              data-locale={locale}
              data-testid={`language-switcher-${locale}`}
              className={clsx(
                "px-3 py-1 text-xs capitalize",
                isActive
                  ? "bg-orange-100 text-orange-700 font-medium"
                  : "text-gray-600 hover:text-orange-600",
                isPending && "opacity-60"
              )}
            >
              {languageNames[locale]}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
