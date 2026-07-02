import { Pause, Play } from 'lucide-react';
import type { TranslationKey } from '../../types';
import { ControlButton } from './ControlButton';

interface PlayButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
  t: (key: TranslationKey) => string;
}

export function PlayButton({ isPlaying, onToggle, t }: PlayButtonProps) {
  const label = isPlaying ? t('pause') : t('play');
  return (
    <ControlButton label={label} onClick={onToggle}>
      {isPlaying ? <Pause size={24} /> : <Play size={24} />}
    </ControlButton>
  );
}
