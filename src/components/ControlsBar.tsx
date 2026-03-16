import type { ReactNode } from 'react';
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
import { PlayButton } from './controls/PlayButton';
import { QualitySelector } from './controls/QualitySelector';
import { TimeDisplay, type TimeDisplayFormat } from './controls/TimeDisplay';
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
  frameRate?: number;
  timeDisplayFormat?: TimeDisplayFormat;
  onTimeDisplayFormatChange?: (format: TimeDisplayFormat) => void;

  // Video quality (HLS levels + originalUrl)
  hlsLevels?: HlsLevelInfo[];
  currentHlsLevel?: number;
  qualityLevel?: QualityLevel;
  hasOriginal?: boolean;
  isPlayingOriginal?: boolean;

  // Video ambient light
  isAmbientLight?: boolean;

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
  frameRate = 30,
  timeDisplayFormat = 'elapsed-total',
  onTimeDisplayFormatChange,
  hlsLevels = [],
  currentHlsLevel = -1,
  qualityLevel,
  hasOriginal = false,
  isPlayingOriginal = false,
  isAmbientLight = false,
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
            {features.timeDisplay && (
              <TimeDisplay
                currentTime={currentTime}
                duration={duration}
                frameRate={frameRate}
                format={timeDisplayFormat}
                onFormatChange={onTimeDisplayFormatChange ?? (() => {})}
                showFrameFormat={mediaMode === 'video'}
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
          </>
        );
      case 'audio':
        return (
          features.volume && (
            <VolumeControl
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={onVolumeChange ?? (() => {})}
              onMuteToggle={onMuteToggle ?? (() => {})}
              t={t}
            />
          )
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

  return (
    <div className="drop-player-controls flex items-center justify-between mt-1">
      <div className="flex items-center gap-1">
        {renderLeftControls()}
        {controlsStart}
      </div>

      <div className="flex items-center gap-1">
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
  );
}
