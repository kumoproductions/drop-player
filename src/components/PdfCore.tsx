import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { usePdfJs } from '../hooks/usePdfJs';
import type { PdfCoreProps, PdfCoreRef, PdfState } from '../types';

const DEFAULT_MIN_ZOOM = 1;
const DEFAULT_MAX_ZOOM = 3;
const DEFAULT_ZOOM_STEP = 0.25;
const RENDER_DEBOUNCE_MS = 150;

export const PdfCore = forwardRef<PdfCoreRef, PdfCoreProps>(
  function PdfCore(props, ref) {
    const {
      src,
      minZoom = DEFAULT_MIN_ZOOM,
      maxZoom = DEFAULT_MAX_ZOOM,
      zoomStep = DEFAULT_ZOOM_STEP,
      containerRef,
      workerSrc,
      onStateChange,
      onError,
      onLoad,
      onFullscreenToggle,
      onToggleControls,
    } = props;

    // ── pdf.js document loading ──
    const {
      pdfDocument,
      totalPages,
      isAvailable,
      isLoaded: docLoaded,
    } = usePdfJs({
      src,
      enabled: true,
      workerSrc,
      onError,
      onLoad,
    });

    // ── State ──
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);

    const renderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const wheelTouchContainerRef = useRef<HTMLDivElement>(null);
    const isFocusedRef = useRef(false);
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const panStartRef = useRef({ x: 0, y: 0 });
    const renderTaskRef = useRef<RenderTask | null>(null);

    // Store canvas logical size for pan clamping
    const canvasSizeRef = useRef({ width: 0, height: 0 });

    const clampZoom = useCallback(
      (z: number) => Math.max(minZoom, Math.min(maxZoom, z)),
      [minZoom, maxZoom]
    );

    const clampPan = useCallback(
      (x: number, y: number, currentZoom: number) => {
        const container = containerRef.current;
        if (!container || currentZoom <= 1) return { x: 0, y: 0 };

        const containerRect = container.getBoundingClientRect();
        const scaledWidth = canvasSizeRef.current.width * currentZoom;
        const scaledHeight = canvasSizeRef.current.height * currentZoom;
        const maxPanX = Math.max(0, (scaledWidth - containerRect.width) / 2);
        const maxPanY = Math.max(0, (scaledHeight - containerRect.height) / 2);

        return {
          x: Math.max(-maxPanX, Math.min(maxPanX, x)),
          y: Math.max(-maxPanY, Math.min(maxPanY, y)),
        };
      },
      [containerRef]
    );

    // ── Report state changes ──
    useEffect(() => {
      const state: PdfState = {
        zoom,
        panX,
        panY,
        isLoaded: docLoaded,
        currentPage: docLoaded ? currentPage : 0,
        totalPages: docLoaded ? totalPages : 0,
      };
      onStateChange(state);
    }, [zoom, panX, panY, docLoaded, currentPage, totalPages, onStateChange]);

    // ── Reset state on src change ──
    // biome-ignore lint/correctness/useExhaustiveDependencies: src is intentional trigger for reset
    useEffect(() => {
      setCurrentPage(1);
      setZoom(1);

      setPanX(0);
      setPanY(0);
    }, [src]);

    // ── Canvas rendering ──
    // Renders at zoom * dpr resolution for crisp output.
    // Canvas CSS size is always BASE size (scale=1) — visual zoom is via CSS transform.
    // This means the canvas has zoom*dpr pixels displayed in base CSS size, then
    // CSS transform: scale(zoom) expands it => effective pixel density = dpr (crisp).
    // biome-ignore lint/correctness/useExhaustiveDependencies: containerRef is a stable ref
    const renderPage = useCallback(
      async (doc: PDFDocumentProxy, pageNum: number, scale: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Cancel any in-progress render
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // Already completed
          }
          renderTaskRef.current = null;
        }

        let page: PDFPageProxy;
        try {
          page = await doc.getPage(pageNum);
        } catch {
          return;
        }

        const dpr = window.devicePixelRatio || 1;
        const baseViewport = page.getViewport({ scale: 1 });

        // Calculate scale so that the page fits the container at zoom=1
        const container = containerRef.current;
        let fitScale = 1;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const scaleX = containerRect.width / baseViewport.width;
          const scaleY = containerRect.height / baseViewport.height;
          fitScale = Math.min(scaleX, scaleY);
        }

        const cssWidth = baseViewport.width * fitScale;
        const cssHeight = baseViewport.height * fitScale;
        const renderViewport = page.getViewport({
          scale: fitScale * scale * dpr,
        });

        // High-res pixel buffer
        canvas.width = renderViewport.width;
        canvas.height = renderViewport.height;
        // CSS size = fitted base size (zoom is handled by CSS transform)
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;

        canvasSizeRef.current = {
          width: cssWidth,
          height: cssHeight,
        };

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        try {
          const task = page.render({
            canvasContext: ctx,
            viewport: renderViewport,
            canvas: canvas,
          });
          renderTaskRef.current = task;
          await task.promise;
          renderTaskRef.current = null;
          page.cleanup();
        } catch {
          // Render cancelled or failed
        }
      },
      []
    );

    // Re-render on container resize (e.g. fullscreen, responsive layout)
    useEffect(() => {
      const container = containerRef.current;
      if (!container || !pdfDocument || !docLoaded) return;

      const observer = new ResizeObserver(() => {
        renderPage(pdfDocument, currentPage, zoom);
      });
      observer.observe(container);
      return () => observer.disconnect();
    }, [containerRef, pdfDocument, docLoaded, currentPage, zoom, renderPage]);

    // Render on page change (immediate, at current zoom)
    // biome-ignore lint/correctness/useExhaustiveDependencies: zoom changes handled by debounced effect below
    useEffect(() => {
      if (!pdfDocument || !docLoaded) return;
      renderPage(pdfDocument, currentPage, zoom);
    }, [pdfDocument, docLoaded, currentPage, renderPage]);

    // Debounced re-render on zoom change only (for crisp text at new zoom level)
    // biome-ignore lint/correctness/useExhaustiveDependencies: currentPage handled by immediate render effect above
    useEffect(() => {
      if (!pdfDocument || !docLoaded) return;

      if (renderDebounceRef.current) {
        clearTimeout(renderDebounceRef.current);
      }

      renderDebounceRef.current = setTimeout(() => {
        renderPage(pdfDocument, currentPage, zoom);
        renderDebounceRef.current = null;
      }, RENDER_DEBOUNCE_MS);

      return () => {
        if (renderDebounceRef.current) {
          clearTimeout(renderDebounceRef.current);
        }
      };
    }, [zoom, pdfDocument, docLoaded, renderPage]);

    // ── Zoom methods ──
    const zoomIn = useCallback(() => {
      setZoom((prev) => {
        const newZoom = clampZoom(prev + zoomStep);
        if (newZoom <= 1) {
          setPanX(0);
          setPanY(0);
        }
        return newZoom;
      });
    }, [clampZoom, zoomStep]);

    const zoomOut = useCallback(() => {
      setZoom((prev) => {
        const newZoom = clampZoom(prev - zoomStep);
        if (newZoom <= 1) {
          setPanX(0);
          setPanY(0);
        } else {
          const { x, y } = clampPan(panX, panY, newZoom);
          setPanX(x);
          setPanY(y);
        }
        return newZoom;
      });
    }, [clampZoom, zoomStep, clampPan, panX, panY]);

    const resetZoom = useCallback(() => {
      setZoom(1);
      setPanX(0);
      setPanY(0);
    }, []);

    const setZoomLevel = useCallback(
      (newZoom: number) => {
        const clamped = clampZoom(newZoom);
        setZoom(clamped);
        if (clamped <= 1) {
          setPanX(0);
          setPanY(0);
        } else {
          const { x, y } = clampPan(panX, panY, clamped);
          setPanX(x);
          setPanY(y);
        }
      },
      [clampZoom, clampPan, panX, panY]
    );

    // ── Page methods (reset zoom + pan on page change) ──
    const goToPage = useCallback(
      (page: number) => {
        const clamped = Math.max(1, Math.min(totalPages, page));
        setCurrentPage(clamped);
        setZoom(1);

        setPanX(0);
        setPanY(0);
      },
      [totalPages]
    );

    const nextPage = useCallback(() => {
      if (currentPage >= totalPages) return;
      goToPage(currentPage + 1);
    }, [currentPage, totalPages, goToPage]);

    const prevPage = useCallback(() => {
      if (currentPage <= 1) return;
      goToPage(currentPage - 1);
    }, [currentPage, goToPage]);

    // ── Mouse/touch interaction (mirrors ImageCore) ──
    const handleWheel = useCallback(
      (e: React.WheelEvent) => {
        const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
        const newZoom = clampZoom(zoom + delta);

        if (newZoom <= 1) {
          setZoom(newZoom);
          setPanX(0);
          setPanY(0);
          return;
        }
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const cursorX = e.clientX - rect.left - rect.width / 2;
          const cursorY = e.clientY - rect.top - rect.height / 2;
          const zoomRatio = newZoom / zoom;
          const newPanX = panX * zoomRatio + cursorX * (1 - zoomRatio);
          const newPanY = panY * zoomRatio + cursorY * (1 - zoomRatio);

          const { x, y } = clampPan(newPanX, newPanY, newZoom);
          setZoom(newZoom);
          setPanX(x);
          setPanY(y);
        } else {
          setZoom(newZoom);
        }
      },
      [zoom, zoomStep, clampZoom, clampPan, panX, panY, containerRef]
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        wheelTouchContainerRef.current?.focus();
        if (zoom <= 1) return;
        if (e.button !== 0) return;
        isDraggingRef.current = true;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        panStartRef.current = { x: panX, y: panY };
        e.preventDefault();
      },
      [zoom, panX, panY]
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!isDraggingRef.current || zoom <= 1) return;
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        const newPanX = panStartRef.current.x + deltaX;
        const newPanY = panStartRef.current.y + deltaY;
        const { x, y } = clampPan(newPanX, newPanY, zoom);
        setPanX(x);
        setPanY(y);
      },
      [zoom, clampPan]
    );

    useEffect(() => {
      const handleGlobalMouseUp = () => {
        isDraggingRef.current = false;
      };
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        if (onFullscreenToggle) {
          onFullscreenToggle();
          return;
        }
        if (zoom > 1) {
          resetZoom();
        } else {
          const clampedZoom = clampZoom(2);
          const container = containerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const cursorX = e.clientX - rect.left - rect.width / 2;
            const cursorY = e.clientY - rect.top - rect.height / 2;
            const newPanX = -cursorX * (clampedZoom - 1);
            const newPanY = -cursorY * (clampedZoom - 1);
            const { x, y } = clampPan(newPanX, newPanY, clampedZoom);
            setZoom(clampedZoom);
            setPanX(x);
            setPanY(y);
          } else {
            setZoom(clampedZoom);
          }
        }
      },
      [zoom, resetZoom, clampPan, clampZoom, containerRef, onFullscreenToggle]
    );

    // ── Touch (pinch zoom + drag) ──
    const lastTouchDistanceRef = useRef<number | null>(null);
    const lastTouchCenterRef = useRef<{ x: number; y: number } | null>(null);
    const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
    const wasPinchRef = useRef(false);

    const handleTouchStart = useCallback(
      (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
          wasPinchRef.current = true;
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          lastTouchDistanceRef.current = Math.hypot(
            t2.clientX - t1.clientX,
            t2.clientY - t1.clientY
          );
          lastTouchCenterRef.current = {
            x: (t1.clientX + t2.clientX) / 2,
            y: (t1.clientY + t2.clientY) / 2,
          };
        } else if (e.touches.length === 1) {
          wasPinchRef.current = false;
          touchStartPosRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
          if (zoom > 1) {
            isDraggingRef.current = true;
            dragStartRef.current = {
              x: e.touches[0].clientX,
              y: e.touches[0].clientY,
            };
            panStartRef.current = { x: panX, y: panY };
          }
        }
      },
      [zoom, panX, panY]
    );

    const handleTouchMove = useCallback(
      (e: React.TouchEvent) => {
        if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const distance = Math.hypot(
            t2.clientX - t1.clientX,
            t2.clientY - t1.clientY
          );
          const scale = distance / lastTouchDistanceRef.current;
          const newZoom = clampZoom(zoom * scale);

          if (newZoom <= 1) {
            setZoom(newZoom);
            setPanX(0);
            setPanY(0);
          } else {
            const container = containerRef.current;
            if (container && lastTouchCenterRef.current) {
              const rect = container.getBoundingClientRect();
              const centerX =
                (t1.clientX + t2.clientX) / 2 - rect.left - rect.width / 2;
              const centerY =
                (t1.clientY + t2.clientY) / 2 - rect.top - rect.height / 2;
              const zoomRatio = newZoom / zoom;
              const newPanX = panX * zoomRatio + centerX * (1 - zoomRatio);
              const newPanY = panY * zoomRatio + centerY * (1 - zoomRatio);
              const { x, y } = clampPan(newPanX, newPanY, newZoom);
              setZoom(newZoom);
              setPanX(x);
              setPanY(y);
            } else {
              setZoom(newZoom);
            }
          }

          lastTouchDistanceRef.current = distance;
          lastTouchCenterRef.current = {
            x: (t1.clientX + t2.clientX) / 2,
            y: (t1.clientY + t2.clientY) / 2,
          };
          e.preventDefault();
        } else if (
          e.touches.length === 1 &&
          isDraggingRef.current &&
          zoom > 1
        ) {
          const deltaX = e.touches[0].clientX - dragStartRef.current.x;
          const deltaY = e.touches[0].clientY - dragStartRef.current.y;
          const newPanX = panStartRef.current.x + deltaX;
          const newPanY = panStartRef.current.y + deltaY;
          const { x, y } = clampPan(newPanX, newPanY, zoom);
          setPanX(x);
          setPanY(y);
          e.preventDefault();
        }
      },
      [zoom, panX, panY, clampZoom, clampPan, containerRef]
    );

    const handleTouchEnd = useCallback(
      (e: React.TouchEvent) => {
        if (
          onToggleControls &&
          !wasPinchRef.current &&
          e.changedTouches.length === 1 &&
          touchStartPosRef.current
        ) {
          const touch = e.changedTouches[0];
          const dx = touch.clientX - touchStartPosRef.current.x;
          const dy = touch.clientY - touchStartPosRef.current.y;
          if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
            onToggleControls();
          }
        }
        lastTouchDistanceRef.current = null;
        lastTouchCenterRef.current = null;
        touchStartPosRef.current = null;
        isDraggingRef.current = false;
      },
      [onToggleControls]
    );

    // Register passive: false event listeners (same as ImageCore)
    useEffect(() => {
      const el = wheelTouchContainerRef.current;
      if (!el) return;
      const onWheel = (e: WheelEvent) => {
        if (!isFocusedRef.current) return;
        e.preventDefault();
        handleWheel(e as unknown as React.WheelEvent);
      };
      const onTouchMove = (e: TouchEvent) => {
        handleTouchMove(e as unknown as React.TouchEvent);
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      el.addEventListener('touchmove', onTouchMove, { passive: false });
      return () => {
        el.removeEventListener('wheel', onWheel);
        el.removeEventListener('touchmove', onTouchMove);
      };
    }, [handleWheel, handleTouchMove]);

    // ── Imperative handle ──
    useImperativeHandle(
      ref,
      () => ({
        zoomIn,
        zoomOut,
        resetZoom,
        setZoom: setZoomLevel,
        getZoomLevel: () => zoom,
        getPan: () => ({ x: panX, y: panY }),
        nextPage,
        prevPage,
        goToPage,
        getCurrentPage: () => currentPage,
        getTotalPages: () => totalPages,
        isLoaded: () => docLoaded,
      }),
      [
        zoomIn,
        zoomOut,
        resetZoom,
        setZoomLevel,
        zoom,
        panX,
        panY,
        nextPage,
        prevPage,
        goToPage,
        currentPage,
        totalPages,
        docLoaded,
      ]
    );

    // ── Cleanup render task on unmount ──
    useEffect(() => {
      return () => {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // Already completed
          }
        }
      };
    }, []);

    // ── Fallback: <object> when pdf.js not available ──
    if (!isAvailable && src) {
      return <PdfFallback src={src} />;
    }

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
        ref={wheelTouchContainerRef}
        role="application"
        aria-label="PDF viewer"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: role="application" makes this interactive
        tabIndex={0}
        className="drop-player-pdf-container"
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onBlur={() => {
          isFocusedRef.current = false;
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor:
            zoom > 1
              ? isDraggingRef.current
                ? 'grabbing'
                : 'grab'
              : 'default',
          touchAction: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            transform:
              zoom !== 1 || panX !== 0 || panY !== 0
                ? `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`
                : undefined,
            transformOrigin: 'center center',
            transition: isDraggingRef.current
              ? 'none'
              : 'transform 0.1s ease-out',
            userSelect: 'none',
          }}
        />
      </div>
    );
  }
);

// ── Fallback component (browser built-in PDF viewer) ──
function PdfFallback({ src }: { src: string }) {
  // Auto-append #toolbar=0 to hide built-in PDF toolbar
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

  return (
    <div
      role="application"
      aria-label="PDF viewer"
      className="drop-player-pdf-container"
    >
      <object
        data={pdfSrc}
        type="application/pdf"
        width="100%"
        height="100%"
        onLoad={() => {}}
        aria-label="PDF document"
      />
    </div>
  );
}
