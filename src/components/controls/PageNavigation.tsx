import { ChevronDown, ChevronUp } from 'lucide-react';
import type { TranslationKey } from '../../types';
import { Tooltip } from './Tooltip';

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  t: (key: TranslationKey) => string;
}

export function PageNavigation({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  t,
}: PageNavigationProps) {
  if (totalPages < 2) return null;

  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <div className="drop-player-page-nav">
      <Tooltip content={t('previousPage')}>
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className="drop-player-button"
          aria-label={t('previousPage')}
        >
          <ChevronUp size={18} />
        </button>
      </Tooltip>

      <span className="drop-player-page-nav-indicator" aria-live="polite">
        {currentPage} / {totalPages}
      </span>

      <Tooltip content={t('nextPage')}>
        <button
          type="button"
          onClick={onNext}
          disabled={isLast}
          className="drop-player-button"
          aria-label={t('nextPage')}
        >
          <ChevronDown size={18} />
        </button>
      </Tooltip>
    </div>
  );
}
