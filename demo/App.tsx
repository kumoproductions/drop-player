import { AlertCircle, Check, Copy } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Player } from '../src/components/Player';
import { defaultFeatures, noFeatures } from '../src/features';
import type {
  MediaSource,
  PlayerFeatures,
  PlayerRef,
  PlayerState,
} from '../src/types';

type DemoTab =
  | 'simple'
  | 'hls-original'
  | 'multi-video'
  | 'multi-image'
  | 'audio'
  | 'pdf'
  | 'error';

type ErrorScenario = 'null' | '404';
type Locale = 'en' | 'ja';

const SAMPLE_BASE = 'https://assets.drop.mov/player-samples';

const DEMO_SOURCES: Record<
  Exclude<DemoTab, 'error'>,
  MediaSource[] | MediaSource | string
> = {
  simple: `${SAMPLE_BASE}/14835614_3840_2160_24fps.mp4`,

  'hls-original': {
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    originalUrl: `${SAMPLE_BASE}/14835614_3840_2160_24fps.mp4`,
    label: '4K 24fps',
  },

  'multi-video': [
    {
      url: `${SAMPLE_BASE}/14835614_3840_2160_24fps.mp4`,
      label: '4K 24fps',
    },
  ],

  'multi-image': [
    {
      url: `${SAMPLE_BASE}/declan-sun-JFAZu10J3Kk-unsplash.jpg`,
      label: 'Declan Sun',
    },
    {
      url: `${SAMPLE_BASE}/ethan-teng-km7EbYvkegE-unsplash.jpg`,
      label: 'Ethan Teng',
    },
    {
      url: `${SAMPLE_BASE}/nir-himi-di2M7MAunVg-unsplash.jpg`,
      label: 'Nir Himi',
    },
    {
      url: `${SAMPLE_BASE}/seele-an-iRJH2lSvo_E-unsplash.jpg`,
      label: 'Seele An',
    },
  ],

  audio: {
    url: `${SAMPLE_BASE}/starostin-comedy-cartoon-funny-background-music-492540.mp3`,
  },

  pdf: {
    url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
    label: 'Sample PDF',
  },
};

const TAB_LABELS: Record<DemoTab, string> = {
  simple: 'Video',
  'hls-original': 'HLS + Original',
  'multi-video': 'Multi Source',
  'multi-image': 'Gallery',
  audio: 'Audio',
  pdf: 'PDF',
  error: 'Error',
};

const TAB_DESCRIPTIONS: Record<DemoTab, string> = {
  simple: 'Single MP4 URL — source type inferred from extension',
  'hls-original': 'HLS adaptive streaming with original quality fallback',
  'multi-video': 'Multiple video sources with source selector',
  'multi-image': 'Image gallery with zoom and pan',
  audio: 'Audio playback with waveform visualization',
  pdf: 'PDF viewer with zoom controls',
  error: 'Error handling and edge cases',
};

const FEATURE_LABELS: Record<keyof Required<PlayerFeatures>, string> = {
  playButton: 'Play Button',
  loop: 'Loop',
  timeDisplay: 'Time Display',
  seekBar: 'Seek Bar',
  volume: 'Volume',
  ambientLight: 'Ambient Light',
  capture: 'Capture',
  qualitySelector: 'Quality Selector',
  fullscreen: 'Fullscreen',
  zoom: 'Zoom',
  playbackSpeed: 'Playback Speed',
  pip: 'Picture in Picture',
  keyboardShortcuts: 'Keyboard Shortcuts',
};

const FEATURE_KEYS = Object.keys(defaultFeatures) as (keyof PlayerFeatures)[];

const ERROR_404_URL = 'https://example.com/this-video-does-not-exist-404.mp4';

const HAS_PLAYBACK = new Set<DemoTab>([
  'simple',
  'hls-original',
  'multi-video',
  'audio',
]);

const DEMO_TABS: DemoTab[] = [
  'simple',
  'hls-original',
  'multi-video',
  'multi-image',
  'audio',
  'pdf',
  'error',
];

function formatSeconds(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const sectionClass = 'rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-4';
const sectionTitleClass =
  'text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3';
const btnClass =
  'px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 text-xs font-mono hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer';
const smallBtnClass =
  'px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';

export function App() {
  const [activeTab, setActiveTab] = useState<DemoTab>('simple');
  const [locale, setLocale] = useState<Locale>('en');
  const [features, setFeatures] = useState<Required<PlayerFeatures>>({
    ...defaultFeatures,
  });
  const [showControls, setShowControls] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [errorScenario, setErrorScenario] = useState<ErrorScenario>('null');
  const [lastError, setLastError] = useState<Error | null>(null);
  const [copied, setCopied] = useState(false);
  const playerRef = useRef<PlayerRef>(null);

  const [playerState, setPlayerState] = useState<PlayerState | null>(null);

  const hasPlayback = HAS_PLAYBACK.has(activeTab);
  const errorSources = errorScenario === 'null' ? null : ERROR_404_URL;

  const handleTabChange = useCallback((tab: DemoTab) => {
    setActiveTab(tab);
    setLastError(null);
    setPlayerState(null);
  }, []);

  const handleErrorScenarioChange = useCallback((s: ErrorScenario) => {
    setErrorScenario(s);
    setLastError(null);
  }, []);

  const handleToggle = useCallback(() => playerRef.current?.toggle(), []);
  const handleSeekBack = useCallback(
    () => playerRef.current?.seekRelative(-10),
    []
  );
  const handleSeekFwd = useCallback(
    () => playerRef.current?.seekRelative(10),
    []
  );
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      playerRef.current?.setVolume(Number(e.target.value));
    },
    []
  );
  const handleMuteToggle = useCallback(() => {
    const p = playerRef.current;
    if (p) p.setMuted(!p.isMuted());
  }, []);
  const handleFullscreen = useCallback(
    () => playerRef.current?.toggleFullscreen(),
    []
  );

  const handleFeatureToggle = useCallback((key: keyof PlayerFeatures) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleCopyInstall = useCallback(() => {
    navigator.clipboard.writeText('npm i drop-player').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const allFeaturesOn = FEATURE_KEYS.every((k) => features[k]);
  const allFeaturesOff = FEATURE_KEYS.every((k) => !features[k]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased">
      {/* Header */}
      <header className="border-b border-zinc-800/60">
        <div className="mx-auto max-w-[1080px] px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[15px] font-semibold tracking-tight m-0">
              drop-player
            </h1>
            <span className="text-[10px] px-1.5 py-px rounded bg-zinc-800 text-zinc-500 font-medium leading-relaxed">
              v1.0.0
            </span>
          </div>
          <div className="flex bg-zinc-800/70 rounded-md p-0.5">
            {(['en', 'ja'] as Locale[]).map((l) => (
              <button
                key={l}
                type="button"
                className={`px-2.5 py-1 text-[11px] font-semibold rounded tracking-wide transition-colors cursor-pointer ${
                  locale === l
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                onClick={() => setLocale(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[1080px] px-6 pt-8 pb-16">
        {/* Tagline + Install */}
        <div className="mb-8">
          <p className="text-sm text-zinc-400 mb-3">
            React media player for video (HLS / progressive), audio, image, and
            PDF.
          </p>
          <button
            type="button"
            onClick={handleCopyInstall}
            className="group flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <code className="text-[13px] text-zinc-300 font-mono">
              npm i drop-player
            </code>
            <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
              {copied ? (
                <Check size={14} className="text-emerald-400" />
              ) : (
                <Copy size={14} />
              )}
            </span>
          </button>
        </div>

        {/* Tabs */}
        <nav className="flex flex-wrap gap-1 mb-1.5">
          {DEMO_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`px-3 py-1.5 rounded-md text-[13px] transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
              onClick={() => handleTabChange(tab)}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </nav>

        {/* Tab description */}
        <p className="text-[12px] text-zinc-600 mb-4">
          {TAB_DESCRIPTIONS[activeTab]}
        </p>

        {/* Error scenario sub-tabs */}
        {activeTab === 'error' && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] text-zinc-500 font-medium">
              Scenario
            </span>
            {(['null', '404'] as ErrorScenario[]).map((s) => (
              <button
                key={s}
                type="button"
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                  errorScenario === s
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
                onClick={() => handleErrorScenarioChange(s)}
              >
                {s === 'null' ? 'sources=null' : '404 URL'}
              </button>
            ))}
          </div>
        )}

        {/* Player */}
        <div
          className={`w-full bg-black ${
            activeTab === 'audio'
              ? 'aspect-video min-h-[120px]'
              : 'aspect-video'
          }`}
        >
          <Player
            ref={playerRef}
            key={
              activeTab === 'error'
                ? `error-${errorScenario}-${locale}`
                : `${activeTab}-${locale}`
            }
            sources={
              activeTab === 'error' ? errorSources : DEMO_SOURCES[activeTab]
            }
            ui={{ locale, features, showControls, showTitle }}
            events={{
              onError: (e: Error) => setLastError(e),
              onStateChange: setPlayerState,
            }}
          />
        </div>

        {/* Config grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left column: UI config + Features */}
          <div className="flex flex-col gap-4">
            {/* UI config */}
            <section className={sectionClass}>
              <h3 className={sectionTitleClass}>ui</h3>
              <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                <label className="flex items-center gap-2 text-[13px] text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showControls}
                    onChange={() => setShowControls((v) => !v)}
                  />
                  showControls
                </label>
                <label className="flex items-center gap-2 text-[13px] text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showTitle}
                    onChange={() => setShowTitle((v) => !v)}
                  />
                  showTitle
                </label>
              </div>
            </section>

            {/* Features */}
            <section className={sectionClass}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  ui.features
                </h3>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={smallBtnClass}
                    disabled={allFeaturesOn}
                    onClick={() => setFeatures({ ...defaultFeatures })}
                  >
                    Default
                  </button>
                  <button
                    type="button"
                    className={smallBtnClass}
                    disabled={allFeaturesOff}
                    onClick={() =>
                      setFeatures({ ...noFeatures } as Required<PlayerFeatures>)
                    }
                  >
                    noFeatures
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {FEATURE_KEYS.map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-[13px] text-zinc-300 cursor-pointer select-none py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={features[key]}
                      onChange={() => handleFeatureToggle(key)}
                    />
                    {FEATURE_LABELS[key]}
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Right column: Ref API + State + Error */}
          <div className="flex flex-col gap-4">
            {/* PlayerRef API */}
            {hasPlayback && (
              <section className={sectionClass}>
                <h3 className={sectionTitleClass}>PlayerRef</h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(
                    [
                      {
                        label: 'play()',
                        fn: () => playerRef.current?.play(),
                      },
                      {
                        label: 'pause()',
                        fn: () => playerRef.current?.pause(),
                      },
                      { label: 'toggle()', fn: handleToggle },
                      { label: 'seekRelative(−10)', fn: handleSeekBack },
                      { label: 'seekRelative(+10)', fn: handleSeekFwd },
                      {
                        label: 'toggleFullscreen()',
                        fn: handleFullscreen,
                      },
                    ] as { label: string; fn: () => void }[]
                  ).map(({ label, fn }) => (
                    <button
                      key={label}
                      type="button"
                      className={btnClass}
                      onClick={fn}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <label className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                    setVolume(
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={playerState?.volume ?? 1}
                      onChange={handleVolumeChange}
                      className="w-20"
                    />
                    )
                  </label>
                  <button
                    type="button"
                    className={btnClass}
                    onClick={handleMuteToggle}
                  >
                    {`setMuted(${playerState?.isMuted ? 'false' : 'true'})`}
                  </button>
                </div>
              </section>
            )}

            {/* onStateChange output */}
            {hasPlayback && playerState && (
              <section className={sectionClass}>
                <h3 className={sectionTitleClass}>events.onStateChange</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-[11px] font-mono tabular-nums">
                  <span className="text-zinc-500">
                    currentTime{' '}
                    <span className="text-zinc-400">
                      {formatSeconds(playerState.currentTime)}
                    </span>
                  </span>
                  <span className="text-zinc-500">
                    duration{' '}
                    <span className="text-zinc-400">
                      {formatSeconds(playerState.duration)}
                    </span>
                  </span>
                  <span className="text-zinc-500">
                    isPlaying{' '}
                    <span className="text-zinc-400">
                      {String(playerState.isPlaying)}
                    </span>
                  </span>
                  <span className="text-zinc-500">
                    isPaused{' '}
                    <span className="text-zinc-400">
                      {String(playerState.isPaused)}
                    </span>
                  </span>
                  <span className="text-zinc-500">
                    volume{' '}
                    <span className="text-zinc-400">
                      {playerState.volume.toFixed(2)}
                    </span>
                  </span>
                  <span className="text-zinc-500">
                    isMuted{' '}
                    <span className="text-zinc-400">
                      {String(playerState.isMuted)}
                    </span>
                  </span>
                  <span className="text-zinc-500">
                    isFullscreen{' '}
                    <span className="text-zinc-400">
                      {String(playerState.isFullscreen)}
                    </span>
                  </span>
                  <span className="text-zinc-500">
                    isEnded{' '}
                    <span className="text-zinc-400">
                      {String(playerState.isEnded)}
                    </span>
                  </span>
                </div>
              </section>
            )}

            {/* Error debug */}
            {activeTab === 'error' && (
              <section className={sectionClass}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-red-400/80">
                    events.onError
                  </h3>
                  {lastError && (
                    <button
                      type="button"
                      className={smallBtnClass}
                      onClick={() => setLastError(null)}
                    >
                      Clear
                    </button>
                  )}
                </div>
                {lastError ? (
                  <div className="flex gap-3 items-start">
                    <AlertCircle
                      size={18}
                      className="shrink-0 text-red-400/80 mt-0.5"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-red-300 mb-1">
                        {lastError.name}
                      </div>
                      <pre className="m-0 text-xs text-red-300/70 whitespace-pre-wrap break-all leading-relaxed">
                        {lastError.message}
                        {lastError.stack ? `\n\n${lastError.stack}` : ''}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <p className="m-0 text-xs text-zinc-600">
                    No error captured yet. Select &quot;404 URL&quot; and wait
                    for load failure.
                  </p>
                )}
              </section>
            )}
          </div>
        </div>

        {/* Source JSON */}
        <section className={`mt-6 ${sectionClass}`}>
          <h3 className={sectionTitleClass}>sources</h3>
          <pre className="m-0 text-xs text-zinc-400 font-mono leading-relaxed overflow-auto">
            {JSON.stringify(
              activeTab === 'error' ? errorSources : DEMO_SOURCES[activeTab],
              null,
              2
            )}
          </pre>
        </section>
      </main>
    </div>
  );
}
