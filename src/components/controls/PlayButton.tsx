import { Pause, Play } from 'lucide-react';
import type { TranslationKey } from '../../types';
import { Tooltip } from './Tooltip';

interface PlayButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
  t: (key: TranslationKey) => string;
}

export function PlayButton({ isPlaying, onToggle, t }: PlayButtonProps) {
  const label = isPlaying ? t('pause') : t('play');
  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={onToggle}
        className="drop-player-button"
        aria-label={label}
      >
        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
      </button>
    </Tooltip>
  );
}
