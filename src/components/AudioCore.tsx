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
    } = props;

    const audioRef = useRef<HTMLAudioElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const waveformAreaRef = useRef<HTMLDivElement>(null);

    const dragWasPlayingRef = useRef(false);

    const {
      state,
      handlers,
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
    } = state;

    const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
    const [waveformReady, setWaveformReady] = useState(false);
    const [waveformFailedFallback, setWaveformFailedFallback] = useState(false);

    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;
    const onWaveformReadyRef = useRef(onWaveformReady);
    onWaveformReadyRef.current = onWaveformReady;

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

        const arrayBuffer = await response.arrayBuffer();
        if (signal.aborted) return null;

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }

        const audioContext = audioContextRef.current;
        return new Promise<WaveformData>((resolve, reject) => {
          WaveformDataModule.createFromAudio(
            {
              audio_context: audioContext,
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
      if (!src) {
        setWaveformReady(false);
        setWaveformData(null);
        setWaveformFailedFallback(false);
        return;
      }

      setWaveformReady(false);
      setWaveformData(null);
      setWaveformFailedFallback(false);

      const controller = new AbortController();

      generateWaveform(src, controller.signal)
        .then((waveform) => {
          if (controller.signal.aborted || !waveform) return;
          setWaveformData(waveform);
          setWaveformReady(true);
          onWaveformReadyRef.current?.();
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setWaveformFailedFallback(true);
        });

      return () => {
        controller.abort();
      };
    }, [src, generateWaveform]);

    useEffect(() => {
      return () => {
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      };
    }, []);

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
      pause();
      setSeeking(true);
      setSeekValue(audio.currentTime);
    }, [pause, setSeeking, setSeekValue]);

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

    const { handlePointerDown, handlePointerMove } = useDragToSeek({
      mediaRef: audioRef,
      areaRef: waveformAreaRef,
      duration,
      mode: 'absolute',
      onDragSeekStart: handleDragSeekStart,
      onDragSeekMove: handleDragSeekMove,
      onDragSeekEnd: handleDragSeekEnd,
      onClick: handleClickSeek,
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
          ) : waveformFailedFallback ? (
            <div
              role="status"
              aria-live="polite"
              className="drop-player-audio-fallback"
            >
              Waveform unavailable
            </div>
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
