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
import { useStatusOverlay } from '../hooks/useStatusOverlay';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
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
} as const;

const UI_DEFAULTS = {
  showControls: true,
  showTitle: undefined,
  features: undefined,
  locale: 'en' as const,
  frameRate: 30,
};

import { defaultTimeDisplayFormats } from '../features';
import type { TimeDisplayFormat } from '../types';
import { normalizeSources } from '../utils/sources';
import { AudioCore } from './AudioCore';
import { ControlsBar } from './ControlsBar';
import { SeekBar } from './controls/SeekBar';
import { SourceSelector } from './controls/SourceSelector';
import {
  formatTimeDisplay,
  getNextTimeDisplayFormat,
  TimeDisplay,
} from './controls/TimeDisplay';
import { ImageCore } from './ImageCore';
import { PdfCore } from './PdfCore';
import { StatusOverlay } from './StatusOverlay';
import { VideoCore } from './VideoCore';

import '../styles.css';

const DEFAULT_MIN_ZOOM = 1;
const DEFAULT_MAX_ZOOM = 5;

export const Player = forwardRef<PlayerRef, PlayerProps>(
  function Player(props, ref) {
    const {
      sources,
      className,
      crossOrigin = 'anonymous',
      poster,
      storageKey,
      storage: storageAdapter,
      slots,
      hlsConfig,
      _mediaMode,
    } = props;

    // -- Playback group --
    const {
      autoPlay = PLAYBACK_DEFAULTS.autoPlay,
      loop: initialLoop = PLAYBACK_DEFAULTS.loop,
      muted: initialMuted = PLAYBACK_DEFAULTS.muted,
      volume: initialVolume = PLAYBACK_DEFAULTS.volume,
      initialTime,
      seekStep,
    } = props.playback ?? {};

    // -- UI group --
    const {
      showControls: showControlsProp = UI_DEFAULTS.showControls,
      showTitle: showTitleProp,
      showStatusOverlay = false,
      features: featuresProp,
      locale = UI_DEFAULTS.locale,
      translations: customTranslations,
      frameRate: frameRateProp,
      timeDisplayFormats = defaultTimeDisplayFormats,
      filmGauge = 16,
      bpm = 120,
      timeSignature = '4/4',
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
      onPipChange,
      onFrameCapture,
      onActiveSourceChange,
      onQualityLevelChange,
      onFallback,
      onTimeDisplayFormatChange,
      onStateChange,
    } = props.events ?? {};

    const features = useMemo(
      () => resolveFeatures(featuresProp),
      [featuresProp]
    );

    const statusOverlay = useStatusOverlay();

    const containerRef = useRef<HTMLDivElement>(null);
    const videoCoreRef = useRef<VideoCoreRef>(null);
    const imageCoreRef = useRef<ImageCoreRef>(null);
    const audioCoreRef = useRef<AudioCoreRef>(null);

    const normalized = useMemo(
      () => normalizeSources(sources, _mediaMode),
      [sources, _mediaMode]
    );

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

    const { t } = usePlayerTranslation(locale, customTranslations);

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

    // Effective frame rate: user prop > HLS-detected > default
    const frameRate =
      frameRateProp ?? videoState.detectedFrameRate ?? UI_DEFAULTS.frameRate;

    const [controlsVisible, setControlsVisible] = useState(true);
    const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

    // Playback speed state
    const [playbackRate, setPlaybackRate] = useState(1);

    // Reset playback rate when sources or media mode change
    // biome-ignore lint/correctness/useExhaustiveDependencies: reset rate on source/mode change
    useEffect(() => {
      setPlaybackRate(1);
    }, [entries, activeSourceIndex, mediaMode]);

    // PIP state
    const [isPip, setIsPip] = useState(false);
    const [isPipSupported, setIsPipSupported] = useState(false);

    useEffect(() => {
      setIsPipSupported(
        'pictureInPictureEnabled' in document &&
          document.pictureInPictureEnabled
      );
    }, []);

    const showTitle = showTitleProp !== undefined ? showTitleProp : hasSource;

    const globalStorage = usePlayerStorage({
      storageKey,
      storage: storageAdapter,
    });

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
      const resolved = timeDisplayFormats.includes(stored)
        ? stored
        : getNextTimeDisplayFormat(stored, timeDisplayFormats);
      if (resolved !== 'elapsed-total') {
        setTimeDisplayFormat(resolved);
      }
    }, [globalStorage, timeDisplayFormats]);

    useEffect(() => {
      if (!timeDisplayFormats.includes(timeDisplayFormat)) {
        setTimeDisplayFormat(
          getNextTimeDisplayFormat(timeDisplayFormat, timeDisplayFormats)
        );
      }
    }, [timeDisplayFormats, timeDisplayFormat]);

    const handleTimeDisplayFormatChange = useCallback(
      (format: TimeDisplayFormat) => {
        setTimeDisplayFormat(format);
        globalStorage.setStoredValue('time_display_format', format);
        onTimeDisplayFormatChange?.(format);
      },
      [globalStorage, onTimeDisplayFormatChange]
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
      seekStep,
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

    const resetHideControlsTimer = useCallback(
      (e: React.PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        setControlsVisible(true);
        if (hideControlsTimeoutRef.current) {
          clearTimeout(hideControlsTimeoutRef.current);
        }
        if (!isEnded) {
          hideControlsTimeoutRef.current = setTimeout(() => {
            setControlsVisible(false);
          }, 3000);
        }
      },
      [isEnded]
    );

    const handlePointerLeave = useCallback(
      (e: React.PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        if (hideControlsTimeoutRef.current) {
          clearTimeout(hideControlsTimeoutRef.current);
        }
        if (!isEnded) {
          setControlsVisible(false);
        }
      },
      [isEnded]
    );

    const toggleControls = useCallback(() => {
      setControlsVisible((prev) => !prev);
    }, []);

    useEffect(() => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      if (controlsVisible && !isEnded) {
        hideControlsTimeoutRef.current = setTimeout(() => {
          setControlsVisible(false);
        }, 3000);
      }
    }, [controlsVisible, isEnded]);

    useEffect(() => {
      if (isEnded) {
        setControlsVisible(true);
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

    // ---- Status overlay: react to state changes (not user actions) ----
    const prevOverlayRef = useRef<{
      isPlaying?: boolean;
      isMuted?: boolean;
      isLoop?: boolean;
      volume?: number;
      isSeeking?: boolean;
      seekValue?: number;
      duration?: number;
      playbackRate?: number;
      zoom?: number;
      qualityLabel?: string;
    }>({});

    // biome-ignore lint/correctness/useExhaustiveDependencies: overlay driven by state diffs
    useEffect(() => {
      if (!showStatusOverlay) return;

      const prev = prevOverlayRef.current;
      const vs = mediaMode === 'video' ? videoState : undefined;
      const as_ = mediaMode === 'audio' ? audioState : undefined;
      const is_ = mediaMode === 'image' ? imageState : undefined;

      // Unified current values
      const isPlaying = vs?.isPlaying ?? as_?.isPlaying;
      const isMuted = vs?.isMuted ?? as_?.isMuted;
      const isLoop = vs?.isLoop ?? as_?.isLoop;
      const volume = vs?.volume ?? as_?.volume;
      const isSeeking = vs?.isSeeking ?? as_?.isSeeking;
      const seekValue = vs?.seekValue ?? as_?.seekValue;
      const duration = vs?.duration ?? as_?.duration;
      const zoom = is_?.zoom;
      const qualityLabel = vs?.qualityLevel?.label;

      // Play / Pause
      if (
        prev.isPlaying !== undefined &&
        isPlaying !== undefined &&
        prev.isPlaying !== isPlaying
      ) {
        statusOverlay.show(
          isPlaying ? 'play' : 'pause',
          t(isPlaying ? 'play' : 'pause')
        );
      }

      // Mute / Unmute
      if (
        prev.isMuted !== undefined &&
        isMuted !== undefined &&
        prev.isMuted !== isMuted
      ) {
        statusOverlay.show(
          isMuted ? 'volumeX' : 'volume',
          t(isMuted ? 'muted' : 'unmuted')
        );
      }

      // Volume (only when not mute toggle — check mute didn't change)
      if (
        prev.volume !== undefined &&
        volume !== undefined &&
        prev.volume !== volume &&
        prev.isMuted === isMuted
      ) {
        statusOverlay.show(
          'volume',
          `${t('volume')} ${Math.round(volume * 100)}%`
        );
      }

      // Loop
      if (
        prev.isLoop !== undefined &&
        isLoop !== undefined &&
        prev.isLoop !== isLoop
      ) {
        statusOverlay.show('repeat', t(isLoop ? 'loopOn' : 'loopOff'));
      }

      // Seeking (drag)
      if (isSeeking && seekValue !== undefined) {
        const seekText = formatTimeDisplay({
          currentTime: seekValue,
          duration: duration ?? 0,
          frameRate,
          filmGauge,
          bpm,
          timeSignature,
          format: timeDisplayFormat,
        });
        statusOverlay.show('', seekText, true);
      } else if (prev.isSeeking && !isSeeking) {
        statusOverlay.dismiss();
      }

      // Playback rate
      if (
        prev.playbackRate !== undefined &&
        prev.playbackRate !== playbackRate
      ) {
        statusOverlay.show('gauge', `${t('speed')} ${playbackRate}x`);
      }

      // Zoom (image)
      if (prev.zoom !== undefined && zoom !== undefined && prev.zoom !== zoom) {
        const icon = zoom > prev.zoom ? 'zoomIn' : 'zoomOut';
        statusOverlay.show(icon, `${Math.round(zoom * 100)}%`);
      }

      // Quality
      if (
        prev.qualityLabel !== undefined &&
        qualityLabel &&
        prev.qualityLabel !== qualityLabel
      ) {
        statusOverlay.show('settings', `${t('quality')} ${qualityLabel}`);
      }

      // Update prev
      prevOverlayRef.current = {
        isPlaying,
        isMuted,
        isLoop,
        volume,
        isSeeking,
        seekValue,
        duration,
        playbackRate,
        zoom,
        qualityLabel,
      };
    }, [
      showStatusOverlay,
      mediaMode,
      videoState,
      audioState,
      imageState,
      playbackRate,
    ]);

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

    const handlePrevSource = useCallback(() => {
      if (activeSourceIndex > 0) {
        handleSourceChange(activeSourceIndex - 1);
      }
    }, [activeSourceIndex, handleSourceChange]);

    const handleNextSource = useCallback(() => {
      if (activeSourceIndex < entries.length - 1) {
        handleSourceChange(activeSourceIndex + 1);
      }
    }, [activeSourceIndex, entries.length, handleSourceChange]);

    const isSwipeDisabled =
      mediaMode === 'pdf' ||
      (mediaMode === 'image' && imageState.zoom > 1) ||
      entries.length < 2;

    const {
      onTouchStart: handleSwipeTouchStart,
      onTouchEnd: handleSwipeTouchEnd,
      onTouchCancel: handleSwipeTouchCancel,
    } = useSwipeNavigation({
      onPrev: handlePrevSource,
      onNext: handleNextSource,
      disabled: isSwipeDisabled,
    });

    // Keyboard navigation for image mode (ArrowLeft/Right)
    useEffect(() => {
      if (mediaMode !== 'image' || entries.length < 2) return;
      const container = containerRef.current;
      if (!container) return;

      const handleImageKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('button,[role="button"],select,[role="slider"]')
        ) {
          return;
        }

        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrevSource();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleNextSource();
        }
      };

      container.addEventListener('keydown', handleImageKeyDown);
      return () => container.removeEventListener('keydown', handleImageKeyDown);
    }, [mediaMode, entries.length, handlePrevSource, handleNextSource]);

    const handleZoomIn = useCallback(() => {
      if (mediaMode === 'image') imageCoreRef.current?.zoomIn();
    }, [mediaMode]);

    const handleZoomOut = useCallback(() => {
      if (mediaMode === 'image') imageCoreRef.current?.zoomOut();
    }, [mediaMode]);

    const handleResetZoom = useCallback(() => {
      if (mediaMode === 'image') imageCoreRef.current?.resetZoom();
    }, [mediaMode]);

    const resolvedSeekStep = seekStep ?? 10;

    const handleSeekBackward = useCallback(() => {
      if (!mediaElement) return;
      mediaElement.currentTime = Math.max(
        0,
        mediaElement.currentTime - resolvedSeekStep
      );
    }, [mediaElement, resolvedSeekStep]);

    const handleSeekForward = useCallback(() => {
      if (!mediaElement) return;
      mediaElement.currentTime = Math.min(
        mediaElement.duration || 0,
        mediaElement.currentTime + resolvedSeekStep
      );
    }, [mediaElement, resolvedSeekStep]);

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

    const handlePlaybackRateChange = useCallback(
      (rate: number) => {
        switch (mediaMode) {
          case 'video':
            videoCoreRef.current?.setPlaybackRate(rate);
            setPlaybackRate(rate);
            // onPlaybackRateChange is fired by VideoCore's ratechange handler
            break;
          case 'audio':
            audioCoreRef.current?.setPlaybackRate(rate);
            setPlaybackRate(rate);
            onPlaybackRateChange?.(rate);
            break;
          case 'image':
          case 'pdf':
            return;
        }
      },
      [mediaMode, onPlaybackRateChange]
    );

    const handlePipToggle = useCallback(async () => {
      if (mediaMode !== 'video') return;
      const video = videoCoreRef.current?.getVideoElement();
      if (!video) return;

      try {
        if (document.pictureInPictureElement === video) {
          await document.exitPictureInPicture();
        } else {
          await video.requestPictureInPicture();
        }
      } catch {
        // PIP request may fail silently (e.g., user gesture required)
      }
    }, [mediaMode]);

    // Sync PIP state with browser events
    // biome-ignore lint/correctness/useExhaustiveDependencies: videoState.duration ensures re-attach after video element ready
    useEffect(() => {
      if (mediaMode !== 'video') return;
      const video = videoCoreRef.current?.getVideoElement();
      if (!video) return;

      const handleEnterPip = () => {
        setIsPip(true);
        onPipChange?.(true);
      };
      const handleLeavePip = () => {
        setIsPip(false);
        onPipChange?.(false);
      };

      video.addEventListener('enterpictureinpicture', handleEnterPip);
      video.addEventListener('leavepictureinpicture', handleLeavePip);
      return () => {
        video.removeEventListener('enterpictureinpicture', handleEnterPip);
        video.removeEventListener('leavepictureinpicture', handleLeavePip);
      };
    }, [mediaMode, onPipChange, videoState.duration]); // videoState.duration ensures re-attach after video element ready

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
        getPlaybackRate: () => {
          switch (mediaMode) {
            case 'video':
              return videoCoreRef.current?.getPlaybackRate() ?? 1;
            case 'audio':
              return audioCoreRef.current?.getPlaybackRate() ?? 1;
            case 'image':
            case 'pdf':
              return 1;
          }
        },
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
          handlePlaybackRateChange(rate);
        },
        getTimeDisplayFormat: () => timeDisplayFormat,
        setTimeDisplayFormat: (format: TimeDisplayFormat) => {
          handleTimeDisplayFormatChange(format);
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
        prev: handlePrevSource,
        next: handleNextSource,
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
        handlePlaybackRateChange,
        requestFullscreen,
        exitFullscreen,
        toggleFullscreen,
        handleError,
        mediaMode,
        timeDisplayFormat,
        handleTimeDisplayFormatChange,
        handlePrevSource,
        handleNextSource,
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
            playbackRate,
            isPip,
            timeDisplayFormat,
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
            playbackRate,
            isPip: false,
            timeDisplayFormat,
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
            playbackRate: 1,
            isPip: false,
            timeDisplayFormat,
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
      playbackRate,
      isPip,
      timeDisplayFormat,
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
            (audioState.waveformReady ||
              audioState.duration > 0 ||
              audioState.waveformFailedFallback) &&
            !lastError
          );
      }
    })();

    if (!hasSource) {
      const noSourceError = Object.assign(new Error('No sources provided'), {
        name: 'errorNoSources',
      });
      return (
        <div
          className={`drop-player drop-player--flex-center ${className ?? ''}`}
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
              storageKey={storageKey}
              storage={storageAdapter}
              markers={markers}
              hlsConfig={hlsConfig}
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
              onQualityLevelChange={onQualityLevelChange}
              onFallback={onFallback}
              onFullscreenToggle={toggleFullscreen}
              onToggleControls={
                showControlsProp ? toggleControls : handlePlayToggle
              }
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
              storageKey={storageKey}
              storage={storageAdapter}
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
            />
          );
      }
    };

    return (
      <div
        ref={containerRef}
        role="application"
        aria-label={ariaLabel}
        className={`drop-player ${mediaMode === 'video' && videoState.isAmbientLight ? 'drop-player-ambient' : ''} ${className ?? ''}`}
        style={{
          ['--drop-player-aspect-ratio' as string]:
            mediaMode === 'video'
              ? '16 / 9'
              : mediaMode === 'audio'
                ? '32 / 9'
                : mediaMode === 'image'
                  ? '4 / 3'
                  : '1 / 1.414',
          ...(mediaMode === 'video' && videoState.isAmbientLight
            ? {
                ['--drop-player-ambient-shadow' as string]: `0 0 240px 60px rgba(${videoState.ambientColor.r}, ${videoState.ambientColor.g}, ${videoState.ambientColor.b}, 0.6)`,
              }
            : undefined),
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
        onPointerMove={resetHideControlsTimer}
        onPointerEnter={resetHideControlsTimer}
        onPointerLeave={handlePointerLeave}
        onTouchStart={handleSwipeTouchStart}
        onTouchEnd={handleSwipeTouchEnd}
        onTouchCancel={handleSwipeTouchCancel}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Media player needs tabIndex for keyboard shortcuts
        tabIndex={0}
      >
        <div className="drop-player-inner">
          {renderMediaCore()}

          {/* Error overlay */}
          {lastError && !isReady && (
            <div className="drop-player-overlay">
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
            <div
              role="status"
              aria-label="Loading"
              className="drop-player-overlay"
            >
              {slots?.loadingIndicator ?? (
                <div className="drop-player-spinner" aria-hidden />
              )}
            </div>
          )}

          {/* Source Selector (top-left, YouTube title style) */}
          {showTitle && (
            <div className="drop-player-source-position">
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
              className={`drop-player-slot-top-left ${
                controlsVisible ? 'drop-player-visible' : 'drop-player-hidden'
              }`}
            >
              {slots.topLeftOverlay}
            </div>
          )}

          {/* Top right overlay */}
          {slots?.topRightOverlay && (
            <div
              className={`drop-player-slot-top-right ${
                controlsVisible ? 'drop-player-visible' : 'drop-player-hidden'
              }`}
            >
              {slots.topRightOverlay}
            </div>
          )}

          {/* Status overlay (pill) */}
          {showStatusOverlay && <StatusOverlay state={statusOverlay.state} />}

          {/* Controls overlay (hidden for PDF) */}
          {showControlsProp && mediaMode !== 'pdf' && (
            <div
              className={`drop-player-controls-gradient ${
                controlsVisible ? 'drop-player-visible' : 'drop-player-hidden'
              }`}
            >
              {(mediaMode === 'video' || mediaMode === 'audio') &&
                slots?.seekbarOverlay && (
                  <div className="drop-player-seekbar-overlay-slot">
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
                    startSlot={
                      features.timeDisplay ? (
                        <TimeDisplay
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
                          frameRate={frameRate}
                          filmGauge={filmGauge}
                          bpm={bpm}
                          timeSignature={timeSignature}
                          format={timeDisplayFormat}
                          formats={timeDisplayFormats}
                          onFormatChange={handleTimeDisplayFormatChange}
                          t={t}
                        />
                      ) : undefined
                    }
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
                  mediaMode === 'audio'
                    ? audioState.isMuted
                    : videoState.isMuted
                }
                frameRate={frameRate}
                filmGauge={filmGauge}
                bpm={bpm}
                timeSignature={timeSignature}
                timeDisplayFormat={timeDisplayFormat}
                timeDisplayFormats={timeDisplayFormats}
                onTimeDisplayFormatChange={handleTimeDisplayFormatChange}
                playbackRate={playbackRate}
                onPlaybackRateChange={handlePlaybackRateChange}
                hlsLevels={videoState.hlsLevels}
                currentHlsLevel={videoState.currentHlsLevel}
                qualityLevel={videoState.qualityLevel}
                hasOriginal={!!activeEntry?.originalUrl}
                isPlayingOriginal={videoState.isPlayingOriginal}
                isAmbientLight={videoState.isAmbientLight}
                isPip={isPip}
                isPipSupported={isPipSupported}
                onPipToggle={handlePipToggle}
                seekStep={resolvedSeekStep}
                onSeekBackward={handleSeekBackward}
                onSeekForward={handleSeekForward}
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
                activeSourceIndex={activeSourceIndex}
                sourceCount={entries.length}
                onPrevSource={handlePrevSource}
                onNextSource={handleNextSource}
                isFullscreen={isFullscreen}
                onFullscreenToggle={toggleFullscreen}
                t={t}
                controlsStart={slots?.controlsStart}
                controlsEnd={slots?.controlsEnd}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
);
