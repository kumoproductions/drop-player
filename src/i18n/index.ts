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

function shallowEqual(
  a: Partial<Translations> | undefined,
  b: Partial<Translations> | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a) as TranslationKey[];
  const keysB = Object.keys(b) as TranslationKey[];
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => a[k] === b[k]);
}

/**
 * Hook to get translation function.
 * Pass a stable reference for `customTranslations` (e.g. via useMemo) to avoid unnecessary recalculations.
 */
export function usePlayerTranslation(
  locale: string = 'en',
  customTranslations?: Partial<Translations>
) {
  const prevRef = useRef(customTranslations);
  if (!shallowEqual(prevRef.current, customTranslations)) {
    prevRef.current = customTranslations;
  }
  const stableCustom = prevRef.current;

  const mergedTranslations = useMemo(() => {
    const base = getTranslations(locale);
    if (!stableCustom) return base;
    return { ...base, ...stableCustom };
  }, [locale, stableCustom]);

  const t = useMemo(() => {
    return (key: TranslationKey): string => {
      return mergedTranslations[key] ?? key;
    };
  }, [mergedTranslations]);

  return { t };
}

export { en, ja };
