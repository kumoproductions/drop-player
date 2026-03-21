import type { HlsConfig } from 'hls.js';
import type { ReactNode } from 'react';

// ============================================================================
// Source Types
// ============================================================================

/**
 * Media source definition (public API)
 */
export interface MediaSource {
  /** Primary playback URL */
  url: string;
  /** Original source URL. Shown as "Original" option in quality selector. */
  originalUrl?: string;
  /** Silent fallback URL (not shown in UI). Reserved for future use. */
  fallbackUrl?: string;
  /** MIME type (inferred from URL extension if omitted) */
  mimeType?: string;
  /** Display label for source selector (auto-generated if omitted) */
  label?: string;
}

/**
 * Source type (inferred from URL or mimeType).
 * @internal
 */
export type SourceType = 'hls' | 'progressive' | 'image' | 'pdf' | 'audio';

/**
 * Normalized source entry.
 * @internal
 */
export interface SourceEntry {
  url: string;
  originalUrl?: string;
  fallbackUrl?: string;
  label: string;
  sourceType: SourceType;
}

/**
 * Normalized sources result.
 * @internal
 */
export interface NormalizedSources {
  mediaMode: MediaMode;
  entries: SourceEntry[];
}

/**
 * Source mode for video delivery (internal)
 */
export type SourceMode = 'hls' | 'progressive';

/**
 * Media mode (video, image, pdf, or audio)
 */
export type MediaMode = 'video' | 'image' | 'pdf' | 'audio';

// ============================================================================
// Image State Types
// ============================================================================

/**
 * Image viewer state.
 * @internal
 */
export interface ImageState {
  /** Current zoom level (1 = 100%) */
  zoom: number;
  /** Pan offset X (pixels) */
  panX: number;
  /** Pan offset Y (pixels) */
  panY: number;
  /** Whether the image has loaded */
  isLoaded: boolean;
  /** Natural image dimensions */
  naturalWidth: number;
  naturalHeight: number;
}

// ============================================================================
// Quality Types
// ============================================================================

/**
 * Simplified HLS level info (subset of hls.js Level)
 */
export interface HlsLevelInfo {
  height: number;
  bitrate: number;
}

/**
 * HLS quality level (HLS playback only)
 */
export interface QualityLevel {
  /** 'auto' = ABR auto-selection, 'manual' = manual selection */
  mode: 'auto' | 'manual';
  /**
   * Resolution e.g., 1080, 720, 480
   * - Auto mode: undefined
   * - Manual mode: selected resolution
   */
  height?: number;
  /** HLS internal level index (manual mode only) */
  levelIndex?: number;
  /** Display label e.g., "Auto", "1080p" */
  label?: string;
}

/**
 * Fallback reason
 */
export type FallbackReason =
  | 'hls-not-supported'
  | 'manifest-load-error'
  | 'manifest-parse-error'
  | 'no-levels'
  | 'network-error'
  | 'playback-error';

/**
 * Fallback event (emitted when primary URL fails and falls back to originalUrl)
 */
export interface FallbackEvent {
  sourceIndex: number;
  reason: FallbackReason;
}

// ============================================================================
// Player State
// ============================================================================

/**
 * Player state (exposed to slots)
 */
export interface PlayerState {
  // Playback state
  isPlaying: boolean;
  isPaused: boolean;
  isEnded: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  showControls: boolean;

  // Source
  activeSourceIndex: number;
  sourceCount: number;
  qualityLevel?: QualityLevel;
  playbackRate: number;
  isPip: boolean;
  timeDisplayFormat: TimeDisplayFormat;
}

// ============================================================================
// Video Metadata
// ============================================================================

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
}

// ============================================================================
// Frame Capture
// ============================================================================

export interface FrameCapture {
  blob: Blob;
  time: number;
  width: number;
  height: number;
  aspectRatio: number;
}

export interface CaptureOptions {
  maxWidth?: number;
  format?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
}

// ============================================================================
// Marker Types
// ============================================================================

export interface Marker {
  time: number;
  type?: 'scene' | 'custom';
  color?: string;
  snapThreshold?: number;
}

// ============================================================================
// Time Display
// ============================================================================

/**
 * Time display format for the time display control.
 * - `'elapsed-total'`: Elapsed / total (e.g. `1:23 / 5:00`)
 * - `'remaining'`: Remaining time (e.g. `-3:37`)
 * - `'timecode'`: Timecode (e.g. `00:01:23:15`)
 * - `'frames'`: Frame number / total frames (e.g. `2475 / 9000`)
 * - `'feet-frames'`: Feet+frames (e.g. `123+04`). Requires `filmGauge` (frames per foot).
 * - `'seconds-frames'`: Seconds+frames (e.g. `1+22`)
 * - `'bars-beats'`: Bars:beats (e.g. `123:2`). Requires `bpm` and `timeSignature`.
 */
export type TimeDisplayFormat =
  | 'elapsed-total'
  | 'remaining'
  | 'timecode'
  | 'frames'
  | 'feet-frames'
  | 'seconds-frames'
  | 'bars-beats';

// ============================================================================
// Feature Flags
// ============================================================================

/**
 * Toggle individual player UI features on/off.
 * All properties default to `false` when omitted.
 * Use `defaultFeatures` spread to enable all, then override selectively.
 */
export interface PlayerFeatures {
  /** Play/pause button (video/audio) */
  playButton?: boolean;
  /** Loop toggle button (video/audio) */
  loop?: boolean;
  /** Time display (video/audio) */
  timeDisplay?: boolean;
  /** Seek bar (video) */
  seekBar?: boolean;
  /** Volume control (video/audio) */
  volume?: boolean;
  /** Ambient light effect button (video) */
  ambientLight?: boolean;
  /** Frame capture save/copy buttons (video/image) */
  capture?: boolean;
  /** HLS quality selector (video) */
  qualitySelector?: boolean;
  /** Fullscreen button (all modes) */
  fullscreen?: boolean;
  /** Zoom controls (image/pdf) */
  zoom?: boolean;
  /** Keyboard shortcuts (video/audio) */
  keyboardShortcuts?: boolean;
  /** Playback speed selector (video/audio) */
  playbackSpeed?: boolean;
  /** Picture-in-Picture button (video) */
  pip?: boolean;
  /** Seek step buttons (skip forward/backward by seekStep seconds) */
  seekStepButtons?: boolean;
  /** Source navigation (prev/next) buttons (multi-source) */
  sourceNavigation?: boolean;
}

// ============================================================================
// Slots
// ============================================================================

export interface PlayerSlots {
  /** Add to the left of the controls bar */
  controlsStart?: ReactNode;

  /** Add to the right of the controls bar (before fullscreen button) */
  controlsEnd?: ReactNode;

  /** Overlay on the timeline (comment markers, etc.). Shown above controls for video (with seek bar) and for audio (no seek bar). */
  seekbarOverlay?: (state: PlayerState) => ReactNode;

  /** Overlay on the top-left of the player */
  topLeftOverlay?: ReactNode;

  /** Overlay on the top-right of the player */
  topRightOverlay?: ReactNode;

  /** Custom loading indicator */
  loadingIndicator?: ReactNode;

  /**
   * Custom error display.
   * `error.name` may be: `errorNoSources` | `errorAborted` | `errorNetwork` | `errorDecode` | `errorNotSupported` | `errorUnknown`.
   * Use with built-in `TranslationKey` / `locale` or your own copy.
   */
  errorDisplay?: (error: Error) => ReactNode;
}

// ============================================================================
// Event Callbacks
// ============================================================================

export interface PlayerEvents {
  // Playback state
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onVolumeChange?: (volume: number, muted: boolean) => void;
  onPlaybackRateChange?: (rate: number) => void;
  /**
   * Fired on playback error. `error.name` may be: `errorAborted` | `errorNetwork` | `errorDecode` | `errorNotSupported` | `errorUnknown`.
   * (No sources is reported via slots.errorDisplay / "No sources" UI, not onError.)
   */
  onError?: (error: Error) => void;
  onLoadedMetadata?: (metadata: VideoMetadata) => void;

  // Buffering state
  onLoadStart?: () => void;
  onProgress?: (buffered: TimeRanges) => void;
  onWaiting?: () => void;
  onCanPlay?: () => void;
  onPlaying?: () => void;

  // Seek
  onSeekStart?: (time: number) => void;
  onSeeking?: (time: number) => void;
  onSeekEnd?: (time: number) => void;

  // Other
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onPipChange?: (isPip: boolean) => void;
  onFrameCapture?: (capture: FrameCapture) => void;

  // Source/Quality
  onActiveSourceChange?: (index: number) => void;
  onQualityLevelChange?: (level: QualityLevel) => void;
  onFallback?: (event: FallbackEvent) => void;

  // Time display
  onTimeDisplayFormatChange?: (format: TimeDisplayFormat) => void;

  // Aggregated state snapshot (fires on every state change)
  onStateChange?: (state: PlayerState) => void;
}

// ============================================================================
// Player Props (grouped)
// ============================================================================

/**
 * Playback behaviour configuration.
 * All properties are optional and have sensible defaults.
 */
export interface PlayerPlaybackConfig {
  /** Start playing immediately. Default: false */
  autoPlay?: boolean;
  /** Loop playback. Default: false */
  loop?: boolean;
  /** Start muted. Default: false */
  muted?: boolean;
  /** Initial volume (0–1). Default: 1 */
  volume?: number;
  /** Start time in seconds. Default: 0 */
  initialTime?: number;
  /** Seconds to skip when pressing arrow left/right. Default: 10 */
  seekStep?: number;
}

/**
 * UI / appearance configuration.
 * Controls what the player shows and how it displays.
 */
export interface PlayerUiConfig {
  /** Show the bottom controls bar. Default: true */
  showControls?: boolean;
  /** Show the source title/selector in the top-left. Default: true when sources >= 1 */
  showTitle?: boolean;
  /** Show status overlay pill on player actions (play, seek, volume, etc.). Default: false */
  showStatusOverlay?: boolean;
  /** Feature flags for individual controls. Default: `defaultFeatures` */
  features?: PlayerFeatures;
  /** Display locale. Default: 'en' */
  locale?: string;
  /**
   * Custom translation overrides, merged on top of the locale's built-in strings.
   * Supply a partial record to override specific keys, or a full record for a new locale.
   */
  translations?: Partial<Translations>;
  /** Frame rate for timecode display (video). Default: 30 */
  frameRate?: number;
  /**
   * Time display formats to cycle through on click.
   * Default: `defaultTimeDisplayFormats` (`['elapsed-total', 'timecode']`).
   * Use `allTimeDisplayFormats` to include frame display.
   * A single-element array locks the display to that format.
   */
  timeDisplayFormats?: TimeDisplayFormat[];
  /**
   * Frames per foot for feet+frames display.
   * Common values: 16 (35mm 4-perf), 40 (16mm).
   * Required when `timeDisplayFormats` includes `'feet-frames'`. Default: 16.
   */
  filmGauge?: number;
  /** BPM for bars-beats display. Required when `timeDisplayFormats` includes `'bars-beats'`. */
  bpm?: number;
  /**
   * Time signature for bars-beats display (e.g. `'4/4'`, `'3/4'`).
   * Default: `'4/4'`.
   */
  timeSignature?: string;
  /** Seekbar markers */
  markers?: Marker[];
}

export interface PlayerProps {
  /**
   * Media sources.
   * - String: single URL (type inferred from extension)
   * - MediaSource: single source with optional originalUrl/fallbackUrl
   * - MediaSource[]: multiple sources (Source Selector enabled)
   */
  sources: MediaSource[] | MediaSource | string | null;

  /** CSS class for the root container */
  className?: string;
  /** CORS setting for media elements. Default: 'anonymous' */
  crossOrigin?: 'anonymous' | 'use-credentials';
  /** Poster image for video */
  poster?: string;

  /**
   * Custom prefix for localStorage keys.
   * Default: 'drop_player' → keys are stored as `drop_player_<key>`.
   * When set, keys are stored as `<storageKey>_<key>`.
   */
  storageKey?: string;

  /**
   * Custom storage adapter. Replaces localStorage for all persisted preferences.
   * Must implement getItem, setItem, and removeItem.
   * When omitted, uses localStorage (SSR-safe no-op when window is undefined).
   */
  storage?: StorageAdapter;

  /** Playback behaviour */
  playback?: PlayerPlaybackConfig;
  /** UI / appearance */
  ui?: PlayerUiConfig;
  /** Custom slot content */
  slots?: PlayerSlots;
  /** Event callbacks */
  events?: PlayerEvents;

  /**
   * hls.js configuration overrides.
   * Merged on top of default settings. Use this to tune ABR behaviour,
   * buffer sizes, or any other hls.js option.
   * @see https://github.com/video-dev/hls.js/blob/master/docs/API.md#fine-tuning
   */
  hlsConfig?: Partial<HlsConfig>;

  /**
   * @internal Override media mode detection. Used by typed wrappers
   * (VideoPlayer, AudioPlayer, etc.) to skip source type inference.
   */
  _mediaMode?: MediaMode;
}

// ============================================================================
// Player Ref (Imperative API)
// ============================================================================

export interface PlayerRef {
  // Playback control
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => void;

  // Seek
  seek: (time: number) => void;
  seekRelative: (delta: number) => void;
  seekToFrame: (frame: number) => void;

  // State getters
  getCurrentTime: () => number;
  getDuration: () => number;
  getVolume: () => number;
  isMuted: () => boolean;
  isPaused: () => boolean;
  isFullscreen: () => boolean;
  getPlaybackRate: () => number;

  // State setters
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;

  // Time display
  getTimeDisplayFormat: () => TimeDisplayFormat;
  setTimeDisplayFormat: (format: TimeDisplayFormat) => void;

  // Frame capture
  captureFrame: (options?: CaptureOptions) => Promise<FrameCapture>;

  // Source navigation
  prev: () => void;
  next: () => void;

  // Fullscreen
  requestFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: () => void;

  // Internal element access
  getVideoElement: () => HTMLVideoElement | null;
  getContainerElement: () => HTMLDivElement | null;
}

// ============================================================================
// Translation Types
// ============================================================================

export type TranslationKey =
  | 'play'
  | 'pause'
  | 'mute'
  | 'unmute'
  | 'fullscreen'
  | 'exitFullscreen'
  | 'quality'
  | 'volume'
  | 'seek'
  | 'loop'
  | 'enableRepeat'
  | 'disableRepeat'
  | 'ambientLight'
  | 'saveCapture'
  | 'copyCapture'
  | 'original'
  | 'error'
  | 'errorAborted'
  | 'errorNetwork'
  | 'errorDecode'
  | 'errorNotSupported'
  | 'errorUnknown'
  | 'errorNoSources'
  | 'captureError'
  | 'captureSaved'
  | 'captureCopied'
  | 'clipboardNotSupported'
  | 'toggleTimeDisplay'
  | 'auto'
  // Image mode keys
  | 'zoomIn'
  | 'zoomOut'
  | 'resetZoom'
  | 'zoomLevel'
  // Playback speed
  | 'playbackSpeed'
  // PIP
  | 'pip'
  | 'exitPip'
  // Source navigation
  | 'previous'
  | 'next'
  | 'seekBackward'
  | 'seekForward'
  // Status overlay
  | 'muted'
  | 'unmuted'
  | 'loopOn'
  | 'loopOff'
  | 'speed';

export type Translations = Record<TranslationKey, string>;

// ============================================================================
// Storage Adapter
// ============================================================================

export interface StorageAdapter {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

// ============================================================================
// useMediaPlayerState Types (Internal)
// ============================================================================

/**
 * Options for useMediaPlayerState hook (shared by AudioCore / VideoCore)
 */
export interface UseMediaPlayerStateOptions {
  storageKey?: string;
  storage?: StorageAdapter;
  initialVolume?: number;
  initialMuted?: boolean;
  initialLoop?: boolean;
  initialTime?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onVolumeChange?: (volume: number, muted: boolean) => void;
  onError?: (error: Error) => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onSeekStart?: (time: number) => void;
  onSeeking?: (time: number) => void;
  onSeekEnd?: (time: number) => void;
  onPlaying?: () => void;
}

/**
 * Imperative API base returned by useMediaPlayerState (extended by AudioCoreRef / VideoCoreRef)
 */
export interface MediaPlayerImperativeBase {
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  seekRelative: (delta: number) => void;
  handleSeekStart: () => void;
  handleSeekChange: (time: number) => void;
  handleSeekEnd: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getVolume: () => number;
  isMuted: () => boolean;
  isPaused: () => boolean;
  getPlaybackRate: () => number;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  toggleLoop: () => void;
  toggleMute: () => void;
}

/**
 * Return type of useMediaPlayerState
 */
export interface UseMediaPlayerStateReturn {
  state: {
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    isPlaying: boolean;
    isEnded: boolean;
    isLoop: boolean;
    isSeeking: boolean;
    seekValue: number;
  };
  handlers: {
    togglePlayPause: () => void;
    handleSeekStart: () => void;
    handleSeekChange: (time: number) => void;
    handleSeekEnd: (time: number) => void;
    handleVolumeChange: (volume: number) => void;
    handleMuteToggle: () => void;
    handleLoopToggle: () => void;
  };
  /** Setters for custom seek UIs (e.g. drag-to-seek) */
  setSeeking: (value: boolean) => void;
  setCurrentTime: (value: number) => void;
  setSeekValue: (value: number) => void;
  /** Set position (and optionally auto-play) to restore on next loadedmetadata (e.g. before source switch) */
  setInitialPositionForNextLoad: (
    position: number | null,
    autoPlay?: boolean
  ) => void;
  storage: {
    getStoredValue: <T>(key: string, defaultValue: T) => T;
    setStoredValue: <T>(key: string, value: T) => void;
  };
  getImperativeBase: () => MediaPlayerImperativeBase;
  /** Play the media element, suppressing AbortError from play/pause races */
  play: () => Promise<void>;
  /** Pause the media element, waiting for any pending play() promise */
  pause: () => void;
}

// ============================================================================
// VideoCore Types (Internal)
// ============================================================================

/**
 * Video playback state exposed by VideoCore to parent.
 * @internal
 */
export interface VideoState {
  // Playback
  isPlaying: boolean;
  isPaused: boolean;
  isEnded: boolean;
  currentTime: number;
  duration: number;

  // Audio
  volume: number;
  isMuted: boolean;

  // Seek
  isSeeking: boolean;
  seekValue: number;

  // Loop
  isLoop: boolean;

  // Ambient light
  isAmbientLight: boolean;
  ambientColor: { r: number; g: number; b: number };

  // Source/Quality
  isPlayingOriginal: boolean;
  qualityLevel?: QualityLevel;
  hlsLevels: HlsLevelInfo[];
  currentHlsLevel: number;

  /** Frame rate detected from HLS manifest, or undefined if not available */
  detectedFrameRate?: number;
}

/**
 * VideoCore props.
 * @internal
 */
export interface VideoCoreProps {
  // Sources (same-mode entries from normalization)
  videoSources: SourceEntry[];
  activeSourceIndex: number;

  // Display
  crossOrigin?: 'anonymous' | 'use-credentials';
  poster?: string;

  // Playback
  autoPlay?: boolean;
  initialLoop?: boolean;
  initialMuted?: boolean;
  initialVolume?: number;
  initialTime?: number;

  // Timecode
  frameRate?: number;

  // Storage
  storageKey?: string;
  storage?: StorageAdapter;

  // Seekbar markers
  markers?: Marker[];

  // hls.js configuration overrides
  hlsConfig?: Partial<HlsConfig>;

  // i18n
  locale?: string;

  // Container ref for drag-to-seek calculations
  containerRef: React.RefObject<HTMLDivElement | null>;

  // State callback - called whenever video state changes
  onStateChange: (state: VideoState) => void;

  // Event callbacks (subset of PlayerEvents relevant to video)
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onVolumeChange?: (volume: number, muted: boolean) => void;
  onPlaybackRateChange?: (rate: number) => void;
  onError?: (error: Error) => void;
  onLoadedMetadata?: (metadata: VideoMetadata) => void;
  onLoadStart?: () => void;
  onProgress?: (buffered: TimeRanges) => void;
  onWaiting?: () => void;
  onCanPlay?: () => void;
  onPlaying?: () => void;
  onSeekStart?: (time: number) => void;
  onSeeking?: (time: number) => void;
  onSeekEnd?: (time: number) => void;
  onFrameCapture?: (capture: FrameCapture) => void;
  onQualityLevelChange?: (level: QualityLevel) => void;
  onFallback?: (event: FallbackEvent) => void;

  /** Called on double-click to toggle fullscreen */
  onFullscreenToggle?: () => void;

  /** Called on touch tap (without drag) to toggle controls overlay visibility */
  onToggleControls?: () => void;
}

/**
 * VideoCore imperative handle.
 * @internal
 */
export interface VideoCoreRef {
  // Playback control
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => void;

  // Seek
  seek: (time: number) => void;
  seekRelative: (delta: number) => void;
  seekToFrame: (frame: number) => void;

  // Seekbar handlers (called from SeekBar component)
  handleSeekStart: () => void;
  handleSeekChange: (time: number) => void;
  handleSeekEnd: (time: number) => void;

  // State getters
  getCurrentTime: () => number;
  getDuration: () => number;
  getVolume: () => number;
  isMuted: () => boolean;
  isPaused: () => boolean;
  getPlaybackRate: () => number;

  // State setters
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;

  // Toggles
  toggleLoop: () => void;
  toggleMute: () => void;
  toggleAmbientLight: () => void;

  // Source/Quality
  setPlayOriginal: (playing: boolean) => void;
  setQualityLevel: (level: number | 'auto') => void;

  // Frame capture
  captureFrame: (options?: CaptureOptions) => Promise<FrameCapture>;
  saveCapture: () => Promise<void>;
  copyCapture: () => Promise<void>;

  // Element access
  getVideoElement: () => HTMLVideoElement | null;
}

// ============================================================================
// ImageCore Types (Internal)
// ============================================================================

/**
 * ImageCore props.
 * @internal
 */
export interface ImageCoreProps {
  /** Image source URL */
  src: string;

  /** Alt text for accessibility */
  alt?: string;

  // Display
  crossOrigin?: 'anonymous' | 'use-credentials';

  /** Min zoom level. Default: 1 */
  minZoom?: number;
  /** Max zoom level. Default: 5 */
  maxZoom?: number;
  /** Zoom step for buttons/wheel. Default: 0.25 */
  zoomStep?: number;

  // i18n
  locale?: string;

  // Container ref for calculations
  containerRef: React.RefObject<HTMLDivElement | null>;

  // State callback - called whenever image state changes
  onStateChange: (state: ImageState) => void;

  // Event callbacks
  onError?: (error: Error) => void;
  onLoad?: () => void;
  onFrameCapture?: (capture: FrameCapture) => void;

  /** Called on double-click to toggle fullscreen */
  onFullscreenToggle?: () => void;
}

/**
 * ImageCore imperative handle.
 * @internal
 */
export interface ImageCoreRef {
  // Zoom control
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setZoom: (zoom: number) => void;

  // State getters
  getZoomLevel: () => number;
  getPan: () => { x: number; y: number };
  isLoaded: () => boolean;

  // Frame capture (same interface as VideoCoreRef)
  captureFrame: (options?: CaptureOptions) => Promise<FrameCapture>;
  saveCapture: () => Promise<void>;
  copyCapture: () => Promise<void>;

  // Element access
  getImageElement: () => HTMLImageElement | null;
}

// ============================================================================
// PdfCore Types (Internal)
// ============================================================================

/**
 * PDF viewer state.
 * @internal
 */
export interface PdfState {
  /** Current zoom level (1 = 100%) */
  zoom: number;
  /** Pan offset X (pixels) */
  panX: number;
  /** Pan offset Y (pixels) */
  panY: number;
  /** Whether the PDF has loaded */
  isLoaded: boolean;
}

/**
 * PdfCore props.
 * @internal
 */
export interface PdfCoreProps {
  /** PDF source URL */
  src: string;

  // Zoom settings
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;

  // Container ref for calculations
  containerRef: React.RefObject<HTMLDivElement | null>;

  // State callback
  onStateChange: (state: PdfState) => void;

  // Event callbacks
  onError?: (error: Error) => void;
  onLoad?: () => void;
}

// ============================================================================
// AudioCore Types (Internal)
// ============================================================================

/**
 * Audio playback state exposed by AudioCore to parent.
 * @internal
 */
export interface AudioState {
  // Playback
  isPlaying: boolean;
  isPaused: boolean;
  isEnded: boolean;
  currentTime: number;
  duration: number;

  // Audio
  volume: number;
  isMuted: boolean;

  // Seek
  isSeeking: boolean;
  seekValue: number;

  // Loop
  isLoop: boolean;

  // Waveform
  waveformReady: boolean;
  /** True when waveform generation failed; readiness can fall back to duration/metadata */
  waveformFailedFallback: boolean;
}

/**
 * AudioCore props.
 * @internal
 */
export interface AudioCoreProps {
  /** Audio source URL */
  src: string;

  // Playback
  autoPlay?: boolean;
  initialLoop?: boolean;
  initialMuted?: boolean;
  initialVolume?: number;
  initialTime?: number;

  // Storage
  storageKey?: string;
  storage?: StorageAdapter;

  // Waveform
  waveColor?: string;
  progressColor?: string;
  waveformScale?: number;

  // i18n
  locale?: string;

  // Container ref for calculations
  containerRef: React.RefObject<HTMLDivElement | null>;

  // State callback - called whenever audio state changes
  onStateChange: (state: AudioState) => void;

  // Event callbacks
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onVolumeChange?: (volume: number, muted: boolean) => void;
  onError?: (error: Error) => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onSeekStart?: (time: number) => void;
  onSeeking?: (time: number) => void;
  onSeekEnd?: (time: number) => void;
  onWaveformReady?: () => void;
}

/**
 * AudioCore imperative handle.
 * @internal
 */
export interface AudioCoreRef {
  // Playback control
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => void;

  // Seek
  seek: (time: number) => void;
  seekRelative: (delta: number) => void;

  // Seekbar handlers (called from waveform component)
  handleSeekStart: () => void;
  handleSeekChange: (time: number) => void;
  handleSeekEnd: (time: number) => void;

  // State getters
  getCurrentTime: () => number;
  getDuration: () => number;
  getVolume: () => number;
  isMuted: () => boolean;
  isPaused: () => boolean;
  getPlaybackRate: () => number;

  // State setters
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;

  // Toggles
  toggleLoop: () => void;
  toggleMute: () => void;

  // Element access
  getAudioElement: () => HTMLAudioElement | null;
}
