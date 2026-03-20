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
}

export function WaveformCanvas({
  waveformData,
  currentTime,
  duration,
  isSeeking,
  seekValue,
  waveColor = '#666',
  progressColor = '#0066ff',
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className="drop-player-waveform">
      <canvas
        ref={canvasRef}
        className="drop-player-waveform-canvas"
        style={{ display: 'block' }}
      />
    </div>
  );
}
