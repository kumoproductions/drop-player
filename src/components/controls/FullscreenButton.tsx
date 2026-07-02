import { Maximize, Minimize } from 'lucide-react';
import type { TranslationKey } from '../../types';
import { ControlButton } from './ControlButton';

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
    <ControlButton label={label} onClick={onToggle}>
      {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
    </ControlButton>
  );
}
