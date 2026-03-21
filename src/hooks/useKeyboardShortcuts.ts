import { useCallback } from 'react';

interface UseKeyboardShortcutsOptions {
  /** Video or audio element (shared API: play, pause, currentTime, volume, muted) */
  mediaElement: HTMLMediaElement | null;
  containerElement: HTMLElement | null;
  /** Seconds per "frame" when using modifier key (e.g. 1/30 for video; 1 for audio) */
  frameRate: number;
  /** Seconds to skip when pressing arrow left/right. Default: 1 */
  seekStep?: number;
  onVolumeChange?: (volume: number) => void;
  onMuteToggle?: () => void;
  toggleFullscreen: () => void;
  onPlayError?: (error: unknown) => void;
}

/**
 * Hook for keyboard shortcuts (video and audio player).
 * Space: play/pause, f: fullscreen, arrows: seek/volume, m: mute.
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const {
    mediaElement,
    containerElement,
    frameRate,
    seekStep = 10,
    onVolumeChange,
    onMuteToggle,
    toggleFullscreen,
    onPlayError,
  } = options;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (!mediaElement || !containerElement) return;

      const target = e.target as HTMLElement;

      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (
        (e.key === ' ' ||
          e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight') &&
        target.closest(
          'button,[role="button"],a,[role="link"],input,textarea,select,[role="slider"]'
        )
      ) {
        return;
      }

      if (frameRate <= 0 || !Number.isFinite(frameRate)) {
        throw new RangeError(
          `frameRate must be a positive finite number, got: ${frameRate}`
        );
      }

      const frameStep = 1 / frameRate;

      switch (e.key) {
        case ' ': {
          e.preventDefault();
          if (mediaElement.paused) {
            mediaElement.play().catch((error) => {
              onPlayError?.(error);
            });
          } else {
            mediaElement.pause();
          }
          break;
        }
        case 'f':
        case 'F': {
          e.preventDefault();
          toggleFullscreen();
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          const stepLeft =
            e.ctrlKey || e.metaKey || e.altKey ? frameStep : seekStep;
          const newTimeLeft = Math.max(0, mediaElement.currentTime - stepLeft);
          mediaElement.currentTime = newTimeLeft;
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          const stepRight =
            e.ctrlKey || e.metaKey || e.altKey ? frameStep : seekStep;
          const newTimeRight = Math.min(
            mediaElement.duration || 0,
            mediaElement.currentTime + stepRight
          );
          mediaElement.currentTime = newTimeRight;
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const newVolumeUp = Math.min(1, mediaElement.volume + 0.05);
          mediaElement.volume = newVolumeUp;
          onVolumeChange?.(newVolumeUp);
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          const newVolumeDown = Math.max(0, mediaElement.volume - 0.05);
          mediaElement.volume = newVolumeDown;
          onVolumeChange?.(newVolumeDown);
          break;
        }
        case 'm':
        case 'M': {
          e.preventDefault();
          onMuteToggle?.();
          break;
        }
      }
    },
    [
      mediaElement,
      containerElement,
      frameRate,
      seekStep,
      onVolumeChange,
      onMuteToggle,
      toggleFullscreen,
      onPlayError,
    ]
  );

  return { handleKeyDown };
}
