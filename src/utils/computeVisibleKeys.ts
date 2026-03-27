const GAP = 4;
const W_OVERFLOW_BTN = 36 + GAP;

export interface OverflowEntry {
  key: string;
  width: number;
}

export interface ComputeVisibleKeysInput {
  barWidth: number;
  fixedWidth: number;
  overflowable: OverflowEntry[];
}

/**
 * Determines which overflowable controls are visible inline vs hidden
 * into the overflow menu, given the available bar width.
 */
export function computeVisibleKeys({
  barWidth,
  fixedWidth,
  overflowable,
}: ComputeVisibleKeysInput): Set<string> {
  if (barWidth === 0 || overflowable.length === 0) {
    return new Set(overflowable.map((c) => c.key));
  }

  const totalNeeded =
    overflowable.reduce((sum, c) => sum + c.width, 0) + fixedWidth;

  // Everything fits — no overflow needed
  if (totalNeeded <= barWidth) {
    return new Set(overflowable.map((c) => c.key));
  }

  // Pack by priority, reserving space for the overflow button.
  const visible = new Set<string>();
  let remaining = barWidth - fixedWidth - W_OVERFLOW_BTN;

  if (remaining > 0) {
    for (const control of overflowable) {
      if (control.width <= remaining) {
        visible.add(control.key);
        remaining -= control.width;
      }
    }
  }

  return visible;
}
