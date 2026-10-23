import { useCallback, useEffect, useRef, useState } from 'react';

type RefCallback = (el: HTMLElement | null) => void;

/**
 * Tracks the rendered width of multiple elements using a single ResizeObserver.
 * Widths are cached when elements unmount so overflow calculations remain stable.
 */
export function useElementWidths(): {
  refFor: (key: string) => RefCallback;
  widths: Record<string, number>;
} {
  const [widths, setWidths] = useState<Record<string, number>>({});
  const keyToElemRef = useRef(new Map<string, HTMLElement>());
  const elemToKeyRef = useRef(new Map<HTMLElement, string>());
  const callbacksRef = useRef(new Map<string, RefCallback>());

  // Created once, guarded for SSR
  const [observer] = useState(() =>
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver((entries) => {
          setWidths((prev) => {
            let next = prev;
            for (const entry of entries) {
              const key = elemToKeyRef.current.get(entry.target as HTMLElement);
              if (key != null) {
                const w = Math.ceil(entry.borderBoxSize[0].inlineSize);
                if (prev[key] !== w) {
                  if (next === prev) next = { ...prev };
                  next[key] = w;
                }
              }
            }
            return next;
          });
        })
  );

  useEffect(() => () => observer?.disconnect(), [observer]);

  const refFor = useCallback(
    (key: string): RefCallback => {
      let cb = callbacksRef.current.get(key);
      if (!cb) {
        cb = (el: HTMLElement | null) => {
          if (!observer) return;
          const prev = keyToElemRef.current.get(key);
          if (prev) {
            observer.unobserve(prev);
            elemToKeyRef.current.delete(prev);
          }
          if (el) {
            keyToElemRef.current.set(key, el);
            elemToKeyRef.current.set(el, key);
            observer.observe(el);
          } else {
            keyToElemRef.current.delete(key);
            // Width stays cached in state — intentional
          }
        };
        callbacksRef.current.set(key, cb);
      }
      return cb;
    },
    [observer]
  );

  return { refFor, widths };
}
