import { type ReactNode, useRef } from 'react';
import type {
  HlsLevelInfo,
  MediaMode,
  PlayerFeatures,
  QualityLevel,
  TranslationKey,
} from '../types';
import { AmbientLightButton } from './controls/AmbientLightButton';
import { CaptureButtons } from './controls/CaptureButtons';
import { FullscreenButton } from './controls/FullscreenButton';
import { LoopButton } from './controls/LoopButton';
import { PipButton } from './controls/PipButton';
import { PlayButton } from './controls/PlayButton';
import { PlaybackSpeedSelector } from './controls/PlaybackSpeedSelector';
import { QualitySelector } from './controls/QualitySelector';
import { TooltipContainerContext } from './controls/Tooltip';
import { VolumeControl } from './controls/VolumeControl';
import { ZoomControls } from './controls/ZoomControls';

interface ControlsBarProps {
  features: Required<PlayerFeatures>;
  mediaMode: MediaMode;

  // Video/Audio playback state
  isPlaying?: boolean;
  isLoop?: boolean;
  currentTime?: number;
  duration?: number;
  volume?: number;
  isMuted?: boolean;

  // Playback speed
  playbackRate?: number;
  onPlaybackRateChange?: (rate: number) => void;

  // Video quality (HLS levels + originalUrl)
  hlsLevels?: HlsLevelInfo[];
  currentHlsLevel?: number;
  qualityLevel?: QualityLevel;
  hasOriginal?: boolean;
  isPlayingOriginal?: boolean;

  // Video ambient light
  isAmbientLight?: boolean;

  // PIP
  isPip?: boolean;
  isPipSupported?: boolean;
  onPipToggle?: () => void;

  // Video callbacks
  onPlayToggle?: () => void;
  onLoopToggle?: () => void;
  onVolumeChange?: (volume: number) => void;
  onMuteToggle?: () => void;
  onQualityChange?: (level: number | 'auto' | 'original') => void;
  onAmbientLightToggle?: () => void;
  onSaveCapture?: () => Promise<void>;
  onCopyCapture?: () => Promise<void>;

  // Image state
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;

  // Image callbacks
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;

  // Common
  isFullscreen: boolean;
  onFullscreenToggle: () => void;

  // i18n
  t: (key: TranslationKey) => string;

  // Slots
  controlsStart?: ReactNode;
  controlsEnd?: ReactNode;
}

export function ControlsBar({
  features,
  mediaMode,
  isPlaying = false,
  isLoop = false,
  currentTime = 0,
  duration = 0,
  volume = 1,
  isMuted = false,
  playbackRate = 1,
  onPlaybackRateChange,
  hlsLevels = [],
  currentHlsLevel = -1,
  qualityLevel,
  hasOriginal = false,
  isPlayingOriginal = false,
  isAmbientLight = false,
  isPip = false,
  isPipSupported = false,
  onPipToggle,
  onPlayToggle,
  onLoopToggle,
  onVolumeChange,
  onMuteToggle,
  onQualityChange,
  onAmbientLightToggle,
  onSaveCapture,
  onCopyCapture,
  zoom = 1,
  minZoom = 1,
  maxZoom = 5,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isFullscreen,
  onFullscreenToggle,
  t,
  controlsStart,
  controlsEnd,
}: ControlsBarProps) {
  const renderLeftControls = () => {
    switch (mediaMode) {
      case 'video':
      case 'audio':
        return (
          <>
            {features.playButton && (
              <PlayButton
                isPlaying={isPlaying}
                onToggle={onPlayToggle ?? (() => {})}
                t={t}
              />
            )}
            {features.loop && (
              <LoopButton
                isLoop={isLoop}
                onToggle={onLoopToggle ?? (() => {})}
                t={t}
              />
            )}
          </>
        );
      case 'image':
      case 'pdf':
        return (
          features.zoom && (
            <ZoomControls
              zoom={zoom}
              minZoom={minZoom}
              maxZoom={maxZoom}
              onZoomIn={onZoomIn ?? (() => {})}
              onZoomOut={onZoomOut ?? (() => {})}
              onResetZoom={onResetZoom ?? (() => {})}
              t={t}
            />
          )
        );
    }
  };

  const renderRightControls = () => {
    switch (mediaMode) {
      case 'video':
        return (
          <>
            {features.volume && (
              <VolumeControl
                volume={volume}
                isMuted={isMuted}
                onVolumeChange={onVolumeChange ?? (() => {})}
                onMuteToggle={onMuteToggle ?? (() => {})}
                t={t}
              />
            )}
            {features.playbackSpeed && (
              <PlaybackSpeedSelector
                playbackRate={playbackRate}
                onPlaybackRateChange={onPlaybackRateChange ?? (() => {})}
                t={t}
              />
            )}
            {features.ambientLight && (
              <AmbientLightButton
                isEnabled={isAmbientLight}
                onToggle={onAmbientLightToggle ?? (() => {})}
                t={t}
              />
            )}
            {features.capture && (
              <CaptureButtons
                onSave={onSaveCapture ?? (() => Promise.resolve())}
                onCopy={onCopyCapture ?? (() => Promise.resolve())}
                t={t}
              />
            )}
            {features.qualitySelector && (
              <QualitySelector
                hlsLevels={hlsLevels}
                currentHlsLevel={currentHlsLevel}
                qualityLevel={qualityLevel}
                hasOriginal={hasOriginal}
                isPlayingOriginal={isPlayingOriginal}
                onQualityChange={onQualityChange ?? (() => {})}
                t={t}
              />
            )}
            {features.pip && isPipSupported && (
              <PipButton
                isPip={isPip}
                onToggle={onPipToggle ?? (() => {})}
                t={t}
              />
            )}
          </>
        );
      case 'audio':
        return (
          <>
            {features.volume && (
              <VolumeControl
                volume={volume}
                isMuted={isMuted}
                onVolumeChange={onVolumeChange ?? (() => {})}
                onMuteToggle={onMuteToggle ?? (() => {})}
                t={t}
              />
            )}
            {features.playbackSpeed && (
              <PlaybackSpeedSelector
                playbackRate={playbackRate}
                onPlaybackRateChange={onPlaybackRateChange ?? (() => {})}
                t={t}
              />
            )}
          </>
        );
      case 'image':
        return (
          features.capture && (
            <CaptureButtons
              onSave={onSaveCapture ?? (() => Promise.resolve())}
              onCopy={onCopyCapture ?? (() => Promise.resolve())}
              t={t}
            />
          )
        );
      case 'pdf':
        return null;
    }
  };

  const controlsRef = useRef<HTMLDivElement>(null);

  return (
    <TooltipContainerContext.Provider value={controlsRef}>
      <div ref={controlsRef} className="drop-player-controls">
        <div className="drop-player-controls-group">
          {renderLeftControls()}
          {controlsStart}
        </div>

        <div className="drop-player-controls-group">
          {renderRightControls()}
          {controlsEnd}
          {features.fullscreen && (
            <FullscreenButton
              isFullscreen={isFullscreen}
              onToggle={onFullscreenToggle}
              t={t}
            />
          )}
        </div>
      </div>
    </TooltipContainerContext.Provider>
  );
}
