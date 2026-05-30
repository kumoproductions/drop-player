import { Volume2, VolumeX } from 'lucide-react';
import type { TranslationKey } from '../../types';
import { Tooltip } from './Tooltip';

interface VolumeButtonProps {
  volume: number;
  isMuted: boolean;
  onMuteToggle: () => void;
  t: (key: TranslationKey) => string;
}

export function VolumeButton({
  volume,
  isMuted,
  onMuteToggle,
  t,
}: VolumeButtonProps) {
  const muteLabel = isMuted ? t('unmute') : t('mute');

  return (
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
  );
}
