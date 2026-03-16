import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type {
  CaptureOptions,
  FrameCapture,
  ImageCoreProps,
  ImageCoreRef,
  ImageState,
} from '../types';

const DEFAULT_MIN_ZOOM = 1;
const DEFAULT_MAX_ZOOM = 5;
const DEFAULT_ZOOM_STEP = 0.25;

export const ImageCore = forwardRef<ImageCoreRef, ImageCoreProps>(
  function ImageCore(props, ref) {
    const {
      src,
      alt = '',
      crossOrigin = 'anonymous',
      minZoom = DEFAULT_MIN_ZOOM,
      maxZoom = DEFAULT_MAX_ZOOM,
      zoomStep = DEFAULT_ZOOM_STEP,
      containerRef,
      onStateChange,
      onError,
      onLoad,
      onFrameCapture,
      onFullscreenToggle,
    } = props;

    const imageRef = useRef<HTMLImageElement>(null);
    const wheelTouchContainerRef = useRef<HTMLDivElement>(null);
    const isFocusedRef = useRef(false);
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const panStartRef = useRef({ x: 0, y: 0 });

    const [zoom, setZoom] = useState(1);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [naturalWidth, setNaturalWidth] = useState(0);
    const [naturalHeight, setNaturalHeight] = useState(0);

    const clampZoom = useCallback(
      (z: number) => Math.max(minZoom, Math.min(maxZoom, z)),
      [minZoom, maxZoom]
    );

    const clampPan = useCallback(
      (x: number, y: number, currentZoom: number) => {
        const container = containerRef.current;
        const image = imageRef.current;
        if (!container || !image || currentZoom <= 1) {
          return { x: 0, y: 0 };
        }

        const containerRect = container.getBoundingClientRect();
        const scaledWidth = image.offsetWidth * currentZoom;
        const scaledHeight = image.offsetHeight * currentZoom;
        const maxPanX = Math.max(0, (scaledWidth - containerRect.width) / 2);
        const maxPanY = Math.max(0, (scaledHeight - containerRect.height) / 2);

        return {
          x: Math.max(-maxPanX, Math.min(maxPanX, x)),
          y: Math.max(-maxPanY, Math.min(maxPanY, y)),
        };
      },
      [containerRef]
    );

    useEffect(() => {
      const state: ImageState = {
        zoom,
        panX,
        panY,
        isLoaded,
        naturalWidth,
        naturalHeight,
      };
      onStateChange(state);
    }, [
      zoom,
      panX,
      panY,
      isLoaded,
      naturalWidth,
      naturalHeight,
      onStateChange,
    ]);

    useEffect(() => {
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setIsLoaded(false);

      const img = imageRef.current;
      if (img && src && img.complete && img.naturalWidth > 0) {
        setNaturalWidth(img.naturalWidth);
        setNaturalHeight(img.naturalHeight);
        setIsLoaded(true);
        onLoad?.();
      }
    }, [src, onLoad]);

    const handleLoad = useCallback(() => {
      const image = imageRef.current;
      if (image) {
        setNaturalWidth(image.naturalWidth);
        setNaturalHeight(image.naturalHeight);
        setIsLoaded(true);
        onLoad?.();
      }
    }, [onLoad]);

    const handleError = useCallback(() => {
      onError?.(new Error('Failed to load image'));
    }, [onError]);

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
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
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

    const lastTouchDistanceRef = useRef<number | null>(null);
    const lastTouchCenterRef = useRef<{ x: number; y: number } | null>(null);

    const handleTouchStart = useCallback(
      (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          const distance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          );
          lastTouchDistanceRef.current = distance;
          lastTouchCenterRef.current = {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2,
          };
        } else if (e.touches.length === 1 && zoom > 1) {
          isDraggingRef.current = true;
          dragStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
          panStartRef.current = { x: panX, y: panY };
        }
      },
      [zoom, panX, panY]
    );

    const handleTouchMove = useCallback(
      (e: React.TouchEvent) => {
        if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          const distance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
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
                (touch1.clientX + touch2.clientX) / 2 -
                rect.left -
                rect.width / 2;
              const centerY =
                (touch1.clientY + touch2.clientY) / 2 -
                rect.top -
                rect.height / 2;

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
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2,
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

    const handleTouchEnd = useCallback(() => {
      lastTouchDistanceRef.current = null;
      lastTouchCenterRef.current = null;
      isDraggingRef.current = false;
    }, []);

    useEffect(() => {
      const el = wheelTouchContainerRef.current;
      if (!el) return;
      /* passive: false required so preventDefault() works for wheel/touchmove */
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

    const lastCaptureRef = useRef<FrameCapture | null>(null);

    const captureFrame = useCallback(
      async (options?: CaptureOptions): Promise<FrameCapture> => {
        const image = imageRef.current;
        if (!image || !isLoaded) {
          throw new Error('Image not loaded');
        }

        const naturalWidth = image.naturalWidth;
        const naturalHeight = image.naturalHeight;
        const aspectRatio = naturalWidth / naturalHeight;
        let width = naturalWidth;
        let height = naturalHeight;
        if (options?.maxWidth && naturalWidth > options.maxWidth) {
          width = options.maxWidth;
          height = Math.round(width / aspectRatio);
        }

        const format = options?.format ?? 'image/png';
        const quality = options?.quality ?? 0.92;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }
        ctx.drawImage(image, 0, 0, width, height);
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (b) {
                resolve(b);
              } else {
                reject(new Error('Failed to create blob'));
              }
            },
            format,
            quality
          );
        });

        const capture: FrameCapture = {
          blob,
          time: 0,
          width,
          height,
          aspectRatio,
        };

        lastCaptureRef.current = capture;
        onFrameCapture?.(capture);

        return capture;
      },
      [isLoaded, onFrameCapture]
    );

    const saveCapture = useCallback(async () => {
      let capture = lastCaptureRef.current;
      if (!capture) {
        capture = await captureFrame();
      }

      const url = URL.createObjectURL(capture.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `capture-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, [captureFrame]);

    const copyCapture = useCallback(async () => {
      const capture = lastCaptureRef.current;
      if (!capture) {
        await captureFrame();
      }

      if (!navigator.clipboard?.write) {
        throw new Error('Clipboard API not supported');
      }
      const image = imageRef.current;
      if (!image) {
        throw new Error('Image not available');
      }

      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      ctx.drawImage(image, 0, 0);

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) {
            resolve(b);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png');
      });

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob }),
      ]);
    }, [captureFrame]);

    useImperativeHandle(
      ref,
      () => ({
        zoomIn,
        zoomOut,
        resetZoom,
        setZoom: setZoomLevel,
        getZoomLevel: () => zoom,
        getPan: () => ({ x: panX, y: panY }),
        isLoaded: () => isLoaded,
        captureFrame,
        saveCapture,
        copyCapture,
        getImageElement: () => imageRef.current,
      }),
      [
        zoomIn,
        zoomOut,
        resetZoom,
        setZoomLevel,
        zoom,
        panX,
        panY,
        isLoaded,
        captureFrame,
        saveCapture,
        copyCapture,
      ]
    );

    return (
      <div
        ref={wheelTouchContainerRef}
        role="application"
        aria-label="Image viewer"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: role="application" makes this interactive
        tabIndex={0}
        className="w-full h-full overflow-hidden flex items-center justify-center outline-none"
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
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          crossOrigin={crossOrigin}
          onLoad={handleLoad}
          onError={handleError}
          draggable={false}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
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
