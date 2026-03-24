# Marker API Redesign

**Date:** 2026-03-24
**Status:** Approved

## Overview

Redesign the `Marker` type to support multiple visual styles and custom ReactNode content on the seekbar track. Deprecate and remove the `seekbarOverlay` slot, which used a fragile `top: -24px` CSS hack and couldn't be positioned relative to `SeekBar` internals.

## Type Design

Use a discriminated union so TypeScript auto-completes correctly per type:

```typescript
import type { ReactNode } from 'react';

interface BaseMarker {
  time: number;
  color?: string;
  snapThreshold?: number;
}

export interface CircleMarker extends BaseMarker {
  type?: 'circle'; // default when type is omitted
}

export interface LineMarker extends BaseMarker {
  type: 'line';
}

export interface SquareMarker extends BaseMarker {
  type: 'square';
}

export interface CustomMarker extends BaseMarker {
  type: 'custom';
  content: ReactNode;
}

export type Marker = CircleMarker | LineMarker | SquareMarker | CustomMarker;
```

- `type` omitted → treated as `'circle'` (backward default, but `'scene'` is removed)
- `content` is required only on `CustomMarker` — TypeScript enforces this
- All types support `color` and `snapThreshold`

## Breaking Changes

| Old | New |
|-----|-----|
| `type: 'scene'` | `type: 'circle'` |
| `slots.seekbarOverlay` | Removed |
| CSS var `--drop-player-marker-scene` | `--drop-player-marker-circle` |

## SeekBar Rendering

All marker types render on the track at `left: ${(marker.time / duration) * 100}%`.

| type | Rendering |
|------|-----------|
| `circle` (default) | Colored dot (current scene marker appearance) |
| `line` | Full-height vertical line on the track |
| `square` | Small square shape |
| `custom` | `marker.content` rendered as-is |

Filter logic changes from `type === 'scene'` to `type !== undefined || type === 'circle'` — i.e., render all markers (not just one type).

The marker container (`.drop-player-seekbar-markers`) stays `pointer-events: none` with individual markers having `pointer-events: auto` only for `custom` type (since user-provided content may be interactive).

## CSS Changes

- Remove `.drop-player-seekbar-overlay-slot` and `.drop-player-seekbar-overlay-slot > *` rules
- Rename `--drop-player-marker-scene` → `--drop-player-marker-circle`
- Add `.drop-player-seekbar-marker--line` styles (1–2px wide, full track height)
- Add `.drop-player-seekbar-marker--square` styles (6×6px square)
- Add `.drop-player-seekbar-marker--custom` wrapper (pointer-events: auto, centered on time position)

## Player.tsx Changes

- Remove `seekbarOverlay` rendering block (lines 1519–1524)
- Remove `seekbarOverlay` from `PlayerSlots` interface in `types.ts`

## Demo

Add a new demo card in `demo/sections/InteractiveDemo.tsx` (or a new `MarkersDemo.tsx` section) showing a video player with:

1. `circle` marker — chapter start
2. `line` marker — ad break
3. `square` marker — custom cue point
4. `custom` marker — a small badge/icon component provided by the user

The demo should include a code snippet showing the `markers` prop with all four types.
