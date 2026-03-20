# drop-player

**A comprehensive, universal, open-source React media player powering [drop.mov](https://drop.mov).**

動画（HLS / プログレッシブ）、音声、画像、PDFに対応。
ひとつのコンポーネントで、ソースURLからメディア種別を自動判定します。

## インストール

```bash
npm i drop-player lucide-react
```

**必須 peer dependencies:** `react` >=18, `react-dom` >=18, `lucide-react` >=0.300

**オプション**（必要な場合のみ）:

| パッケージ | 用途 |
|---------|------|
| `hls.js` >=1.4 | HLS動画 (`.m3u8`) |
| `waveform-data` >=4.5 | 音声波形表示 |

## クイックスタート

```tsx
import { Player } from 'drop-player';
import 'drop-player/styles.css';

function App() {
  return (
    <div style={{ width: 640, height: 360 }}>
      <Player sources="https://example.com/video.mp4" />
    </div>
  );
}
```

スタイルシートは必須です — `drop-player` プレフィックスのクラスとCSS変数が定義されています。

## コンポーネント

| エクスポート | 用途 |
|--------|--------|
| `Player` | 汎用 — URLからモードを自動判定 |
| `VideoPlayer` | 動画 |
| `AudioPlayer` | 音声 |
| `ImageViewer` | 画像 |
| `PdfViewer` | PDF |

`VideoPlayer` や `AudioPlayer` などは可読性のためのエイリアスです。すべて同じ `PlayerProps` / `PlayerRef` を共有し、メディアモードはソースURLから自動判定されます。種別が混在する場合や不明な場合は `Player` を使ってください。

<!-- interactive:demo -->

## 対応メディア

| モード | フォーマット |
|------|---------|
| 動画 | HLS (`.m3u8`), MP4, WebM |
| 音声 | MP3, WAV, Ogg, AAC, FLAC, M4A, WebM, Opus |
| 画像 | JPEG, PNG, GIF, WebP, AVIF, SVG |
| PDF | ブラウザ標準のPDF表示 |

ブラウザ専用のランタイムです。SSRフレームワーク（Next.js, Remix, Astro 等）での import は安全で、サーバー上では何も描画せず、クライアントで有効化されます。

## ソース

```tsx
// 文字列 — 拡張子からタイプを推定
<VideoPlayer sources="https://example.com/video.mp4" />

// オブジェクト — HLSとオリジナル画質のフォールバック
<VideoPlayer sources={{ url: 'stream.m3u8', originalUrl: 'original.mp4' }} />

// 配列 — ソースセレクターを表示
<VideoPlayer sources={[
  { url: 'stream.m3u8', label: 'HLS' },
  { url: 'original.mp4', label: 'Original' },
]} />

// 明示的なMIMEタイプ — URLに拡張子がない場合に便利（例: CDN、署名付きURL）
<Player sources={{ url: 'https://cdn.example.com/abc123', mimeType: 'video/mp4' }} />

// null — エラーUIを表示
<VideoPlayer sources={null} />
```

メディア種別はパスの拡張子（`.mp4`, `.m3u8`, `.pdf`, `.jpg`, …）または `mimeType` から判定されます。

## Props

Propsは4つのグループに分かれています:

```tsx
<VideoPlayer
  sources="video.mp4"
  className="rounded-lg"
  crossOrigin="anonymous"
  poster="poster.jpg"

  playback={{ autoPlay: true, volume: 0.8 }}
  ui={{ features: { capture: true }, locale: 'ja' }}
  slots={{ topRightOverlay: <Badge /> }}
  events={{ onPlay: () => log('playing') }}
/>
```

### トップレベル

| Prop | 型 | デフォルト | 説明 |
|------|------|---------|-------------|
| `sources` | `string \| MediaSource \| MediaSource[] \| null` | — | メディアソース |
| `className` | `string` | — | ルートコンテナのCSSクラス |
| `crossOrigin` | `'anonymous' \| 'use-credentials'` | `'anonymous'` | メディア要素のCORS設定 |
| `poster` | `string` | — | ポスター画像（動画用） |
| `storageKey` | `string` | — | localStorageキーのプレフィックス（デフォルト: `drop_player_`、指定時: `<storageKey>_`）。ミュート状態は自動保存されます。 |
| `storage` | `StorageAdapter` | — | 独自のストレージバックエンド（`getItem`, `setItem`, `removeItem` を実装）。デフォルトは localStorage（SSRセーフ）。 |
| `hlsConfig` | `Partial<HlsConfig>` | — | [hls.js の設定](https://github.com/video-dev/hls.js/blob/master/docs/API.md#fine-tuning)を上書き |

### `playback` — `PlayerPlaybackConfig`

| キー | 型 | デフォルト | 説明 |
|-----|------|---------|-------------|
| `autoPlay` | `boolean` | `false` | 即座に再生を開始 |
| `loop` | `boolean` | `false` | ループ再生 |
| `muted` | `boolean` | `false` | ミュート状態で開始 |
| `volume` | `number` | `1` | 初期音量 (0–1) |
| `initialTime` | `number` | `0` | 開始位置（秒） |

### `ui` — `PlayerUiConfig`

| キー | 型 | デフォルト | 説明 |
|-----|------|---------|-------------|
| `showControls` | `boolean` | `true` | 下部コントロールバーを表示 |
| `showTitle` | `boolean` | auto | ソースタイトル/セレクターを表示 |
| `features` | `PlayerFeatures` | `defaultFeatures` | 個別コントロールの切り替え |
| `locale` | `string` | `'en'` | 表示言語（組み込み: `'en'`, `'ja'`） |
| `translations` | `Partial<Translations>` | — | 翻訳の部分上書き。ロケールの組み込み文字列に対して差分を指定 |
| `frameRate` | `number` | `30` | タイムコード表示用のフレームレート |
| `markers` | `Marker[]` | `[]` | シークバーマーカー |

### `slots` — `PlayerSlots`

| スロット | 型 | 配置位置 |
|------|------|----------|
| `controlsStart` | `ReactNode` | コントロールバーの左側 |
| `controlsEnd` | `ReactNode` | コントロールバーの右側（フルスクリーンボタンの前） |
| `seekbarOverlay` | `(state: PlayerState) => ReactNode` | シークバーの上 |
| `topLeftOverlay` | `ReactNode` | 左上隅 |
| `topRightOverlay` | `ReactNode` | 右上隅 |
| `loadingIndicator` | `ReactNode` | 中央（読み込み中） |
| `errorDisplay` | `(error: Error) => ReactNode` | 中央（エラー時） |

### `events` — `PlayerEvents`

| イベント | ペイロード | タイミング |
|-------|---------|------|
| `onStateChange` | `PlayerState` | 状態変更（まとめてスナップショット） |
| `onPlay` | — | 再生開始 |
| `onPause` | — | 一時停止 |
| `onEnded` | — | 再生終了 |
| `onTimeUpdate` | `time` | 再生位置の更新 |
| `onDurationChange` | `duration` | 長さの確定/変更 |
| `onVolumeChange` | `volume, muted` | 音量/ミュート変更 |
| `onPlaybackRateChange` | `rate` | 再生速度変更 |
| `onError` | `Error` | エラー発生 |
| `onLoadedMetadata` | `VideoMetadata` | メタデータ取得 |
| `onLoadStart` | — | 読み込み開始 |
| `onProgress` | `TimeRanges` | バッファリング進行 |
| `onWaiting` | — | データ待ち |
| `onCanPlay` | — | 再生可能 |
| `onPlaying` | — | 実際に再生中 |
| `onSeekStart` | `time` | シーク開始 |
| `onSeeking` | `time` | シーク中 |
| `onSeekEnd` | `time` | シーク完了 |
| `onFullscreenChange` | `boolean` | フルスクリーン切り替え |
| `onFrameCapture` | `FrameCapture` | フレームキャプチャ |
| `onActiveSourceChange` | `index` | アクティブソース変更 |
| `onQualityLevelChange` | `QualityLevel` | 画質レベル変更 |
| `onFallback` | `FallbackEvent` | オリジナルURLへフォールバック |

## Features

`ui.features` で個別のコントロールをON/OFFできます。省略したキーは `defaultFeatures` を引き継ぎます。

2つのプリセットをエクスポートしています:

| エクスポート | 説明 |
|--------|-------------|
| `defaultFeatures` | 主要コントロールON、負荷の高い機能（`ambientLight`, `capture`）はOFF |
| `noFeatures` | すべてOFF — 最小構成のベースに |

```tsx
import { noFeatures } from 'drop-player';

// Default — most controls on
<VideoPlayer sources={url} />

// Add capture to defaults
<VideoPlayer sources={url} ui={{ features: { capture: true } }} />

// Remove loop from defaults
<VideoPlayer sources={url} ui={{ features: { loop: false } }} />

// Build from scratch
<VideoPlayer sources={url} ui={{ features: { ...noFeatures, playButton: true, fullscreen: true } }} />
```

| フラグ | デフォルト | 適用対象 |
|------|---------|------------|
| `playButton` | `true` | 動画, 音声 |
| `loop` | `true` | 動画, 音声 |
| `timeDisplay` | `true` | 動画, 音声 |
| `seekBar` | `true` | 動画, 音声 |
| `volume` | `true` | 動画, 音声 |
| `ambientLight` | `false` | 動画 |
| `capture` | `false` | 動画, 画像 |
| `qualitySelector` | `true` | 動画 (HLS) |
| `fullscreen` | `true` | すべて |
| `zoom` | `true` | 画像, PDF |
| `playbackSpeed` | `true` | 動画, 音声 |
| `pip` | `true` | 動画（ブラウザPiP APIが必要） |
| `keyboardShortcuts` | `true` | 動画, 音声 |

## テーマ

`.drop-player` のCSS変数を上書きできます:

```css
@import 'drop-player/styles.css';

.drop-player {
  --drop-player-primary: #3b82f6;
  --drop-player-success: #22c55e;
  --drop-player-warning: #eab308;
  --drop-player-marker-scene: #eab308;
  --drop-player-marker-custom: #3b82f6;
  --drop-player-border-radius: 8px;
}
```

| 変数 | デフォルト | 説明 |
|----------|---------|-------------|
| `--drop-player-primary` | `#3b82f6` | アクセントカラー（シークバー、アクティブ状態） |
| `--drop-player-success` | `#22c55e` | 成功状態（キャプチャ保存時） |
| `--drop-player-warning` | `#eab308` | 警告状態 |
| `--drop-player-marker-scene` | `#eab308` | シーンマーカーの色 |
| `--drop-player-marker-custom` | `#3b82f6` | カスタムマーカーの色 |
| `--drop-player-border-radius` | `0` | コンテナの角丸 |
| `--drop-player-aspect-ratio` | 可変 | アスペクト比（動画: 16/9, 音声: 32/9, 画像: 4/3, PDF: 1/1.414） |

<!-- interactive:playground -->

## Ref API

`PlayerRef` 経由でメソッドを呼び出せます:

```tsx
const ref = useRef<PlayerRef>(null);

<VideoPlayer ref={ref} sources={url} />

// Later:
ref.current?.play();
ref.current?.seek(30);
```

| メソッド | 戻り値 | 備考 |
|--------|---------|-------|
| `play()` | `Promise<void>` | |
| `pause()` | `void` | |
| `toggle()` | `void` | |
| `seek(time)` | `void` | |
| `seekRelative(delta)` | `void` | |
| `seekToFrame(frame)` | `void` | 動画のみ |
| `getCurrentTime()` | `number` | |
| `getDuration()` | `number` | |
| `getVolume()` | `number` | |
| `isMuted()` | `boolean` | |
| `isPaused()` | `boolean` | |
| `isFullscreen()` | `boolean` | |
| `getPlaybackRate()` | `number` | |
| `setVolume(n)` | `void` | |
| `setMuted(bool)` | `void` | |
| `setPlaybackRate(rate)` | `void` | |
| `captureFrame(opts?)` | `Promise<FrameCapture>` | 動画/画像のみ。音声/PDFではエラーをスロー |
| `requestFullscreen()` | `Promise<void>` | |
| `exitFullscreen()` | `Promise<void>` | |
| `toggleFullscreen()` | `void` | |
| `getVideoElement()` | `HTMLVideoElement \| null` | |
| `getContainerElement()` | `HTMLDivElement \| null` | |

## エラーハンドリング

`events.onError` と `slots.errorDisplay` は `name` で種別を判別できる `Error` を受け取ります:

| `error.name` | 意味 |
|--------------|---------|
| `errorNoSources` | `sources`がnullまたは空 |
| `errorAborted` | 再生が中断された |
| `errorNetwork` | ネットワークエラー |
| `errorDecode` | デコード失敗 |
| `errorNotSupported` | フォーマットがサポートされていない |
| `errorUnknown` | 不明なエラー |

組み込みUIは `ui.locale` に従ってエラーメッセージをローカライズします。独自の表示にするには `slots.errorDisplay` を使ってください。

## 翻訳

組み込みロケール: `'en'` と `'ja'`。`ui.locale` で切り替えます。

ロケールの追加や文字列の部分上書きには `ui.translations` を使います:

```tsx
<VideoPlayer
  sources="video.mp4"
  ui={{
    locale: 'en',
    translations: {
      play: 'Reproducir',
      pause: 'Pausar',
      mute: 'Silenciar',
      unmute: 'Activar sonido',
      fullscreen: 'Pantalla completa',
      exitFullscreen: 'Salir de pantalla completa',
    },
  }}
/>
```

ベースロケールの文字列に対して差分だけ指定すればOKです。

## カスタムストレージ

プレーヤーの設定（ミュート状態など）はデフォルトで `localStorage` に保存されます。`storageKey` でキーのプレフィックスを変えたり、`storage` でバックエンド自体を差し替えられます。

```tsx
// Custom namespace
<VideoPlayer sources="video.mp4" storageKey="my_app" />
// Keys stored as: my_app_muted, my_app_volume, etc.

// Custom backend (e.g. Supabase)
const supabaseStorage = {
  getItem: (key: string) => {
    // Read from Supabase cache or return null
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value);
    supabase.from('preferences').upsert({ key, value });
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
    supabase.from('preferences').delete().eq('key', key);
  },
};

<VideoPlayer sources="video.mp4" storage={supabaseStorage} />
```

`StorageAdapter` は `getItem`・`setItem`・`removeItem` の3メソッドを実装します。戻り値は同期的に返す必要があるため、リモートバックエンドの場合はローカルキャッシュ経由で非同期に同期してください。

## ユーティリティ

プレーヤー外でも使えるヘルパー関数:

```tsx
import { formatTime, formatTimecode, secondsToFrames, parseFrameRate } from 'drop-player';

formatTime(125);            // "02:05"
formatTime(3661);           // "01:01:01"

formatTimecode(125.5, 30);  // "00:02:05:15"
formatTimecode(125.5, '30000/1001'); // "00:02:05:14" (29.97fps)

secondsToFrames(10, 24);   // 240
parseFrameRate('30000/1001'); // 29.97...
```

| 関数 | シグネチャ | 説明 |
|----------|-----------|-------------|
| `formatTime` | `(seconds?) => string` | `MM:SS`または`HH:MM:SS`形式にフォーマット |
| `formatTimecode` | `(seconds?, frameRate?) => string` | SMPTEタイムコード`HH:MM:SS:FF`形式にフォーマット |
| `secondsToFrames` | `(seconds?, frameRate?) => number` | 秒をフレーム番号に変換 |
| `parseFrameRate` | `(frameRate?) => number` | フレームレート文字列（例: `"30000/1001"`）を数値にパース |

## ライセンス

MIT
