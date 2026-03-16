import type {
  MediaMode,
  MediaSource,
  NormalizedSources,
  SourceEntry,
  SourceType,
} from '../types';
import { isHlsMimeType, isHlsUrl } from './hls';

// ============================================================================
// Extension-based detection
// ============================================================================

const IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.avif',
  '.svg',
  '.bmp',
  '.tiff',
  '.tif',
];

const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
];

const PDF_EXTENSIONS = ['.pdf'];
const PDF_MIME_TYPES = ['application/pdf'];

const AUDIO_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.ogg',
  '.oga',
  '.aac',
  '.flac',
  '.m4a',
  '.opus',
];

const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/aac',
  'audio/flac',
  'audio/webm',
  'audio/mp4',
  'audio/x-m4a',
];

function getPathname(url: string): string {
  try {
    return new URL(url, 'https://dummy').pathname.toLowerCase();
  } catch {
    return '';
  }
}

function hasExtension(url: string, extensions: string[]): boolean {
  const pathname = getPathname(url);
  return extensions.some((ext) => pathname.endsWith(ext));
}

function hasMimeType(mimeType: string | undefined, types: string[]): boolean {
  if (!mimeType) return false;
  return types.includes(mimeType.toLowerCase());
}

// ============================================================================
// Public utilities
// ============================================================================

export function isPdfMimeType(mimeType?: string): boolean {
  return hasMimeType(mimeType, PDF_MIME_TYPES);
}

export function isPdfUrl(url: string): boolean {
  return hasExtension(url, PDF_EXTENSIONS);
}

export function isImageMimeType(mimeType?: string): boolean {
  return hasMimeType(mimeType, IMAGE_MIME_TYPES);
}

export function isImageUrl(url: string): boolean {
  return hasExtension(url, IMAGE_EXTENSIONS);
}

export function isAudioMimeType(mimeType?: string): boolean {
  return hasMimeType(mimeType, AUDIO_MIME_TYPES);
}

export function isAudioUrl(url: string): boolean {
  return hasExtension(url, AUDIO_EXTENSIONS);
}

// ============================================================================
// Source type inference
// ============================================================================

/**
 * Infer source type from URL extension or explicit mimeType.
 * Priority: mimeType (if provided) > URL extension > 'progressive' fallback.
 */
export function inferSourceType(url: string, mimeType?: string): SourceType {
  if (mimeType) {
    if (isHlsMimeType(mimeType)) return 'hls';
    if (hasMimeType(mimeType, IMAGE_MIME_TYPES)) return 'image';
    if (hasMimeType(mimeType, PDF_MIME_TYPES)) return 'pdf';
    if (hasMimeType(mimeType, AUDIO_MIME_TYPES)) return 'audio';
    return 'progressive';
  }

  if (isHlsUrl(url)) return 'hls';
  if (isImageUrl(url)) return 'image';
  if (isPdfUrl(url)) return 'pdf';
  if (isAudioUrl(url)) return 'audio';
  return 'progressive';
}

/**
 * Map a SourceType to its MediaMode
 */
function sourceTypeToMediaMode(type: SourceType): MediaMode {
  switch (type) {
    case 'hls':
    case 'progressive':
      return 'video';
    case 'image':
      return 'image';
    case 'pdf':
      return 'pdf';
    case 'audio':
      return 'audio';
  }
}

/**
 * Auto-generate a label for a source entry
 */
function autoLabel(type: SourceType, index: number, total: number): string {
  if (total === 1) {
    switch (type) {
      case 'hls':
        return 'HLS';
      case 'progressive':
        return 'Original';
      case 'image':
        return 'Image';
      case 'pdf':
        return 'PDF';
      case 'audio':
        return 'Audio';
    }
  }

  const base = (() => {
    switch (type) {
      case 'hls':
        return 'HLS';
      case 'progressive':
        return 'Original';
      case 'image':
        return 'Image';
      case 'pdf':
        return 'PDF';
      case 'audio':
        return 'Audio';
    }
  })();

  return `${base} ${index + 1}`;
}

// ============================================================================
// Normalization
// ============================================================================

/**
 * Normalize source input to MediaSource array
 */
function toMediaSourceArray(
  sources: MediaSource[] | MediaSource | string | null
): MediaSource[] {
  if (!sources) return [];
  if (typeof sources === 'string') return [{ url: sources }];
  if (Array.isArray(sources)) return sources;
  return [sources];
}

/**
 * Normalize sources into { mediaMode, entries }.
 *
 * - MediaMode is determined by sources[0].url
 * - Only entries matching the same MediaMode are included
 * - Labels are auto-generated if omitted
 */
export function normalizeSources(
  sources: MediaSource[] | MediaSource | string | null
): NormalizedSources {
  const sourceArray = toMediaSourceArray(sources);

  if (sourceArray.length === 0) {
    return { mediaMode: 'video', entries: [] };
  }

  const firstType = inferSourceType(
    sourceArray[0].url,
    sourceArray[0].mimeType
  );
  const mediaMode = sourceTypeToMediaMode(firstType);

  const sameModeEntries: Array<{ source: MediaSource; type: SourceType }> = [];
  for (const source of sourceArray) {
    const type = inferSourceType(source.url, source.mimeType);
    if (sourceTypeToMediaMode(type) === mediaMode) {
      sameModeEntries.push({ source, type });
    }
  }

  const entries: SourceEntry[] = sameModeEntries.map(
    ({ source, type }, index) => ({
      url: source.url,
      originalUrl: source.originalUrl,
      fallbackUrl: source.fallbackUrl,
      label: source.label ?? autoLabel(type, index, sameModeEntries.length),
      sourceType: type,
    })
  );

  return { mediaMode, entries };
}
