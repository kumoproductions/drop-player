import {
  Gauge,
  Maximize,
  Minus,
  Pause,
  Play,
  Plus,
  Repeat,
  Settings2,
  StepBack,
  StepForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type {
  StatusIconKey,
  StatusOverlayState,
} from '../hooks/useStatusOverlay';

const ICON_MAP: Record<
  Exclude<StatusIconKey, ''>,
  React.ComponentType<{ size: number }>
> = {
  play: Play,
  pause: Pause,
  volume: Volume2,
  volumeX: VolumeX,
  repeat: Repeat,
  stepBack: StepBack,
  stepForward: StepForward,
  gauge: Gauge,
  settings: Settings2,
  zoomIn: Plus,
  zoomOut: Minus,
  fullscreen: Maximize,
};

interface StatusOverlayProps {
  state: StatusOverlayState;
}

export function StatusOverlay({ state }: StatusOverlayProps) {
  const { visible, icon, text } = state;
  const IconComponent = icon ? ICON_MAP[icon] : undefined;

  if (!text && !icon) return null;

  return (
    <div
      className={`drop-player-status-overlay ${
        visible ? 'drop-player-status-visible' : 'drop-player-status-hidden'
      }`}
      aria-live="polite"
      aria-atomic
    >
      {IconComponent && <IconComponent size={14} />}
      <span>{text}</span>
    </div>
  );
}
