/**
 * Format timestamp as MM:SS or HH:MM:SS.
 * Usable outside the player (e.g. for custom time display or playlists).
 */
export function formatTime(seconds?: number | string): string {
  if (seconds === undefined || seconds === null || seconds === '') return 'N/A';

  const duration =
    typeof seconds === 'string' ? Number.parseFloat(seconds) : seconds;
  if (Number.isNaN(duration)) return 'N/A';

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const secs = Math.floor(duration % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format timestamp as SMPTE-style timecode (HH:MM:SS:FF).
 * Uses non-drop-frame format for simplicity.
 * Usable outside the player (e.g. for custom timecode display).
 */
export function formatTimecode(
  seconds?: number | string,
  frameRate: number | string | null = 30
): string {
  if (seconds === undefined || seconds === null || seconds === '') return 'N/A';

  const normalizedFrameRate = parseFrameRate(frameRate);
  const duration =
    typeof seconds === 'string' ? Number.parseFloat(seconds) : seconds;
  if (Number.isNaN(duration) || duration < 0) return 'N/A';

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const secs = Math.floor(duration % 60);
  const frames = Math.floor((duration % 1) * normalizedFrameRate);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}

/**
 * Convert seconds to frame number.
 * Usable outside the player (e.g. for frame-based UI).
 */
export function secondsToFrames(
  seconds?: number | string,
  frameRate: number | string | null = 30
): number {
  if (seconds === undefined || seconds === null || seconds === '') return 0;

  const normalizedFrameRate = parseFrameRate(frameRate);
  const duration =
    typeof seconds === 'string' ? Number.parseFloat(seconds) : seconds;
  if (Number.isNaN(duration) || duration < 0) return 0;

  return Math.floor(duration * normalizedFrameRate);
}

/**
 * Parse frame rate string (e.g., "30000/1001" or "30") to number.
 * Usable outside the player (e.g. for timecode or frame calculations).
 */
export function parseFrameRate(frameRate?: string | number | null): number {
  if (frameRate === undefined || frameRate === null) return 30;

  if (typeof frameRate === 'number') {
    return Number.isNaN(frameRate) || frameRate <= 0 ? 30 : frameRate;
  }

  // Handle fractional format like "30000/1001" (29.97fps)
  if (frameRate.includes('/')) {
    const [numerator, denominator] = frameRate.split('/').map(Number);
    if (denominator && !Number.isNaN(numerator) && !Number.isNaN(denominator)) {
      const result = numerator / denominator;
      return result <= 0 ? 30 : result;
    }
  }

  const parsed = Number.parseFloat(frameRate);
  return Number.isNaN(parsed) || parsed <= 0 ? 30 : parsed;
}
