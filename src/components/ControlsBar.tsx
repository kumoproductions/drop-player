import { type ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { useElementWidths } from '../hooks/useElementWidths';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type {
  HlsLevelInfo,
  MediaMode,
  PlayerFeatures,
  QualityLevel,
  TimeDisplayFormat,
  TranslationKey,
} from '../types';
import { computeVisibleKeys } from '../utils/computeVisibleKeys';
import { AmbientLightButton } from './controls/AmbientLightButton';
import { CopyCaptureButton } from './controls/CopyCaptureButton';
import { FullscreenButton } from './controls/FullscreenButton';
import { LoopButton } from './controls/LoopButton';
import { OverflowMenu } from './controls/OverflowMenu';
import { PageNavigation } from './controls/PageNavigation';
import { PipButton } from './controls/PipButton';
import { PlayButton } from './controls/PlayButton';
import { PlaybackSpeedSelector } from './controls/PlaybackSpeedSelector';
import { QualitySelector } from './controls/QualitySelector';
import { SaveCaptureButton } from './controls/SaveCaptureButton';
import { SeekStepButtons } from './controls/SeekStepButtons';
import { SourceNavigation } from './controls/SourceNavigation';
import { TimeDisplay } from './controls/TimeDisplay';
import { TooltipContainerContext } from './controls/Tooltip';
import { VolumeControl } from './controls/VolumeControl';
import { ZoomControls } from './controls/ZoomControls';

// Fallback width estimates (px) used before the first measurement.
const F_BTN = 36;
const F_SEEK_STEP = 76;
const F_SOURCE_NAV = 112;
const F_PAGE_NAV = 112;
const F_ZOOM = 164;
const F_TIME_DISPLAY = 120;
const F_VOLUME_SLIDER = 96;

const GAP = 4;

interface OverflowEntry {
  key: string;
  element: ReactNode;
  width: number;
}

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

  // TimeDisplay inline state callback
  onTimeDisplayInline?: (inline: boolean) => void;
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
  currentPage = 1,
  totalPages = 0,
  onPrevPage,
  onNextPage,
  controlsStart,
  controlsEnd,
  onTimeDisplayInline,
}: ControlsBarProps) {
  const controlsRef = useRef<HTMLDivElement>(null);
  const { refFor, widths: measured } = useElementWidths();
  const barWidth = measured.bar ?? 0;

  const barRef = useCallback(
    (el: HTMLDivElement | null) => {
      (controlsRef as React.MutableRefObject<HTMLDivElement | null>).current =
        el;
      refFor('bar')(el);
    },
    [refFor]
  );

  const isVideoOrAudio = mediaMode === 'video' || mediaMode === 'audio';
  const isImageOrPdf = mediaMode === 'image' || mediaMode === 'pdf';
  const showVolumeSlider = useMediaQuery('(min-width: 640px)');

  // Measured width + gap, with fallback before first measurement
  const w = useCallback(
    (key: string, fallback: number) => (measured[key] ?? fallback) + GAP,
    [measured]
  );

  // ── Control elements (null when not applicable to current mode) ─

  const seekStepEl =
    isVideoOrAudio &&
    features.seekStepButtons &&
    onSeekBackward &&
    onSeekForward ? (
      <SeekStepButtons
        seekStep={seekStep}
        onSeekBackward={onSeekBackward}
        onSeekForward={onSeekForward}
        t={t}
      />
    ) : null;

  const sourceNavEl =
    features.sourceNavigation &&
    sourceCount > 1 &&
    onPrevSource &&
    onNextSource ? (
      <SourceNavigation
        activeIndex={activeSourceIndex}
        sourceCount={sourceCount}
        onPrev={onPrevSource}
        onNext={onNextSource}
        t={t}
      />
    ) : null;

  const pageNavEl =
    mediaMode === 'pdf' && totalPages >= 2 && onPrevPage && onNextPage ? (
      <PageNavigation
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={onPrevPage}
        onNext={onNextPage}
        t={t}
      />
    ) : null;

  const zoomEl =
    isImageOrPdf &&
    features.zoom &&
    (mediaMode === 'image' || totalPages > 0) ? (
      <ZoomControls
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        onZoomIn={onZoomIn ?? (() => {})}
        onZoomOut={onZoomOut ?? (() => {})}
        onResetZoom={onResetZoom ?? (() => {})}
        t={t}
      />
    ) : null;

  const loopEl =
    isVideoOrAudio && features.loop ? (
      <LoopButton isLoop={isLoop} onToggle={onLoopToggle ?? (() => {})} t={t} />
    ) : null;

  const timeDisplayEl =
    isVideoOrAudio && features.timeDisplay ? (
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
    ) : null;

  const speedEl =
    isVideoOrAudio && features.playbackSpeed ? (
      <PlaybackSpeedSelector
        playbackRate={playbackRate}
        onPlaybackRateChange={onPlaybackRateChange ?? (() => {})}
        t={t}
      />
    ) : null;

  const ambientEl =
    mediaMode === 'video' && features.ambientLight ? (
      <AmbientLightButton
        isEnabled={isAmbientLight}
        onToggle={onAmbientLightToggle ?? (() => {})}
        t={t}
      />
    ) : null;

  const hasCaptureMode = mediaMode === 'video' || mediaMode === 'image';

  const saveCaptureEl =
    hasCaptureMode && features.saveCapture ? (
      <SaveCaptureButton
        onAction={onSaveCapture ?? (() => Promise.resolve())}
        t={t}
      />
    ) : null;

  const copyCaptureEl =
    hasCaptureMode && features.copyCapture ? (
      <CopyCaptureButton
        onAction={onCopyCapture ?? (() => Promise.resolve())}
        t={t}
      />
    ) : null;

  const qualityEl =
    mediaMode === 'video' && features.qualitySelector ? (
      <QualitySelector
        hlsLevels={hlsLevels}
        currentHlsLevel={currentHlsLevel}
        qualityLevel={qualityLevel}
        hasOriginal={hasOriginal}
        isPlayingOriginal={isPlayingOriginal}
        onQualityChange={onQualityChange ?? (() => {})}
        t={t}
      />
    ) : null;

  const pipEl =
    mediaMode === 'video' && features.pip && isPipSupported ? (
      <PipButton isPip={isPip} onToggle={onPipToggle ?? (() => {})} t={t} />
    ) : null;

  const volumeEl =
    isVideoOrAudio && features.volume ? (
      <VolumeControl
        volume={volume}
        isMuted={isMuted}
        showSlider={false}
        onVolumeChange={onVolumeChange ?? (() => {})}
        onMuteToggle={onMuteToggle ?? (() => {})}
        t={t}
      />
    ) : null;

  const volumeSliderEl =
    isVideoOrAudio && features.volume && showVolumeSlider ? (
      <input
        ref={refFor('volumeSlider') as React.RefCallback<HTMLInputElement>}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={isMuted ? 0 : volume}
        onChange={(e) =>
          (onVolumeChange ?? (() => {}))(parseFloat(e.target.value))
        }
        className="drop-player-slider drop-player-volume-slider"
        aria-label={t('volume')}
      />
    ) : null;

  // ── Priority-based overflow ────────────────────────────────────
  // Single priority list for all modes. Controls that don't apply
  // to the current mode are null and excluded automatically.
  // Highest priority (hidden last) → lowest (hidden first).

  const overflowable: OverflowEntry[] = useMemo(() => {
    const entries: OverflowEntry[] = [];
    const push = (key: string, el: ReactNode, fallback: number) => {
      if (el) entries.push({ key, element: el, width: w(key, fallback) });
    };
    // — High priority —
    // Volume button + slider are a unit: when the button overflows, the slider hides too.
    if (volumeEl) {
      const sliderW = showVolumeSlider
        ? (measured.volumeSlider ?? F_VOLUME_SLIDER) + GAP
        : 0;
      entries.push({
        key: 'volume',
        element: volumeEl,
        width: w('volume', F_BTN) + sliderW,
      });
    }
    push('zoom', zoomEl, F_ZOOM);
    push('seekStep', seekStepEl, F_SEEK_STEP);
    push('sourceNav', sourceNavEl, F_SOURCE_NAV);
    push('pageNav', pageNavEl, F_PAGE_NAV);
    push('loop', loopEl, F_BTN);
    // — Medium priority —
    push('speed', speedEl, F_BTN);
    push('quality', qualityEl, F_BTN);
    push('saveCapture', saveCaptureEl, F_BTN);
    push('copyCapture', copyCaptureEl, F_BTN);
    // — Low priority —
    push('ambient', ambientEl, F_BTN);
    push('pip', pipEl, F_BTN);
    // — Lowest priority (first to move to seekbar chip) —
    push('timeDisplay', timeDisplayEl, F_TIME_DISPLAY);
    return entries;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    volumeEl,
    showVolumeSlider,
    measured.volumeSlider,
    zoomEl,
    seekStepEl,
    sourceNavEl,
    pageNavEl,
    loopEl,
    speedEl,
    qualityEl,
    saveCaptureEl,
    copyCaptureEl,
    ambientEl,
    pipEl,
    timeDisplayEl,
    w,
  ]);

  const fixedWidth = useMemo(() => {
    let fw = GAP * 2;
    if (isVideoOrAudio && features.playButton) fw += F_BTN + GAP;
    if (features.fullscreen) fw += F_BTN + GAP;
    return fw;
  }, [isVideoOrAudio, features.playButton, features.fullscreen]);

  const visibleKeys = useMemo(
    () => computeVisibleKeys({ barWidth, fixedWidth, overflowable }),
    [barWidth, fixedWidth, overflowable]
  );

  // TimeDisplay goes to seekbar chip when overflowed, not the overflow panel.
  const overflowItems = overflowable.filter(
    (c) => !visibleKeys.has(c.key) && c.key !== 'timeDisplay'
  );
  const isVisible = (key: string) => visibleKeys.has(key);
  const showInlineTimeDisplay = isVisible('timeDisplay');

  // Notify parent so it can show/hide the seekbar startSlot
  useEffect(() => {
    onTimeDisplayInline?.(showInlineTimeDisplay);
  }, [showInlineTimeDisplay, onTimeDisplayInline]);

  // ── Helpers ────────────────────────────────────────────────────

  const item = (key: string, el: ReactNode) => (
    <div ref={refFor(key)} className="drop-player-controls-item">
      {el}
    </div>
  );

  // ── Unified render ─────────────────────────────────────────────

  return (
    <TooltipContainerContext.Provider value={controlsRef}>
      <div ref={barRef} className="drop-player-controls">
        {/* ── Left group ── */}
        <div className="drop-player-controls-group">
          {isVideoOrAudio && features.playButton && (
            <PlayButton
              isPlaying={isPlaying}
              onToggle={onPlayToggle ?? (() => {})}
              t={t}
            />
          )}
          {isVisible('seekStep') && item('seekStep', seekStepEl)}
          {isVisible('sourceNav') && item('sourceNav', sourceNavEl)}
          {isVisible('pageNav') && item('pageNav', pageNavEl)}
          {isVisible('zoom') && item('zoom', zoomEl)}
          {isVisible('loop') && item('loop', loopEl)}
          {showInlineTimeDisplay &&
            timeDisplayEl &&
            item('timeDisplay', timeDisplayEl)}
          {controlsStart}
        </div>

        {/* ── Right group ── */}
        <div className="drop-player-controls-group">
          {isVisible('volume') && item('volume', volumeEl)}
          {isVisible('volume') && volumeSliderEl}
          {isVisible('speed') && item('speed', speedEl)}
          {isVisible('ambient') && item('ambient', ambientEl)}
          {isVisible('saveCapture') && item('saveCapture', saveCaptureEl)}
          {isVisible('copyCapture') && item('copyCapture', copyCaptureEl)}
          {isVisible('quality') && item('quality', qualityEl)}
          {isVisible('pip') && item('pip', pipEl)}
          {controlsEnd}
          {overflowItems.length > 0 && (
            <OverflowMenu t={t}>
              {overflowItems.map((c) => (
                <div key={c.key} className="drop-player-controls-item">
                  {c.element}
                </div>
              ))}
            </OverflowMenu>
          )}
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
