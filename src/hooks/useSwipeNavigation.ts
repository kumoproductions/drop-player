import { useCallback, useRef } from 'react';

interface UseSwipeNavigationOptions {
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
  threshold?: number;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
}

export function useSwipeNavigation({
  onPrev,
  onNext,
  disabled = false,
  threshold = 50,
}: UseSwipeNavigationOptions) {
  const touchStateRef = useRef<TouchState | null>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || e.touches.length !== 1) return;
      touchStateRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startTime: Date.now(),
      };
    },
    [disabled]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || !touchStateRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStateRef.current.startX;
      const deltaY = touch.clientY - touchStateRef.current.startY;
      const elapsed = Date.now() - touchStateRef.current.startTime;

      touchStateRef.current = null;

      // Ignore if vertical movement is dominant (scrolling)
      if (Math.abs(deltaY) > Math.abs(deltaX)) return;

      // Ignore if too slow (> 500ms) or too short
      if (elapsed > 500 || Math.abs(deltaX) < threshold) return;

      if (deltaX > 0) {
        onPrev();
      } else {
        onNext();
      }
    },
    [disabled, threshold, onPrev, onNext]
  );

  const onTouchCancel = useCallback(() => {
    touchStateRef.current = null;
  }, []);

  return { onTouchStart, onTouchEnd, onTouchCancel };
}
