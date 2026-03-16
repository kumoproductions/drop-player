import { useCallback, useEffect, useRef } from 'react';
import type WaveformData from 'waveform-data';

interface WaveformCanvasProps {
  /** Waveform data from waveform-data.js */
  waveformData: WaveformData | null;
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Whether currently seeking */
  isSeeking: boolean;
  /** Seek value during seeking */
  seekValue: number;
  /** Color for the waveform (default: #666) */
  waveColor?: string;
  /** Color for played portion (default: #0066ff) */
  progressColor?: string;
  /** Callbacks */
  onSeekStart?: () => void;
  onSeekChange?: (time: number) => void;
  onSeekEnd?: (time: number) => void;
  onClick?: () => void;
}

export function WaveformCanvas({
  waveformData,
  currentTime,
  duration,
  isSeeking,
  seekValue,
  waveColor = '#666',
  progressColor = '#0066ff',
  onSeekStart,
  onSeekChange,
  onSeekEnd,
  onClick,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);

  // Calculate display time (use seekValue when seeking)
  const displayTime = isSeeking ? seekValue : currentTime;
  const progress = duration > 0 ? displayTime / duration : 0;

  // Draw waveform to canvas
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !waveformData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Set canvas size
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get waveform channel data
    const channel = waveformData.channel(0);
    const length = waveformData.length;

    if (length === 0) return;

    // First pass: find global max amplitude (waveform-data can be 8-bit or 16-bit depending on source)
    let globalMaxAmp = 0;
    for (let i = 0; i < length; i++) {
      const min = Math.abs(channel.min_sample(i));
      const max = Math.abs(channel.max_sample(i));
      globalMaxAmp = Math.max(globalMaxAmp, min, max);
    }
    // Normalize by global max so waveform fills vertical space; avoid division by zero
    const normDivisor = Math.max(globalMaxAmp, 1);

    // Calculate samples per pixel
    const samplesPerPixel = length / width;
    const centerY = height / 2;
    const progressX = width * progress;

    // Draw waveform bars
    const barWidth = 2;
    const barGap = 1;
    const barStep = barWidth + barGap;

    for (let x = 0; x < width; x += barStep) {
      // Get sample index range for this bar
      const startSample = Math.floor(x * samplesPerPixel);
      const endSample = Math.min(
        Math.floor((x + barWidth) * samplesPerPixel),
        length - 1
      );

      // Find max amplitude in this range
      let maxAmp = 0;
      for (let i = startSample; i <= endSample; i++) {
        const min = Math.abs(channel.min_sample(i));
        const max = Math.abs(channel.max_sample(i));
        maxAmp = Math.max(maxAmp, min, max);
      }

      // Normalize by global max so the loudest part fills the height
      const normalizedAmp = Math.min(1, maxAmp / normDivisor);
      const barHeight = Math.max(2, normalizedAmp * (height - 4));

      // Determine color based on progress
      ctx.fillStyle = x < progressX ? progressColor : waveColor;

      // Draw bar (centered vertically)
      const y = centerY - barHeight / 2;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 1);
      ctx.fill();
    }
  }, [waveformData, progress, waveColor, progressColor]);

  // Draw on waveform data or progress change
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Redraw on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      drawWaveform();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [drawWaveform]);

  // Calculate time from mouse/touch position
  const getTimeFromClientX = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container || duration <= 0) return 0;

      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      return (x / rect.width) * duration;
    },
    [duration]
  );

  const getTimeFromEvent = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      return getTimeFromClientX(e.clientX);
    },
    [getTimeFromClientX]
  );

  // Mouse handlers for seeking
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left click

      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      onSeekStart?.();

      const time = getTimeFromEvent(e);
      onSeekChange?.(time);

      e.preventDefault();
    },
    [onSeekStart, onSeekChange, getTimeFromEvent]
  );

  // Touch handlers for seeking
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      onSeekStart?.();

      const time = getTimeFromClientX(touch.clientX);
      onSeekChange?.(time);

      e.preventDefault();
    },
    [onSeekStart, onSeekChange, getTimeFromClientX]
  );

  // Global mouse/touch move/up handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      hasDraggedRef.current = true;
      const time = getTimeFromEvent(e);
      onSeekChange?.(time);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      isDraggingRef.current = false;
      const time = getTimeFromEvent(e);

      if (hasDraggedRef.current) {
        onSeekEnd?.(time);
      } else {
        // Click without drag - toggle play/pause or seek
        onSeekEnd?.(time);
        onClick?.();
      }

      hasDraggedRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;

      const touch = e.touches[0];
      if (!touch) return;

      hasDraggedRef.current = true;
      const time = getTimeFromClientX(touch.clientX);
      onSeekChange?.(time);
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;

      isDraggingRef.current = false;
      const touch = e.changedTouches[0];
      const time = touch ? getTimeFromClientX(touch.clientX) : 0;

      if (hasDraggedRef.current) {
        onSeekEnd?.(time);
      } else {
        // Tap without drag - toggle play/pause or seek
        onSeekEnd?.(time);
        onClick?.();
      }

      hasDraggedRef.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [getTimeFromEvent, getTimeFromClientX, onSeekChange, onSeekEnd, onClick]);

  return (
    <div
      ref={containerRef}
      role="slider"
      aria-label="Audio progress"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={displayTime}
      tabIndex={0}
      className="w-full h-full cursor-pointer touch-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
}
