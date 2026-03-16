/**
 * HLS MIME types
 */
export const HLS_MIME_TYPES = [
  'application/x-mpegURL',
  'application/vnd.apple.mpegurl',
] as const;

/**
 * Check if MIME type is HLS
 */
export function isHlsMimeType(mimeType?: string): boolean {
  if (!mimeType) return false;
  return HLS_MIME_TYPES.some(
    (type) => mimeType.toLowerCase() === type.toLowerCase()
  );
}

/**
 * Check if URL is HLS stream (by extension)
 */
export function isHlsUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const pathname = new URL(url, 'https://example.com').pathname;
    return pathname.toLowerCase().endsWith('.m3u8');
  } catch (error) {
    const urlError =
      error instanceof Error ? error : new Error('Invalid URL in isHlsUrl');
    throw new Error(`Invalid URL in isHlsUrl: ${url}. ${urlError.message}`);
  }
}

/**
 * Infer MIME type from URL extension
 */
export function inferMimeType(url: string): string | undefined {
  try {
    const pathname = new URL(url, 'https://example.com').pathname.toLowerCase();

    if (pathname.endsWith('.m3u8')) {
      return 'application/x-mpegURL';
    }
    if (pathname.endsWith('.mp4')) {
      return 'video/mp4';
    }
    if (pathname.endsWith('.webm')) {
      return 'video/webm';
    }
    if (pathname.endsWith('.ogg') || pathname.endsWith('.ogv')) {
      return 'video/ogg';
    }
    if (pathname.endsWith('.mov')) {
      return 'video/quicktime';
    }
    if (pathname.endsWith('.avi')) {
      return 'video/x-msvideo';
    }
    if (pathname.endsWith('.mkv')) {
      return 'video/x-matroska';
    }
    if (pathname.endsWith('.pdf')) {
      return 'application/pdf';
    }

    return undefined;
  } catch (error) {
    const urlError =
      error instanceof Error
        ? error
        : new Error('Invalid URL in inferMimeType');
    throw new Error(
      `Invalid URL in inferMimeType: ${url}. ${urlError.message}`
    );
  }
}
