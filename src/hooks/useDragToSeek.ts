import { type RefObject, useCallback, useEffect, useRef } from 'react';

export type DragSeekMode = 'relative' | 'absolute';

export interface UseDragToSeekOptions {
  /** The media element ref */
  mediaRef: RefObject<HTMLMediaElement | null>;
  /** The container element ref used for width calculations */
  areaRef: RefObject<HTMLElement | null>;
  /** Total duration in seconds */
  duration: number;
  /** 'relative' = delta from drag start, 'absolute' = position maps to time */
  mode: DragSeekMode;
  /** Called when drag begins (after threshold) */
  onDragSeekStart: () => void;
  /** Called on each drag move with the new time */
  onDragSeekMove: (time: number) => void;
  /** Called when drag ends with the final time */
  onDragSeekEnd: (time: number) => void;
  /** Called on click without drag. For 'absolute' mode, receives the time at the click position. */
  onClick: (time?: number) => void;
  /** Called on touch tap without drag (e.g. toggle controls on video) */
  onTouchTap?: () => void;
}

export interface UseDragToSeekReturn {
  handlePointerDown: (e: React.PointerEvent) => void;
  handlePointerMove: (e: React.PointerEvent) => void;
}

export function useDragToSeek({
  mediaRef,
  areaRef,
  duration,
  mode,
  onDragSeekStart,
  onDragSeekMove,
  onDragSeekEnd,
  onClick,
  onTouchTap,
}: UseDragToSeekOptions): UseDragToSeekReturn {
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const pointerTypeRef = useRef<string | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const media = mediaRef.current;
      if (!media || !duration) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      pointerTypeRef.current = e.pointerType;
      isDraggingRef.current = true;
      dragStartXRef.current = e.clientX;
      dragStartTimeRef.current = media.currentTime;
      hasDraggedRef.current = false;

      if (e.pointerType === 'mouse') {
        e.preventDefault();
      }
    },
    [mediaRef, duration]
  );

  const calcTime = useCallback(
    (clientX: number): number => {
      const area = areaRef.current;
      if (!area || !duration) return 0;

      const areaWidth = area.clientWidth;

      if (mode === 'absolute') {
        const rect = area.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        return (x / areaWidth) * duration;
      }

      // relative
      const deltaX = clientX - dragStartXRef.current;
      const seekDelta = (deltaX / areaWidth) * duration;
      return Math.max(
        0,
        Math.min(duration, dragStartTimeRef.current + seekDelta)
      );
    },
    [areaRef, duration, mode]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;

      const area = areaRef.current;
      if (!area || !duration) return;

      const deltaX = e.clientX - dragStartXRef.current;
      const dragThreshold = pointerTypeRef.current === 'touch' ? 10 : 5;

      if (Math.abs(deltaX) > dragThreshold && !hasDraggedRef.current) {
        hasDraggedRef.current = true;
        onDragSeekStart();
      }

      if (hasDraggedRef.current) {
        onDragSeekMove(calcTime(e.clientX));
      }
    },
    [areaRef, duration, onDragSeekStart, onDragSeekMove, calcTime]
  );

  useEffect(() => {
    const handleGlobalPointerUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      if (!hasDraggedRef.current) {
        if (pointerTypeRef.current === 'touch' && onTouchTap) {
          onTouchTap();
        } else if (mode === 'absolute') {
          onClick(calcTime(e.clientX));
        } else {
          onClick();
        }
      } else {
        onDragSeekEnd(calcTime(e.clientX));
      }

      isDraggingRef.current = false;
      hasDraggedRef.current = false;
      pointerTypeRef.current = null;
    };

    const handleGlobalPointerCancel = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      hasDraggedRef.current = false;
      pointerTypeRef.current = null;
    };

    document.addEventListener('pointerup', handleGlobalPointerUp);
    document.addEventListener('pointercancel', handleGlobalPointerCancel);
    return () => {
      document.removeEventListener('pointerup', handleGlobalPointerUp);
      document.removeEventListener('pointercancel', handleGlobalPointerCancel);
    };
  }, [mode, onClick, onTouchTap, onDragSeekEnd, calcTime]);

  return { handlePointerDown, handlePointerMove };
}
