import { type RefObject, useEffect } from 'react';

const VOLUME_WHEEL_STEP = 0.05;

export function useVolumeWheel(
  ref: RefObject<HTMLElement | null>,
  volume: number,
  onVolumeChange: ((volume: number) => void) | undefined
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !onVolumeChange) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY < 0 ? VOLUME_WHEEL_STEP : -VOLUME_WHEEL_STEP;
      onVolumeChange(Math.max(0, Math.min(1, volume + delta)));
    };
    const opts = { passive: false, capture: true } as const;
    el.addEventListener('wheel', handleWheel, opts);
    return () => el.removeEventListener('wheel', handleWheel, opts);
  }, [ref, volume, onVolumeChange]);
}
