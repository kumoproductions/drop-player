import { Repeat } from 'lucide-react';
import type { TranslationKey } from '../../types';
import { ControlButton } from './ControlButton';

interface LoopButtonProps {
  isLoop: boolean;
  onToggle: () => void;
  t: (key: TranslationKey) => string;
}

export function LoopButton({ isLoop, onToggle, t }: LoopButtonProps) {
  const label = isLoop ? t('disableRepeat') : t('enableRepeat');
  return (
    <ControlButton label={label} active={isLoop} onClick={onToggle}>
      <Repeat size={20} />
    </ControlButton>
  );
}
