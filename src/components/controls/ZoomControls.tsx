import { Minus, Plus, RotateCcw } from 'lucide-react';
import type { TranslationKey } from '../../types';
import { Tooltip } from './Tooltip';

interface ZoomControlsProps {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  t: (key: TranslationKey) => string;
}

export function ZoomControls({
  zoom,
  minZoom,
  maxZoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  t,
}: ZoomControlsProps) {
  const EPS = 1e-6;
  const zoomPercent = Math.round(zoom * 100);
  const canZoomIn = zoom < maxZoom;
  const canZoomOut = zoom > minZoom;
  const canReset = Math.abs(zoom - 1) > EPS;

  return (
    <>
      {/* Zoom out button */}
      <Tooltip content={t('zoomOut')}>
        <button
          type="button"
          onClick={onZoomOut}
          disabled={!canZoomOut}
          className="drop-player-button"
          aria-label={t('zoomOut')}
        >
          <Minus size={20} />
        </button>
      </Tooltip>

      {/* Zoom level display */}
      <Tooltip content={t('zoomLevel')}>
        <button
          type="button"
          onClick={onResetZoom}
          disabled={!canReset}
          className="drop-player-button drop-player-button--zoom-level"
          aria-label={t('resetZoom')}
        >
          {zoomPercent}%
        </button>
      </Tooltip>

      {/* Zoom in button */}
      <Tooltip content={t('zoomIn')}>
        <button
          type="button"
          onClick={onZoomIn}
          disabled={!canZoomIn}
          className="drop-player-button"
          aria-label={t('zoomIn')}
        >
          <Plus size={20} />
        </button>
      </Tooltip>

      {/* Reset button (only show if zoomed) */}
      {canReset && (
        <Tooltip content={t('resetZoom')}>
          <button
            type="button"
            onClick={onResetZoom}
            className="drop-player-button"
            aria-label={t('resetZoom')}
          >
            <RotateCcw size={18} />
          </button>
        </Tooltip>
      )}
    </>
  );
}
