import { describe, expect, it } from 'vitest';
import {
  type ComputeVisibleKeysInput,
  computeVisibleKeys,
  type OverflowEntry,
} from './computeVisibleKeys';

const GAP = 4;
const F_BTN = 36;
const W_OVERFLOW_BTN = F_BTN + GAP; // 40

// Helper: typical video controls
function videoOverflowable(opts?: {
  showVolumeSlider?: boolean;
  volumeSliderW?: number;
  sourceNav?: boolean;
}): OverflowEntry[] {
  const showSlider = opts?.showVolumeSlider ?? false;
  const sliderW = opts?.volumeSliderW ?? 96;
  const entries: OverflowEntry[] = [];

  // volume (button + optional slider)
  entries.push({
    key: 'volume',
    width: F_BTN + GAP + (showSlider ? sliderW + GAP : 0),
  });
  if (opts?.sourceNav !== false) {
    entries.push({ key: 'sourceNav', width: 112 + GAP }); // 116
  }
  entries.push({ key: 'loop', width: F_BTN + GAP }); // 40
  // medium
  entries.push({ key: 'speed', width: F_BTN + GAP }); // 40
  entries.push({ key: 'quality', width: F_BTN + GAP }); // 40
  // low
  entries.push({ key: 'pip', width: F_BTN + GAP }); // 40

  return entries;
}

// Helper: fixedWidth for video mode
function videoFixedWidth(opts?: {
  showInlineTimeDisplay?: boolean;
  timeDisplayW?: number;
}): number {
  let fw = GAP * 2; // 8
  fw += F_BTN + GAP; // play: 40
  fw += F_BTN + GAP; // fullscreen: 40
  if (opts?.showInlineTimeDisplay) {
    fw += (opts.timeDisplayW ?? 120) + GAP; // 124
  }
  return fw;
}

/**
 * Compute the ACTUAL rendered width:
 * fixedWidth + sum of visible overflowable widths + overflow button (if any hidden).
 * This is what CSS would render.
 */
function actualRenderedWidth(
  input: ComputeVisibleKeysInput,
  visibleKeys: Set<string>
): number {
  const visibleSum = input.overflowable
    .filter((c) => visibleKeys.has(c.key))
    .reduce((sum, c) => sum + c.width, 0);
  const hasOverflow = input.overflowable.some((c) => !visibleKeys.has(c.key));
  return input.fixedWidth + visibleSum + (hasOverflow ? W_OVERFLOW_BTN : 0);
}

describe('computeVisibleKeys', () => {
  it('shows everything when barWidth is 0 (first render)', () => {
    const overflowable = videoOverflowable();
    const result = computeVisibleKeys({
      barWidth: 0,
      fixedWidth: videoFixedWidth(),
      overflowable,
    });
    expect(result.size).toBe(overflowable.length);
  });

  it('shows everything when bar is wide enough', () => {
    const overflowable = videoOverflowable();
    const fw = videoFixedWidth();
    const total = overflowable.reduce((s, c) => s + c.width, 0) + fw;
    const result = computeVisibleKeys({
      barWidth: total + 100,
      fixedWidth: fw,
      overflowable,
    });
    expect(result.size).toBe(overflowable.length);
  });

  // ── User scenario: page=648, container=550 ──
  // At 648px viewport: showVolumeSlider=true, showInlineTimeDisplay=true
  describe('page 648px, container 550px', () => {
    // gradient padding 16*2 = 32 → barWidth = 550 - 32 = 518
    const barWidth = 518;
    const fw = videoFixedWidth({ showInlineTimeDisplay: true }); // 212
    const overflowable = videoOverflowable({ showVolumeSlider: true }); // volume=140

    it('fixedWidth is correct', () => {
      expect(fw).toBe(212);
    });

    it('volume entry includes slider width', () => {
      const vol = overflowable.find((c) => c.key === 'volume')!;
      expect(vol.width).toBe(F_BTN + GAP + 96 + GAP); // 140
    });

    it('rendered width does not exceed barWidth', () => {
      const visible = computeVisibleKeys({
        barWidth,
        fixedWidth: fw,
        overflowable,
      });
      const rendered = actualRenderedWidth(
        { barWidth, fixedWidth: fw, overflowable },
        visible
      );
      expect(rendered).toBeLessThanOrEqual(barWidth);
    });

    it('overflow menu is shown (some items hidden)', () => {
      const visible = computeVisibleKeys({
        barWidth,
        fixedWidth: fw,
        overflowable,
      });
      expect(visible.size).toBeLessThan(overflowable.length);
    });
  });

  // ── barWidth = 550 (if no gradient padding) ──
  describe('barWidth 550 directly', () => {
    const barWidth = 550;
    const fw = videoFixedWidth({ showInlineTimeDisplay: true });
    const overflowable = videoOverflowable({ showVolumeSlider: true });

    it('rendered width does not exceed barWidth', () => {
      const visible = computeVisibleKeys({
        barWidth,
        fixedWidth: fw,
        overflowable,
      });
      const rendered = actualRenderedWidth(
        { barWidth, fixedWidth: fw, overflowable },
        visible
      );
      expect(rendered).toBeLessThanOrEqual(barWidth);
    });
  });

  // ── Narrow viewport: no slider, no inline timeDisplay ──
  describe('narrow viewport (e.g., 400px bar)', () => {
    const barWidth = 400;
    const fw = videoFixedWidth({ showInlineTimeDisplay: false }); // 88
    const overflowable = videoOverflowable({ showVolumeSlider: false }); // volume=40

    it('rendered width does not exceed barWidth', () => {
      const visible = computeVisibleKeys({
        barWidth,
        fixedWidth: fw,
        overflowable,
      });
      const rendered = actualRenderedWidth(
        { barWidth, fixedWidth: fw, overflowable },
        visible
      );
      expect(rendered).toBeLessThanOrEqual(barWidth);
    });
  });

  // ── INVARIANT: rendered width never exceeds barWidth ──
  describe('invariant: never overflows', () => {
    const widths = [200, 300, 350, 400, 450, 500, 518, 550, 600, 700, 800];
    // Reflect real media-query breakpoints:
    // timeDisplay inline at ≥480px, volumeSlider at ≥640px
    // barWidth ≈ viewport - padding, so approximate realistically
    const configs = [
      { slider: false, timeDisplay: false, label: 'no slider, no time' },
      {
        slider: false,
        timeDisplay: true,
        label: 'no slider, with time',
        minBar: 420,
      },
      {
        slider: true,
        timeDisplay: false,
        label: 'with slider, no time',
        minBar: 560,
      },
      {
        slider: true,
        timeDisplay: true,
        label: 'with slider and time',
        minBar: 560,
      },
    ];

    for (const cfg of configs) {
      const applicableWidths = widths.filter(
        (bw) => !cfg.minBar || bw >= cfg.minBar
      );
      for (const bw of applicableWidths) {
        it(`${cfg.label}, barWidth=${bw}`, () => {
          const fw = videoFixedWidth({
            showInlineTimeDisplay: cfg.timeDisplay,
          });
          const ov = videoOverflowable({ showVolumeSlider: cfg.slider });
          const visible = computeVisibleKeys({
            barWidth: bw,
            fixedWidth: fw,
            overflowable: ov,
          });
          const rendered = actualRenderedWidth(
            { barWidth: bw, fixedWidth: fw, overflowable: ov },
            visible
          );
          expect(rendered).toBeLessThanOrEqual(bw);
        });
      }
    }
  });
});
