import { useCallback, useRef, useState } from 'react';
import type { Marker, TranslationKey } from '../../types';
import { formatTime } from '../../utils/formatters';

interface SeekBarProps {
  currentTime: number;
  duration: number;
  isSeeking: boolean;
  seekValue: number;
  markers?: Marker[];
  onSeekStart: () => void;
  onSeekChange: (time: number) => void;
  onSeekEnd: (time: number) => void;
  t: (key: TranslationKey) => string;
}

const SNAP_THRESHOLD_PX = 12;

export function SeekBar({
  currentTime,
  duration,
  isSeeking,
  seekValue,
  markers = [],
  onSeekStart,
  onSeekChange,
  onSeekEnd,
  t,
}: SeekBarProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<number | null>(null);
  const [tooltipTime, setTooltipTime] = useState<number>(0);

  // Find snap target
  const findSnapTarget = useCallback(
    (timeSeconds: number): number | null => {
      if (markers.length === 0 || !duration || duration <= 0) return null;

      const slider = sliderRef.current;
      if (!slider) return null;

      const sliderWidth = slider.clientWidth;
      if (sliderWidth <= 0) return null;

      const thresholdSeconds = (SNAP_THRESHOLD_PX / sliderWidth) * duration;

      let nearestTime: number | null = null;
      let nearestDistance = thresholdSeconds;

      for (const marker of markers) {
        const distance = Math.abs(marker.time - timeSeconds);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestTime = marker.time;
        }
      }

      return nearestTime;
    },
    [markers, duration]
  );

  const getTimeFromPosition = useCallback(
    (clientX: number): number => {
      const slider = sliderRef.current;
      if (!slider || !duration) return 0;

      const rect = slider.getBoundingClientRect();
      const position = (clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(duration, position * duration));
    },
    [duration]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onSeekStart();

      const rawTime = getTimeFromPosition(e.clientX);
      const snapTarget = findSnapTarget(rawTime);
      const time = snapTarget ?? rawTime;
      onSeekChange(time);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const rawMoveTime = getTimeFromPosition(moveEvent.clientX);
        const snapMoveTarget = findSnapTarget(rawMoveTime);
        const moveTime = snapMoveTarget ?? rawMoveTime;
        onSeekChange(moveTime);
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        const rawUpTime = getTimeFromPosition(upEvent.clientX);
        const snapUpTarget = findSnapTarget(rawUpTime);
        const upTime = snapUpTarget ?? rawUpTime;
        onSeekEnd(upTime);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [getTimeFromPosition, findSnapTarget, onSeekStart, onSeekChange, onSeekEnd]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Prevent default to avoid scroll/zoom while seeking
      e.preventDefault();
      onSeekStart();

      const touch = e.touches[0];
      const rawTime = getTimeFromPosition(touch.clientX);
      const snapTarget = findSnapTarget(rawTime);
      const time = snapTarget ?? rawTime;
      onSeekChange(time);

      const handleTouchMove = (moveEvent: TouchEvent) => {
        moveEvent.preventDefault();
        const moveTouch = moveEvent.touches[0];
        if (!moveTouch) return;
        const rawMoveTime = getTimeFromPosition(moveTouch.clientX);
        const snapMoveTarget = findSnapTarget(rawMoveTime);
        const moveTime = snapMoveTarget ?? rawMoveTime;
        onSeekChange(moveTime);
      };

      const handleTouchEnd = (endEvent: TouchEvent) => {
        const endTouch = endEvent.changedTouches[0];
        if (!endTouch) {
          onSeekEnd(seekValue);
        } else {
          const rawEndTime = getTimeFromPosition(endTouch.clientX);
          const snapEndTarget = findSnapTarget(rawEndTime);
          const endTime = snapEndTarget ?? rawEndTime;
          onSeekEnd(endTime);
        }
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchcancel', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchcancel', handleTouchEnd);
    },
    [
      getTimeFromPosition,
      findSnapTarget,
      onSeekStart,
      onSeekChange,
      onSeekEnd,
      seekValue,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const position = (e.clientX - rect.left) / rect.width;
      const time = Math.max(0, Math.min(duration, position * duration));

      setTooltipPosition(e.clientX - rect.left);
      setTooltipTime(time);
    },
    [duration]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltipPosition(null);
  }, []);

  const displayValue = isSeeking ? seekValue : currentTime;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!duration || duration <= 0) return;

      const STEP_SECONDS = 1;
      const PAGE_STEP_SECONDS = 10;
      let newTime: number | null = null;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowDown': {
          e.preventDefault();
          newTime = Math.max(0, displayValue - STEP_SECONDS);
          break;
        }
        case 'ArrowRight':
        case 'ArrowUp': {
          e.preventDefault();
          newTime = Math.min(duration, displayValue + STEP_SECONDS);
          break;
        }
        case 'Home': {
          e.preventDefault();
          newTime = 0;
          break;
        }
        case 'End': {
          e.preventDefault();
          newTime = duration;
          break;
        }
        case 'PageDown': {
          e.preventDefault();
          newTime = Math.max(0, displayValue - PAGE_STEP_SECONDS);
          break;
        }
        case 'PageUp': {
          e.preventDefault();
          newTime = Math.min(duration, displayValue + PAGE_STEP_SECONDS);
          break;
        }
        default:
          return;
      }

      if (newTime !== null) {
        if (!isSeeking) {
          onSeekStart();
        }
        onSeekChange(newTime);
        onSeekEnd(newTime);
      }
    },
    [duration, displayValue, isSeeking, onSeekStart, onSeekChange, onSeekEnd]
  );
  const progress = duration > 0 ? (displayValue / duration) * 100 : 0;

  // Filter scene markers
  const sceneMarkers = markers.filter(
    (m) => m.type === 'scene' && m.time <= duration
  );

  return (
    <div className="relative mb-2">
      {/* Scene markers */}
      {sceneMarkers.length > 0 && duration > 0 && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 pointer-events-none z-10">
          {sceneMarkers.map((marker, index) => {
            const left = (marker.time / duration) * 100;
            return (
              <div
                key={`scene-${index}-${marker.time}`}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${left}%` }}
                aria-hidden="true"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full opacity-70"
                  style={{
                    backgroundColor:
                      marker.color ??
                      'var(--drop-player-marker-scene, #eab308)',
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Slider track */}
      <div
        ref={sliderRef}
        className="relative h-5 flex items-center cursor-pointer group touch-none"
        role="slider"
        aria-label={t('seek')}
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={displayValue}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
      >
        {/* Track background */}
        <div className="absolute inset-x-0 h-1 bg-white/30 rounded-full">
          {/* Progress */}
          <div
            className="absolute h-full bg-white rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Thumb */}
        <div
          className="absolute w-3 h-3 bg-white rounded-full shadow-md transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${progress}%` }}
        />

        {/* Tooltip */}
        {tooltipPosition !== null && (
          <div
            className="drop-player-tooltip"
            style={{
              left: `${tooltipPosition}px`,
              bottom: '24px',
              transform: 'translateX(-50%)',
            }}
          >
            {formatTime(tooltipTime)}
          </div>
        )}
      </div>
    </div>
  );
}
