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
  const observerRef = useRef<ResizeObserver>();
  const keyToElemRef = useRef(new Map<string, HTMLElement>());
  const elemToKeyRef = useRef(new Map<HTMLElement, string>());
  const callbacksRef = useRef(new Map<string, RefCallback>());

  // Create observer lazily (once)
  if (!observerRef.current) {
    observerRef.current = new ResizeObserver((entries) => {
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
    });
  }

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const refFor = useCallback((key: string): RefCallback => {
    let cb = callbacksRef.current.get(key);
    if (!cb) {
      cb = (el: HTMLElement | null) => {
        const observer = observerRef.current;
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
  }, []);

  return { refFor, widths };
}
