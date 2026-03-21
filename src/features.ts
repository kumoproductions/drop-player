import type { PlayerFeatures, TimeDisplayFormat } from './types';

/**
 * Sensible defaults: most controls enabled, heavy options (ambientLight, capture) off.
 * Partial overrides merge on top: `{ capture: true }` enables capture while keeping the rest.
 */
export const defaultFeatures: Required<PlayerFeatures> = {
  playButton: true,
  loop: true,
  timeDisplay: true,
  seekBar: true,
  volume: true,
  ambientLight: false,
  capture: false,
  qualitySelector: true,
  fullscreen: true,
  zoom: true,
  keyboardShortcuts: true,
  playbackSpeed: true,
  pip: true,
  sourceNavigation: true,
};

/**
 * All features off. Use as a base when building a minimal player:
 * `features={{ ...noFeatures, playButton: true, fullscreen: true }}`
 */
export const noFeatures: Required<PlayerFeatures> = {
  playButton: false,
  loop: false,
  timeDisplay: false,
  seekBar: false,
  volume: false,
  ambientLight: false,
  capture: false,
  qualitySelector: false,
  fullscreen: false,
  zoom: false,
  keyboardShortcuts: false,
  playbackSpeed: false,
  pip: false,
  sourceNavigation: false,
};

// ============================================================================
// Time Display Format Presets
// ============================================================================

/**
 * Default time display formats: elapsed/total and timecode.
 * Frames format is excluded by default (opt-in via `allTimeDisplayFormats`).
 */
export const defaultTimeDisplayFormats: TimeDisplayFormat[] = [
  'elapsed-total',
  'remaining',
];

/**
 * All time display formats.
 * Use when all formats should be available:
 * `ui={{ timeDisplayFormats: allTimeDisplayFormats }}`
 */
export const allTimeDisplayFormats: TimeDisplayFormat[] = [
  'elapsed-total',
  'remaining',
  'timecode',
  'frames',
  'seconds-frames',
  'feet-frames',
  'bars-beats',
];

/**
 * Resolve partial features into a fully-specified object.
 * Omitted keys inherit from `defaultFeatures`.
 */
export function resolveFeatures(
  features?: PlayerFeatures
): Required<PlayerFeatures> {
  return { ...defaultFeatures, ...features };
}
