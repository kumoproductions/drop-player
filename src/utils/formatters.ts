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
 * Format timestamp as feet+frames (e.g. `123+04`).
 * Usable outside the player (e.g. for film-based workflows).
 * @param seconds - time in seconds
 * @param frameRate - playback frame rate
 * @param filmGauge - frames per foot (e.g. 16 for 35mm 4-perf, 40 for 16mm). Default: 16.
 */
export function formatFeetFrames(
  seconds?: number | string,
  frameRate: number | string | null = 30,
  filmGauge = 16
): string {
  if (seconds === undefined || seconds === null || seconds === '') return 'N/A';

  const normalizedFrameRate = parseFrameRate(frameRate);
  const duration =
    typeof seconds === 'string' ? Number.parseFloat(seconds) : seconds;
  if (Number.isNaN(duration) || duration < 0) return 'N/A';

  const totalFrames = Math.floor(duration * normalizedFrameRate);
  const fpf = filmGauge > 0 ? filmGauge : 16;
  const feet = Math.floor(totalFrames / fpf);
  const remainingFrames = totalFrames % fpf;
  const padWidth = String(Math.ceil(fpf) - 1).length;

  return `${feet}+${String(remainingFrames).padStart(padWidth, '0')}`;
}

/**
 * Format timestamp as seconds+frames (e.g. `1+22`).
 * Usable outside the player (e.g. for frame-accurate editing).
 * @param seconds - time in seconds
 * @param frameRate - playback frame rate
 */
export function formatSecondsFrames(
  seconds?: number | string,
  frameRate: number | string | null = 30
): string {
  if (seconds === undefined || seconds === null || seconds === '') return 'N/A';

  const normalizedFrameRate = parseFrameRate(frameRate);
  const duration =
    typeof seconds === 'string' ? Number.parseFloat(seconds) : seconds;
  if (Number.isNaN(duration) || duration < 0) return 'N/A';

  const wholeSecs = Math.floor(duration);
  const fractionalFrames = Math.floor((duration % 1) * normalizedFrameRate);
  const padWidth = String(Math.ceil(normalizedFrameRate) - 1).length;

  return `${wholeSecs}+${String(fractionalFrames).padStart(padWidth, '0')}`;
}

/**
 * Format timestamp as bars:beats (e.g. `123:2`).
 * Usable outside the player (e.g. for music/DAW workflows).
 * @param seconds - time in seconds
 * @param bpm - beats per minute
 * @param timeSignature - time signature string (e.g. `'4/4'`, `'3/4'`). Default: `'4/4'`.
 */
export function formatBarsBeats(
  seconds?: number | string,
  bpm = 120,
  timeSignature = '4/4'
): string {
  if (seconds === undefined || seconds === null || seconds === '') return 'N/A';

  const duration =
    typeof seconds === 'string' ? Number.parseFloat(seconds) : seconds;
  if (Number.isNaN(duration) || duration < 0 || bpm <= 0) return 'N/A';

  const parts = timeSignature.split('/').map(Number);
  const beatsPerBar = parts.length === 2 && parts[0] > 0 ? parts[0] : 4;

  const totalBeats = (duration / 60) * bpm;
  const bar = Math.floor(totalBeats / beatsPerBar) + 1;
  const beat = Math.floor(totalBeats % beatsPerBar) + 1;

  return `${bar}:${beat}`;
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
