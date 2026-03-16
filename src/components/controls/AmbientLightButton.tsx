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
    <div className="hidden sm:contents">
      <Tooltip content={label}>
        <button
          type="button"
          onClick={onToggle}
          className={`drop-player-button flex items-center justify-center w-10 h-10 rounded-md hover:bg-white/10 transition-colors ${
            isEnabled ? 'text-yellow-400' : 'text-white'
          }`}
          aria-label={label}
        >
          <Sun size={20} />
        </button>
      </Tooltip>
    </div>
  );
}
