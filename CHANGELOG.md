# Changelog

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
