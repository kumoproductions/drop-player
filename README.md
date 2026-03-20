# drop-player

drop-player is a comprehensive React media player powering [drop.mov](https://drop.mov).

React media player for video (HLS / progressive), audio, image, and PDF.
One unified component — media mode is inferred from the source URL.

## Install

```bash
npm i drop-player lucide-react
```

**Required peers:** `react` >=18, `react-dom` >=18, `lucide-react` >=0.300

**Optional peers** (install only when needed):

| Package | When |
|---------|------|
| `hls.js` >=1.4 | HLS video (`.m3u8`) |
| `waveform-data` >=4.5 | Audio waveform display |

## Quick start

```tsx
import { VideoPlayer } from 'drop-player';
import 'drop-player/styles.css';

function App() {
  return (
    <div style={{ width: 640, height: 360 }}>
      <VideoPlayer sources="https://example.com/video.mp4" />
    </div>
  );
}
```

The stylesheet is required — it provides `drop-player`-prefixed classes and CSS variables.

## Components

| Export | Intent |
|--------|--------|
| `Player` | Generic — mode inferred from URL |
| `VideoPlayer` | Video |
| `AudioPlayer` | Audio |
| `ImageViewer` | Image |
| `PdfViewer` | PDF |

All share the same `PlayerProps` and `PlayerRef`. The aliases exist purely for readability; media mode is always auto-detected.

<!-- interactive:demo -->

## Sources

```tsx
// String — type inferred from extension
<VideoPlayer sources="https://example.com/video.mp4" />

// Object — HLS with original-quality fallback
<VideoPlayer sources={{ url: 'stream.m3u8', originalUrl: 'original.mp4' }} />

// Array — source selector shown
<VideoPlayer sources={[
  { url: 'stream.m3u8', label: 'HLS' },
  { url: 'original.mp4', label: 'Original' },
]} />

// null — shows error UI
<VideoPlayer sources={null} />
```

Type is detected from path extension (`.mp4`, `.m3u8`, `.pdf`, `.jpg`, …) or `mimeType`.

## Props

Props are organised into four groups to keep the surface area manageable:

```tsx
<VideoPlayer
  sources="video.mp4"
  className="rounded-lg"
  crossOrigin="anonymous"
  poster="poster.jpg"

  playback={{ autoPlay: true, volume: 0.8 }}
  ui={{ features: { capture: true }, locale: 'ja' }}
  slots={{ topRightOverlay: <Badge /> }}
  events={{ onPlay: () => log('playing') }}
/>
```

### Top-level

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sources` | `string \| MediaSource \| MediaSource[] \| null` | — | Media source(s) |
| `className` | `string` | — | CSS class on root container |
| `crossOrigin` | `'anonymous' \| 'use-credentials'` | `'anonymous'` | CORS for media elements |
| `poster` | `string` | — | Poster image (video) |
| `storageKey` | `string` | — | Custom prefix for localStorage keys (default: `drop_player_`, custom: `<storageKey>_`). Muted state is persisted automatically. |
| `storage` | `StorageAdapter` | — | Custom storage backend (must implement `getItem`, `setItem`, `removeItem`). Defaults to localStorage (SSR-safe). |
| `hlsConfig` | `Partial<HlsConfig>` | — | Custom [hls.js config](https://github.com/video-dev/hls.js/blob/master/docs/API.md#fine-tuning) overrides |

### `playback` — `PlayerPlaybackConfig`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `autoPlay` | `boolean` | `false` | Start immediately |
| `loop` | `boolean` | `false` | Loop playback |
| `muted` | `boolean` | `false` | Start muted |
| `volume` | `number` | `1` | Initial volume (0–1) |
| `initialTime` | `number` | `0` | Start position in seconds |

### `ui` — `PlayerUiConfig`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `showControls` | `boolean` | `true` | Show bottom control bar |
| `showTitle` | `boolean` | auto | Show source title/selector |
| `features` | `PlayerFeatures` | `defaultFeatures` | Toggle individual controls |
| `locale` | `string` | `'en'` | Display language (built-in: `'en'`, `'ja'`) |
| `translations` | `Partial<Translations>` | — | Custom translation overrides, merged on top of the locale's built-in strings |
| `frameRate` | `number` | `30` | Frame rate for timecode display |
| `markers` | `Marker[]` | `[]` | Seekbar markers |

### `slots` — `PlayerSlots`

| Slot | Type | Position |
|------|------|----------|
| `controlsStart` | `ReactNode` | Left of control bar |
| `controlsEnd` | `ReactNode` | Right of control bar (before fullscreen) |
| `seekbarOverlay` | `(state: PlayerState) => ReactNode` | Above seekbar |
| `topLeftOverlay` | `ReactNode` | Top-left corner |
| `topRightOverlay` | `ReactNode` | Top-right corner |
| `loadingIndicator` | `ReactNode` | Centre (while loading) |
| `errorDisplay` | `(error: Error) => ReactNode` | Centre (on error) |

### `events` — `PlayerEvents`

| Event | Payload | When |
|-------|---------|------|
| `onStateChange` | `PlayerState` | Any state change (consolidated snapshot) |
| `onPlay` | — | Playback starts |
| `onPause` | — | Playback pauses |
| `onEnded` | — | Playback ends |
| `onTimeUpdate` | `time` | Current time changes |
| `onDurationChange` | `duration` | Duration known/changed |
| `onVolumeChange` | `volume, muted` | Volume or mute changes |
| `onPlaybackRateChange` | `rate` | Playback rate changes |
| `onError` | `Error` | Playback error |
| `onLoadedMetadata` | `VideoMetadata` | Video metadata loaded |
| `onLoadStart` | — | Loading begins |
| `onProgress` | `TimeRanges` | Buffering progress |
| `onWaiting` | — | Waiting for data |
| `onCanPlay` | — | Ready to play |
| `onPlaying` | — | Actually playing |
| `onSeekStart` | `time` | Seek begins |
| `onSeeking` | `time` | During seek |
| `onSeekEnd` | `time` | Seek ends |
| `onFullscreenChange` | `boolean` | Fullscreen toggled |
| `onFrameCapture` | `FrameCapture` | Frame captured |
| `onActiveSourceChange` | `index` | Active source changed |
| `onQualityLevelChange` | `QualityLevel` | Quality level changed |
| `onFallback` | `FallbackEvent` | Fell back to original URL |

## Features

`ui.features` toggles individual controls. Omitted keys inherit from `defaultFeatures`.

Two presets are exported for convenience:

| Export | Description |
|--------|-------------|
| `defaultFeatures` | Most controls on, heavy options (`ambientLight`, `capture`) off |
| `noFeatures` | All controls off — use as a base for minimal builds |

```tsx
import { noFeatures } from 'drop-player';

// Default — most controls on
<VideoPlayer sources={url} />

// Add capture to defaults
<VideoPlayer sources={url} ui={{ features: { capture: true } }} />

// Remove loop from defaults
<VideoPlayer sources={url} ui={{ features: { loop: false } }} />

// Build from scratch
<VideoPlayer sources={url} ui={{ features: { ...noFeatures, playButton: true, fullscreen: true } }} />
```

| Flag | Default | Applies to |
|------|---------|------------|
| `playButton` | `true` | video, audio |
| `loop` | `true` | video, audio |
| `timeDisplay` | `true` | video, audio |
| `seekBar` | `true` | video, audio |
| `volume` | `true` | video, audio |
| `ambientLight` | `false` | video |
| `capture` | `false` | video, image |
| `qualitySelector` | `true` | video (HLS) |
| `fullscreen` | `true` | all |
| `zoom` | `true` | image, PDF |
| `playbackSpeed` | `true` | video, audio |
| `pip` | `true` | video (browser PiP API required) |
| `keyboardShortcuts` | `true` | video, audio |

## Theming

Override CSS variables on `.drop-player`:

```css
@import 'drop-player/styles.css';

.drop-player {
  --drop-player-primary: #3b82f6;
  --drop-player-success: #22c55e;
  --drop-player-warning: #eab308;
  --drop-player-marker-scene: #eab308;
  --drop-player-marker-custom: #3b82f6;
  --drop-player-border-radius: 8px;
}
```

| Variable | Default | Description |
|----------|---------|-------------|
| `--drop-player-primary` | `#3b82f6` | Accent color (seek bar, active states) |
| `--drop-player-success` | `#22c55e` | Success states (capture saved) |
| `--drop-player-warning` | `#eab308` | Warning states |
| `--drop-player-marker-scene` | `#eab308` | Scene marker color |
| `--drop-player-marker-custom` | `#3b82f6` | Custom marker color |
| `--drop-player-border-radius` | `0` | Container border radius |
| `--drop-player-aspect-ratio` | varies | Aspect ratio (16/9 video, 32/9 audio, 4/3 image, 1/1.414 PDF) |

<!-- interactive:playground -->

## Ref API

Access imperative methods via `PlayerRef`:

```tsx
const ref = useRef<PlayerRef>(null);

<VideoPlayer ref={ref} sources={url} />

// Later:
ref.current?.play();
ref.current?.seek(30);
```

| Method | Returns | Notes |
|--------|---------|-------|
| `play()` | `Promise<void>` | |
| `pause()` | `void` | |
| `toggle()` | `void` | |
| `seek(time)` | `void` | |
| `seekRelative(delta)` | `void` | |
| `seekToFrame(frame)` | `void` | Video only |
| `getCurrentTime()` | `number` | |
| `getDuration()` | `number` | |
| `getVolume()` | `number` | |
| `isMuted()` | `boolean` | |
| `isPaused()` | `boolean` | |
| `isFullscreen()` | `boolean` | |
| `getPlaybackRate()` | `number` | |
| `setVolume(n)` | `void` | |
| `setMuted(bool)` | `void` | |
| `setPlaybackRate(rate)` | `void` | |
| `captureFrame(opts?)` | `Promise<FrameCapture>` | Video/image; throws for audio/PDF |
| `requestFullscreen()` | `Promise<void>` | |
| `exitFullscreen()` | `Promise<void>` | |
| `toggleFullscreen()` | `void` | |
| `getVideoElement()` | `HTMLVideoElement \| null` | |
| `getContainerElement()` | `HTMLDivElement \| null` | |

## Error handling

`events.onError` and `slots.errorDisplay` receive an `Error` with a typed `name`:

| `error.name` | Meaning |
|--------------|---------|
| `errorNoSources` | `sources` is null or empty |
| `errorAborted` | Playback aborted |
| `errorNetwork` | Network error |
| `errorDecode` | Decode failure |
| `errorNotSupported` | Format not supported |
| `errorUnknown` | Unknown error |

Built-in UI uses `ui.locale` to localise these. Override with `slots.errorDisplay` for custom rendering.

## Translations

Built-in locales: `'en'` and `'ja'`. Set via `ui.locale`.

To add a new locale or override specific strings, use `ui.translations`:

```tsx
<VideoPlayer
  sources="video.mp4"
  ui={{
    locale: 'en',
    translations: {
      play: 'Reproducir',
      pause: 'Pausar',
      mute: 'Silenciar',
      unmute: 'Activar sonido',
      fullscreen: 'Pantalla completa',
      exitFullscreen: 'Salir de pantalla completa',
    },
  }}
/>
```

Translations are merged on top of the base locale — you only need to provide the keys you want to change.

## Custom storage

Player preferences (muted state) are persisted to `localStorage` by default. Use `storageKey` to namespace keys or `storage` to replace the backend entirely.

```tsx
// Custom namespace
<VideoPlayer sources="video.mp4" storageKey="my_app" />
// Keys stored as: my_app_muted, my_app_volume, etc.

// Custom backend (e.g. Supabase)
const supabaseStorage = {
  getItem: (key: string) => {
    // Read from Supabase cache or return null
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value);
    supabase.from('preferences').upsert({ key, value });
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
    supabase.from('preferences').delete().eq('key', key);
  },
};

<VideoPlayer sources="video.mp4" storage={supabaseStorage} />
```

The `StorageAdapter` interface requires three methods: `getItem`, `setItem`, and `removeItem`. Operations should be synchronous (return values immediately); use a local cache with async sync for remote backends.

## Utilities

Helper functions exported for use outside the player (custom UI, playlists, timecode overlays, etc.):

```tsx
import { formatTime, formatTimecode, secondsToFrames, parseFrameRate } from 'drop-player';

formatTime(125);            // "02:05"
formatTime(3661);           // "01:01:01"

formatTimecode(125.5, 30);  // "00:02:05:15"
formatTimecode(125.5, '30000/1001'); // "00:02:05:14" (29.97fps)

secondsToFrames(10, 24);   // 240
parseFrameRate('30000/1001'); // 29.97...
```

| Function | Signature | Description |
|----------|-----------|-------------|
| `formatTime` | `(seconds?) => string` | Format as `MM:SS` or `HH:MM:SS` |
| `formatTimecode` | `(seconds?, frameRate?) => string` | Format as SMPTE timecode `HH:MM:SS:FF` |
| `secondsToFrames` | `(seconds?, frameRate?) => number` | Convert seconds to frame number |
| `parseFrameRate` | `(frameRate?) => number` | Parse frame rate string (e.g. `"30000/1001"`) to number |

## Supported media

| Mode | Formats |
|------|---------|
| Video | HLS (`.m3u8`), MP4, WebM |
| Audio | MP3, WAV, Ogg, AAC, FLAC, M4A, WebM, Opus |
| Image | JPEG, PNG, GIF, WebP, AVIF, SVG |
| PDF | Browser-native PDF rendering |

Browser environment only. SSR-safe (components are no-ops on the server).

## License

MIT
