import { SkipBack, SkipForward } from 'lucide-react';
import type { TranslationKey } from '../../types';
import { Tooltip } from './Tooltip';

interface SourceNavigationProps {
  activeIndex: number;
  sourceCount: number;
  onPrev: () => void;
  onNext: () => void;
  showPrev?: boolean;
  showNext?: boolean;
  t: (key: TranslationKey) => string;
}

export function SourceNavigation({
  activeIndex,
  sourceCount,
  onPrev,
  onNext,
  showPrev = true,
  showNext = true,
  t,
}: SourceNavigationProps) {
  if (sourceCount < 2) return null;

  const isFirst = activeIndex === 0;
  const isLast = activeIndex === sourceCount - 1;

  return (
    <div className="drop-player-source-nav">
      {showPrev && (
        <Tooltip content={t('previous')}>
          <button
            type="button"
            onClick={onPrev}
            disabled={isFirst}
            className="drop-player-button"
            aria-label={t('previous')}
          >
            <SkipBack size={18} />
          </button>
        </Tooltip>
      )}

      <span className="drop-player-source-nav-indicator" aria-live="polite">
        {activeIndex + 1} / {sourceCount}
      </span>

      {showNext && (
        <Tooltip content={t('next')}>
          <button
            type="button"
            onClick={onNext}
            disabled={isLast}
            className="drop-player-button"
            aria-label={t('next')}
          >
            <SkipForward size={18} />
          </button>
        </Tooltip>
      )}
    </div>
  );
}
