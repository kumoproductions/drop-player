import { Camera, Check, Copy, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TranslationKey } from '../../types';
import { Tooltip } from './Tooltip';

type FeedbackState = 'idle' | 'success' | 'error';

const FEEDBACK_DURATION_MS = 2000;

interface CaptureButtonsProps {
  onSave: () => Promise<void>;
  onCopy: () => Promise<void>;
  t: (key: TranslationKey) => string;
}

function useFeedback() {
  const [state, setState] = useState<FeedbackState>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const busyRef = useRef(false);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const trigger = useCallback(async (action: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    clearTimeout(timerRef.current);
    try {
      await action();
      setState('success');
    } catch {
      setState('error');
    }
    timerRef.current = setTimeout(() => {
      setState('idle');
      busyRef.current = false;
    }, FEEDBACK_DURATION_MS);
  }, []);

  return { state, trigger };
}

function SaveIcon({ state }: { state: FeedbackState }) {
  switch (state) {
    case 'success':
      return <Check size={20} />;
    case 'error':
      return <X size={20} />;
    default:
      return <Camera size={20} />;
  }
}

function CopyIcon({ state }: { state: FeedbackState }) {
  switch (state) {
    case 'success':
      return <Check size={20} />;
    case 'error':
      return <X size={20} />;
    default:
      return <Copy size={20} />;
  }
}

const feedbackColor: Record<FeedbackState, string> = {
  idle: 'text-white',
  success: 'text-green-400',
  error: 'text-red-400',
};

export function CaptureButtons({ onSave, onCopy, t }: CaptureButtonsProps) {
  const saveLabel = t('saveCapture');
  const copyLabel = t('copyCapture');

  const save = useFeedback();
  const copy = useFeedback();

  return (
    <div className="hidden sm:contents">
      <Tooltip content={saveLabel}>
        <button
          type="button"
          onClick={() => save.trigger(onSave)}
          className={`drop-player-button flex items-center justify-center w-10 h-10 rounded-md hover:bg-white/10 transition-colors ${feedbackColor[save.state]}`}
          aria-label={saveLabel}
        >
          <SaveIcon state={save.state} />
        </button>
      </Tooltip>

      <Tooltip content={copyLabel}>
        <button
          type="button"
          onClick={() => copy.trigger(onCopy)}
          className={`drop-player-button flex items-center justify-center w-10 h-10 rounded-md hover:bg-white/10 transition-colors ${feedbackColor[copy.state]}`}
          aria-label={copyLabel}
        >
          <CopyIcon state={copy.state} />
        </button>
      </Tooltip>
    </div>
  );
}
