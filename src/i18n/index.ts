import { useMemo, useRef } from 'react';
import type { TranslationKey, Translations } from '../types';
import { en } from './en';
import { ja } from './ja';

const translations: Record<string, Translations> = {
  en,
  ja,
};

/**
 * Get translations for a locale
 */
export function getTranslations(locale: string): Translations {
  return translations[locale] ?? translations.en;
}

/**
 * Hook to get translation function
 */
export function usePlayerTranslation(
  locale: string = 'en',
  customTranslations?: Partial<Translations>
) {
  const translationsJson = customTranslations
    ? JSON.stringify(customTranslations)
    : undefined;
  const translationsRef = useRef(customTranslations);
  if (translationsJson !== undefined) {
    translationsRef.current = customTranslations;
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: translationsJson is the stable serialization of customTranslations
  const mergedTranslations = useMemo(() => {
    const base = getTranslations(locale);
    if (!translationsRef.current) return base;
    return { ...base, ...translationsRef.current };
  }, [locale, translationsJson]);

  const t = useMemo(() => {
    return (key: TranslationKey): string => {
      return mergedTranslations[key] ?? key;
    };
  }, [mergedTranslations]);

  return { t };
}

export { en, ja };
