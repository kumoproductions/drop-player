import { Camera, Check, X } from 'lucide-react';
import type { FeedbackState } from '../../hooks/useFeedback';
import { useFeedback } from '../../hooks/useFeedback';
import type { TranslationKey } from '../../types';
import { Tooltip } from './Tooltip';

const feedbackColor: Record<FeedbackState, string> = {
  idle: '',
  success: 'drop-player-color-green',
  error: 'drop-player-color-red',
};

function Icon({ state }: { state: FeedbackState }) {
  switch (state) {
    case 'success':
      return <Check size={20} />;
    case 'error':
      return <X size={20} />;
    default:
      return <Camera size={20} />;
  }
}

interface SaveCaptureButtonProps {
  onAction: () => Promise<void>;
  t: (key: TranslationKey) => string;
}

export function SaveCaptureButton({ onAction, t }: SaveCaptureButtonProps) {
  const { state, trigger } = useFeedback();
  const label = t('saveCapture');

  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={() => trigger(onAction)}
        className={`drop-player-button ${feedbackColor[state]}`}
        aria-label={label}
      >
        <Icon state={state} />
      </button>
    </Tooltip>
  );
}
