import { useCallback, useEffect, useRef, useState } from 'react';
import type { PdfCoreProps, PdfState } from '../types';

/**
 * PDF viewer that delegates zoom, fullscreen, etc. to the browser's built-in
 * PDF viewer (object/embed). ControlsBar is hidden for PDF in Player.
 */
export function PdfCore(props: PdfCoreProps) {
  const { src, onStateChange, onError, onLoad } = props;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const state: PdfState = { zoom: 1, panX: 0, panY: 0, isLoaded };
    onStateChange(state);
  }, [isLoaded, onStateChange]);

  const [srcFailed, setSrcFailed] = useState(false);
  const srcFailedRef = useRef(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset loaded state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setSrcFailed(false);
    srcFailedRef.current = false;

    if (!src) return;

    // <object> doesn't reliably fire error events on 404/network failure,
    // so we pre-validate the URL is reachable. Use Range GET because HEAD
    // often fails on CORS-restricted origins.
    const controller = new AbortController();
    fetch(src, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok && res.status !== 206) {
          setSrcFailed(true);
          srcFailedRef.current = true;
          onErrorRef.current?.(
            Object.assign(new Error(`Failed to load PDF (${res.status})`), {
              name: 'errorNetwork',
            })
          );
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setSrcFailed(true);
        srcFailedRef.current = true;
        onErrorRef.current?.(
          Object.assign(new Error('Failed to load PDF'), {
            name: 'errorNetwork',
          })
        );
      });

    return () => controller.abort();
  }, [src]);

  const handleLoad = useCallback(() => {
    if (!srcFailedRef.current) {
      setIsLoaded(true);
      onLoadRef.current?.();
    }
  }, []);

  const handleError = useCallback(() => {
    onErrorRef.current?.(
      Object.assign(new Error('Failed to load PDF'), {
        name: 'errorNetwork',
      })
    );
  }, []);

  // Auto-append #toolbar=0 to hide built-in PDF toolbar (avoids overlap with SourceSelector)
  const pdfSrc = (() => {
    if (!src) return '';
    const setToolbarZero = (fragment: string): string => {
      const params = new URLSearchParams(
        fragment.startsWith('?') ? fragment.slice(1) : fragment
      );
      params.set('toolbar', '0');
      return params.toString();
    };
    try {
      const url = new URL(src, window.location.href);
      const raw = url.hash;
      if (raw && raw.length > 1) {
        url.hash = `#${setToolbarZero(raw.slice(1))}`;
      } else {
        url.hash = '#toolbar=0';
      }
      return url.toString();
    } catch {
      const hashIdx = src.indexOf('#');
      if (hashIdx === -1) return `${src}#toolbar=0`;
      const base = src.slice(0, hashIdx);
      const fragment = src.slice(hashIdx + 1);
      return `${base}#${setToolbarZero(fragment)}`;
    }
  })();

  if (!src) {
    return (
      <div
        ref={wrapperRef}
        className="drop-player-pdf-container drop-player-pdf-container--empty"
        role="application"
        aria-label="PDF viewer"
      />
    );
  }

  return (
    <div
      ref={wrapperRef}
      role="application"
      aria-label="PDF viewer"
      className="drop-player-pdf-container"
    >
      <object
        data={pdfSrc}
        type="application/pdf"
        width="100%"
        height="100%"
        onLoad={handleLoad}
        onError={handleError}
        aria-label="PDF document"
      />
    </div>
  );
}
