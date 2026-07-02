import { Volume2, VolumeX } from 'lucide-react';
import type { TranslationKey } from '../../types';
import { ControlButton } from './ControlButton';

interface VolumeButtonProps {
  volume: number;
  isMuted: boolean;
  onMuteToggle: () => void;
  t: (key: TranslationKey) => string;
}

export function VolumeButton({
  volume,
  isMuted,
  onMuteToggle,
  t,
}: VolumeButtonProps) {
  const muteLabel = isMuted ? t('unmute') : t('mute');

  return (
    <ControlButton label={muteLabel} onClick={onMuteToggle}>
      {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
    </ControlButton>
  );
}
