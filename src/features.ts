import type {
  DirectionalToggle,
  PlayerFeatures,
  ResolvedDirectional,
  TimeDisplayFormat,
} from './types';

// ============================================================================
// Resolved Features (internal use — directional toggles fully expanded)
// ============================================================================

/** Internal type where directional toggles are resolved to `ResolvedDirectional`. */
export interface ResolvedPlayerFeatures
  extends Omit<
    Required<PlayerFeatures>,
    'seekStepButtons' | 'sourceNavigation'
  > {
  seekStepButtons: ResolvedDirectional;
  sourceNavigation: ResolvedDirectional;
}

// ============================================================================
// Feature Presets
// ============================================================================

/**
 * Sensible defaults: most controls enabled, opt-in features off.
 * Partial overrides merge on top: `{ saveCapture: true }` enables save capture while keeping the rest.
 */
export const defaultFeatures: Required<PlayerFeatures> = {
  playButton: true,
  loop: true,
  timeDisplay: true,
  seekBar: true,
  volume: true,
  saveCapture: false,
  copyCapture: false,
  qualitySelector: true,
  fullscreen: true,
  zoom: true,
  keyboardShortcuts: true,
  playbackSpeed: true,
  pip: true,
  seekStepButtons: false,
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
  saveCapture: false,
  copyCapture: false,
  qualitySelector: false,
  fullscreen: false,
  zoom: false,
  keyboardShortcuts: false,
  playbackSpeed: false,
  pip: false,
  seekStepButtons: false,
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

// ============================================================================
// Resolvers
// ============================================================================

/**
 * Resolve a `DirectionalToggle` into a fully-specified `ResolvedDirectional`.
 * - `undefined` → both directions use `defaultValue`
 * - `boolean`   → both directions use that boolean
 * - object      → omitted keys default to `true` (providing an object enables the feature)
 */
export function resolveDirectional(
  value: DirectionalToggle | undefined,
  defaultValue: boolean
): ResolvedDirectional {
  if (value === undefined)
    return { backward: defaultValue, forward: defaultValue };
  if (typeof value === 'boolean') return { backward: value, forward: value };
  return { backward: value.backward ?? true, forward: value.forward ?? true };
}

/**
 * Resolve partial features into a fully-specified object.
 * Omitted keys inherit from `defaultFeatures`.
 */
export function resolveFeatures(
  features?: PlayerFeatures
): ResolvedPlayerFeatures {
  const merged = { ...defaultFeatures, ...features };
  return {
    playButton: merged.playButton,
    loop: merged.loop,
    timeDisplay: merged.timeDisplay,
    seekBar: merged.seekBar,
    volume: merged.volume,
    saveCapture: merged.saveCapture,
    copyCapture: merged.copyCapture,
    qualitySelector: merged.qualitySelector,
    fullscreen: merged.fullscreen,
    zoom: merged.zoom,
    keyboardShortcuts: merged.keyboardShortcuts,
    playbackSpeed: merged.playbackSpeed,
    pip: merged.pip,
    seekStepButtons: resolveDirectional(
      merged.seekStepButtons,
      defaultFeatures.seekStepButtons as boolean
    ),
    sourceNavigation: resolveDirectional(
      merged.sourceNavigation,
      defaultFeatures.sourceNavigation as boolean
    ),
  };
}
