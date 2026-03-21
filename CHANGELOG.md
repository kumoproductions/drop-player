# Changelog

## 1.2.3

### Bug Fixes

- Fix controls overlay not recoverable on mobile for Image, PDF, and Audio modes — tapping the content area now toggles controls visibility, matching Video behavior
- Fix player blocking page scroll on mobile — allow vertical scrolling (`pan-y`) for all media types; only block scroll when Image/PDF is zoomed in

## 1.2.0

### Features

- Add pdf.js integration as optional peer dependency for canvas-based PDF rendering with real zoom, pan, and page navigation
- Add `PageNavigation` control (prev/next page with `ChevronUp`/`ChevronDown` icons)
- Add `PdfCoreRef` imperative handle (`zoomIn`, `zoomOut`, `resetZoom`, `nextPage`, `prevPage`, `goToPage`)
- Add keyboard shortcuts for PDF mode (`ArrowUp`/`ArrowDown` for pages, `+`/`-`/`0` for zoom)
- Add swipe gesture for PDF page navigation (disabled when zoomed)
- Fallback to browser-native `<object>` rendering when `pdfjs-dist` is not installed

### Improvements

- PDF pages fit container at 100% zoom (no excess margins)
- Zoom re-renders via pdf.js for crisp vector text (debounced 150ms with immediate CSS feedback)
- Page change resets zoom to 1x
- Controls and title auto-hide after 3 seconds for image and PDF modes (consistent with video/audio)
- Source change resets readiness state so loading overlay covers stale content
- Add `tabular-nums` to zoom level display
- Controls overlay now has proper z-index to remain visible during loading

## 1.1.7

### Features

- Add `seekStep` playback option to configure arrow key skip duration in seconds (default: 10)
- Add `seekStepButtons` feature flag for skip forward/backward buttons
- Add `showStatusOverlay` UI option — pill-style overlay showing player actions (play/pause, seek, volume, speed, quality, zoom, loop)

## 1.1.6

### Features

- Add multi-source navigation (prev/next buttons, swipe gesture, keyboard navigation)
- Add `sourceNavigation` feature flag to show/hide prev/next buttons
- Add time display formats: `seconds-frames`, `feet-frames`, `bars-beats`
- Auto-detect frame rate from HLS level metadata
- Add CSS color variables for easier theme customization

### Improvements

- Expand touch/click target for seekbar and volume slider thumbs without changing visual appearance
- Style dropdown scrollbar to match player theme

## 1.1.5

### Improvements

- Add drag-to-seek on audio waveform (click to seek, drag to scrub)
- Add accessibility attributes on audio waveform area (`role="slider"`, `aria-valuemin/max/now`)
- Improve PDF error handling: pre-validate URL reachability, fire `onError` with `errorNetwork` on failure
- Suppress `AbortError` from play/pause races

### Bug Fixes

- Fix audio player not showing error state when loading fails

### Documentation

- Add CSS variables reference table, feature presets, Translations, Custom storage, Utilities sections to README

## 1.1.4

### Improvements

- `VideoPlayer`, `AudioPlayer`, `ImageViewer`, `PdfViewer` now set media mode directly, skipping source type inference
- Add default `aspect-ratio` per media mode (video: 16/9, audio: 32/9, image: 4/3, pdf: 1/1.414), overridable via `--drop-player-aspect-ratio`
- Warn when URL has no recognizable extension and `mimeType` is not provided

### Bug Fixes

- Fix `min-width: 100%` redundancy on player container

## 1.1.3

### Bug Fixes

- Fix hydration mismatch caused by PiP support detection running during SSR

## 1.1.2

### Bug Fixes

- Unify mouse/touch handling with Pointer Events for consistent drag-to-seek and controls toggle
- Improve HLS fatal error handling: network errors now trigger fallback, media error recovery limited to one attempt
- Type `hlsConfig` as `Partial<HlsConfig>` instead of `Record<string, unknown>`
- Add `network-error` to `FallbackReason` type
- Rename legacy `@dropmov/player` references to `drop-player` in console warnings

### Styles

- Responsive timestamp position in controls bar

## 1.1.1

### Features

- Add `storage` prop for custom `StorageAdapter` (replaces default localStorage)
- Add `translations` prop for custom i18n string overrides
- Widen `locale` type from `'en' | 'ja'` to `string` for custom locales
- Stabilize React hooks to avoid unnecessary re-renders with object props

### Styles

- Fix ambient light mode rendering
- Reposition timestamp display

## 1.1.0

### Features

- Add `storageKey` prop to customize localStorage key prefix (default: `drop_player_`, custom: `<storageKey>_`)
- Persist and restore muted state across sessions via localStorage

### Breaking Changes

- Remove `persistenceKey` prop and playback position persistence feature
- Remove `onPositionSave` / `onPositionRestore` event callbacks

## 1.0.7

### Bug Fixes

- Fix tooltip not dismissing on Safari and touch devices
- Fix multiple tooltips displaying simultaneously
- Auto-dismiss tooltips after timeout on touch interactions
- Fix muted state behavior

## 1.0.6

### Features

- Add playback speed selector control
- Add Picture-in-Picture (PiP) button control

### Bug Fixes

- Fix tooltip position not recalculating when content changes

## 1.0.5

### Features

- Support `hlsConfig` prop for custom hls.js configuration
- Tune ABR settings for smoother adaptive bitrate switching

### Bug Fixes

- Dynamically import `waveform-data` to reduce initial bundle size
- Fix tooltip position

## 1.0.4

### Maintenance

- Disable sourcemap output and enable minification in build
- Remove unnecessary documentation files

## 1.0.3

### Breaking Changes

- Remove Tailwind CSS dependency from library output; all styles are now plain CSS with `drop-player-*` BEM classes
- Consumers no longer need Tailwind — just import `drop-player/styles.css`

### Bug Fixes

- Fix controls and seekbar not rendering (Tailwind utility classes missing from build output)

## 1.0.2

### Bug Fixes

- Fix player and controls not spanning full width in flex/aspect-ratio layouts

## 1.0.1

### Maintenance

- Update dependency packages

## 1.0.0

### Initial Release

- Video and audio player component with custom controls
- Keyboard shortcuts support
- Marker/chapter support (scene markers, custom markers)
- Playback speed control
- Volume control with mute toggle
- Fullscreen support
- Ambient light effect
- Multiple source selector
- Customizable theming via CSS variables
- Error handling with retry
