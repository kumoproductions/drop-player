import { Sun } from 'lucide-react';
import type { TranslationKey } from '../../types';
import { Tooltip } from './Tooltip';

interface AmbientLightButtonProps {
  isEnabled: boolean;
  onToggle: () => void;
  t: (key: TranslationKey) => string;
}

export function AmbientLightButton({
  isEnabled,
  onToggle,
  t,
}: AmbientLightButtonProps) {
  const label = t('ambientLight');
  return (
    <div className="drop-player-responsive-hide">
      <Tooltip content={label}>
        <button
          type="button"
          onClick={onToggle}
          className={`drop-player-button ${isEnabled ? 'drop-player-color-yellow' : ''}`}
          aria-label={label}
        >
          <Sun size={20} />
        </button>
      </Tooltip>
    </div>
  );
}
