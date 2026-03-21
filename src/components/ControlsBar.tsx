import { type ReactNode, useRef } from 'react';
import type {
  HlsLevelInfo,
  MediaMode,
  PlayerFeatures,
  QualityLevel,
  TimeDisplayFormat,
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
import { SeekStepButtons } from './controls/SeekStepButtons';
import { SourceNavigation } from './controls/SourceNavigation';
import { TimeDisplay } from './controls/TimeDisplay';
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
  frameRate?: number;
  filmGauge?: number;
  bpm?: number;
  timeSignature?: string;
  timeDisplayFormat?: TimeDisplayFormat;
  timeDisplayFormats?: TimeDisplayFormat[];
  onTimeDisplayFormatChange?: (format: TimeDisplayFormat) => void;

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

  // Seek step
  seekStep?: number;
  onSeekBackward?: () => void;
  onSeekForward?: () => void;

  // Source navigation
  activeSourceIndex?: number;
  sourceCount?: number;
  onPrevSource?: () => void;
  onNextSource?: () => void;

  // Page navigation (PDF)
  currentPage?: number;
  totalPages?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;

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
  filmGauge = 16,
  bpm = 120,
  timeSignature = '4/4',
  timeDisplayFormat = 'elapsed-total',
  timeDisplayFormats,
  onTimeDisplayFormatChange,
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
  seekStep = 10,
  onSeekBackward,
  onSeekForward,
  activeSourceIndex = 0,
  sourceCount = 1,
  onPrevSource,
  onNextSource,
  currentPage: _currentPage,
  totalPages: _totalPages,
  onPrevPage: _onPrevPage,
  onNextPage: _onNextPage,
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
            {features.seekStepButtons && onSeekBackward && onSeekForward && (
              <SeekStepButtons
                seekStep={seekStep}
                onSeekBackward={onSeekBackward}
                onSeekForward={onSeekForward}
                t={t}
              />
            )}
            {features.sourceNavigation &&
              sourceCount > 1 &&
              onPrevSource &&
              onNextSource && (
                <SourceNavigation
                  activeIndex={activeSourceIndex}
                  sourceCount={sourceCount}
                  onPrev={onPrevSource}
                  onNext={onNextSource}
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
              <div className="drop-player-responsive-hide">
                <TimeDisplay
                  currentTime={currentTime}
                  duration={duration}
                  frameRate={frameRate}
                  filmGauge={filmGauge}
                  bpm={bpm}
                  timeSignature={timeSignature}
                  format={timeDisplayFormat}
                  formats={timeDisplayFormats ?? ['elapsed-total', 'remaining']}
                  onFormatChange={onTimeDisplayFormatChange ?? (() => {})}
                  t={t}
                />
              </div>
            )}
          </>
        );
      case 'image':
      case 'pdf':
        return (
          <>
            {features.sourceNavigation &&
              sourceCount > 1 &&
              onPrevSource &&
              onNextSource && (
                <SourceNavigation
                  activeIndex={activeSourceIndex}
                  sourceCount={sourceCount}
                  onPrev={onPrevSource}
                  onNext={onNextSource}
                  t={t}
                />
              )}
            {features.zoom && (
              <ZoomControls
                zoom={zoom}
                minZoom={minZoom}
                maxZoom={maxZoom}
                onZoomIn={onZoomIn ?? (() => {})}
                onZoomOut={onZoomOut ?? (() => {})}
                onResetZoom={onResetZoom ?? (() => {})}
                t={t}
              />
            )}
          </>
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
