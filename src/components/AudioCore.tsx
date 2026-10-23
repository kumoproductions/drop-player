import { Music } from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type WaveformData from 'waveform-data';

import { useDragToSeek } from '../hooks/useDragToSeek';
import { useMediaPlayerState } from '../hooks/useMediaPlayerState';
import type { AudioCoreProps, AudioCoreRef, AudioState } from '../types';
import { WaveformCanvas } from './WaveformCanvas';

// 8 kHz is the safe cross-browser minimum (Firefox/Safari floor).
const WAVEFORM_DECODE_SAMPLE_RATE = 8000;
const MAX_AUDIO_FILE_BYTES = 256 * 1024 * 1024;

export const AudioCore = forwardRef<AudioCoreRef, AudioCoreProps>(
  function AudioCore(props, ref) {
    const {
      src,
      autoPlay = false,
      initialLoop = false,
      initialMuted = false,
      initialVolume = 1,
      initialTime,
      storageKey,
      storage: storageAdapter,
      waveColor = '#666',
      progressColor = '#0066ff',
      waveformScale = 512,
      containerRef: _containerRef,
      onStateChange,
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
      onWaveformReady,
      onToggleControls,
    } = props;

    const audioRef = useRef<HTMLAudioElement>(null);
    const waveformAreaRef = useRef<HTMLDivElement>(null);

    const dragWasPlayingRef = useRef(false);

    const {
      state,
      setSeeking,
      setCurrentTime,
      setSeekValue,
      getImperativeBase,
      play,
      pause,
    } = useMediaPlayerState(audioRef, {
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
      isBuffering,
    } = state;

    // Result is tagged with its src so a stale waveform is never shown for a new source.
    const [waveformResult, setWaveformResult] = useState<{
      src: string;
      data: WaveformData | null;
    } | null>(null);
    const currentWaveform = waveformResult?.src === src ? waveformResult : null;
    const waveformData = currentWaveform?.data ?? null;
    const waveformReady = waveformData !== null;
    const waveformFailedFallback =
      currentWaveform !== null && currentWaveform.data === null;

    const onWaveformReadyRef = useRef(onWaveformReady);
    useEffect(() => {
      onWaveformReadyRef.current = onWaveformReady;
    });

    useEffect(() => {
      const stateSnapshot: AudioState = {
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
        isBuffering,
        waveformReady,
        waveformFailedFallback,
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
      isBuffering,
      waveformReady,
      waveformFailedFallback,
      onStateChange,
    ]);

    const generateWaveform = useCallback(
      async (audioSrc: string, signal: AbortSignal) => {
        let WaveformDataModule: typeof WaveformData;
        try {
          const mod = await import('waveform-data');
          WaveformDataModule = mod.default;
        } catch {
          console.warn(
            '[drop-player] waveform-data is not installed. Audio will play without waveform visualization. Install it with: npm i waveform-data'
          );
          return null;
        }

        const response = await fetch(audioSrc, { signal });
        if (!response.ok) {
          throw new Error(
            `Waveform fetch failed: ${response.status} ${response.statusText}`
          );
        }

        const contentLength = Number(response.headers.get('content-length'));
        if (
          Number.isFinite(contentLength) &&
          contentLength > MAX_AUDIO_FILE_BYTES
        ) {
          console.warn(
            `[drop-player] Audio file ${contentLength} bytes exceeds waveform size limit (${MAX_AUDIO_FILE_BYTES}); skipping waveform generation.`
          );
          throw new Error('Audio file too large for waveform generation');
        }

        const arrayBuffer = await response.arrayBuffer();
        if (signal.aborted) return null;
        if (arrayBuffer.byteLength > MAX_AUDIO_FILE_BYTES) {
          console.warn(
            `[drop-player] Audio file ${arrayBuffer.byteLength} bytes exceeds waveform size limit (${MAX_AUDIO_FILE_BYTES}); skipping waveform generation.`
          );
          throw new Error('Audio file too large for waveform generation');
        }

        // length=1 is fine — decodeAudioData sizes the output by the source.
        const offlineCtx = new OfflineAudioContext(
          1,
          1,
          WAVEFORM_DECODE_SAMPLE_RATE
        );

        return new Promise<WaveformData>((resolve, reject) => {
          WaveformDataModule.createFromAudio(
            {
              audio_context: offlineCtx as unknown as AudioContext,
              array_buffer: arrayBuffer,
              scale: waveformScale,
            },
            (err, waveform) => {
              if (err) reject(err);
              else if (waveform) resolve(waveform);
              else reject(new Error('Failed to create waveform data'));
            }
          );
        });
      },
      [waveformScale]
    );

    useEffect(() => {
      if (!src) return;

      const controller = new AbortController();

      generateWaveform(src, controller.signal)
        .then((waveform) => {
          if (controller.signal.aborted || !waveform) return;
          setWaveformResult({ src, data: waveform });
          onWaveformReadyRef.current?.();
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setWaveformResult({ src, data: null });
        });

      return () => {
        controller.abort();
      };
    }, [src, generateWaveform]);

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio || !src) return;
      audio.src = src;
    }, [src]);

    // ── Drag-to-seek ──────────────────────────────────────────────

    const handleDragSeekStart = useCallback(() => {
      const audio = audioRef.current;
      if (!audio) return;
      dragWasPlayingRef.current = !audio.paused;
      onSeekStart?.(audio.currentTime);
      pause();
      setSeeking(true);
      setSeekValue(audio.currentTime);
    }, [pause, setSeeking, setSeekValue, onSeekStart]);

    const handleDragSeekMove = useCallback(
      (time: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        setSeekValue(time);
        audio.currentTime = time;
        setCurrentTime(time);
      },
      [setSeekValue, setCurrentTime]
    );

    const handleDragSeekEnd = useCallback(
      (time: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = time;
        setCurrentTime(time);
        setSeeking(false);
        onSeekEnd?.(time);
        if (dragWasPlayingRef.current) {
          play().catch((error) => {
            onError?.(
              error instanceof Error ? error : new Error(String(error))
            );
          });
        }
      },
      [setSeeking, setCurrentTime, onSeekEnd, play, onError]
    );

    const handleClickSeek = useCallback(
      (time?: number) => {
        if (time == null) return;
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = time;
        setCurrentTime(time);
      },
      [setCurrentTime]
    );

    const handleTouchTap = useCallback(() => {
      onToggleControls?.();
    }, [onToggleControls]);

    const { handlePointerDown, handlePointerMove } = useDragToSeek({
      mediaRef: audioRef,
      areaRef: waveformAreaRef,
      duration,
      mode: 'absolute',
      onDragSeekStart: handleDragSeekStart,
      onDragSeekMove: handleDragSeekMove,
      onDragSeekEnd: handleDragSeekEnd,
      onClick: handleClickSeek,
      onTouchTap: handleTouchTap,
    });

    // ── Imperative handle ───────────────────────────────────────

    useImperativeHandle(
      ref,
      () => ({
        ...getImperativeBase(),
        getAudioElement: () => audioRef.current,
      }),
      [getImperativeBase]
    );

    return (
      <div className="drop-player-audio-container">
        <audio
          ref={audioRef}
          autoPlay={autoPlay}
          muted={initialMuted}
          style={{ display: 'none' }}
        >
          <track kind="captions" />
        </audio>

        <div
          ref={waveformAreaRef}
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- custom-drawn track; a native range input cannot host the rendered children
          role="slider"
          aria-label="Audio progress"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={isSeeking ? seekValue : currentTime}
          tabIndex={0}
          className="drop-player-audio-waveform-area"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          {waveformReady ? (
            <WaveformCanvas
              waveformData={waveformData}
              currentTime={currentTime}
              duration={duration}
              isSeeking={isSeeking}
              seekValue={seekValue}
              waveColor={waveColor}
              progressColor={progressColor}
            />
          ) : (
            <Music
              size={32}
              className="drop-player-audio-icon"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    );
  }
);
