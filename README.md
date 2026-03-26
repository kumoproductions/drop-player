# drop-player

**A comprehensive, universal, open-source React media player powering [drop.mov](https://drop.mov).**

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
| `pdfjs-dist` >=4.0 | PDF canvas rendering (zoom, pan, page navigation) |
| `waveform-data` >=4.5 | Audio waveform display |

## Quick start

```tsx
import { Player } from 'drop-player';
import 'drop-player/styles.css';

function App() {
  return (
    <div style={{ width: 640, height: 360 }}>
      <Player sources="https://example.com/video.mp4" />
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

`VideoPlayer`, `AudioPlayer` etc. are aliases for readability — they all share the same `PlayerProps` and `PlayerRef`, and media mode is always auto-detected from the source URL. Use `Player` when the media type is mixed or unknown.

<!-- interactive:demo -->

## Supported media

| Mode | Formats |
|------|---------|
| Video | HLS (`.m3u8`), MP4, WebM |
| Audio | MP3, WAV, Ogg, AAC, FLAC, M4A, WebM, Opus |
| Image | JPEG, PNG, GIF, WebP, AVIF, SVG |
| PDF | Canvas rendering via pdf.js (zoom, pan, page navigation); falls back to browser-native `<object>` when `pdfjs-dist` is not installed |

Browser-only runtime. Safe to import in SSR frameworks (Next.js, Remix, Astro, etc.) — components render nothing on the server and activate on the client.

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

// Explicit MIME type — useful when URL has no extension (e.g. CDN, signed URL)
<Player sources={{ url: 'https://cdn.example.com/abc123', mimeType: 'video/mp4' }} />

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
  ui={{ features: { saveCapture: true, copyCapture: true }, locale: 'ja' }}
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
| `seekStep` | `number` | `10` | Seconds to skip with arrow left/right keys |

### `ui` — `PlayerUiConfig`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `showControls` | `boolean` | `true` | Show bottom control bar |
| `showTitle` | `boolean` | auto | Show source title/selector |
| `showStatusOverlay` | `boolean` | `false` | Show status pill overlay on player actions (play, seek, volume, etc.) |
| `features` | `PlayerFeatures` | `defaultFeatures` | Toggle individual controls |
| `locale` | `string` | `'en'` | Display language (built-in: `'en'`, `'ja'`) |
| `translations` | `Partial<Translations>` | — | Custom translation overrides, merged on top of the locale's built-in strings |
| `frameRate` | `number` | auto / `30` | Frame rate for timecode/frames display. Auto-detected from HLS manifest when available; falls back to `30`. |
| `timeDisplayFormats` | `TimeDisplayFormat[]` | `defaultTimeDisplayFormats` | Time display formats to cycle through on click |
| `filmGauge` | `number` | `16` | Frames per foot for `'feet-frames'` display (e.g. `16` for 35mm, `40` for 16mm) |
| `bpm` | `number` | `120` | BPM for `'bars-beats'` display |
| `timeSignature` | `string` | `'4/4'` | Time signature for `'bars-beats'` display (e.g. `'3/4'`, `'6/8'`) |
| `markers` | `Marker[]` | `[]` | Seekbar markers — see [Marker types](#marker-types) |

### Marker types

`Marker` is a discriminated union. Each type renders a different shape on the seekbar track:

| `type` | Shape | Extra fields |
|--------|-------|-------------|
| `'circle'` (default) | Filled dot | — |
| `'line'` | Vertical line | — |
| `'square'` | Filled square | — |
| `'custom'` | Your ReactNode | `content: ReactNode` (required) |

All types share these base fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `time` | `number` | — | Position in seconds |
| `color` | `string` | CSS var | CSS color value |
| `snap` | `boolean` | `false` | Enable snap-to on seek |
| `snapThreshold` | `number` | `12` | Snap threshold in px (only when `snap: true`) |

```tsx
import type { Marker } from 'drop-player';

const markers: Marker[] = [
  { time: 10, type: 'circle', snap: true },
  { time: 30, type: 'line' },
  { time: 60, type: 'square', color: 'red' },
  {
    time: 90,
    type: 'custom',
    content: <div style={{ ... }}>Label</div>,
  },
];

<VideoPlayer sources={url} ui={{ markers }} />
```

### `slots` — `PlayerSlots`

| Slot | Type | Position |
|------|------|----------|
| `controlsStart` | `ReactNode` | Left of control bar |
| `controlsEnd` | `ReactNode` | Right of control bar (before fullscreen) |
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
| `onTimeDisplayFormatChange` | `TimeDisplayFormat` | Time display format changed |

## Features

`ui.features` toggles individual controls. Omitted keys inherit from `defaultFeatures`.

Two presets are exported for convenience:

| Export | Description |
|--------|-------------|
| `defaultFeatures` | Most controls on, heavy options (`ambientLight`, `saveCapture`, `copyCapture`) off |
| `noFeatures` | All controls off — use as a base for minimal builds |

```tsx
import { noFeatures } from 'drop-player';

// Default — most controls on
<VideoPlayer sources={url} />

// Add capture buttons to defaults
<VideoPlayer sources={url} ui={{ features: { saveCapture: true, copyCapture: true } }} />

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
| `saveCapture` | `false` | video, image |
| `copyCapture` | `false` | video, image |
| `qualitySelector` | `true` | video (HLS) |
| `fullscreen` | `true` | all |
| `zoom` | `true` | image, PDF (requires `pdfjs-dist`) |
| `sourceNavigation` | `true` | all (when multiple sources) |
| `playbackSpeed` | `true` | video, audio |
| `pip` | `true` | video (browser PiP API required) |
| `keyboardShortcuts` | `true` | video, audio |

## Time display formats

`ui.timeDisplayFormats` controls which time formats the user can cycle through by clicking the time display. Two presets are exported:

| Export | Formats |
|--------|---------|
| `defaultTimeDisplayFormats` | `['elapsed-total', 'remaining']` |
| `allTimeDisplayFormats` | `['elapsed-total', 'remaining', 'timecode', 'frames', 'seconds-frames', 'feet-frames', 'bars-beats']` |

```tsx
import { defaultTimeDisplayFormats, allTimeDisplayFormats } from 'drop-player';

// Default — elapsed / total and remaining
<VideoPlayer sources={url} />

// Add timecode and frames
<VideoPlayer sources={url} ui={{ timeDisplayFormats: allTimeDisplayFormats }} />

// Film workflow — add feet+frames (35mm)
<VideoPlayer sources={url} ui={{
  timeDisplayFormats: [...defaultTimeDisplayFormats, 'timecode', 'feet-frames'],
  filmGauge: 16,
}} />

// Music — add bars:beats
<AudioPlayer sources={url} ui={{
  timeDisplayFormats: [...defaultTimeDisplayFormats, 'bars-beats'],
  bpm: 92,
  timeSignature: '4/4',
}} />

// Lock to single format (no cycling)
<VideoPlayer sources={url} ui={{ timeDisplayFormats: ['timecode'] }} />
```

| Format | Display | Extra props |
|--------|---------|-------------|
| `'elapsed-total'` | `1:23 / 5:00` | — |
| `'remaining'` | `-3:37` | — |
| `'timecode'` | `00:01:23:15` | `frameRate` |
| `'frames'` | `2475 / 9000` | `frameRate` |
| `'seconds-frames'` | `83+15 / 300+00` | `frameRate` |
| `'feet-frames'` | `154+11 / 562+08` | `frameRate`, `filmGauge` |
| `'bars-beats'` | `47:4 / 192:1` | `bpm`, `timeSignature` |

Frame rate is auto-detected from HLS manifests when available. For progressive sources, set `ui.frameRate` explicitly.

## Theming

Override CSS variables on `.drop-player`:

```css
@import 'drop-player/styles.css';

.drop-player {
  --drop-player-blue: oklch(70.7% 0.165 254.624);
  --drop-player-yellow: oklch(85.2% 0.199 91.936);
  --drop-player-green: oklch(79.2% 0.209 151.711);
  --drop-player-red: oklch(70.4% 0.191 22.216);
  --drop-player-muted: oklch(55.2% 0.016 285.938);
  --drop-player-marker-circle: var(--drop-player-yellow);
  --drop-player-border-radius: 8px;
}
```

| Variable | Default | Description |
|----------|---------|-------------|
| `--drop-player-blue` | `oklch(70.7% 0.165 254.624)` | Accent color (active states, focus ring) |
| `--drop-player-yellow` | `oklch(85.2% 0.199 91.936)` | Highlight color (ambient light on) |
| `--drop-player-green` | `oklch(79.2% 0.209 151.711)` | Positive color (check marks, best quality) |
| `--drop-player-red` | `oklch(70.4% 0.191 22.216)` | Negative color (errors) |
| `--drop-player-muted` | `oklch(55.2% 0.016 285.938)` | Muted / inactive color |
| `--drop-player-marker-circle` | `var(--drop-player-yellow)` | Marker color (circle, line, square) |
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
| `getTimeDisplayFormat()` | `TimeDisplayFormat` | |
| `setTimeDisplayFormat(format)` | `void` | |
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
import {
  formatTime, formatTimecode, secondsToFrames, parseFrameRate,
  formatFeetFrames, formatSecondsFrames, formatBarsBeats,
} from 'drop-player';

formatTime(125);                    // "02:05"
formatTime(3661);                   // "01:01:01"
formatTimecode(125.5, 30);          // "00:02:05:15"
formatTimecode(125.5, '30000/1001');// "00:02:05:14" (29.97fps)
secondsToFrames(10, 24);           // 240
parseFrameRate('30000/1001');       // 29.97...
formatSecondsFrames(83.5, 30);     // "83+15"
formatFeetFrames(10, 24, 16);      // "15+00"
formatBarsBeats(10, 120, '4/4');   // "5:1"
```

| Function | Signature | Description |
|----------|-----------|-------------|
| `formatTime` | `(seconds?) => string` | Format as `MM:SS` or `HH:MM:SS` |
| `formatTimecode` | `(seconds?, frameRate?) => string` | Format as SMPTE timecode `HH:MM:SS:FF` |
| `secondsToFrames` | `(seconds?, frameRate?) => number` | Convert seconds to frame number |
| `parseFrameRate` | `(frameRate?) => number` | Parse frame rate string (e.g. `"30000/1001"`) to number |
| `formatSecondsFrames` | `(seconds?, frameRate?) => string` | Format as seconds+frames `S+FF` |
| `formatFeetFrames` | `(seconds?, frameRate?, filmGauge?) => string` | Format as feet+frames `FFF+FF` |
| `formatBarsBeats` | `(seconds?, bpm?, timeSignature?) => string` | Format as bars:beats `B:b` |

## License

MIT
