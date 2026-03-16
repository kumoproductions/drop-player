import { useCallback } from 'react';
import type { TranslationKey } from '../../types';
import {
  formatTime,
  formatTimecode,
  secondsToFrames,
} from '../../utils/formatters';

export type TimeDisplayFormat = 'elapsed-total' | 'timecode' | 'frames';

const FORMATS: TimeDisplayFormat[] = ['elapsed-total', 'timecode', 'frames'];

export function getNextTimeDisplayFormat(
  current: TimeDisplayFormat,
  showFrameFormat: boolean
): TimeDisplayFormat {
  const idx = FORMATS.indexOf(current);
  for (let i = 1; i <= FORMATS.length; i++) {
    const next = FORMATS[(idx + i) % FORMATS.length];
    if (next === 'frames' && !showFrameFormat) continue;
    return next;
  }
  return 'elapsed-total';
}

interface TimeDisplayProps {
  currentTime: number;
  duration: number;
  frameRate: number;
  format: TimeDisplayFormat;
  onFormatChange: (format: TimeDisplayFormat) => void;
  /** When false (e.g. audio mode), frame format is not shown in the cycle. Default true. */
  showFrameFormat?: boolean;
  t: (key: TranslationKey) => string;
}

export function TimeDisplay({
  currentTime,
  duration,
  frameRate,
  format,
  onFormatChange,
  showFrameFormat = true,
  t,
}: TimeDisplayProps) {
  const cycleFormat = useCallback(() => {
    onFormatChange(getNextTimeDisplayFormat(format, showFrameFormat));
  }, [format, showFrameFormat, onFormatChange]);

  const getDisplayText = () => {
    switch (format) {
      case 'elapsed-total':
        return `${formatTime(currentTime)} / ${formatTime(duration)}`;
      case 'timecode':
        return formatTimecode(currentTime, frameRate);
      case 'frames':
        return `${secondsToFrames(currentTime, frameRate)} / ${secondsToFrames(duration, frameRate)}`;
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
