export type Locale = 'en' | 'ja';

export function detectLocale(): Locale {
  return window.location.pathname.startsWith('/ja') ? 'ja' : 'en';
}

export function getLocalePath(locale: Locale): string {
  return locale === 'ja' ? '/ja' : '/';
}
