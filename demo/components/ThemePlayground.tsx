import type {
  DirectionalToggle,
  Marker,
  PlayerFeatures,
  PlayerPlaybackConfig,
  PlayerUiConfig,
  TimeDisplayFormat,
} from 'drop-player';
import { VideoPlayer } from 'drop-player';
import { useCallback, useState } from 'react';
import { MEDIA } from '../data/media';

const MARKER_TYPES = ['circle', 'line', 'square'] as const;
type MarkerType = (typeof MARKER_TYPES)[number];

interface PlaygroundMarker {
  id: number;
  time: number;
  type: MarkerType;
  color: string;
  snap: boolean;
}

const DEFAULT_MARKERS: PlaygroundMarker[] = [
  { id: 1, time: 3, type: 'circle', color: '#d4a20a', snap: true },
  { id: 2, time: 8, type: 'line', color: '#e0513f', snap: false },
  { id: 3, time: 15, type: 'square', color: '#3dba5e', snap: true },
];

const THEME_VARS = [
  { key: '--drop-player-blue', label: 'Blue', default: '#4b8bf5' },
  { key: '--drop-player-yellow', label: 'Yellow', default: '#d4a20a' },
  { key: '--drop-player-green', label: 'Green', default: '#3dba5e' },
  { key: '--drop-player-red', label: 'Red', default: '#e0513f' },
  { key: '--drop-player-muted', label: 'Muted', default: '#787880' },
  {
    key: '--drop-player-border-radius',
    label: 'Border Radius',
    default: '0px',
    type: 'range' as const,
  },
];

interface FeatureToggle {
  key: keyof PlayerFeatures;
  label: string;
  default: boolean;
}

const FEATURE_TOGGLES: FeatureToggle[] = [
  { key: 'playButton', label: 'playButton', default: true },
  { key: 'loop', label: 'loop', default: true },
  { key: 'seekBar', label: 'seekBar', default: true },
  { key: 'timeDisplay', label: 'timeDisplay', default: true },
  { key: 'volume', label: 'volume', default: true },
  { key: 'playbackSpeed', label: 'playbackSpeed', default: true },
  { key: 'saveCapture', label: 'saveCapture', default: false },
  { key: 'copyCapture', label: 'copyCapture', default: false },
  { key: 'qualitySelector', label: 'qualitySelector', default: true },
  { key: 'pip', label: 'pip', default: true },
  { key: 'keyboardShortcuts', label: 'keyboardShortcuts', default: true },
  { key: 'fullscreen', label: 'fullscreen', default: true },
];

interface DirectionalState {
  backward: boolean;
  forward: boolean;
}

function toDirectionalToggle(s: DirectionalState): DirectionalToggle {
  if (s.backward && s.forward) return true;
  if (!s.backward && !s.forward) return false;
  return { backward: s.backward, forward: s.forward };
}

const LOCALE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
];

interface TimeFormatOption {
  value: TimeDisplayFormat;
  label: string;
  defaultOn: boolean;
}

const TIME_FORMAT_OPTIONS: TimeFormatOption[] = [
  { value: 'elapsed-total', label: 'Elapsed / Total', defaultOn: true },
  { value: 'remaining', label: 'Remaining', defaultOn: true },
  { value: 'timecode', label: 'Timecode', defaultOn: true },
  { value: 'frames', label: 'Frames', defaultOn: false },
  { value: 'seconds-frames', label: 'Seconds+Frames', defaultOn: false },
  { value: 'feet-frames', label: 'Feet+Frames', defaultOn: false },
  { value: 'bars-beats', label: 'Bars:Beats', defaultOn: false },
];

export function ThemePlayground() {
  const [vars, setVars] = useState<Record<string, string>>(
    Object.fromEntries(THEME_VARS.map((v) => [v.key, v.default]))
  );

  const [features, setFeatures] = useState<Record<string, boolean>>(
    Object.fromEntries(FEATURE_TOGGLES.map((f) => [f.key, f.default]))
  );

  const [seekStepButtons, setSeekStepButtons] = useState<DirectionalState>({
    backward: false,
    forward: false,
  });
  const [sourceNavigation, setSourceNavigation] = useState<DirectionalState>({
    backward: true,
    forward: true,
  });

  const [showControls, setShowControls] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [showStatusOverlay, setShowStatusOverlay] = useState(false);
  const [locale, setLocale] = useState('en');

  // Time display format state
  const [enabledFormats, setEnabledFormats] = useState<
    Record<TimeDisplayFormat, boolean>
  >(
    Object.fromEntries(
      TIME_FORMAT_OPTIONS.map((f) => [f.value, f.defaultOn])
    ) as Record<TimeDisplayFormat, boolean>
  );
  const [seekStep, setSeekStep] = useState(10);
  const [markersEnabled, setMarkersEnabled] = useState(true);
  const [pgMarkers, setPgMarkers] =
    useState<PlaygroundMarker[]>(DEFAULT_MARKERS);
  const [nextId, setNextId] = useState(DEFAULT_MARKERS.length + 1);

  const addMarker = useCallback(() => {
    setPgMarkers((prev) => [
      ...prev,
      { id: nextId, time: 5, type: 'circle', color: '#d4a20a', snap: false },
    ]);
    setNextId((n) => n + 1);
  }, [nextId]);

  const removeMarker = useCallback((id: number) => {
    setPgMarkers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateMarker = useCallback(
    (id: number, patch: Partial<PlaygroundMarker>) => {
      setPgMarkers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
      );
    },
    []
  );

  const markers: Marker[] | undefined =
    markersEnabled && pgMarkers.length > 0
      ? pgMarkers.map((m) => ({
          time: m.time,
          type: m.type,
          color: m.color,
          snap: m.snap,
        }))
      : undefined;
  const [frameRate, setFrameRate] = useState(30);
  const [filmGauge, setFilmGauge] = useState(16);
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState('4/4');

  const timeDisplayFormats = TIME_FORMAT_OPTIONS.filter(
    (f) => enabledFormats[f.value]
  ).map((f) => f.value);

  const style = Object.fromEntries(
    Object.entries(vars).map(([k, v]) => [k, v])
  ) as React.CSSProperties;

  const playback: PlayerPlaybackConfig = {
    seekStep,
  };

  const ui: PlayerUiConfig = {
    showControls,
    showTitle,
    showStatusOverlay,
    locale,
    features: {
      ...features,
      seekStepButtons: toDirectionalToggle(seekStepButtons),
      sourceNavigation: toDirectionalToggle(sourceNavigation),
    } as PlayerFeatures,
    timeDisplayFormats:
      timeDisplayFormats.length > 0 ? timeDisplayFormats : undefined,
    frameRate,
    filmGauge,
    bpm,
    timeSignature,
    markers,
  };

  const needsFrameRate =
    enabledFormats.timecode ||
    enabledFormats.frames ||
    enabledFormats['seconds-frames'] ||
    enabledFormats['feet-frames'];

  return (
    <div className="space-y-6">
      <h2
        id="playground"
        className="text-2xl font-bold text-zinc-100 mb-6 pb-2 border-b border-zinc-800 scroll-mt-6"
      >
        Playground
      </h2>
      {/* CSS Variables */}
      <div>
        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          CSS Variables
        </h4>
        <div className="flex flex-wrap items-center gap-4">
          {THEME_VARS.map((v) => (
            // biome-ignore lint/a11y/noLabelWithoutControl: input is nested
            <label key={v.key} className="space-y-1.5">
              <span className="block text-xs text-zinc-400">{v.label}</span>
              {v.type === 'range' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="16"
                    value={Number.parseInt(vars[v.key], 10) || 0}
                    onChange={(e) =>
                      setVars({ ...vars, [v.key]: `${e.target.value}px` })
                    }
                    className="flex-1"
                  />
                  <span className="text-xs text-zinc-500 w-8">
                    {vars[v.key]}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={vars[v.key]}
                    onChange={(e) =>
                      setVars({ ...vars, [v.key]: e.target.value })
                    }
                    className="w-8 h-8 rounded border border-zinc-700 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-zinc-500">
                    {vars[v.key]}
                  </span>
                </div>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Playback Options */}
      <div>
        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Playback Options
        </h4>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <span>seekStep</span>
            <input
              type="number"
              min="1"
              max="60"
              value={seekStep}
              onChange={(e) =>
                setSeekStep(Math.max(1, Number(e.target.value) || 10))
              }
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-300 w-16"
            />
            <span className="text-xs text-zinc-600">sec</span>
          </label>
        </div>
      </div>

      {/* UI Options */}
      <div>
        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          UI Options
        </h4>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showControls}
              onChange={(e) => setShowControls(e.target.checked)}
              className="rounded border-zinc-700"
            />
            showControls
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showTitle}
              onChange={(e) => setShowTitle(e.target.checked)}
              className="rounded border-zinc-700"
            />
            showTitle
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showStatusOverlay}
              onChange={(e) => setShowStatusOverlay(e.target.checked)}
              className="rounded border-zinc-700"
            />
            showStatusOverlay
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <span>locale</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-300"
            >
              {LOCALE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Features */}
      <div>
        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Features
        </h4>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {/* Directional toggles */}
          {(
            [
              {
                label: 'seekStepButtons',
                state: seekStepButtons,
                setter: setSeekStepButtons,
              },
              {
                label: 'sourceNavigation',
                state: sourceNavigation,
                setter: setSourceNavigation,
              },
            ] as const
          ).map(({ label, state, setter }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-sm text-zinc-400"
            >
              <span
                className={
                  state.backward || state.forward
                    ? 'text-zinc-400'
                    : 'text-zinc-600'
                }
              >
                {label}
              </span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.backward}
                  onChange={(e) =>
                    setter({ ...state, backward: e.target.checked })
                  }
                  className="rounded border-zinc-700"
                />
                <span className="text-xs text-zinc-500">←</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.forward}
                  onChange={(e) =>
                    setter({ ...state, forward: e.target.checked })
                  }
                  className="rounded border-zinc-700"
                />
                <span className="text-xs text-zinc-500">→</span>
              </label>
            </div>
          ))}
          {/* Simple boolean toggles */}
          {FEATURE_TOGGLES.map((f) => (
            <label
              key={f.key}
              className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={features[f.key]}
                onChange={(e) =>
                  setFeatures({ ...features, [f.key]: e.target.checked })
                }
                className="rounded border-zinc-700"
              />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      {/* Time Display Formats */}
      <div>
        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Time Display Formats
        </h4>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {TIME_FORMAT_OPTIONS.map((f) => (
            <label
              key={f.value}
              className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={enabledFormats[f.value]}
                onChange={(e) =>
                  setEnabledFormats({
                    ...enabledFormats,
                    [f.value]: e.target.checked,
                  })
                }
                className="rounded border-zinc-700"
              />
              {f.label}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
          {needsFrameRate && (
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <span>frameRate</span>
              <input
                type="number"
                min="1"
                max="120"
                value={frameRate}
                onChange={(e) =>
                  setFrameRate(Math.max(1, Number(e.target.value) || 30))
                }
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-300 w-16"
              />
            </label>
          )}
          {enabledFormats['feet-frames'] && (
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <span>filmGauge</span>
              <input
                type="number"
                min="1"
                value={filmGauge}
                onChange={(e) =>
                  setFilmGauge(Math.max(1, Number(e.target.value) || 16))
                }
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-300 w-16"
              />
              <span className="text-xs text-zinc-600">fpf</span>
            </label>
          )}
          {enabledFormats['bars-beats'] && (
            <>
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <span>bpm</span>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={bpm}
                  onChange={(e) =>
                    setBpm(Math.max(1, Number(e.target.value) || 120))
                  }
                  className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-300 w-16"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <span>timeSignature</span>
                <select
                  value={timeSignature}
                  onChange={(e) => setTimeSignature(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-300"
                >
                  <option value="4/4">4/4</option>
                  <option value="3/4">3/4</option>
                  <option value="6/8">6/8</option>
                  <option value="2/4">2/4</option>
                  <option value="5/4">5/4</option>
                  <option value="7/8">7/8</option>
                </select>
              </label>
            </>
          )}
        </div>
      </div>

      {/* Markers */}
      <div>
        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Markers
        </h4>
        <div className="flex items-center gap-4 mb-3">
          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={markersEnabled}
              onChange={(e) => setMarkersEnabled(e.target.checked)}
              className="rounded border-zinc-700"
            />
            Enable markers
          </label>
          <button
            type="button"
            onClick={addMarker}
            disabled={!markersEnabled}
            className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            + Add
          </button>
        </div>
        {markersEnabled && pgMarkers.length > 0 && (
          <div className="space-y-2">
            {pgMarkers.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center gap-3 text-sm text-zinc-400"
              >
                <label className="flex items-center gap-1.5">
                  <span className="text-xs text-zinc-500">time</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={m.time}
                    onChange={(e) =>
                      updateMarker(m.id, {
                        time: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-300 w-16"
                  />
                </label>
                <label className="flex items-center gap-1.5">
                  <span className="text-xs text-zinc-500">type</span>
                  <select
                    value={m.type}
                    onChange={(e) =>
                      updateMarker(m.id, {
                        type: e.target.value as MarkerType,
                      })
                    }
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-300"
                  >
                    {MARKER_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1.5">
                  <span className="text-xs text-zinc-500">color</span>
                  <input
                    type="color"
                    value={m.color}
                    onChange={(e) =>
                      updateMarker(m.id, { color: e.target.value })
                    }
                    className="w-6 h-6 rounded border border-zinc-700 cursor-pointer bg-transparent"
                  />
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={m.snap}
                    onChange={(e) =>
                      updateMarker(m.id, { snap: e.target.checked })
                    }
                    className="rounded border-zinc-700"
                  />
                  <span className="text-xs text-zinc-500">snap</span>
                </label>
                <button
                  type="button"
                  onClick={() => removeMarker(m.id)}
                  className="text-xs text-zinc-600 hover:text-red-400 transition-colors ml-auto"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div style={style}>
        <VideoPlayer
          sources={MEDIA.video}
          poster={MEDIA.videoPoster}
          playback={playback}
          ui={ui}
        />
      </div>
    </div>
  );
}
