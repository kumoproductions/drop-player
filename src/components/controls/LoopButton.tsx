import { Repeat } from 'lucide-react';
import type { TranslationKey } from '../../types';
import { Tooltip } from './Tooltip';

interface LoopButtonProps {
  isLoop: boolean;
  onToggle: () => void;
  t: (key: TranslationKey) => string;
}

export function LoopButton({ isLoop, onToggle, t }: LoopButtonProps) {
  const label = isLoop ? t('disableRepeat') : t('enableRepeat');
  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={onToggle}
        className={`drop-player-button ${isLoop ? 'drop-player-color-blue' : ''}`}
        aria-label={label}
      >
        <Repeat size={20} />
      </button>
    </Tooltip>
  );
}
