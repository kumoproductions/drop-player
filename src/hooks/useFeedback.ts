import { useCallback, useEffect, useRef, useState } from 'react';

type FeedbackState = 'idle' | 'success' | 'error';

const FEEDBACK_DURATION_MS = 2000;

export type { FeedbackState };

export function useFeedback() {
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
