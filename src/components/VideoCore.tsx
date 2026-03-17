import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useHls } from '../hooks/useHls';
import { useMediaPlayerState } from '../hooks/useMediaPlayerState';
import type {
  CaptureOptions,
  FallbackReason,
  FrameCapture,
  QualityLevel,
  VideoCoreProps,
  VideoCoreRef,
  VideoState,
} from '../types';

export const VideoCore = forwardRef<VideoCoreRef, VideoCoreProps>(
  function VideoCore(props, ref) {
    const {
      videoSources,
      activeSourceIndex,
      crossOrigin = 'anonymous',
      poster,
      autoPlay = false,
      initialLoop = false,
      initialMuted = false,
      initialVolume = 1,
      initialTime,
      frameRate = 30,
      storageKey,
      storage: storageAdapter,
      hlsConfig,
      containerRef,
      onStateChange,
      onPlay,
      onPause,
      onEnded,
      onTimeUpdate,
      onDurationChange,
      onVolumeChange,
      onPlaybackRateChange,
      onError,
      onLoadedMetadata,
      onLoadStart,
      onProgress,
      onWaiting,
      onCanPlay,
      onPlaying,
      onSeekStart,
      onSeeking,
      onSeekEnd,
      onFrameCapture,
      onQualityLevelChange,
      onFallback,
      onFullscreenToggle,
    } = props;

    const videoRef = useRef<HTMLVideoElement>(null);
    const ambientCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const ambientCtxRef = useRef<CanvasRenderingContext2D | null>(null);

    const isDraggingToSeekRef = useRef(false);
    const dragStartXRef = useRef(0);
    const dragStartTimeRef = useRef(0);
    const hasDraggedRef = useRef(false);
    const dragWasPlayingRef = useRef(false);
    const lastTouchEndTimeRef = useRef(0);

    const {
      state,
      handlers,
      storage,
      setSeeking,
      setCurrentTime,
      setSeekValue,
      setInitialPositionForNextLoad,
      getImperativeBase,
    } = useMediaPlayerState(videoRef, {
      storageKey,
      storage: storageAdapter,
      initialVolume,
      initialMuted,
      initialLoop,
      initialTime,
      onPlay,
      onPause,
      onEnded,
      onTimeUpdate,
      onDurationChange,
      onVolumeChange,
      onError,
      onLoadStart,
      onCanPlay,
      onSeekStart,
      onSeeking,
      onSeekEnd,
      onPlaying,
    });

    const {
      currentTime,
      duration,
      volume,
      isMuted,
      isPlaying,
      isEnded,
      isLoop,
      isSeeking,
      seekValue,
    } = state;

    const [isAmbientLight, setIsAmbientLight] = useState(() =>
      storage.getStoredValue('ambient_light', false)
    );
    const [ambientColor, setAmbientColor] = useState({ r: 40, g: 40, b: 40 });
    const [qualityLevel, setQualityLevel] = useState<
      QualityLevel | undefined
    >();
    const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);

    const activeEntry = videoSources[activeSourceIndex];
    const isHlsSource = activeEntry?.sourceType === 'hls';
    const hlsUrl =
      isHlsSource && !isPlayingOriginal ? (activeEntry?.url ?? null) : null;
    const currentSrc = isPlayingOriginal
      ? (activeEntry?.originalUrl ?? activeEntry?.url ?? null)
      : (activeEntry?.url ?? null);

    const handleHlsQualityChange = useCallback(
      (level: QualityLevel) => {
        setQualityLevel(level);
        onQualityLevelChange?.(level);
      },
      [onQualityLevelChange]
    );

    const handleFallbackToOriginal = useCallback(
      (reason: FallbackReason) => {
        if (activeEntry?.originalUrl) {
          const video = videoRef.current;
          if (video) {
            setInitialPositionForNextLoad(video.currentTime, !video.paused);
          }
          setIsPlayingOriginal(true);
          onFallback?.({ sourceIndex: activeSourceIndex, reason });
        }
      },
      [
        activeEntry?.originalUrl,
        activeSourceIndex,
        onFallback,
        setInitialPositionForNextLoad,
      ]
    );

    const {
      hlsLevels,
      currentHlsLevel,
      setQualityLevel: setHlsQualityLevel,
    } = useHls({
      hlsUrl,
      videoElement: videoRef.current,
      originalUrl: activeEntry?.originalUrl,
      enabled: isHlsSource && !isPlayingOriginal,
      hlsConfig,
      onFallbackToOriginal: handleFallbackToOriginal,
      onQualityLevelChange: handleHlsQualityChange,
      onError: (error) => {
        onError?.(error);
      },
    });

    const hlsLevelInfos = useMemo(
      () =>
        hlsLevels.map((level) => ({
          height: level.height,
          bitrate: level.bitrate,
        })),
      [hlsLevels]
    );

    useEffect(() => {
      const stateSnapshot: VideoState = {
        isPlaying,
        isPaused: !isPlaying,
        isEnded,
        currentTime,
        duration,
        volume,
        isMuted,
        isSeeking,
        seekValue,
        isLoop,
        isAmbientLight,
        ambientColor,
        isPlayingOriginal,
        qualityLevel,
        hlsLevels: hlsLevelInfos,
        currentHlsLevel,
      };
      onStateChange(stateSnapshot);
    }, [
      isPlaying,
      isEnded,
      currentTime,
      duration,
      volume,
      isMuted,
      isSeeking,
      seekValue,
      isLoop,
      isAmbientLight,
      ambientColor,
      isPlayingOriginal,
      qualityLevel,
      hlsLevelInfos,
      currentHlsLevel,
      onStateChange,
    ]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !currentSrc) return;

      if (isPlayingOriginal || !isHlsSource) {
        video.src = currentSrc;
      } else if (
        isHlsSource &&
        video.canPlayType('application/vnd.apple.mpegurl')
      ) {
        video.src = currentSrc;
      }
    }, [currentSrc, isPlayingOriginal, isHlsSource]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handleLoadedMetadata = () => {
        onLoadedMetadata?.({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          aspectRatio: video.videoWidth / video.videoHeight,
        });
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }, [onLoadedMetadata]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handlers = {
        ratechange: () => {
          onPlaybackRateChange?.(video.playbackRate);
        },
        progress: () => {
          onProgress?.(video.buffered);
        },
        waiting: () => {
          onWaiting?.();
        },
      };

      for (const [event, handler] of Object.entries(handlers)) {
        video.addEventListener(event, handler);
      }
      return () => {
        for (const [event, handler] of Object.entries(handlers)) {
          video.removeEventListener(event, handler);
        }
      };
    }, [onPlaybackRateChange, onProgress, onWaiting]);

    useEffect(() => {
      if (!isAmbientLight) return;

      const video = videoRef.current;
      if (!video) return;

      if (!ambientCanvasRef.current) {
        ambientCanvasRef.current = document.createElement('canvas');
        ambientCtxRef.current = ambientCanvasRef.current.getContext('2d', {
          willReadFrequently: true,
        });
      }

      const canvas = ambientCanvasRef.current;
      const ctx = ambientCtxRef.current;
      if (!ctx) return;

      let rafId: number;
      let lastUpdate = 0;
      const UPDATE_INTERVAL = 100;

      const updateAmbientColor = (timestamp: number) => {
        if (timestamp - lastUpdate >= UPDATE_INTERVAL) {
          lastUpdate = timestamp;

          if (video.videoWidth > 0 && video.videoHeight > 0 && !video.paused) {
            const scale = 0.1;
            canvas.width = Math.floor(video.videoWidth * scale);
            canvas.height = Math.floor(video.videoHeight * scale);

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            try {
              const data = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              ).data;
              let r = 0;
              let g = 0;
              let b = 0;

              const step = 16;
              let sampleCount = 0;
              for (let i = 0; i < data.length; i += step) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                sampleCount++;
              }

              if (sampleCount > 0) {
                const minBrightness = 40;
                setAmbientColor({
                  r: Math.max(minBrightness, Math.floor(r / sampleCount)),
                  g: Math.max(minBrightness, Math.floor(g / sampleCount)),
                  b: Math.max(minBrightness, Math.floor(b / sampleCount)),
                });
              }
            } catch (err) {
              const error =
                err instanceof Error
                  ? err
                  : new Error('Failed to sample ambient color');
              onError?.(error);
              setIsAmbientLight(false);
            }
          }
        }

        rafId = requestAnimationFrame(updateAmbientColor);
      };

      rafId = requestAnimationFrame(updateAmbientColor);

      return () => {
        cancelAnimationFrame(rafId);
      };
    }, [isAmbientLight, onError]);

    const handleVideoMouseDown = useCallback(
      (e: React.MouseEvent<HTMLVideoElement>) => {
        if (Date.now() - lastTouchEndTimeRef.current < 500) return;

        const video = videoRef.current;
        if (!video || !duration) return;

        if (e.button !== 0) return;

        isDraggingToSeekRef.current = true;
        dragStartXRef.current = e.clientX;
        dragStartTimeRef.current = video.currentTime;
        hasDraggedRef.current = false;

        e.preventDefault();
      },
      [duration]
    );

    const handleVideoTouchStart = useCallback(
      (e: React.TouchEvent<HTMLVideoElement>) => {
        const video = videoRef.current;
        if (!video || !duration) return;

        const touch = e.touches[0];
        if (!touch) return;

        isDraggingToSeekRef.current = true;
        dragStartXRef.current = touch.clientX;
        dragStartTimeRef.current = video.currentTime;
        hasDraggedRef.current = false;
      },
      [duration]
    );

    const handleContainerMouseMove = useCallback(
      (e: React.MouseEvent<HTMLElement>) => {
        if (!isDraggingToSeekRef.current) return;

        const video = videoRef.current;
        const container = containerRef.current;
        if (!video || !container || !duration) return;

        const deltaX = e.clientX - dragStartXRef.current;
        const containerWidth = container.clientWidth;

        if (Math.abs(deltaX) > 5 && !hasDraggedRef.current) {
          hasDraggedRef.current = true;
          dragWasPlayingRef.current = !video.paused;
          video.pause();
          setSeeking(true);
          setSeekValue(video.currentTime);
        }

        if (hasDraggedRef.current) {
          const seekDelta = (deltaX / containerWidth) * duration;
          const newTime = Math.max(
            0,
            Math.min(duration, dragStartTimeRef.current + seekDelta)
          );

          setSeekValue(newTime);
          video.currentTime = newTime;
          setCurrentTime(newTime);
        }
      },
      [duration, containerRef, setSeeking, setSeekValue, setCurrentTime]
    );

    const handleContainerTouchMove = useCallback(
      (e: React.TouchEvent<HTMLElement>) => {
        if (!isDraggingToSeekRef.current) return;

        const touch = e.touches[0];
        if (!touch) return;

        const video = videoRef.current;
        const container = containerRef.current;
        if (!video || !container || !duration) return;

        const deltaX = touch.clientX - dragStartXRef.current;
        const containerWidth = container.clientWidth;

        if (Math.abs(deltaX) > 10 && !hasDraggedRef.current) {
          hasDraggedRef.current = true;
          dragWasPlayingRef.current = !video.paused;
          video.pause();
          setSeeking(true);
          setSeekValue(video.currentTime);
          e.preventDefault();
        }

        if (hasDraggedRef.current) {
          const seekDelta = (deltaX / containerWidth) * duration;
          const newTime = Math.max(
            0,
            Math.min(duration, dragStartTimeRef.current + seekDelta)
          );

          setSeekValue(newTime);
          video.currentTime = newTime;
          setCurrentTime(newTime);
          e.preventDefault();
        }
      },
      [duration, containerRef, setSeeking, setSeekValue, setCurrentTime]
    );

    useEffect(() => {
      const handleGlobalMouseUp = (e: MouseEvent) => {
        if (isDraggingToSeekRef.current) {
          const container = containerRef.current;
          const isInsideContainer =
            !!container && container.contains(e.target as Node);

          if (isInsideContainer && !hasDraggedRef.current) {
            handlers.togglePlayPause();
          } else if (hasDraggedRef.current) {
            const video = videoRef.current;
            const finalTime = video?.currentTime ?? 0;

            setSeeking(false);
            onSeekEnd?.(finalTime);

            if (dragWasPlayingRef.current) {
              video?.play().catch((error) => {
                onError?.(
                  error instanceof Error ? error : new Error(String(error))
                );
              });
            }
          }
          isDraggingToSeekRef.current = false;
          hasDraggedRef.current = false;
        }
      };

      const handleGlobalTouchEnd = (e: TouchEvent) => {
        lastTouchEndTimeRef.current = Date.now();

        if (isDraggingToSeekRef.current) {
          const container = containerRef.current;
          const touch = e.changedTouches[0];
          const targetElement = touch
            ? document.elementFromPoint(touch.clientX, touch.clientY)
            : null;
          const isInsideContainer =
            !!container && !!targetElement && container.contains(targetElement);

          if (isInsideContainer && !hasDraggedRef.current) {
            handlers.togglePlayPause();
          } else if (hasDraggedRef.current) {
            const video = videoRef.current;
            const finalTime = video?.currentTime ?? 0;

            setSeeking(false);
            onSeekEnd?.(finalTime);

            if (dragWasPlayingRef.current) {
              video?.play().catch((error) => {
                onError?.(
                  error instanceof Error ? error : new Error(String(error))
                );
              });
            }
          }
          isDraggingToSeekRef.current = false;
          hasDraggedRef.current = false;
        }
      };

      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchend', handleGlobalTouchEnd);
      document.addEventListener('touchcancel', handleGlobalTouchEnd);
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('touchend', handleGlobalTouchEnd);
        document.removeEventListener('touchcancel', handleGlobalTouchEnd);
      };
    }, [handlers, setSeeking, onError, onSeekEnd, containerRef]);

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent<HTMLVideoElement>) => {
        e.preventDefault();
        onFullscreenToggle?.();
      },
      [onFullscreenToggle]
    );

    const handleAmbientLightToggle = useCallback(() => {
      const newAmbient = !isAmbientLight;
      setIsAmbientLight(newAmbient);
      storage.setStoredValue('ambient_light', newAmbient);
    }, [isAmbientLight, storage]);

    const handleSetPlayOriginal = useCallback(
      (playing: boolean) => {
        const video = videoRef.current;
        if (video) {
          setInitialPositionForNextLoad(video.currentTime, !video.paused);
        }
        setIsPlayingOriginal(playing);
        if (!playing) {
          setQualityLevel(undefined);
        }
      },
      [setInitialPositionForNextLoad]
    );

    const handleQualityChangeFromUI = useCallback(
      (level: number | 'auto') => {
        setHlsQualityLevel(level);
      },
      [setHlsQualityLevel]
    );

    const captureFrame = useCallback(
      async (options?: CaptureOptions): Promise<FrameCapture> => {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
          throw new Error('Video not ready for capture');
        }

        const maxWidth = options?.maxWidth ?? 1920;
        const format = options?.format ?? 'image/png';
        const quality = options?.quality ?? 0.92;

        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const longSide = Math.max(videoWidth, videoHeight);
        const scale = Math.min(1, maxWidth / longSide);

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(videoWidth * scale);
        canvas.height = Math.round(videoHeight * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
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
          time: video.currentTime,
          width: canvas.width,
          height: canvas.height,
          aspectRatio: canvas.width / canvas.height,
        };

        onFrameCapture?.(capture);
        return capture;
      },
      [onFrameCapture]
    );

    const handleSaveCapture = useCallback(async () => {
      try {
        const capture = await captureFrame();
        const url = URL.createObjectURL(capture.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `capture_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        const captureError =
          error instanceof Error ? error : new Error('Failed to save capture');
        onError?.(captureError);
        throw captureError;
      }
    }, [captureFrame, onError]);

    const handleCopyCapture = useCallback(async () => {
      try {
        const capture = await captureFrame();
        if (!navigator.clipboard?.write) {
          const error = new Error('Clipboard API not supported');
          onError?.(error);
          throw error;
        }

        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': capture.blob,
          }),
        ]);
      } catch (error) {
        const copyError =
          error instanceof Error
            ? error
            : new Error('Failed to copy capture to clipboard');
        onError?.(copyError);
        throw copyError;
      }
    }, [captureFrame, onError]);

    useImperativeHandle(
      ref,
      () => ({
        ...getImperativeBase(),
        seekToFrame: (frame: number) => {
          if (videoRef.current) {
            const time = frame / frameRate;
            videoRef.current.currentTime = time;
            setCurrentTime(time);
          }
        },
        getPlaybackRate: () => videoRef.current?.playbackRate ?? 1,
        setPlaybackRate: (rate: number) => {
          if (videoRef.current) {
            videoRef.current.playbackRate = rate;
          }
        },
        toggleAmbientLight: handleAmbientLightToggle,
        setPlayOriginal: handleSetPlayOriginal,
        setQualityLevel: handleQualityChangeFromUI,
        captureFrame,
        saveCapture: handleSaveCapture,
        copyCapture: handleCopyCapture,
        getVideoElement: () => videoRef.current,
      }),
      [
        getImperativeBase,
        frameRate,
        setCurrentTime,
        handleAmbientLightToggle,
        handleSetPlayOriginal,
        handleQualityChangeFromUI,
        captureFrame,
        handleSaveCapture,
        handleCopyCapture,
      ]
    );

    return (
      <video
        ref={videoRef}
        className="drop-player-video"
        crossOrigin={crossOrigin}
        playsInline
        poster={poster}
        autoPlay={autoPlay}
        muted={initialMuted}
        onMouseDown={handleVideoMouseDown}
        onDoubleClick={handleDoubleClick}
        onMouseMove={handleContainerMouseMove}
        onTouchStart={handleVideoTouchStart}
        onTouchMove={handleContainerTouchMove}
        onContextMenu={(e) => e.preventDefault()}
        style={{ outline: 'none' }}
      >
        <track kind="captions" />
      </video>
    );
  }
);
