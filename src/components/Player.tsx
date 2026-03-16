import { AlertCircle } from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { resolveFeatures } from '../features';
import { useFullscreen } from '../hooks/useFullscreen';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { usePlayerStorage } from '../hooks/usePlayerStorage';
import { usePlayerTranslation } from '../i18n';
import type {
  AudioCoreRef,
  AudioState,
  CaptureOptions,
  FrameCapture,
  ImageCoreRef,
  ImageState,
  PdfState,
  PlayerProps,
  PlayerRef,
  PlayerState,
  TranslationKey,
  VideoCoreRef,
  VideoState,
} from '../types';

// Defaults applied when groups are omitted
const PLAYBACK_DEFAULTS = {
  autoPlay: false,
  loop: false,
  muted: false,
  volume: 1,
  initialTime: undefined,
  persistenceKey: undefined,
} as const;

const UI_DEFAULTS = {
  showControls: true,
  showTitle: undefined,
  features: undefined,
  locale: 'en' as const,
  frameRate: 30,
};
import { normalizeSources } from '../utils/sources';
import { AudioCore } from './AudioCore';
import { ControlsBar } from './ControlsBar';
import { SeekBar } from './controls/SeekBar';
import { SourceSelector } from './controls/SourceSelector';
import type { TimeDisplayFormat } from './controls/TimeDisplay';
import { getNextTimeDisplayFormat } from './controls/TimeDisplay';
import { ImageCore } from './ImageCore';
import { PdfCore } from './PdfCore';
import { VideoCore } from './VideoCore';

import '../styles.css';

const DEFAULT_MIN_ZOOM = 1;
const DEFAULT_MAX_ZOOM = 5;

export const Player = forwardRef<PlayerRef, PlayerProps>(
  function Player(props, ref) {
    const { sources, className, crossOrigin = 'anonymous', poster, slots } =
      props;

    // -- Playback group --
    const {
      autoPlay = PLAYBACK_DEFAULTS.autoPlay,
      loop: initialLoop = PLAYBACK_DEFAULTS.loop,
      muted: initialMuted = PLAYBACK_DEFAULTS.muted,
      volume: initialVolume = PLAYBACK_DEFAULTS.volume,
      initialTime,
      persistenceKey,
    } = props.playback ?? {};

    // -- UI group --
    const {
      showControls: showControlsProp = UI_DEFAULTS.showControls,
      showTitle: showTitleProp,
      features: featuresProp,
      locale = UI_DEFAULTS.locale,
      frameRate = UI_DEFAULTS.frameRate,
      markers = [],
    } = props.ui ?? {};

    // -- Events group --
    const {
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
      onFullscreenChange,
      onFrameCapture,
      onPositionSave,
      onPositionRestore,
      onActiveSourceChange,
      onQualityLevelChange,
      onFallback,
      onStateChange,
    } = props.events ?? {};

    const features = useMemo(
      () => resolveFeatures(featuresProp),
      [featuresProp]
    );

    const containerRef = useRef<HTMLDivElement>(null);
    const videoCoreRef = useRef<VideoCoreRef>(null);
    const imageCoreRef = useRef<ImageCoreRef>(null);
    const audioCoreRef = useRef<AudioCoreRef>(null);

    const normalized = useMemo(() => normalizeSources(sources), [sources]);

    const { mediaMode, entries } = normalized;
    const hasSource = entries.length > 0;

    const [activeSourceIndex, setActiveSourceIndex] = useState(0);

    // biome-ignore lint/correctness/useExhaustiveDependencies: reset index when entries change
    useEffect(() => {
      setActiveSourceIndex(0);
    }, [entries]);

    const activeEntry = entries[activeSourceIndex];

    const [lastError, setLastError] = useState<Error | null>(null);

    // biome-ignore lint/correctness/useExhaustiveDependencies: reset error when source changes
    useEffect(() => {
      setLastError(null);
    }, [entries, activeSourceIndex]);

    const handleError = useCallback(
      (error: Error) => {
        setLastError(error);
        onError?.(error);
      },
      [onError]
    );

    const { t } = usePlayerTranslation(locale);

    const [imageState, setImageState] = useState<ImageState>({
      zoom: 1,
      panX: 0,
      panY: 0,
      isLoaded: false,
      naturalWidth: 0,
      naturalHeight: 0,
    });

    const [pdfState, setPdfState] = useState<PdfState>({
      zoom: 1,
      panX: 0,
      panY: 0,
      isLoaded: false,
    });

    const [audioState, setAudioState] = useState<AudioState>({
      isPlaying: false,
      isPaused: true,
      isEnded: false,
      currentTime: 0,
      duration: 0,
      volume: initialVolume,
      isMuted: initialMuted,
      isSeeking: false,
      seekValue: 0,
      isLoop: initialLoop,
      waveformReady: false,
      waveformFailedFallback: false,
    });

    const [videoState, setVideoState] = useState<VideoState>({
      isPlaying: false,
      isPaused: true,
      isEnded: false,
      currentTime: 0,
      duration: 0,
      volume: initialVolume,
      isMuted: initialMuted,
      isSeeking: false,
      seekValue: 0,
      isLoop: initialLoop,
      isAmbientLight: false,
      ambientColor: { r: 40, g: 40, b: 40 },
      isPlayingOriginal: false,
      qualityLevel: undefined,
      hlsLevels: [],
      currentHlsLevel: -1,
    });

    const [controlsVisible, setControlsVisible] = useState(true);
    const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

    const showTitle = showTitleProp !== undefined ? showTitleProp : hasSource;

    const globalStorage = usePlayerStorage();

    const showFrameFormat = mediaMode === 'video';
    const [timeDisplayFormat, setTimeDisplayFormat] =
      useState<TimeDisplayFormat>('elapsed-total');

    const formatRestoredRef = useRef(false);
    useEffect(() => {
      if (formatRestoredRef.current) return;
      formatRestoredRef.current = true;
      const stored = globalStorage.getStoredValue<TimeDisplayFormat>(
        'time_display_format',
        'elapsed-total'
      );
      if (stored === 'elapsed-total') return;
      const resolved =
        stored === 'frames' && !showFrameFormat
          ? getNextTimeDisplayFormat(stored, showFrameFormat)
          : stored;
      if (resolved !== 'elapsed-total') {
        setTimeDisplayFormat(resolved);
      }
    }, [globalStorage, showFrameFormat]);

    useEffect(() => {
      if (timeDisplayFormat === 'frames' && !showFrameFormat) {
        setTimeDisplayFormat(
          getNextTimeDisplayFormat(timeDisplayFormat, showFrameFormat)
        );
      }
    }, [showFrameFormat, timeDisplayFormat]);

    const handleTimeDisplayFormatChange = useCallback(
      (format: TimeDisplayFormat) => {
        setTimeDisplayFormat(format);
        globalStorage.setStoredValue('time_display_format', format);
      },
      [globalStorage]
    );

    const mediaElement =
      mediaMode === 'video'
        ? (videoCoreRef.current?.getVideoElement() ?? null)
        : mediaMode === 'audio'
          ? (audioCoreRef.current?.getAudioElement() ?? null)
          : null;

    const {
      isFullscreen,
      toggleFullscreen,
      requestFullscreen,
      exitFullscreen,
    } = useFullscreen({
      containerElement: containerRef.current,
      videoElement:
        mediaMode === 'video'
          ? (videoCoreRef.current?.getVideoElement() ?? null)
          : null,
      onFullscreenChange,
    });
    const { handleKeyDown } = useKeyboardShortcuts({
      mediaElement,
      containerElement: containerRef.current,
      frameRate: mediaMode === 'audio' ? 1 : frameRate,
      onVolumeChange: (vol) => {
        if (mediaMode === 'video') videoCoreRef.current?.setVolume(vol);
        else if (mediaMode === 'audio') audioCoreRef.current?.setVolume(vol);
      },
      onMuteToggle: () => {
        if (mediaMode === 'video') videoCoreRef.current?.toggleMute();
        else if (mediaMode === 'audio') audioCoreRef.current?.toggleMute();
      },
      toggleFullscreen,
      onPlayError: (error) => {
        handleError(error instanceof Error ? error : new Error(String(error)));
      },
    });

    const isEnded =
      mediaMode === 'video'
        ? videoState.isEnded
        : mediaMode === 'audio'
          ? audioState.isEnded
          : true;

    const resetHideControlsTimer = useCallback(() => {
      setControlsVisible(true);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      if (!isEnded) {
        hideControlsTimeoutRef.current = setTimeout(() => {
          setControlsVisible(false);
        }, 3000);
      }
    }, [isEnded]);

    const handleMouseLeave = useCallback(() => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      if (!isEnded) {
        setControlsVisible(false);
      }
    }, [isEnded]);

    useEffect(() => {
      if (isEnded) {
        setControlsVisible(true);
        if (hideControlsTimeoutRef.current) {
          clearTimeout(hideControlsTimeoutRef.current);
        }
      }
    }, [isEnded]);

    useEffect(() => {
      return () => {
        if (hideControlsTimeoutRef.current) {
          clearTimeout(hideControlsTimeoutRef.current);
        }
      };
    }, []);

    const handleVideoStateChange = useCallback((state: VideoState) => {
      setVideoState(state);
    }, []);

    const handleImageStateChange = useCallback((state: ImageState) => {
      setImageState(state);
    }, []);

    const handlePdfStateChange = useCallback((state: PdfState) => {
      setPdfState(state);
    }, []);

    const handleAudioStateChange = useCallback((state: AudioState) => {
      setAudioState(state);
    }, []);

    const handleSourceChange = useCallback(
      (index: number) => {
        setActiveSourceIndex(index);
        onActiveSourceChange?.(index);
      },
      [onActiveSourceChange]
    );

    const handleZoomIn = useCallback(() => {
      if (mediaMode === 'image') imageCoreRef.current?.zoomIn();
    }, [mediaMode]);

    const handleZoomOut = useCallback(() => {
      if (mediaMode === 'image') imageCoreRef.current?.zoomOut();
    }, [mediaMode]);

    const handleResetZoom = useCallback(() => {
      if (mediaMode === 'image') imageCoreRef.current?.resetZoom();
    }, [mediaMode]);

    const handlePlayToggle = useCallback(() => {
      switch (mediaMode) {
        case 'video':
          videoCoreRef.current?.toggle();
          break;
        case 'audio':
          audioCoreRef.current?.toggle();
          break;
        case 'image':
        case 'pdf':
          break;
      }
    }, [mediaMode]);

    const handleSeekStart = useCallback(() => {
      switch (mediaMode) {
        case 'video':
          videoCoreRef.current?.handleSeekStart();
          break;
        case 'audio':
          audioCoreRef.current?.handleSeekStart();
          break;
        case 'image':
        case 'pdf':
          break;
      }
    }, [mediaMode]);

    const handleSeekChange = useCallback(
      (time: number) => {
        switch (mediaMode) {
          case 'video':
            videoCoreRef.current?.handleSeekChange(time);
            break;
          case 'audio':
            audioCoreRef.current?.handleSeekChange(time);
            break;
          case 'image':
          case 'pdf':
            break;
        }
      },
      [mediaMode]
    );

    const handleSeekEnd = useCallback(
      (time: number) => {
        switch (mediaMode) {
          case 'video':
            videoCoreRef.current?.handleSeekEnd(time);
            break;
          case 'audio':
            audioCoreRef.current?.handleSeekEnd(time);
            break;
          case 'image':
          case 'pdf':
            break;
        }
      },
      [mediaMode]
    );

    const handleVolumeChange = useCallback(
      (newVolume: number) => {
        switch (mediaMode) {
          case 'video':
            videoCoreRef.current?.setVolume(newVolume);
            break;
          case 'audio':
            audioCoreRef.current?.setVolume(newVolume);
            break;
          case 'image':
          case 'pdf':
            break;
        }
      },
      [mediaMode]
    );

    const handleMuteToggle = useCallback(() => {
      switch (mediaMode) {
        case 'video':
          videoCoreRef.current?.toggleMute();
          break;
        case 'audio':
          audioCoreRef.current?.toggleMute();
          break;
        case 'image':
        case 'pdf':
          break;
      }
    }, [mediaMode]);

    const handleLoopToggle = useCallback(() => {
      switch (mediaMode) {
        case 'video':
          videoCoreRef.current?.toggleLoop();
          break;
        case 'audio':
          audioCoreRef.current?.toggleLoop();
          break;
        case 'image':
        case 'pdf':
          break;
      }
    }, [mediaMode]);

    const handleAmbientLightToggle = useCallback(() => {
      videoCoreRef.current?.toggleAmbientLight();
    }, []);

    const handleQualityChangeFromUI = useCallback(
      (level: number | 'auto' | 'original') => {
        if (level === 'original') {
          videoCoreRef.current?.setPlayOriginal(true);
        } else {
          videoCoreRef.current?.setPlayOriginal(false);
          videoCoreRef.current?.setQualityLevel(level);
        }
      },
      []
    );

    const handleSaveCapture = useCallback(async () => {
      if (mediaMode === 'video') {
        videoCoreRef.current?.pause();
        await videoCoreRef.current?.saveCapture();
      } else if (mediaMode === 'image') {
        await imageCoreRef.current?.saveCapture();
      }
    }, [mediaMode]);

    const handleCopyCapture = useCallback(async () => {
      if (mediaMode === 'video') {
        videoCoreRef.current?.pause();
        await videoCoreRef.current?.copyCapture();
      } else if (mediaMode === 'image') {
        await imageCoreRef.current?.copyCapture();
      }
    }, [mediaMode]);

    useImperativeHandle(
      ref,
      () => ({
        play: async () => {
          switch (mediaMode) {
            case 'video':
              await videoCoreRef.current?.play();
              break;
            case 'audio':
              await audioCoreRef.current?.play();
              break;
            case 'image':
            case 'pdf':
              break;
          }
        },
        pause: () => {
          switch (mediaMode) {
            case 'video':
              videoCoreRef.current?.pause();
              break;
            case 'audio':
              audioCoreRef.current?.pause();
              break;
            case 'image':
            case 'pdf':
              break;
          }
        },
        toggle: () => {
          switch (mediaMode) {
            case 'video':
              videoCoreRef.current?.toggle();
              break;
            case 'audio':
              audioCoreRef.current?.toggle();
              break;
            case 'image':
            case 'pdf':
              break;
          }
        },
        seek: (time: number) => {
          switch (mediaMode) {
            case 'video':
              videoCoreRef.current?.seek(time);
              break;
            case 'audio':
              audioCoreRef.current?.seek(time);
              break;
            case 'image':
            case 'pdf':
              break;
          }
        },
        seekRelative: (delta: number) => {
          switch (mediaMode) {
            case 'video':
              videoCoreRef.current?.seekRelative(delta);
              break;
            case 'audio':
              audioCoreRef.current?.seekRelative(delta);
              break;
            case 'image':
            case 'pdf':
              break;
          }
        },
        seekToFrame: (frame: number) => {
          videoCoreRef.current?.seekToFrame(frame);
        },
        getCurrentTime: () => {
          switch (mediaMode) {
            case 'video':
              return videoCoreRef.current?.getCurrentTime() ?? 0;
            case 'audio':
              return audioCoreRef.current?.getCurrentTime() ?? 0;
            case 'image':
            case 'pdf':
              return 0;
          }
        },
        getDuration: () => {
          switch (mediaMode) {
            case 'video':
              return videoCoreRef.current?.getDuration() ?? 0;
            case 'audio':
              return audioCoreRef.current?.getDuration() ?? 0;
            case 'image':
            case 'pdf':
              return 0;
          }
        },
        getVolume: () => {
          switch (mediaMode) {
            case 'video':
              return videoCoreRef.current?.getVolume() ?? videoState.volume;
            case 'audio':
              return audioCoreRef.current?.getVolume() ?? audioState.volume;
            case 'image':
            case 'pdf':
              return 1;
          }
        },
        isMuted: () => {
          switch (mediaMode) {
            case 'video':
              return videoCoreRef.current?.isMuted() ?? videoState.isMuted;
            case 'audio':
              return audioCoreRef.current?.isMuted() ?? audioState.isMuted;
            case 'image':
            case 'pdf':
              return false;
          }
        },
        isPaused: () => {
          switch (mediaMode) {
            case 'video':
              return videoCoreRef.current?.isPaused() ?? true;
            case 'audio':
              return audioCoreRef.current?.isPaused() ?? true;
            case 'image':
            case 'pdf':
              return true;
          }
        },
        isFullscreen: () => isFullscreen,
        getPlaybackRate: () => videoCoreRef.current?.getPlaybackRate() ?? 1,
        setVolume: handleVolumeChange,
        setMuted: (muted: boolean) => {
          switch (mediaMode) {
            case 'video':
              videoCoreRef.current?.setMuted(muted);
              break;
            case 'audio':
              audioCoreRef.current?.setMuted(muted);
              break;
            case 'image':
            case 'pdf':
              break;
          }
        },
        setPlaybackRate: (rate: number) => {
          videoCoreRef.current?.setPlaybackRate(rate);
        },
        captureFrame: async (
          options?: CaptureOptions
        ): Promise<FrameCapture> => {
          switch (mediaMode) {
            case 'video': {
              const result = await videoCoreRef.current?.captureFrame(options);
              if (!result) {
                throw new Error('VideoCore not available');
              }
              return result;
            }
            case 'image': {
              const result = await imageCoreRef.current?.captureFrame(options);
              if (!result) {
                throw new Error('ImageCore not available');
              }
              return result;
            }
            case 'audio':
            case 'pdf':
              throw new Error(`Frame capture not supported for ${mediaMode}`);
          }
        },
        requestFullscreen: async () => {
          const result = await requestFullscreen();
          if (!result.success && result.error) {
            handleError(result.error);
            throw result.error;
          }
        },
        exitFullscreen: async () => {
          const result = await exitFullscreen();
          if (!result.success && result.error) {
            handleError(result.error);
            throw result.error;
          }
        },
        toggleFullscreen,
        getVideoElement: () => videoCoreRef.current?.getVideoElement() ?? null,
        getContainerElement: () => containerRef.current,
      }),
      [
        videoState.volume,
        videoState.isMuted,
        audioState.volume,
        audioState.isMuted,
        isFullscreen,
        handleVolumeChange,
        requestFullscreen,
        exitFullscreen,
        toggleFullscreen,
        handleError,
        mediaMode,
      ]
    );

    const playerState = useMemo<PlayerState>(() => {
      switch (mediaMode) {
        case 'video':
          return {
            isPlaying: videoState.isPlaying,
            isPaused: videoState.isPaused,
            isEnded: videoState.isEnded,
            currentTime: videoState.currentTime,
            duration: videoState.duration,
            volume: videoState.volume,
            isMuted: videoState.isMuted,
            isFullscreen,
            showControls: controlsVisible,
            activeSourceIndex,
            sourceCount: entries.length,
            qualityLevel: videoState.qualityLevel,
          };
        case 'audio':
          return {
            isPlaying: audioState.isPlaying,
            isPaused: audioState.isPaused,
            isEnded: audioState.isEnded,
            currentTime: audioState.currentTime,
            duration: audioState.duration,
            volume: audioState.volume,
            isMuted: audioState.isMuted,
            isFullscreen,
            showControls: controlsVisible,
            activeSourceIndex,
            sourceCount: entries.length,
            qualityLevel: undefined,
          };
        case 'image':
        case 'pdf':
          return {
            isPlaying: false,
            isPaused: true,
            isEnded: false,
            currentTime: 0,
            duration: 0,
            volume: 1,
            isMuted: false,
            isFullscreen,
            showControls: controlsVisible,
            activeSourceIndex,
            sourceCount: entries.length,
            qualityLevel: undefined,
          };
      }
    }, [
      mediaMode,
      videoState,
      audioState,
      isFullscreen,
      controlsVisible,
      activeSourceIndex,
      entries.length,
    ]);

    useEffect(() => {
      onStateChange?.(playerState);
    }, [playerState, onStateChange]);

    const isReady = (() => {
      switch (mediaMode) {
        case 'video':
          return videoState.duration > 0;
        case 'image':
          return imageState.isLoaded;
        case 'pdf':
          return pdfState.isLoaded;
        case 'audio':
          return (
            audioState.waveformReady ||
            audioState.duration > 0 ||
            audioState.waveformFailedFallback
          );
      }
    })();

    if (!hasSource) {
      const noSourceError = Object.assign(new Error('No sources provided'), {
        name: 'errorNoSources',
      });
      return (
        <div
          className={`drop-player relative w-full h-full bg-black flex items-center justify-center ${className ?? ''}`}
        >
          {slots?.errorDisplay ? (
            slots.errorDisplay(noSourceError)
          ) : (
            <div className="drop-player-error">
              <AlertCircle size={32} aria-hidden="true" />
              <span className="drop-player-error-title">{t('error')}</span>
              <span className="drop-player-error-message">
                {t(noSourceError.name as TranslationKey)}
              </span>
            </div>
          )}
        </div>
      );
    }

    const ariaLabel = (() => {
      switch (mediaMode) {
        case 'video':
          return 'Video player';
        case 'image':
          return 'Image viewer';
        case 'pdf':
          return 'PDF viewer';
        case 'audio':
          return 'Audio player';
      }
    })();

    const renderMediaCore = () => {
      if (!activeEntry) return null;

      switch (mediaMode) {
        case 'video':
          return (
            <VideoCore
              ref={videoCoreRef}
              videoSources={entries}
              activeSourceIndex={activeSourceIndex}
              crossOrigin={crossOrigin}
              poster={poster}
              autoPlay={autoPlay}
              initialLoop={initialLoop}
              initialMuted={initialMuted}
              initialVolume={initialVolume}
              initialTime={initialTime}
              frameRate={frameRate}
              persistenceKey={persistenceKey}
              markers={markers}
              locale={locale}
              containerRef={containerRef}
              onStateChange={handleVideoStateChange}
              onPlay={onPlay}
              onPause={onPause}
              onEnded={onEnded}
              onTimeUpdate={onTimeUpdate}
              onDurationChange={onDurationChange}
              onVolumeChange={onVolumeChange}
              onPlaybackRateChange={onPlaybackRateChange}
              onError={handleError}
              onLoadedMetadata={onLoadedMetadata}
              onLoadStart={onLoadStart}
              onProgress={onProgress}
              onWaiting={onWaiting}
              onCanPlay={onCanPlay}
              onPlaying={onPlaying}
              onSeekStart={onSeekStart}
              onSeeking={onSeeking}
              onSeekEnd={onSeekEnd}
              onFrameCapture={onFrameCapture}
              onPositionSave={onPositionSave}
              onPositionRestore={onPositionRestore}
              onQualityLevelChange={onQualityLevelChange}
              onFallback={onFallback}
              onFullscreenToggle={toggleFullscreen}
            />
          );
        case 'image':
          return (
            <ImageCore
              ref={imageCoreRef}
              src={activeEntry.url}
              crossOrigin={crossOrigin}
              minZoom={DEFAULT_MIN_ZOOM}
              maxZoom={DEFAULT_MAX_ZOOM}
              locale={locale}
              containerRef={containerRef}
              onStateChange={handleImageStateChange}
              onError={handleError}
              onFrameCapture={onFrameCapture}
              onFullscreenToggle={toggleFullscreen}
            />
          );
        case 'pdf':
          return (
            <PdfCore
              src={activeEntry.url}
              minZoom={DEFAULT_MIN_ZOOM}
              maxZoom={3}
              containerRef={containerRef}
              onStateChange={handlePdfStateChange}
              onError={handleError}
            />
          );
        case 'audio':
          return (
            <AudioCore
              ref={audioCoreRef}
              src={activeEntry.url}
              autoPlay={autoPlay}
              initialLoop={initialLoop}
              initialMuted={initialMuted}
              initialVolume={initialVolume}
              initialTime={initialTime}
              persistenceKey={persistenceKey}
              locale={locale}
              containerRef={containerRef}
              onStateChange={handleAudioStateChange}
              onPlay={onPlay}
              onPause={onPause}
              onEnded={onEnded}
              onTimeUpdate={onTimeUpdate}
              onDurationChange={onDurationChange}
              onVolumeChange={onVolumeChange}
              onError={handleError}
              onLoadStart={onLoadStart}
              onCanPlay={onCanPlay}
              onSeekStart={onSeekStart}
              onSeeking={onSeeking}
              onSeekEnd={onSeekEnd}
              onPositionSave={onPositionSave}
              onPositionRestore={onPositionRestore}
            />
          );
      }
    };

    return (
      <div
        ref={containerRef}
        role="application"
        aria-label={ariaLabel}
        className={`drop-player relative w-full h-full bg-black group outline-none ${mediaMode === 'video' ? 'drop-player-ambient' : ''} ${className ?? ''}`}
        style={{
          ['--drop-player-ambient-shadow' as string]:
            mediaMode === 'video' && videoState.isAmbientLight
              ? `0 0 240px 60px rgba(${videoState.ambientColor.r}, ${videoState.ambientColor.g}, ${videoState.ambientColor.b}, 0.6)`
              : 'none',
        }}
        onPointerDown={() => {
          containerRef.current?.focus({ preventScroll: true });
        }}
        onKeyDownCapture={
          features.keyboardShortcuts &&
          (mediaMode === 'video' || mediaMode === 'audio')
            ? handleKeyDown
            : undefined
        }
        onMouseMove={resetHideControlsTimer}
        onMouseEnter={resetHideControlsTimer}
        onMouseLeave={handleMouseLeave}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Media player needs tabIndex for keyboard shortcuts
        tabIndex={0}
      >
        {renderMediaCore()}

        {/* Error overlay */}
        {lastError && !isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            {slots?.errorDisplay ? (
              slots.errorDisplay(lastError)
            ) : (
              <div className="drop-player-error">
                <AlertCircle size={32} aria-hidden="true" />
                <span className="drop-player-error-title">{t('error')}</span>
                <span className="drop-player-error-message">
                  {lastError.name.startsWith('error')
                    ? t(lastError.name as TranslationKey)
                    : lastError.message}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Loading overlay */}
        {!isReady && !lastError && mediaMode !== 'pdf' && (
          <>
            {/* biome-ignore lint/a11y/useSemanticElements: status is correct for loading indicator */}
            <div
              role="status"
              aria-label="Loading"
              className="absolute inset-0 flex items-center justify-center bg-black z-10"
            >
              {slots?.loadingIndicator ?? (
                <div
                  className="drop-player-spinner w-10 h-10 rounded-full border-2 border-white border-t-transparent"
                  aria-hidden
                />
              )}
            </div>
          </>
        )}

        {/* Source Selector (top-left, YouTube title style) */}
        {showTitle && (
          <div className="absolute top-2 left-2 z-20">
            <SourceSelector
              sources={entries}
              activeSourceIndex={activeSourceIndex}
              onSourceChange={handleSourceChange}
              showControls={controlsVisible}
            />
          </div>
        )}

        {/* Top left overlay slot (after source selector) */}
        {slots?.topLeftOverlay && (
          <div
            className={`absolute top-10 left-2 transition-opacity duration-300 ${
              controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {slots.topLeftOverlay}
          </div>
        )}

        {/* Top right overlay */}
        {slots?.topRightOverlay && (
          <div
            className={`absolute top-2 right-2 transition-opacity duration-300 ${
              controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {slots.topRightOverlay}
          </div>
        )}

        {/* Controls overlay (hidden for PDF) */}
        {showControlsProp && mediaMode !== 'pdf' && (
          <div
            className={`absolute inset-x-0 bottom-0 drop-player-controls-gradient py-2 px-4 transition-opacity duration-300 ${
              controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {(mediaMode === 'video' || mediaMode === 'audio') &&
              slots?.seekbarOverlay && (
                <div className="absolute inset-x-0 -top-6 h-6 pointer-events-none z-10 mx-3 [&>*]:pointer-events-auto">
                  {slots.seekbarOverlay(playerState)}
                </div>
              )}

            {features.seekBar &&
              (mediaMode === 'video' || mediaMode === 'audio') && (
                <SeekBar
                  currentTime={
                    mediaMode === 'audio'
                      ? audioState.currentTime
                      : videoState.currentTime
                  }
                  duration={
                    mediaMode === 'audio'
                      ? audioState.duration
                      : videoState.duration
                  }
                  isSeeking={
                    mediaMode === 'audio'
                      ? audioState.isSeeking
                      : videoState.isSeeking
                  }
                  seekValue={
                    mediaMode === 'audio'
                      ? audioState.seekValue
                      : videoState.seekValue
                  }
                  markers={markers}
                  onSeekStart={handleSeekStart}
                  onSeekChange={handleSeekChange}
                  onSeekEnd={handleSeekEnd}
                  t={t}
                />
              )}

            <ControlsBar
              features={features}
              mediaMode={mediaMode}
              isPlaying={
                mediaMode === 'audio'
                  ? audioState.isPlaying
                  : videoState.isPlaying
              }
              isLoop={
                mediaMode === 'audio' ? audioState.isLoop : videoState.isLoop
              }
              currentTime={
                mediaMode === 'audio'
                  ? audioState.currentTime
                  : videoState.currentTime
              }
              duration={
                mediaMode === 'audio'
                  ? audioState.duration
                  : videoState.duration
              }
              volume={
                mediaMode === 'audio' ? audioState.volume : videoState.volume
              }
              isMuted={
                mediaMode === 'audio' ? audioState.isMuted : videoState.isMuted
              }
              frameRate={frameRate}
              timeDisplayFormat={timeDisplayFormat}
              onTimeDisplayFormatChange={handleTimeDisplayFormatChange}
              hlsLevels={videoState.hlsLevels}
              currentHlsLevel={videoState.currentHlsLevel}
              qualityLevel={videoState.qualityLevel}
              hasOriginal={!!activeEntry?.originalUrl}
              isPlayingOriginal={videoState.isPlayingOriginal}
              isAmbientLight={videoState.isAmbientLight}
              onPlayToggle={handlePlayToggle}
              onLoopToggle={handleLoopToggle}
              onVolumeChange={handleVolumeChange}
              onMuteToggle={handleMuteToggle}
              onQualityChange={handleQualityChangeFromUI}
              onAmbientLightToggle={handleAmbientLightToggle}
              onSaveCapture={handleSaveCapture}
              onCopyCapture={handleCopyCapture}
              zoom={imageState.zoom}
              minZoom={DEFAULT_MIN_ZOOM}
              maxZoom={DEFAULT_MAX_ZOOM}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetZoom={handleResetZoom}
              isFullscreen={isFullscreen}
              onFullscreenToggle={toggleFullscreen}
              t={t}
              controlsStart={slots?.controlsStart}
              controlsEnd={slots?.controlsEnd}
            />
          </div>
        )}
      </div>
    );
  }
);
