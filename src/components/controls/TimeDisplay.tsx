import { useCallback } from 'react';
import type { TimeDisplayFormat, TranslationKey } from '../../types';
import {
  formatBarsBeats,
  formatFeetFrames,
  formatSecondsFrames,
  formatTime,
  formatTimecode,
  secondsToFrames,
} from '../../utils/formatters';

export type { TimeDisplayFormat };

export function getNextTimeDisplayFormat(
  current: TimeDisplayFormat,
  formats: TimeDisplayFormat[]
): TimeDisplayFormat {
  const idx = formats.indexOf(current);
  if (idx === -1) return formats[0] ?? 'elapsed-total';
  return formats[(idx + 1) % formats.length];
}

interface TimeDisplayProps {
  currentTime: number;
  duration: number;
  frameRate: number;
  filmGauge: number;
  bpm: number;
  timeSignature: string;
  format: TimeDisplayFormat;
  formats: TimeDisplayFormat[];
  onFormatChange: (format: TimeDisplayFormat) => void;
  t: (key: TranslationKey) => string;
}

export function TimeDisplay({
  currentTime,
  duration,
  frameRate,
  filmGauge,
  bpm,
  timeSignature,
  format,
  formats,
  onFormatChange,
  t,
}: TimeDisplayProps) {
  const cycleFormat = useCallback(() => {
    if (formats.length <= 1) return;
    onFormatChange(getNextTimeDisplayFormat(format, formats));
  }, [format, formats, onFormatChange]);

  const getDisplayText = () => {
    switch (format) {
      case 'elapsed-total':
        return `${formatTime(currentTime)} / ${formatTime(duration)}`;
      case 'remaining':
        return `-${formatTime(Math.max(0, duration - currentTime))}`;
      case 'timecode':
        return formatTimecode(currentTime, frameRate);
      case 'frames':
        return `${secondsToFrames(currentTime, frameRate)} / ${secondsToFrames(duration, frameRate)}`;
      case 'feet-frames':
        return `${formatFeetFrames(currentTime, frameRate, filmGauge)} / ${formatFeetFrames(duration, frameRate, filmGauge)}`;
      case 'seconds-frames':
        return `${formatSecondsFrames(currentTime, frameRate)} / ${formatSecondsFrames(duration, frameRate)}`;
      case 'bars-beats':
        return `${formatBarsBeats(currentTime, bpm, timeSignature)} / ${formatBarsBeats(duration, bpm, timeSignature)}`;
      default:
        return `${formatTime(currentTime)} / ${formatTime(duration)}`;
    }
  };

  return (
    <button
      type="button"
      onClick={cycleFormat}
      className="drop-player-button drop-player-button--time"
      aria-label={t('toggleTimeDisplay')}
    >
      {getDisplayText()}
    </button>
  );
}
