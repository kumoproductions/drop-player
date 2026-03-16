import { Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import type { TranslationKey } from '../../types';
import { Tooltip } from './Tooltip';

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  t: (key: TranslationKey) => string;
}

export function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onMuteToggle,
  t,
}: VolumeControlProps) {
  const sliderRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle wheel scroll for volume
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      const newVolume = Math.max(0, Math.min(1, volume + delta));
      onVolumeChange(newVolume);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [volume, onVolumeChange]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      onVolumeChange(newVolume);
    },
    [onVolumeChange]
  );

  const displayVolume = isMuted ? 0 : volume;
  const muteLabel = isMuted ? t('unmute') : t('mute');

  return (
    <div ref={containerRef} className="drop-player-controls-group">
      <Tooltip content={muteLabel}>
        <button
          type="button"
          onClick={onMuteToggle}
          className="drop-player-button"
          aria-label={muteLabel}
        >
          {isMuted || volume === 0 ? (
            <VolumeX size={24} />
          ) : (
            <Volume2 size={24} />
          )}
        </button>
      </Tooltip>

      <input
        ref={sliderRef}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={displayVolume}
        onChange={handleSliderChange}
        className="drop-player-slider drop-player-volume-slider"
        aria-label={t('volume')}
      />
    </div>
  );
}
