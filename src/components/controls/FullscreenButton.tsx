import { Maximize, Minimize } from 'lucide-react';
import type { TranslationKey } from '../../types';
import { Tooltip } from './Tooltip';

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onToggle: () => void;
  t: (key: TranslationKey) => string;
}

export function FullscreenButton({
  isFullscreen,
  onToggle,
  t,
}: FullscreenButtonProps) {
  const label = isFullscreen ? t('exitFullscreen') : t('fullscreen');
  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={onToggle}
        className="drop-player-button flex items-center justify-center w-10 h-10 rounded-md hover:bg-white/10 transition-colors text-white"
        aria-label={label}
      >
        {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
      </button>
    </Tooltip>
  );
}
