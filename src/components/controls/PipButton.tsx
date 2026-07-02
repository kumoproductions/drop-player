import { PictureInPicture, PictureInPicture2 } from 'lucide-react';
import type { TranslationKey } from '../../types';
import { ControlButton } from './ControlButton';

interface PipButtonProps {
  isPip: boolean;
  onToggle: () => void;
  t: (key: TranslationKey) => string;
}

export function PipButton({ isPip, onToggle, t }: PipButtonProps) {
  const label = isPip ? t('exitPip') : t('pip');
  return (
    <ControlButton label={label} onClick={onToggle}>
      {isPip ? <PictureInPicture size={20} /> : <PictureInPicture2 size={20} />}
    </ControlButton>
  );
}
