// Components
export { AudioCore } from './components/AudioCore';
export { ImageCore } from './components/ImageCore';
export { PdfCore } from './components/PdfCore';
export { Player } from './components/Player';
export { VideoCore } from './components/VideoCore';

// Semantic aliases (same implementation, clearer intent)
export {
  AudioPlayer,
  ImageViewer,
  PdfViewer,
  VideoPlayer,
} from './components/wrappers';
// Features
// Time Display Format Presets
export {
  allTimeDisplayFormats,
  defaultFeatures,
  defaultTimeDisplayFormats,
  noFeatures,
} from './features';

// Types
export type {
  // AudioCore types
  AudioCoreProps,
  AudioCoreRef,
  AudioState,
  CaptureOptions,
  FallbackEvent,
  FallbackReason,
  // Capture types
  FrameCapture,
  // Quality types
  HlsLevelInfo,
  // ImageCore types
  ImageCoreProps,
  ImageCoreRef,
  ImageState,
  // Marker types
  Marker,
  // Media mode
  MediaMode,
  // Source types
  MediaSource,
  NormalizedSources,
  // PdfCore types
  PdfCoreProps,
  PdfCoreRef,
  PdfState,
  // Events
  PlayerEvents,
  // Feature flags
  PlayerFeatures,
  // Props config groups
  PlayerPlaybackConfig,
  // Props and Ref
  PlayerProps,
  PlayerRef,
  // Slots
  PlayerSlots,
  // State types
  PlayerState,
  PlayerUiConfig,
  QualityLevel,
  SourceEntry,
  SourceType,
  // Storage
  StorageAdapter,
  // Time Display
  TimeDisplayFormat,
  // Translation
  TranslationKey,
  Translations,
  // VideoCore types
  VideoCoreProps,
  VideoCoreRef,
  VideoMetadata,
  VideoState,
} from './types';

// Utils
export {
  inferSourceType,
  isHlsMimeType,
  isHlsUrl,
  isPdfMimeType,
  isPdfUrl,
  normalizeSources,
} from './utils';

// Formatters
export {
  formatBarsBeats,
  formatFeetFrames,
  formatSecondsFrames,
  formatTime,
  formatTimecode,
  parseFrameRate,
  secondsToFrames,
} from './utils/formatters';
