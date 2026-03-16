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
| `hlsConfig` | `Record<string, unknown>` | — | Custom [hls.js config](https://github.com/video-dev/hls.js/blob/master/docs/API.md#fine-tuning) overrides |

### `playback` — `PlayerPlaybackConfig`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `autoPlay` | `boolean` | `false` | Start immediately |
| `loop` | `boolean` | `false` | Loop playback |
| `muted` | `boolean` | `false` | Start muted |
| `volume` | `number` | `1` | Initial volume (0–1) |
| `initialTime` | `number` | `0` | Start position in seconds |
| `persistenceKey` | `string` | — | localStorage key for position resume |

### `ui` — `PlayerUiConfig`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `showControls` | `boolean` | `true` | Show bottom control bar |
| `showTitle` | `boolean` | auto | Show source title/selector |
| `features` | `PlayerFeatures` | `defaultFeatures` | Toggle individual controls |
| `locale` | `'en' \| 'ja'` | `'en'` | Display language |
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
| `onPositionSave` | `position` | Position saved to storage |
| `onPositionRestore` | `position` | Position restored from storage |
| `onActiveSourceChange` | `index` | Active source changed |
| `onQualityLevelChange` | `QualityLevel` | Quality level changed |
| `onFallback` | `FallbackEvent` | Fell back to original URL |

## Features

`ui.features` toggles individual controls. Omitted keys inherit from `defaultFeatures`.

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
}
```

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

## Supported media

| Mode | Formats |
|------|---------|
| Video | HLS (`.m3u8`), MP4, WebM |
| Audio | MP3, WAV, Ogg, AAC, FLAC, M4A, WebM, Opus |
| Image | JPEG, PNG, GIF, WebP, AVIF, SVG |
| PDF | Browser-native PDF rendering |

Browser environment only. SSR-safe (components are no-ops on the server).

## Future

Planned extensibility (not yet implemented):

- **Translation** — pluggable / swappable i18n so you can supply custom locales or override strings.
- **Store** — swappable persistence backend (e.g. replace the default `localStorage`-based position/store) for custom storage adapters.

## License

MIT
