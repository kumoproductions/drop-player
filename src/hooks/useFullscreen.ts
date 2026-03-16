import { useCallback, useEffect, useState } from 'react';

interface WebkitFullscreenVideoElement extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
}

interface UseFullscreenOptions {
  containerElement: HTMLElement | null;
  videoElement?: HTMLVideoElement | null;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

interface FullscreenResult {
  success: boolean;
  error?: Error;
}

interface UseFullscreenReturn {
  isFullscreen: boolean;
  requestFullscreen: () => Promise<FullscreenResult>;
  exitFullscreen: () => Promise<FullscreenResult>;
  toggleFullscreen: () => void;
}

/**
 * Hook for fullscreen management.
 * Supports standard Fullscreen API, webkit prefixed API, and
 * iOS Safari video-element fullscreen (webkitEnterFullscreen).
 */
export function useFullscreen(
  options: UseFullscreenOptions
): UseFullscreenReturn {
  const { containerElement, videoElement, onFullscreenChange } = options;
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for standard/desktop fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const newIsFullscreen =
        !!document.fullscreenElement ||
        !!(document as unknown as { webkitFullscreenElement?: Element })
          .webkitFullscreenElement;
      setIsFullscreen(newIsFullscreen);
      onFullscreenChange?.(newIsFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange
      );
    };
  }, [onFullscreenChange]);

  // Listen for iOS Safari video-element fullscreen events
  useEffect(() => {
    const video = videoElement as WebkitFullscreenVideoElement | null;
    if (!video) return;

    const handleBegin = () => {
      setIsFullscreen(true);
      onFullscreenChange?.(true);
    };
    const handleEnd = () => {
      setIsFullscreen(false);
      onFullscreenChange?.(false);
    };

    video.addEventListener('webkitbeginfullscreen', handleBegin);
    video.addEventListener('webkitendfullscreen', handleEnd);

    return () => {
      video.removeEventListener('webkitbeginfullscreen', handleBegin);
      video.removeEventListener('webkitendfullscreen', handleEnd);
    };
  }, [videoElement, onFullscreenChange]);

  const requestFullscreen = useCallback(async (): Promise<FullscreenResult> => {
    if (!containerElement) {
      return {
        success: false,
        error: new Error('Container element not available'),
      };
    }

    try {
      // Standard Fullscreen API (Chrome, Firefox, desktop Safari)
      if (containerElement.requestFullscreen) {
        await containerElement.requestFullscreen();
        return { success: true };
      }

      // Webkit-prefixed Fullscreen API (older desktop Safari)
      if (
        (
          containerElement as unknown as {
            webkitRequestFullscreen?: () => Promise<void>;
          }
        ).webkitRequestFullscreen
      ) {
        await (
          containerElement as unknown as {
            webkitRequestFullscreen: () => Promise<void>;
          }
        ).webkitRequestFullscreen();
        return { success: true };
      }

      // iOS Safari: fall back to video-element fullscreen
      const video = videoElement as WebkitFullscreenVideoElement | null;
      if (video?.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
        return { success: true };
      }

      return {
        success: false,
        error: new Error('Fullscreen API not supported'),
      };
    } catch (error) {
      // Container fullscreen failed — try iOS video fallback
      const video = videoElement as WebkitFullscreenVideoElement | null;
      if (video?.webkitEnterFullscreen) {
        try {
          video.webkitEnterFullscreen();
          return { success: true };
        } catch (fallbackError) {
          const err =
            fallbackError instanceof Error
              ? fallbackError
              : new Error('iOS video fullscreen failed');
          return { success: false, error: err };
        }
      }

      const fullscreenError =
        error instanceof Error
          ? error
          : new Error('Failed to enter fullscreen');
      return { success: false, error: fullscreenError };
    }
  }, [containerElement, videoElement]);

  const exitFullscreen = useCallback(async (): Promise<FullscreenResult> => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return { success: true };
      }
      if (
        (document as unknown as { webkitExitFullscreen?: () => Promise<void> })
          .webkitExitFullscreen
      ) {
        await (
          document as unknown as { webkitExitFullscreen: () => Promise<void> }
        ).webkitExitFullscreen();
        return { success: true };
      }

      // iOS Safari: exit video-element fullscreen
      const video = videoElement as WebkitFullscreenVideoElement | null;
      if (video?.webkitExitFullscreen) {
        video.webkitExitFullscreen();
        return { success: true };
      }

      return {
        success: false,
        error: new Error('Fullscreen API not supported'),
      };
    } catch (error) {
      const fullscreenError =
        error instanceof Error ? error : new Error('Failed to exit fullscreen');
      return { success: false, error: fullscreenError };
    }
  }, [videoElement]);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      requestFullscreen();
    }
  }, [isFullscreen, requestFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    requestFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
