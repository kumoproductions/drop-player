import { type Ref, useCallback } from 'react';
import type { TranslationKey } from '../../types';

interface VolumeSliderProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  t: (key: TranslationKey) => string;
  inputRef?: Ref<HTMLInputElement>;
}

export function VolumeSlider({
  volume,
  isMuted,
  onVolumeChange,
  t,
  inputRef,
}: VolumeSliderProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onVolumeChange(parseFloat(e.target.value));
    },
    [onVolumeChange]
  );

  return (
    <input
      ref={inputRef}
      type="range"
      min={0}
      max={1}
      step={0.01}
      value={isMuted ? 0 : volume}
      onChange={handleChange}
      className="drop-player-slider drop-player-volume-slider"
      aria-label={t('volume')}
    />
  );
}
