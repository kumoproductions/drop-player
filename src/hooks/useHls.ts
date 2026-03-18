import type Hls from 'hls.js';
import type { HlsConfig, Level } from 'hls.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FallbackReason, QualityLevel } from '../types';

interface UseHlsOptions {
  hlsUrl: string | null;
  videoElement: HTMLVideoElement | null;
  /** URL to fall back to when HLS fails (e.g. originalUrl from MediaSource) */
  originalUrl?: string | null;
  enabled: boolean;
  /** Override hls.js configuration. Merged on top of default settings. */
  hlsConfig?: Partial<HlsConfig>;
  onFallbackToOriginal?: (reason: FallbackReason) => void;
  onQualityLevelChange?: (level: QualityLevel) => void;
  onError?: (error: Error) => void;
}

interface UseHlsReturn {
  hlsLevels: Level[];
  currentHlsLevel: number;
  isHlsSupported: boolean;
  setQualityLevel: (level: number | 'auto') => void;
  destroy: () => void;
}

/** Lazy-loaded hls.js module (dynamic import to avoid bundling when not used) */
let HlsModule: typeof Hls | null = null;
let hlsImportPromise: Promise<typeof Hls | null> | null = null;

async function importHls(
  onError?: (error: Error) => void
): Promise<typeof Hls | null> {
  if (HlsModule) return HlsModule;
  if (hlsImportPromise) return hlsImportPromise;

  hlsImportPromise = import('hls.js')
    .then((mod) => {
      HlsModule = mod.default;
      hlsImportPromise = null;
      return HlsModule;
    })
    .catch((error) => {
      const importError =
        error instanceof Error
          ? error
          : new Error('Failed to load hls.js module');
      console.warn('[drop-player] Failed to load hls.js:', importError);
      onError?.(importError);
      hlsImportPromise = null;
      throw importError;
    });

  return hlsImportPromise;
}

/**
 * Manages HLS.js lifecycle: load source, attach to video element, handle quality levels and errors.
 * Falls back to originalUrl or native HLS (Safari) when appropriate.
 */
export function useHls(options: UseHlsOptions): UseHlsReturn {
  const {
    hlsUrl,
    videoElement,
    originalUrl,
    enabled,
    hlsConfig,
    onFallbackToOriginal,
    onQualityLevelChange,
    onError,
  } = options;

  const hlsRef = useRef<Hls | null>(null);
  const [hlsLevels, setHlsLevels] = useState<Level[]>([]);
  const [currentHlsLevel, setCurrentHlsLevel] = useState<number>(-1);
  const [isHlsSupported, setIsHlsSupported] = useState(false);

  const onFallbackToOriginalRef = useRef(onFallbackToOriginal);
  const onQualityLevelChangeRef = useRef(onQualityLevelChange);
  const onErrorRef = useRef(onError);
  const originalUrlRef = useRef(originalUrl);

  useEffect(() => {
    onFallbackToOriginalRef.current = onFallbackToOriginal;
    onQualityLevelChangeRef.current = onQualityLevelChange;
    onErrorRef.current = onError;
    originalUrlRef.current = originalUrl;
  });

  useEffect(() => {
    if (!enabled || !hlsUrl) return;
    importHls(onError)
      .then((Hls) => {
        if (Hls) setIsHlsSupported(Hls.isSupported());
      })
      .catch(() => {
        /* Handled in importHls; catch here to avoid unhandled rejection */
      });
  }, [enabled, hlsUrl, onError]);

  const fallbackToOriginal = useCallback((reason: FallbackReason) => {
    if (!originalUrlRef.current) {
      const error = new Error(`HLS error: ${reason}, no originalUrl fallback`);
      error.name = 'errorNetwork';
      onErrorRef.current?.(error);
      return;
    }

    console.warn(
      `[drop-player] HLS fallback triggered: ${reason}. Falling back to originalUrl.`
    );
    onFallbackToOriginalRef.current?.(reason);
  }, []);

  useEffect(() => {
    if (!hlsUrl || !videoElement || !enabled) return;

    let hls: Hls | null = null;
    let destroyed = false;

    const setupHls = async () => {
      let HlsClass: typeof Hls | null;
      try {
        HlsClass = await importHls(onErrorRef.current);
      } catch {
        setHlsLevels([]);
        setCurrentHlsLevel(-1);
        return;
      }
      if (!HlsClass || destroyed) {
        setHlsLevels([]);
        setCurrentHlsLevel(-1);
        return;
      }

      if (!HlsClass.isSupported()) {
        setHlsLevels([]);
        setCurrentHlsLevel(-1);
        if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
          videoElement.src = hlsUrl;
          return;
        }

        fallbackToOriginal('hls-not-supported');
        return;
      }

      hls = new HlsClass({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        // ABR tuning: more aggressive upswitch for better quality on good connections
        abrBandWidthUpFactor: 0.9,
        abrEwmaDefaultEstimate: 10_000_000,
        ...hlsConfig,
      });

      hlsRef.current = hls;

      hls.loadSource(hlsUrl);
      hls.attachMedia(videoElement);

      hls.on(HlsClass.Events.MANIFEST_PARSED, (_, data) => {
        if (destroyed) return;
        if (!data.levels || data.levels.length === 0) {
          fallbackToOriginal('no-levels');
          return;
        }
        setHlsLevels(data.levels);
        onQualityLevelChangeRef.current?.({ mode: 'auto', label: 'Auto' });
      });

      hls.on(HlsClass.Events.LEVEL_SWITCHED, (_, data) => {
        if (destroyed) return;
        setCurrentHlsLevel(data.level);

        const level = hls?.levels?.[data.level];
        if (level) {
          const isAuto = hls?.autoLevelEnabled ?? true;
          onQualityLevelChangeRef.current?.({
            mode: isAuto ? 'auto' : 'manual',
            height: level.height,
            levelIndex: data.level,
            label: isAuto ? `Auto (${level.height}p)` : `${level.height}p`,
          });
        }
      });

      hls.on(HlsClass.Events.ERROR, (_, data) => {
        if (destroyed) return;
        if (data.fatal) {
          const isFatalManifestLoadFailure =
            data.type === HlsClass.ErrorTypes.NETWORK_ERROR &&
            (data.details === HlsClass.ErrorDetails.MANIFEST_LOAD_ERROR ||
              data.details === HlsClass.ErrorDetails.MANIFEST_LOAD_TIMEOUT);

          if (isFatalManifestLoadFailure) {
            fallbackToOriginal('manifest-load-error');
            return;
          }

          if (
            data.type === HlsClass.ErrorTypes.NETWORK_ERROR &&
            data.details === HlsClass.ErrorDetails.MANIFEST_PARSING_ERROR
          ) {
            fallbackToOriginal('manifest-parse-error');
            return;
          }
          console.error('[drop-player] HLS fatal error:', data);
          switch (data.type) {
            case HlsClass.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad();
              break;
            case HlsClass.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              fallbackToOriginal('playback-error');
              break;
          }
        }
      });
    };

    setupHls();

    return () => {
      destroyed = true;
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
      // Do NOT clear hlsLevels/currentHlsLevel here. When switching to Original
      // (enabled=false), we need to keep them so QualitySelector can show
      // HLS options for switching back.
    };
  }, [hlsUrl, videoElement, enabled, hlsConfig, fallbackToOriginal]);

  /** Use nextLevel for smooth switching without buffer flush */
  const setQualityLevel = useCallback((level: number | 'auto') => {
    const hls = hlsRef.current;
    if (!hls) return;

    if (level === 'auto') {
      hls.nextLevel = -1;
      onQualityLevelChangeRef.current?.({
        mode: 'auto',
        label: 'Auto',
      });
    } else {
      hls.nextLevel = level;
      const levelData = hls.levels?.[level];
      if (levelData) {
        onQualityLevelChangeRef.current?.({
          mode: 'manual',
          height: levelData.height,
          levelIndex: level,
          label: `${levelData.height}p`,
        });
      }
    }
  }, []);

  const destroy = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setHlsLevels([]);
    setCurrentHlsLevel(-1);
  }, []);

  return {
    hlsLevels,
    currentHlsLevel,
    isHlsSupported,
    setQualityLevel,
    destroy,
  };
}
