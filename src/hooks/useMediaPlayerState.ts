import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  MediaPlayerImperativeBase,
  UseMediaPlayerStateOptions,
  UseMediaPlayerStateReturn,
} from '../types';
import { usePlayerStorage } from './usePlayerStorage';

function mediaErrorFromCode(err: MediaError): Error {
  const map: Record<number, { name: string; message: string }> = {
    [MediaError.MEDIA_ERR_ABORTED]: {
      name: 'errorAborted',
      message: 'Playback was aborted',
    },
    [MediaError.MEDIA_ERR_NETWORK]: {
      name: 'errorNetwork',
      message: 'A network error occurred while loading the media',
    },
    [MediaError.MEDIA_ERR_DECODE]: {
      name: 'errorDecode',
      message: 'The media could not be decoded',
    },
    [MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]: {
      name: 'errorNotSupported',
      message:
        'The media format is not supported, or the source could not be found',
    },
  };

  const entry = map[err.code] ?? {
    name: 'errorUnknown',
    message: err.message || 'An unknown media error occurred',
  };

  const error = new Error(entry.message);
  error.name = entry.name;
  return error;
}

/**
 * Shared media player state, persistence, and control handlers for HTMLMediaElement.
 * Used by AudioCore and VideoCore. Caller sets src. Seek operations clamp to [0, duration].
 */
export function useMediaPlayerState(
  mediaRef: RefObject<HTMLMediaElement | null>,
  options: UseMediaPlayerStateOptions = {}
): UseMediaPlayerStateReturn {
  const {
    storageKey,
    initialVolume = 1,
    initialMuted = false,
    initialLoop = false,
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
  } = options;

  const storage = usePlayerStorage({
    storageKey,
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() =>
    storage.getStoredValue('volume', initialVolume)
  );
  const [isMuted, setIsMuted] = useState(() =>
    storage.getStoredValue('muted', initialMuted)
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isLoop, setIsLoop] = useState(() =>
    storage.getStoredValue('loop', initialLoop)
  );
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const wasPlayingBeforeSeekRef = useRef(false);
  const initialPositionRef = useRef<number | null>(null);
  const autoPlayOnNextLoadRef = useRef(false);

  useEffect(() => {
    if (initialTime !== undefined) {
      initialPositionRef.current = initialTime;
    }
  }, [initialTime]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleLoadedMetadata = () => {
      if (initialPositionRef.current !== null) {
        media.currentTime = initialPositionRef.current;
        initialPositionRef.current = null;
      }
      if (autoPlayOnNextLoadRef.current) {
        autoPlayOnNextLoadRef.current = false;
        media.play().catch((err) => {
          onError?.(err instanceof Error ? err : new Error(String(err)));
        });
      }
      setDuration(media.duration);
      onDurationChange?.(media.duration);
    };

    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [mediaRef, onDurationChange, onError]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handlers = {
      play: () => {
        setIsPlaying(true);
        setIsEnded(false);
        onPlay?.();
      },
      pause: () => {
        setIsPlaying(false);
        onPause?.();
      },
      ended: () => {
        setIsEnded(true);
        setIsPlaying(false);
        onEnded?.();
      },
      timeupdate: () => {
        if (!isSeeking) {
          setCurrentTime(media.currentTime);
          onTimeUpdate?.(media.currentTime);
        }
      },
      durationchange: () => {
        setDuration(media.duration);
        onDurationChange?.(media.duration);
      },
      volumechange: () => {
        onVolumeChange?.(media.volume, media.muted);
      },
      loadstart: () => {
        onLoadStart?.();
      },
      canplay: () => {
        onCanPlay?.();
      },
      playing: () => {
        setIsEnded(false);
        onPlaying?.();
      },
      error: () => {
        const mediaError = media.error;
        if (mediaError) {
          onError?.(mediaErrorFromCode(mediaError));
        }
      },
    };

    for (const [event, handler] of Object.entries(handlers)) {
      media.addEventListener(event, handler);
    }
    return () => {
      for (const [event, handler] of Object.entries(handlers)) {
        media.removeEventListener(event, handler);
      }
    };
  }, [
    mediaRef,
    isSeeking,
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    onDurationChange,
    onVolumeChange,
    onLoadStart,
    onCanPlay,
    onPlaying,
    onError,
  ]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !isPlaying || isSeeking) return;

    let rafId: number;
    const updateTime = () => {
      setCurrentTime(media.currentTime);
      rafId = requestAnimationFrame(updateTime);
    };
    rafId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(rafId);
  }, [mediaRef, isPlaying, isSeeking]);

  useEffect(() => {
    const media = mediaRef.current;
    if (media) media.volume = volume;
  }, [mediaRef, volume]);

  useEffect(() => {
    const media = mediaRef.current;
    if (media) media.loop = isLoop;
  }, [mediaRef, isLoop]);

  useEffect(() => {
    const media = mediaRef.current;
    if (media) media.muted = isMuted;
  }, [mediaRef, isMuted]);

  const normalizeSeekTime = useCallback(
    (time: number): number => Math.max(0, Math.min(duration, time)),
    [duration]
  );

  const togglePlayPause = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;
    if (media.paused) {
      media.play().catch((error) => {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      });
    } else {
      media.pause();
    }
  }, [mediaRef, onError]);

  const handleSeekStart = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;
    wasPlayingBeforeSeekRef.current = !media.paused;
    media.pause();
    setIsSeeking(true);
    onSeekStart?.(media.currentTime);
  }, [mediaRef, onSeekStart]);

  const handleSeekChange = useCallback(
    (time: number) => {
      const media = mediaRef.current;
      if (!media) return;
      const normalized = normalizeSeekTime(time);
      media.currentTime = normalized;
      setCurrentTime(normalized);
      setSeekValue(normalized);
      onSeeking?.(normalized);
    },
    [mediaRef, normalizeSeekTime, onSeeking]
  );

  const handleSeekEnd = useCallback(
    (time: number) => {
      const media = mediaRef.current;
      if (!media) return;
      const normalized = normalizeSeekTime(time);
      media.currentTime = normalized;
      setCurrentTime(normalized);
      setSeekValue(normalized);
      setIsSeeking(false);
      if (wasPlayingBeforeSeekRef.current) {
        media.play().catch((error) => {
          onError?.(error instanceof Error ? error : new Error(String(error)));
        });
      }
      wasPlayingBeforeSeekRef.current = false;
      onSeekEnd?.(normalized);
    },
    [mediaRef, normalizeSeekTime, onSeekEnd, onError]
  );

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      const media = mediaRef.current;
      if (!media) return;
      media.volume = newVolume;
      setVolume(newVolume);
      storage.setStoredValue('volume', newVolume);
      if (newVolume === 0 && !isMuted) {
        media.muted = true;
        setIsMuted(true);
        storage.setStoredValue('muted', true);
      } else if (newVolume > 0 && isMuted) {
        media.muted = false;
        setIsMuted(false);
        storage.setStoredValue('muted', false);
      }
    },
    [mediaRef, isMuted, storage]
  );

  const UNMUTE_MIN_VOLUME = 0.1;

  const handleMuteToggle = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;
    const newMuted = !isMuted;
    if (!newMuted && volume === 0) {
      media.volume = UNMUTE_MIN_VOLUME;
      setVolume(UNMUTE_MIN_VOLUME);
      storage.setStoredValue('volume', UNMUTE_MIN_VOLUME);
    }
    media.muted = newMuted;
    setIsMuted(newMuted);
    storage.setStoredValue('muted', newMuted);
  }, [mediaRef, isMuted, volume, storage]);

  const handleLoopToggle = useCallback(() => {
    const newLoop = !isLoop;
    setIsLoop(newLoop);
    storage.setStoredValue('loop', newLoop);
  }, [isLoop, storage]);

  const setInitialPositionForNextLoad = useCallback(
    (position: number | null, autoPlay?: boolean) => {
      initialPositionRef.current = position;
      autoPlayOnNextLoadRef.current = autoPlay ?? false;
    },
    []
  );

  const getImperativeBase = useCallback((): MediaPlayerImperativeBase => {
    return {
      play: async () => {
        try {
          await mediaRef.current?.play();
        } catch (error) {
          const playError =
            error instanceof Error ? error : new Error(String(error));
          onError?.(playError);
          throw playError;
        }
      },
      pause: () => {
        mediaRef.current?.pause();
      },
      toggle: togglePlayPause,
      seek: (time: number) => {
        const media = mediaRef.current;
        if (media) {
          const normalized = normalizeSeekTime(time);
          media.currentTime = normalized;
          setCurrentTime(normalized);
        }
      },
      seekRelative: (delta: number) => {
        const media = mediaRef.current;
        if (media) {
          const normalized = normalizeSeekTime(media.currentTime + delta);
          media.currentTime = normalized;
          setCurrentTime(normalized);
        }
      },
      handleSeekStart,
      handleSeekChange,
      handleSeekEnd,
      getCurrentTime: () => mediaRef.current?.currentTime ?? 0,
      getDuration: () => mediaRef.current?.duration ?? 0,
      getVolume: () => mediaRef.current?.volume ?? volume,
      isMuted: () => mediaRef.current?.muted ?? isMuted,
      isPaused: () => mediaRef.current?.paused ?? true,
      getPlaybackRate: () => mediaRef.current?.playbackRate ?? 1,
      setVolume: handleVolumeChange,
      setMuted: (muted: boolean) => {
        const media = mediaRef.current;
        if (media) {
          media.muted = muted;
          setIsMuted(muted);
        }
      },
      setPlaybackRate: (rate: number) => {
        if (mediaRef.current) {
          mediaRef.current.playbackRate = rate;
        }
      },
      toggleLoop: handleLoopToggle,
      toggleMute: handleMuteToggle,
    };
  }, [
    mediaRef,
    togglePlayPause,
    normalizeSeekTime,
    volume,
    isMuted,
    handleVolumeChange,
    handleSeekStart,
    handleSeekChange,
    handleSeekEnd,
    handleLoopToggle,
    handleMuteToggle,
    onError,
  ]);

  return {
    state: {
      currentTime,
      duration,
      volume,
      isMuted,
      isPlaying,
      isEnded,
      isLoop,
      isSeeking,
      seekValue,
    },
    handlers: {
      togglePlayPause,
      handleSeekStart,
      handleSeekChange,
      handleSeekEnd,
      handleVolumeChange,
      handleMuteToggle,
      handleLoopToggle,
    },
    setSeeking: setIsSeeking,
    setCurrentTime,
    setSeekValue,
    setInitialPositionForNextLoad,
    storage,
    getImperativeBase,
  };
}
