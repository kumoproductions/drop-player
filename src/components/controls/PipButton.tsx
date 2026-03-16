import { PictureInPicture, PictureInPicture2 } from 'lucide-react';
import type { TranslationKey } from '../../types';
import { Tooltip } from './Tooltip';

interface PipButtonProps {
  isPip: boolean;
  onToggle: () => void;
  t: (key: TranslationKey) => string;
}

export function PipButton({ isPip, onToggle, t }: PipButtonProps) {
  const label = isPip ? t('exitPip') : t('pip');
  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={onToggle}
        className="drop-player-button"
        aria-label={label}
      >
        {isPip ? (
          <PictureInPicture size={20} />
        ) : (
          <PictureInPicture2 size={20} />
        )}
      </button>
    </Tooltip>
  );
}
