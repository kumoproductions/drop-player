import { useCallback, useRef, useState } from 'react';

export interface StatusOverlayState {
  visible: boolean;
  icon: string;
  text: string;
  /** When true, overlay stays visible until explicitly dismissed */
  persistent: boolean;
}

const INITIAL_STATE: StatusOverlayState = {
  visible: false,
  icon: '',
  text: '',
  persistent: false,
};

const FADE_DELAY = 1000;

export function useStatusOverlay() {
  const [state, setState] = useState<StatusOverlayState>(INITIAL_STATE);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback(
    (icon: string, text: string, persistent = false) => {
      clearTimer();
      setState({ visible: true, icon, text, persistent });

      if (!persistent) {
        timerRef.current = setTimeout(() => {
          setState((prev) => ({ ...prev, visible: false }));
        }, FADE_DELAY);
      }
    },
    [clearTimer]
  );

  const dismiss = useCallback(() => {
    clearTimer();
    setState((prev) => ({ ...prev, persistent: false }));
    timerRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, visible: false }));
    }, FADE_DELAY);
  }, [clearTimer]);

  return { state, show, dismiss };
}
