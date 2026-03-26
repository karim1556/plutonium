"use client";

import { useState, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { getSupportedLocales, getLocaleDisplayName, type Locale } from "@/lib/i18n";

interface LanguageSelectorProps {
  variant?: "compact" | "full";
  onLanguageChange?: (locale: Locale) => void;
}

const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  hi: "🇮🇳",
  mr: "🇮🇳",
  ta: "🇮🇳",
  te: "🇮🇳"
};

export function LanguageSelector({ variant = "compact", onLanguageChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<Locale>("en");
  const locales = getSupportedLocales();

  useEffect(() => {
    const saved = localStorage.getItem("preferred-locale") as Locale | null;
    if (saved && locales.includes(saved)) {
      setCurrentLocale(saved);
    }
  }, [locales]);

  const handleSelect = (locale: Locale) => {
    setCurrentLocale(locale);
    localStorage.setItem("preferred-locale", locale);
    setIsOpen(false);
    onLanguageChange?.(locale);
  };

  if (variant === "compact") {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <Globe className="h-4 w-4" />
          <span>{localeFlags[currentLocale]}</span>
          <ChevronDown className={`h-3 w-3 transition ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
              {locales.map((locale) => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => handleSelect(locale)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                    currentLocale === locale
                      ? "bg-sky-50 text-sky-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{localeFlags[locale]}</span>
                    <span>{getLocaleDisplayName(locale)}</span>
                  </span>
                  {currentLocale === locale && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-slate-100 bg-white p-5">
      <div className="flex items-center gap-2 text-slate-900">
        <Globe className="h-5 w-5" />
        <p className="text-sm font-semibold">Language / भाषा</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {locales.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => handleSelect(locale)}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
              currentLocale === locale
                ? "bg-sky-100 text-sky-700 ring-2 ring-sky-200"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span>{localeFlags[locale]}</span>
            <span>{getLocaleDisplayName(locale)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
