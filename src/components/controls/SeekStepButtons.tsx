import { StepBack, StepForward } from 'lucide-react';
import type { TranslationKey } from '../../types';
import { Tooltip } from './Tooltip';

interface SeekStepButtonsProps {
  seekStep: number;
  onSeekBackward: () => void;
  onSeekForward: () => void;
  t: (key: TranslationKey) => string;
}

export function SeekStepButtons({
  seekStep,
  onSeekBackward,
  onSeekForward,
  t,
}: SeekStepButtonsProps) {
  const backLabel = `${t('seekBackward')} ${seekStep}s`;
  const fwdLabel = `${t('seekForward')} ${seekStep}s`;

  return (
    <>
      <Tooltip content={backLabel}>
        <button
          type="button"
          onClick={onSeekBackward}
          className="drop-player-button"
          aria-label={backLabel}
        >
          <StepBack size={18} />
        </button>
      </Tooltip>
      <Tooltip content={fwdLabel}>
        <button
          type="button"
          onClick={onSeekForward}
          className="drop-player-button"
          aria-label={fwdLabel}
        >
          <StepForward size={18} />
        </button>
      </Tooltip>
    </>
  );
}
